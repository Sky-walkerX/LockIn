# Contributing

Thanks for helping. Bug reports, fixes and features are all welcome. For anything bigger than a fix, open an issue first so we can agree on the shape before you write it.

## Set up

You need Node 24, pnpm (the version in `package.json` → `packageManager`; `corepack enable` picks it up) and a Postgres database.

```bash
pnpm install                    # also generates the Prisma client
pnpm db:migrate                 # create the tables (after writing .env, below)
pnpm dev                        # http://localhost:3000
```

Put these in a `.env` file at the root. Both the app and the Prisma CLI read it, and git ignores it:

```
DATABASE_URL=postgresql://…     # the database the app uses
DIRECT_URL=postgresql://…       # for migrations; the same URL unless you use a pooler
AUTH_SECRET=…                   # openssl rand -base64 32
NEXTAUTH_SECRET=…               # the same value
NEXTAUTH_URL=http://localhost:3000
```

Everything else is optional: Google sign-in, Supabase storage, the ingest service for PDF text and server-side embeddings. Without them the app falls back (email sign-in, files on disk, embeddings in the browser).

Prefer containers? `docker compose up -d` runs Postgres and the app; see the README.

## Before you open a pull request

Run what CI runs:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm test
pnpm build
```

Add a test for logic you change. Tests live next to the code they cover (`lib/**/*.test.ts`) and run without a database.

## Database changes

Edit `prisma/schema.prisma`, then create a migration:

```bash
pnpm exec prisma migrate dev --name what-changed
```

Never edit a migration that's already in `main`. Deployed databases record each migration's checksum, and a changed file stops them migrating. Prefer additive changes (new tables, new nullable or defaulted columns), so a deploy never breaks existing data.

## Commits and pull requests

Write commit messages that say what changed and why, in plain words:

```
feat: show pages in MCP search results

search_notes now gives each note's page, so an agent can refer to a note
the way the user and Ask do.
```

Prefixes: `feat`, `fix`, `chore`, `docs`, `ci`, `build`, `refactor`, `test`. Keep pull requests to one change each.

The look of the app is described in `DESIGN.md` and the product in `PRODUCT.md`. Changes to either should follow them, or update them in the same pull request.

## License

LockIn is AGPL-3.0. By contributing you agree your contribution is licensed under it too.
