#!/usr/bin/env bash
# Install the mass.partridgecrossing.org nginx vhost on ptx-web02.
# Run as: sudo /home/torvaldsl/mass-man/deploy/install-nginx.sh
set -euo pipefail

SRC="/home/torvaldsl/mass-man/deploy/nginx.conf"
AVAILABLE="/etc/nginx/sites-available/mass.conf"
ENABLED="/etc/nginx/sites-enabled/mass.conf"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run this script with sudo." >&2
  exit 1
fi

if [[ ! -f "$SRC" ]]; then
  echo "Missing $SRC — clone the app first." >&2
  exit 1
fi

install -m 644 "$SRC" "$AVAILABLE"
ln -sfn "$AVAILABLE" "$ENABLED"
nginx -t
systemctl reload nginx
echo "Enabled $ENABLED → 127.0.0.1:3004 (mass.partridgecrossing.org)"
