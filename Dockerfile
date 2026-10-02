# syntax=docker/dockerfile:1
# LockIn, self-hosted. Built by docker-compose.yml; see README "Self-hosting".

# Dependencies, installed once and shared by the build and migrate stages.
FROM node:24-slim AS deps
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# pnpm, at the version package.json pins (packageManager), via corepack.
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml prisma.config.ts ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# Build: generates the Prisma client, then the Next server.
FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# Migrate: a one-shot container that brings the database schema up to date
# before the app starts (prisma migrate deploy).
FROM deps AS migrate
COPY prisma ./prisma
CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

# Runtime: just the standalone server and its static files. Prisma 7 has no
# engine binary; the client is compiled into the server and talks to Postgres
# through the pg driver.
FROM node:24-slim AS app
RUN useradd --create-home --uid 1001 lockin
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 STORAGE_DIR=/data/uploads
COPY --from=build --chown=lockin /app/.next/standalone ./
COPY --from=build --chown=lockin /app/.next/static ./.next/static
COPY --from=build --chown=lockin /app/public ./public
RUN mkdir -p /data/uploads && chown -R lockin /data
USER lockin
EXPOSE 3000
CMD ["node", "server.js"]
