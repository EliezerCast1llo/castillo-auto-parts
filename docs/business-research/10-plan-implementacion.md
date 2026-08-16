# Plan de implementación posterior a la investigación

Este documento no implementa funciones. El orden queda condicionado a validación comercial, pagos, DTE, garantías, devolución y privacidad.

| Prioridad | Función | Clase | Dependencias | Complejidad | Riesgo | Criterio de aceptación |
|---:|---|---|---|---|---|---|
| 1 | Catálogo con SKU, precio, marca y fuente | validar | datos reales | M | datos obsoletos | cada SKU tiene fuente/fecha |
| 1 | Selector marca/modelo/año/motor | validar | taxonomía/aplicaciones | M | falso positivo | solo aplicaciones confirmadas |
| 1 | WhatsApp con vehículo/producto | validar | consentimiento | S | datos incompletos | no incluye PII innecesaria |
| 1 | Solicitud de cotización | validar | proveedor/registro | S | promesas | registra SLA y resultado |
| 1 | Búsquedas sin resultado | validar | analítica | S | perder demanda | evento sin VIN |
| 2 | Disponibilidad/reserva | operar | inventario/proveedor | M | vender sin stock | confirma antes de promesa |
| 2 | Pedidos y retiro | operar | políticas/horarios | M | no-show | estado y entrega trazables |
| 2 | Entrega por terceros | operar | tarifas/SLA | M | retraso/margen | costo real registrado |
| 2 | Devoluciones/garantías | operar | políticas/proveedor | M | pérdida de margen | caso auditable |
| 2 | Inventario/reorden | operar | costos/MOQ | M | capital inmovilizado | movimientos conciliados |
| 2 | Panel administrativo | operar | roles/auditoría | M | acceso indebido | permisos y log verificados |
| 3 | Analítica de embudo/recompra | conveniente | eventos/privacidad | M | métricas falsas | definiciones documentadas |
| 3 | Automatización de compatibilidad | conveniente | datos de alta cobertura | L | error | pruebas con mecánico |
| 4 | Crédito, instalación, flotas, marketplace amplio | fuera MVP | capital/equipo | L | exposición financiera | reabrir con evidencia |

El repositorio ya contiene catálogo, filtros, inventario, checkout, reservas, administración y pruebas. La brecha comercial es reemplazar datos mock por fuentes reales, cerrar pagos/DTE/garantías/devoluciones/mensajería y medir la operación antes del lanzamiento.

