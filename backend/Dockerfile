# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl

COPY package.json package-lock.json tsconfig.base.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/
COPY backend/prisma ./backend/prisma

RUN npm ci

RUN cd backend && npx prisma generate

COPY . .
RUN npm run build -w @uaejobs/shared && npm run build -w @uaejobs/api

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache openssl

COPY package.json package-lock.json tsconfig.base.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/
COPY backend/prisma ./backend/prisma
COPY backend/entrypoint.sh ./backend/entrypoint.sh

RUN npm ci --omit=dev
RUN cd backend && npx prisma generate
RUN chmod +x /app/backend/entrypoint.sh

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/shared/dist ./shared/dist

EXPOSE 4000
CMD ["/app/backend/entrypoint.sh"]
