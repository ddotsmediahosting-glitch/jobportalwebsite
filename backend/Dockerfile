# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/
RUN npm install
COPY . .
# Run prisma generate explicitly from the backend directory so it can resolve
# @prisma/client from the workspace root node_modules without confusion.
RUN cd backend && npx prisma generate
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
RUN npm install --omit=dev && cd backend && npx prisma generate
EXPOSE 4000
CMD ["sh", "-c", "cd backend && npx prisma db push --accept-data-loss && node /app/backend/dist/src/server.js"]
