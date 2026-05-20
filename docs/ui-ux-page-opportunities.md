# Oportunidades UX por página

Fecha: 2026-05-20.

## Home

Aplicado:

- Búsqueda global funcional desde el header.
- Búsquedas populares para validar categorías de demanda.
- Mensajes de confianza enfocados en compatibilidad, envío local y compra invitada.

Siguiente:

- Medir clicks en búsquedas populares.
- Añadir bloques por categoría cuando exista inventario real.
- Evaluar hero más compacto si el catálogo crece.

## Catálogo

Aplicado:

- Chips de filtros activos con limpieza individual.
- Estado vacío con explicación y acción de limpieza.
- SKU, parte, compatibilidad y disponibilidad visibles en cards.

Siguiente:

- Drawer mobile para filtros.
- Ordenamiento por relevancia, precio y disponibilidad.
- Paginación o filtros en base de datos cuando el catálogo pase de mock/MVP.

## Carrito

Aplicado:

- SKU visible por línea.
- Revisión antes de pagar con disponibilidad, pago en línea y entrega.
- Mantiene stepper editable para cantidades.

Siguiente:

- Separar `CartLineItem` y `CheckoutReadiness` en componentes propios.
- Validar cantidades con un helper dedicado y pruebas.
- Limpiar SKUs inválidos al leer carrito.

## Recomendaciones técnicas relacionadas

- Desactivar fallback silencioso a mock data en producción.
- Separar estado interno de inventario de labels públicos.
- Estructurar compatibilidad vehicular en datos, no solo texto.
- Agregar nombres accesibles a links visuales y formularios críticos.
