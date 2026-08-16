# Modelo de inventario MVP

## Arquitectura híbrida

1. **Almacenar:** 20–40 SKU de filtros, frenos, bujías, escobillas e iluminación, solo después de cotización y validación.
2. **Proveedor local:** catálogo amplio con existencia confirmada antes de prometer entrega.
3. **Importar bajo pedido:** piezas específicas, de baja rotación o alto valor con anticipo y plazo explícito.
4. **Excluir:** SKU sin aplicación confiable, garantía clara o condiciones de almacenamiento.

## Reglas de compra

- Etapa 0 sin inventario.
- Etapa 1 USD 300–500 y 1–2 unidades por SKU, salvo evidencia excepcional.
- Techo provisional de inventario inmovilizado: USD 1,500.
- Reponer solo SKU vendido o reservado con contribución positiva.
- Punto de reorden = demanda semanal validada × semanas de reposición + stock de seguridad.
- ABC: A = 70% del margen de contribución acumulado; B = siguiente 20%; C = último 10%, cuando el dato sea real.

## Criterios de avance

Pasar de Etapa 0 a 1 con 20 entrevistas, 10 cotizaciones, 5 pedidos pagados/reservados y cero errores críticos. Pasar a Etapa 2 con rotación ≥1.0x en 60 días, contribución ≥15%, devoluciones por incompatibilidad ≤5% y reposición documentada. Si no se cumplen, mantener catálogo bajo pedido.

El archivo `inventario-mvp.csv` contiene estructura auditable; costo, precio, MOQ, reposición y confianza quedan `ND` hasta recibir cotizaciones.

