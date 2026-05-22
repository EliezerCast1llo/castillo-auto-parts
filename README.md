# Castillo Auto Parts

E-commerce de repuestos automotrices para El Salvador.

## Estado

MVP funcional local en etapa guest-first. La fuente rapida de estado actual es
`docs/mvp-current-status.md`; los documentos de fase en `docs/` conservan contexto,
decisiones y backlog historico.

## Decisiones actuales

- Mercado inicial: San Salvador y Santa Tecla.
- Moneda: USD.
- IVA: 13%, precios visibles con IVA incluido.
- Pago objetivo: Wompi SV.
- Fallback de pago: BAC Compra Click.
- DTE inicial: proceso semiautomatico.
- Data inicial: mock data mientras se valida inventario real.
- Marca: `Castillo Auto Parts` queda como codename/propuesta provisional, pendiente de validacion legal/comercial por coincidencias encontradas.
- Catalogo: lee desde PostgreSQL/Prisma cuando hay base de datos disponible. En desarrollo puede usar mock fallback; en produccion no muestra inventario simulado si la base falla.
- Checkout: compra guest con retiro en bodega o envio local con mapa/pin.
- Pagos: proveedor `mock` para QA local; pagos reales quedan para el gate de produccion.

## Setup local

1. Instalar dependencias:

```bash
npm install
```

2. Crear `.env` desde `.env.example` y ajustar `DATABASE_URL` si aplica.

3. Levantar PostgreSQL local:

```bash
docker compose up -d postgres
```

4. Sincronizar schema y cargar seed:

```bash
npm run db:push
npm run db:seed
```

5. Ejecutar la app:

```bash
npm run dev
```

6. Ejecutar pruebas:

```bash
npm run prisma:generate
npx prisma validate
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Notas:

- Docker Desktop ya esta instalado en esta Mac y PostgreSQL corre via `docker compose`.
- `npm run test:e2e` crea un schema PostgreSQL temporal, corre `db push`, seed, build, Playwright, y luego borra ese schema.
- El runner E2E usa `http://localhost:3100` por defecto para no chocar con `npm run dev`; se puede cambiar con `E2E_PORT`.
- Para depurar contra la base actual sin preparar schema aislado, usar `npm run test:e2e:raw`.
- GitHub Actions corre `quality` y `e2e` en cada PR/push a `main`. Ver `docs/ci-cd-quality-gates.md`.

## Documentos clave

- `docs/project-context.md`
- `docs/mvp-current-status.md`
- `docs/learning-file.md`
- `docs/project-file-map.md`
- `docs/mvp-change-log.md`
- `docs/ci-cd-quality-gates.md`
- `docs/agent-review-findings-2026-05-21.md`
- `docs/product-requirements.md`
- `docs/technical-architecture.md`
- `docs/phase-3-data-persistence.md`
- `docs/phase-1-market-research-report.md`
- `docs/phase-1-market-validation-protocol.md`
- `docs/phase-1-payments-dte-analysis.md`
- `docs/phase-1-brand-ux-direction.md`
- `docs/phase-1-name-clearance.md`
- `docs/phase-1-sourcing-plan.md`
- `docs/phase-1-mvp-backlog.md`
