# Reused Agent Patterns - Freelance Agent to Auto Parts Project

## Estado

- Fecha: 2026-05-15.
- Fuente revisada: `/Users/eliezercastillo/freelance-agent`.
- Alcance: se reutilizan patrones de operacion, no datos personales, credenciales ni historiales privados.

## Patrones reutilizables encontrados

## 1. Politica de fuentes

El agente de empleo tiene una regla sana: preferir alertas, fuentes publicas y exportaciones manuales, evitando scraping de paginas con login.

Adaptacion al proyecto:

- usar catalogos publicos, cotizaciones enviadas por proveedores, entrevistas con talleres y exportaciones manuales;
- no automatizar scraping de competidores con login;
- no intentar extraer datos privados;
- guardar evidencia y fuente de cada dato.

## 2. Scoring con umbrales

El agente de empleo usa umbrales para decidir `apply`, `review` o `discard`.

Adaptacion:

- `buy`: comprar inventario fisico;
- `validate`: pedir muestra, cotizar o publicar como preorder;
- `discard`: no comprar/no listar por ahora.

Umbrales recomendados:

- `buy`: 85+;
- `validate`: 70-84;
- `preorder`: 55-69;
- `discard`: menor a 55.

## 3. Rechazo por senales negativas

El agente descarta oportunidades por terminos de mala calidad.

Adaptacion a proveedores/SKUs:

- falsificacion;
- sin garantia;
- sin muestra;
- sin factura;
- sin certificaciones para piezas criticas;
- MOQ demasiado alto;
- sin exportacion a El Salvador;
- uso no autorizado de marcas OEM;
- compatibilidad poco clara;
- sin politica de devolucion.

## 4. Separacion entre datos verificados y no verificados

El agente no afirma experiencia que no esta verificada.

Adaptacion:

- no marcar producto como "en stock" si no existe inventario real;
- no decir "compatible" sin validacion de catalogo, taller, proveedor u OE cross-reference;
- no publicar una marca como oficial si el proveedor no demuestra autorizacion;
- no prometer tiempos de entrega sin proveedor/logistica confirmada.

## 5. Output estructurado

El agente devuelve JSON compacto y reportes tabulares.

Adaptacion:

- crear matrices de proveedores;
- crear scorecards por SKU;
- exportar reportes para QA/PO;
- mantener razones de cada decision.

## 6. Propuestas/mensajes controlados

El agente genera propuestas sin inventar datos.

Adaptacion:

- plantillas para contactar proveedores;
- plantillas para entrevistar talleres;
- plantillas para consultar Wompi/BAC/DTE;
- mensajes revisables por el humano antes de enviarse.

## Regla de seguridad

No reutilizar:

- datos personales;
- historiales de aplicaciones;
- correos;
- tokens;
- credenciales;
- llaves privadas;
- mensajes privados.

## Decision

Usar estos patrones como sistema operativo comercial del proyecto:

- sourcing;
- validacion de inventario;
- contacto con proveedores;
- seguimiento;
- scoring;
- reportes QA/PO.

