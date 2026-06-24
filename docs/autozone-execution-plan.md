# Plan de ejecución con dos modelos — Castillo Auto Parts

Fecha: 2026-06-23
Documento hermano: `docs/autozone-benchmark.md` (análisis, reglas de negocio RB-###, estructura de datos).
Propósito: convertir el análisis en trabajo ejecutable separando **modelo arquitecto** (piensa/diseña) de **modelo ejecutor** (implementa tareas pequeñas y claras), con prompts listos para copiar/pegar.

> **Regla de orquestación ya acordada en el proyecto** (auditoría 2026-06-11): el código que **mueve dinero, verifica pagos, decide acceso o emite documentos legales (DTE)** se hace con **Fable 5 u Opus 4.8 (modelo potente), nunca con un modelo económico**. Este plan respeta esa regla: ningún prompt de "modelo ejecutor/liviano" toca pagos, webhooks, auth, reservas de inventario ni DTE.

---

## 1. Mapa visual de ejecución

```
Análisis AutoZone (docs/autozone-benchmark.md)
        ↓
Extracción de patrones y reglas (RB-001…RB-012)
        ↓
Diseño de arquitectura UX + datos  ──►  [MODELO POTENTE]
        ↓
Definición de componentes y contratos (props/datos)
        ↓
Separación en tareas pequeñas (backlog §8)
        ↓
Prompts individuales (§5)  ──────────►  [MODELO EJECUTOR]
        ↓
Implementación componente por componente
        ↓
Validación: typecheck + lint + vitest + Playwright (CI ya existe)
        ↓
Revisión de consistencia / auditoría  ──►  [MODELO POTENTE]
```

Bucle: el potente diseña y revisa los extremos; el ejecutor llena el centro con tareas acotadas.

---

## 2. División de responsabilidades

| Etapa | Responsable | Objetivo | Input necesario | Output esperado | Detalle requerido | Riesgo si se ejecuta mal |
|---|---|---|---|---|---|---|
| Análisis y reglas | Potente | Extraer patrones y RB | Sitio ref + repo | benchmark.md | Muy alto | Construir lo incorrecto |
| Arquitectura de datos | Potente | Definir modelos nuevos | schema.prisma | Migraciones Prisma | Muy alto | Corromper datos / romper checkout |
| Decisiones de UX/flujo | Potente | Definir jerarquía y flujos | benchmark.md | Specs de página | Alto | UX inconsistente |
| Contratos de componentes | Potente | Definir props/estados | specs | Tabla §4 | Alto | Componentes no encajan |
| Implementar componente UI | Ejecutor | Crear componente | Prompt §5 + props | Componente + test | Medio | Bug visual acotado |
| Estilos / responsive | Ejecutor | Ajustar CSS Tailwind | Componente | CSS corregido | Bajo | Overflow/visual |
| Datos mock / seed UI | Ejecutor | Poblar para demo | Tipos | Mock data | Bajo | Datos irreales |
| Copy en español | Ejecutor | Textos UI | Tono de marca | Strings | Bajo | Tono off |
| **Pagos/webhook/DTE/auth/reservas** | **Potente (obligatorio)** | Lógica de dinero/legal | benchmark + auditoría | Código + tests | Muy alto | **Pérdida de dinero / ilegal** |
| Revisión de consistencia | Potente | Auditar el conjunto | PR/diff | Hallazgos | Alto | Deuda acumulada |

---

## 3. Plan visual por páginas (wireframes textuales)

> Convención: `[✅ existe]` = componente ya en el repo; `[➕ nuevo]` = a crear; `[✎ modificar]`.

### Home
```
Objetivo de negocio: capturar vehículo + empujar categorías/destacados + confianza.
Objetivo del usuario: encontrar rápido repuestos para SU carro o por categoría.
Secciones en orden:
1. Header con buscador + chip de vehículo + WhatsApp
2. Hero: dos puertas → "Busca por vehículo" / "Compra por categoría"
3. Confianza (envío/retiro/garantía/WhatsApp)
4. Marcas
5. Búsquedas populares + categorías
6. Destacados (respetando vehículo si existe)
7. (Fase 2) Ofertas
8. (Fase 3) Guías

Wireframe:
[Header: logo | búsqueda | VehicleChip | carrito | WhatsApp]   ← [✎ site-header]
[Hero: VehicleSelector | CategoryQuickLinks]                    ← [✅ search-hero/✎] [✅ category-rail]
[TrustStrip]                                                    ← [✅]
[BrandStrip]                                                    ← [✅]
[PopularSearches | CategoryQuickLinks]                          ← [✅]
[FeaturedProducts]                                              ← [✅ ✎ filtrar por vehículo]
[Footer + WhatsApp flotante]                                    ← [➕ WhatsAppCTA]

Componentes: HomeHeader, SearchHero, VehicleSelector, VehicleChip➕, TrustStrip, BrandStrip,
PopularSearches, CategoryQuickLinks, FeaturedProducts, WhatsAppCTA➕
Reglas aplicadas: RB-002, RB-007
Prioridad MVP: Alta
Notas: el home ya está; el trabajo es chip de vehículo + WhatsApp.
```

### Catálogo / PLP
```
Objetivo de negocio: convertir navegación en carrito.
Objetivo del usuario: filtrar a lo que sí encaja y comprar.
Secciones en orden:
1. Encabezado de categoría + breadcrumb
2. Barra: # resultados + SortDropdown
3. Filtros (sidebar desktop / drawer móvil)
4. Grid de ProductCard con CompatibilityBadge
5. Paginación
6. Estado vacío útil (si 0 resultados)

Wireframe:
[Breadcrumb]                                   ← [➕]
[Título categoría | SortDropdown➕]             ← [✎ catalog/page] [➕ sort]
[Filtros⟷drawer | Grid de ProductCard]          ← [✅ product-filters/filter-drawer] [✎ product-card +badge]
[CatalogPagination]                            ← [✅]
[EmptyState si 0]                              ← [➕]

Componentes: catalog-filter-form✅, filter-drawer✅, product-card✎, CompatibilityBadge➕,
SortDropdown➕, catalog-pagination✅, EmptyState➕, VehicleChip➕
Reglas: RB-001, RB-003, RB-006
Prioridad MVP: Alta
```

### Resultados de búsqueda
```
Objetivo de negocio: no perder intención de compra.
Objetivo del usuario: encontrar por nombre/SKU/sinónimo.
Secciones: igual que PLP + interpretación de query ("Mostrando resultados para 'amortiguador' (también: shock)").
Wireframe:
[Resumen de búsqueda + sinónimos aplicados]    ← [➕]
[SortDropdown | Grid]                          ← reusa PLP
[EmptyState con populares + WhatsApp si 0]      ← [➕]
Componentes: reusa PLP + SearchSummary➕ + EmptyState➕
Reglas: RB-005, RB-006, RB-007
Prioridad MVP: Alta
```

### Página de categoría
```
Objetivo: entrada SEO + navegación clara.
Wireframe:
[Hero categoría + descripción]
[Subcategorías (Fase 2)]                       ← requiere parentId
[VehicleSelector contextual]
[Grid o link a PLP filtrado]
Reglas: RB-012
Prioridad MVP: Media (hoy la categoría es un filtro del PLP; basta para MVP)
```

### Página de producto (PDP)
```
Objetivo de negocio: cerrar venta + reducir devolución.
Objetivo del usuario: confirmar que encaja, precio, disponibilidad, comprar.
Secciones en orden:
1. Breadcrumb
2. Galería + badges (marca, garantía, compatible)
3. Título + marca + SKU/partNumber
4. Bloque de compatibilidad (badge o warning + lista de vehículos)
5. Precio (IVA incl.) + StockBadge
6. [Agregar al carrito] + [Consultar WhatsApp] + retiro/envío
7. Garantía y devoluciones
8. Especificaciones (technicalDetails)
9. Instalación / advertencias ("vendido por unidad")
10. Alternativas + relacionados (Fase 2)
11. Reviews/Q&A (Fase 3)

Wireframe:
[Breadcrumb➕]
[ProductGallery✅ | Título+SKU + CompatibilityBlock➕ + Precio + StockBadge✅ + AddToCart✅ + WhatsAppCTA➕]
[Tabs: Specs✅(technicalDetails) | Garantía➕ | Instalación➕]
[RelatedProducts➕ (Fase 2)]
[ReviewsBlock➕ (Fase 3)]

Componentes: product-gallery✅, quantity-stepper✅, stock-badge✅, CompatibilityBlock➕,
WhatsAppCTA➕, RelatedProducts➕, ReviewsBlock➕
Reglas: RB-001, RB-007, RB-008, RB-009
Prioridad MVP: Alta (badge/warning + WhatsApp)
```

### Carrito
```
Objetivo: avanzar a checkout sin sorpresas.
Wireframe:
[Lista CartItem (qty control✅) | Resumen + totales]
[Aviso compatibilidad por ítem (Fase 2)]       ← RB-011
[Botón checkout | seguir comprando]
[StockAlert si algo se agotó✅]
Componentes: cart-quantity-control✅, cart-notice✅, CompatibilityWarning➕(F2)
Reglas: RB-011
Prioridad MVP: Alta (ya existe; sólo aviso de compat en F2)
```

### Checkout
```
Objetivo: cobrar correctamente (dinero → MODELO POTENTE).
Wireframe:
[Datos cliente] [Retiro vs Envío (location picker✅/delivery fields✅)] [Resumen] [Pago] [Confirmar]
[Captura datos fiscales para DTE si pide factura]  ← gate legal
Componentes: checkout-location-picker✅, checkout-delivery-fields✅
Reglas: gates de pago/DTE (NO ejecutor)
Prioridad MVP: Alta (ya existe; pendiente credenciales reales)
Notas: cualquier cambio aquí = modelo potente.
```

### Ayuda / Contacto
```
Objetivo: confianza + descargar dudas a WhatsApp.
Wireframe:
[FAQ acordeón] [Datos de bodega + horario] [WhatsApp + teléfono] [Políticas: garantía/devolución/envío]
Componentes: FAQAccordion➕, WhatsAppCTA➕
Reglas: RB-007
Prioridad MVP: Media
```

### Guías / Blog (Fase 3)
```
Objetivo: SEO orgánico → catálogo.
Wireframe:
[Listado de artículos por categoría] [Artículo: cuerpo + CTA a categoría relacionada]
Componentes: ArticleCard➕, ArticleBody➕
Reglas: enlazar a PLP
Prioridad MVP: No (Fase 3)
```

---

## 4. Componentes reutilizables (con prompt para ejecutor)

### CompatibilityBadge
```
Propósito: indicar si un producto encaja en el vehículo activo.
Dónde se usa: ProductCard (PLP), PDP.
Props: { isCompatible: boolean; vehicleLabel?: string }  // "2015 Toyota Corolla"
Estados: sin vehículo (oculto), compatible (verde), no confirmado (ámbar).
Reglas: RB-001. No mostrar nada si no hay vehículo activo.
Prioridad: Alta
Prompt ejecutor:
"Crea src/components/product/compatibility-badge.tsx. Props {isCompatible, vehicleLabel?}.
Si no hay vehicleLabel, renderiza null. Si isCompatible: pill verde con check e ícono lucide
'Check', texto 'Compatible con tu {vehicleLabel}'. Si no: pill ámbar con 'AlertTriangle',
texto 'Compatibilidad no confirmada'. Usa las clases/tokens del design system existente
(bg-primary/10, border-border, text-xs). Sin lógica de negocio: solo presentación. Español."
```

### VehicleChip
```
Propósito: mostrar el vehículo activo y permitir cambiarlo/quitarlo.
Dónde se usa: header, PLP, PDP.
Props: { vehicle: {make,model,year} | null; onClear: ()=>void }
Estados: vacío ("Agregar vehículo"), activo (muestra label + X).
Reglas: RB-002. Lee de cookie ca_vehicle (helper aparte).
Prioridad: Alta
Prompt ejecutor:
"Crea src/components/product/vehicle-chip.tsx (client component). Props {vehicle, onClear}.
Si vehicle es null: botón outline 'Agregar mi vehículo' con ícono Car. Si existe: chip con
'Tu vehículo: {year} {make} {model}' y botón X que llama onClear. Responsive, compacto en móvil.
Usa tokens del design system. Español. Sin fetch ni cookies aquí: solo UI + callbacks."
```

### WhatsAppCTA
```
Propósito: abrir WhatsApp con mensaje pre-cargado.
Dónde se usa: header, PDP, cero resultados, post-orden, ayuda, botón flotante.
Props: { phone: string; message?: string; variant?: 'button'|'floating'|'inline' }
Estados: button, floating (esquina), inline.
Reglas: RB-007. URL wa.me. Número configurable por env/config.
Prioridad: Alta
Prompt ejecutor:
"Crea src/components/whatsapp-cta.tsx. Props {phone, message?, variant='button'}.
Genera href https://wa.me/{phone}?text={encodeURIComponent(message)}. variant 'floating' =
botón redondo fixed bottom-right con ícono; 'button' = botón verde con texto 'Consultar por
WhatsApp'; 'inline' = link. target=_blank rel=noopener. Accesible (aria-label). Español.
No hardcodear el número: recíbelo por prop."
```

### SortDropdown
```
Propósito: ordenar el PLP.
Props: { value: string; options: {value,label}[] }  // sincroniza con ?sort=
Estados: default (relevancia), seleccionado.
Reglas: RB-003. Cambiar sort actualiza la URL (searchParams).
Prioridad: Alta
Prompt ejecutor:
"Crea src/components/catalog/sort-dropdown.tsx (client). Opciones: relevancia (default),
precio-asc 'Precio: menor a mayor', precio-desc 'Precio: mayor a menor', nuevos 'Más nuevos'.
Al cambiar, actualiza el searchParam ?sort= preservando los demás params (usa el patrón de
url-utils.ts ya existente). Estilo select del design system. Español."
```

### EmptyState
```
Propósito: estado vacío útil (0 resultados).
Props: { title: string; description?: string; suggestions?: string[]; showWhatsApp?: boolean }
Estados: con/sin sugerencias.
Reglas: RB-006, RB-007.
Prioridad: Alta
Prompt ejecutor:
"Crea src/components/empty-state.tsx. Props {title, description?, suggestions?, showWhatsApp?}.
Centrado, ícono lucide 'SearchX'. Renderiza title, description, chips de suggestions (links a
/catalog?q=), y si showWhatsApp, un WhatsAppCTA inline 'Te ayudamos a encontrar tu repuesto'.
Reusa WhatsAppCTA. Español."
```

### CompatibilityBlock (PDP)
```
Propósito: bloque de compatibilidad en PDP (badge + lista de vehículos).
Props: { activeVehicle?: {...}; isCompatible?: boolean; compatibleVehicles: {make,model,yearFrom,yearTo}[] }
Estados: sin vehículo (invita a seleccionar), compatible, incompatible (warning + alternativas CTA).
Reglas: RB-001.
Prioridad: Alta
Prompt ejecutor:
"Crea src/components/product/compatibility-block.tsx. Si activeVehicle existe y isCompatible:
banner verde 'Compatible con tu {label}'. Si existe y !isCompatible: banner ámbar
'No confirmamos que encaje en tu {label}' + link 'Ver alternativas' + CTA WhatsApp. Si no hay
activeVehicle: caja neutra 'Selecciona tu vehículo para verificar'. Debajo, lista colapsable
'Vehículos compatibles' renderizando compatibleVehicles como '{make} {model} {yearFrom}-{yearTo}'.
Reusa CompatibilityBadge y WhatsAppCTA. Español. Solo presentación."
```

---

## 5. Prompts pequeños para modelo ejecutor (copy/paste)

> Cada uno: una tarea, contexto mínimo, criterios de aceptación, sin re-analizar AutoZone. Todos son seguros para modelo liviano (UI/CSS/copy). Los que tocan dinero/legal NO están aquí (van a modelo potente, §7).

**Prompt ejecutor #1 — WhatsApp CTA**
```
Título: Crear componente WhatsAppCTA
Objetivo: botón reutilizable que abre WhatsApp con mensaje pre-cargado.
Contexto mínimo: Castillo Auto Parts, tienda de repuestos en El Salvador (Next.js 16, App
Router, Tailwind v4, lucide-react). WhatsApp es el canal de soporte principal.
Tarea: crea src/components/whatsapp-cta.tsx según props {phone, message?, variant='button'|
'floating'|'inline'}. href = https://wa.me/{phone}?text={encode(message)}, target _blank,
rel noopener, aria-label.
Criterios de aceptación: 3 variantes funcionan; floating = fixed bottom-right; usa tokens del
design system; textos en español; el número llega por prop (no hardcode).
Restricciones: no copiar diseño de AutoZone; no añadir dependencias.
Resultado esperado: componente + uso de ejemplo en comentario.
```

**Prompt ejecutor #2 — Badge de compatibilidad**
```
Título: Crear CompatibilityBadge
Objetivo: pill que indica compatibilidad con el vehículo activo.
Contexto mínimo: existe lógica de compatibilidad en src/data/catalog-filters.ts; este
componente SOLO pinta el resultado.
Tarea: crea src/components/product/compatibility-badge.tsx con props {isCompatible, vehicleLabel?}.
null si no hay vehicleLabel; verde+Check si compatible; ámbar+AlertTriangle si no.
Criterios de aceptación: render condicional correcto; sin lógica de negocio; español; tokens del
design system; tamaño text-xs apto para card.
Restricciones: solo presentación; sin fetch.
Resultado esperado: componente listo para usar en product-card.tsx y PDP.
```

**Prompt ejecutor #3 — SortDropdown del catálogo**
```
Título: Crear SortDropdown
Objetivo: ordenar el PLP vía ?sort=.
Contexto mínimo: el catálogo usa searchParams; existe helper de URL en src/lib/url-utils.ts.
Tarea: crea src/components/catalog/sort-dropdown.tsx (client) con opciones relevancia/precio-asc/
precio-desc/nuevos; al cambiar, actualiza ?sort= preservando los otros params.
Criterios de aceptación: cambia la URL sin borrar filtros; default relevancia; español.
Restricciones: no implementar el orderBy de Prisma aquí (eso es de otra tarea de servidor).
Resultado esperado: componente cliente + nota de qué param emite.
```

**Prompt ejecutor #4 — EmptyState reutilizable**
```
Título: Crear EmptyState
Objetivo: estado vacío útil para 0 resultados.
Contexto mínimo: se usará en catálogo y búsqueda; existe (o existirá) WhatsAppCTA.
Tarea: crea src/components/empty-state.tsx con props {title, description?, suggestions?, showWhatsApp?}.
Criterios de aceptación: chips de sugerencias como links a /catalog?q=; integra WhatsAppCTA si
showWhatsApp; centrado; ícono SearchX; español.
Restricciones: reusar WhatsAppCTA, no duplicar.
Resultado esperado: componente + ejemplo de uso.
```

**Prompt ejecutor #5 — Chip de vehículo (UI)**
```
Título: Crear VehicleChip (solo UI)
Objetivo: mostrar/cambiar/quitar el vehículo activo.
Contexto mínimo: el vehículo activo se persistirá en cookie por otra tarea; este componente
recibe el valor y callbacks.
Tarea: crea src/components/product/vehicle-chip.tsx (client) con props {vehicle|null, onClear}.
Criterios de aceptación: estado vacío y activo; botón X llama onClear; responsive; español.
Restricciones: sin cookies/fetch aquí.
Resultado esperado: componente presentacional.
```

**Prompt ejecutor #6 — Diccionario de sinónimos (datos)**
```
Título: Crear mapa de sinónimos de búsqueda
Objetivo: mejorar recall de búsqueda en español/técnico.
Contexto mínimo: la búsqueda usa substring en catalog-filters.ts; queremos expandir términos
antes de filtrar.
Tarea: crea src/data/search-synonyms.ts exportando un mapa { canonical: string[] } y una función
expandQuery(q: string): string[] que devuelva el término + sinónimos. Incluye al menos:
amortiguador↔shock↔strut, pastilla↔balata↔brake pad, bujía↔spark plug, batería↔acumulador,
filtro de aceite↔oil filter, banda↔correa↔belt, foco↔luz↔bombillo.
Criterios de aceptación: función pura testeable; normaliza acentos/case; incluye test vitest.
Restricciones: solo datos + función pura; no tocar el flujo de búsqueda todavía.
Resultado esperado: src/data/search-synonyms.ts + search-synonyms.test.ts.
```

**Prompt ejecutor #7 — Sección de ayuda/FAQ**
```
Título: Crear página de ayuda /ayuda
Objetivo: confianza + soporte.
Contexto mínimo: ruta App Router; existe WhatsAppCTA.
Tarea: crea src/app/ayuda/page.tsx con FAQ en acordeón (5 preguntas: envío, retiro, garantía,
devoluciones, cómo encontrar mi repuesto), datos de bodega/horario (placeholder configurable),
y WhatsAppCTA.
Criterios de aceptación: acordeón accesible; responsive; español; placeholders claros para datos
reales.
Restricciones: no inventar políticas legales definitivas (marcar como placeholder).
Resultado esperado: página + componente FAQAccordion si hace falta.
```

> Más prompts (badge en card, related products UI, article card) se derivan igual del backlog §8.

---

## 6. Priorización para ejecución

**Fase 0 — Preparación (potente):**
- Confirmar entidades nuevas (`Promotion`, `Review`, `SavedVehicle`, vehículo normalizado, `Article`, campos `warrantyMonths`, `parentId`) — ver benchmark §7.
- Confirmar taxonomía de categorías/subcategorías y diccionario de sinónimos.
- Confirmar tokens de design system (ya existe `docs/design-system.md`).

**Fase 1 — MVP visual/funcional (mezcla; UI = ejecutor):**
- WhatsAppCTA (ej. #1), CompatibilityBadge (#2), VehicleChip UI (#5), SortDropdown (#3), EmptyState (#4), sinónimos (#6).
- Persistencia de vehículo en cookie (potente: toca middleware/cookies de sesión).
- Badge en ProductCard + CompatibilityBlock en PDP (potente decide el cómputo; ejecutor pinta).

**Fase 2 — E-commerce completo:**
- Migraciones `Promotion`, `warrantyMonths`, `parentId`, `SavedVehicle` (potente).
- Envío gratis por umbral + descuentos en runtime (potente: toca checkout/dinero).
- Subcategorías, filtro de precio, re-validación de compat en carrito.
- Usuario registrado + merge de carrito (potente: auth/datos).

**Fase 3 — Escalamiento:**
- Reviews + moderación, blog SEO (`Article`), búsqueda fuzzy (`pg_trgm`), VIN/placa, recomendaciones, comparador.

---

## 7. Criterios: qué modelo usar

**Modelo POTENTE (Fable 5 / Opus 4.8) — obligatorio para:**
- Todo lo que **mueve dinero**: checkout, `payments/*`, `webhooks/wompi`, envío gratis/descuentos, conciliación, reembolsos.
- **Acceso y datos**: `auth.ts`, `admin-session.ts`, middleware, `SavedVehicle`/cuentas, merge de carrito.
- **Legal**: `InvoiceDte`, captura de datos fiscales, políticas.
- **Datos/migraciones**: cualquier cambio a `schema.prisma`, migraciones, reservas de inventario (`inventory-reservations.ts`).
- **Decisiones**: arquitectura, flujos, IA, revisión de consistencia, auditoría de PRs.

**Modelo EJECUTOR (liviano) — apto para:**
- Componentes UI presentacionales (badges, chips, cards, dropdowns, empty states).
- CSS/Tailwind, responsive, fixes visuales.
- Copy en español, textos de UI.
- Datos mock / seed de demo, mapas de sinónimos (función pura + test).
- Refactors pequeños y acotados de un solo archivo de UI.

**Regla de seguridad:** si un prompt para el ejecutor empieza a tocar `src/lib/payments`, `src/lib/auth*`, `src/app/api/webhooks`, `inventory-reservations`, `checkout.ts` o `schema.prisma` → **detente y pásalo al modelo potente**. Esto ya es política del proyecto (auditoría 2026-06-11).

---

## 8. Backlog tipo tickets

> `Modelo`: P = potente, L = liviano. `Dep`: dependencias.

```
ID: FE-001
Título: WhatsAppCTA reutilizable
Página/componente: components/whatsapp-cta.tsx
Prioridad: Alta | Modelo: L | Dep: número WhatsApp configurable (env)
Aceptación: variantes button/floating/inline; href wa.me con mensaje; español; accesible.
Prompt: ver §5 #1.

ID: FE-002
Título: CompatibilityBadge
Página/componente: components/product/compatibility-badge.tsx
Prioridad: Alta | Modelo: L | Dep: ninguna
Aceptación: null sin vehículo; verde compatible; ámbar no confirmado; sin lógica de negocio.
Prompt: ver §5 #2.

ID: FE-003
Título: Persistir vehículo activo (cookie ca_vehicle)
Página/componente: lib/active-vehicle.ts + integración header
Prioridad: Alta | Modelo: P | Dep: patrón de cookie de cart-state.ts
Aceptación: set/get/clear; firmada; leída en Server Components; usada por badge/chip.
Nota: toca cookies/sesión → modelo potente.

ID: FE-004
Título: VehicleChip (UI)
Página/componente: components/product/vehicle-chip.tsx
Prioridad: Alta | Modelo: L | Dep: FE-003 (para datos)
Aceptación: estados vacío/activo; onClear; responsive.
Prompt: ver §5 #5.

ID: FE-005
Título: Badge de compatibilidad en ProductCard y PDP
Página/componente: product-card.tsx (✎), product/[slug] (✎), compatibility-block.tsx (➕)
Prioridad: Alta | Modelo: P (cómputo) + L (UI)
Dep: FE-002, FE-003
Aceptación: card muestra badge cuando hay vehículo; PDP muestra block con warning + alternativas.
Regla: RB-001.

ID: FE-006
Título: SortDropdown + orderBy en catálogo
Página/componente: components/catalog/sort-dropdown.tsx (L) + query catálogo (P)
Prioridad: Alta | Modelo: L (UI) + P (Prisma orderBy)
Dep: ninguna
Aceptación: ?sort= cambia orden sin perder filtros; precio/nuevos funcionan en DB.
Regla: RB-003.

ID: FE-007
Título: Diccionario de sinónimos + integración búsqueda
Página/componente: data/search-synonyms.ts (L) + buildPrismaWhere (P)
Prioridad: Alta | Modelo: L (datos) + P (integración where)
Dep: ninguna
Aceptación: 'shock' devuelve amortiguadores; test pasa.
Regla: RB-005. Prompt datos: §5 #6.

ID: FE-008
Título: EmptyState + 0 resultados en PLP/búsqueda
Página/componente: components/empty-state.tsx (L) + catalog/page.tsx (✎)
Prioridad: Alta | Modelo: L | Dep: FE-001
Aceptación: muestra populares + WhatsApp cuando 0 resultados.
Regla: RB-006, RB-007.

ID: FE-009
Título: Página /ayuda con FAQ + WhatsApp
Página/componente: app/ayuda/page.tsx
Prioridad: Media | Modelo: L | Dep: FE-001
Aceptación: FAQ acordeón; datos de bodega placeholder; WhatsApp.
Prompt: §5 #7.

ID: BE-010
Título: Modelo Promotion + cálculo de descuento en runtime
Página/componente: schema.prisma + lib/pricing.ts
Prioridad: Media (Fase 2) | Modelo: P | Dep: ninguna
Aceptación: no modifica priceCents; calcula precio final; admin CRUD.
Regla: RB-010. Notas: dinero → potente.

ID: BE-011
Título: Campo warrantyMonths + badge/filtro garantía
Página/componente: schema.prisma (P) + UI badge (L)
Prioridad: Media (Fase 2) | Modelo: P (migración) + L (UI)
Aceptación: migración aditiva; badge en card/PDP; filtro "con garantía".
Regla: RB-008.

ID: BE-012
Título: Subcategorías (parentId en ProductCategory)
Página/componente: schema.prisma + nav
Prioridad: Media (Fase 2) | Modelo: P | Dep: backfill de categorías
Aceptación: 2 niveles + breadcrumb; migración aditiva.
Regla: RB-012.

ID: BE-013
Título: Envío gratis sobre umbral
Página/componente: checkout.ts + admin/settings
Prioridad: Media (Fase 2) | Modelo: P | Dep: BE-010 opcional
Aceptación: subtotal ≥ umbral ⇒ shipping 0 en zonas elegibles; mensaje al usuario.
Regla: RB-004. Notas: dinero → potente.

ID: BE-014
Título: SavedVehicle (garage multi-vehículo)
Página/componente: schema.prisma + account
Prioridad: Media (Fase 2) | Modelo: P | Dep: usuario registrado
Aceptación: CRUD de vehículos; uno primario; cambia el activo.
Regla: RB-002.

ID: BE-015
Título: Reviews + moderación
Página/componente: schema.prisma + PDP + admin
Prioridad: Baja (Fase 3) | Modelo: P (modelo/moderación) + L (UI)
Aceptación: rating verificado por compra; promedio en PDP; cola de moderación.
Regla: RB-009.

ID: CO-016
Título: Blog/Guías SEO (Article)
Página/componente: schema.prisma + app/guias
Prioridad: Baja (Fase 3) | Modelo: P (modelo) + L (UI/listado)
Aceptación: artículos publicables; enlazan a categorías; SEO básico.

ID: FE-017
Título: RelatedProducts en PDP
Página/componente: components/product/related-products.tsx
Prioridad: Media (Fase 2) | Modelo: L (UI) + P (criterio de relación)
Aceptación: muestra alternativas/relacionados por categoría/compatibilidad.
```

---

## 9. Cómo usar estos dos documentos

1. **Arquitecto (potente):** lee `autozone-benchmark.md` para el porqué; aprueba modelos/migraciones (§7 del benchmark) y los flujos.
2. **Ejecutor (liviano):** recibe un prompt de §5 o un ticket FE-### de §8; implementa **solo eso**; no necesita leer el benchmark completo.
3. **Validación:** el CI existente (`quality` + `e2e`) corre lint, typecheck, vitest, build y Playwright en cada PR — úsalo como gate.
4. **Frontera dura:** nada que toque dinero/auth/legal/inventario/schema va al ejecutor. Política del proyecto.
```
