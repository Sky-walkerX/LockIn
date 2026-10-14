// The Tutorial a new notebook starts with (lib/accounts/tutorial.ts): how to
// write notes here, each piece of syntax shown as typed and then as it reads.

/** What was typed, in a code block, then the same text rendered under it. */
const shown = (markdown: string, caption = "What you type") =>
  `> [!FIG] ${caption}\n> \`\`\`\`markdown\n${markdown
    .split("\n")
    .map((line) => `> ${line}`.trimEnd())
    .join("\n")}\n> \`\`\`\`\n\nWhat it reads as:\n\n${markdown}`;

/** Its section's name. The contents page treats a notebook with only this as new. */
export const TUTORIAL_TITLE = "Tutorial";

export type TutorialNote = { title: string; notes: string };

export const TUTORIAL_NOTES: TutorialNote[] = [
  {
    title: "Start here",
    notes: `This notebook is split into **sections**, one per thing you're learning. Each section holds **notes**, and every note gets the next page number in the notebook, so you can say "p. 14" and find it again.

### Writing a note

- **New note** in the spine, or **New note…** at the top of a section, starts one.
- **Edit** opens a note; **⌘↩** (Ctrl+Enter) saves it and **Esc** leaves without saving.
- **Preview** shows how the note will read before you save it.
- While you type, a grey suggestion may appear from your own words. **Tab** takes it, anything else ignores it.
- **⌘K** searches the whole notebook and runs commands; **⌘J** opens Ask.

### Witnessing

Notes you write here count as yours straight away. A note an agent saves for you waits, stamped *Awaiting witness*, until you read it and press **Witness**.

### This section

The pages after this one each cover one kind of formatting: what to type, then how it reads. Open any of them with **Edit** to see the source. When you're done, delete the section from its menu, or keep it to look things up.`,
  },
  {
    title: "Text",
    notes: `Notes are written in Markdown: plain text with a few marks for structure.

${shown(`## A heading
### A smaller heading

Text can be **bold**, *italic*,
~~struck through~~ or \`code\`.

> A quote, for something someone else said.

---

A line of three dashes draws a rule across the page.`)}

### Footnotes

${shown(`Lambda calculus came before the computer.[^1]

[^1]: Alonzo Church, 1936.`, "A footnote")}`,
  },
  {
    title: "Lists and checklists",
    notes: `Start a line with a dash for a bullet, a number for a step, or a box for something to tick off.

${shown(`- A bullet
- Another, with a list inside it
  - indented by two spaces

1. Numbered steps
2. count themselves

- [ ] A checkbox to tick later
- [x] One that's done`)}

Pressing Enter at the end of a list item starts the next one; Enter on an empty item ends the list.

For work you want to schedule and track, use the section's **Plan** tab instead. It has a few tasks waiting there for you.`,
  },
  {
    title: "Code",
    notes: `Fence code with three backticks and name the language, and it's coloured to match. Every block has a copy button in its corner.

${shown(`\`\`\`python
def mean(xs):
    return sum(xs) / len(xs)
\`\`\``)}

### Pinning output as a figure

A quote whose first line is \`[!FIG]\` and a caption becomes a numbered figure, taped to the page. Use it for the output that mattered, a table or a key formula.

${shown(`> [!FIG] Running it
> \`\`\`text
> >>> mean([2, 4, 9])
> 5.0
> \`\`\``)}`,
  },
  {
    title: "Maths",
    notes: `Maths is written in LaTeX between dollar signs.

${shown(`Inline, like $e^{i\\pi} + 1 = 0$, inside a sentence.

On its own line:

$$
\\int_0^1 x^2 \\, dx = \\frac{1}{3}
$$`)}

\`\\( … \\)\` and \`\\[ … \\]\` work too, which is how many models write it.

### Prices aren't maths

A dollar sign starts maths only when it touches the formula, so a price stays a price: it cost $5, then $10.

For a formula, keep the dollar signs tight against it: no space just inside either one.

${shown(`> [!FIG] Bayes' rule
> $$
> P(A \\mid B) = \\frac{P(B \\mid A)\\,P(A)}{P(B)}
> $$`, "A formula as a figure")}`,
  },
  {
    title: "Tables",
    notes: `A table is rows of cells between pipes, with a line of dashes under the header.

${shown(`| Complexity | Name        | Example        |
| ---------- | ----------- | -------------- |
| $O(1)$     | constant    | array index    |
| $O(\\log n)$ | logarithmic | binary search  |
| $O(n)$     | linear      | one pass       |`)}

The dashes under the first row make it the header. The columns don't have to line up in what you type; the pipes are what count.

A table can be a figure too: quote it under a \`> [!FIG] caption\` line.`,
  },
  {
    title: "Images and links",
    notes: `A link is the words in square brackets and the address in round ones; an image is the same with a \`!\` in front.

${shown(`[CommonMark](https://commonmark.org) opens in a new tab.

![A frame from the LockIn film](/media/lockin-film-poster.jpg)`)}

### Without typing any of it

- **Paste or drop an image** (a screenshot, say) into the editor and it's uploaded and placed for you.
- **Paste a link over selected words** and they become that link.
- **Paste the address of an image** and it's put in as an image.

Click an image in a note to open it full size.`,
  },
  {
    title: "Agents and Ask",
    notes: `### Saving from your coding agent

Connect Claude Code, Codex or any MCP client under **Settings → Agents**. Then ask it to save what you worked out together: it writes a note into the right section, in the same Markdown as these pages, and you witness it when you've read it.

### Asking your notes

**Ask** (⌘J) answers from what's in this notebook and cites the pages it used, like [p. 1]. Click a citation to open that page.

### Search

**⌘K** finds notes by their words, and by meaning once the notebook has indexed them.`,
  },
];

/** Plan tasks for the first page, so the Plan tab isn't empty either. */
export const TUTORIAL_TASKS = ["Write your first note", "Connect an agent", "Ask your notes a question"];
