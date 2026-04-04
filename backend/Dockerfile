# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/
COPY backend/prisma ./backend/prisma
# Install workspace dependencies (hoists @prisma/client to /app/node_modules)
RUN npm install
# prisma generate cannot traverse up to the workspace root to find @prisma/client,
# so install prisma + @prisma/client locally inside the backend directory so the
# generator can resolve them without workspace hoisting getting in the way.
RUN cd backend && npm install --ignore-scripts prisma @prisma/client
RUN cd backend && npx prisma generate
COPY . .
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
RUN npm install --omit=dev
RUN cd backend && npm install --ignore-scripts prisma @prisma/client && npx prisma generate
EXPOSE 4000
CMD ["sh", "-c", "cd backend && npx prisma db push --accept-data-loss && node /app/backend/dist/src/server.js"]
