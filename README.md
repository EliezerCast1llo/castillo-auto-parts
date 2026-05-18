# Castillo Auto Parts

E-commerce de repuestos automotrices para El Salvador.

## Estado

Proyecto en fase inicial. La documentacion vive en `docs/` y define el producto, arquitectura, QA, roadmap, investigacion de mercado, pagos, DTE, backlog y aprendizajes del proyecto.

## Decisiones actuales

- Mercado inicial: San Salvador y Santa Tecla.
- Moneda: USD.
- IVA: 13%, precios visibles con IVA incluido.
- Pago objetivo: Wompi SV.
- Fallback de pago: BAC Compra Click.
- DTE inicial: proceso semiautomatico.
- Data inicial: mock data mientras se valida inventario real.
- Marca: `Castillo Auto Parts` queda como codename/propuesta provisional, pendiente de validacion legal/comercial por coincidencias encontradas.
- Catalogo: lee desde PostgreSQL/Prisma cuando hay base de datos disponible y cae a mock data si la base aun no esta levantada.

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

Notas:

- La app sigue cargando con mock data si PostgreSQL no esta disponible.
- En esta Mac no se pudo ejecutar el seed real porque `docker` no esta instalado.

## Documentos clave

- `docs/project-context.md`
- `docs/learning-file.md`
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
