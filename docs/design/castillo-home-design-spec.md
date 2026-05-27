Quiero que implementes la homepage de Castillo Auto Parts basada en la imagen de referencia ubicada en:

docs/design/home-reference.png

Objetivo:
Reemplazar la homepage actual por una versión premium, moderna, automotriz y mucho más cercana a la referencia visual.

Importante:
- No cambies la lógica de negocio existente.
- No rompas carrito, catálogo, productos ni rutas actuales.
- Primero identifica qué componentes actuales existen y reutiliza lo que tenga sentido.
- Si hay componentes muy débiles visualmente, puedes refactorizarlos.
- Mantén el proyecto responsive desde el inicio.
- Mantén soporte para dark mode si ya existe.
- No agregues librerías nuevas sin pedirme aprobación.
- Usa Tailwind CSS y componentes existentes del proyecto.
- Si existe shadcn/ui, úsalo como base para buttons, cards, inputs, dropdowns y badges.
- Si no existe shadcn/ui, implementa componentes custom con Tailwind.

Referencia visual:
La homepage debe parecerse a la imagen en:
- Header premium navy
- Logo a la izquierda
- Navegación superior
- Barra de búsqueda grande y protagonista
- Hero split:
  - lado izquierdo con headline fuerte
  - lado derecho con vehículo / imagen automotriz
  - tarjetas flotantes de marcas/repuestos
- Selector de vehículo en card blanca superpuesta:
  - Marca
  - Modelo
  - Año
  - Motor
  - CTA “Buscar compatibilidad”
- Trust strip:
  - Repuestos originales
  - Garantía
  - Envío rápido
  - Pago seguro
- Marcas destacadas
- Lo más buscado
- Entradas rápidas al catálogo
- Productos destacados
- Product cards más compactas, premium y con mejor jerarquía

Identidad visual:
- Marca: Castillo Auto Parts
- Estilo: premium automotriz, tecnológico, masculino, confiable
- Color principal: navy oscuro
- Color secundario: azul profundo
- Acento: dorado / mostaza
- Fondo: blanco / gris muy claro
- Verde solo para disponibilidad o éxito
- Evitar cyan

Colores sugeridos:
- Navy 950: #061933
- Navy 900: #082447
- Navy 800: #0B3268
- Blue 700: #0F5FB8
- Blue 600: #1267C5
- Gold 500: #D9A21B
- Gold 400: #F2B72A
- Surface: #FFFFFF
- Background: #F5F7FA
- Border: #D8E0EA
- Text primary: #0F172A
- Text secondary: #5B6678
- Success: #16803A

Componentes esperados:
1. TopHeader / UtilityBar
2. MainNavbar
3. GlobalSearchBar
4. HeroSection
5. VehicleSelector
6. TrustStrip
7. BrandStrip
8. PopularSearches
9. CategoryQuickLinks
10. FeaturedProducts
11. ProductCard
12. Footer o trust footer si ya existe

Reglas de layout:
- Usar max-width consistente, idealmente 1280px o 1440px.
- Usar cards con border radius entre 14px y 20px.
- Usar sombras suaves, no exageradas.
- Dar más aire vertical que la versión actual.
- Mejorar jerarquía: título grande, subtítulo claro, CTA visible.
- Product cards no deben verse como placeholders genéricos.
- La búsqueda y el selector de vehículo deben ser los elementos más importantes arriba del fold.

Responsive:
- Desktop: hero en dos columnas, selector horizontal.
- Tablet: hero puede mantenerse en dos columnas si cabe.
- Mobile:
  - navbar compacta
  - search full width
  - hero en una columna
  - vehicle selector en stack vertical
  - product cards en una columna o dos según ancho
  - filtros y categorías scrollables horizontalmente si aplica

Accesibilidad:
- Inputs con labels reales.
- Botones con focus visible.
- Contraste suficiente.
- No usar divs clickeables donde debe haber buttons.
- Imágenes con alt text.
- Cards con estructura semántica.

Implementación:
Primero revisa la estructura actual y dime:
1. Qué archivos tocarás.
2. Qué componentes crearás o modificarás.
3. Qué CSS/tokens usarás.
4. Qué riesgos ves.

Luego implementa en fases:
Fase 1: tokens visuales y layout base.
Fase 2: header, search y hero.
Fase 3: vehicle selector y trust strip.
Fase 4: marcas, categorías y productos destacados.
Fase 5: responsive y polish final.

Después de implementar:
- Corre lint/build si existen scripts.
- Dame resumen de archivos modificados.
- Dame instrucciones para probar visualmente.