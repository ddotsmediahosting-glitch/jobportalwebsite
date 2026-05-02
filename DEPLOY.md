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

For the **first deploy** on a fresh server:

```bash
bash deploy.sh
```

For **every subsequent deploy** (this is what you'll run after pushing changes):

```bash
bash pullandbuild.sh
```

`pullandbuild.sh` is fail-fast and self-recovering. It:

1. Verifies Docker, the compose file, and `.env.production` (rejects empty `MARIADB_*` vars and `CHANGE_ME` placeholders)
2. Pulls latest from `origin/main` (auto-stashes any local edits, restores after)
3. Force-removes any leftover containers from previous failed deploys (volumes are kept — your DB is safe)
4. Builds all images with `--progress=plain` so you see the FULL error if vite/tsc fails
5. Starts services and waits up to 3 minutes for `mariadb`, `redis`, `api` to become healthy
6. Exits **non-zero** if any step fails (so you immediately see ❌, not a fake ✅)
7. On failure, prints the last 30 log lines from every service so you don't have to dig

If anything goes wrong, the script ends with red `✗ DEPLOY FAILED` and the actual error inline. **A green `✅ Deploy succeeded` line only prints when every service is genuinely healthy.**

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

## Troubleshooting

### "cannot stop container: permission denied"
A previous failed deploy left a container in a stuck state that even `sudo docker rm -f` can't kill. Fix:

```bash
sudo systemctl restart docker
bash pullandbuild.sh
```

The volumes (DB data, uploads) survive a daemon restart.

### "dependency failed to start: container ...mariadb-1 is unhealthy"
Almost always one of two causes:

1. **Empty `MARIADB_*` vars in `.env.production`.** The new `pullandbuild.sh` catches this before starting. If it slipped through, run `grep MARIADB .env.production` and confirm all four vars have values.
2. **The volume has data with old credentials.** If you previously deployed with different MariaDB passwords, the existing volume won't accept the new ones. Either revert the credentials in `.env.production`, or wipe the volume (⚠ destroys DB data):
   ```bash
   docker compose -f docker-compose.prod.yml down
   docker volume rm jobportalwebsite_mariadb_data
   bash pullandbuild.sh
   ```

### "✅ Deployment completed successfully!" but the site is broken
You're on the old `pullandbuild.sh` from before the fix. Pull latest and re-run:

```bash
git pull
bash pullandbuild.sh
```

The new script exits non-zero on real failures.

### Build fails with "Cannot find module 'vite/...'"
The Dockerfile already handles both hoisted and workspace-local vite paths. If this still fails, paste the **full** output from `[web builder X/Y]` — buildkit normally prints the real error inline, but the trailing summary truncates it.

### Need to see what's actually failing
The new `pullandbuild.sh` prints the last 30 log lines per service on failure. For more detail:

```bash
docker compose -f docker-compose.prod.yml logs --tail=200 api
docker compose -f docker-compose.prod.yml logs --tail=200 mariadb
```

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
