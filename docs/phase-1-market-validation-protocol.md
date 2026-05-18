# Phase 1 Market Validation Protocol - Confianza 80-90%

## Estado

- Fecha: 2026-05-15.
- Estado: protocolo para ejecutar antes de compra fuerte de inventario.

## Punto clave

Un estudio de escritorio con fuentes publicas no puede dar 80-90% de seguridad para comprar inventario. Puede dar una hipotesis razonable, normalmente 50-70% segun calidad de datos.

Para llegar a una confianza de 80-90%, se necesita combinar:

- datos publicos;
- validacion con talleres;
- cotizaciones de proveedores;
- disponibilidad real;
- margen;
- pruebas de demanda;
- compatibilidad confirmada.

## Modelo de confianza

Cada SKU recibe un score de 0 a 100.

| Evidencia | Peso |
|---|---:|
| Presencia del vehiculo en parque local | 20 |
| Frecuencia de reemplazo del repuesto | 15 |
| Confirmacion de 3+ talleres | 20 |
| Disponibilidad con 2+ proveedores | 15 |
| Margen bruto esperado aceptable | 10 |
| Riesgo de compatibilidad bajo | 10 |
| Demanda digital/consultas/prueba comercial | 10 |

Interpretacion:

- `85-100`: comprar inventario fisico con confianza alta.
- `70-84`: comprar pocas unidades o validar una ronda mas.
- `55-69`: publicar como preorder/consultar disponibilidad.
- `<55`: no comprar todavia.

## Validacion con talleres

Meta:

- 8 a 12 talleres en San Salvador/Santa Tecla.

Preguntas:

1. Cuales son los 20 repuestos que mas cambian por semana?
2. Para que modelos los piden mas?
3. Que marcas recomiendan y cuales evitan?
4. Que piezas cuesta conseguir rapido?
5. Que precio considera aceptable el cliente?
6. Que repuestos devuelven mas por incompatibilidad?
7. Que repuestos compran de emergencia?
8. Que proveedores usan actualmente?

Evidencia requerida:

- conteo de menciones por SKU/categoria;
- vehiculos asociados;
- notas de compatibilidad;
- marcas recomendadas.

## Validacion con proveedores

Meta:

- 3 a 5 proveedores locales/regionales.
- 2 a 3 proveedores internacionales potenciales por categoria.

Preguntas:

1. Precio mayorista por SKU.
2. MOQ.
3. disponibilidad inmediata.
4. tiempo de reposicion.
5. politica de devolucion/garantia.
6. marcas disponibles.
7. certificaciones.
8. compatibilidad/OE cross-reference.
9. costo de envio/importacion estimado.

## Prueba comercial

Antes de comprar profundo:

- publicar 30 a 50 productos con stock real/mock/preorder claramente marcado;
- medir busquedas internas;
- medir clics "validar compatibilidad";
- medir consultas por WhatsApp;
- medir add-to-cart;
- medir intentos de checkout;
- probar anuncios pequenos por categoria.

No usar "en stock" si no existe inventario real.

## Umbral para compra

Comprar inventario fisico si:

- score >= 85;
- al menos 3 talleres lo mencionan;
- al menos 2 proveedores lo ofrecen;
- compatibilidad esta clara;
- margen cubre comision de pago, envio, IVA operativo, devoluciones y empaques;
- el costo de inventario no bloquea otras categorias.

## Entregable final esperado

Tabla por SKU:

- categoria;
- SKU conceptual;
- vehiculos;
- compatibilidad;
- talleres que lo mencionan;
- proveedores disponibles;
- costo;
- precio sugerido;
- margen;
- score;
- decision: comprar, preorder, no listar.

## Recomendacion actual

Usar mock data para construir el producto tecnico, pero no presentar el catalogo como inventario real hasta terminar esta validacion.

