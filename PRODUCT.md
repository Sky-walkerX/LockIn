# Product brief

LockIn is an open-source notebook that your AI tools write to.

You learn things inside Claude, ChatGPT, Codex and Cursor every day, and most of it disappears when the chat closes. LockIn keeps it. Agents save notes into it over MCP, you organise them by subject, and any model you choose can answer questions from them with citations back to the source.

## Who it's for

People who learn and build with AI. Developers come first: they live in agent tools, they lose context between sessions, and they're the ones who find and share open-source projects. CS students and self-taught learners come second. They have the same problem with courses, PDFs and lecture notes, and the revision and exam features already serve them.

## Why someone picks it

Other tools each cover part of this. NotebookLM grounds answers in your sources but is closed, runs only Google's models, and agents can't write to it. Notion has an MCP server but is closed, paid and tied to its own AI. Obsidian's MCP plugins are local-only. Basic Memory is open and MCP-native but is a file and agent tool, not an app you'd want to read your notes in.

LockIn is the combination:

- Open source. Use the hosted version or self-host it with one command.
- Any agent can save and search your notes over MCP.
- Any model can chat over them. Run one free in the browser, point at a local server, or bring your own API key. Keys stay in your browser and never reach our server.
- Answers come from your own notes, PDFs and links, and say where each claim came from.
- Everything is organised by subject, so a note about Rust ownership lives with your other Rust notes, wherever it was written.

## Vocabulary

| Word | Means | Stored as |
|---|---|---|
| Subject | A topic you're learning or working on | `Subject` |
| Note | A titled markdown page inside a subject | `Milestone` (title + `notes`) |
| Inbox | Where unfiled notes land, mostly from agents | A `Subject` with `isInbox` |
| Resource | A link or PDF saved to a subject, with extracted text | `Resource` |
| Plan | Optional tasks, focus time, exam pace and revision for a subject | `Task`, `Subtask`, `TimerSession`, milestone review fields |
| Ask | Chat over your notes (⌘J) | `Conversation`, `ChatMessage` |

The UI says "note", never "milestone". Task words (task, % done, pace) appear only inside Plan.

## Voice

Plain and specific. Say what a thing does: "Saved from Claude Code, 2 minutes ago", not "Seamlessly capture insights". No exclamation marks, no growth-hacking copy. The product talks like a careful engineer who also likes good typography.

## Look

A bound lab notebook. The chrome is a green cloth spine with a white cover label. List pages (contents, sections, the witness queue) sit on grid paper with a red margin rule and ruled header boxes in condensed print caps. Reading pages are clean paper with nothing behind the text. Ink is blue-black. The only saturated colour comes from subjects, shown as section tabs on the page edge.

Agent entries are recorded, then witnessed. A note saved by Claude Code or Codex arrives marked "awaiting witness" until you sign it, so reviewing what an agent saved is part of the flow rather than an afterthought.

Type: Barlow for the interface, Barlow Condensed for printed labels, Spectral for reading, JetBrains Mono for code only. Motion is short and only shows where something came from or went.

## Name

LockIn. Decided 2026-10-02 after a shortlist (Clothbound, Folionote, Spinebook, Witnessbook) was rejected. The name stays in `lib/brand.ts` and `<Wordmark />`, so it's still cheap to change. The "no lock-in" tension is answered by the product itself: open source (AGPL-3.0), self-hostable, and everything exportable.
