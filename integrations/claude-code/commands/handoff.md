---
description: Leave a baton in LockIn so another agent can carry on this work
argument-hint: "[anything the next agent should know]"
allowed-tools: ["Bash(git remote get-url origin)", "Bash(git rev-parse HEAD)", "Bash(git branch --show-current)", "mcp__lockin__save_handoff"]
---

Hand the work in progress to whoever carries on next: another agent, or a new session after a usage cap.

1. If this folder is a git repo, run `git remote get-url origin`, `git rev-parse HEAD` and `git branch --show-current`. Skip any that fail.
2. Call `mcp__lockin__save_handoff` with:
   - `goal`: what this work is for, in one line.
   - `state`: what's done and what isn't, in two or three sentences.
   - `tried`: approaches you tried and ruled out, each with why. Leave it out if there were none.
   - `next`: the exact next step, specific enough to start on without rereading the conversation.
   - `next_at`: where that step starts, as `path:line`.
   - `pages`: page numbers of LockIn notes the next agent should read first: ones you read or saved this session. Leave it out if there are none.
   - `task_id`: the LockIn plan task this is for, if you've been working from one.
   - `repo`, `commit`, `branch`: from step 1.
   Say the essentials first: long fields are cut short.
3. Tell the user it's saved, and that `/lockin:pickup` (or asking any other agent to pick up the LockIn baton) carries on from it.

Also from the user: $ARGUMENTS
