#!/bin/sh
# Set a new password for an account, for a self-hosted LockIn that doesn't
# send email (see README, "Accounts"). Run it next to docker-compose.yml:
#
#   scripts/set-password.sh someone@example.com
#
# It asks for the password and has Postgres hash it (bcrypt, from pgcrypto)
# and store it. The account is signed out everywhere.
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
UPDATE "User"
SET "password" = crypt(:'password', gen_salt('bf', 10)), "passwordChangedAt" = (now() AT TIME ZONE 'UTC')
WHERE lower("email") = lower(:'email')
RETURNING "email";
SQL
)

if [ -z "$changed" ]; then
  echo "No account has the address $email." >&2
  exit 1
fi
echo "Password set for $changed. They are signed out everywhere."
