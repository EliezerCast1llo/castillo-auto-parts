# Checklist operativo de producción

Fecha: 2026-06-24.

Este documento cubre `T-043`: puntos que no se pueden confirmar solo leyendo el repo. Deben revisarse manualmente en Vercel, Cloudflare, Resend/DNS y el proveedor de base de datos.

## Vercel

- [ ] Proyecto conectado al repo correcto: `EliezerCast1llo/castillo-auto-parts`.
- [ ] Production Branch configurada como `main`.
- [ ] Variables separadas por ambiente:
  - [ ] `production`;
  - [ ] `preview`;
  - [ ] `development/local`.
- [ ] Variables sensibles marcadas/protegidas cuando aplique.
- [ ] `NEXT_PUBLIC_SITE_URL` en producción apunta al dominio final HTTPS.
- [ ] `NEXTAUTH_URL` apunta al dominio final HTTPS.
- [ ] `PAYMENT_PROVIDER` sigue en `mock` hasta validación Wompi real; nunca publicar ventas reales con mock.
- [ ] `WOMPI_ENVIRONMENT=production` solo cuando Wompi real esté validado.
- [ ] `RESERVATION_CRON_SECRET` configurado y usado por el scheduler que llama `/api/internal/expire-payment-reservations`.
- [ ] Checks de GitHub requeridos para merge a `main`: `quality` y `e2e`.

## PostgreSQL / Prisma

- [ ] Proveedor de BD decidido.
- [ ] `DATABASE_URL` de producción apunta a URL pooled/pooler.
- [ ] `DIRECT_DATABASE_URL` de producción apunta a URL directa.
- [ ] `prisma migrate deploy` corre usando `DIRECT_DATABASE_URL`.
- [ ] Confirmar que el runtime público usa `NODE_ENV=production`; en este ambiente el catálogo mock debe permanecer deshabilitado.
- [ ] Ejecutar en preproducción una prueba controlada con PostgreSQL inaccesible y confirmar que la aplicación muestra un estado no disponible, nunca productos, precios, stock o filtros mock.
- [ ] Restaurar PostgreSQL después de la prueba y confirmar que Home, Catálogo, Producto, Carrito y Checkout vuelven a leer datos persistidos.
- [ ] Configurar monitoreo y alerta para errores de conexión a PostgreSQL; una interfaz visible por fallback local no cuenta como señal de salud de la base de datos.
- [ ] Métricas del proveedor muestran conexiones estables bajo carga.
- [ ] Backups automáticos habilitados.
- [ ] Retención y restore probados al menos una vez.

> Gate obligatorio: los datos mock son únicamente una ayuda de desarrollo. No autorizar el lanzamiento si una caída de PostgreSQL puede presentar el catálogo de demostración como inventario real.

## Cloudflare R2

- [ ] Bucket de imágenes separado por ambiente o prefijo claro (`production`, `preview`, `local`).
- [ ] `CLOUDFLARE_R2_PUBLIC_URL` usa dominio propio en producción, no `r2.dev`.
- [ ] Acceso público por `r2.dev` deshabilitado si se usa dominio propio y reglas WAF/Access.
- [ ] Token R2 limitado al bucket necesario.
- [ ] Token con permiso mínimo para la app: Object Read & Write sobre el bucket.
- [ ] Listado público de objetos no expuesto en raíz.
- [ ] Políticas de cache definidas para imágenes.
- [ ] Rotación de credenciales documentada.

## Resend / DNS

- [ ] Dominio real agregado en Resend.
- [ ] Registros DNS de SPF y DKIM agregados según Resend.
- [ ] DMARC publicado.
- [ ] `EMAIL_PROVIDER=resend` solo cuando dominio esté verificado.
- [ ] `EMAIL_FROM` usa dominio real verificado.
- [ ] Email de prueba enviado y recibido fuera de spam.
- [ ] Proceso de fallback definido si Resend falla.

## DTE / Hacienda

- [ ] Contador confirma régimen y tipo de documentos.
- [ ] Contador confirma si el envío se emite como línea gravada, servicio de transporte, cargo exento u otro tratamiento.
- [ ] Definido si el DTE se emite al pago aprobado, despacho o cierre operativo.
- [ ] Definidos datos mínimos para consumidor final y contribuyente.
- [ ] Confirmado si se usará portal/manual, proveedor DTE con API o integración directa.
- [ ] Sandbox de proveedor/Hacienda disponible antes de automatizar.
- [ ] Proceso de contingencia documentado si DTE falla después del pago.

## CSP

- [ ] Preview revisado en navegador real con consola abierta.
- [ ] No hay violaciones críticas de CSP en flujos:
  - [ ] Home;
  - [ ] Catálogo;
  - [ ] Producto;
  - [ ] Carrito;
  - [ ] Checkout;
  - [ ] Admin;
  - [ ] login/register.
- [ ] Fuentes externas finales agregadas si se activa Google Maps/Places real.
- [ ] Pasar de `Report-Only` a enforcement solo después de QA.
