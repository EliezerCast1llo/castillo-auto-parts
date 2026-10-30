# Portada temporal en Vercel — B18 / #113

Aprobada el 23 de octubre de 2026 para disponer de una URL final pública al crear
la cuenta de Google Ads/Keyword Planner. La campaña permanece pausada: este PR
no crea cuentas de Ads ni activa publicidad. **Railway sigue siendo el destino
planeado de la tienda real**; Vercel aloja únicamente esta portada temporal.

## Activación

Configurar **`SITE_MODE=landing` antes del build y del arranque**. Sin la variable,
con valor vacío o con otro valor, Next mantiene su selección normal de rutas.
Cambiar de modo requiere un **nuevo build**, no solo reiniciar una compilación
anterior. No reutilizar el mismo `.next` entre modos sin reconstruirlo.

La portada en `/` muestra **Castillo Autoparts**, descripción de repuestos para
Santa Tecla, San Salvador y alrededores, **+503 7890 7671** y
`https://wa.me/50378907671`. El contenido está en next-intl, con español como idioma
visible. Se incluyen mensajes ingleses para conservar la paridad de catálogos,
pero no se publica una ruta inglesa en este modo.

No hay catálogo, carrito, checkout, cuenta, login, panel admin ni API operativa.
Las rutas no permitidas y todas las mutaciones responden **404**, sin login ni
acceso a servicios. No se importan PostgreSQL/Prisma, Auth.js, Resend, Upstash,
R2, Wompi o Sentry en las entradas de la portada. No hay formularios, productos
ni datos de demostración que permitan intentar una compra.

La CSP se aplica en modo enforcement y se mantienen headers de seguridad.
La página se renderiza por petición para que los scripts Next reciban el nonce
correcto. No usa fuentes remotas, analítica, sesión, cookies de seguimiento ni
reportadores de errores externos. Teléfono y WhatsApp se abren solo al pulsarlos.

## Conectar y desplegar en la cuenta de Eliezer

Eliezer o Claude realiza la conexión en Vercel; no compartir tokens, contraseñas
ni credenciales por GitHub o chat. Una cuenta/proyecto conectado a otra persona
no cumple el destino aprobado.

1. En la cuenta de Vercel de Eliezer, importar
   `EliezerCast1llo/castillo-auto-parts`. Framework **Next.js**, Root Directory la
   raíz del repositorio, Node.js **22**, Install Command `npm ci` y Build Command
   `npm run build`. No usar los comandos de migración o predeploy de Railway.
2. Añadir `SITE_MODE=landing` para los ambientes que se desplegarán (Production y
   Preview si se prueban ambos) **antes** del primer build. No cargar variables de
   la tienda: ni `DATABASE_URL`, secretos Auth/admin/carrito, correo, pagos,
   Upstash, R2 ni Sentry. La variable pública de monitoreo tampoco se necesita.
   El `prisma generate` de instalación de la dependencia, si se ejecuta, genera
   tipos localmente y no requiere ni conecta una base de datos.
3. Opción normal: Eliezer revisa y fusiona el PR; desplegar Production desde
   `main`. Si Eliezer prefiere revisar antes, desplegar la rama
   **`codex/temporary-landing`** en Preview; no fusionar por cuenta del agente.
   Un Preview puede tener protección por defecto: para usarlo como URL final
   debe ser público, sin login ni pantalla de protección. El propietario decide
   quitar esa protección del despliegue temporal o promover la rama a Production.
4. Elegir un nombre disponible de proyecto/subdominio `*.vercel.app`. El ejemplo
   `castillo-autoparts.vercel.app` no es una URL entregada ni garantiza disponibilidad.
5. Abrir la URL en una ventana privada, comprobar 200 en `/`, nombre, zona,
   teléfono, WhatsApp y vista móvil. Comprobar `/catalog`, `/es/catalog`,
   `/checkout`, `/es/account`, `/admin` y `/api/auth/session`: deben responder 404.
6. Pegar la **URL pública real y comprobada** como comentario en
   [#113](https://github.com/EliezerCast1llo/castillo-auto-parts/issues/113). El
   requisito de entrega no está completo por solo abrir un PR o indicar una URL
   de ejemplo. No publicar un enlace protegido por Vercel ni declarar un
   despliegue completado sin verificarlo.

Si Vercel ya hizo un build sin la variable, configurarla y hacer **Redeploy** con
un build nuevo. Si la rama todavía no está conectada/desplegada en la cuenta del
propietario, ese es un paso externo pendiente; no se requieren secretos de la
aplicación para resolverlo. No sustituir Vercel por otro hosting para esta entrega.

## Verificación local y CI

En un checkout sin archivos dotenv locales:

```bash
npm ci
SITE_MODE=landing npm run build
SITE_MODE=landing npm start
```

No ejecutar migraciones ni seed para esta comprobación. Las pruebas reproducibles:

```bash
npm run test:landing
```

Este comando elimina del entorno hijo las variables de aplicación de
`.env.example` y de integraciones, fija solo el modo portada y construye/arranca
producción. Rechaza archivos `.env` locales para que no se carguen credenciales
por accidente. Mantiene las variables de red/proxy/CA del entorno de ejecución.
Necesita Chromium de Playwright instalado (`npx playwright install --with-deps
chromium` en Linux) y usa por defecto el puerto 3211; puede cambiarse mediante
`LANDING_SMOKE_PORT`. No permite usar una URL externa ni ejecutar compras.

Comprueba manifest de rutas y dependencias trazadas, contenido/contacto, CSP,
404 de tienda/API y mutaciones, ausencia de errores de consola, peticiones
externas y cookies, y overflow a 320, 390 y 1440 px. Guarda capturas en
`test-results/landing/`. El job CI `e2e` lo ejecuta antes de la suite normal; después
el runner existente reconstruye la tienda sin `SITE_MODE`, con su esquema DB
aislado, y verifica su comportamiento habitual. La selección exacta del modo se
cubre además con pruebas unitarias. No ejecutar ambos builds simultáneamente en
el mismo checkout: comparten `.next`.

## Retirar el modo al lanzar la tienda en Railway

1. Preparar y validar la tienda real según
   [la guía Railway](deploy-production-railway.md) y sus gates de negocio.
2. En Railway, **no definir `SITE_MODE`** (o dejarlo vacío), configurar sus variables
   reales y generar un build nuevo. La excepción de portada no desactiva la
   validación de producción de la tienda: vuelve a aplicarse el hook normal.
3. Validar pagos/envíos/correo/DTE y QA de lanzamiento antes de abrir ventas.
   Actualizar la URL final de Ads cuando corresponda, manteniendo la campaña
   pausada mientras esa sea la decisión del propietario.
4. El propietario decide retirar la portada Vercel o redirigirla al dominio real.
   No quitar `SITE_MODE` de Vercel sin configurar y reconstruir la tienda: el
   despliegue temporal carece de sus secretos por diseño.

Sin autorización de Eliezer no se fusiona, no se promueve una rama a Production
y no se toca el despliegue de Railway. No se ha cambiado la marca del storefront
existente: el nombre de esta portada es el solicitado específicamente en #113.
