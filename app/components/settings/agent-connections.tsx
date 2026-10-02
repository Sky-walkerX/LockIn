"use client";

import { useState } from "react";
import { useMounted } from "@/hooks/useMounted";
import { Check, Copy, KeyRound } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { useAgo } from "@/app/components/clock";
import {
  useConnectedApps,
  useCreateToken,
  useDisconnectApp,
  useRevokeToken,
  useTokens,
  type AgentToken,
  type ConnectedApp,
} from "@/hooks/useTokens";

const SUGGESTED = ["Claude Code", "Codex", "Cursor", "Claude Desktop"];
const SERVER_NAME = BRAND.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const ENV_VAR = `${BRAND.name.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_TOKEN`;

type Client = "claude-code" | "codex" | "cursor";
const CLIENTS: { key: Client; label: string }[] = [
  { key: "claude-code", label: "Claude Code" },
  { key: "codex", label: "Codex" },
  { key: "cursor", label: "Cursor" },
];

// Ready-to-paste setup for each agent. Checked against each tool's docs:
// Claude Code takes the header on the command line; Codex reads the token from
// an environment variable named in config.toml; Cursor takes headers in
// mcp.json.
function snippet(client: Client, url: string, token: string): { where: string; code: string } {
  switch (client) {
    case "claude-code":
      return {
        where: "Run in a terminal:",
        code: `claude mcp add --transport http ${SERVER_NAME} ${url} \\\n  --header "Authorization: Bearer ${token}"`,
      };
    case "codex":
      return {
        where: `Add to ~/.codex/config.toml, and set ${ENV_VAR} in the shell Codex runs from:`,
        code: `[mcp_servers.${SERVER_NAME}]\nurl = "${url}"\nbearer_token_env_var = "${ENV_VAR}"\n\n# in your shell profile\nexport ${ENV_VAR}="${token}"`,
      };
    case "cursor":
      return {
        where: "Add to ~/.cursor/mcp.json:",
        code: JSON.stringify({ mcpServers: { [SERVER_NAME]: { url, headers: { Authorization: `Bearer ${token}` } } } }, null, 2),
      };
  }
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="lk-note-bar-btn"
      onClick={() =>
        navigator.clipboard
          .writeText(value)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          })
          .catch(() => {})
      }
    >
      {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : label}
    </button>
  );
}

function TokenRow({ token }: { token: AgentToken }) {
  const ago = useAgo();
  const revoke = useRevokeToken();
  const [confirming, setConfirming] = useState(false);
  const revoked = !!token.revokedAt;
  return (
    <li className={`lk-agent-row ${revoked ? "opacity-55" : ""}`}>
      <div className="min-w-0">
        <div className="truncate font-semibold">{token.name}</div>
        <div className="text-sm text-muted-foreground">
          <code className="font-code text-xs">{token.preview}</code> · made {ago(token.createdAt)}
          {" · "}
          {revoked ? `revoked ${ago(token.revokedAt!)}` : token.lastUsedAt ? `last used ${ago(token.lastUsedAt)}` : "never used"}
        </div>
      </div>
      {!revoked &&
        (confirming ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => revoke.mutate(token.id)}
              disabled={revoke.isPending}
              className="lk-btn px-3 py-1.5 text-2xs"
              style={{ background: "var(--destructive)", borderColor: "var(--destructive)", color: "#fff" }}
            >
              Revoke
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="text-sm text-muted-foreground hover:text-foreground">
              Keep
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="lk-note-bar-btn">
            Revoke…
          </button>
        ))}
    </li>
  );
}

function AppRow({ app }: { app: ConnectedApp }) {
  const ago = useAgo();
  const disconnect = useDisconnectApp();
  const [confirming, setConfirming] = useState(false);
  return (
    <li className="lk-agent-row">
      <div className="min-w-0">
        <div className="truncate font-semibold">{app.name}</div>
        <div className="text-sm text-muted-foreground">
          connected {ago(app.createdAt)} · {app.lastUsedAt ? `last used ${ago(app.lastUsedAt)}` : "never used"}
        </div>
      </div>
      {confirming ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => disconnect.mutate(app.id)}
            disabled={disconnect.isPending}
            className="lk-btn px-3 py-1.5 text-2xs"
            style={{ background: "var(--destructive)", borderColor: "var(--destructive)", color: "#fff" }}
          >
            Disconnect
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="text-sm text-muted-foreground hover:text-foreground">
            Keep
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className="lk-note-bar-btn">
          Disconnect…
        </button>
      )}
    </li>
  );
}

/** Claude.ai, ChatGPT and other apps that connect by signing in: the URL to
 *  give them, and the ones that have access. */
function SignInApps({ url }: { url: string }) {
  const { data: apps = [] } = useConnectedApps();
  return (
    <div className="grid gap-3 border-t border-border pt-5">
      <span className="lk-sec">Claude.ai, ChatGPT and other apps</span>
      <p className="max-w-[62ch] text-ui text-muted-foreground">
        Apps that support MCP connectors don&apos;t need a token. Add a custom connector with this URL; the app sends you
        here to sign in and allow it.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 overflow-x-auto rounded-sm bg-muted px-2.5 py-1.5 font-code text-xs">{url}</code>
        <CopyButton value={url} label="Copy URL" />
      </div>
      {apps.length > 0 && (
        <ul className="lk-card grid">
          {apps.map((a) => (
            <AppRow key={a.id} app={a} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function AgentConnections() {
  const { data: tokens = [], isLoading } = useTokens();
  const create = useCreateToken();
  const [name, setName] = useState("Claude Code");
  const [fresh, setFresh] = useState<{ name: string; secret: string } | null>(null);
  const [client, setClient] = useState<Client>("claude-code");
  // The endpoint is wherever this app is served from, known only in the browser.
  const mounted = useMounted();
  const url = mounted ? `${window.location.origin}/api/mcp` : "/api/mcp";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    create.mutate(n, {
      onSuccess: (t) => {
        setFresh({ name: t.name, secret: t.secret });
        const match = CLIENTS.find((c) => c.label.toLowerCase() === t.name.toLowerCase());
        if (match) setClient(match.key);
      },
    });
  };

  const setup = fresh ? snippet(client, url, fresh.secret) : null;

  return (
    <div className="grid gap-4">
      <p className="max-w-[62ch] text-ui text-muted-foreground">
        Give an agent a token and it can search your notes and save new ones over MCP. Each agent gets its own, so its
        notes say who recorded them and you can cut one off without touching the rest.
      </p>

      <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
        <label className="grid gap-1">
          <span className="lk-sec">Agent</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            list="agent-names"
            maxLength={40}
            className="h-9 w-56 rounded-sm border border-input bg-card px-2.5 text-ui outline-none focus:border-[var(--lk-ink-strong)]"
          />
          <datalist id="agent-names">
            {SUGGESTED.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
        <button type="submit" disabled={create.isPending || !name.trim()} className="lk-btn flex h-9 items-center gap-2 px-3 text-2xs disabled:opacity-50">
          <KeyRound size={14} /> {create.isPending ? "Creating…" : "Create token"}
        </button>
        {create.isError && <p className="w-full text-sm text-destructive">The token wasn&apos;t created. Try again.</p>}
      </form>

      {fresh && setup && (
        <div className="lk-hero grid gap-3 px-4 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="lk-stamp">Shown once</span>
            <span className="text-ui">
              Token for <b>{fresh.name}</b>. Copy it into the agent now; it can&apos;t be shown again.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto rounded-sm bg-muted px-2.5 py-1.5 font-code text-xs">{fresh.secret}</code>
            <CopyButton value={fresh.secret} label="Copy token" />
          </div>
          <div className="lk-tabs !mt-1" role="tablist" aria-label="Set up">
            {CLIENTS.map((c) => (
              <button
                key={c.key}
                type="button"
                role="tab"
                aria-selected={client === c.key}
                aria-current={client === c.key ? "page" : undefined}
                onClick={() => setClient(c.key)}
                className="lk-tab"
              >
                {c.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{setup.where}</p>
          <pre className="overflow-x-auto rounded-sm border border-border bg-muted px-3 py-2.5 font-code text-xs leading-relaxed">{setup.code}</pre>
          <div className="flex flex-wrap gap-2">
            <CopyButton value={setup.code} label="Copy setup" />
            <button type="button" onClick={() => setFresh(null)} className="text-sm text-muted-foreground hover:text-foreground">
              Done
            </button>
          </div>
        </div>
      )}

      {isLoading ? null : tokens.length === 0 ? (
        <p className="text-sm text-muted-foreground">No agents connected yet.</p>
      ) : (
        <ul className="lk-card grid">
          {tokens.map((t) => (
            <TokenRow key={t.id} token={t} />
          ))}
        </ul>
      )}

      <SignInApps url={url} />
    </div>
  );
}
