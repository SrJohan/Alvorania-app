#!/usr/bin/env bash
# Sube la carpeta web/ al VPS y reconstruye la demo. Uso, desde web/ en Git Bash:
#   bash deploy/vps/desplegar.sh            (VPS por defecto)
#   VPS=root@1.2.3.4 bash deploy/vps/desplegar.sh
set -euo pipefail

VPS="${VPS:-root@31.70.139.85}"
DIR=/opt/alvorania-demo
HERE="$(cd "$(dirname "$0")" && pwd)"
WEB="$(cd "$HERE/../.." && pwd)"
PKG="$(mktemp -d)/alvorania-web.tgz"

echo "== 1/3 Empaquetando web/ (sin node_modules, compilaciones ni .env)"
tar -C "$WEB" -czf "$PKG" \
  --exclude=./node_modules --exclude=./.next --exclude=./.next-e2e --exclude=./test-results \
  --exclude=./playwright-report --exclude=./motion-audits --exclude='./.env*' .

echo "== 2/3 Subiendo a $VPS:$DIR"
ssh "$VPS" "mkdir -p $DIR/web"
scp -q "$PKG" "$VPS:$DIR/web.tgz"
scp -q "$HERE/compose.yml" "$VPS:$DIR/compose.yml"

echo "== 3/3 Reconstruyendo y arrancando (tarda unos minutos)"
ssh "$VPS" "set -e; cd $DIR && rm -rf web.new && mkdir web.new && tar -xzf web.tgz -C web.new && rm web.tgz \
  && rm -rf web && mv web.new web && docker compose up -d --build && docker image prune -f >/dev/null \
  && docker compose ps"
rm -f "$PKG"
echo "Listo: https://alvorania.gestoriainnova.com"
