# CI/CD Quality Gates

Fecha: 2026-05-21.

## Objetivo

Evitar merges a `main` cuando el MVP rompe lint, TypeScript, Prisma, pruebas unitarias, build o pruebas E2E.

Este documento cubre CI. El CD/deploy automatico queda pendiente hasta que pagos reales, DTE, dominio, secretos y ambiente productivo esten listos.

## Workflow Implementado

Archivo:

- `.github/workflows/ci.yml`

Triggers:

- `pull_request` hacia `main`;
- `push` a `main`;
- `merge_group` para compatibilidad futura con merge queue.

Jobs:

- `quality`: instala dependencias, genera Prisma Client, valida schema, prepara PostgreSQL, corre lint, typecheck, unit tests y build.
- `e2e`: instala Playwright Chromium, prepara PostgreSQL con seed y corre `npm run test:e2e`.

Servicios:

- PostgreSQL 16 Alpine como service container de GitHub Actions.

Variables de entorno CI:

- `DATABASE_URL` apunta al PostgreSQL del job.
- `PAYMENT_PROVIDER=mock` porque pagos reales siguen fuera del MVP actual.
- `EMAIL_PROVIDER=console` para no enviar emails reales.
- secretos admin/cart son valores CI dummy de longitud suficiente.

## Por Que Separar `quality` y `e2e`

- `quality` falla rapido si hay errores de codigo, tipos, schema o build.
- `e2e` tarda mas porque instala navegador y levanta la app.
- GitHub puede exigir ambos checks antes de mergear.
- Si E2E falla, se suben artefactos de Playwright para inspeccion.

## Checks Obligatorios Sugeridos

En GitHub, despues de mergear este workflow a `main`, configurar branch ruleset para exigir:

- `quality`
- `e2e`

En algunas vistas de GitHub pueden aparecer como:

- `CI / quality`
- `CI / e2e`

## Configuracion En GitHub

Requiere permisos de admin o maintainer del repo.

1. Ir a GitHub.
2. Abrir `EliezerCast1llo/castillo-auto-parts`.
3. Ir a `Settings`.
4. Ir a `Rules`.
5. Crear un `New branch ruleset`.
6. Nombre sugerido: `Protect main`.
7. `Enforcement status`: `Active`.
8. Target branch: `main`.
9. Activar:
   - `Require a pull request before merging`;
   - `Require status checks to pass`;
   - `Require branches to be up to date before merging`;
   - `Block force pushes`;
   - `Block deletions`.
10. Seleccionar los checks `quality` y `e2e`.
11. Guardar.

## Flujo De Trabajo Esperado

1. Codex o un agente crea una rama `codex/...`.
2. Implementa cambios pequenos y revisables.
3. Corre pruebas localmente cuando aplique.
4. Abre PR contra `main`.
5. GitHub Actions ejecuta `quality` y `e2e`.
6. QA/PO humano revisa la evidencia.
7. GitHub solo permite merge si los checks requeridos pasan.

## Comandos Locales Equivalentes

Antes de abrir un PR:

```bash
npm run prisma:generate
npx prisma validate
npm run db:push
npm run db:seed
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## Riesgos Y Pendientes

- E2E usa seed data y puede consumir stock si los tests mutan datos. A futuro conviene una base aislada por run o seed reset por test.
- El proveedor `mock` es correcto en CI del MVP, pero no debe usarse como pago real en produccion.
- Cuando se active Vercel, el CD debe depender de que `quality` y `e2e` pasen.
- Cuando existan pagos reales, agregar job separado para pruebas de webhook/idempotencia con fixtures del proveedor.
- Cuando se agregue DTE, agregar pruebas de generacion/estado fiscal sin enviar documentos reales.
- En macOS, si el repo vive en Documents/iCloud y algun comando se queda sin salida, revisar si `.env`, `.env.example`, `next-env.d.ts` o `tsconfig.tsbuildinfo` estan marcados como `dataless`. Los caches generados se pueden borrar; `.env` debe restaurarse sin leer ni sobrescribir secretos.

## Definicion De Done Para CI

- Workflow existe en `.github/workflows/ci.yml`.
- PR contra `main` ejecuta `quality` y `e2e`.
- Ambos checks pasan.
- Branch ruleset de `main` exige ambos checks antes de merge.
- PR template recuerda ejecutar/verificar los checks.
