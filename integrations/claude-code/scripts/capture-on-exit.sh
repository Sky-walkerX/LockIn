#!/bin/sh
# LockIn: file a session into the notebook when it ends.
#
# Claude Code's SessionEnd hook gets the session's id and the path of its
# transcript, not a summary, and LockIn's server can't read files on this
# machine. So this starts a short background run of Claude that resumes a
# copy of the session, writes the summary, and files it through the same
# `lockin` MCP server the rest of the plugin uses (no other token needed).
# It returns at once: the hook has 1.5 seconds, the run takes longer.
#
# Settings, as environment variables:
#   LOCKIN_CAPTURE_ON_EXIT=0       don't capture at session end
#   LOCKIN_CAPTURE_MODEL=haiku     the model that writes the summary
#   LOCKIN_CAPTURE_MIN_PROMPTS=2   skip sessions with fewer prompts than this

# The background run is a session too: when it ends, it must not start another.
[ -n "$LOCKIN_CAPTURING" ] && exit 0
[ "$LOCKIN_CAPTURE_ON_EXIT" = "0" ] && exit 0
command -v claude >/dev/null 2>&1 || exit 0

input=$(cat)

# One string field of the hook's JSON, unescaped. The input is a single flat
# object, so a pattern does without a JSON parser (which may not be installed).
field() {
  printf '%s' "$input" | tr -d '\n' |
    sed -nE "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"(([^\"\\\\]|\\\\.)*)\".*/\\1/p" |
    sed -e 's/\\\\/\\/g' -e 's/\\"/"/g'
}

session=$(field session_id)
transcript=$(field transcript_path)
cwd=$(field cwd)

# An id is letters, digits and dashes; anything else isn't one to resume.
case "$session" in
  "" | *[!A-Za-z0-9-]*) exit 0 ;;
esac
[ -f "$transcript" ] || exit 0

# Sessions run by scripts (claude -p, the SDK) aren't the user's working
# sessions, and one with a prompt or two has nothing worth keeping.
grep -m 1 -q '"entrypoint":"sdk' "$transcript" && exit 0
prompts=$(grep '"type":"user"' "$transcript" | grep '"promptId"' | grep -vc '"tool_result"')
[ "${prompts:-0}" -ge "${LOCKIN_CAPTURE_MIN_PROMPTS:-2}" ] || exit 0

prompt="This session has ended. File it into the user's LockIn notebook: call the capture_session tool once, with session_id \"$session\", cwd \"$cwd\", trigger \"end\", and as summary a markdown account for whoever picks this work up later: what the user asked for, what was done and decided and why, what was fixed and how, the commands, files and code that matter, and what is still left. If the conversation starts with a summary of an earlier part, cover only what came after it. Call no other tool, and reply with nothing else."

log="${TMPDIR:-/tmp}/lockin-capture-$session.log"
cd "$cwd" 2>/dev/null || cd "$HOME" || exit 0

# A fork of the session, not the session itself, and not saved: the user's
# own history stays as it was.
LOCKIN_CAPTURING=1 nohup claude -p "$prompt" \
  --resume "$session" --fork-session --no-session-persistence \
  --model "${LOCKIN_CAPTURE_MODEL:-haiku}" \
  --tools "" --allowedTools mcp__lockin__capture_session \
  </dev/null >"$log" 2>&1 &

exit 0
