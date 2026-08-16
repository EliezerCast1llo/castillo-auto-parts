# Segmentación y cliente objetivo

## Matriz de selección preliminar

Puntaje 0–100: demanda/recurrencia 25, urgencia 15, facilidad de adquisición 15, ajuste a operación 15, margen potencial 10, posibilidad de recompra 10, riesgo operativo invertido 10. Son estimaciones de trabajo y deben recalibrarse con entrevistas.

| Segmento | Usuario/comprador/pagador | Prescriptor/instalador | Problema y urgencia | Canal | Recompra | Riesgo | Puntaje preliminar |
|---|---|---|---|---|---|---|---:|
| Propietario con indicación | mismo propietario | mecánico / mecánico | pieza correcta, rápida; alta | web + WhatsApp | media | compatibilidad | 82 |
| Propietario sin identificación | propietario | mecánico o asistencia | no sabe qué comprar; media-alta | WhatsApp, llamada, web asistida | media | error de diagnóstico | 68 |
| Mecánico independiente | mecánico o cliente del taller | mecánico | disponibilidad, precio y confianza; alta | WhatsApp, llamada, catálogo | alta | crédito, urgencias | 84 |
| Taller | taller | técnico jefe | surtido, SLA, factura; alta | WhatsApp, teléfono, portal | alta | crédito, devoluciones | 72 |
| Flota empresarial | encargado de compras | taller interno | costo total, disponibilidad, crédito | cotización formal | alta | volumen y capital | 48 |
| Revendedor | revendedor | comprador | precio mayorista y abastecimiento | WhatsApp, catálogo mayorista | alta | presión de precio/crédito | 43 |

Los puntajes no son datos observados; son una priorización operativa a validar.

## Evaluación del modelo propuesto

El modelo web para propietarios, con mecánicos como prescriptores/compradores y WhatsApp como asistencia, es coherente con la evidencia competitiva: BUBU declara búsqueda por vehículo/OEM y entrega o retiro; Super Repuestos comunica asistencia para comprar y entrega al hogar/taller. No se debe asumir que la interfaz web será el canal de mayor volumen: el MVP debe registrar canal de origen, quién decidió la pieza, quién pagó y quién instaló. [BUBU](https://bubuautoparts.com/) y [Super Repuestos](https://ecomm-dev-sv.superrepuestos.com/) (consultadas 2026-08-02).

## Recomendación

- **Principal:** propietarios con indicación del mecánico, con checkout simple y botón de WhatsApp que envíe el vehículo y el producto.
- **Secundario:** mecánicos independientes, con lista de precios clara, confirmación de aplicación, retiro rápido y recompra.
- **Después:** talleres con condiciones comerciales; flotas y revendedores quedan fuera del MVP por crédito, volumen y capital.

## Propuesta de valor

- Propietario: “Confirma la pieza para tu vehículo y recibe una respuesta clara antes de pagar”.
- Mecánico: “Envía la aplicación y recibe disponibilidad, alternativa de marca y hora de retiro”.

## Investigación de comportamiento

Preguntar siempre por la última compra real y registrar fecha, vehículo, pieza, canal, lugares consultados, tiempo, precio pagado, marca, confirmación de compatibilidad, error/devolución y disposición a pagar por rapidez/seguridad. No usar edad del mecánico como proxy de canal; probar WhatsApp, llamada y nota de voz.

