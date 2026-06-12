# Plan de trabajo — Castillo Auto Parts

> Derivado de [docs/auditoria.md](auditoria.md). Organizado por fases en orden de prioridad.
> Cada tarea indica: **objetivo**, **archivos**, **criterios de aceptación**, **cómo verificar**, **dependencias** y **modelo de IA recomendado** (con justificación de una línea).
> **Fecha:** 2026-06-11.

## Cómo leer este plan (para QA)

- Las fases están en orden: haz primero la **Fase 0** y la **Fase 1** (rápidas y de alto impacto), luego los **bloqueantes** de la Fase 2, y no lances a producción hasta cerrar la Fase 4.
- "Modelo recomendado" se refiere a qué IA conviene usar para ejecutar la tarea (ver la guía de orquestación al final). En una línea: **lo crítico que toca dinero, criptografía o autorización transversal → Fable 5 / Opus 4.8**; **la mayoría del trabajo bien definido → Sonnet 4.6**; **lo mecánico → Haiku 4.5**.
- "Cómo verificar" siempre incluye correr las puertas de calidad que ya existen: `npm run lint`, `npm run typecheck`, `npm test` y `npm run test:e2e`.

---

## Fase 0 — Quick wins (alto impacto, bajo esfuerzo)

### T-001 · Verificación de rol en endpoints de imágenes admin (H-001)
- **Objetivo:** que solo `ADMIN` y `MARKETING` puedan subir/borrar imágenes; devolver 403 a otros roles.
- **Archivos:** `src/app/api/admin/upload-image/route.ts`, `src/app/api/admin/delete-image/route.ts`, helper nuevo en `src/lib/admin-auth.ts` (variante que devuelve booleano/usuario sin `redirect`, apta para route handlers).
- **Criterios de aceptación:** una sesión con rol `SALES`/`SUPPORT`/`ACCOUNTING`/`WAREHOUSE` recibe 403; `ADMIN`/`MARKETING` siguen funcionando; sin sesión → 401.
- **Cómo verificar:** test de integración del route handler con tokens de cada rol; `npm test`.
- **Dependencias:** ninguna.
- **Modelo recomendado:** **Sonnet 4.6** — fix de autorización con criterios claros y acotados.

### T-002 · Registrar auditoría en subida/borrado de imágenes (H-018)
- **Objetivo:** escribir `AdminAuditLog` (`image.uploaded`/`image.deleted`) con usuario admin y producto.
- **Archivos:** los dos route handlers de imágenes; `src/lib/admin-audit.ts`.
- **Criterios de aceptación:** cada subida/borrado exitoso crea una fila de auditoría con `adminUserId`, `adminUserEmail`, `entityType=ProductImage`, `entityId`.
- **Cómo verificar:** test que comprueba la fila creada; revisión en `/admin/audit`.
- **Dependencias:** T-001 (reutiliza el usuario autenticado).
- **Modelo recomendado:** **Haiku 4.5** — patrón de auditoría ya existente, replicación mecánica.

### T-003 · Restringir `remotePatterns` de imágenes y limitar optimización (H-013)
- **Objetivo:** en producción servir imágenes solo desde R2; configurar `minimumCacheTTL`/`formats`.
- **Archivos:** `next.config.ts`.
- **Criterios de aceptación:** en producción Unsplash no está permitido (o restringido por `pathname`); R2 sí; `next build` pasa.
- **Cómo verificar:** `npm run build`; comprobar que una imagen de producto R2 carga y una URL Unsplash arbitraria es rechazada en prod.
- **Dependencias:** ninguna.
- **Modelo recomendado:** **Haiku 4.5** — cambio de configuración acotado y bien especificado.

### T-004 · Añadir `server-only` a módulos con secretos (H-015)
- **Objetivo:** que el build falle si un módulo de servidor se importa desde el cliente.
- **Archivos:** `src/lib/r2.ts`, `src/lib/auth.ts`, `src/lib/admin-session.ts`, `src/lib/admin-credentials.ts`, `src/lib/db.ts`.
- **Criterios de aceptación:** `import "server-only";` al inicio de cada módulo; `npm run build` y `typecheck` siguen pasando.
- **Cómo verificar:** `npm run build`; (opcional) un import de prueba desde un Client Component debe romper el build.
- **Dependencias:** instalar `server-only` (dep ligera).
- **Modelo recomendado:** **Haiku 4.5** — cambio mecánico repetitivo.

### T-005 · Restricción de la API key de Google Maps documentada (H-017)
- **Objetivo:** documentar y aplicar restricción por referrer/API cuando se active Maps real.
- **Archivos:** `.env.example` (comentario), `docs/` (nota de operación).
- **Criterios de aceptación:** `.env.example` indica explícitamente que la key debe restringirse por dominio en Google Cloud.
- **Cómo verificar:** revisión de documentación.
- **Dependencias:** ninguna (la restricción real es trabajo de panel, no de código).
- **Modelo recomendado:** **Haiku 4.5** — edición de documentación trivial.

---

## Fase 1 — Bloqueantes de seguridad e integridad de datos

### T-010 · Rate limiting distribuido en auth de clientes (H-003)
- **Objetivo:** aplicar rate limit (Upstash/Redis) a login de clientes, registro, forgot-password y reset-password; hacer Redis obligatorio en producción.
- **Archivos:** `src/app/auth/login/actions.ts`, `src/app/auth/register/actions.ts`, `src/app/auth/forgot-password/actions.ts`, `src/app/auth/reset-password/[token]/actions.ts`, `src/lib/rate-limit-redis.ts` (factories nuevas), validación de entorno en arranque.
- **Criterios de aceptación:** tras N intentos fallidos por IP (y por email objetivo en forgot-password) se bloquea con backoff; en producción, si faltan `UPSTASH_*`, la app falla al arrancar (igual que con `NEXTAUTH_SECRET`); el forgot-password sigue sin revelar si el email existe.
- **Cómo verificar:** tests unitarios del limiter (ya hay `rate-limit.test.ts`); prueba manual de bloqueo; E2E de login fallido repetido.
- **Dependencias:** cuenta Upstash (config de entorno).
- **Modelo recomendado:** **Sonnet 4.6** — bien definido, con infraestructura de limiter ya existente.

### T-011 · Revalidar rol e `isActive`; acortar vida de sesión (H-002)
- **Objetivo:** evitar la ventana de persistencia de privilegios en clientes y admin.
- **Archivos:** `src/lib/auth.ts` (callbacks `jwt`/`session`, `session.maxAge`), `src/lib/admin-auth.ts` (`requireAdminRole` revalida contra BD), posible columna `sessionsValidAfter` en `prisma/schema.prisma`.
- **Criterios de aceptación:** un usuario desactivado (`isActive=false`) pierde acceso en el siguiente request (o dentro de una ventana de caché corta, p. ej. ≤60 s); un cambio de rol surte efecto rápido; `session.maxAge` de clientes reducido (p. ej. 7 días).
- **Cómo verificar:** test que desactiva un usuario y comprueba que su sesión deja de autorizar; E2E.
- **Dependencias:** si se añade columna, depende de la estrategia de migraciones (T-031).
- **Modelo recomendado:** **Fable 5 / Opus 4.8** — toca el corazón de la autenticación; un error aquí abre o cierra el acceso a todos.

### T-012 · Diseño y endurecimiento de auth/JWT y secretos (H-009, refuerzo H-002)
- **Objetivo:** fijar versión exacta de NextAuth, revisar callbacks, plan de actualización a v5 estable, confirmar rotación/origen de `AUTH_SECRET`/`ADMIN_ACCESS_SECRET`.
- **Archivos:** `package.json`, `src/lib/auth.ts`, documentación de operación.
- **Criterios de aceptación:** versión de `next-auth` fijada (sin `^`); documento de rotación de secretos; callbacks revisados sin lógica de autorización incorrecta.
- **Cómo verificar:** revisión; `npm ci` reproducible; E2E de auth sin regresiones.
- **Dependencias:** T-011.
- **Modelo recomendado:** **Fable 5 / Opus 4.8** — decisión de seguridad transversal sobre la capa de identidad.

### T-013 · Verificar `email_verified` en Google OAuth (H-016)
- **Objetivo:** rechazar logins de Google con email no verificado; mantener account-linking automático desactivado.
- **Archivos:** `src/lib/auth.ts` (callback `signIn`).
- **Criterios de aceptación:** login Google con `email_verified !== true` es rechazado; el resto funciona.
- **Cómo verificar:** test unitario del callback con perfiles simulados.
- **Dependencias:** T-012 (mismo archivo, coordinar).
- **Modelo recomendado:** **Sonnet 4.6** — cambio acotado con criterio claro.

### T-014 · Saneamiento de subida a R2: UUID + validación de contenido (H-019)
- **Objetivo:** clave de objeto con `crypto.randomUUID()`, `productId` validado como cuid, verificación de magic bytes del archivo.
- **Archivos:** `src/lib/r2.ts`, `src/app/api/admin/upload-image/route.ts`.
- **Criterios de aceptación:** no hay colisión por aleatoriedad débil; un archivo con MIME falsificado (no-imagen real) es rechazado.
- **Cómo verificar:** tests con archivos válidos/falsificados.
- **Dependencias:** T-001 (mismo handler).
- **Modelo recomendado:** **Sonnet 4.6** — lógica clara de validación.

---

## Fase 2 — Pagos, webhooks y concurrencia de inventario (núcleo del dinero)

> **No delegar a modelos económicos.** Aquí un bug = pedidos cobrados y no entregados, o entregados y no cobrados.

### T-020 · Rediseño del flujo de pago asíncrono con orden PENDING (H-007)
- **Objetivo:** crear la orden en estado `PENDING`, generar el link de pago, y diferir el cumplimiento al webhook.
- **Archivos:** `src/lib/orders.ts`, `src/app/checkout/actions.ts`, `src/lib/payments/provider.ts`, máquina de estados en `src/lib/admin-orders.ts` (añadir transiciones de pago), `prisma/schema.prisma` (estado `PENDING` en `Order`/uso de `Payment.status`).
- **Criterios de aceptación:** el checkout ya no asume `PAID` síncrono; se crea orden `PENDING`; el cliente ve "confirmando pago"; el cumplimiento (stock definitivo, email, `PAID`) ocurre solo tras confirmación del webhook.
- **Cómo verificar:** tests de la máquina de estados; E2E del flujo con proveedor simulado asíncrono.
- **Dependencias:** T-021 (webhook), T-022 (reserva de stock), T-031 (migraciones).
- **Modelo recomendado:** **Fable 5 / Opus 4.8** — arquitectura de pagos, alto riesgo financiero.

### T-021 · Integración Wompi + webhook como fuente de verdad (H-007)
- **Objetivo:** implementar el provider Wompi y `POST /api/webhooks/wompi` con firma, idempotencia y validación de monto en servidor.
- **Archivos:** `src/lib/payments/wompi-provider.ts` (nuevo), `src/app/api/webhooks/wompi/route.ts` (nuevo), `src/lib/payments/index.ts` (registrar provider), uso de `PaymentEvent` con índice único en `externalEventId`.
- **Criterios de aceptación:**
  - La **firma/hash de integridad** del webhook se verifica con el secreto en el servidor; payload no verificado → 401 y no se procesa.
  - **Idempotencia:** un `externalEventId` repetido no vuelve a cumplir el pedido (índice único + verificación).
  - **Validación de monto:** se compara el monto pagado contra el total recalculado en servidor; discrepancia → no se marca `PAID`, se alerta.
  - La **firma de integridad de Wompi** para iniciar el pago se calcula en el servidor, nunca en el cliente.
  - El webhook es la única vía que transiciona a `PAID`; el redirect del navegador no cumple el pedido.
  - El provider `mock` sigue bloqueado en producción.
- **Cómo verificar:** tests de verificación de firma (válida/ inválida), de idempotencia (evento duplicado) y de monto incorrecto; pruebas en el **sandbox de Wompi**.
- **Dependencias:** T-020; credenciales y `WOMPI_WEBHOOK_SECRET` en entorno.
- **Modelo recomendado:** **Fable 5 / Opus 4.8** — verificación criptográfica de webhooks y dinero real; cero margen de error.

### T-022 · Ciclo de reserva de stock (reservar → confirmar → liberar) (H-008)
- **Objetivo:** usar `quantityReserved` para reservar al crear la orden PENDING y descontar al confirmar el pago, con liberación en fallo/expiración.
- **Archivos:** `src/lib/orders.ts`, `src/lib/admin-orders.ts`, posible job/TTL de expiración de reservas.
- **Criterios de aceptación:** reserva atómica con `WHERE quantityOnHand - quantityReserved >= cantidad`; confirmación mueve de reservado a descontado; expiración/fallo libera; no hay sobreventa ni stock bloqueado indefinidamente.
- **Cómo verificar:** **test de condición de carrera** (dos compras concurrentes del último ítem: una gana, otra falla); test de expiración de reserva.
- **Dependencias:** T-020, T-021.
- **Modelo recomendado:** **Fable 5 / Opus 4.8** — concurrencia atómica; los errores aquí causan sobreventa.

### T-023 · Tests de rutas críticas de seguridad de pagos/inventario (H-007, H-008, soporta H-001/H-002)
- **Objetivo:** cobertura de los caminos críticos: verificación de firma de webhook, idempotencia, condición de carrera de inventario, autorización en server actions.
- **Archivos:** nuevos tests en `src/lib/payments/*.test.ts`, `src/lib/orders` tests, E2E.
- **Criterios de aceptación:** existen tests que fallan si se rompe la firma del webhook, si se permite doble cumplimiento, o si se sobrevende.
- **Cómo verificar:** `npm test` y `npm run test:e2e` con los nuevos casos.
- **Dependencias:** T-020/T-021/T-022.
- **Modelo recomendado:** **Sonnet 4.6** — escribir tests sobre una arquitectura ya diseñada por el modelo crítico.

---

## Fase 3 — Bugs funcionales y consistencia

### T-030 · Consistencia del IVA (envío / línea vs. total) (H-012)
- **Objetivo:** calcular el IVA de forma consistente y documentada; `Order.taxCents == Σ OrderItem.taxCents (+ IVA de envío si aplica)`.
- **Archivos:** `src/lib/checkout.ts`, `src/lib/orders.ts`, `src/lib/money.ts`, tests de redondeo.
- **Criterios de aceptación:** la suma de impuestos de línea concuerda con el impuesto de la orden; el tratamiento del envío está definido por escrito; tests de redondeo en centavos.
- **Cómo verificar:** tests unitarios de `money`/`checkout`; revisión con el criterio fiscal de T-040.
- **Dependencias:** decisión fiscal de T-040 (DTE) sobre el envío.
- **Modelo recomendado:** **Sonnet 4.6** — lógica numérica acotada (validar la regla fiscal con T-040 antes).

### T-031 · Adoptar migraciones Prisma (`migrate deploy`) (H-006)
- **Objetivo:** sustituir `db push` por migraciones versionadas; baseline desde el schema actual.
- **Archivos:** `prisma/migrations/**` (nuevo), `.github/workflows/ci.yml` (usar `prisma migrate deploy`), `package.json` scripts.
- **Criterios de aceptación:** existe migración inicial; CI aplica `migrate deploy`; documentación de cómo crear/aplicar migraciones.
- **Cómo verificar:** CI verde aplicando migraciones sobre una BD limpia; `prisma migrate status` consistente.
- **Dependencias:** ninguna técnica, pero **debe coordinarse** con cualquier tarea que cambie el schema (T-011, T-020, T-022, T-011).
- **Modelo recomendado:** **Sonnet 4.6** — proceso bien definido; cuidado con el baseline.

---

## Fase 4 — Cumplimiento y preparación para producción

### T-040 · Facturación electrónica DTE (H-004) — **BLOQUEANTE**
- **Objetivo:** emitir DTE ligado a la confirmación de pago; definir tipo de documento y régimen con un contador.
- **Archivos:** `src/lib/invoices/provider.ts`, provider DTE nuevo, integración con el webhook de pago (T-021), modelo `InvoiceDte`.
- **Criterios de aceptación:** (1) alcance fiscal confirmado por un contador salvadoreño; (2) generación/firma/transmisión contra el ambiente de pruebas de Hacienda; (3) estado `PENDING_MANUAL` documentado como puente operativo mientras se certifica.
- **Cómo verificar:** pruebas contra el sandbox de Hacienda; revisión contable.
- **Dependencias:** T-021 (DTE se dispara al confirmar pago); asesoría contable externa.
- **Modelo recomendado:** **Fable 5 / Opus 4.8** — diseño del esquema y flujo DTE; requisito legal complejo. **No delegar.**

### T-041 · Connection pooling de PostgreSQL en serverless (H-005) — **BLOQUEANTE**
- **Objetivo:** conexión pooled para runtime y `directUrl` para migraciones.
- **Archivos:** `prisma/schema.prisma` (`url` pooled + `directUrl`), `.env.example`, variables en Vercel.
- **Criterios de aceptación:** el runtime usa pooler (Accelerate/PgBouncer/puerto pooled); migraciones usan conexión directa; sin errores "too many connections" bajo carga.
- **Cómo verificar:** prueba de carga simple en preview; revisar métricas de conexiones del proveedor.
- **Dependencias:** elección de proveedor de BD gestionada; T-031 (migraciones usan `directUrl`).
- **Modelo recomendado:** **Sonnet 4.6** — configuración bien definida (la decisión de proveedor es del equipo).

### T-042 · Content-Security-Policy con nonces (H-010)
- **Objetivo:** CSP efectiva, empezando en `Report-Only`, luego enforce; incluir `frame-ancestors 'none'`.
- **Archivos:** `middleware.ts` (nonce por request), `next.config.ts`/headers, layout para propagar el nonce.
- **Criterios de aceptación:** CSP presente; la app funciona sin violaciones en `Report-Only`; al endurecer, no se rompen scripts de Next/Tailwind.
- **Cómo verificar:** revisar cabeceras y la consola del navegador (sin violaciones); E2E de páginas clave.
- **Dependencias:** coordinar con el middleware admin existente.
- **Modelo recomendado:** **Fable 5 / Opus 4.8** — la CSP con nonces en Next es delicada y fácil de romper; conviene el modelo más capaz.

### T-043 · Verificación de configuración de Vercel/Cloudflare/Resend (notas de auditoría)
- **Objetivo:** confirmar lo que no es verificable desde el código: separación de variables preview/producción en Vercel, permiso mínimo de credenciales R2, listado de objetos del bucket deshabilitado, SPF/DKIM/DMARC del dominio.
- **Archivos:** documentación de operación (`docs/`), no código.
- **Criterios de aceptación:** checklist de operación confirmado: variables separadas, token R2 limitado al bucket, bucket sin listado público, DNS de email configurado.
- **Cómo verificar:** revisión manual en los paneles; envío de email de prueba que no caiga en spam.
- **Dependencias:** accesos a Vercel/Cloudflare/Resend/DNS.
- **Modelo recomendado:** **Haiku 4.5** — redacción del checklist (la ejecución es manual del equipo).

---

## Fase 5 — Calidad, performance, testing y SEO

### T-050 · Índices de BD en FKs y columnas de filtrado (H-011)
- **Objetivo:** añadir índices a `Product(categoryId, brand, isActive, isFeatured)` y FKs de `ProductImage`/`CartItem`/`OrderItem`.
- **Archivos:** `prisma/schema.prisma`, migración correspondiente.
- **Criterios de aceptación:** índices creados vía migración; consultas de catálogo usan índices (`EXPLAIN`).
- **Cómo verificar:** `prisma migrate`; `EXPLAIN ANALYZE` en consultas de catálogo.
- **Dependencias:** T-031 (migraciones).
- **Modelo recomendado:** **Sonnet 4.6** — cambio de schema con criterio claro.

### T-051 · Búsqueda en BD para `/api/search` + rate limit ligero (H-014)
- **Objetivo:** consultar la BD con `where`/`take`/`select` en vez de cargar todo el catálogo a memoria; rate limit por IP.
- **Archivos:** `src/app/api/search/route.ts`, `src/data/products.ts` (función de búsqueda con `select` mínimo).
- **Criterios de aceptación:** el endpoint no carga toda la tabla; devuelve los mismos resultados que hoy para casos de prueba; tiene rate limit.
- **Cómo verificar:** `route.test.ts` ampliado; prueba de carga ligera.
- **Dependencias:** T-050 (índices), T-010 (infra de rate limit).
- **Modelo recomendado:** **Sonnet 4.6** — optimización acotada con tests existentes.

### T-052 · Endurecer entregabilidad de email y anti-bombing (refuerzo H-003)
- **Objetivo:** asegurar que producción no caiga en el provider `console`; rate limit específico de envíos; documentar SPF/DKIM/DMARC.
- **Archivos:** `src/lib/email/index.ts` (validación de provider en prod), forgot-password (rate limit), docs.
- **Criterios de aceptación:** en producción con `EMAIL_PROVIDER` mal configurado, se falla ruidosamente (no silencioso); reset de contraseña limitado por IP+email.
- **Cómo verificar:** test de selección de provider; prueba manual.
- **Dependencias:** T-010.
- **Modelo recomendado:** **Sonnet 4.6** — bien definido.

### T-053 · Tests E2E de autorización por rol en el panel admin
- **Objetivo:** cubrir que cada ruta/acción admin respeta su matriz de roles (incluye regresión de H-001).
- **Archivos:** `tests/e2e/admin.spec.ts` (ampliar).
- **Criterios de aceptación:** existen pruebas que fallan si un rol accede a algo que no le corresponde.
- **Cómo verificar:** `npm run test:e2e`.
- **Dependencias:** T-001.
- **Modelo recomendado:** **Sonnet 4.6** — escritura de pruebas con criterios claros.

### T-054 · Limpieza menor y SEO
- **Objetivo:** ajustes de copy/metadatos, `robots`/`sitemap`, formato; sin cambios de lógica.
- **Archivos:** `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/layout.tsx`, textos varios.
- **Criterios de aceptación:** metadatos correctos; `noindex` en rutas privadas (ya presente en `/account/orders`); build verde.
- **Cómo verificar:** `npm run build`; revisión de `sitemap.xml`/`robots.txt`.
- **Dependencias:** ninguna.
- **Modelo recomendado:** **Haiku 4.5** — cambios triviales y mecánicos.

---

## Mapa de dependencias (orden sugerido de ejecución)

```
Fase 0 (T-001…T-005)        → independientes, hacer ya
        │
        ▼
T-031 (migraciones) ──┬─────────────────────────────┐
        │             │                              │
        ▼             ▼                              ▼
T-010 rate limit   T-011/T-012 auth            T-050 índices
        │             │
        ▼             ▼
T-020 orden PENDING ─► T-021 webhook Wompi ─► T-022 reserva stock ─► T-023 tests
                                  │
                                  ▼
                          T-040 DTE (bloqueante)
T-041 pooling (bloqueante) ── independiente, antes de producción
T-042 CSP ── independiente
```

---

## Fase 5 del prompt — Recomendación de orquestación (con qué IA ejecutar)

### Criterio general

- **Fable 5 / Opus 4.8 — lo que NO se delega a modelos económicos** (crítico, dinero, criptografía, autorización transversal):
  - **T-021** integración Wompi + verificación de webhooks (firma, idempotencia, monto).
  - **T-022** lógica atómica de reserva/descuento de inventario.
  - **T-020** rediseño del flujo de pago asíncrono.
  - **T-011 / T-012** endurecimiento de NextAuth/JWT y revalidación de privilegios.
  - **T-040** esquema y flujo de DTE.
  - **T-042** diseño de la CSP con nonces.
  - Cualquier **refactor de autorización transversal**.
  - *Justificación:* un error en estas tareas se traduce en pérdida de dinero, escalada de privilegios o incumplimiento legal; el costo del modelo es despreciable frente al costo de la falla.

- **Sonnet 4.6 — la mayoría del trabajo (complejidad media, bien definida):**
  - Fixes de autorización con criterios claros (**T-001, T-013, T-014**), rate limiting (**T-010, T-052**), índices y consultas Prisma (**T-050, T-051**), migraciones (**T-031**), pooling (**T-041**), consistencia de IVA (**T-030**), y **toda la escritura de tests** sobre arquitecturas ya diseñadas (**T-023, T-053**).
  - *Justificación:* excelente balance capacidad/costo para tareas acotadas con criterios de aceptación explícitos.

- **Haiku 4.5 — trivial/mecánico, criterios exactos:**
  - Auditoría replicada (**T-002**), config de imágenes (**T-003**), `server-only` (**T-004**), documentación/checklists (**T-005, T-043**), limpieza/SEO (**T-054**).
  - *Justificación:* cambios pequeños, repetitivos y bien especificados, sin decisiones de diseño.

### Regla de oro para QA

> **Nunca uses un modelo económico para código que mueve dinero, verifica pagos, decide quién tiene acceso, o emite documentos legales.** En esta lista eso significa: T-011, T-012, T-020, T-021, T-022, T-040 y T-042 van con **Fable 5 / Opus 4.8**, sin excepción. Todo lo demás puede ir con **Sonnet 4.6**, y lo cosmético con **Haiku 4.5**.

### Cómo trabajar cada tarea con el modelo ejecutor

1. Dale el ID de la tarea y pídele que lea `docs/auditoria.md` (el hallazgo) y `docs/plan-de-trabajo.md` (la tarea).
2. Exígele que cumpla los **criterios de aceptación** y que ejecute "**cómo verificar**" antes de declararla hecha.
3. Respeta las **dependencias**: no arranques una tarea cuyos prerequisitos no estén cerrados (sobre todo las de pago e inventario).
4. Tras cada tarea: `npm run lint && npm run typecheck && npm test && npm run test:e2e` en verde antes de continuar.
