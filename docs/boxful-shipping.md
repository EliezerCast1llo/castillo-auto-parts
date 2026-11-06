# Boxful — #91

## Comportamiento implementado

`SHIPPING_PROVIDER=boxful` usa el cliente HTTP real. Las pruebas interceptan HTTP;
no se llama a Boxful, Resend ni Telegram reales en CI. Sin proveedor, sin distrito
verificado o sin tarifa: WhatsApp y bloqueo del pago nacional; retiro gratuito
continúa. No hay tarifas fijas departamentales como respaldo.

El checkout cotiza al completar la dirección nacional (debounce 400 ms), permite
actualizar manualmente y renueva cada 300 segundos sin borrar campos. Al salir
del método nacional, desmontar o comenzar pago, detiene el ciclo y aborta la
solicitud activa. Durante renovación bloquea pago; el submit comprueba también
la expiración, por ejemplo después de suspender la pestaña. El servidor rechaza
comprobantes vencidos/manipulados y cambios de carrito, precios de producto,
paquetes o dirección. El endpoint conserva 30 solicitudes/minuto por IP: el
refresco consume 0.2/minuto por checkout y el debounce evita llamar por cada
tecla; un 429 muestra el fallback, sin saltarse el límite desde el checkout.

La respuesta incluye un comprobante AES-256-GCM autenticado y cifrado, derivado
por propósito de `GUEST_CART_SECRET`, con tarifas y snapshot de la solicitud.
No se guardan filas intermedias de cotización. Pagar valida el comprobante y
productos actuales y cobra el importe mostrado, sin llamar otra vez al courier.
Promociones y costo cotizado quedan fijados en el pedido. Cambios de tarifa o
de promoción durante la ventana no alteran ese cobro. La huella del intento
incluye opción/distrito/dirección/cliente/items, pero no el precio ni el token.

Solo un pago aprobado inicia la guía, después de confirmar inventario y pago.
Si ya se intentó crear una guía, el admin no puede cancelar/reembolsar la orden
y reponer inventario hasta reconciliar/cancelar esa guía con el courier.
Un claim condicional en PostgreSQL impide POST concurrentes. Antes del POST se
persiste estado `UNKNOWN`, de manera que una caída de proceso no habilita otro
POST. Se guarda ID, número, tracking y PDF; se descuenta **una vez** del saldo
estimado el costo cotizado. Un fallo conserva pago y orden pendiente, sin
reembolso ni segundo cobro. Admin tiene botón de consulta/reintento.

Una respuesta perdida, timeout, 5xx o 201 ilegible puede haber creado una guía.
En estado `UNKNOWN`, el reintento y cron consultan por nuestro `orderNumber` y
recuperan el resultado; **un 404 no autoriza otra creación**, por posible
consistencia eventual. Si nunca hubo guía, el dueño debe reconciliar con Boxful
antes de restablecer el estado. Solo rechazos explícitos 400/401/403/409/422
permiten volver a POST después de consulta y corrección. No se hace POST con
`BOXFUL_ORDER_REFERENCE_CONFIRMED` vacío: no asumir que un campo no mostrado en
el ejemplo oficial funciona.

Webhook `/api/webhooks/boxful`: token constante en tiempo mediante hashes de
longitud fija, antes de leer cuerpo/DB/API. Inválidos: 401 sin eventos de error
externos por solicitud. Aceptados: localizar guía propia, confirmar estado por
GET autenticado y guardar evento deduplicado; nunca aplicar el estado recibido
sin esa consulta. Se aceptan códigos -1 a 11; 0 se conserva como pendiente.
Recolectado/en ruta/locker → enviado, entregado → entregado; incidencias y
cancelación del courier no cancelan ni reembolsan la orden pagada. Pedidos
terminales no regresan a estados activos. Se muestra tracking en el detalle
protegido del pedido y PDF solo en admin.

## Credenciales y entornos

Cuenta: https://app.goboxful.com. Configurar por entorno, nunca en issues/PR:

- `BOXFUL_API_BASE_URL=https://devapi.goboxful.com` para QA y previews.
- `BOXFUL_EMAIL`, `BOXFUL_PASSWORD`: cuenta **de pruebas**.
- `BOXFUL_TOKEN_ENCRYPTION_KEY`: secreto independiente, aleatorio de 32+ caracteres.
- `BOXFUL_CLIENT_ID`, `BOXFUL_PICKUP_ADDRESS_ID`: IDs de **esta cuenta QA**.
- `BOXFUL_WEIGHT_UNIT=lb`: confirmado por el dueño en el chat el 5 nov 2026.
- `BOXFUL_DIMENSION_UNIT`: vacío/`omit` omite ancho/alto/largo por indicación del
  dueño; no se fabrican dimensiones. Confirmar que QA lo acepta. Si Boxful exige
  medidas, usar `cm`/`in` tras confirmarlo. El catálogo sigue conservando medidas
  reales para proveedores que las necesiten.
- `BOXFUL_ORDER_REFERENCE_CONFIRMED=true`: solo tras comprobar en QA que al crear
  con `orderNumber` se puede recuperar la guía por ese mismo número.
- `SHIPPING_QUOTE_TTL_SECONDS`: vacío = 300, admite 30–900.
- `BOXFUL_WEBHOOK_SECRET`: aleatorio de 32+ caracteres. Registrar el webhook por
  `POST /client-webhook` con este secreto como `accessToken`.
- `BOXFUL_WEBHOOK_TOKEN_HEADER`: vacío usa `accessToken`. Confirmar el nombre
  exacto del header en una notificación QA; no se admiten tokens por query/body.

Auth v2 guarda el par de tokens **cifrado**, asociado al hash de cuenta+host en
`BoxfulSession`. Un bloqueo de fila PostgreSQL abarca lectura, refresh y guardado
para que varias instancias no roten el mismo refresh. Se usa expiración UNIX en
segundos, con margen de 60 s. Refresh inválido/expirado recupera mediante login;
no se reenvía un POST de guía automáticamente por un 401. Rotar el secreto de
cifrado exige borrar de forma controlada la fila de sesión de esa cuenta para
reautenticar; no copiar tokens entre QA/prod. Respaldar y custodiar esa clave
por separado de la base. Nunca imprimir ni enviar al navegador tokens/códigos
de error crudos del proveedor.

Producción usa `https://api.goboxful.com`, cuenta distinta, `VERCEL_ENV=production`
y `BOXFUL_PRODUCTION_ENABLED=true`. Sin las dos últimas condiciones se rechaza
ese host incluso en un build local de producción. Solo esos dos hosts HTTPS son
aceptados; no redirects ni host arbitrario. Esto no activa producción por sí
solo: se mantiene la aprobación del dueño antes de merge/despliegue.

## Municipios y distritos

`/admin/boxful` (ADMIN para mapeo, ADMIN/ACCOUNTING para saldo) consulta el catálogo
real `GET /states`. Para cada departamento, el dueño verifica a qué municipio de
los 44 pertenece cada distrito de la cuenta. Guardar múltiples distritos por
municipio; no seleccionar automáticamente un distrito representativo de varios.
IDs validados en servidor contra departamento y catálogo. Los mapeos se aíslan
por cuenta y host; nunca se usan IDs de ejemplos ni se heredan los de prod.
Checkout muestra solo distritos verificados y la selección debe pertenecer al
municipio/departamento. Sin mapeo, no cotiza. Coordenadas deben pasar el límite
nacional de saneamiento y la cobertura del courier; el rectángulo geográfico no
pretende reemplazar un polígono de frontera ni decidir cobertura.

## Alertas y saldo estimado

Configurar `OPS_ALERT_EMAIL`, Resend existente, `TELEGRAM_BOT_TOKEN` y
`TELEGRAM_CHAT_ID`. Abrir el bot de la tienda en Telegram y enviar `/start`; el
dueño obtiene el chat ID desde su configuración privada (no pegar respuestas
con PII en issues). Probar recepción en ambos canales antes de habilitar QA.

La primera incidencia se envía inmediatamente; nuevas órdenes de ese minuto se
agrupan para el siguiente cron (hasta cinco minutos). La outbox agrupa por cuenta, con lease compartida entre
instancias. Incluye número de pedido, código fijo, importe y enlace admin; no
incluye nombre, correo/teléfono/dirección del cliente. Un canal fallido no
impide el otro; se conserva éxito por canal para no reenviarlo en reintentos.
Cron autenticado existente libera primero reservas y responde; `after()` ejecuta
el mantenimiento de Boxful después de responder, para no superar los 10 s del
cliente del cron. Por pasada procesa hasta tres guías y tres grupos de alertas,
con timeout de 5 s por HTTP y una lease de 60 s por grupo. Resend recibe clave
de idempotencia por lote. Se consulta la outbox, creaciones inciertas y saldo. Un fallo adicional en una orden ya alertada no genera otra alerta
urgente de la misma orden. Nuevos pedidos reciben alertas propias agrupadas.

Registrar en `/admin/boxful` **recargas ya realizadas** en centavos USD; la clave
única del formulario evita duplicarlas al reenviar. Saldo estimado = recargas −
costos cotizados de guías creadas, admite negativos QA. No es el saldo oficial:
Boxful no documenta endpoint de saldo ni monto debitado en la creación. Umbral
`BOXFUL_LOW_BALANCE_ALERT_CENTS` vacío desactiva aviso preventivo; configurado,
alerta una vez por ciclo de recarga cuando baja del umbral.

Límite de entrega de alertas: Telegram no ofrece clave de idempotencia para
`sendMessage`; si el proceso cae después de enviar y antes de persistir éxito,
un reintento puede duplicar esa notificación. La lease y la marca durable evitan
reenvíos ordinarios y concurrentes; no prometen exactamente una entrega frente
a una caída en ese punto. Fallos se registran con códigos fijos, sin datos del
SDK. La outbox sobrevive al proceso y no bloquea el pago.

## Activación pendiente del dueño

- Migraciones aditivas aplicadas en QA, copias de seguridad y clave custodiada.
- Credenciales QA, clientId y bodega configurados; login manual contra devapi.
- Verificar peso en lb y si la cuenta acepta paquetes sin dimensiones.
- Confirmar `orderNumber` y búsqueda por él; luego activar su flag.
- Mapear distritos de cobertura en admin contra la cuenta.
- URL pública HTTPS que sirva la **tienda**, no `SITE_MODE=landing`; registrar
  webhook y verificar header. La landing mantiene todas las APIs en 404.
- `/start` del dueño en Telegram, correo/Telegram comprobados y cron activo.
- Confirmaciones de soporte aún externas: límites, vigencia real, saldo y
  cancelación por API. No habilitar guías reales en producción para probarlas.

## Contratos consultados

Fuentes oficiales Boxful consultadas el 5 nov 2026: [auth v2](https://docs.goboxful.com/api/authenticate-client),
[refresh](https://docs.goboxful.com/api/refresh-access-token),
[couriers](https://docs.goboxful.com/api/list-available-couriers),
[shipment](https://docs.goboxful.com/api/create-shipment),
[consulta](https://docs.goboxful.com/api/get-shipment),
[catálogo](https://docs.goboxful.com/api/list-states-and-cities),
[webhook](https://docs.goboxful.com/api/register-client-webhook).
El HTML del sitio entrega la portada; se verificaron también los módulos de
referencia OpenAPI publicados por ese mismo sitio. No se hicieron solicitudes
a cuentas o creación de guías reales.
