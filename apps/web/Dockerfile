# Production Dockerfile for @learning-platform/web
#
# Multi-stage build:
#   1. builder — installs all deps (incl. devDeps), runs `next build` with output: 'standalone'
#   2. runner  — copies only the standalone output + node_modules for runtime
#
# Requirements (from ARCHITECTURE_CONSTRAINTS):
#   C1 — single VPS ≤ 4 GB RAM → minimal layers, no dev tools in runner
#   C3 — self-hosted → no vendor-specific base images
#   C6 — low operational complexity → single container, no sidecars
#
# The `output: 'standalone'` in next.config.mjs produces a self-contained
# `.next/standalone` directory with only production node_modules.
# This keeps the runner image small (~200 MB) and start-up fast.

# =====================================================================
# Stage 1: Builder
# =====================================================================
FROM node:20-alpine AS builder

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

# Copy workspace manifests first (better cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json packages/core/
COPY packages/contracts/package.json packages/contracts/
COPY apps/web/package.json apps/web/

# Install all dependencies (including devDeps for build)
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build only the web app (standalone output)
RUN pnpm --filter web build

# =====================================================================
# Stage 2: Runner
# =====================================================================
FROM node:20-alpine AS runner

# Non-root user (security)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone output (includes server.js + minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public

# The standalone output does NOT include these; copy explicitly if needed:
# - .env.example (template)
# - any runtime config files (none in v1)

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Next.js standalone entrypoint
CMD ["node", "server.js"]