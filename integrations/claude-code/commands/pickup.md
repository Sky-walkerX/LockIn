---
description: Pick up the baton another agent left in LockIn and carry on
argument-hint: "[subject or repo]"
allowed-tools: ["Bash(git remote get-url origin)", "mcp__lockin__pickup_handoff", "mcp__lockin__get_note"]
---

Carry on from where another agent stopped.

1. If "$ARGUMENTS" names something, call `mcp__lockin__pickup_handoff` with `subject` set to it. Otherwise run `git remote get-url origin` and call it with `repo` set to the result, or with `cwd` set to this folder if that fails.
2. If no baton is open, say so and ask what to work on. Don't pick up an unrelated one.
3. Read the card and the pages it brings. If a page was cut short and you need the rest, use `mcp__lockin__get_note`.
4. Tell the user in two or three lines what you picked up and what you'll do next, then carry on from its Next step. Don't retry anything it lists as ruled out unless something has changed.
