# Build context = monorepo root (set in docker-compose.yml)
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL

# Copy workspace manifests and install
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/web/package*.json ./apps/web/
RUN npm ci --workspace=apps/web --workspace=packages/shared --include-workspace-root

# Copy source and build
COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/
RUN npm run build -w packages/shared
WORKDIR /app/apps/web
RUN npm run build

# ─── Serve with nginx ──────────────────────────────────────────────────────────
FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
