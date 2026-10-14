# LockIn for Claude Code

A Claude Code plugin for [LockIn](https://lockin.namankhandelwal.dev), the notebook your AI tools write to.

- **Nothing lost when a session compacts.** Before Claude Code compacts a conversation it summarises it. The plugin files that summary into your notebook as one note per session, which waits for you to witness it like anything else an agent saves. Later compactions in the same session add to that note.
- **`/lockin:handoff`** leaves a baton for the next agent: the goal, where the work stands, what was ruled out, the exact next step, and which notebook pages to read first.
- **`/lockin:pickup [subject or repo]`** takes the open baton and carries on from it. After a compaction, an open baton for the folder you're in is shown to Claude automatically.

Codex, Cursor and any other MCP client can take the same baton: ask them to pick up the LockIn baton, and they call `pickup_handoff`.

## Install

1. Connect LockIn's MCP server to Claude Code under the name `lockin`. In LockIn, open **Settings → Connect your agents**, create a token, and run the Claude Code command it shows. The plugin's hooks call the server by that name.
2. Add the plugin:

   ```bash
   claude plugin marketplace add Sky-walkerX/LockIn
   claude plugin install lockin@lockin
   ```

Self-hosting LockIn? The same steps work: the server you add in step 1 points at your instance.

## What it sends

Only at compaction: Claude Code's summary of the conversation, the session's id, the folder it runs in, and whether the compaction was automatic. The note is private to your notebook and waits for your witness. To stop, run `claude plugin disable lockin`.
