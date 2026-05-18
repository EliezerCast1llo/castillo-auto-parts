# Commercial Validation Workflow - Inventario y proveedores

## Objetivo

Crear un flujo repetible para decidir que SKUs comprar, que proveedores usar y que productos dejar como preorder/mock mientras se valida demanda real.

Este workflow adapta patrones del agente de busqueda de empleo: fuentes controladas, scoring, rechazo por riesgo, seguimiento y reportes.

## Pipeline

Estados:

- `Idea`
- `Research`
- `Supplier Contacted`
- `Workshop Validation`
- `Sample Requested`
- `Sample Review`
- `Ready for QA/PO`
- `Approved to Buy`
- `Preorder Only`
- `Rejected`

## Score de SKU

| Criterio | Peso |
|---|---:|
| Vehiculo/modelo con presencia local | 20 |
| Frecuencia de reemplazo | 15 |
| Menciones de talleres | 20 |
| Disponibilidad con proveedores | 15 |
| Margen estimado | 10 |
| Riesgo de compatibilidad bajo | 10 |
| Evidencia digital/comercial | 10 |

Decisiones:

- `85-100`: comprar inventario fisico.
- `70-84`: comprar pocas unidades o pedir muestra.
- `55-69`: publicar como preorder/consultar disponibilidad.
- `<55`: no listar por ahora.

## Score de proveedor

| Criterio | Peso |
|---|---:|
| Verificacion comercial | 15 |
| Calidad/certificaciones | 20 |
| Precio y margen | 15 |
| MOQ razonable | 10 |
| Garantia/devoluciones | 15 |
| Exporta o entrega a El Salvador | 10 |
| Evidencia tecnica/cross-reference | 10 |
| Tiempo de reposicion | 5 |

Decisiones:

- `85-100`: proveedor candidato principal.
- `70-84`: proveedor secundario o piloto.
- `55-69`: solo muestras/cotizacion.
- `<55`: descartar.

## Senales de rechazo

Rechazar o pausar si aparece:

- falsificacion o replica de marca;
- sin factura;
- sin garantia;
- no acepta muestra;
- no puede demostrar certificaciones en piezas criticas;
- MOQ bloquea capital;
- compatibilidad ambigua;
- no responde preguntas tecnicas;
- reputacion dudosa;
- condiciones de pago riesgosas;
- plazo de entrega incompatible con MVP.

## Fuentes permitidas

- talleres entrevistados;
- proveedores locales;
- catalogos publicos;
- cotizaciones directas;
- Alibaba/Made-in-China/Global Sources con verificacion;
- JETRO/directorios japoneses;
- Google Trends;
- busquedas publicas;
- pruebas comerciales pequeñas;
- datos internos del sitio cuando exista trafico.

## Fuentes no permitidas

- scraping con login;
- datos privados de competidores;
- mensajes privados sin autorizacion;
- compras de datos;
- listados que usen marcas sin autorizacion evidente.

## Reporte por SKU

Cada SKU debe registrar:

- categoria;
- vehiculos compatibles;
- fuente de compatibilidad;
- proveedores;
- costo;
- precio sugerido;
- margen;
- MOQ;
- garantia;
- score;
- decision;
- razones;
- estado del pipeline.

## Reporte por proveedor

Cada proveedor debe registrar:

- nombre;
- pais;
- contacto;
- tipo: fabricante, trading company, distribuidor;
- categorias;
- marcas;
- certificaciones;
- MOQ;
- Incoterms;
- garantia;
- tiempo de entrega;
- score;
- riesgos;
- siguiente accion.

## Cadencia

Semanalmente:

1. Revisar SKUs nuevos.
2. Actualizar cotizaciones.
3. Actualizar scoring.
4. Mover estados.
5. Aprobar compras piloto.
6. Registrar aprendizajes.

## Regla QA/PO

Ningun SKU pasa a `Approved to Buy` sin:

- score >= 85;
- al menos 2 proveedores o una razon clara para proveedor unico;
- compatibilidad validada;
- margen estimado;
- decision humana del QA/PO.

