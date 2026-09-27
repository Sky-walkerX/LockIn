/**
 * Inline maths follows Pandoc's rule, so a note about prices or shell
 * variables doesn't turn into broken formulas: `$…$` is maths only when the
 * opening `$` isn't followed by a space, the closing `$` isn't preceded by a
 * space, and the closing `$` isn't followed by a digit. Any other `$` is
 * escaped (`\$`) before the markdown parser (remark-math) sees it.
 *
 * Fenced code, inline code and `$$…$$` are left exactly as written.
 */
export function guardDollars(markdown: string): string {
  if (!markdown.includes("$")) return markdown;

  let out = "";
  let i = 0;
  const n = markdown.length;
  const atLineStart = (at: number) => at === 0 || markdown[at - 1] === "\n";

  while (i < n) {
    // Fenced code block: copy through to the closing fence.
    if (atLineStart(i)) {
      const fence = /^[ \t]{0,3}(`{3,}|~{3,})/.exec(markdown.slice(i));
      if (fence) {
        const marker = fence[1];
        const lineEnd = markdown.indexOf("\n", i);
        let end = lineEnd === -1 ? n : lineEnd + 1;
        while (end < n) {
          const next = markdown.indexOf("\n", end);
          const line = markdown.slice(end, next === -1 ? n : next);
          end = next === -1 ? n : next + 1;
          if (new RegExp(`^[ \\t]{0,3}${marker[0] === "`" ? "`" : "~"}{${marker.length},}[ \\t]*$`).test(line)) break;
        }
        out += markdown.slice(i, end);
        i = end;
        continue;
      }
    }

    const ch = markdown[i];

    // Inline code: copy through to the matching run of backticks.
    if (ch === "`") {
      let run = 0;
      while (markdown[i + run] === "`") run++;
      const close = markdown.indexOf("`".repeat(run), i + run);
      const end = close === -1 ? i + run : close + run;
      out += markdown.slice(i, end);
      i = end;
      continue;
    }

    // An escaped character stays escaped.
    if (ch === "\\" && i + 1 < n) {
      out += markdown.slice(i, i + 2);
      i += 2;
      continue;
    }

    if (ch === "$") {
      // A line that is only $$…$$ is display maths, as in Obsidian. remark-math
      // reads one-line $$…$$ as inline, so put the delimiters on lines of their own.
      if (atLineStart(i) || /^[ \t]*$/.test(markdown.slice(markdown.lastIndexOf("\n", i - 1) + 1, i))) {
        const lineEnd = markdown.indexOf("\n", i);
        const line = markdown.slice(i, lineEnd === -1 ? n : lineEnd);
        const display = /^\$\$(.+?)\$\$[ \t]*$/.exec(line);
        if (display) {
          out += `$$\n${display[1].trim()}\n$$`;
          i += line.length;
          continue;
        }
      }
      // $$ display maths: copy through to the closing $$.
      if (markdown[i + 1] === "$") {
        const close = markdown.indexOf("$$", i + 2);
        const end = close === -1 ? i + 2 : close + 2;
        out += markdown.slice(i, end);
        i = end;
        continue;
      }
      const close = closingDollar(markdown, i);
      if (close !== -1) {
        out += markdown.slice(i, close + 1);
        i = close + 1;
      } else {
        out += "\\$";
        i += 1;
      }
      continue;
    }

    out += ch;
    i += 1;
  }
  return out;
}

/** Where the `$` opening at `open` closes under Pandoc's rule, or -1. */
function closingDollar(text: string, open: number): number {
  const first = text[open + 1];
  if (first === undefined || /\s/.test(first)) return -1;
  for (let j = open + 1; j < text.length; j++) {
    const c = text[j];
    if (c === "\\") {
      j++; // skip an escaped character inside the maths
      continue;
    }
    if (c === "\n" && text[j + 1] === "\n") return -1; // maths doesn't span paragraphs
    if (c !== "$") continue;
    const before = text[j - 1];
    const after = text[j + 1];
    if (/\s/.test(before)) return -1;
    if (after !== undefined && /[0-9]/.test(after)) return -1;
    return j;
  }
  return -1;
}
