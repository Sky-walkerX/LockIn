# LockIn for Claude Code

A Claude Code plugin for [LockIn](https://lockin.namankhandelwal.dev), the notebook your AI tools write to.

- **Nothing lost when a session compacts.** Before Claude Code compacts a conversation it summarises it. The plugin files that summary into your notebook as one note per session, which waits for you to witness it like anything else an agent saves. Later compactions in the same session add to that note.
- **Or when it ends.** When you exit, `/clear` or switch sessions, the plugin starts a short background run of Claude on Haiku. The run resumes a copy of the session, writes what happened since the last compaction, and adds it to the same note. Your session history isn't changed, and sessions with fewer than two prompts are skipped.
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

At compaction: Claude Code's summary of the conversation, the session's id, the folder it runs in, and whether the compaction was automatic. At the end: the summary the background run wrote, with the same id and folder. The note is private to your notebook and waits for your witness.

The run at the end is one model call on Haiku with the session as its context, so it counts against your Claude usage. A long session costs more. A session too long for Haiku's context isn't captured at the end, though its compactions still are. Set these in your environment to change it:

| Variable | Default | Effect |
| --- | --- | --- |
| `LOCKIN_CAPTURE_ON_EXIT` | `1` | `0` turns off capture at session end |
| `LOCKIN_CAPTURE_MODEL` | `haiku` | The model that writes the summary |
| `LOCKIN_CAPTURE_MIN_PROMPTS` | `2` | Sessions with fewer prompts are skipped |

If a capture at the end doesn't appear, the run's output is in `$TMPDIR/lockin-capture-<session id>.log`. To stop everything, run `claude plugin disable lockin`.
