#!/bin/bash
# Simple update script — always uses docker-compose.yml (port 3001)
set -e

cd /opt/jobportalwebsite

echo "Pulling latest code..."
git pull

echo "Rebuilding and restarting containers..."
docker compose down
docker compose up -d --build

echo "Waiting for containers..."
sleep 10

echo "Container status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "Done! Site is live at https://ddotsmediajobs.com"
