# AI Agent Operating Rules - Codex y Claude

Fecha: 2026-05-27.

## Objetivo

Este documento define reglas compartidas para que Codex, Claude u otro agente de IA trabajen en el repo de Castillo Auto Parts de forma consistente, sin romper CI, sin pisar cambios de otro agente y sin mezclar alcances.

Antes de modificar codigo, cualquier agente debe leer:

- `docs/project-context.md`
- `docs/project-file-map.md`
- `docs/learning-file.md`
- el documento de fase o feature relacionado
- este documento

## Principios De Trabajo

- El humano es QA / Product Owner tecnico. Los agentes proponen, implementan cambios pequenos y dejan evidencia verificable.
- Cada cambio debe tener un objetivo claro: una feature, un bugfix, un polish visual o una mejora tecnica.
- No mezclar cambios visuales, cambios de negocio, seguridad y refactors en el mismo PR salvo que el humano lo pida.
- No cambiar reglas de negocio sin aprobacion explicita.
- No borrar funcionalidades existentes para simplificar una implementacion.
- No agregar dependencias nuevas sin justificar y pedir aprobacion.
- No tocar secretos reales ni versionar `.env`.
- No almacenar ni simular almacenamiento de tarjetas. Los pagos reales quedan para proveedor aprobado.

## Flujo Antes De Editar

1. Ejecutar `git status --short --branch`.
2. Leer los archivos que se van a tocar y sus tests relacionados.
3. Revisar si existen cambios locales de otro agente o del humano.
4. Si hay cambios no relacionados, no revertirlos ni pisarlos.
5. Definir alcance en una frase: que se cambia y que queda fuera.
6. Implementar el cambio minimo que resuelve el problema.
7. Correr los comandos de verificacion que apliquen.
8. Documentar cambios si afectan reglas, arquitectura, CI, seguridad, QA o decisiones del negocio.

## Reglas De Git Y Branches

- Usar una rama por cambio logico.
- Preferir nombres claros:
  - `codex/...` para trabajo hecho por Codex.
  - `claude/...` para trabajo hecho por Claude.
  - `feature/...` si el humano pidio ese prefijo.
- Antes de cambiar de rama, ejecutar:

```bash
git status --short --branch
```

- Si hay cambios locales, no ejecutar `git checkout`, `git switch`, `pull`, `reset` o `stash` sin entender que archivos se moveran.
- No usar `git reset --hard` ni `git checkout -- <file>` salvo aprobacion explicita del humano.
- Si un checkout falla por cambios locales, detenerse y explicar. No continuar comandos como si el checkout hubiera funcionado.
- No crear PR con cambios mezclados de otra fase.
- No hacer force push salvo instruccion explicita.

## Regla Para Cambios Locales De Otro Agente

Si un agente encuentra cambios que no hizo:

- asumir que son del humano u otro agente;
- leerlos si afectan el mismo archivo o feature;
- trabajar alrededor de ellos sin revertir;
- si hay conflicto real de alcance, pedir decision al humano;
- si son cambios no relacionados, ignorarlos.

## Reglas De CI

La fuente principal es `docs/ci-cd-quality-gates.md`.

Comandos locales recomendados antes de PR:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Cuando el cambio toca flujos de usuario, carrito, checkout, admin, responsive o rutas criticas, tambien correr:

```bash
npm run test:e2e
```

Si falla CI:

1. Reproducir localmente el mismo comando que fallo.
2. Leer el error completo.
3. Corregir la causa raiz, no silenciar el test.
4. Volver a correr el comando fallido.
5. Si el cambio afecta TypeScript o runtime, correr tambien `npm run typecheck`.

## Regla De Alias `@/`

El proyecto usa `@/*` como alias hacia `src/*` en `tsconfig.json`.

Cuando un archivo de app, API route o test importe con `@/`:

- Next.js y TypeScript lo resuelven por `tsconfig.json`.
- Vitest tambien debe resolverlo con `resolve.alias` en `vitest.config.ts`.
- No cambiar imports a rutas relativas solo para arreglar un test si el problema real es configuracion del runner.
- Si se agrega otro runner/herramienta, configurar el mismo alias ahi.

Aprendizaje aplicado:

- El test de `src/app/api/search/route.test.ts` fallo porque Vitest no tenia alias `@`.
- La correccion correcta fue agregar `resolve.alias` en `vitest.config.ts`.

## Reglas De React Y Hooks

- No hacer `setState` sincronico dentro del cuerpo principal de un `useEffect`.
- Un `useEffect` debe sincronizar con sistemas externos, cancelar timers, suscribirse, disparar fetch/debounce o limpiar efectos.
- Si el estado se puede actualizar desde un evento de usuario, hacerlo en el handler del evento.
- Si un estado se puede derivar de props o state existente, derivarlo durante render o con helpers puros.
- Para debounce:
  - el efecto puede crear/cancelar el timer;
  - el handler puede limpiar estado inmediato cuando el input queda invalido;
  - abortar requests anteriores cuando aplique.

Aprendizaje aplicado:

- El autocomplete fallo en lint porque limpiaba `results`, `isOpen` e `isLoading` directamente dentro del `useEffect` cuando el query tenia menos de 2 caracteres.
- La correccion correcta fue mover esa limpieza al handler del input y dejar el efecto para el debounce/fetch.

## Reglas Para Tests Unitarios

- Los tests deben cubrir reglas de negocio, limites y edge cases.
- Si un modulo depende de DB, pagos, email o APIs, mockear el proveedor externo o usar helpers de prueba.
- No depender de datos reales de produccion.
- No bajar cobertura por conveniencia.
- Si se corrige un bug, agregar o ajustar test si el riesgo lo amerita.
- No borrar tests fallando sin explicar y sin aprobacion.

## Reglas Para UI/UX

- No mezclar polish visual con cambios de logica de negocio.
- Durante polish visual, no cambiar rutas, estados, acciones, validaciones ni modelos.
- Mantener texto en espanol correcto para UI publica.
- Revisar mobile, tablet y desktop cuando se toque layout.
- Evitar textos cortados de forma poco profesional.
- Mantener consistencia visual con `docs/design-system.md` y decisiones aprobadas por QA.

## Reglas De Seguridad

- Revisar `docs/security-hardening-plan.md` antes de tocar admin, auth, cookies, checkout, ordenes, pagos, webhooks, DTE o datos personales.
- No exponer secretos en logs, docs o commits.
- No debilitar middleware ni headers de seguridad para pasar tests.
- El proveedor `mock` de pagos es valido para MVP/CI, pero no debe habilitarse como pago real en produccion.
- Proteger rutas admin y datos de orden guest.

## Reglas De Documentacion

Actualizar documentacion cuando cambie alguno de estos puntos:

- regla de negocio;
- arquitectura;
- flujo de CI/CD;
- seguridad;
- modelo de datos;
- decision de producto;
- comportamiento visible para QA;
- aprendizaje que evita repetir un error.

Documentos comunes:

- `docs/learning-file.md` para memoria viva del proyecto.
- `docs/project-file-map.md` para ubicar archivos importantes.
- `docs/mvp-change-log.md` para cambios relevantes del MVP.
- `docs/agent-review-findings-*.md` para auditorias de agentes.
- `docs/ci-cd-quality-gates.md` para CI/CD.

## Handoff Obligatorio

Al terminar un cambio, el agente debe entregar:

- resumen corto de que cambio;
- archivos principales tocados;
- comandos ejecutados y resultado;
- riesgos o pendientes;
- instrucciones para QA si aplica.

Ejemplo:

```text
Cambio: se corrigio el alias de Vitest para resolver imports @/.
Archivos: vitest.config.ts.
Verificacion: npm test, npm run lint, npm run typecheck.
Pendiente: ninguno.
QA: reintentar checks del PR en GitHub Actions.
```

## Checklist Rapido Para Agentes

Antes de PR:

- `git status --short --branch` revisado.
- Alcance del cambio esta claro.
- No hay cambios no relacionados.
- No se cambiaron reglas de negocio sin aprobacion.
- No se agregaron dependencias sin aprobacion.
- Lint pasa si se toco codigo.
- Typecheck pasa si se toco TS/TSX.
- Tests pasan si se toco logica.
- Build pasa si se toco app/rutas/config.
- Docs actualizados si cambio una decision o aprendizaje.

