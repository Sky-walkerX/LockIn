/**
 * Inline maths follows Pandoc's rule, so a note about prices or shell
 * variables doesn't turn into broken formulas: `$…$` is maths only when the
 * opening `$` isn't followed by a space, the closing `$` isn't preceded by a
 * space, and the closing `$` isn't followed by a digit. Any other `$` is
 * escaped (`\$`) before the markdown parser (remark-math) sees it.
 *
 * LaTeX's own delimiters, which models write as often as dollars, become
 * dollars: `\(…\)` inline and `\[…\]` display.
 *
 * Fenced code, inline code and `$$…$$` are left exactly as written.
 */
export function guardDollars(markdown: string): string {
  if (!markdown.includes("$") && !/\\[([]/.test(markdown)) return markdown;

  let out = "";
  let i = 0;
  const n = markdown.length;
  const atLineStart = (at: number) => at === 0 || markdown[at - 1] === "\n";
  // A line's quote markers and indent (`> `, `  `) up to `at`, and whether
  // that's all there is before it.
  const lineStartOf = (at: number) => markdown.lastIndexOf("\n", at - 1) + 1;
  const prefixOf = (at: number) => /^[ \t>]*/.exec(markdown.slice(lineStartOf(at), at))![0];
  const onlyPrefixBefore = (at: number) => /^[ \t>]*$/.test(markdown.slice(lineStartOf(at), at));

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

    // \(…\) and \[…\]: maths in LaTeX's delimiters, within one paragraph.
    if (ch === "\\" && (markdown[i + 1] === "(" || markdown[i + 1] === "[")) {
      const display = markdown[i + 1] === "[";
      const close = markdown.indexOf(display ? "\\]" : "\\)", i + 2);
      const inner = close === -1 ? "" : markdown.slice(i + 2, close).trim();
      if (inner && !/\n[ \t]*\n/.test(inner)) {
        if (!display) out += "$" + inner + "$";
        else {
          // Display maths needs lines of its own, each carrying the line's
          // quote markers or indent so it stays inside a quote or list.
          const q = prefixOf(i);
          const lineEnd = markdown.indexOf("\n", close + 2);
          const more = markdown.slice(close + 2, lineEnd === -1 ? n : lineEnd).trim();
          const lead = onlyPrefixBefore(i) ? `\n${q}` : `\n${q}\n${q}`;
          out += `${lead}$$\n${q}${inner}\n${q}$$\n${q}${more ? `\n${q}` : ""}`;
        }
        i = close + 2;
        continue;
      }
    }

    // An escaped character stays escaped.
    if (ch === "\\" && i + 1 < n) {
      out += markdown.slice(i, i + 2);
      i += 2;
      continue;
    }

    if (ch === "$") {
      // A line that is only $$…$$ (inside a quote too) is display maths, as in
      // Obsidian. remark-math reads one-line $$…$$ as inline, so put the
      // delimiters on lines of their own.
      if (onlyPrefixBefore(i)) {
        const lineEnd = markdown.indexOf("\n", i);
        const line = markdown.slice(i, lineEnd === -1 ? n : lineEnd);
        const display = /^\$\$(.+?)\$\$[ \t]*$/.exec(line);
        if (display) {
          const q = prefixOf(i);
          out += `$$\n${q}${display[1].trim()}\n${q}$$`;
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
