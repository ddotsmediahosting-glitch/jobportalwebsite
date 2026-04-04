# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/
# Copy prisma schema before npm install so this layer invalidates on schema changes
COPY backend/prisma ./backend/prisma
RUN npm install
COPY . .
# Run prisma generate from workspace root with explicit schema path so the CLI
# resolves @prisma/client from /app/node_modules (not a subdirectory).
RUN npx prisma generate --schema=./backend/prisma/schema.prisma
RUN npm run build -w @uaejobs/shared && npm run build -w @uaejobs/api

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/tsconfig.base.json ./
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/shared/dist ./shared/dist
RUN npm install --omit=dev && npx prisma generate --schema=./backend/prisma/schema.prisma
EXPOSE 4000
CMD ["sh", "-c", "cd backend && npx prisma db push --accept-data-loss && node /app/backend/dist/src/server.js"]
