# Seguimiento de auditoría funcional #138

Pruebas locales y CI usan PostgreSQL aislado, pago mock y envío fake. No ejecutar
las pruebas contra producción. Las políticas legales siguen en #93.

| Punto | Resolución y evidencia |
| --- | --- |
| 1 | `Catalog` se envía a clientes; prueba de namespaces y autocompletado en navegador. |
| 2 | URL mock prefijada según el locale de retorno; pruebas es/en y navegación sin redirect. |
| 3 | Documento 404 global con lang, título, traducciones y enlaces localizados; prueba es/en. |
| 4 | El layout ya no declara canonical/hreflang de home para todas las páginas. Las páginas públicas conservan sus alternates propios; cart, checkout y auth no heredan canonical. |
| 5 | Botón de rechazo protegido por la misma validación de entorno mock. E2E comprueba FAILED y liberación de reservas. |
| 6 | Alta devuelve mensajes por campo y conserva lo escrito; categoría sin elegir ya no sugiere corregir dimensiones. Pruebas de validación y formulario. |
| 7 | GET/HEAD /es en landing redirige 308 a / conservando query y CSP; POST sigue 404. Smoke landing. |
| 8 | La ficha rechazaba únicamente productos inexistentes, no desactivados. Ahora comprueba isActive también. E2E con build de producción; se conserva invalidación por tag/path del admin. |
| 9 | El placeholder de la semilla es intencional: no hay fotografías verificadas de esos repuestos ni un bucket QA configurado. No se inventan fotos asociadas a productos ni se escribe en R2 al sembrar. Para QA visual con fotos usar una imagen propia en un producto de prueba mediante el admin y el bucket QA descrito abajo. |
| 10 | OPTIONS de páginas devuelve 204 y Allow explícito antes de idioma/auth; no emite cookies. No añade CORS ni modifica APIs. |
| 11 | 2FA registra SENT/FAILED, proveedor e ID externo; ni cuerpo ni asunto con código se persisten. Un error de entrega no instala cookie pendiente. |
| 12 | Marcar REFUNDED actualiza Payment PAID a REFUNDED dentro de la transacción. Tras commit envía aviso en el idioma del pedido con EmailLog y clave de idempotencia. Repetir el mismo estado no reenvía ni repone stock. |
| 13 | Mock local del SDK S3 y guía siguiente para comprobar imágenes sin credenciales. |

## Imágenes y R2 en QA

Ejecutar `npx vitest run src/lib/r2.test.ts src/lib/r2-qa.test.ts`.
El segundo archivo sustituye `S3Client.send` por un mock local y verifica
PutObject y DeleteObject, bucket, clave, contenido y URL pública. No sale a la
red ni necesita una cuenta o variables reales. Se pueden simular fallos con
`send.mockRejectedValueOnce(...)` para pruebas de indisponibilidad.

Este mock verifica la integración SDK, no emula el servicio para el navegador.
Para verificar subir, reordenar, eliminar y ver fotos desde el admin, usar un
bucket R2 separado de producción con credenciales limitadas a ese bucket.
Configurar las cinco variables `CLOUDFLARE_R2_*` de `.env.example` solo en el
entorno QA; reconstruir para autorizar su host en `next/image`. Crear un
producto QA, subir una imagen propia, comprobar ficha y miniaturas y después
eliminar imagen y producto. No compartir credenciales ni copiarlas a issues.
La semilla no requiere ese bucket y sigue probando el placeholder sin red.

## Reembolso manual

REFUNDED registra un reembolso previamente confirmado por el operador; **no**
ordena una devolución de dinero a Wompi. Confirmar el movimiento en el proveedor
antes de cambiar el estado. No borra `paidAt` ni eventos históricos del pago.
El correo es posterior al commit: un fallo de envío queda en EmailLog como
FAILED, sin revertir el reembolso. No hay outbox/reintento automático en esta
entrega; soporte debe revisar FAILED. La clave de idempotencia limita duplicados
cuando el proveedor la admite.
