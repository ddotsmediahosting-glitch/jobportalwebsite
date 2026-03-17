#!/bin/bash

echo "🚀 Starting deployment..."

# Move to project directory

cd /opt/jobportalwebsite || exit

echo "📦 Step 1: Adding changes..."
git add .

echo "💾 Step 2: Commit local changes..."
COMMIT_MSG="auto-deploy $(date '+%Y-%m-%d %H:%M:%S')"
git commit -m "$COMMIT_MSG" || echo "⚠️ Nothing to commit"

echo "⬇️ Step 3: Pull latest from repo..."
git pull origin main --no-rebase || {
echo "❌ Git pull failed. Resolve conflicts manually."
exit 1
}

echo "🛑 Step 4: Stopping Docker containers..."
docker compose -f docker-compose.prod.yml down

echo "🔨 Step 5: Rebuilding containers..."
docker compose -f docker-compose.prod.yml build

echo "🚀 Step 6: Starting containers..."
docker compose -f docker-compose.prod.yml up -d

echo "🧹 Step 7: Cleaning unused images..."
docker image prune -f

echo "✅ Deployment completed successfully!"

