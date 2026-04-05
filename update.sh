#!/bin/bash
# Auto-deploy script — runs every 2 minutes via cron, deploys only when there are new commits
set -e

DIR=/opt/jobportalwebsite
LOG=$DIR/deploy.log

cd "$DIR"

# Fetch latest from remote
git fetch origin main >> "$LOG" 2>&1

# Check if local is behind remote
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
  exit 0  # Nothing new, skip
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] New commits detected — deploying..." >> "$LOG"

# Pull latest code
git pull origin main >> "$LOG" 2>&1

# Rebuild and restart containers
docker compose down >> "$LOG" 2>&1
docker compose up -d --build >> "$LOG" 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deployment complete." >> "$LOG"
