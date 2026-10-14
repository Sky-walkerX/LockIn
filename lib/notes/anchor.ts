// A note's code anchor: the repo it's about, the commit it was true at, and
// the files it describes. The notebook can't see anyone's code, so it never
// checks an anchor itself. It hands the anchor to the agent reading the note,
// which has the repo open and can run the diff. Pure, so it's tested alone.

export type Anchor = {
  anchorRepo: string | null;
  anchorCommit: string | null;
  /** When that commit was made, as the agent saw it. */
  anchorCommitAt: Date | string | null;
  anchorFiles: string[];
  checkedAt: Date | string | null;
  checkedBy: string | null;
};

export const MAX_ANCHOR_FILES = 20;
export const COMMIT = /^[0-9a-f]{7,40}$/i;

/**
 * One way to write a repo, whatever an agent passes: a remote
 * (git@github.com:Sky-walkerX/LockIn.git, https://github.com/Sky-walkerX/LockIn),
 * "owner/name", or a folder path, which leaves just the folder's name.
 * Lowercase, with no host and no .git. Null for nothing usable.
 */
export function normalizeRepo(input: string | null | undefined): string | null {
  let s = input?.trim();
  if (!s) return null;
  s = s.replace(/\.git\/?$/i, "").replace(/\/+$/, "");
  const scp = s.match(/^[\w.-]+@[\w.-]+:(.+)$/); // git@host:owner/name
  if (scp) s = scp[1];
  else if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) {
    try {
      s = new URL(s).pathname.replace(/^\/+/, "");
    } catch {
      return null;
    }
  } else if (s.startsWith("/") || s.startsWith("~") || /^[a-z]:\\/i.test(s)) {
    s = s.split(/[\\/]/).filter(Boolean).pop() ?? "";
  }
  const parts = s.split("/").filter(Boolean);
  const kept = parts.slice(-2).join("/").toLowerCase();
  return kept || null;
}

/** The repo's own name, without its owner. */
export const repoName = (repo: string) => repo.split("/").pop() ?? repo;

/**
 * Whether two normalised repos are the same. When either has no owner (it
 * came from a folder name), the names alone decide.
 */
export function repoMatches(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes("/") && b.includes("/")) return false;
  return repoName(a) === repoName(b);
}

/** Paths as given, without a leading "./", each once, at most MAX_ANCHOR_FILES. */
export function cleanFiles(files: string[] | undefined): string[] {
  const out: string[] = [];
  for (const f of files ?? []) {
    const p = f.trim().replace(/^\.\//, "");
    if (p && !out.includes(p)) out.push(p);
  }
  return out.slice(0, MAX_ANCHOR_FILES);
}

export const shortCommit = (commit: string) => commit.slice(0, 7);

const day = (d: Date | string) => new Date(d).toISOString().slice(0, 10);

/**
 * A commit date as an agent passes it (`git show -s --format=%cI`, or any
 * date the platform parses). Null for nothing usable, or a date more than a
 * day ahead, which no commit has yet.
 */
export function parseCommitDate(input: string | null | undefined, now = new Date()): Date | null {
  const s = input?.trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime()) || d.getTime() > now.getTime() + 86_400_000) return null;
  return d;
}

/** "@ abc1234, committed 2026-10-03", or as much of it as is known. */
export function commitLabel(anchor: Pick<Anchor, "anchorCommit" | "anchorCommitAt">): string | null {
  if (!anchor.anchorCommit) return null;
  return `@ ${shortCommit(anchor.anchorCommit)}${anchor.anchorCommitAt ? `, committed ${day(anchor.anchorCommitAt)}` : ""}`;
}

/** Whether `a` is anchored at an earlier commit than `b`, by their dates. False when either date is unknown. */
export function isEarlierCommit(
  a: Pick<Anchor, "anchorCommitAt">,
  b: Pick<Anchor, "anchorCommitAt">,
): boolean {
  if (!a.anchorCommitAt || !b.anchorCommitAt) return false;
  return new Date(a.anchorCommitAt).getTime() < new Date(b.anchorCommitAt).getTime();
}
const quote = (path: string) => (/^[\w./@+-]+$/.test(path) ? path : `'${path.replace(/'/g, "'\\''")}'`);

/** The command that shows what changed in the anchored files since the note was true. */
export function diffCommand(anchor: Pick<Anchor, "anchorCommit" | "anchorFiles">): string | null {
  if (!anchor.anchorCommit) return null;
  const files = anchor.anchorFiles.length > 0 ? ` -- ${anchor.anchorFiles.map(quote).join(" ")}` : "";
  return `git diff --stat ${shortCommit(anchor.anchorCommit)}${files}`;
}

/**
 * What an agent reading the note is told about its anchor: where it points,
 * when it was last checked, and how to check it now. Null for a note with no
 * anchor.
 */
export function anchorForAgent(anchor: Anchor, label: (source: string) => string): string | null {
  if (!anchor.anchorRepo && !anchor.anchorCommit) return null;
  const at = anchor.anchorCommit ? ` ${commitLabel(anchor)}` : "";
  const files = anchor.anchorFiles.length > 0 ? `: ${anchor.anchorFiles.join(", ")}` : "";
  const checked = anchor.checkedAt
    ? ` Last checked ${day(anchor.checkedAt)}${anchor.checkedBy ? ` by ${label(anchor.checkedBy)}` : ""}.`
    : "";
  const lines = [`Code: ${anchor.anchorRepo ?? "a repo"}${at}${files}.${checked}`];
  const diff = diffCommand(anchor);
  if (diff) {
    lines.push(
      `If you have this repo open, check it before relying on the note: \`${diff}\`. ` +
        "Nothing changed: confirm_note with your current commit. Changed and the note is now wrong: supersede_note with what's true now. Not sure: flag_stale with why.",
    );
  }
  return lines.join("\n");
}
