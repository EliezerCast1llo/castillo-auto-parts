# Castillo Autoparts — resumen ejecutivo de prefactibilidad

**Fecha de consulta:** 2026-08-02. **Cobertura:** Santa Tecla y San Salvador. **Moneda:** USD.

## Dictamen

**Avanzar con condiciones.** La oportunidad es operativamente plausible, pero todavía no existe evidencia primaria suficiente para aprobar compras definitivas, márgenes ni una selección de SKU. La condición para pasar de investigación a inventario piloto es obtener cotizaciones comparables de al menos tres proveedores, confirmar políticas de garantía/devolución y lograr pedidos asistidos pagados o reservados de clientes reales.

## Qué problema puede resolver

El problema no es simplemente “encontrar un repuesto”; es reducir el tiempo y el riesgo de comprar una pieza incompatible. La propuesta combina catálogo por vehículo, asistencia por WhatsApp, verificación de aplicación, retiro o mensajería y una política clara de garantía. La competencia ya comunica catálogo, asistencia y entrega: BUBU muestra búsqueda por vehículo/OEM y entrega o retiro; Super Repuestos muestra compra en línea, asistencia y entrega; Econoparts comunica mayoreo, centro de distribución y respuesta comercial. Fuentes: [BUBU Auto Parts](https://bubuautoparts.com/), [Super Repuestos](https://ecomm-dev-sv.superrepuestos.com/), [Econoparts](https://www.econoparts.com/?page_id=75) (consultadas 2026-08-02).

## Oportunidad y cliente recomendado

- **Cliente principal del MVP:** propietario de vehículo que ya recibió diagnóstico o número de parte del mecánico y necesita confirmar compatibilidad, precio y disponibilidad con rapidez.
- **Cliente secundario:** mecánico independiente como prescriptor y comprador recurrente; debe poder enviar marca, modelo, año, motor, pieza y foto por WhatsApp.
- **No priorizar aún:** flotas y revendedores; exigen crédito, disponibilidad amplia, entregas y capital operativo que no encajan con USD 3,000 y 3–4 horas diarias.

La base vehicular nacional superó 2 millones de unidades en 2025 según una publicación que atribuye el dato a ONASEVI; esa señal valida el tamaño general del mercado, pero no demuestra demanda local por SKU ni sustituye un desglose oficial descargable por municipio/modelo. [Diario El Mundo, 2025-12-07](https://diario.elmundo.sv/ampArticle/estas-son-las-cinco-marcas-de-vehiculos-que-concentran-la-mayor-parte-del-parque-vehicular-en-el-salvador?amp=1) y [ONASEVI, Parque Vehicular](https://observatoriovial.fonat.gob.sv/parque-vehicular/) (consultadas 2026-08-02).

## Marcas, modelos y categorías — hipótesis de trabajo

Marcas a investigar primero: Toyota, Nissan, Honda, Kia, Hyundai, Mitsubishi, Chevrolet, Mazda, Ford, Suzuki, Isuzu, Volkswagen, Mercedes-Benz, Great Wall y Land Rover. No son una compra aprobada.

Combinaciones prioritarias para validar con proveedor/taller: Toyota Corolla, Yaris, Hilux y Tacoma; Nissan Sentra, Versa, Rogue y Frontier; Hyundai Accent y Elantra; Kia Rio, Forte y Soul; Honda Civic y CR-V; Mitsubishi Mirage; Mazda 3; Chevrolet Aveo; Ford Ranger; Suzuki Swift; Isuzu D-Max. Cada combinación debe separarse por generación, año y motor; no se debe extrapolar de marca a modelo.

Categorías candidatas para validar: filtros, frenos, bujías/encendido, escobillas e iluminación básica. Lubricantes, baterías, sensores, suspensión, refrigeración y eléctricos se mantienen en evaluación por almacenamiento, garantía, peso, compatibilidad y capital.

## Modelo de inventario y capital

Se interpreta provisionalmente que **USD 3,000 es capital total inicial**, no presupuesto exclusivo de inventario, porque el prompt también exige publicidad, empaques, herramientas, mensajería, devoluciones y reserva. Debe confirmarse antes de comprar.

- Etapa 0: USD 0 de inventario; investigación, cotizaciones y ventas asistidas bajo pedido.
- Etapa 1: USD 300–500 de inventario piloto, solo SKU con alta confianza y proveedor comprobable.
- Etapa 2: ampliación progresiva con reposición financiada por ventas; techo provisional de USD 1,500 inmovilizados.
- Reserva no comprometida: al menos USD 1,000–1,500 para reposición, operación, errores y contingencias, según cotizaciones reales.

Modelo híbrido: almacenar consumibles compactos y de aplicación simple; ofrecer piezas de proveedor local sin inventario propio; importar bajo pedido; excluir durante el MVP piezas costosas, frágiles, de VIN, módulos, carrocería, híbridos/EV y categorías con garantía incierta.

## Escenario financiero

El libro `modelo-financiero.xlsx` contiene escenarios conservador, base y optimista de 12 meses. Son **hipótesis, no resultados**: 8/20/35 pedidos mensuales promedio, ticket de USD 35/45/55 y margen bruto de 30%/35%/40%. Se modelan comisión de pago de 4%, empaque de USD 0.75, devoluciones esperadas de 2%/3%/4%, garantía de 1%/2%/3%, publicidad mensual de USD 50/100/180 y costo fijo de USD 50/75/100. Estas tasas deben sustituirse por datos de proveedores, mensajería, procesador y ventas reales.

Contribución por pedido = precio – costo puesto en bodega – comisión – empaque – subsidio de envío – devolución esperada – garantía esperada. El escenario base no debe aprobarse si la contribución por pedido no cubre el costo de adquisición del cliente y el tiempo operativo. El modelo calcula punto de equilibrio, flujo de caja, rotación, días de inventario, GMROI y capital adicional requerido.

## Riesgos principales

Compatibilidad incorrecta, falsificaciones, proveedor sin existencia, variación de precio, devoluciones y garantías pueden consumir el margen. La operación desde una cochera añade riesgo de humedad, seguridad, acceso y almacenamiento de productos regulados o pesados. La venta electrónica requiere atender garantías, reversión de pagos, resumen/confirmación de pedido y conservación de información; la Defensoría describe obligaciones específicas para comercio electrónico y la Ley contempla reversión de pagos en ciertos casos. [Defensoría del Consumidor](https://www.defensoria.gob.sv/obligaciones/) y [Ley de Protección al Consumidor, art. 13-C/13-D](https://www.asamblea.gob.sv/sites/default/files/documents/decretos/A9FF9667-4147-46A6-A70E-2A1F3B581A51.pdf) (consultadas 2026-08-02). Hacienda documenta el marco de DTE y su incorporación gradual. [Ministerio de Hacienda](https://www.mh.gob.sv/reformas-al-codigo-tributario-relativas-a-la-facturacion-electronica-documentos-tributarios-electronicos-dte/) (consultada 2026-08-02).

## Próxima decisión

Avanzar a 8–12 semanas de validación, sin compra definitiva. Pasar a etapa 1 únicamente si se cumplen: (1) 3 proveedores con existencia y garantía verificadas; (2) al menos 20 entrevistas válidas, incluyendo propietarios y mecánicos; (3) 10 solicitudes reales de cotización; (4) al menos 5 pedidos pagados/reservados o evidencia equivalente; (5) cero errores críticos de compatibilidad en una muestra revisada por mecánico; y (6) contribución proyectada por pedido ≥ USD 7 o el umbral que resulte necesario tras medir adquisición, tiempo y mensajería.

