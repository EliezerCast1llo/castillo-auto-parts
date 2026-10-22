# Importación del catálogo por CSV

Issues #94 (B8) y #103 (B15). Solo el rol **ADMIN** puede descargar la plantilla, preparar una
vista previa y confirmar. Marketing y los demás roles no tienen permiso.

## Flujo del operador

1. Admin → Productos → **Importar CSV** → **Descargar plantilla CSV**.
2. Completar el archivo en una hoja de cálculo y guardarlo como **CSV UTF-8**.
   Se admite BOM UTF-8 y separador coma o punto y coma. Mantener todos los
   encabezados (se pueden reordenar); no agregar líneas `sep=...` ni encabezados
   duplicados. Los textos con delimitadores, comillas o saltos de línea deben
   exportarse entre comillas CSV; una comilla interior se duplica.
3. Cargar hasta **256 KiB / 200 productos por lote**. Para un catálogo mayor,
   dividir archivos y revisar/confirmar cada lote. No se cargan imágenes aquí.
4. Opcionalmente marcar **Desactivar productos de demostración**. Esta elección
   se incluye en la vista previa y no cambia la base todavía.
5. Pulsar **Validar y ver vista previa**. Corregir errores por fila y columna
   antes de continuar. No se importa una parte válida de un archivo con errores.
6. Revisar altas/actualizaciones, la lista de campos que cambian, precios, stock,
   estado final activo/inactivo y detalles efectivos de cada fila, así como
   la lista de demo que se desactivaría. **Confirmar importación** guarda todo el
   lote en una única transacción o lo revierte si falla cualquier escritura,
   incluida la auditoría. Ningún dato se guarda solo por subir o previsualizar.
7. La vista previa vence a los **15 minutos**. Cambiar archivo u opción exige
   otra validación. Si otro proceso modifica productos o reservas tras la vista
   previa, se rechaza la confirmación: volver a validar antes de sobrescribir.
8. Verificar el resumen final y el catálogo; la auditoría registra actor, fecha,
   hash del contenido UTF-8 decodificado (sin BOM), SKUs, cantidades/precios
   antes/después y resultado del lote.

La fila 1 contiene encabezados. Los números de errores corresponden a filas
lógicas de la hoja de cálculo, aunque una descripción contenga saltos de línea.

## Columnas y unidades

| Encabezado | Regla |
| --- | --- |
| `sku` | Obligatorio, hasta 64 caracteres; letras/números, punto, guion, barra o guion bajo; empieza por letra/número. Se convierte a mayúsculas y se eliminan espacios para comparar. `qa-fil/03` y `QA-FIL/03` identifican el mismo producto. No repetir la misma identidad en el archivo. Si varios productos existentes coinciden, se bloquea el lote para resolver el choque manualmente. |
| `nombre` | Obligatorio, hasta 200 caracteres. |
| `marca` | Obligatoria, hasta 100 caracteres. |
| `numero_parte` | Opcional, hasta 100 caracteres. Vacío conserva el valor existente; en productos nuevos queda sin valor. |
| `categoria` | Nombre obligatorio, hasta 100 caracteres. Se usa la categoría por slug canónico o se crea si no existe. No se renombra/reactiva una categoría existente. |
| `precio_iva` | USD con IVA incluido, mayor que cero, hasta dos decimales y 21474836.47 USD. Punto o coma decimal, sin separadores de miles. Una coma decimal debe estar entre comillas en CSV separado por comas. |
| `stock` | Stock físico absoluto de MAIN (no una suma/incremento). Entero 0–2147483647 y no menor que las unidades reservadas. Se preservan reservas y otras bodegas. |
| `descripcion` | Opcional, hasta 5000 caracteres. Vacío conserva el valor existente; en productos nuevos queda sin valor. |
| `peso_kg` | Mayor que cero, hasta 1000 kg, hasta tres decimales. |
| `largo_cm`, `ancho_cm`, `alto_cm` | Cada medida mayor que cero, hasta 1000 cm, hasta un decimal. Son medidas del paquete para envío. |
| `compatibilidades` | Hasta 20 entradas `Marca\|Modelo\|AñoDesde\|AñoHasta`, separadas por `;`. Años 1900–2100, desde ≤ hasta. Con contenido reemplaza la lista anterior; vacío conserva las compatibilidades existentes y en productos nuevos queda sin lista. No admite motor. |

Si se indica algún peso/medida, completar los cuatro. Si están todos vacíos se
conservan los de un producto existente; un nuevo producto queda sin medidas y
la vista previa lo advierte. No se inventa peso cero ni se deriva de texto libre.
Las compatibilidades repetidas se deduplican y las marcas/modelos usan la misma
normalización del editor manual.

Ejemplo ficticio (no son datos reales de proveedor):

```csv
sku,nombre,marca,numero_parte,categoria,precio_iva,stock,descripcion,peso_kg,largo_cm,ancho_cm,alto_cm,compatibilidades
REP-001,Filtro de ejemplo,Proveedor,P-001,Filtros,12.99,8,"Descripción, con coma",0.250,12.5,10,8,Toyota|Corolla|2010|2018
```

## Actualizaciones y alcance del reemplazo

La clave es SKU: reimportar no crea otro producto ni suma stock. Se conservan id,
slug/URL, imágenes, traducciones, descripción corta, detalles técnicos, flags
activo/destacado y punto de reposición de los productos existentes. Los nuevos
se crean activos; los existentes inactivos permanecen inactivos y la vista previa
lo advierte de forma visible. Para reactivarlos, editar su ficha manualmente;
no se agrega una columna `activo` en esta versión. La categoría, nombre, marca,
precio y stock MAIN se aplican según el archivo. Parte, descripción y
compatibilidades solo cambian si tienen contenido. Una celda vacía no borra:
para eliminar esos datos usar el editor manual de la ficha. Las columnas
obligatorias siguen siendo obligatorias, incluso para actualizar solo precio
/ stock: repetir nombre, marca y categoría actuales. El estado de stock se recalcula sobre unidades físicas
menos reservadas y el umbral de reposición, sin alterar las reservas.

Se invalidan el catálogo y los productos afectados para ambos idiomas. Si el
lote se guardó pero falla el refresco de caché, el panel lo informa como guardado
con aviso, sin sugerir que se revirtió la base. Revisar caché antes de publicar.

La vista previa enumera los campos que realmente cambian y muestra los valores
que quedarán, incluidos los opcionales conservados. No usa celdas vacías para
presentar datos existentes como eliminados. La auditoría registra esa lista,
la cantidad final de compatibilidades y el estado activo que se conserva.

Los productos nuevos guardan el SKU canónico. Los existentes conservan su SKU
original, id y referencias: no se renombra masivamente el catálogo ni se mezclan
productos de un choque. El editor manual también normaliza al crear y guardar
una ficha, usando la misma función y búsqueda que el importador. Rechaza choques
con otro producto antes de escribir e indica el SKU existente; al editar excluye
el propio producto. Guardar una ficha histórica normaliza únicamente su SKU,
sin migrar o fusionar otros registros. Las variantes históricas duplicadas se
reportan; la ambigüedad se vuelve a comprobar al confirmar un CSV. Resolver los SKUs duplicados desde administración antes
de revalidar; no basta con cambiar mayúsculas en el archivo.

Cada archivo es un lote independiente. Los lotes ya confirmados no se revierten
porque falle otro archivo posterior. No hay un modo de importar silenciosamente
solo las filas válidas ni una eliminación física masiva.

## Retirar productos de demostración sin romper pedidos

`Product.isDemo` marca el origen del seed. La migración inicial marca únicamente
los productos que coinciden con los **63 snapshots conocidos** del seed en SKU,
slug, nombre, marca y precio. Los registros ya editados no se marcan de manera
indiscriminada; `MOCK-` por sí solo no identifica datos que puedan retirarse.
Revisar manualmente los productos de prueba ya modificados que no se marquen.

La opción de limpieza desactiva solo productos activos marcados demo que **no
figuren en el CSV**. Importar un SKU demo lo convierte en real; editar y guardar
su ficha manual también lo excluye de futuras limpiezas. Un ajuste rápido de
stock no cambia esa clasificación. La vista previa lista exactamente cuáles
serían retirados. Se conserva el registro de producto, stock, pedidos, líneas de
pedido y sus snapshots; no se cancelan pagos ni se liberan reservas por retirar
un producto del catálogo público.

No volver a ejecutar el seed de demostración sobre un catálogo real: el seed
es una herramienta de desarrollo y puede reescribir datos y marcar demo de nuevo.
La preparación de producción y el modo de alta solo-admin pertenecen a B2.

## Coordinación con B5 / Boxful

La migración agrega campos **nullable** en Product:

- `weightGrams`: entero en gramos (`peso_kg × 1000`).
- `lengthMm`, `widthMm`, `heightMm`: enteros en milímetros (`cm × 10`).

Los valores positivos están protegidos también por una restricción PostgreSQL.
La ficha manual permite editar kg/cm con la misma conversión/validación. B5 debe
reutilizar estos campos, convertirlos a las unidades que requiera Boxful y
manejar el aviso/bloqueo al cotizar si falta un paquete completo. Este ticket no
implementa tarifas, guías, credenciales ni llamadas a Boxful.

## Seguridad y operación

Las dos acciones verifican rol ADMIN en servidor, y la confirmación se vincula
al archivo, opción de limpieza, administrador y revisión de datos mediante HMAC
con `ADMIN_ACCESS_SECRET`. No se persiste el archivo completo ni se envía el
secreto al navegador. Rotar el secreto invalida vistas previas pendientes.
No se necesitan variables nuevas.

El formulario limita tamaño en cliente y servidor; Next conserva además su
límite de cuerpo de Server Actions. El servidor decodifica UTF-8 de manera
estricta. La escritura usa aislamiento serializable, control de cambios y una
transacción que incluye auditoría. Conflictos o falta de disponibilidad requieren
revalidar; no se muestran excepciones ni datos de conexión al cliente.

La plantilla se descarga autenticada y sin caché. El escritor CSV neutraliza
celdas que puedan convertirse en fórmulas (`=`, `+`, `-`, `@`, prefijos de espacio
y controles) antes de escapar comillas/delimitadores. Esto protege la plantilla
y cualquier exportación que reutilice el escritor; no se evalúa contenido CSV.

Aplicar la migración con `npm run db:migrate:deploy` antes del despliegue de la
app. La migración es aditiva y no elimina pedidos/productos; verificar backup y
procedimiento operativo antes de ejecutarla en producción. Las pruebas usan
esquemas desechables, nunca inventario real.
