#!/usr/bin/env bash
# Enlaces de acceso a la demo, uno por persona o empresa. Se instala en el VPS como /usr/local/bin/alvorania-enlace.
#   alvorania-enlace crear andres        → crea el enlace y lo muestra
#   alvorania-enlace listar              → quién tiene enlace y su dirección
#   alvorania-enlace borrar andres       → le quita el acceso (también a quien ya entró: su cookie deja de valer)
#   alvorania-enlace visitas [andres]    → últimas entradas, de todos o de uno
set -euo pipefail

MAP=/etc/nginx/alvorania-enlaces.map
LOG=/var/log/nginx/alvorania-demo.log
URL=https://alvorania.gestoriainnova.com

recargar() {
  if nginx -t 2>/dev/null; then systemctl reload nginx; else echo "nginx -t falla: no se recarga" >&2; nginx -t; exit 1; fi
}

nombre_valido() {
  [[ "${1:-}" =~ ^[a-z0-9][a-z0-9-]{1,39}$ ]] || { echo "Nombre en minúsculas, sin espacios ni tildes: p. ej. andres o empresa-sl" >&2; exit 1; }
}

touch "$MAP"; chmod 640 "$MAP"; chown root:www-data "$MAP"

case "${1:-}" in
  crear)
    nombre_valido "${2:-}"
    if grep -q " $2;\$" "$MAP"; then echo "$2 ya tiene enlace:"; awk -v n="$2;" -v u="$URL" '$2==n {print u "/?acceso=" $1}' "$MAP"; exit 0; fi
    codigo=$(openssl rand -base64 32 | tr -dc 'A-Za-z0-9' | head -c 16)
    echo "$codigo $2;" >> "$MAP"
    recargar
    echo "Enlace para $2 (válido hasta que lo borres; en su navegador dura 14 días tras abrirlo):"
    echo "$URL/?acceso=$codigo"
    ;;
  listar)
    [ -s "$MAP" ] || { echo "Todavía no hay enlaces."; exit 0; }
    awk -v u="$URL" '{n=$2; sub(";","",n); printf "%-24s %s/?acceso=%s\n", n, u, $1}' "$MAP"
    ;;
  borrar)
    nombre_valido "${2:-}"
    grep -q " $2;\$" "$MAP" || { echo "$2 no tiene enlace."; exit 1; }
    sed -i "/ $2;\$/d" "$MAP"
    recargar
    echo "Acceso de $2 retirado."
    ;;
  visitas)
    [ -f "$LOG" ] || { echo "Sin visitas todavía."; exit 0; }
    filtro="quien=${2:-}"
    grep -v -E 'quien=- |quien= ' "$LOG" | grep "$filtro" | grep -v -E '"GET /_next/|\.(js|css|webp|png|svg|ico) ' | sed -E 's/acceso=[A-Za-z0-9]+/acceso=…/' | tail -n 30
    ;;
  *)
    sed -n '2,6p' "$0" | sed 's/^# \{0,1\}//'
    exit 1
    ;;
esac
