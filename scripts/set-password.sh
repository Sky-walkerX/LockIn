#!/bin/sh
# Set a new password for an account, for a self-hosted LockIn that doesn't
# send email (see README, "Accounts"). Run it next to docker-compose.yml:
#
#   scripts/set-password.sh someone@example.com
#
# It asks for the password and has Postgres hash it (bcrypt, from pgcrypto)
# and store it. The account's agents and connected apps are disconnected, as
# after a reset by email, and it is signed out everywhere: within half a
# minute, which is how long the app remembers a session it has checked. In
# that half minute an old session can still read the notebook, but can't make
# a token or connect an app.
set -eu

email="${1:?Usage: scripts/set-password.sh someone@example.com}"

printf 'New password for %s: ' "$email" >&2
stty -echo 2>/dev/null || true
IFS= read -r password
stty echo 2>/dev/null || true
printf '\n' >&2

if [ "${#password}" -lt 8 ]; then
  echo "The password must be at least 8 characters." >&2
  exit 1
fi

# Both values reach psql through the environment, never a command line, so
# the password doesn't show in a process list; psql quotes them itself.
changed=$(LK_EMAIL="$email" LK_PASSWORD="$password" docker compose exec -T -e LK_EMAIL -e LK_PASSWORD \
  db psql -U lockin -d lockin -q -At -v ON_ERROR_STOP=1 <<'SQL'
\getenv email LK_EMAIL
\getenv password LK_PASSWORD
SET client_min_messages = warning;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
BEGIN;
-- The password first, and on its own: this waits for any token or app sign-in
-- being handed out at the same moment, and the statements after it then see
-- that one and revoke it too. (No apostrophes in here: macOS sh trips on one
-- inside a here-document inside a command substitution.)
UPDATE "User"
SET "password" = crypt(:'password', gen_salt('bf', 10)), "passwordChangedAt" = (now() AT TIME ZONE 'UTC')
WHERE lower("email") = lower(:'email')
RETURNING "id" AS account_id, "email" AS account_email \gset
\if :{?account_id}
  UPDATE "ApiToken" SET "revokedAt" = (now() AT TIME ZONE 'UTC') WHERE "revokedAt" IS NULL AND "userId" = :'account_id';
  UPDATE "OAuthGrant" SET "revokedAt" = (now() AT TIME ZONE 'UTC') WHERE "revokedAt" IS NULL AND "userId" = :'account_id';
  DELETE FROM "OAuthCode" WHERE "userId" = :'account_id';
  DELETE FROM "EmailToken" WHERE "userId" = :'account_id' AND "purpose" = 'reset';
  COMMIT;
  \echo :account_email
\else
  ROLLBACK;
\endif
SQL
)

if [ -z "$changed" ]; then
  echo "No account has the address $email." >&2
  exit 1
fi
echo "Password set for $changed. They are signed out everywhere, and their agents and connected apps are disconnected."
