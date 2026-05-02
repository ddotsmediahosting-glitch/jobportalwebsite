# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Copy ALL workspace package.json files so npm can resolve the workspace graph
COPY package.json package-lock.json tsconfig.base.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/

RUN npm ci

COPY . .

ARG VITE_API_URL=""
ARG VITE_FRONTEND_URL=https://ddotsmediajobs.com
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_FRONTEND_URL=$VITE_FRONTEND_URL

# Give Node.js extra heap — tsc + Vite together need ~1 GB in Alpine
ENV NODE_OPTIONS="--max-old-space-size=1536"

# Build shared types first, then frontend (skip tsc type-check — vite handles transpile).
# vite may be hoisted to root or kept in frontend/node_modules depending on the npm
# version's workspace-hoisting behavior. Pick whichever path exists; fail loudly with
# a directory listing if neither is present.
RUN npm run build -w @uaejobs/shared
RUN set -e; \
    if   [ -f /app/node_modules/vite/bin/vite.js ];          then VITE_BIN=/app/node_modules/vite/bin/vite.js; \
    elif [ -f /app/frontend/node_modules/vite/bin/vite.js ]; then VITE_BIN=/app/frontend/node_modules/vite/bin/vite.js; \
    else \
      echo "vite.js not found at either path. Listing for debug:"; \
      ls -la /app/node_modules/.bin 2>/dev/null | head -5 || true; \
      ls -la /app/frontend/node_modules/.bin 2>/dev/null | head -5 || true; \
      exit 1; \
    fi; \
    echo "Using VITE_BIN=$VITE_BIN"; \
    node "$VITE_BIN" build --config frontend/vite.config.ts

# ── Production stage (nginx) ──────────────────────────────────────────────────
FROM nginx:alpine
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
