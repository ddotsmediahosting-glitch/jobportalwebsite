# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
# OpenSSL needed by Prisma schema engine at build time
RUN apk add --no-cache openssl
COPY package.json tsconfig.base.json ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/
COPY backend/prisma ./backend/prisma
RUN npm install
# Install prisma + @prisma/client locally in backend so the generator
# can resolve them without workspace hoisting traversal issues.
RUN cd backend && npm install --ignore-scripts prisma @prisma/client
RUN cd backend && npx prisma generate
COPY . .
RUN npm run build -w @uaejobs/shared && npm run build -w @uaejobs/api

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app
# OpenSSL required by Prisma schema engine (prisma db push) at runtime
RUN apk add --no-cache openssl
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
CMD ["node", "/app/backend/dist/src/server.js"]
