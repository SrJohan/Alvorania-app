# Demo en el VPS (alvorania.gestoriainnova.com)

La web corre en **modo live** (Supabase y Stripe en modo de prueba, datos reales de prueba) en un contenedor Docker en `127.0.0.1:3110`, detrás del nginx del VPS, con certificado de certbot. Google no la indexa (`X-Robots-Tag: noindex`).

**Dónde vive de verdad (actualizado el 05-11-2026):** en `/home/johan/alvorania-demo` del VPS, con el usuario `johan` (que tiene Docker). Ahí están el `compose.yml` y el `.env` con las claves (permisos 600, nunca en git). La carpeta `/opt/alvorania-demo` es de root y ya no se usa para desplegar. El proyecto de Supabase es `fdtatmnimdbaecxntezg`.

## Acceso: un enlace por persona o empresa

Para enseñar la demo, cada persona o empresa recibe **su propio enlace**. Con un clic entra sin contraseña (el navegador lo recuerda 14 días), queda registrado quién entra y se le puede quitar el acceso sin afectar a nadie más.

```bash
ssh root@31.70.139.85 "alvorania-enlace crear empresa-sl"     # crea el enlace y lo muestra
ssh root@31.70.139.85 "alvorania-enlace listar"               # todos los enlaces
ssh root@31.70.139.85 "alvorania-enlace visitas empresa-sl"   # cuándo ha entrado (sin nombre: todos)
ssh root@31.70.139.85 "alvorania-enlace borrar empresa-sl"    # le quita el acceso, también si ya había entrado
```

Los nombres van en minúsculas y sin espacios (`andres`, `asesoria-lopez`). Los códigos viven en `/etc/nginx/alvorania-enlaces.map`; el script es `enlace.sh`, instalado como `/usr/local/bin/alvorania-enlace`.

## Acceso del equipo: usuario y contraseña

Sin enlace se piden usuario y contraseña de nginx, como en prueba.gestoriainnova.com (`/etc/nginx/.htpasswd-alvorania`). Las cabeceras son las de `snippets/seguridad-cabeceras-web.conf`. La contraseña inicial está en `/root/alvorania-demo-acceso.txt` (solo root).

```bash
# Ver la contraseña
ssh root@<vps> "cat /root/alvorania-demo-acceso.txt"
# Añadir otro usuario (p. ej. para un contacto) o cambiar una contraseña
ssh root@<vps> "printf 'contacto:%s\n' \"\$(openssl passwd -apr1 'NUEVA-CLAVE')\" >> /etc/nginx/.htpasswd-alvorania"
# Quitar un usuario
ssh root@<vps> "sed -i '/^contacto:/d' /etc/nginx/.htpasswd-alvorania"
```

## Actualizar la web (así se hace hoy)

`desplegar.sh` **no sirve tal cual**: entra como `root`, el VPS rechaza esa clave y `/opt/alvorania-demo` es de root. Se despliega como `johan`, desde Git Bash, dentro de `alvorania-app/web`.

### 0. Antes de nada

- Si hay migraciones nuevas en `supabase/migrations/`, **se aplican en Supabase antes de cambiar el contenedor**, y solo las que toquen. El código nuevo puede esperar datos que el viejo no entiende, y al revés.
- **No apliques la `0011_quitar_blog.sql`** sin exportar antes los posts: hace `drop table blog_posts` y vacía el bucket `blog` (el 05-11-2026 había 8 posts y 11 imágenes).
- Pasa los tipos y los tests: `npx tsc --noEmit`, `npx eslint` y `npx vitest run`.

### 1. Subir, construir y cambiar el contenedor

```bash
cd alvorania-app/web
VPS=johan@31.70.139.85

# Empaquetar sin node_modules, compilaciones ni ningún .env
PKG="$(mktemp -d)/alvorania-web.tgz"
tar -czf "$PKG" --exclude=./node_modules --exclude=./.next --exclude=./.next-e2e --exclude=./test-results \
  --exclude=./playwright-report --exclude=./motion-audits --exclude='./.env*' --exclude=./tsconfig.tsbuildinfo .
scp "$PKG" $VPS:~/alvorania-demo/web.tgz

# En el servidor: guardar la imagen actual, sustituir el código, construir y levantar
ssh $VPS 'set -e; cd ~/alvorania-demo
  docker tag alvorania-demo alvorania-demo:previous
  rm -rf web.new && mkdir web.new && tar -xzf web.tgz -C web.new && rm web.tgz
  rm -rf web.old && mv web web.old && mv web.new web
  docker compose build && docker compose up -d'
```

El `.env` y el `compose.yml` del servidor **no se tocan** (el código va en `web/`). Si cambia `deploy/vps/compose.yml`, compáralo antes con el del servidor (`diff`) y cópialo a mano solo si hace falta.

### 2. Comprobar

```bash
ssh $VPS 'docker compose -f ~/alvorania-demo/compose.yml ps; curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3110/acceder'
```

Debe salir `Up` y `200`. Desde fuera, `https://alvorania.gestoriainnova.com` responde `401` si no vas con enlace o contraseña (es el acceso de nginx, está bien). Una línea de log "Failed to find Server Action" justo tras desplegar es normal: alguien tenía la página abierta con la versión anterior.

### 3. Volver atrás si algo falla

```bash
ssh $VPS 'cd ~/alvorania-demo && docker tag alvorania-demo:previous alvorania-demo:latest && docker compose up -d --no-build'
```

El código anterior queda también en `~/alvorania-demo/web.old`. Las migraciones ya aplicadas en Supabase **no se deshacen solas**: ten escrito el cómo revertirlas antes de aplicarlas.

Esto no toca las demás apps del VPS (gentrivo, chatwoot, etc.): solo el contenedor `alvorania-demo-web-1`.

## Montaje inicial (ya hecho el 30-10-2026)

1. DNS: registro `A` de `alvorania.gestoriainnova.com` → IP del VPS.
2. `bash deploy/vps/desplegar.sh`
3. En el VPS (primero la contraseña: nginx no arranca el sitio sin su archivo):
   ```bash
   P=$(openssl rand -base64 18); printf 'demo:%s\n' "$(openssl passwd -apr1 "$P")" > /etc/nginx/.htpasswd-alvorania
   chown root:www-data /etc/nginx/.htpasswd-alvorania && chmod 640 /etc/nginx/.htpasswd-alvorania
   printf 'usuario: demo\ncontraseña: %s\n' "$P" > /root/alvorania-demo-acceso.txt && chmod 600 /root/alvorania-demo-acceso.txt
   install -m 755 enlace.sh /usr/local/bin/alvorania-enlace
   install -m 640 -o root -g www-data /dev/null /etc/nginx/alvorania-enlaces.map
   certbot certonly --nginx -d alvorania.gestoriainnova.com
   cp nginx.conf /etc/nginx/sites-available/alvorania.gestoriainnova.com
   ln -s /etc/nginx/sites-available/alvorania.gestoriainnova.com /etc/nginx/sites-enabled/
   nginx -t && systemctl reload nginx
   ```

## Ver logs o pararla

```bash
ssh johan@31.70.139.85 "cd ~/alvorania-demo && docker compose logs --tail 50"
ssh johan@31.70.139.85 "cd ~/alvorania-demo && docker compose down"
```

## Modo real (ya activo)

El `compose.yml` de esta carpeta ya está en `NEXT_PUBLIC_DATA_MODE: live`, con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` como `args` de construcción y las claves secretas (`SUPABASE_SERVICE_ROLE_KEY`, Stripe, `CRON_SECRET`...) en el `.env` del servidor con `env_file`, nunca en el repositorio. Para ver qué variables tiene el contenedor sin enseñar los valores: `docker inspect alvorania-demo-web-1 --format '{{range .Config.Env}}{{println .}}{{end}}' | cut -d= -f1`.

`REQUIRE_REVIEWED_TAX_RULES=false` en el servidor: las reglas del IRPF 2025 (migración 0012) están sin firmar por un fiscalista, y con `true` el servidor no calcularía. Antes de abrir esto a clientes reales, que un fiscalista las revise y se ejecute el `update tax_rules set reviewed_by = ..., reviewed_at = now() ...` que explica la cabecera de la 0012.

Los trabajos programados (`vercel.json`) hay que pasarlos a un cron del VPS que llame a `/api/jobs/*` con `Authorization: Bearer $CRON_SECRET`; en `~/alvorania-demo/job.sh` del servidor hay un script (su contenido no está revisado todavía).
