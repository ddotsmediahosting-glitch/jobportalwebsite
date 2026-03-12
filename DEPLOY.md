# UAE Jobs Portal — VPS Deployment Guide

## Prerequisites

| Requirement | Min spec |
|---|---|
| VPS OS | Ubuntu 22.04 LTS (recommended) |
| RAM | 2 GB (4 GB recommended) |
| Disk | 20 GB |
| Open ports | 80, 443, 22 |

---

## Step 1 — Provision the server

```bash
# Connect to your VPS
ssh root@YOUR_SERVER_IP
```

---

## Step 2 — Install Docker

```bash
# Install Docker Engine
curl -fsSL https://get.docker.com | sh

# Add your user to the docker group (so you don't need sudo)
usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

---

## Step 3 — Clone the repository

```bash
cd /opt
git clone https://github.com/ddotsmediahosting-glitch/jobportalwebsite.git
cd jobportalwebsite
```

---

## Step 4 — Create your production environment file

```bash
cp .env.production.example .env.production
nano .env.production   # or: vim .env.production
```

Fill in **every** `CHANGE_ME` value:

| Variable | How to get it |
|---|---|
| `POSTGRES_PASSWORD` | Run: `openssl rand -hex 16` |
| `JWT_SECRET` | Run: `openssl rand -hex 64` |
| `JWT_REFRESH_SECRET` | Run: `openssl rand -hex 64` (different value) |
| `FRONTEND_URL` / `WEB_URL` | Your domain e.g. `https://uaejobs.example.com` |
| `SMTP_HOST/USER/PASS` | Gmail: use an [App Password](https://myaccount.google.com/apppasswords) |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `STRIPE_SECRET_KEY` | [dashboard.stripe.com](https://dashboard.stripe.com) (leave mock for testing) |
| `SEED_ADMIN_EMAIL/PASSWORD` | Choose your admin credentials |

> **Security tip:** `chmod 600 .env.production` after editing to restrict read access.

---

## Step 5 — Deploy

```bash
bash deploy.sh
```

This script will:
1. Verify Docker is installed
2. Check `.env.production` has no unfilled placeholders
3. Pull the latest code from git
4. Build all Docker images
5. Start postgres, redis, api, and web containers
6. Wait for health checks to pass
7. Print your server IP and helpful commands

---

## Step 6 — (Optional) Set up SSL with Let's Encrypt

If you have a domain pointing to your server:

```bash
# Install Certbot
apt install -y certbot

# Get a certificate (standalone mode — stop nginx first)
docker compose -f docker-compose.prod.yml stop web
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
docker compose -f docker-compose.prod.yml start web
```

Then update [frontend/nginx.conf](frontend/nginx.conf) to add an HTTPS server block and mount the certs:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # ... rest of your existing config
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}
```

Add to the `web` service in `docker-compose.prod.yml`:
```yaml
volumes:
  - /etc/letsencrypt:/etc/letsencrypt:ro
ports:
  - "80:80"
  - "443:443"
```

Rebuild the web container: `docker compose -f docker-compose.prod.yml up -d --build web`

---

## Day-2 Operations

```bash
# View all container status
docker compose -f docker-compose.prod.yml ps

# Follow logs (all services)
docker compose -f docker-compose.prod.yml logs -f

# Follow logs (one service)
docker compose -f docker-compose.prod.yml logs -f api

# Restart a single service
docker compose -f docker-compose.prod.yml restart api

# Deploy an update (rebuild + rolling restart)
git pull
docker compose -f docker-compose.prod.yml up -d --build

# Stop everything
docker compose -f docker-compose.prod.yml down

# Stop and wipe all data (DANGER — deletes database!)
docker compose -f docker-compose.prod.yml down -v

# Run database migrations manually
docker compose -f docker-compose.prod.yml exec api sh -c "cd /app/backend && npx prisma migrate deploy"

# Seed the database
docker compose -f docker-compose.prod.yml exec api sh -c "cd /app/backend && npx tsx prisma/seed.ts"

# Open a psql shell
docker compose -f docker-compose.prod.yml exec postgres psql -U uaejobs -d uaejobsdb
```

---

## Architecture Overview

```
Internet → :80 (or :443)
              │
         [ nginx ]  (web container)
              │
        ┌─────┴──────────┐
        │                │
  /api/* →  api:4000     Static files (React SPA)
  /uploads/* → api:4000
        │
   [ Express.js ]
        │
   ┌────┴────┐
   │         │
[postgres] [redis]
```

- Only **port 80** (and 443 if SSL) is exposed to the internet
- The API container is internal-only (`expose`, not `ports`)
- PostgreSQL and Redis are internal-only (no external ports)

---

## Default Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | *(set in `SEED_ADMIN_EMAIL`)* | *(set in `SEED_ADMIN_PASSWORD`)* |
| Seeker | seeker@example.com | Seeker#12345 |
| Employer | employer1@techcorp.ae | Employer#123 |

> **Change all seed passwords immediately after first login in production.**
