---
name: LockIn
description: The open-source notebook your AI tools write to
colors:
  ink: "#1b2a2f"
  paper: "#ffffff"
  paper-sunk: "#f2f6f4"
  hover: "#e8efec"
  rule: "#d5dfdc"
  rule-input: "#b6c5c1"
  ink-muted: "#5a6b71"
  cloth: "#24453b"
  cloth-ink: "#eef0e8"
  label: "#f7f5ee"
  pen-blue: "#2f5fa0"
  margin-red: "#d2453a"
  stamp-red: "#b4372d"
  ok: "#2e7d4f"
  warn: "#a35a12"
  dark-paper: "#111a1b"
  dark-card: "#141f20"
  dark-ink: "#e2ebe8"
  dark-ink-muted: "#93a3a0"
  dark-rule: "#263335"
  dark-cloth: "#13261f"
  dark-pen-blue: "#7fa8e8"
  dark-margin-red: "#e06a5e"
typography:
  page-title:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(30px, 3.6vw, 40px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.02em"
  note-title:
    fontFamily: "Spectral, Iowan Old Style, Georgia, serif"
    fontSize: "clamp(28px, 3.4vw, 40px)"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.01em"
  reading:
    fontFamily: "Spectral, Iowan Old Style, Georgia, serif"
    fontSize: "18.5px"
    fontWeight: 400
    lineHeight: 1.65
  body:
    fontFamily: "Barlow, Helvetica Neue, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.35
  label:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.16em"
  code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "13.5px"
    lineHeight: 1.6
rounded:
  sm: "2px"
  md: "3px"
  lg: "4px"
spacing:
  row: "9px 10px"
  page-gap: "28px"
  page-pad-lg: "32px 48px 88px 64px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "5px 11px"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "5px 11px"
  ruled-box:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "6px 12px 8px"
  spine:
    backgroundColor: "{colors.cloth}"
    textColor: "{colors.cloth-ink}"
    width: "236px"
  cover-label:
    backgroundColor: "{colors.label}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 12px 11px"
  note-page:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "26px 40px 56px"
  stamp:
    textColor: "{colors.stamp-red}"
    rounded: "{rounded.sm}"
    padding: "1px 6px"
---

# Design System: LockIn

## Overview

**Creative North Star: "The Lab Notebook"**

LockIn looks like a bound engineering notebook. A green cloth spine holds the navigation, with a paper label glued to it that carries the name and the owner. List pages (the contents, a section's notes, the Inbox) sit on grid paper with a red margin rule and ruled header boxes printed in condensed caps. Reading pages are a clean sheet laid over the grid, with nothing behind the text. The ink is blue-black.

The notebook's one idea about AI is that agents record and you witness. A note saved by Claude Code or Codex says who recorded it and carries a red "Awaiting witness" stamp until the user signs it. That flow is part of the identity, not a feature tucked away in a menu.

The same tokens drive light and dark. Dark mode is slate paper with a fainter grid, not a different personality.

**Key characteristics:**
- Chrome is ink and cloth; the only saturated colour is a subject's own, shown as a section tab.
- Two type voices: condensed print caps for anything printed on the form (labels, page titles, counts), and a book serif for anything written (note titles and bodies).
- Square, thin and ruled. Radii of 2–4px, 1px rules, 1.5px ink rules for header boxes.
- Dense lists, generous reading.

## Colors

Restrained: neutrals plus ink, with colour reserved for meaning.

- **Ink** (`#1b2a2f`, dark `#e2ebe8`): text, solid buttons, the 1.5px rules of header boxes.
- **Paper** (`#ffffff`, dark `#111a1b`): page ground. Reading sheets and cards use the card value (`#141f20` in dark).
- **Grid lines**: `rgb(46 125 110 / 0.09)` minor every 20px and `/ 0.17` major every 100px (dark: `rgb(130 200 180 / 0.06)` and `/ 0.11`). Only on list surfaces, never under a note body.
- **Cloth** (`#24453b`, dark `#13261f`) with **cloth ink** (`#eef0e8`): the spine and the phone bar, with a fine woven texture.
- **Label** (`#f7f5ee`): the cover label plate.
- **Pen blue** (`#2f5fa0`, dark `#7fa8e8`): anything live or machine-made: the streaming caret, AI suggestions, the activity heatmap, `--syntax-keyword`.
- **Margin red** (`#d2453a`): the margin rule, focus rings, text selection tint.
- **Stamp red** (`#b4372d`): the "Awaiting witness" stamp and due counts in the spine.
- **Subject colours**: user-chosen. They pass through `.lk-subject`, which sets `--c-eff = color-mix(in oklab, var(--c) 86%, var(--foreground))` so one colour reads on both papers. The picker seeds section-tab inks: `#C25A1C #2E7D4F #2F5FA0 #9B3B6A #6B55A8 #A8841A #0F6B72 #B4372D`.
- shadcn's `--accent` is a neutral hover surface (`#e8efec`), never a brand colour.

Code colours come from `--syntax-*` tokens shared by rendered notes (`.hljs-*`) and the CodeMirror editor.

## Typography

Four families, each with one job.

- **Barlow Condensed**, 600–700: page titles (uppercase, `clamp(30px, 3.6vw, 40px)`), labels (11–12px, uppercase, 0.12–0.16em tracking), tab names, the wordmark. Class `.lk-print` for small printed text.
- **Spectral**: note titles (600, up to 40px), note bodies at reading size (18.5px / 1.65, 68ch measure via `.lk-reading`), list-row titles (16.5–18px), and italic subtitles (`.lk-page-sub`).
- **Barlow**: the interface. Spine and list rows at the `ui` step (15px).
- **JetBrains Mono**: code only. Never used to make something look technical.

Scale: Tailwind's defaults plus `text-2xs` (11px) and `text-ui` (15px). No arbitrary `text-[Npx]` sizes in components.

The landing page (`app/components/landing/landing.module.css`) is the one place the book is printed large, so it has its own display steps on top of the scale:

- **Titles.** The hero title uses `clamp(44px, 6vw, 76px)` and section titles `clamp(32px, 4vw, 48px)`, both in Barlow Condensed caps.
- **Reading text.** The lede is Spectral at 20px. Section subtitles are 19px and example notes 18.5px, rising to 20.5px in the full-screen demo.

Everything smaller follows the ranges above.

## Motion

Short and physical. Things settle (`cubic-bezier(0.16, 1, 0.3, 1)`, 200–520ms) rather than bounce. The single exception is the stamp: it lands with a small overshoot (`cubic-bezier(0.2, 1.4, 0.4, 1)`), the way a rubber stamp is pressed and set. Reduced motion turns every animation off.

## Layout

- The shell is a 236px spine (60px collapsed, remembered in `lockin.sidebar`), then the page, then the Ask dock on the right. Below `md` the spine moves into a sheet behind a cloth bar.
- Pages use `.lk-page`: a grid with a 28px gap, max width 1180px, padding `32px 48px 88px 64px` from `lg` (the left padding keeps content clear of the margin rule at 22px).
- Every page opens with ruled header boxes (`RuledBoxes`) and a printed title with an italic line beneath.
- A section's Notes view is two panes from `lg`: a 272px sticky list, then the note sheet. Phones show one or the other, with "All notes" leading back.

## Elevation & Depth

Mostly flat and ruled. Depth appears only where paper sits on paper:

- `--lk-shadow-sm` (`0 1px 2px`) on the open note sheet and on the selected note in a list.
- `--lk-shadow` (soft, offset 8px blur 20px) for cards that lift: popovers and the Ask drawer.
- The spine has an inset shadow on its right edge, where the cloth curves into the binding.

## Shapes

Corners are 2–4px everywhere; the only round shape is the avatar. Rules carry structure: 1px `--border` between rows, 1.5px ink around header boxes and Today, 2px in the subject's colour under a note's toolbar. Section tabs are 10×14px with the right corners rounded, like a tab cut into the page edge.

## Components

- **Spine** (`app/components/shell/spine.tsx`): cover label, then Home / Inbox / Search / New note, then Sections (one tab chip per subject with its note count), then Plan (Today, Focus with the live timer, Progress), with Ask, paper colour, collapse and account at the foot. Current item: a light wash plus 600 weight.
- **Ruled boxes** (`notebook/ruled-boxes.tsx`): a printed label over a value in the reading serif. 4 cells on desktop, 2×2 on phones.
- **Contents table** (`home/contents.tsx`): entry title and excerpt, section tab, plan count, relative time. Rows link to the note.
- **Note list** (`note/note-list.tsx`): a dashed "New note…" field on top, then rows of title, excerpt and age. The selected row becomes a paper sheet with its title in the subject's ink.
- **Note page** (`note/note-view.tsx`): running head (section · Note, updated time), title (click to rename), provenance line for agent notes, toolbar (Plan link, Edit, Ask this note, Move, Share, Delete), then the body on clean paper.
- **Stamp** (`.lk-stamp`): red condensed caps in a 1.5px red border, rotated −2°.
- **Buttons**: `.lk-btn` is solid ink with printed caps; `.lk-note-bar-btn` is the secondary outline; `.lk-iconbtn` is the 26px ghost for row actions.

## Do's and Don'ts

- **Do** keep grid paper to list surfaces. A note body always sits on clean paper.
- **Do** let colour come from subjects. The chrome is ink, cloth and paper.
- **Do** say who wrote a note when it wasn't the user, and stamp it until witnessed.
- **Don't** use monospace outside code.
- **Don't** add coloured left-border accents to list items or cards; mark the current item with paper and weight instead.
- **Don't** add offset block shadows; this isn't a neobrutalist notebook.
- **Don't** spell the product name in components. Read `BRAND` from `lib/brand.ts` or render `<Wordmark />`.
