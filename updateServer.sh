#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit
git restore .
git checkout main
git pull
npm install
if npm audit --json | grep -q '"vulnerabilities":'; then
    echo "Running npm audit fix..."
    npm audit fix
fi
npm run build
sudo rsync -av --delete dist/ /var/www/website/
echo "Restarting server"
sudo systemctl restart nginx
echo "Update complete"