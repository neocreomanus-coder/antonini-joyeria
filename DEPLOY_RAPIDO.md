# Antonini Joyería — despliegue rápido self-hosted

Esta copia conserva React/Vite + Node/Express + tRPC + Drizzle + MySQL/MariaDB.
No usa Docker y el panel admin conserva login manual por usuario/contraseña.

## Qué NO se modificó

- `client/src/pages/Catalogo.tsx`
- `client/src/pages/admin/AdminProducts.tsx`
- `drizzle/schema.ts`
- `server/routers.ts`
- `server/db.ts`
- lógica de productos, categorías, subcategorías, carrito, pedidos, Wompi y precios

## Qué cambió para salir de Manus

- almacenamiento Forge -> disco local, conservando URLs `/manus-storage/...`
- OAuth de clientes desactivado; compra como invitado y rastreo público siguen disponibles
- plugin/runtime/analytics de Manus retirados
- sesiones del admin usan JWT local
- migraciones 0006–0008 separadas para MariaDB/mysql2
- scripts `dev/start` compatibles con `.env` en Windows y Ubuntu

## Prueba local en Windows

1. `pnpm install --frozen-lockfile`
2. `Copy-Item .env.example .env`
3. Abre el túnel hacia MariaDB del VPS en otra terminal:
   `ssh -N -L 3311:127.0.0.1:3310 root@TU_IP`
4. En `.env`, usa `DATABASE_URL=...@127.0.0.1:3311/antonini`
5. Genera un `JWT_SECRET` largo y configura las variables ADMIN_*.
6. `pnpm check`
7. `pnpm build`
8. `pnpm dev`
9. Abre `http://localhost:3000` y prueba tienda + `/admin`.

## Migración final desde Manus

El script `pnpm migrate:manus -- RUTA_AL_PROJECT_CONFIG` copia los datos de la base final de Manus y descarga imágenes/videos al nuevo almacenamiento sin cambiar las URLs guardadas.

Antes de ejecutarlo, la base destino debe tener el esquema (`pnpm db:push`). El script reemplaza los datos de las 10 tablas de la aplicación en la base destino, por lo que debe usarse cuando ya hayas terminado los cambios en Manus.

Ejemplo en el VPS, después de clonar el repo y crear `.env`:

```bash
pnpm db:push
pnpm migrate:manus -- /root/antonini-manus-project-config.json
pnpm build
```

Después de una migración correcta elimina `/root/antonini-manus-project-config.json`; no lo subas a GitHub.

## `.env` de producción recomendado

```env
NODE_ENV=production
PORT=3005
DATABASE_URL=mysql://antonini:TU_PASSWORD_URL_ENCODED@127.0.0.1:3310/antonini
JWT_SECRET=UN_SECRETO_ALEATORIO_DE_64_O_MAS_CARACTERES
VITE_APP_ID=antonini-self-hosted
STORAGE_DIR=/var/lib/antonini/storage
ADMIN_USERNAME=admin
ADMIN_PASSWORD=TU_CLAVE_ADMIN
ADMIN_EMAIL=TU_CORREO
ADMIN_NAME=Administrador
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

La contraseña de `DATABASE_URL` debe estar URL-encoded si contiene caracteres como `@`, `/`, `:`, `#`, `%`, `?` o `&`.
