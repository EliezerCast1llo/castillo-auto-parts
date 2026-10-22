# Demo local y transición a Railway de producción

La receta anterior de Railway con `PAYMENT_PROVIDER=mock` y correo por consola
queda retirada: `next start` usa `NODE_ENV=production` y ahora rechaza esa
configuración al arrancar. No se debe bajar `NODE_ENV` ni activar variables E2E
para eludir esta validación en un servicio público.

Para Railway, seguir [Despliegue de producción](deploy-production-railway.md):
PostgreSQL, variables obligatorias, migraciones, healthcheck, cron, backups y
restauración. `railway.json` configura el servicio web; `railway.cron.json`
configura un segundo servicio para el cron. El dueño debe crearlos manualmente.

## Demo de desarrollo, solo local

1. Usar una base PostgreSQL local desechable y copiar `.env.example` a un archivo
   local ignorado por Git. Configurar `DATABASE_URL` y `DIRECT_DATABASE_URL`.
2. Ejecutar `npm ci`, `npm run prisma:generate`, `npm run db:migrate:deploy`
   y `npm run db:seed` (esto carga catálogo de prueba y el admin semilla).
3. Mantener `PAYMENT_PROVIDER=mock`, `EMAIL_PROVIDER=console` y ejecutar
   `npm run dev`. No fijar `NODE_ENV=production` para esta demo.
4. Verificar catálogo, carrito y checkout mock en `http://localhost:3000`.

Los pagos simulados y mensajes de consola no son compras ni correos reales.
Los secretos y archivos `.env` locales no deben subirse al repositorio.

El runner `npm run test:e2e` es el único que usa un build de producción con
proveedores simulados: crea un esquema `e2e_*`, configura las banderas de prueba
y lo elimina al terminar. Esas variables no pertenecen a un despliegue Railway.
