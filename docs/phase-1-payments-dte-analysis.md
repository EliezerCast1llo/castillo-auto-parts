# Phase 1 Payments and DTE Analysis

## Estado

- Fecha: 2026-05-15.
- Estado: borrador para QA/PO.
- Objetivo: recomendar proveedor de pago local y estrategia DTE para MVP.

## Recomendacion ejecutiva

Para pagos, la recomendacion inicial es:

1. **Wompi SV primero** para MVP, por API, enlaces/boton, webhooks, documentacion publica y tarifa visible.
2. **BAC Compra Click como fallback operativo/manual** si Wompi tarda en aprobar onboarding o si se quiere respaldo bancario.
3. **Pagadito como alternativa regional**, pero revisar bien costos, requisitos y experiencia del comprador.

Para DTE, la recomendacion inicial es:

1. **Proveedor DTE con API** si se busca automatizar desde el MVP.
2. **Sistema de Facturacion MH semiautomatico** si el volumen inicial sera bajo y se prefiere reducir riesgo tecnico.
3. No iniciar con integracion directa al Sistema de Transmision MH salvo que se decida invertir tiempo tecnico fuerte en facturacion desde el inicio.

## Pagos - Matriz comparativa

| Proveedor | Encaje MVP | API / Webhooks | Checkout / Links | Costos publicos | Riesgos |
|---|---|---|---|---|---|
| Wompi SV | Alto | API documentada y webhooks HTTP POST | Enlace, boton y API | Sitio publica 3.50% para compras normales | Validar KYC, contracargos, retenciones, estados no exitosos y tiempos de desembolso |
| Pagadito | Medio | Docs dev, sandbox, APIs y plugins | Pagalink, boton, email, QR | Politicas publican USD 0.25 + 5% + impuesto local; afiliacion USD 1.00 | Costo mayor para tickets bajos, posibles reservas, desembolso puede tardar, revisar si comprador necesita cuenta |
| BAC Compra Click | Medio-alto como fallback | No parece API publica para MVP | Link de pago | Matricula USD 50 + IVA, mensual USD 10 + IVA, transaccion negociada | Menos automatizacion, depende de afiliacion BAC y conciliacion |
| BAC E-commerce | Medio | Integracion por contrato | Pasarela bancaria | No hay tarifa publica completa | Onboarding/homologacion puede alargar MVP |
| Serfinsa | Medio | Contacto comercial | Adquirencia/procesamiento | No tarifas publicas en revision inicial | Puede requerir proceso comercial mas enterprise |
| PayPal | Bajo como principal | API madura | Checkout global | Tarifas segun cuenta/contrato | Liquidacion/contabilidad local puede complicarse |
| Stripe | Bajo para entidad salvadorena | API excelente | Checkout/API | No aplica local | El Salvador no es pais soportado para cuenta local |

## Comisiones publicas revisadas

| Proveedor | Comision/costo publicado | Ejemplo ticket USD 25 | Comentario |
|---|---:|---:|---|
| Wompi SV | 3.50% para compras normales | USD 0.88 aprox. | La pagina indica que no hay cuota mensual, membresia ni costo de implementacion. La calculadora tambien muestra posibles retenciones/IVA segun tipo de contribuyente. |
| Pagadito | USD 0.25 + 5% + impuesto local; afiliacion USD 1.00; retiros ES USD 0.29 o USD 0.60 | USD 1.70 aprox. si se calcula 13% sobre la comision base | Es mas caro en tickets bajos por el fijo de USD 0.25. Tambien hay posible reserva por riesgo y recargo de contracargo. |
| BAC Compra Click | Matricula USD 50 + IVA; mensual USD 10 + IVA; transaccion negociada | No calculable sin oferta comercial | Buen fallback, pero hay costo fijo y la comision por transaccion no esta publicada. |
| BAC E-commerce | No publicado completo | No calculable | Requiere cotizacion/afiliacion. |
| Serfinsa | No publicado en revision inicial | No calculable | Requiere contacto comercial. |
| Payvalida | No tarifa SV clara en revision inicial | No calculable | Requiere confirmar disponibilidad, metodos y liquidacion en El Salvador. |
| PayWay SV | No publicado en revision inicial | No calculable | Requiere contacto comercial. |
| PayPal | Depende de cuenta/contrato PayPal | No calculable sin configuracion | Mejor como complemento internacional, no como proveedor local principal. |

Lectura comercial:

- Para ticket bajo, Wompi luce mejor entre las tarifas publicas revisadas.
- Pagadito puede ser util por cobertura regional/herramientas, pero el fijo + porcentaje castiga productos baratos.
- BAC Compra Click puede ser bueno como respaldo por confianza bancaria, pero no permite comparar costo real hasta tener propuesta comercial.
- Antes de firmar, pedir a cada proveedor una simulacion para tickets de USD 10, 25, 50, 100 y 250, incluyendo IVA, retenciones, contracargos, retiros y plazo de liquidacion.

## Wompi - Lectura inicial

Ventajas:

- Enlaces de pago, boton y API.
- Documentacion publica.
- Webhooks para notificacion de transacciones exitosas.
- Tarifa publica de referencia: 3.50% para compras normales.
- Sin cuota mensual ni implementacion segun pagina publica.
- Opera en USD y con tarjetas Visa/Mastercard.

Riesgos/preguntas:

- Confirmar si actividad "repuestos automotrices" tiene restricciones.
- Confirmar requisitos KYC para persona natural o juridica.
- Confirmar tiempos de desembolso reales.
- Confirmar manejo de devoluciones y contracargos.
- Confirmar si webhook cubre solo exitos o tambien fallidos/cancelados.
- Confirmar retenciones/impuestos aplicables por tipo de contribuyente.

Decision tecnica recomendada:

- Implementar `PaymentProvider` con adaptador Wompi.
- Usar enlace/checkout hospedado al inicio.
- Guardar payloads de webhook.
- Agregar consulta/polling de estado para ordenes ambiguas.
- Hacer idempotencia por referencia externa/transaccion.

## Pagadito - Lectura inicial

Ventajas:

- Proveedor regional con presencia en Centroamerica.
- Tiene documentacion para desarrolladores.
- Sandbox y APIs/plugins.
- Herramientas como links, QR, email payment y pagos recurrentes.

Riesgos:

- Tarifa publica puede ser alta para tickets bajos.
- Politicas mencionan validacion documental, revision de sitio y certificacion tecnica.
- Puede aplicar reserva por riesgo.
- Desembolso puede depender de politica o acuerdo.
- Revisar cuidadosamente si el comprador necesita cuenta Pagadito en el flujo elegido.

## BAC Compra Click - Lectura inicial

Ventajas:

- Confianza bancaria local.
- Link de pago facil.
- Puede soportar cuotas/programas del banco.
- Reporte de ventas en tiempo real segun BAC.

Riesgos:

- No es la mejor opcion si se necesita automatizar estado de orden desde el dia 1.
- Requiere comercio afiliado y cuenta BAC.
- Costos fijos: matricula y mensualidad.
- Comision por transaccion depende de negociacion.

Uso recomendado:

- Fallback operativo manual.
- Opcion secundaria mientras Wompi se prueba o aprueba.

## Datos de pago que debe guardar el sistema

- `paymentProvider`
- `providerPaymentId`
- `providerReference`
- `orderId`
- `amountCents`
- `currency`
- `status`
- `checkoutUrl`
- `authorizationCode`
- `paidAt`
- `rawStatus`
- `webhookPayload`
- `webhookReceivedAt`
- `isWebhookValid`
- `idempotencyKey`
- `reconciliationStatus`

## DTE - Opciones

| Opcion | Uso recomendado | Pros | Contras |
|---|---|---|---|
| Sistema de Facturacion MH | Bajo volumen, arranque controlado | Oficial, gratuito, menor desarrollo | No se integra con el sistema, operacion manual |
| Proveedor DTE con API | MVP con ventas recurrentes | Reduce complejidad, emite desde e-commerce | Costo y dependencia de proveedor |
| Sistema de Transmision MH directo | Fase futura con volumen/control | Control completo, integracion propia | Alta complejidad tecnica y fiscal |

## Proveedores DTE candidatos

Evaluar:

- Ocote DTE;
- Atto;
- MiFacturaDTE;
- MiDTE SV;
- otros proveedores recomendados por contador.

Criterios:

- API REST;
- sandbox;
- webhooks/estado;
- emision Factura 01 y CCF 03;
- notas de credito/debito;
- invalidaciones;
- contingencia;
- almacenamiento de JSON/PDF;
- soporte local;
- costos por DTE;
- SLA;
- documentacion tecnica.

## Datos DTE que debe guardar el sistema

### Orden

- orden;
- carrito;
- descuentos;
- envio;
- medio de pago;
- estado de pago.

### Receptor

- nombre o razon social;
- email;
- telefono;
- tipo y numero de documento cuando aplique;
- NIT/NRC/DUI cuando aplique;
- direccion;
- giro/actividad economica si CCF.

### Lineas

- producto;
- cantidad;
- precio unitario;
- descuentos;
- IVA;
- gravado/exento/no sujeto;
- unidad de medida.

### Documento fiscal

- tipo DTE;
- codigo de generacion;
- numero de control;
- sello de recepcion;
- fecha/hora emision;
- estado MH/proveedor;
- JSON firmado;
- respuesta MH;
- PDF/representacion grafica;
- QR o URL de consulta;
- errores;
- reintentos.

## Preguntas para contador/proveedor DTE

1. Que documentos emitiremos en MVP: Factura 01, CCF 03, Nota de Credito 05, Nota de Debito 06, Sujeto Excluido 14.
2. Cuando debe emitirse el DTE: al pago aprobado, al despacho o al cierre diario.
3. Para consumidor final, que datos minimos se deben pedir.
4. En que casos se exige DUI/NIT/correo.
5. Como manejar devoluciones parciales, anulaciones y contracargos.
6. Que pasa si el pago fue aprobado pero MH/proveedor DTE esta caido.
7. Quien envia el DTE al cliente.
8. Que reportes necesita contabilidad.
9. Cuanto tiempo conservar JSON, PDF y respuestas.
10. Si el proveedor cubre contingencia, invalidaciones y ambiente productivo/pruebas.

## Decision recomendada para MVP

Preparar el sistema para dos modos:

- `DTE_MODE=MANUAL`: orden pagada queda con factura `PENDING_MANUAL`.
- `DTE_MODE=PROVIDER`: el backend llama a proveedor DTE despues de pago confirmado.

Esto permite arrancar con proceso semiautomatico y migrar a API sin reescribir el dominio.

## Fuentes

- Wompi SV: https://wompi.sv/
- Wompi API: https://docs.wompi.sv/
- Pagadito politicas: https://www.pagadito.com/contenido/POLITICAS_COMERCIOS
- Pagadito developers: https://dev.pagadito.com/en/el-salvador/
- BAC Compra Click SV: https://ayuda.baccredomatic.com/para_empresas_o_negocios/comercios_afiliados/compra-click?country=es-sv
- BAC afiliacion comercio SV: https://ayuda.baccredomatic.com/para_empresas_o_negocios/comercios_afiliados/afiliar-un-comercio?country=es-sv
- Ministerio de Hacienda DTE: https://factura.gob.sv/
- Pasos para ser emisor DTE: https://factura.gob.sv/2020/09/02/ent1/
- Informacion tecnica DTE: https://factura.gob.sv/informacion-tecnica-y-funcional/
- Ocote DTE API Connect: https://docs.ocote.io/
- Atto: https://atto.sv/
- MiFacturaDTE: https://www.mifacturadte.com/
