#!/bin/bash
# Manual deployment script for Marketango Core on VPS
# Usage: bash scripts/deploy.sh

set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/var/www/marketango-core}"

echo "==> Pulling latest code..."
cd "$DEPLOY_DIR"
git pull origin main

echo "==> Building and restarting containers..."
docker compose up -d --build

echo "==> Running migrations..."
docker compose exec api node scripts/migrate.js

echo "==> Deploy completed successfully"
docker compose ps
