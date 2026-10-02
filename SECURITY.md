# Security

LockIn holds people's notes, the tokens their agents use, and OAuth grants for apps like Claude.ai and ChatGPT. If you find a way to read or change someone else's data, get a token you shouldn't have, or make a LockIn server reach something it shouldn't, please tell us privately first.

## Reporting a vulnerability

Use GitHub's private reporting: **Security → Report a vulnerability** on this repository. Don't open a public issue or pull request for it.

Include what you did, what happened, and what should have happened. A request or script that reproduces it helps most.

We'll reply within a week, keep you posted while it's fixed, and credit you in the release notes unless you'd rather not be named.

## In scope

- The app in this repository, hosted or self-hosted: sign-in, sharing, the API routes, the MCP server at `/api/mcp`, and the OAuth server behind it (`/oauth/authorize`, `/api/oauth/*`, `/.well-known/*`).
- Personal access tokens and OAuth tokens: issuing, checking, rate limiting and revoking them.
- File storage (`/api/files`, upload links) and the ingest service in `service/`.
- The Docker setup in `Dockerfile` and `docker-compose.yml`.

## Out of scope

- Model providers you connect with your own key. Ask sends your question and the notes it uses to the provider you chose, from your browser; that's by design.
- Anything that needs control of the user's own browser or machine, such as a malicious extension.
- Denial of service by sheer volume against the hosted instance.

## Supported versions

Fixes go into `main`. Self-hosters should update to the latest `main` and run `pnpm db:migrate` (Docker does this on start).
