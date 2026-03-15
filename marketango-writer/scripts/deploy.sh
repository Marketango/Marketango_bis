#!/bin/bash
# Manual deployment script for Marketango Writer on VPS
# Usage: bash scripts/deploy.sh

set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/var/www/marketango-writer}"

echo "==> Pulling latest code..."
cd "$DEPLOY_DIR"
git pull origin main

echo "==> Building and restarting container..."
docker compose up -d --build

echo "==> Deploy completed successfully"
docker compose ps
