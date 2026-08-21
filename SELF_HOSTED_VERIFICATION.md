# Verificación de alcance

La copia self-hosted fue comparada contra el ZIP final de Manus.

Confirmados idénticos al original:

- `client/src/pages/Catalogo.tsx`
- `client/src/pages/admin/AdminProducts.tsx`
- `drizzle/schema.ts`
- `server/routers.ts`
- `server/db.ts`
- `client/src/pages/Home.tsx`
- `client/src/pages/Producto.tsx`

Los cambios se limitaron a configuración, almacenamiento, autenticación de infraestructura, desactivación del login OAuth de clientes y compatibilidad de migraciones/despliegue.

Los scripts `.mjs` fueron verificados sintácticamente con Node y los archivos TypeScript/TSX no presentan errores de parseo. La instalación/build final debe validarse con `pnpm install --frozen-lockfile`, `pnpm check` y `pnpm build` en un entorno con acceso al registro npm.
