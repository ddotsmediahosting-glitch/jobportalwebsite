# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/
RUN npm install
COPY . .
ARG VITE_API_URL=""
ARG VITE_FRONTEND_URL=https://ddotsmediajobs.com
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_FRONTEND_URL=$VITE_FRONTEND_URL
RUN npm run build -w @uaejobs/shared && npm run build -w @uaejobs/web

# ── Production stage (nginx) ──────────────────────────────────────────────────
FROM nginx:alpine
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
