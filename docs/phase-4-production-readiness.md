# Fase 4 - Cumplimiento y preparación para producción

Fecha: 2026-06-24.

## Alcance ejecutado

Esta fase prepara el MVP para producción sin activar ventas reales todavía.

Tareas del plan:

- `T-043`: checklist operativo para Vercel, Cloudflare/R2, Resend/DNS y ambientes.
- `T-041`: preparación técnica para connection pooling con `DATABASE_URL` pooled y `DIRECT_DATABASE_URL` directa.
- `T-042`: CSP inicial en modo `Content-Security-Policy-Report-Only` con nonce por request.
- `T-040`: puente manual/documentado para DTE; no se implementa emisión real sin contador/proveedor.

## Cambios técnicos

### Pooling PostgreSQL

`prisma/schema.prisma` ahora declara:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}
```

Regla:

- `DATABASE_URL`: runtime de la app, idealmente conexión pooled/PgBouncer/Accelerate.
- `DIRECT_DATABASE_URL`: conexión directa para `prisma migrate deploy`, introspección y tooling.
- En local y CI pueden apuntar a la misma base.

### CSP Report-Only

`middleware.ts` ahora genera un nonce por request y agrega:

- `x-nonce`;
- `Content-Security-Policy-Report-Only`;
- `Content-Security-Policy` solo en request headers para que Next pueda leer el patrón de nonce.

El modo es observable, no bloqueante. El paso a enforcement debe hacerse en una tarea futura después de revisar violaciones reales en navegador/preview.

### DTE

No se integró proveedor DTE ni sandbox de Hacienda. Se documenta el puente manual en `docs/phase-4-dte-manual-bridge.md`.

## Gates pendientes antes de producción comercial

- Confirmar proveedor de BD y connection string pooled.
- Configurar `DIRECT_DATABASE_URL` en Vercel.
- Revisar CSP en preview con navegador real y consola abierta.
- Definir con contador:
  - tipo de DTE;
  - tratamiento fiscal del envío;
  - datos mínimos de cliente;
  - momento de emisión;
  - proceso de contingencia si Hacienda/proveedor falla.
- Validar Resend con dominio real, SPF, DKIM y DMARC.
- Configurar R2 con dominio propio y permisos mínimos.

## Fuentes oficiales usadas

- Next.js CSP: https://nextjs.org/docs/app/guides/content-security-policy
- Prisma config/directUrl: https://www.prisma.io/docs/orm/reference/prisma-config-reference
- Vercel environment variables: https://vercel.com/docs/environment-variables
- Cloudflare R2 public buckets: https://developers.cloudflare.com/r2/buckets/public-buckets/
- Cloudflare R2 tokens: https://developers.cloudflare.com/r2/api/tokens/
- Resend domain DNS: https://resend.com/docs/dashboard/domains/introduction
- Ministerio de Hacienda DTE: https://www.mh.gob.sv/webinar-sobre-el-uso-correcto-de-la-factura-electronica/
