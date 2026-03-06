# Build context = monorepo root (set in docker-compose.yml)
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++ openssl

# ─── Install ALL workspace deps ────────────────────────────────────────────────
FROM base AS deps
# Copy root workspace manifest + both package manifests needed for install
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/
RUN npm ci --workspace=apps/api --workspace=packages/shared --include-workspace-root

# ─── Build shared package first, then API ─────────────────────────────────────
FROM deps AS builder
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/
RUN npm run build -w packages/shared
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

# ─── Lean production image ─────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl

RUN addgroup -g 1001 -S nodejs && adduser -S api -u 1001
RUN mkdir -p /app/uploads && chown api:nodejs /app/uploads

COPY --from=builder --chown=api:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=api:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=api:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=api:nodejs /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder --chown=api:nodejs /app/apps/api/prisma ./prisma
COPY --from=builder --chown=api:nodejs /app/apps/api/package.json ./

USER api
EXPOSE 4000

CMD ["sh", "-c", "node dist/server.js"]
