# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
# OpenSSL needed by Prisma schema engine at build time
RUN apk add --no-cache openssl

# Copy ALL workspace package.json files so npm can resolve the workspace graph
COPY package.json package-lock.json tsconfig.base.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/
COPY backend/prisma ./backend/prisma

# Install all deps (npm ci uses lockfile — fast and deterministic)
RUN npm ci

# Prisma generate inside backend workspace
RUN cd backend && npx prisma generate

# Copy source and build
COPY . .
RUN npm run build -w @uaejobs/shared && npm run build -w @uaejobs/api

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app
# OpenSSL required by Prisma at runtime
RUN apk add --no-cache openssl

# Copy package manifests for all workspaces (needed by npm workspaces)
COPY package.json package-lock.json tsconfig.base.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/
COPY backend/prisma ./backend/prisma

# Install production deps only
RUN npm ci --omit=dev

# Prisma generate for runtime
RUN cd backend && npx prisma generate

# Copy built artifacts
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/shared/dist ./shared/dist

EXPOSE 4000
CMD ["node", "/app/backend/dist/src/server.js"]
