# Phase 1 Market Research Report - Inventario inicial

## Estado

- Fecha: 2026-05-15.
- Estado: borrador para QA/PO.
- Alcance: hipotesis inicial basada en senales publicas.
- Pendiente: validar con talleres, proveedores, Google Trends en vivo y cotizaciones reales.

## Resumen ejecutivo

La mejor primera apuesta no es comprar repuestos caros o de compatibilidad compleja. La recomendacion es empezar con productos de mantenimiento frecuente, bajo ticket relativo y alta rotacion:

- filtros;
- frenos de alta rotacion;
- bujias;
- escobillas;
- focos;
- fluidos;
- algunos consumibles electricos/universales.

El catalogo puede mostrar mas variedad que el inventario fisico, pero el inventario real inicial debe ser conservador. Para arrancar:

- catalogo inicial visible: 50 a 80 SKUs;
- inventario fisico inicial: 25 a 40 SKUs;
- compra fisica recomendada: 1 a 3 unidades por SKU, con 3 a 6 unidades solo en productos muy probables para Corolla, Sentra, Hyundai/Kia compactos y Civic.

## Senales publicas relevantes

### Parque vehicular

Segun reportes de Diario El Mundo basados en datos de ONASEVI, El Salvador supera los 2 millones de unidades de parque vehicular. San Salvador y La Libertad concentran una parte clave del mercado inicial, lo cual valida empezar con San Salvador y Santa Tecla.

Marcas con mayor presencia reportada:

- Toyota;
- Nissan;
- Honda;
- Kia;
- Hyundai;
- Mitsubishi.

Modelos con mayor presencia segun el ranking publicado en abril de 2026:

| Ranking | Modelo | Unidades reportadas |
|---:|---|---:|
| 1 | Toyota Corolla | 60,983 |
| 2 | Nissan Sentra | 54,245 |
| 3 | Toyota Hilux | 42,298 |
| 4 | Nissan Rogue | 40,573 |
| 5 | Hyundai Accent | 36,156 |
| 6 | Hyundai Elantra | 35,626 |
| 7 | Honda Civic | 35,485 |
| 8 | Nissan Frontier | 28,088 |
| 9 | Kia Forte | 25,736 |
| 10 | Kia Soul | 25,526 |
| 11 | Kia Rio | 23,322 |
| 12 | Nissan Versa | 23,022 |
| 13 | Toyota Yaris | 20,482 |
| 14 | Toyota Tacoma | 18,573 |
| 15 | Mitsubishi Mirage | 17,676 |

Implicacion: el inventario inicial debe priorizar Toyota, Nissan, Hyundai/Kia y Honda.

### Competidores visibles

Competidores locales visibles como Super Repuestos, Econoparts y BUBU Auto Parts muestran categorias recurrentes:

- filtros;
- sensores;
- electrico;
- frenos;
- motor;
- suspension;
- aire acondicionado;
- enfriamiento;
- lubricantes;
- baterias.

BUBU Auto Parts tambien comunica busqueda por nombre, numero OEM y modelo especifico del vehiculo. Eso confirma que la compatibilidad vehicular debe ser una parte central del producto, no un detalle secundario.

## Categorias candidatas

### Prioridad alta para inventario fisico

Estas categorias combinan rotacion, ticket manejable y menor riesgo de obsolescencia:

- filtros de aceite;
- filtros de aire;
- filtros de cabina;
- pastillas delanteras de freno;
- bujias;
- escobillas;
- focos comunes;
- aceite;
- refrigerante;
- liquido de frenos;
- limpiador de frenos;
- fusibles, relays y consumibles simples.

### Prioridad media para catalogo y compra bajo demanda

Estas categorias pueden vender bien, pero tienen mas riesgo de compatibilidad o capital:

- discos delanteros;
- zapatas;
- amortiguadores;
- terminales;
- rotulas;
- bieletas;
- fajas;
- termostatos;
- bombas de agua;
- bobinas;
- sensores O2, MAF y MAP.

### Evitar como inventario fisico inicial

- carroceria;
- faros por version;
- modulos electronicos;
- sensores caros;
- compresores de A/C;
- partes CVT especificas;
- piezas hibridas/EV;
- repuestos para marcas emergentes sin datos de rotacion;
- piezas que dependan de VIN si no hay proceso de validacion.

## Vehiculos prioritarios a investigar

1. Toyota Corolla 2009-2022.
2. Nissan Sentra 2013-2022.
3. Toyota Hilux 2006-2022.
4. Nissan Rogue 2014-2022.
5. Hyundai Accent 2012-2022.
6. Hyundai Elantra 2011-2022.
7. Honda Civic 2006-2021.
8. Nissan Frontier 2005-2021.
9. Kia Forte 2014-2022.
10. Kia Soul 2010-2022.
11. Kia Rio 2012-2022.
12. Nissan Versa 2012-2022.
13. Toyota Yaris 2007-2020.
14. Toyota Tacoma 2005-2022.
15. Mitsubishi Mirage 2014-2022.

## Riesgos de compatibilidad

- Ano/modelo no basta: muchas piezas requieren motor, version, transmision, origen o VIN.
- Toyota Corolla tiene multiples generaciones/versiones.
- Nissan Rogue y Sentra pueden variar por CVT, sensores y soportes.
- Hyundai/Kia requieren distinguir MPI/GDI y cilindrada.
- Pickups Hilux/Tacoma/Frontier varian por 4x2/4x4, gasolina/diesel, frenos y suspension.
- Escobillas, focos y fluidos parecen simples, pero deben mapearse por medida/especificacion.

## Matriz de scoring

| Criterio | Peso |
|---|---:|
| Tamano del parque del modelo/marca | 25% |
| Frecuencia de reposicion | 20% |
| Riesgo de compatibilidad bajo | 15% |
| Margen bruto esperado | 15% |
| Disponibilidad/proveedor local | 10% |
| Costo de inventario y espacio | 10% |
| Urgencia del cliente/taller | 5% |

Regla recomendada:

- `>= 75/100`: inventario fisico.
- `55-74`: catalogo bajo pedido o preorder.
- `< 55`: no listar todavia o listar solo si hay proveedor confirmado.

## Catalogo inicial sugerido - 60 SKUs conceptuales

| Rango | SKU conceptual | Vehiculos foco |
|---:|---|---|
| 1-5 | Filtros de aceite, 5 familias | Corolla, Sentra, Accent/Elantra, Civic, Kia Rio/Forte/Soul |
| 6-10 | Filtros de aire motor, 5 familias | Corolla/Yaris, Sentra/Versa, Elantra/Accent, Civic, Rogue |
| 11-15 | Filtros de cabina, 5 familias | Corolla, Sentra, Rogue, Elantra, Forte/Soul |
| 16-20 | Pastillas delanteras, 5 familias | Corolla, Sentra, Elantra/Accent, Civic, Rogue |
| 21-24 | Pastillas traseras, 4 familias | Corolla, Sentra, Civic, Rogue |
| 25-28 | Discos delanteros, 4 familias | Corolla, Sentra, Civic, Hilux/Frontier |
| 29-32 | Bujias cobre/niquel/iridio, 4 familias | Toyota 1.5/1.8, Nissan 1.6/1.8/2.5, Hyundai/Kia 1.6/2.0, Honda 1.8 |
| 33-36 | Bobinas de encendido, 4 familias | Corolla, Sentra, Elantra/Accent, Civic |
| 37-40 | Fajas serpentina/accesorios, 4 familias | Corolla/Yaris, Sentra/Versa, Hyundai/Kia, Civic |
| 41-44 | Amortiguadores delanteros/traseros, 4 familias | Corolla, Sentra, Elantra, Civic |
| 45-48 | Terminales/rotulas/bieletas, 4 familias | Corolla, Sentra, Hyundai/Kia compactos, Civic |
| 49-51 | Bombas de agua/termostatos, 3 familias | Toyota 1.8, Nissan 1.8/2.5, Hyundai/Kia |
| 52-54 | Sensores O2/MAF/MAP, 3 familias | Toyota, Nissan, Hyundai/Kia |
| 55-56 | Escobillas 16-26 pulgadas, 2 familias | Universales por medida |
| 57-58 | Focos halogenos H4/H7/9005/9006, 2 familias | Compactos/SUV comunes |
| 59 | Kit zapatas/tambor trasero | Yaris, Accent, Rio, Versa |
| 60 | Kit mantenimiento basico | Aceite + filtro + aire + cabina por modelo |

## Inventario fisico inicial sugerido - 32 SKUs

| Grupo | SKUs fisicos sugeridos |
|---|---|
| Filtros | Aceite Corolla/Yaris, Sentra/Versa, Hyundai/Kia 1.6/2.0, Civic, Rogue; aire Corolla, Sentra, Elantra/Accent, Civic, Rogue; cabina Corolla, Sentra, Hyundai/Kia, Rogue |
| Frenos | Pastilla delantera Corolla, Sentra, Elantra/Accent, Civic, Rogue; liquido frenos DOT3/DOT4; limpiador de frenos |
| Encendido | Bujia Toyota 1.8, Nissan 1.8, Hyundai/Kia 1.6/2.0, Honda 1.8 |
| Visibilidad | Escobillas 16, 18, 20, 22, 24, 26 pulgadas; focos H4, H7, 9005/9006 |
| Fluidos | Aceite 5W-30, 10W-30, 5W-20; refrigerante premix; ATF solo si proveedor confirma aplicacion |
| Alta urgencia | Tapon radiador comun, fusibles/relays surtidos, abrazaderas/manguera universal |

## Validacion pendiente

Antes de comprar inventario:

1. Consultar 8 a 12 talleres en San Salvador/Santa Tecla.
2. Contactar 3 a 5 mayoristas.
3. Pedir listas de los 20 repuestos mas solicitados por semana.
4. Cruzar repuestos con los 15 vehiculos prioritarios.
5. Comparar en Google Trends en una misma grafica:
   - amortiguadores;
   - pastillas de freno;
   - filtro de aceite;
   - bateria carro;
   - bujias.
6. Validar margen, minimo de compra, devoluciones y disponibilidad.
7. Confirmar compatibilidad por catalogo OE/VIN antes de publicar como "compatible".

## Recomendacion de QA/PO

Aprobar este reporte como base inicial, pero no aprobar compra de inventario todavia. El siguiente entregable debe ser una matriz de validacion con proveedores/talleres y costo estimado por SKU.

## Fuentes

- ONASEVI datos estadisticos: https://observatoriovial.fonat.gob.sv/datos-estadisticos/
- Diario El Mundo, marcas del parque vehicular: https://diario.elmundo.sv/economia/estas-son-las-cinco-marcas-de-vehiculos-que-concentran-la-mayor-parte-del-parque-vehicular-en-el-salvador
- Diario El Mundo, modelos mas vendidos 2026: https://diario.elmundo.sv/economia/los-10-modelos-de-carros-mas-vendidos-en-el-salvador-en-2026
- Super Repuestos tienda en linea: https://sv.superrepuestos.com/
- BUBU Auto Parts: https://bubuautoparts.com/
- Econoparts: https://www.econoparts.com/

