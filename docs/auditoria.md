# Auditoría técnica y de seguridad — Castillo Auto Parts

> **Fecha:** 2026-06-11
> **Alcance:** auditoría de solo lectura del repositorio (no se implementaron cambios).
> **Auditor:** revisión asistida por IA (rol staff-level / seguridad e-commerce).
> **Stack auditado:** Next.js 16.2.6 (App Router) · React 19 · TypeScript 5.7 (strict) · Prisma 6.19 + PostgreSQL 16 · Auth.js/NextAuth v5 beta.31 · Cloudflare R2 · Resend · objetivo de deploy: Vercel serverless.

---

## Resumen ejecutivo (para QA)

El proyecto está **sorprendentemente bien construido para haber sido hecho por agentes de IA**: hay defensa en profundidad real (cada página de admin revalida el rol, no solo el middleware), el descuento de inventario es **atómico** (no hay condición de carrera clásica), los precios del checkout se **recalculan en el servidor** (el cliente no puede manipular montos), el dinero se maneja en **centavos enteros**, las contraseñas usan **scrypt** con comparación de tiempo constante, y los tokens de acceso a órdenes usan hash + comparación segura. `npm audit` reporta **0 vulnerabilidades**. No se encontraron secretos reales filtrados en el repositorio ni en el historial de git.

Dicho esto, hay **gaps que deben resolverse antes de cobrar dinero real**. Los 5 riesgos más importantes:

1. **Falta facturación electrónica DTE (legal).** En El Salvador emitir DTE es obligatorio para vender. Está marcado como "manual" y no implementado. **Bloqueante de producción.** (H-004)
2. **El cobro real (Wompi) y su webhook no existen todavía, y la arquitectura actual asume el pago como confirmado al instante.** Hoy solo hay un proveedor `mock`. Cuando se conecte Wompi habrá que rediseñar el flujo para que el **webhook sea la fuente de verdad** (firma, idempotencia, validación de monto). **Bloqueante de producción.** (H-007)
3. **Base de datos en serverless sin connection pooling y sin migraciones versionadas.** En Vercel esto agota PostgreSQL bajo carga, y usar `db push` en lugar de `migrate deploy` puede causar pérdida de datos. **Bloqueante de producción.** (H-005, H-006)
4. **Endpoints de imágenes admin (`/api/admin/upload-image`, `/delete-image`) solo verifican que haya sesión, no el rol**, y además quedan fuera del middleware. Cualquier empleado con cualquier rol de panel (Ventas, Soporte, Contabilidad…) puede subir o borrar imágenes de producto. (H-001)
5. **No hay rate limiting en el login de clientes, registro ni recuperación de contraseña**, y el limiter "en memoria" no funciona en serverless multi-instancia. Esto abre la puerta a fuerza bruta y a "bombing" de correos. (H-003)

**Recomendación principal:** tratar los puntos 1–3 como gates de producción no negociables, resolver el 4 de inmediato (es de bajo esfuerzo) y montar rate limiting distribuido (Upstash) para el 5 antes de exponer la tienda al público. El resto son mejoras de calidad/rendimiento que pueden ir en paralelo.

### Bloqueantes de producción (marcados explícitamente)

| ID | Bloqueante | Categoría |
|----|-----------|-----------|
| H-004 | Facturación electrónica DTE no implementada | Cumplimiento legal |
| H-007 | Pago real Wompi + webhook como fuente de verdad no implementados | Pagos |
| H-005 | Prisma sin connection pooling en serverless | Datos / disponibilidad |
| H-006 | `db push` en lugar de `migrate deploy`; sin migraciones versionadas | Datos |
| H-003 | Rate limiting distribuido ausente en auth de clientes | Seguridad |
| H-001 | Autorización por rol incompleta en endpoints de imágenes | Seguridad |

---

## Contexto de arquitectura (lo que un novato podría no notar)

**Hay DOS sistemas de autenticación distintos en esta app:**

1. **Clientes:** Auth.js/NextAuth v5 con estrategia **JWT** (cookie de sesión `next-auth`), email+password y Google. Protege `/account/**` y asocia órdenes al usuario.
2. **Panel admin:** un sistema **propio, hecho a mano** con un token HMAC-SHA256 (`createAdminSessionToken`) en la cookie `castillo_admin_session`, válido 8 horas. **No usa NextAuth.** Lo verifica el middleware Edge y, de nuevo, cada página con `requireAdminRole()`.

Esto importa porque muchas recomendaciones sobre "NextAuth JWT" aplican a los clientes, mientras que el admin es criptografía propia (bien hecha, pero es superficie de riesgo a mantener con cuidado). Ambos sistemas comparten el problema de fondo de los JWT: **el rol va incrustado en el token y no se puede revocar hasta que expire** (ver H-002).

**Flujos críticos identificados:**
- **Auth clientes:** `src/lib/auth.ts`, `src/app/auth/{login,register,forgot-password,reset-password}/`
- **Auth admin:** `src/lib/admin-auth.ts`, `src/lib/admin-session.ts`, `middleware.ts`
- **Catálogo/búsqueda:** `src/data/products.ts`, `src/data/catalog-filters.ts`, `src/app/api/search/route.ts`
- **Carrito (guest, en cookie firmada):** `src/lib/cart.ts`, `src/lib/cart-state.ts`
- **Checkout/pago:** `src/app/checkout/actions.ts` → `src/lib/orders.ts` (`createPaidGuestOrderFromCart`)
- **Inventario:** descuento atómico en `src/lib/orders.ts`; restauración en `src/lib/admin-orders.ts`
- **Admin:** `src/app/admin/**` (orders, products, users, settings, stock-alerts, audit)
- **Pagos:** `src/lib/payments/` (abstracción + solo `mock`)
- **Imágenes:** `src/lib/r2.ts`, `src/app/api/admin/{upload,delete}-image/`

**Confirmación de deploy serverless:** El repo **no contiene** `vercel.json` ni carpeta `.vercel`, pero README y `docs/` confirman que el objetivo es Vercel, y el código asume serverless (Edge middleware, JWT stateless "para compatibilidad con Edge Runtime"). Trato el deploy como **Vercel serverless**, que es lo que activa los riesgos H-005 (pooling) y H-003 (rate limit en memoria). Si el deploy final fuera un servidor Node persistente único, esos dos riesgos bajarían de severidad — **conviene confirmarlo.**

**Reconocimiento de dependencias:**
- `npm audit`: **0 vulnerabilidades.**
- `next-auth@5.0.0-beta.31`: **es beta** (ver H-009).
- `next@16.2.6`: posterior al parche del bypass de middleware CVE-2025-29927 (corregido en 15.2.3), por lo que esa CVE puntual no aplica; aun así, la app correctamente no depende solo del middleware.
- `zod@3.25.76`, `@prisma/client@6.19.3`, `react@19.2.6`, `resend@6.12.4`, `@aws-sdk/client-s3@3.1055.0`: versiones estables, sin advisories conocidos en el lockfile.

---

## Hallazgos

### H-001 — Endpoints de imágenes admin verifican sesión pero no rol (y están fuera del middleware)

- **Severidad:** Alta
- **Categoría:** Seguridad / control de acceso
- **Ubicación:** [src/app/api/admin/upload-image/route.ts:33](src/app/api/admin/upload-image/route.ts), [src/app/api/admin/delete-image/route.ts:29](src/app/api/admin/delete-image/route.ts), [middleware.ts:193](middleware.ts)
- **Descripción:** Ambos route handlers llaman a `isAdminAuthenticated()`, que solo comprueba que exista un token de sesión admin válido — **no comprueba el rol**. La gestión de productos en el panel está restringida a `ADMIN` y `MARKETING` (en middleware y páginas), pero estos endpoints aceptan a **cualquier** rol no-cliente (`SALES`, `SUPPORT`, `WAREHOUSE`, `ACCOUNTING`). Además, el matcher del middleware es `["/admin/:path*"]`, que **no cubre `/api/admin/*`**: la única barrera de estos endpoints es la verificación dentro del handler.
- **Por qué importa:** Un empleado de, por ejemplo, contabilidad o soporte —que no debería tocar el catálogo— puede subir imágenes arbitrarias a cualquier producto o borrar las existentes. Es una falla de "control de acceso roto" (la categoría #1 del OWASP Top 10).
- **Riesgo si no se corrige:** Desfiguración del catálogo, borrado de imágenes de producto, subida de contenido inapropiado, todo desde una cuenta de menor privilegio. Sin pista de auditoría (estos endpoints no escriben `AdminAuditLog`).
- **Solución sugerida:** Reemplazar `isAdminAuthenticated()` por una verificación de rol explícita equivalente a `requireAdminRole("ADMIN", "MARKETING")` adaptada a route handler (devolver 403 en lugar de `redirect`). Registrar la acción en `AdminAuditLog`. Considerar extender el matcher del middleware a `/api/admin/:path*` como capa extra.
- **Esfuerzo estimado:** Bajo

---

### H-002 — Rol e `isActive` no se revalidan: ventana de escalada/persistencia de privilegios

- **Severidad:** Alta
- **Categoría:** Seguridad / auth
- **Ubicación:** [src/lib/auth.ts:75](src/lib/auth.ts) (callback `jwt`), [src/lib/admin-session.ts:54](src/lib/admin-session.ts), [src/types/next-auth.d.ts](src/types/next-auth.d.ts)
- **Descripción:** En el JWT de clientes, el `role` se escribe **solo en el login** (`if (user) { token.role = ... }`) y nunca se vuelve a leer de la base de datos. No hay `session.maxAge` configurado, así que aplica el **default de 30 días**. El token de admin incrusta el rol y dura 8 horas. En ningún caso se revalida `user.isActive` ni el rol actual en cada request.
- **Por qué importa:** Si despides a un empleado o le cambias el rol (le quitas admin, lo desactivas), **su sesión sigue funcionando con los permisos viejos** hasta que el token expire — hasta 30 días para un cliente, 8 horas para un admin. Para una tienda que maneja dinero e inventario, esa ventana es peligrosa.
- **Riesgo si no se corrige:** Un usuario desactivado o degradado conserva acceso y permisos; imposibilidad de "expulsar" una sesión comprometida de inmediato.
- **Solución sugerida:** (a) Reducir `session.maxAge` de clientes a algo razonable (p. ej. 7 días) y/o revalidar `role`+`isActive` contra la BD en el callback `jwt`/`session` (con caché corta para no golpear la BD en cada request). (b) Para admin, considerar verificar `isActive` y el rol actual dentro de `requireAdminRole()` consultando la BD, ya que es código de bajo volumen. (c) Opcional: un mecanismo de invalidación (columna `sessionsValidAfter` por usuario).
- **Esfuerzo estimado:** Medio

---

### H-003 — Sin rate limiting en auth de clientes; el limiter en memoria no sirve en serverless

- **Severidad:** Alta
- **Categoría:** Seguridad
- **Ubicación:** [src/app/auth/login/actions.ts](src/app/auth/login/actions.ts), [src/app/auth/register/actions.ts](src/app/auth/register/actions.ts), [src/app/auth/forgot-password/actions.ts](src/app/auth/forgot-password/actions.ts), [src/lib/rate-limit.ts](src/lib/rate-limit.ts), [src/app/cart/actions.ts:9](src/app/cart/actions.ts)
- **Descripción:** El login de **admin** sí tiene rate limiting con backend Redis opcional (`createAdminLoginRateLimiter`). Pero el **login de clientes** (`loginWithCredentials` → `signIn`), el **registro** y la **recuperación de contraseña** no tienen ningún límite. Además, el rate limiter por defecto es **en memoria** (`createRateLimiter`, un `Map` en el proceso): en Vercel cada invocación serverless está aislada, así que ese contador no se comparte entre instancias y es trivial de evadir. Upstash/Redis está disponible pero es **opcional** (si no se configura, se cae al limiter en memoria, inútil en producción).
- **Por qué importa:** Sin límite, un atacante puede probar miles de contraseñas por minuto contra el login, o disparar miles de correos de "restablecer contraseña" a una víctima (email bombing) usando tu cuenta de Resend (coste + reputación de dominio). El de la alerta de stock y la recuperación de contraseña son los más expuestos.
- **Riesgo si no se corrige:** Fuerza bruta de credenciales, abuso de envío de correos (coste y blacklisting del dominio), denegación de servicio.
- **Solución sugerida:** (a) Hacer obligatorio Upstash/Redis en producción (fallar el arranque si no está, igual que se valida `NEXTAUTH_SECRET`). (b) Aplicar `createAsyncRateLimiter` (la variante Redis) a: login de clientes, registro, forgot-password, reset-password y `/api/search`. (c) Clave por IP **y** por email/cuenta objetivo en forgot-password.
- **Esfuerzo estimado:** Medio

---

### H-004 — Facturación electrónica (DTE) no implementada — obligación legal en El Salvador

- **Severidad:** Crítica · **BLOQUEANTE DE PRODUCCIÓN**
- **Categoría:** Cumplimiento legal / fiscal
- **Ubicación:** modelo `InvoiceDte` en [prisma/schema.prisma:339](prisma/schema.prisma); `DTE_MODE="manual"` en [.env.example:13](.env.example); [src/lib/invoices/provider.ts](src/lib/invoices/provider.ts)
- **Descripción:** Existe el modelo de datos `InvoiceDte` (con estados `PENDING_MANUAL`, `ISSUED`, etc.) y una interfaz de provider, pero **no hay integración real** con el sistema de DTE del Ministerio de Hacienda. El modo por defecto es "manual".
- **Por qué importa:** En El Salvador, desde la facturación electrónica obligatoria, todo comercio que vende debe emitir Documentos Tributarios Electrónicos (factura/crédito fiscal). Vender sin emitir DTE expone al negocio a sanciones tributarias. **Esto no es consejo legal** — debe confirmarse el alcance exacto con un contador/asesor fiscal salvadoreño.
- **Riesgo si no se corrige:** Incumplimiento tributario, multas, problemas para operar legalmente.
- **Solución sugerida:** (1) Confirmar con un contador el tipo de documento y el régimen (sujeto excluido, crédito fiscal vs. consumidor final). (2) Implementar la generación/firma/transmisión del DTE contra el ambiente de pruebas de Hacienda, ligada a la confirmación de pago. (3) Mientras tanto, definir y documentar un proceso **manual** verificable (estado `PENDING_MANUAL` ya existe) como puente, con un contador responsable.
- **Esfuerzo estimado:** Alto

---

### H-005 — Prisma en serverless sin connection pooling

- **Severidad:** Alta · **BLOQUEANTE DE PRODUCCIÓN**
- **Categoría:** Datos / disponibilidad
- **Ubicación:** [src/lib/db.ts](src/lib/db.ts), `DATABASE_URL` en [.env.example:1](.env.example), [prisma/schema.prisma:5](prisma/schema.prisma)
- **Descripción:** El `DATABASE_URL` apunta a una conexión PostgreSQL directa, sin pooler. No hay `directUrl`/PgBouncer/Prisma Accelerate configurado. En Vercel, cada función serverless puede abrir su propia conexión; bajo concurrencia se agotan rápidamente las conexiones de PostgreSQL (típicamente ~100). El singleton de `db.ts` ayuda dentro de una misma instancia caliente, pero no entre instancias.
- **Por qué importa:** Es un fallo clásico que **no se ve en local** (una sola instancia) y aparece en producción bajo tráfico real: la app empieza a tirar errores "too many connections" justo cuando hay más clientes.
- **Riesgo si no se corrige:** Caídas intermitentes del sitio bajo carga, errores de checkout en el peor momento.
- **Solución sugerida:** Usar un pooler: Prisma Accelerate, o un connection string pooled (PgBouncer en modo transaction; p. ej. Supabase/Neon ofrecen puerto pooled). Configurar `datasource` con `url` (pooled) + `directUrl` (directo, para migraciones). Limitar `connection_limit` en el string serverless.
- **Esfuerzo estimado:** Bajo (configuración) — pero requiere elegir proveedor de BD gestionada.

---

### H-006 — CI/producción usa `prisma db push` en vez de `migrate deploy`; sin migraciones versionadas

- **Severidad:** Alta · **BLOQUEANTE DE PRODUCCIÓN**
- **Categoría:** Datos
- **Ubicación:** [.github/workflows/ci.yml:76](.github/workflows/ci.yml) (`npm run db:push`), [package.json:15](package.json); **no existe** la carpeta `prisma/migrations/`
- **Descripción:** El proyecto sincroniza el schema con `prisma db push`, que aplica el estado del schema directamente **sin historial de migraciones**. No hay carpeta `prisma/migrations`. `db push` puede **borrar columnas/tablas y perder datos** cuando detecta cambios destructivos, y no deja rastro reproducible de cómo evolucionó la BD.
- **Por qué importa:** `db push` es para prototipado local. En una BD de producción con datos reales (pedidos, clientes), aplicar cambios de schema sin migraciones versionadas es una receta para pérdida de datos irreversible y para no poder reproducir el estado de la BD.
- **Riesgo si no se corrige:** Pérdida de pedidos/clientes en un cambio de schema; imposibilidad de auditar o revertir cambios de BD.
- **Solución sugerida:** Adoptar migraciones: `prisma migrate dev` en desarrollo (genera archivos en `prisma/migrations`), y `prisma migrate deploy` en CI/CD y producción. Generar la migración inicial (`baseline`) a partir del schema actual.
- **Esfuerzo estimado:** Medio

---

### H-007 — Arquitectura de pago asume confirmación síncrona; falta webhook como fuente de verdad

- **Severidad:** Alta · **BLOQUEANTE DE PRODUCCIÓN** (para cobrar de verdad)
- **Categoría:** Pagos / arquitectura
- **Ubicación:** [src/lib/orders.ts:155](src/lib/orders.ts) (`createPayment` dentro de la transacción), [src/lib/payments/provider.ts](src/lib/payments/provider.ts), [src/lib/payments/mock-provider.ts](src/lib/payments/mock-provider.ts), [src/lib/payments/index.ts](src/lib/payments/index.ts)
- **Descripción:** Hoy, `createPaidGuestOrderFromCart` llama a `getPaymentProvider().createPayment()` **dentro de la misma transacción** que crea la orden y exige `status === "PAID"` para continuar. El `mock` devuelve `PAID` instantáneamente, así que el modelo actual es "crear orden ya pagada en una sola operación síncrona". La interfaz `PaymentProvider` define `verifyWebhook()`, pero **no existe ningún route handler de webhook** que lo invoque, ni un estado de orden "pendiente de pago", ni lógica de idempotencia. El esquema sí tiene `PaymentEvent` (con `externalEventId`, `isValid`) y `PaymentStatus.PENDING`, pero el flujo no los usa.
- **Por qué importa:** Wompi (y cualquier pasarela real) es **asíncrona**: el usuario es redirigido, paga, y la pasarela confirma por **webhook** — que puede llegar después de que el usuario cerró la pestaña, llegar **duplicado**, o no llegar. Si el cumplimiento del pedido depende del redirect o de una respuesta síncrona, tendrás pedidos marcados como pagados que no se pagaron (o lo contrario). El modelo síncrono actual **no se puede portar directamente** a Wompi.
- **Riesgo si no se corrige (al integrar Wompi):** Pedidos cumplidos sin pago, doble cumplimiento por webhooks duplicados, fraude por montos manipulados, descuadres contables.
- **Aspecto positivo:** El `mock` ya está bloqueado en producción por `assertPaymentProviderAllowed()` (solo se permite en E2E con flags explícitos). Eso es correcto.
- **Solución sugerida (diseño para Wompi):**
  1. Crear la orden en estado **`PENDING`** y generar el link de pago; **no** descontar stock definitivamente aún (reservar — ver H-008).
  2. Implementar `POST /api/webhooks/wompi` que: **verifique la firma/hash de integridad** con el secreto en el servidor; sea **idempotente** (usar `PaymentEvent.externalEventId` con índice único para descartar duplicados); **valide que el monto pagado == total calculado en servidor**; y solo entonces transicione la orden a `PAID` y confirme el descuento de stock, todo en una transacción.
  3. El **webhook es la fuente de verdad**, no el redirect. El redirect solo muestra "estamos confirmando tu pago".
  4. La **firma de integridad de Wompi** se calcula en el servidor con el secreto, nunca en el cliente.
  5. Máquina de estados de pago/orden donde el cliente no pueda forzar transiciones.
- **Esfuerzo estimado:** Alto

---

### H-008 — Modelo de reserva de stock incompatible con pago asíncrono

- **Severidad:** Media (Alta cuando se integre Wompi)
- **Categoría:** Inventario / datos
- **Ubicación:** [src/lib/orders.ts:123](src/lib/orders.ts) (descuento atómico), campo `quantityReserved` en [prisma/schema.prisma:205](prisma/schema.prisma)
- **Descripción:** El descuento de stock actual es **atómico y correcto** (`updateMany` con `WHERE quantityOnHand >= requerido AND status NOT IN (OUT_OF_STOCK, PREORDER)` y verificación de `count === 1`) — **buen trabajo, esto evita la sobreventa clásica.** Pero descuenta `quantityOnHand` directamente en el momento de crear la orden (que hoy es síncrono con el pago mock). El campo `quantityReserved` existe en el modelo pero **nunca se usa**. Con pago asíncrono real, no hay un paso de "reserva mientras se espera el pago".
- **Por qué importa:** Con Wompi, entre que el usuario inicia el pago y el webhook confirma, el stock debe estar **reservado** (no disponible para otros) pero **no descontado** (por si el pago falla). Si solo descuentas al confirmar, dos clientes pueden iniciar el pago del último ítem; si reservas mal, sobrevendes o bloqueas stock indefinidamente.
- **Riesgo si no se corrige:** Sobreventa o bloqueo de inventario al introducir pagos asíncronos.
- **Solución sugerida:** Introducir el ciclo reservar → confirmar/liberar usando `quantityReserved`: al crear la orden PENDING, incrementar `quantityReserved` atómicamente (`WHERE quantityOnHand - quantityReserved >= cantidad`); al confirmar el pago (webhook), mover de reservado a descontado de `quantityOnHand`; al expirar/fallar, liberar la reserva (job o TTL). Coordinar con H-007.
- **Esfuerzo estimado:** Medio

---

### H-009 — Capa de autenticación de clientes en versión beta

- **Severidad:** Media
- **Categoría:** Seguridad / dependencias
- **Ubicación:** `next-auth@5.0.0-beta.31` en [package.json:28](package.json)
- **Descripción:** NextAuth v5 está en **beta** y se usa para autenticar a los clientes de una app que manejará dinero. Las betas pueden tener cambios incompatibles y bugs de seguridad sin el mismo nivel de escrutinio que una release estable.
- **Por qué importa:** Apoyar la autenticación de producción sobre una dependencia beta es un riesgo de mantenibilidad y seguridad; un parche urgente podría requerir una migración no trivial.
- **Riesgo si no se corrige:** Exposición a bugs no parcheados; posible trabajo de migración forzado más adelante.
- **Solución sugerida:** Fijar la versión exacta (no usar `^`), suscribirse a los advisories del repo de Auth.js, y planificar la actualización a la primera v5 estable antes del lanzamiento. Cubrir los flujos de auth con tests E2E (ya hay `auth-account.spec.ts`) para detectar regresiones al actualizar.
- **Esfuerzo estimado:** Bajo (gestión) — la migración futura puede ser Medio.

---

### H-010 — No hay Content-Security-Policy

- **Severidad:** Media
- **Categoría:** Seguridad (cabeceras)
- **Ubicación:** [next.config.ts:29](next.config.ts)
- **Descripción:** Se configuran buenas cabeceras (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY`, y HSTS en producción), pero **no hay `Content-Security-Policy`**. La CSP es la defensa principal contra XSS (limita de dónde se cargan scripts).
- **Por qué importa:** Sin CSP, si en algún momento se cuela una vulnerabilidad de XSS (script malicioso inyectado), nada limita su ejecución. En una tienda, un XSS en el checkout puede robar datos del cliente.
- **Aspecto positivo:** No se usa `dangerouslySetInnerHTML` en ningún lado, y el HTML de emails se escapa correctamente, así que la superficie de XSS hoy es baja.
- **Riesgo si no se corrige:** Mayor impacto de un eventual XSS; incumplimiento de buenas prácticas (y de requisitos de algunos procesadores de pago).
- **Solución sugerida:** Añadir una CSP. Next.js 16 admite CSP con **nonces** vía middleware para scripts. Empezar en modo `Content-Security-Policy-Report-Only` para no romper nada, observar reportes, y luego endurecer. Incluir `frame-ancestors 'none'` (refuerza X-Frame-Options).
- **Esfuerzo estimado:** Medio (requiere cuidado para no romper Next/Tailwind)

---

### H-011 — Faltan índices en claves foráneas y columnas de filtrado del catálogo

- **Severidad:** Media
- **Categoría:** Performance / datos
- **Ubicación:** [prisma/schema.prisma](prisma/schema.prisma) (modelos `Product`, `ProductImage`, `CartItem`, `OrderItem`, `InventoryStock`)
- **Descripción:** PostgreSQL **no indexa automáticamente las claves foráneas**. El catálogo filtra y ordena por `Product.isActive`, `Product.isFeatured`, `Product.brand`, `Product.categoryId` y por la relación con categoría, pero `Product` no tiene índices en `categoryId`, `brand`, `isActive` ni `isFeatured`. Tampoco hay índices explícitos en `ProductImage.productId`, `CartItem.productId`, `OrderItem.orderId`/`productId`. (Sí hay índices correctos en `Order`, `VehicleCompatibility`, `AdminAuditLog`, `StockAlertRequest`.)
- **Por qué importa:** Con pocos productos no se nota, pero al crecer el catálogo las consultas de listado/búsqueda y los `JOIN` se vuelven lentos (escaneos secuenciales), encareciendo cada carga de página.
- **Riesgo si no se corrige:** Degradación de rendimiento del catálogo y del panel admin conforme crece el inventario y el historial.
- **Solución sugerida:** Añadir `@@index([categoryId])`, `@@index([brand])`, `@@index([isActive, isFeatured])` en `Product`, e índices en las FKs de `ProductImage`, `CartItem`, `OrderItem`. Para búsqueda de texto, evaluar `pg_trgm`/full-text a futuro. Acompañar con migración (ver H-006).
- **Esfuerzo estimado:** Bajo

---

### H-012 — Cálculo de IVA inconsistente (impuesto sobre el envío y línea vs. total)

- **Severidad:** Media
- **Categoría:** Dinero / cumplimiento
- **Ubicación:** [src/lib/checkout.ts:94](src/lib/checkout.ts) (`calculateIncludedTaxCents`), uso en [src/lib/orders.ts:218](src/lib/orders.ts)
- **Descripción:** `Order.taxCents` se calcula como `calculateIncludedTaxCents(totalCents)` donde `totalCents = subtotal + envío`, es decir, **se calcula IVA sobre el costo de envío también**. Por otro lado, cada `OrderItem.taxCents` se calcula sobre el total de su línea. Como ambos se redondean por separado, **la suma de los impuestos por línea no necesariamente coincide con `Order.taxCents`**, y no está claro/documentado si el envío debe llevar IVA en este régimen.
- **Por qué importa:** Las cifras de impuestos terminan en documentos fiscales (DTE). Inconsistencias de centavos y dudas sobre si el flete tributa pueden causar descuadres contables y problemas al emitir comprobantes.
- **Riesgo si no se corrige:** Montos de IVA incorrectos en comprobantes; descuadres entre el detalle y el total.
- **Solución sugerida:** Definir con el contador el tratamiento del IVA sobre el envío. Calcular el impuesto de forma consistente (sumar impuestos de línea y derivar el total de ahí, o documentar explícitamente la regla) de modo que `Order.taxCents == Σ OrderItem.taxCents (+ IVA de envío si aplica)`. Añadir tests unitarios de redondeo. Coordinar con H-004.
- **Esfuerzo estimado:** Bajo

---

### H-013 — `next/image` permite cualquier ruta de `images.unsplash.com` en producción

- **Severidad:** Media
- **Categoría:** Seguridad / costo
- **Ubicación:** [next.config.ts:14](next.config.ts)
- **Descripción:** `remotePatterns` incluye `images.unsplash.com` (cualquier path) además del host público de R2. Unsplash es una dependencia de datos de prueba; tenerlo habilitado en producción significa que el optimizador de imágenes de Next puede traer y procesar imágenes externas. No hay límites de `formats`/`minimumCacheTTL`/tamaños.
- **Por qué importa:** El optimizador de imágenes de Next puede ser abusado para generar muchas transformaciones (coste de cómputo/ancho de banda = factura de Vercel), y depender de un host externo en producción es frágil. Es un vector de DoS/costo conocido.
- **Riesgo si no se corrige:** Costos inesperados por optimización de imágenes; dependencia externa en producción; superficie de abuso.
- **Solución sugerida:** En producción, limitar `remotePatterns` solo al host de R2 (quitar Unsplash, o restringir el `pathname`). Configurar `minimumCacheTTL` y `formats`. Servir todas las imágenes de producto reales desde R2.
- **Esfuerzo estimado:** Bajo

---

### H-014 — `/api/search` carga todo el catálogo en memoria y no tiene rate limit

- **Severidad:** Media
- **Categoría:** Performance
- **Ubicación:** [src/app/api/search/route.ts:50](src/app/api/search/route.ts), [src/data/products.ts:50](src/data/products.ts) (`getCatalogProducts` con `include` completo)
- **Descripción:** El autocomplete público llama a `getCatalogProducts()`, que trae **todos** los productos activos con todas sus relaciones (`images`, `compatibilities`, `inventoryStocks`, `category`) y luego filtra en JavaScript. Tiene caché CDN de 30 s (bien), pero no tiene rate limit y el coste por miss crece linealmente con el catálogo.
- **Por qué importa:** Con un catálogo grande, cada búsqueda no cacheada carga toda la tabla a memoria y la filtra en el server; es desperdicio y puede volverse lento. Sin rate limit, es invocable masivamente.
- **Riesgo si no se corrige:** Latencia y consumo de recursos crecientes; endpoint abusable.
- **Solución sugerida:** Para búsqueda, consultar la BD con `where` (ya existe `buildPrismaWhere`) y `take` limitado, en vez de cargar todo y filtrar en JS; seleccionar solo los campos que el autocomplete necesita (`select`, no `include` completo). Añadir rate limit ligero por IP (ver H-003).
- **Esfuerzo estimado:** Medio

---

### H-015 — No se usa el paquete `server-only` para blindar módulos con secretos

- **Severidad:** Baja
- **Categoría:** Seguridad (defensa en profundidad)
- **Ubicación:** [src/lib/r2.ts](src/lib/r2.ts), [src/lib/auth.ts](src/lib/auth.ts), [src/lib/admin-session.ts](src/lib/admin-session.ts), [src/lib/admin-credentials.ts](src/lib/admin-credentials.ts)
- **Descripción:** No se importa `server-only` en ningún módulo. Hoy no hay fuga: los secretos solo se leen en código de servidor y no se encontró `NEXT_PUBLIC_` con secretos. Pero nada impide, por error futuro, que un módulo con credenciales (R2, firma de tokens) sea importado por accidente desde un Client Component, lo que lo metería en el bundle del navegador.
- **Por qué importa:** Es una red de seguridad barata: si alguien importa por error un módulo de servidor desde el cliente, el build **falla** en vez de filtrar credenciales silenciosamente.
- **Riesgo si no se corrige:** Riesgo latente de filtrar credenciales en el bundle por un import equivocado.
- **Solución sugerida:** Añadir `import "server-only";` al inicio de `r2.ts`, `auth.ts`, `admin-session.ts`, `admin-credentials.ts`, `db.ts` y similares.
- **Esfuerzo estimado:** Bajo

---

### H-016 — Google OAuth: no se verifica `email_verified`

- **Severidad:** Baja
- **Categoría:** Seguridad / auth
- **Ubicación:** [src/lib/auth.ts:39](src/lib/auth.ts) (provider Google, sin callback `signIn`)
- **Descripción:** No hay callback `signIn` que valide que el correo de Google venga verificado (`email_verified`). NextAuth **no** linkea automáticamente cuentas por email por defecto (no se usa `allowDangerousEmailAccountLinking`), lo cual es **correcto y seguro**. Pero conviene afirmar explícitamente la verificación de email para no crear cuentas a partir de correos no verificados.
- **Por qué importa:** Si un proveedor OAuth entregara un email no verificado, podría usarse para suplantar una identidad. Con Google el riesgo es bajo (casi siempre verifica), pero es una buena práctica hacerlo explícito.
- **Riesgo si no se corrige:** Riesgo bajo de creación de cuenta con email no verificado.
- **Solución sugerida:** Añadir callback `signIn` que rechace el login de Google si `profile.email_verified !== true`. Mantener desactivado el account-linking automático.
- **Esfuerzo estimado:** Bajo

---

### H-017 — `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` debe restringirse por dominio

- **Severidad:** Baja
- **Categoría:** Seguridad / costo
- **Ubicación:** [.env.example:5](.env.example)
- **Descripción:** La llave de Google Maps es `NEXT_PUBLIC_` (correcto: las claves de Maps del lado cliente son públicas por diseño). El riesgo no es la exposición sino la **falta de restricciones**: una API key de Maps sin restricción de referrer HTTP puede ser usada por terceros y generar costos en tu cuenta.
- **Por qué importa:** Una llave de Maps abierta puede ser "robada" del bundle y usada por otros, inflando tu factura de Google Cloud.
- **Riesgo si no se corrige:** Costos por uso no autorizado de la API de Maps.
- **Solución sugerida:** Al activar Maps real, restringir la API key en Google Cloud por referrer HTTP (tu dominio) y por APIs específicas (Maps/Places). Documentarlo en `.env.example`.
- **Esfuerzo estimado:** Bajo

---

### H-018 — Endpoints de imágenes no registran auditoría

- **Severidad:** Baja
- **Categoría:** Funcional / trazabilidad
- **Ubicación:** [src/app/api/admin/upload-image/route.ts](src/app/api/admin/upload-image/route.ts), [src/app/api/admin/delete-image/route.ts](src/app/api/admin/delete-image/route.ts)
- **Descripción:** Las acciones de productos, usuarios, settings y órdenes escriben `AdminAuditLog`, pero subir/borrar imágenes no. Combinado con H-001 (sin verificación de rol), no queda rastro de quién subió o borró una imagen.
- **Por qué importa:** Sin auditoría no puedes investigar un abuso o un error en el catálogo.
- **Riesgo si no se corrige:** Falta de trazabilidad ante incidentes de catálogo.
- **Solución sugerida:** Registrar `image.uploaded` / `image.deleted` en `AdminAuditLog` con el usuario admin y el producto afectado. Combinar con el fix de H-001.
- **Esfuerzo estimado:** Bajo

---

### H-019 — `buildR2Key` usa `Math.random()` (colisión teórica) y la clave depende de `productId` no saneado

- **Severidad:** Baja
- **Categoría:** Seguridad / datos
- **Ubicación:** [src/lib/r2.ts:107](src/lib/r2.ts)
- **Descripción:** La clave del objeto se forma con `products/{productId}/{timestamp}-{random}.{ext}`, donde `random` es `Math.random().toString(36).slice(2,8)` (6 chars, no criptográfico). `productId` viene del cliente y se valida que el producto exista en BD **antes** de subir (bien), por lo que el path traversal está acotado; aun así la clave se construye por interpolación sin sanear. El MIME se valida pero no se verifica el contenido real del archivo (magic bytes).
- **Por qué importa:** El riesgo de colisión es bajo pero no nulo bajo alta concurrencia; y validar solo `file.type` (cabecera enviada por el cliente) no garantiza que el archivo sea realmente una imagen.
- **Riesgo si no se corrige:** Colisión/sobrescritura improbable; posible subida de un archivo no-imagen con MIME falsificado.
- **Solución sugerida:** Usar `crypto.randomUUID()` para la parte aleatoria; sanear/validar `productId` como cuid; opcionalmente verificar los magic bytes del archivo. (Ver también la nota de R2 firmadas más abajo.)
- **Esfuerzo estimado:** Bajo

---

## Notas de verificación y aspectos positivos

**Cosas que están BIEN hechas** (para que QA sepa que no todo es riesgo):

- **Descuento de inventario atómico** con `updateMany` condicional y verificación de `count` — evita la condición de carrera del "último ítem". ([src/lib/orders.ts:123](src/lib/orders.ts))
- **Precios recalculados en el servidor** en el checkout: el cliente no puede manipular montos; el carrito guarda SKU+cantidad, los precios se leen de la BD. ([src/lib/orders.ts:101](src/lib/orders.ts))
- **Carrito guest firmado** con HMAC (cookie `httpOnly`, `sameSite`), con fallback sin firma solo fuera de producción. ([src/lib/cart-state.ts](src/lib/cart-state.ts))
- **Tokens de acceso a órdenes** con hash SHA-256 y comparación de tiempo constante; las órdenes de invitado no son enumerables sin el token. ([src/lib/order-access-token.ts](src/lib/order-access-token.ts))
- **Contraseñas con scrypt** + `timingSafeEqual`. ([src/lib/admin-credentials.ts](src/lib/admin-credentials.ts))
- **Defensa en profundidad en admin**: middleware Edge **y** `requireAdminRole()` en cada página, con permisos por rol/ruta. (excepto los endpoints de imágenes — H-001)
- **Validación de secretos en producción** para `NEXTAUTH_SECRET` y `ADMIN_ACCESS_SECRET` (longitud y placeholders). ([src/lib/auth.ts:24](src/lib/auth.ts), [src/lib/admin-auth.ts:68](src/lib/admin-auth.ts))
- **El proveedor `mock` está bloqueado en producción** salvo flags de E2E explícitas. ([src/lib/payments/index.ts:35](src/lib/payments/index.ts))
- **No se cachea data de usuario**: todas las rutas con datos de sesión/pedido usan `export const dynamic = "force-dynamic"`.
- **El forgot-password no revela si el email existe** (siempre responde "enviado"); token de 1 hora, un solo uso. ([src/app/auth/forgot-password/actions.ts](src/app/auth/forgot-password/actions.ts), [src/lib/auth-user.ts:86](src/lib/auth-user.ts))
- **HTML de emails escapado** y redacción de tokens en los logs de email. ([src/lib/email/templates.ts:51](src/lib/email/templates.ts), [src/lib/email/transactional.ts:52](src/lib/email/transactional.ts))
- **TypeScript en modo `strict`**, sin `as any`/`@ts-ignore` en el código de producción; validación con Zod en checkout, stock-alerts.
- **`.env` correctamente ignorado** por git; no se hallaron secretos reales en el repo ni en el historial.

**Cosas que NO se pudieron verificar con certeza (sin adivinar):**

- **Configuración real de Vercel** (variables preview vs. producción, pooler de BD): no hay `vercel.json` en el repo; debe confirmarse en el panel de Vercel.
- **Entregabilidad de email** (SPF/DKIM/DMARC del dominio): se configura fuera del repo (DNS + Resend).
- **Restricciones reales de las credenciales de R2** (permiso mínimo al bucket): se definen en el panel de Cloudflare, no en el código.
- **Si el bucket R2 tiene listado de objetos deshabilitado** y solo expone lo público intencional: se configura en Cloudflare.
- Estos puntos se reflejan como tareas de verificación en el plan de trabajo, no como hallazgos de código.

---

## Índice de hallazgos por severidad

| ID | Título | Severidad | Bloqueante prod |
|----|--------|-----------|:---:|
| H-004 | DTE no implementado (legal) | Crítica | ✅ |
| H-001 | Endpoints de imágenes sin verificación de rol | Alta | |
| H-002 | Rol/`isActive` no revalidados (escalada de privilegios) | Alta | |
| H-003 | Sin rate limit en auth de clientes; limiter en memoria | Alta | ✅ |
| H-005 | Prisma sin connection pooling en serverless | Alta | ✅ |
| H-006 | `db push` en vez de `migrate deploy` | Alta | ✅ |
| H-007 | Pago síncrono; falta webhook fuente de verdad (Wompi) | Alta | ✅ |
| H-008 | Modelo de reserva de stock vs. pago asíncrono | Media→Alta | |
| H-009 | NextAuth en beta | Media | |
| H-010 | Sin Content-Security-Policy | Media | |
| H-011 | Faltan índices en FKs y filtros del catálogo | Media | |
| H-012 | IVA inconsistente (envío / línea vs. total) | Media | |
| H-013 | `next/image` permite Unsplash abierto en prod | Media | |
| H-014 | `/api/search` carga todo el catálogo; sin rate limit | Media | |
| H-015 | Sin `server-only` en módulos con secretos | Baja | |
| H-016 | Google OAuth no verifica `email_verified` | Baja | |
| H-017 | API key de Maps sin restricción de dominio | Baja | |
| H-018 | Endpoints de imágenes sin auditoría | Baja | |
| H-019 | `buildR2Key` con `Math.random()`; MIME no verificado por contenido | Baja | |

*Reporte generado en fase de auditoría. No se modificó código. El plan accionable está en [docs/plan-de-trabajo.md](plan-de-trabajo.md).*
