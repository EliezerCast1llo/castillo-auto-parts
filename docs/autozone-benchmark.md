# AutoZone Benchmark → Castillo Auto Parts

Fecha: 2026-06-23
Autor: Análisis PM / UX Research / Business Analysis (modelo arquitecto)
Propósito: Extraer patrones funcionales, reglas de negocio y arquitectura de una tienda madura de repuestos (AutoZone) y **mapearlos contra lo que Castillo Auto Parts ya tiene**, para producir tickets accionables. NO es una plantilla para copiar diseño, textos, colores ni layout.

Documento hermano: `docs/autozone-execution-plan.md` (mapa de ejecución, wireframes, prompts para modelo ejecutor, backlog).

---

## 0. Metodología y disclaimer

- AutoZone se analiza como **referencia de patrones** (no se copia identidad visual ni textos). El sitio usa protección anti-bot fuerte y render JS, por lo que este análisis se basa en conocimiento consolidado de sus patrones de producto, no en un scrape en vivo. **Promos, precios y copy específicos deben verificarse manualmente** antes de citarlos como hechos.
- Todo lo de Castillo está verificado contra el código real (se citan archivos). Donde digo "ya existe", lo confirmé en el repo el 2026-06-23.
- Prioridad de negocio del proyecto (de la auditoría): **dinero > seguridad > datos > legal > UX**. Esa jerarquía manda en el roadmap.

### Veredicto en una línea

Castillo **ya tiene el 70% del esqueleto transaccional** de una tienda tipo AutoZone (catálogo, compatibilidad, inventario multi-bodega, carrito, checkout, pago async, DTE modelado). Lo que falta es la capa que convierte a AutoZone en una experiencia "madura": **garage persistente, confianza de compatibilidad visible (badges/warnings), reviews, promociones, búsqueda tolerante, y contenido SEO**. Ninguna de esas cinco cosas existe hoy en el schema ni en componentes.

---

## 1. Tabla maestra: AutoZone vs. Castillo (estado real)

| Capacidad | Patrón AutoZone | Estado Castillo | Evidencia en repo | Gap |
|---|---|---|---|---|
| Selector de vehículo | Year→Make→Model→Engine, omnipresente | Make→Model→Year (sin motor) | `vehicle-search-panel.tsx`, `catalog-filters.ts:160` | Falta motor/trim; orden distinto |
| Garage / vehículos guardados | "My Vehicles", persistente, multi-vehículo | **No existe** (vehículo vive solo en URL) | — | **Falta total** |
| Badge "Fits your vehicle" | En card, PLP y PDP | No hay badge; solo filtra | `product-card.tsx` | **Falta** |
| Warning de incompatibilidad | "This part does not fit" + alternativas | No hay warning | — | **Falta** |
| Catálogo / filtros | Categoría, marca, precio, rating, specs | Categoría, marca, stock, vehículo | `catalog-filters.ts` | Falta precio, rating, ordenamiento |
| Ordenamiento PLP | Relevancia, precio, rating, novedad | **No hay sort** | `catalog/page.tsx` | **Falta** |
| Reviews / ratings | Estrellas + reseñas + Q&A | **No existe** (sin modelo `Review`) | `schema.prisma` | **Falta total** |
| Productos relacionados / alternativas | Cross-sell, "customers also bought" | **No existe** | — | **Falta** |
| Comparación de productos | Tabla comparativa | No existe (baja prioridad) | — | Falta (opcional) |
| Búsqueda | Autocomplete + sinónimos + typo tolerance | Autocomplete + substring | `search-autocomplete.tsx`, `catalog-filters.ts:208` | Falta sinónimos y fuzzy |
| Promociones | Deals, combos, envío gratis $35+ | **No existe** (`isFeatured` boolean) | `schema.prisma` Product | **Falta modelo `Promotion`** |
| Disponibilidad / pickup | Same-day pickup, next-day delivery | Retiro en bodega + envío por zona | `checkout.ts`, `DeliveryZone` | ✅ Tiene (más simple) |
| Garantía visible | Warranty por producto (Duralast 1yr–lifetime) | **No hay campo `warranty`** | `schema.prisma` Product | **Falta campo** |
| WhatsApp / soporte | Chat + teléfono | **No hay CTA WhatsApp** | componentes | **Falta** (clave en SV) |
| Contenido / SEO | Repair guides, how-to, blog | **No existe** (sin rutas `/guias`/`/blog`) | rutas `src/app` | **Falta total** |
| Marca como entidad | Brand pages con logo/SEO | `brand` es `String` en Product | `schema.prisma:138` | Falta entidad `Brand` |
| Inventario | Stores + stock | Multi-bodega modelado | `InventoryStock`, `InventoryLocation` | ✅ Tiene |
| Pago async | — | Reserva + webhook idempotente | `payment-events.ts`, `inventory-reservations.ts` | ✅ Tiene (fuerte) |
| Factura legal | (N/A US) | DTE modelado (manual MVP) | `InvoiceDte` | ✅ Modelado |

**Lectura rápida:** las 6 filas marcadas "Falta total" (garage, badge, warning, reviews, promociones, contenido) son el verdadero backlog de producto. El resto es pulir lo que ya existe.

---

## 2. Análisis por sección (AutoZone → patrón → qué hacer en Castillo)

### 2.1 Home page

**Qué hace AutoZone (patrón):**
- Lo primero y más prominente es el **selector de vehículo** ("set your vehicle"), porque sin vehículo todo lo demás es ruido. Es el gesto que personaliza todo el catálogo.
- Buscador grande, siempre visible.
- Bloques de **conversión inmediata**: deals/ofertas, "shop by category", productos destacados, envío/pickup.
- Bloques de **confianza/retención/SEO**: marcas populares, repair guides, garantías, "find the right part", rewards.
- Jerarquía: personalización (vehículo) → búsqueda → categorías → ofertas → confianza → contenido.

**Qué tiene Castillo hoy** (`src/app/page.tsx`):
`HomeHeader` → `SearchHero` (con opciones de filtro de vehículo) → `TrustStrip` → `BrandStrip` → `PopularSearches` + `CategoryQuickLinks` → `FeaturedProducts`. Es una estructura **correcta y madura**: ya separa conversión (search/featured) de confianza (trust/brands).

**Gaps y recomendación:**
1. El `SearchHero` recibe `filterOptions` pero el vehículo no se **persiste** ni se vuelve a mostrar como "tu vehículo" en el resto del sitio. → Agregar bloque "Tu vehículo" (garage) que sobreviva navegación.
2. No hay bloque de **ofertas/deals** (porque no hay modelo `Promotion`). → Sección "Ofertas" condicionada a que existan promociones activas.
3. No hay entrada a **contenido/guías**. → Bloque "Aprende / Guías" para SEO y confianza.
4. `FeaturedProducts` ya cubre "destacados"; basta con que respete el vehículo seleccionado cuando exista.

**Ideas adaptables sin copiar:** orden de prioridad visual (vehículo → buscar → categorías → confianza), separación conversión/confianza, "shop by category" con íconos propios. NO copiar el layout naranja/gris, ni el copy, ni la disposición de tiles.

---

### 2.2 Navegación y arquitectura de información

**Patrón AutoZone:** múltiples ejes de entrada al mismo catálogo:
- Por **tipo de repuesto** (Parts → Brakes → Brake Pads).
- Por **marca de vehículo** (Shop by Make → Toyota).
- Por **modelo** (Toyota → Corolla → año).
- Por **marca comercial del producto** (Duralast, Bosch…).
- Por **tarea/síntoma** (repair help).

**Castillo hoy:** tiene categorías (`ProductCategory`) y filtro por vehículo. La navegación por **marca de vehículo / modelo como páginas** y por **marca comercial** no existe como rutas dedicadas (solo como filtros del catálogo). `brand` es string libre, no entidad.

**Jerarquía de navegación recomendada para SV** (priorizando usuario no experto):

```
Home
├── Buscar por vehículo (garage)       ← entrada #1, la más empujada
├── Categorías                          ← entrada #2 (la gente piensa "frenos", "aceite")
│   └── Categoría → Subcategoría → PLP
├── Marcas (de producto: Bosch, NGK…)   ← Fase 2, confianza/SEO
├── Ofertas                             ← Fase 2 (requiere Promotion)
├── Guías / Ayuda                       ← Fase 3 (SEO)
└── Contacto / WhatsApp                 ← siempre visible
```

**Decisión de IA crítica para SV:** el público primario (personas comunes) piensa en **categoría** ("necesito frenos") más que en número de parte. Por eso, a diferencia de AutoZone que empuja el vehículo primero, en Castillo **categoría y vehículo deben competir por igual en el home** (dos puertas grandes), no solo el vehículo. El mecánico/taller (secundario) sí usará SKU/número de parte y vehículo+motor.

**Subcategorías sugeridas** (faltan: hoy `ProductCategory` es plana, sin `parentId`):
- Frenos → pastillas, discos, líquido, balatas, mordazas.
- Filtros → aceite, aire, combustible, cabina.
- Motor → bujías, bandas, bombas, empaques, sensores.
Recomendación: agregar `parentId` self-relation a `ProductCategory` para 2 niveles.

---

### 2.3 Selector de vehículo / Garage  ★ (el corazón del negocio)

**Patrón AutoZone:** Year → Make → Model → Engine. Guarda en "My Vehicles", permite varios autos, cambia el activo sin perder navegación, y **todo el catálogo se filtra/etiqueta** según el vehículo activo. Es su mayor ventaja UX.

**Castillo hoy:** `VehicleSearchPanel` hace Make→Model→Year con 3 `<select>` (modelo se filtra por marca). El estado vive en **query params** (`vehicleMake`, `vehicleModel`, `vehicleYear`) y se traduce a Prisma en `buildPrismaWhere` (`catalog-filters.ts:160`) con la lógica correcta `yearFrom <= año <= yearTo`. **No se persiste, no hay motor, no hay badge.**

**Reglas de negocio del selector (las que faltan):**

| Regla | Condición | Resultado | Prioridad |
|---|---|---|---|
| Selección mínima | Usuario elige make+model+year | Filtra productos compatibles | Alta — ✅ ya existe |
| Persistencia | Vehículo seleccionado | Sobrevive navegación (cookie/localStorage) y se muestra como "tu vehículo" | Alta — **falta** |
| Badge compatible | Producto compatible con vehículo activo | Card/PDP muestra "Compatible con tu [año marca modelo]" | Alta — **falta** |
| Warning incompatible | Producto NO compatible con vehículo activo | PDP muestra advertencia + "Ver alternativas compatibles" | Alta — **falta** |
| Multi-vehículo | Usuario guarda 2+ autos | Puede cambiar el activo sin re-seleccionar | Media — **falta** |
| Cambiar sin perder contexto | Cambia vehículo en PLP | Se mantiene en la misma categoría, re-filtra | Media — **falta** |
| Motor/versión | Categoría lo requiere (frenos/motor) | Pide motor solo cuando importa | Media — **falta (schema)** |
| VIN / placa | Mercado lo soporte | Resuelve a vehículo automáticamente | Baja (Fase 3) |

**Implementación por fases:**

- **MVP (lo que casi tienen):** Make→Model→Year en home + catálogo. Persistir en **cookie** (`ca_vehicle`) para que sobreviva navegación y mostrar chip "Tu vehículo: 2015 Toyota Corolla [cambiar]" en el header. *(Reordenar a Year→Make→Model es opcional; Make→Model→Year funciona y es válido.)*
- **Intermedia:** Badge "Compatible" en cards y PDP; warning de incompatibilidad en PDP; un vehículo por sesión guest, varios por usuario registrado (`SavedVehicle`). Agregar **motor/trim** donde la categoría lo exige.
- **Avanzada:** Garage multi-vehículo en `Mi cuenta`; búsqueda por **placa** (vía base de datos local de placas→vehículo si se consigue) o **VIN**; recordar vehículo entre dispositivos.

**Nota sobre placa en SV:** no existe una API pública gratuita placa→vehículo confiable. Tratar como Fase 3 / "nice to have", probablemente vía captura manual o acuerdo con un tercero. No bloquear MVP por esto.

**Cambio de datos necesario:** `VehicleCompatibility` hoy es denormalizado (strings `make/model/yearFrom/yearTo` por producto). Para garage, motor y páginas por modelo conviene **normalizar** a `VehicleMake / VehicleModel / VehicleYear / VehicleEngine` + tabla puente. Ver §7.

---

### 2.4 Catálogo / PLP (Product Listing Page)

**Patrón AutoZone:** filtros (categoría, marca, precio, rating, specs), ordenamiento, badge de compatibilidad por ítem, disponibilidad (pickup/delivery), precio claro, garantía, reviews, alternativas.

**Castillo hoy** (`catalog-filters.ts`, `catalog/page.tsx`, `product-card.tsx`): filtra por query, categoría, marca, estado de stock y vehículo. Tiene paginación (`catalog-pagination.tsx`) y filter drawer móvil (`filter-drawer.tsx`). **No tiene ordenamiento, ni precio como filtro, ni badge de compatibilidad, ni rating.**

**Reglas de negocio del PLP** (formato pedido):

```
Regla: Etiqueta de compatibilidad en card
Condición: Hay vehículo activo Y el producto es compatible
Resultado esperado: Card muestra badge verde "Compatible con tu vehículo"
Prioridad: Alta

Regla: Ordenamiento de resultados
Condición: Usuario abre el PLP
Resultado esperado: Selector con Relevancia (default), Precio ↑, Precio ↓, Más nuevos, Mejor valorados (cuando haya reviews)
Prioridad: Alta

Regla: Disponibilidad visible por ítem
Condición: Producto tiene InventoryStock
Resultado esperado: Card muestra "Disponible / Últimas unidades / Agotado" + (si aplica) "Retiro hoy en bodega"
Prioridad: Alta  (✅ stock badge existe; falta el "retiro hoy")

Regla: Filtro por rango de precio
Condición: Catálogo con productos de distinto precio
Resultado esperado: Filtro min–max en USD
Prioridad: Media

Regla: Productos alternativos cuando 0 resultados con vehículo
Condición: El filtro de vehículo deja 0 productos en la categoría
Resultado esperado: "No encontramos X para tu vehículo" + sugerir contacto WhatsApp + mostrar populares de la categoría
Prioridad: Alta

Regla: Garantía como faceta/badge
Condición: Producto tiene warranty
Resultado esperado: Badge "Garantía 1 año" en card; filtro "Con garantía"
Prioridad: Media  (requiere campo warranty)
```

---

### 2.5 Página de detalle (PDP)

**Estructura ideal del PDP de Castillo** (orden recomendado):

1. **Breadcrumb** (Categoría → Subcategoría → Producto) — SEO + orientación.
2. **Galería** (`product-gallery.tsx` ya existe) + badges (marca, garantía, "Compatible con tu vehículo").
3. **Título claro en español** + marca + SKU/número de parte (`sku`, `partNumber` ya existen).
4. **Bloque de compatibilidad** ★: si hay vehículo activo → "✅ Compatible con tu 2015 Toyota Corolla" o "⚠️ No confirmado para tu vehículo — consúltanos". Lista de vehículos compatibles (de `VehicleCompatibility`).
5. **Precio** (IVA incluido, ya manejan `ivaRate` 0.13) + estado de stock (`stock-badge.tsx`).
6. **Acciones:** [Agregar al carrito] (`quantity-stepper.tsx` existe) + **[Consultar por WhatsApp]** (falta) + selector retiro/envío.
7. **Garantía y devoluciones** (texto de política — falta definir, ver gates comerciales).
8. **Especificaciones técnicas** (`technicalDetails` Json ya existe).
9. **Instalación / advertencias** ("requiere instalación profesional", "vendido por unidad, el auto lleva 2").
10. **Alternativas compatibles** + **productos relacionados** (cross-sell) — falta.
11. **Reviews / preguntas** — falta (modelo `Review`).
12. **FAQ del producto** — falta.

**Reglas clave del PDP:**
- Si NO hay vehículo activo → invitar a seleccionarlo ("Verifica si encaja en tu vehículo").
- Si el producto está agotado → mostrar "Avísame cuando llegue" (✅ `StockAlertRequest` ya existe) en vez de comprar.
- "Vendido por unidad" explícito para evitar devoluciones (pastillas/amortiguadores suelen ir en pares).

---

### 2.6 Búsqueda

**Patrón AutoZone:** busca por pieza, categoría, marca, modelo, número de parte; autocompleta; tolera errores; expande sinónimos; maneja vacío con sugerencias.

**Castillo hoy:** `search-autocomplete.tsx` + `api/search/route.ts` + matching substring en `productMatchesQuery` (`catalog-filters.ts:208`) sobre name/category/brand/sku/partNumber/compatibility/description/technicalDetails. **Es substring puro: sin sinónimos, sin tolerancia a typos.**

**Reglas de negocio de búsqueda:**

```
Regla: Diccionario de sinónimos español/técnico
Condición: Usuario busca "shock" o "strut"
Resultado esperado: Devuelve "amortiguadores" (mapa shock|strut|amortiguador; pastilla|balata; bujía|spark plug; batería|acumulador)
Prioridad: Alta (barato y muy efectivo en SV)

Regla: Tolerancia a errores
Condición: "amortguador", "filtroo"
Resultado esperado: Coincide con el término correcto (trigram/Levenshtein o pg_trgm en Postgres)
Prioridad: Media

Regla: Búsqueda por SKU / número de parte exacto
Condición: Query parece código (alfanumérico)
Resultado esperado: Match exacto primero, salta a PDP si es único
Prioridad: Alta (mecánicos)

Regla: Cero resultados
Condición: Sin coincidencias
Resultado esperado: "No encontramos resultados para X" + búsquedas populares + CTA WhatsApp "te ayudamos a encontrar tu repuesto"
Prioridad: Alta

Regla: Sugerencias mientras escribe
Condición: ≥2 caracteres
Resultado esperado: Autocomplete con productos + categorías (✅ ya existe; falta enriquecer con categorías y sinónimos)
Prioridad: Media
```

**Nota técnica:** Postgres tiene `pg_trgm` (extensión) para fuzzy y similitud — solución barata sin motor externo (Algolia/Meilisearch) hasta que el catálogo crezca. El diccionario de sinónimos puede ser un simple mapa en `src/data/` aplicado antes de construir el `where`.

---

### 2.7 Promociones y conversión

**Patrón AutoZone:** deals, combos, envío gratis sobre umbral ($35), pickup hoy, productos destacados, urgencia moderada.

**Castillo hoy:** solo `Product.isFeatured` (boolean). **No hay modelo de promociones, ni descuentos, ni umbral de envío gratis.** El envío se cobra por `DeliveryZone.feeCents`.

**Adaptación para Castillo (requiere modelo `Promotion`, ver §7):**
- **Por categoría / temporada:** "Cambio de aceite — 15% en filtros + aceite" (combo). Útil en SV por estacionalidad (lluvias → frenos, limpiabrisas, llantas).
- **Envío gratis desde monto:** "Envío gratis en San Salvador desde $X" — palanca de ticket promedio. Implementar como regla sobre `subtotalCents` que anula `shippingCents`.
- **Combos / kits:** pastillas + discos; batería + instalación.
- **Destacados:** ya existe `isFeatured`.
- **Urgencia sin agresividad:** "Últimas 3 unidades" (derivado de `quantityOnHand`), "Retira hoy si pides antes de las 3pm". Nada de cuentas regresivas falsas.

**Regla de oro de confianza local:** en SV el precio engañoso destruye la confianza. Precio mostrado = precio final con IVA (ya lo hacen con `ivaRate`). Descuentos siempre con precio tachado real.

---

### 2.8 Confianza y soporte

**Elementos de confianza (qué genera confianza en SV específicamente):**
- **WhatsApp visible y real** — en SV el canal de confianza #1. Un negocio sin WhatsApp se percibe informal o falso. **(Falta — alta prioridad.)**
- **Garantía explícita** por producto y política clara de devolución/cambio. (Falta campo + política.)
- **Disponibilidad honesta** (no vender lo que no hay) — ✅ ya lo respetan con inventario y reservas.
- **Dirección física de bodega + horario de retiro** — prueba de que el negocio existe. (Gate en `mvp-current-status.md`.)
- **Reviews/testimonios** — falta modelo `Review`.
- **Marcas reconocidas** (Bosch, NGK, Gates…) — ✅ `BrandStrip` existe; falta convertir en entidad/página.
- **"Te ayudamos a encontrar tu pieza"** — CTA de asistencia humana, clave para no expertos.

**Recomendación SV:** combinación WhatsApp + garantía visible + dirección física + reviews es lo que separa "tienda confiable" de "posible estafa" a ojos del comprador salvadoreño. Priorizar WhatsApp y garantía sobre features avanzados.

---

### 2.9 Contenido educativo y SEO

**Patrón AutoZone:** repair guides, how-to, "how to know if X is bad", mantenimiento. Atrae tráfico orgánico de gente que aún no sabe qué comprar.

**Castillo hoy:** **no existe** (`PopularSearches` es lo más cercano). Sin rutas `/guias` ni `/blog`, sin modelo de contenido.

**Ideas de contenido (alto valor SEO en español, bajo costo):**
- **Guías de compra:** "Cómo elegir amortiguadores", "Qué batería necesita mi carro".
- **Diagnóstico (síntoma→pieza):** "Señales de que tus frenos están gastados", "¿Por qué chilla mi carro al frenar?".
- **Mantenimiento preventivo:** "Cada cuánto cambiar el aceite en El Salvador" (clima/tráfico local).
- **Comparativas:** "Pastillas cerámicas vs. semimetálicas".
- **Por modelo:** "Repuestos más buscados para Toyota Corolla en El Salvador".
- **FAQ:** garantía, devoluciones, envío, retiro.

Cada artículo enlaza a la categoría/PLP correspondiente (SEO interno → conversión). Modelo mínimo: `Article` (slug, title, body MDX/HTML, category, relatedCategorySlug). Fase 3, pero el de mayor ROI orgánico a mediano plazo.

---

### 2.10 Carrito y checkout

**Castillo hoy (fuerte):** carrito guest firmado por cookie (`cart-state.ts`), checkout guest (`checkout.ts`) con retiro en bodega y envío local por zona, pin manual en mapa, **checkout asíncrono** con orden `PAYMENT_PROCESSING` + reserva temporal de inventario + procesador idempotente compartido con el webhook (`payment-events.ts`, `inventory-reservations.ts`). Manejo de agotados con `StockAlertRequest`. Esto ya es de nivel producción en arquitectura.

**Flujo recomendado (validado contra lo existente):**
1. Agregar al carrito → validar stock disponible (✅ `cart-validation.ts`).
2. Revisar carrito → **re-validar compatibilidad** si hay vehículo activo (gap: hoy no advierte si un ítem no encaja).
3. Elegir retiro vs envío (✅).
4. Confirmar disponibilidad / reservar (✅ reserva temporal).
5. Datos del cliente (✅ guest).
6. Pago (✅ async; falta credenciales Wompi reales — gate).
7. Confirmación + número de orden (✅) + **DTE** (modelado, manual MVP).
8. WhatsApp como soporte post-orden (gap).
9. Agotado durante checkout → liberar reserva + ofrecer aviso de stock (✅ expiración atómica).

**Gaps de checkout:**
- **Validación de compatibilidad en carrito** (advertir "este ítem podría no encajar en tu Corolla").
- **WhatsApp post-compra** ("¿dudas con tu pedido?").
- **Captura de datos fiscales** para DTE (NIT/DUI, nombre) cuando el cliente pide factura — gate legal.

---

## 3. Patrones UX detectados (transversales)

1. **Vehículo como llave maestra:** personaliza catálogo, PLP y PDP. Castillo lo tiene a medias (filtra, no persiste/etiqueta).
2. **Confianza antes de compra:** compatibilidad confirmada + garantía + disponibilidad honesta reducen la fricción del no-experto.
3. **Múltiples puertas al catálogo:** categoría, vehículo, marca, búsqueda, síntoma. Castillo tiene 2 (categoría, vehículo+search).
4. **Disponibilidad como feature, no como letra chica:** "retira hoy" convierte.
5. **Reducción de devoluciones por diseño:** "vendido por unidad", "verifica compatibilidad", warnings. Crítico en repuestos.
6. **Urgencia honesta:** stock real, no countdowns falsos.
7. **Asistencia humana a un clic:** en SV = WhatsApp.

---

## 4. Reglas de negocio priorizadas (catálogo maestro)

Formato solicitado. Estas son las **nuevas/incompletas**; las ✅ ya están implementadas y se listan para trazabilidad.

```
ID: RB-001
Nombre: Validación de compatibilidad por vehículo
Descripción: El sistema indica si un producto es compatible con el vehículo activo.
Actor: Cliente
Condición: Hay vehículo activo (cookie o garage) al navegar PLP/PDP.
Resultado esperado: Compatibles muestran badge "Compatible con tu [vehículo]"; en PDP los no compatibles muestran advertencia + alternativas.
Prioridad: Alta
MVP: Sí (badge) / Fase 2 (alternativas)
Notas técnicas: Lógica de match ya existe en catalog-filters.ts; falta persistir vehículo y renderizar badge/warning.

ID: RB-002
Nombre: Persistencia de vehículo (mini-garage)
Descripción: El vehículo seleccionado sobrevive la navegación.
Actor: Cliente
Condición: Usuario selecciona make+model+year.
Resultado esperado: Se guarda en cookie ca_vehicle; chip "Tu vehículo" en header con opción cambiar/quitar.
Prioridad: Alta
MVP: Sí
Notas técnicas: Cookie firmada (reusar patrón de cart-state.ts). Garage multi-vehículo = Fase 2 con SavedVehicle.

ID: RB-003
Nombre: Ordenamiento de catálogo
Descripción: El usuario ordena resultados.
Actor: Cliente
Condición: PLP con >1 producto.
Resultado esperado: Relevancia (default), Precio ↑/↓, Más nuevos, Mejor valorados (si hay reviews).
Prioridad: Alta
MVP: Sí (precio + nuevos)
Notas técnicas: Param ?sort=; orderBy en query Prisma del catálogo.

ID: RB-004
Nombre: Envío gratis sobre umbral
Descripción: Pedidos sobre monto X tienen envío gratis en zonas elegibles.
Actor: Cliente
Condición: subtotalCents >= umbral configurable Y zona elegible.
Resultado esperado: shippingCents = 0 + mensaje "¡Ganaste envío gratis!".
Prioridad: Media
MVP: No (Fase 2, requiere Promotion/config)
Notas técnicas: Regla sobre checkout.ts; configurable en admin/settings.

ID: RB-005
Nombre: Sinónimos de búsqueda
Descripción: Mapear términos coloquiales/técnicos.
Actor: Cliente
Condición: Query contiene término de un grupo de sinónimos.
Resultado esperado: Expande a término canónico (shock→amortiguador).
Prioridad: Alta
MVP: Sí (mapa estático)
Notas técnicas: Diccionario en src/data/search-synonyms.ts aplicado antes de buildPrismaWhere.

ID: RB-006
Nombre: Manejo de cero resultados
Descripción: Resultado vacío útil.
Actor: Cliente
Condición: Búsqueda/PLP sin coincidencias.
Resultado esperado: Mensaje claro + populares + CTA WhatsApp.
Prioridad: Alta
MVP: Sí
Notas técnicas: Estado vacío en catalog/page.tsx y search.

ID: RB-007
Nombre: CTA de WhatsApp contextual
Descripción: Consulta directa por producto/pedido.
Actor: Cliente
Condición: PDP, cero resultados, post-orden, header.
Resultado esperado: Abre WhatsApp con mensaje pre-cargado (SKU/orden).
Prioridad: Alta
MVP: Sí
Notas técnicas: Link wa.me con número configurable + texto template. Sin dependencia externa.

ID: RB-008
Nombre: Garantía visible
Descripción: Mostrar garantía por producto.
Actor: Cliente
Condición: Producto tiene warranty.
Resultado esperado: Badge en card/PDP + filtro "Con garantía".
Prioridad: Media
MVP: No (Fase 2)
Notas técnicas: Agregar campo warranty (String o meses Int) a Product.

ID: RB-009
Nombre: Reviews y rating
Descripción: Reseñas y estrellas por producto.
Actor: Cliente
Condición: Cliente con orden entregada del producto.
Resultado esperado: Puede dejar rating 1–5 + texto; PDP muestra promedio.
Prioridad: Media
MVP: No (Fase 3)
Notas técnicas: Modelo Review (productId, orderId, rating, body, status moderación).

ID: RB-010
Nombre: Promociones / combos
Descripción: Descuentos por categoría, combo o temporada.
Actor: Cliente / Admin
Condición: Promoción activa y vigente.
Resultado esperado: Precio con descuento + etiqueta "Oferta".
Prioridad: Media
MVP: No (Fase 2)
Notas técnicas: Modelo Promotion (tipo, valor, scope, vigencia). NO tocar precio base; calcular en runtime.

ID: RB-011
Nombre: Re-validación de compatibilidad en carrito
Descripción: Advertir ítems que no encajan en el vehículo activo.
Actor: Cliente
Condición: Vehículo activo + ítem incompatible en carrito.
Resultado esperado: Advertencia no bloqueante "Verifica que encaje en tu [vehículo]".
Prioridad: Media
MVP: No (Fase 2)
Notas técnicas: Reusar match de compatibilidad en cart/page.tsx.

ID: RB-012
Nombre: Subcategorías (2 niveles)
Descripción: Jerarquía categoría→subcategoría.
Actor: Cliente / Admin
Condición: Catálogo con >~40 productos por categoría.
Resultado esperado: Navegación a 2 niveles + breadcrumb.
Prioridad: Media
MVP: No (Fase 2)
Notas técnicas: parentId self-relation en ProductCategory.
```

**Reglas YA implementadas (trazabilidad, no re-hacer):** compatibilidad por año `yearFrom/yearTo`, reserva temporal de inventario, expiración atómica de reservas, webhook idempotente, stock alerts deduplicados, precio con IVA incluido, carrito guest firmado, checkout retiro/envío por zona.

---

## 5. Componentes recomendados (estado real)

| Componente | Propósito | Datos | Reglas | Estado | Prioridad MVP |
|---|---|---|---|---|---|
| Header | Nav + buscador + vehículo + carrito + WhatsApp | categorías, vehículo activo, # carrito | RB-007 | ✅ `site-header.tsx` (falta WhatsApp + chip vehículo) | Alta |
| Buscador | Búsqueda con autocomplete | query, sugerencias | RB-005, RB-006 | ✅ `search-autocomplete.tsx` (falta sinónimos) | Alta |
| VehicleSelector | Make/Model/Year(/Engine) | makes, models, years | RB-001, RB-002 | ✅ `vehicle-search-panel.tsx` (falta persistencia/motor) | Alta |
| VehicleChip / Garage | Mostrar/cambiar vehículo activo | vehículo activo | RB-002 | **Falta** | Alta |
| Menú de categorías | Navegar catálogo | categorías (+sub) | RB-012 | ✅ `category-rail.tsx` (falta sub) | Alta |
| ProductCard | Mostrar producto en PLP | producto, stock, compat, precio | RB-001, RB-003 | ✅ `product-card.tsx` (falta badge compat) | Alta |
| CompatibilityBadge | "Compatible con tu vehículo" | producto, vehículo activo | RB-001 | **Falta** | Alta |
| Filtros | Refinar PLP | facetas | RB-003 | ✅ `product-filters.tsx`/`filter-drawer.tsx` (falta precio/sort) | Alta |
| SortDropdown | Ordenar PLP | opción sort | RB-003 | **Falta** | Alta |
| StockBadge | Disponibilidad | InventoryStock | — | ✅ `stock-badge.tsx` | Alta |
| WhatsAppCTA | Contacto/consulta | número, mensaje template | RB-007 | **Falta** | Alta |
| Banners/Hero | Conversión | promo activa | RB-010 | ✅ `home-hero.tsx` (estático) | Media |
| BrandSection | Confianza/SEO | marcas | — | ✅ `brand-strip.tsx` (falta páginas) | Media |
| PDP | Detalle completo | producto+compat+stock+specs | RB-001, RB-008 | ✅ `product/[slug]` (falta badge/warning/related/WhatsApp) | Alta |
| Cart | Carrito | items, totales | RB-011 | ✅ `cart/page.tsx` | Alta |
| Checkout | Compra | envío/retiro, pago | — | ✅ `checkout/page.tsx` | Alta |
| EmptyState | Cero resultados | sugerencias | RB-006 | **Falta** (componente reutilizable) | Alta |
| ReviewsBlock | Reseñas | reviews | RB-009 | **Falta** | Baja |
| RelatedProducts | Cross-sell | relacionados | — | **Falta** | Media |
| HelpSection | Ayuda/contacto | FAQ, WhatsApp | RB-007 | **Falta** | Media |

---

## 6. Flujos principales

**Flujo A — Comprar por vehículo (no experto):**
Home → selecciona vehículo → guarda en cookie → navega categoría "Frenos" → PLP filtrado + badges "compatible" → PDP confirma compatibilidad → agrega al carrito → checkout retiro/envío → pago → confirmación + WhatsApp.

**Flujo B — Comprar por parte (mecánico):**
Buscador → SKU/número de parte → match exacto → PDP → verifica compatibilidad/specs → cantidad → carrito → checkout.

**Flujo C — Pieza agotada:**
PDP agotado → "Avísame cuando llegue" (`StockAlertRequest`) → admin recibe alerta → al reponer, notifica.

**Flujo D — No encuentra la pieza:**
Búsqueda 0 resultados → estado vacío + populares + **WhatsApp "te ayudamos"** → asesor responde.

**Flujo E — Cero resultados con vehículo:**
PLP categoría + vehículo = 0 → "No tenemos X para tu Corolla aún" → quitar filtro vehículo / WhatsApp / aviso.

---

## 7. Estructura de datos sugerida (mapeada al schema real)

**Ya existen** (no recrear): `User`, `GuestSession`, `ProductCategory`, `Product`, `ProductImage`, `VehicleCompatibility`, `InventoryLocation`, `InventoryStock`, `Cart`, `CartItem`, `Address`, `Order`, `OrderItem`, `Payment`, `PaymentEvent`, `InvoiceDte`, `Shipment`, `DeliveryZone`, `StockAlertRequest`, `AdminAuditLog`, `EmailLog`.

**Cambios y modelos nuevos recomendados:**

```prisma
// 1. Subcategorías (Fase 2) — agregar a ProductCategory
parentId  String?
parent    ProductCategory?  @relation("CatTree", fields: [parentId], references: [id])
children  ProductCategory[] @relation("CatTree")

// 2. Garantía (Fase 2) — agregar a Product
warrantyMonths Int?      // null = sin garantía declarada

// 3. Marca como entidad (Fase 2) — opcional, para páginas/logos/SEO
model ProductBrand {
  id       String    @id @default(cuid())
  name     String    @unique
  slug     String    @unique
  logoUrl  String?
  products Product[]
}
// (migración gradual: hoy Product.brand es String; mantener y agregar brandId opcional)

// 4. Vehículo normalizado (Fase 2/3) — habilita garage, motor y páginas por modelo
model VehicleMake  { id String @id @default(cuid()) name String @unique slug String @unique models VehicleModel[] }
model VehicleModel { id String @id @default(cuid()) makeId String make VehicleMake @relation(fields:[makeId],references:[id]) name String yearFrom Int yearTo Int }
model VehicleEngine{ id String @id @default(cuid()) modelId String name String }   // motor/versión
// Compatibilidad pasa de strings denormalizados a FKs (mantener compat actual durante migración)

// 5. Garage del usuario (Fase 2)
model SavedVehicle {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  make      String
  model     String
  year      Int
  engine    String?
  label     String?  // "El carro de la esposa"
  isPrimary Boolean  @default(false)
  createdAt DateTime @default(now())
}

// 6. Promociones (Fase 2)
enum PromotionType { PERCENT FIXED FREE_SHIPPING BUNDLE }
model Promotion {
  id          String        @id @default(cuid())
  name        String
  type        PromotionType
  valueCents  Int?          // para FIXED
  percent     Decimal?      // para PERCENT
  scope       Json          // { categoryIds?, productIds?, minSubtotalCents? }
  startsAt    DateTime
  endsAt      DateTime
  isActive    Boolean       @default(true)
  createdAt   DateTime      @default(now())
}

// 7. Reviews (Fase 3)
model Review {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  orderId   String?  // verifica compra
  authorName String
  rating    Int      // 1..5
  body      String?
  status    String   @default("PENDING") // moderación
  createdAt DateTime @default(now())
  @@index([productId, status])
}

// 8. Contenido / SEO (Fase 3)
model Article {
  id            String   @id @default(cuid())
  slug          String   @unique
  title         String
  excerpt       String?
  body          String   // MDX/HTML
  coverUrl      String?
  relatedCategorySlug String?
  isPublished   Boolean  @default(false)
  publishedAt   DateTime?
  createdAt     DateTime @default(now())
}
```

**Regla de migración (importante para no romper):** los modelos nuevos son **aditivos**. La normalización de vehículo y marca debe hacerse **manteniendo los campos string actuales** y migrando con backfill, no con un big-bang. `Promotion` no debe modificar `priceCents`: el descuento se calcula en runtime para preservar el precio base y la auditoría.

---

## 8. Roadmap

### MVP (cerrar lo casi-hecho + ganar confianza barata)
- RB-002 Persistir vehículo (cookie) + chip en header.
- RB-001 Badge "Compatible con tu vehículo" en card y PDP (la lógica ya existe).
- RB-003 Ordenamiento de catálogo (precio, nuevos).
- RB-005 Sinónimos de búsqueda (mapa estático).
- RB-006 Estado vacío útil (PLP + búsqueda).
- RB-007 WhatsApp CTA (header, PDP, post-orden, cero resultados).
- **Gates de la auditoría que mandan sobre todo esto:** credenciales Wompi reales + webhook como fuente de verdad, proceso DTE manual con contador, políticas comerciales (devolución/garantía/incompatibilidad), pooling de Prisma en serverless, rate-limit distribuido. **No lanzar venta real sin estos.**

### Fase 2 (e-commerce más completo)
- RB-008 Garantía (campo + badge + filtro).
- RB-010 Promociones / combos / envío gratis (modelo `Promotion`).
- RB-004 Envío gratis sobre umbral.
- RB-011 Re-validación de compatibilidad en carrito.
- RB-012 Subcategorías.
- `SavedVehicle` (garage multi-vehículo) para usuarios registrados.
- Filtro de precio; motor/versión en compatibilidad.
- Usuario registrado + merge de carrito guest (ya listado como pendiente en `mvp-current-status.md`).

### Fase 3 (escalamiento)
- RB-009 Reviews/ratings + Q&A.
- Contenido/blog SEO (`Article`) + páginas por marca y por modelo.
- Búsqueda fuzzy (`pg_trgm`) o motor externo.
- VIN/placa.
- Recomendaciones ("también compraron").
- Comparador de productos.

---

## 9. Recomendaciones específicas para Castillo (críticas)

1. **No reconstruyas: completa.** Tienes la columna vertebral transaccional. El error sería rehacer catálogo/checkout. Enfoca en garage persistente, badges de compatibilidad, WhatsApp y confianza.
2. **WhatsApp no es opcional en SV.** Es infraestructura de confianza. Es además el feature de mayor ROI/menor costo de toda la lista. Hazlo en MVP.
3. **Compatibilidad visible > compatibilidad oculta.** Hoy filtras pero no comunicas. El badge "Compatible con tu Corolla" y el warning de incompatibilidad reducen devoluciones (tu mayor costo en repuestos) y suben conversión. La lógica ya existe; es trabajo de UI.
4. **No lances sin los gates de la auditoría.** Pago real + DTE + políticas comerciales son bloqueantes legales/financieros, por encima de cualquier feature de este documento.
5. **Sinónimos antes que fuzzy.** Un mapa estático shock↔amortiguador da el 80% del beneficio de búsqueda al 5% del costo. Fuzzy/Algolia después.
6. **Promociones sin tocar el precio base.** Calcula descuentos en runtime; preserva `priceCents` y auditoría. Crítico para conciliación y para no corromper datos.
7. **Normaliza vehículo y marca gradualmente.** No con migración big-bang. Aditivo + backfill.
8. **Contenido SEO es tu canal orgánico más barato** a 6–12 meses, pero es Fase 3: no compite con cerrar la venta real.

### Restricciones (cumplidas por diseño)
- Cero copia de textos, diseño, logo, colores, íconos o layout de AutoZone. Este documento extrae **patrones funcionales y reglas**, no identidad visual.
- Todo en español, adaptado a SV (USD, IVA 13%, zonas de entrega locales, WhatsApp, DTE).
- Priorizado para usuarios no expertos (categoría + vehículo + asistencia humana) sin descuidar al mecánico (SKU/número de parte/motor).

---

Continúa en `docs/autozone-execution-plan.md` para el plan de ejecución con dos modelos, wireframes por página, componentes reutilizables, prompts para el modelo ejecutor y el backlog tipo tickets.
