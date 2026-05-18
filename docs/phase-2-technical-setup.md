# Phase 2 Technical Setup

## Estado

- Fecha: 2026-05-15.
- Rama local: `codex/project-foundation`.
- Estado: base tecnica inicial creada.

## Stack instalado

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- Prisma.
- PostgreSQL como proveedor configurado.
- Vitest para pruebas unitarias.
- ESLint.
- Estructura inicial de librerias para pagos y DTE.

## Archivos principales

- `package.json`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
- `src/data/mock-products.ts`
- `src/lib/money.ts`
- `src/lib/money.test.ts`
- `src/lib/db.ts`
- `src/lib/payments/provider.ts`
- `src/lib/invoices/provider.ts`
- `prisma/schema.prisma`
- `.env.example`

## Decisiones tecnicas

- Se usa Prisma 6 estable para evitar complejidad prematura de configuracion de Prisma 7.
- La integracion real de Wompi se hara detras de `PaymentProvider`.
- DTE inicia en modo manual/semiautomatico, con `InvoiceProvider` listo para evolucionar.
- La home inicial usa mock data.
- `Castillo Auto Parts` queda como codename tecnico, no marca final aprobada.

## Verificaciones ejecutadas

- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm test`: OK, 2 pruebas unitarias.
- `npx prisma validate`: OK.
- `npm audit`: OK, 0 vulnerabilidades.
- `npm run build`: OK.
- `curl -I http://localhost:3000`: OK, HTTP 200.

## Servidor local

Servidor levantado en:

```txt
http://localhost:3000
```

## Pendientes tecnicos inmediatos

1. Crear repo remoto en GitHub y conectar `origin`.
2. Crear GitHub Project.
3. Decidir nombre publico final.
4. Reemplazar placeholders de imagen con assets reales o generados.
5. Crear rutas `/catalog`, `/product/[slug]`, `/cart`, `/checkout` y `/admin`.
6. Crear seed Prisma realista con mock products.
7. Agregar Playwright cuando existan flujos navegables.

