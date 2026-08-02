#!/usr/bin/env bash
# Treeline — deploy the static site to a Debian/Ubuntu host.
#
#   SSH_TARGET=root@203.0.113.10 DOMAIN=treeline.example ./deploy/deploy.sh
#
# Idempotent: safe to re-run for every subsequent deploy. The first run also
# installs nginx, writes the server block and opens the firewall; later runs
# effectively just sync the files.
#
# Deliberately does NOT run certbot — see README notes. Get HTTP working and
# DNS propagated first, then issue the certificate.

set -euo pipefail

: "${SSH_TARGET:?set SSH_TARGET, e.g. root@203.0.113.10}"
: "${DOMAIN:?set DOMAIN, e.g. treeline.us.kg}"

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE_ROOT=/var/www/treeline

echo "→ deploying $SRC to $SSH_TARGET:$REMOTE_ROOT for $DOMAIN"

# 1. server-side prerequisites
ssh "$SSH_TARGET" DOMAIN="$DOMAIN" REMOTE_ROOT="$REMOTE_ROOT" 'bash -s' <<'REMOTE'
set -euo pipefail

if ! command -v nginx >/dev/null; then
  echo "→ installing nginx"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq nginx
fi

mkdir -p "$REMOTE_ROOT"

# Vultr images commonly ship with ufw enabled and only SSH allowed, which is
# why port 80 answers nothing on a fresh box.
if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then
  ufw allow 'Nginx Full' >/dev/null
  echo "→ ufw: opened 80/443"
fi
REMOTE

# 2. sync the site (only the files the site actually needs)
rsync -az --delete \
  --exclude '.git' --exclude '.github' --exclude '.claude' \
  --exclude 'deploy' --exclude 'README.md' --exclude '.gitignore' \
  "$SRC/" "$SSH_TARGET:$REMOTE_ROOT/"

# 3. server block
sed "s/__DOMAIN__/$DOMAIN/g" "$SRC/deploy/nginx.conf" \
  | ssh "$SSH_TARGET" "cat > /etc/nginx/sites-available/treeline"

ssh "$SSH_TARGET" DOMAIN="$DOMAIN" 'bash -s' <<'REMOTE'
set -euo pipefail
ln -sfn /etc/nginx/sites-available/treeline /etc/nginx/sites-enabled/treeline
rm -f /etc/nginx/sites-enabled/default
chown -R www-data:www-data /var/www/treeline
nginx -t
systemctl reload nginx
echo "→ nginx reloaded"
REMOTE

echo "✓ deployed — http://$DOMAIN/ (once DNS resolves)"
