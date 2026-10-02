import dns from "node:dns";
import https from "node:https";
import net from "node:net";

/**
 * Fetches JSON from a URL someone else chose (a client's metadata document)
 * without letting it reach this server's own network. Checking the hostname's
 * text isn't enough: "localhost." or any public name can resolve to a private
 * address. So the check runs on the addresses themselves, inside the
 * connection's DNS lookup, which also rules out a name that changes its answer
 * between a check and the connection. No redirects are followed.
 */

function ipv4Parts(ip: string): number[] | null {
  const parts = ip.split(".").map(Number);
  return parts.length === 4 && parts.every((n) => Number.isInteger(n) && n >= 0 && n <= 255) ? parts : null;
}

function isPublicIPv4(ip: string): boolean {
  const p = ipv4Parts(ip);
  if (!p) return false;
  const [a, b] = p;
  if (a === 0 || a === 10 || a === 127) return false; // this network, private, loopback
  if (a === 100 && b >= 64 && b <= 127) return false; // carrier-grade NAT
  if (a === 169 && b === 254) return false; // link-local, cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return false; // private
  if (a === 192 && b === 168) return false; // private
  if (a === 192 && b === 0 && (p[2] === 0 || p[2] === 2)) return false; // IETF, TEST-NET-1
  if (a === 198 && (b === 18 || b === 19)) return false; // benchmarking
  if (a === 198 && b === 51 && p[2] === 100) return false; // TEST-NET-2
  if (a === 203 && b === 0 && p[2] === 113) return false; // TEST-NET-3
  if (a >= 224) return false; // multicast, reserved, broadcast
  return true;
}

/** Whether an IP address is on the public internet. */
export function isPublicAddress(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return isPublicIPv4(ip);
  if (family !== 6) return false;
  const v6 = ip.toLowerCase();
  // An IPv4 address written as IPv6 (::ffff:10.0.0.1) is judged as IPv4.
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPublicIPv4(mapped[1]);
  if (v6 === "::" || v6 === "::1") return false;
  const first = parseInt(v6.split(":")[0] || "0", 16);
  if ((first & 0xfe00) === 0xfc00) return false; // unique local fc00::/7
  if ((first & 0xffc0) === 0xfe80) return false; // link-local fe80::/10
  if ((first & 0xff00) === 0xff00) return false; // multicast
  if (v6.startsWith("64:ff9b:") || v6.startsWith("2001:db8:") || v6.startsWith("::ffff:")) return false;
  return true;
}

const publicLookup: net.LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { all: true }, (err, addresses) => {
    if (err) return callback(err, "", 0);
    const blocked = addresses.find((a) => !isPublicAddress(a.address));
    if (blocked || addresses.length === 0) {
      return callback(Object.assign(new Error(`${hostname} doesn't resolve to a public address`), { code: "EBLOCKED" }), "", 0);
    }
    if (options.all) return (callback as unknown as (e: null, a: dns.LookupAddress[]) => void)(null, addresses);
    callback(null, addresses[0].address, addresses[0].family);
  });
};

/** GET a JSON document over https from a public address, within a time and
 *  size limit. Rejects on anything else. */
export function fetchPublicJson(url: string, { timeoutMs = 5000, maxBytes = 20_000 } = {}): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    if (target.protocol !== "https:") return reject(new Error("https only"));
    const req = https.get(target, { lookup: publicLookup, timeout: timeoutMs, headers: { Accept: "application/json" } }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`status ${res.statusCode}`));
      }
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk: string) => {
        body += chunk;
        if (body.length > maxBytes) req.destroy(new Error("too large"));
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("timeout", () => req.destroy(new Error("timed out")));
    req.on("error", reject);
  });
}
