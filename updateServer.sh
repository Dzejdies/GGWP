#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit
git restore .
git checkout main
git pull
npm ci
npm run build
sudo rsync -av --delete dist/ /var/www/website/
echo "Restarting server"
sudo systemctl restart nginx
echo "Update complete"