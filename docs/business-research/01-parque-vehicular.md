# Estudio del parque vehicular

**Corte de investigación:** 2026-08-02.

## Actualización 2026-08-03

La investigación posterior incorporó un ranking de modelos publicado en abril de 2026 a partir de datos de ONASEVI/VMT. El parque reportado para febrero de 2026 supera los 2.04 millones de unidades; aproximadamente 1.34 millones son vehículos y 701,184 son motocicletas. Los 15 modelos principales identificados suman 487,791 registros: Corolla, Sentra, Hilux, Rogue, Accent, Elantra, Civic, Frontier, Forte, Soul, Rio, Versa, Yaris, Tacoma y Mirage.

Esta actualización no elimina la limitación de que se trata de registros acumulados, no vehículos activos ni demanda de repuestos. Para el análisis de abastecimiento se debe agregar `market_spec` y distinguir US-spec de aplicaciones globales. El detalle completo de modelos, escenarios de repuestos, proveedores y contactos queda en [11-investigacion-proveedores-y-parque-2026-08-03.md](11-investigacion-proveedores-y-parque-2026-08-03.md).

## Evidencia disponible

ONASEVI mantiene una sección de “Parque Vehicular”, pero en la consulta web realizada el 2026-08-02 el contenido visible no expuso una tabla descargable con marca, modelo, año, motor y municipio. [ONASEVI — Datos Estadísticos](https://observatoriovial.fonat.gob.sv/datos-estadisticos/) y [Parque Vehicular](https://observatoriovial.fonat.gob.sv/parque-vehicular/). Por tanto, no se presenta aquí un ranking oficial propio por modelo/municipio.

Como señal secundaria, Diario El Mundo reportó 2,008,156 unidades al cierre de noviembre de 2025 y atribuyó a ONASEVI cifras de Toyota 259,771, Nissan 230,600 y Honda 175,940; también indicó que Hyundai, Mitsubishi, Chevrolet y Yamaha tenían presencia significativa. [Diario El Mundo, 2025-12-07](https://diario.elmundo.sv/ampArticle/estas-son-las-cinco-marcas-de-vehiculos-que-concentran-la-mayor-parte-del-parque-vehicular-en-el-salvador?amp=1). El mismo medio reportó al Corolla como modelo líder con más de 60,980 unidades. [Diario El Mundo, 2026](https://diario.elmundo.sv/economia/el-toyota-corolla-es-el-modelo-mas-vendido-en-el-salvador-segun-observatorio-de-seguridad-vial). Estas cifras son de prensa secundaria: sirven para priorizar investigación, no para dimensionar demanda ni inventario.

## Limitaciones

- No se observó un archivo oficial con el nivel modelo–motor–municipio requerido.
- Parque vehicular es stock de vehículos registrados, no compras de repuestos.
- La ubicación registral puede no coincidir con ubicación de uso o entrega.
- Modelos con versiones, generaciones, motores, combustible, transmisión y origen diferentes no deben agregarse silenciosamente.
- No se almacenarán placas, VIN, chasis, teléfonos ni identificadores personales.

## Normalización propuesta

Usar campos separados: `make_canonical`, `model_canonical`, `generation`, `year_from`, `year_to`, `engine`, `fuel`, `transmission`, `class`, `department`, `municipality`, `source_record_id_hash`. Normalizar mayúsculas, acentos, espacios, guiones y abreviaturas; conservar el valor original en una zona restringida solo si es legal y necesario. Agrupar “Toyota Corolla”, “TOYOTA COROLLA” y “Toyota-Corolla” solo cuando el modelo esté confirmado; “Corolla LE” no debe fusionarse automáticamente con “Corolla” si afecta compatibilidad.

## Puntaje de prioridad

Puntuar cada combinación de 0 a 100, documentando evidencia:

`35% presencia relevante + 20% antigüedad/fuera de garantía + 15% disponibilidad esperada + 10% mantenimiento + 10% simplicidad de compatibilidad + 10% margen potencial`.

Mientras no exista el microdato oficial, esos seis componentes quedan como `ND` y no deben convertirse en una cifra falsa. Para la validación se puede usar la siguiente regla de confianza: fuente oficial modelo–municipio = alta; dos proveedores y tres talleres coincidentes = media; solo prensa, marketplace o búsqueda = baja.

## Lista de investigación prioritaria

Marcas: Toyota, Nissan, Honda, Kia, Hyundai, Mitsubishi, Chevrolet, Mazda, Ford, Suzuki, Isuzu, Volkswagen, Mercedes-Benz, Great Wall y Land Rover.

Combinaciones (no aprobadas para compra): Corolla 2009–2022 1.8; Yaris 2007–2020 1.3/1.5; Hilux 2006–2022 2.7/2.8; Tacoma 2005–2022 2.7/4.0; Sentra 2013–2022 1.8/2.0; Versa 2012–2022 1.6; Rogue 2014–2022 2.5; Frontier 2005–2021 2.5/4.0; Accent 2012–2022 1.4/1.6; Elantra 2011–2022 1.6/2.0; Rio 2012–2022 1.4/1.6; Forte 2014–2022 2.0; Soul 2010–2022 1.6/2.0; Civic 2006–2021 1.8/2.0; CR-V 2007–2021 2.0/2.4; Mirage 2014–2022 1.2; Mazda 3 2010–2021 2.0; Chevrolet Aveo 2008–2018 1.6; Ford Ranger 2012–2022 2.5/3.2; Suzuki Swift 2011–2021 1.2/1.4.

## Excluir temporalmente

Excluir del inventario físico: vehículos premium con demanda no medida; híbridos/EV; módulos electrónicos; partes de carrocería; CVT/transmisión; piezas dependientes de VIN; vehículos pesados; marcas con proveedor no confirmado. Pueden aparecer como “consultar disponibilidad” solo si se dispone de una fuente de aplicación confiable.

## Triangulación necesaria

Solicitar al VMT/ONASEVI el archivo o una tabla agregada sin identificadores personales para San Salvador y La Libertad; entrevistar 10 talleres sobre los 20 modelos más atendidos; pedir a 5 proveedores sus ventas o top de aplicaciones (sin datos personales); registrar 50 cotizaciones reales; y contrastar anuncios públicos como señal de oferta/precio, nunca como ventas.
