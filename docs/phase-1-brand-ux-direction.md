# Phase 1 Brand and UX Direction

## Estado

- Fecha: 2026-05-15.
- Estado: borrador para QA/PO.
- Objetivo: proponer marca, tono visual y experiencia base.

## Direccion general

El sitio debe transmitir:

- confianza local;
- rapidez;
- orden;
- compatibilidad clara;
- compra sin confusion.

El objetivo de experiencia es:

> Comprar repuestos sin sentirse perdido.

Debe evitar sentirse como catalogo viejo, taller improvisado o lista tecnica interminable. La referencia aspiracional es retail moderno tipo Siman, pero adaptado a autopartes: busqueda potente, filtros claros y compatibilidad visible.

## Revision de nombre

Actualizacion 2026-05-15:

La busqueda publica encontro coincidencias relevantes con `Castillo Auto Parts`, `Repuestos Castillo` y `Auto Repuestos Castillo` en El Salvador. Por esa razon, `Castillo Auto Parts` queda como codename interno/provisional, pero no debe aprobarse como marca publica sin revision formal en CNR/Registro de Comercio y asesoria legal.

Ver:

- `docs/phase-1-name-clearance.md`

## Nombres propuestos

| Nombre | Ventaja | Riesgo |
|---|---|---|
| Repuestos Castillo | Local, familiar, confiable | Puede sonar tradicional si el diseno no lo moderniza |
| Castillo Parts | Moderno y bilingue | Menos claro para cliente que busca "repuestos" |
| Castillo Auto Parts | Profesional, claro, compatible con ingles | Mas largo |
| AutoCastillo | Corto y memorable | Menos SEO directo |
| Ruta Parts | Mas escalable/lifestyle | Pierde apellido/confianza familiar |
| Motoria | Moderno/startup | Requiere explicar el rubro |

Recomendacion inicial anterior:

**Castillo Auto Parts** como marca comercial digital, con descriptor:

> Repuestos para tu vehiculo, facil y rapido.

Alternativa si se quiere maxima confianza local:

**Repuestos Castillo**

Recomendacion actual:

Explorar alternativas antes de aprobar marca publica. Mantener `Castillo Auto Parts` solo como codename del repo/producto mientras se valida.

## Posicionamiento

Propuesta central:

> Repuestos automotrices confiables en El Salvador, faciles de encontrar por vehiculo, categoria o numero de parte.

Promesa:

> Encuentra el repuesto correcto sin complicarte.

Diferenciadores:

- busqueda por vehiculo;
- compatibilidad visible;
- filtros simples;
- inventario local;
- retiro en bodega;
- envio propio inicial;
- soporte humano cuando el cliente duda.

## Tono de voz

Claro, util y confiable.

Ejemplos:

- "Busca por tu vehiculo."
- "Confirma que esta pieza aplica."
- "Disponible para entrega o retiro."
- "No estas seguro? Te ayudamos a validar."
- "Repuestos listos para seguir rodando."

Evitar:

- exceso de mayusculas;
- lenguaje de remate;
- promesas sin respaldo;
- textos demasiado tecnicos para usuario comun.

## Paleta recomendada

### Propuesta A - recomendada

- Azul profundo: `#12324A`
- Verde stock/compatibilidad: `#19A974`
- Amarillo acento: `#F2B705`
- Gris claro fondo: `#F5F7F8`
- Carbon texto: `#1E252B`
- Blanco: `#FFFFFF`

Razon:

- comunica confianza;
- evita verse como taller antiguo;
- permite estados claros;
- funciona bien en retail moderno.

### Propuesta B - retail tecnico

- Negro suave: `#171A1D`
- Azul electrico moderado: `#2563EB`
- Naranja tecnico: `#F97316`
- Gris interfaz: `#E5E7EB`
- Verde stock: `#16A34A`
- Blanco calido: `#FAFAF9`

### Propuesta C - familiar moderna

- Verde petroleo: `#0F3D3E`
- Rojo controlado: `#C24132`
- Arena clara: `#F4F1EA`
- Azul grisaceo: `#40576B`
- Amarillo suave: `#EAB308`
- Carbon: `#222222`

## Tipografia

Recomendacion:

- Inter;
- Manrope;
- Source Sans 3.

Debe priorizar legibilidad en datos: marca, SKU, numero de parte, compatibilidad, precio y stock.

## Home

La home debe ser funcional desde el primer pantallazo.

Estructura:

1. Header:
   - logo;
   - buscador grande;
   - idioma ES/EN;
   - cuenta;
   - carrito;
   - ayuda/WhatsApp;
   - categorias.

2. Hero funcional:
   - "Encuentra el repuesto correcto para tu vehiculo";
   - selector Marca / Modelo / Ano / Motor;
   - busqueda por numero de parte;
   - CTA "Buscar repuestos";
   - CTA secundario "Validar con asesor".

3. Categorias:
   - frenos;
   - suspension;
   - motor;
   - filtros;
   - aceites y fluidos;
   - electrico;
   - transmision;
   - accesorios.

4. Confianza:
   - compatibilidad verificada;
   - entrega local;
   - retiro en bodega;
   - soporte.

5. Productos:
   - mas vendidos;
   - nuevos ingresos;
   - mantenimiento frecuente.

## Catalogo

El catalogo debe ser el centro del producto.

Filtros MVP:

- categoria;
- marca de repuesto;
- precio;
- disponibilidad;
- vehiculo compatible;
- entrega/retiro;
- ordenamiento por relevancia, precio y disponibilidad.

Tarjeta de producto:

- imagen clara;
- nombre;
- marca;
- numero de parte;
- compatibilidad resumida;
- precio;
- stock;
- boton agregar;
- accion secundaria "Ver compatibilidad".

## Detalle de producto

Debe responder:

1. Esta pieza le queda a mi vehiculo?
2. Esta disponible?
3. Como la compro o valido?

Elementos:

- galeria;
- nombre;
- marca;
- SKU/numero de parte;
- precio;
- stock;
- compatibilidad destacada;
- selector de cantidad;
- CTA agregar;
- CTA validar con asesor;
- opciones retiro/envio;
- descripcion;
- especificaciones tecnicas;
- tabla de compatibilidad;
- productos relacionados.

## Bilingue

Espanol por defecto. Ingles como opcion.

Regla:

- No mezclar idiomas en una misma interfaz.
- La marca puede estar en ingles si se elige "Castillo Auto Parts".
- Los textos visibles deben centralizarse para traduccion.

## Criterios visuales para QA

- El buscador por vehiculo aparece claramente en home y catalogo.
- En movil, los filtros se abren/cierra sin tapar la compra.
- Stock y compatibilidad se entienden rapido.
- Las tarjetas no cortan texto de forma fea.
- Precios, marca y numero de parte son faciles de escanear.
- No depende solo de color para estados.
- Imagenes mantienen proporcion consistente.
- El catalogo no se siente como hoja de Excel.
- Carrito, busqueda y ayuda estan accesibles en movil.
- La experiencia puede completarse con una mano en celular.

## Referencias conceptuales

- Siman: retail moderno, navegacion comercial.
- AutoZone: busqueda por vehiculo.
- CarParts.com / PartsAvatar: logica de compatibilidad.
- Fitment-first tools como Convermax y Fitment IQ: Year-Make-Model search y compatibilidad visible.

## Decision recomendada

Avanzar con dos rutas visuales para comparar:

1. **Castillo Auto Parts** con paleta A.
2. **Repuestos Castillo** con paleta A adaptada a confianza local.

El QA/PO debe elegir el nombre antes del primer diseno de alta fidelidad.

## Fuentes

- Siman El Salvador: https://sv.siman.com/splash/b
- Convermax: https://convermax.com/
- Fitment IQ: https://fitmentiq.com/
- BUBU Auto Parts: https://bubuautoparts.com/
