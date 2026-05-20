# Fase 7B - Admin de productos e inventario

Fecha: 2026-05-19.

## Estado

Primera versión implementada para QA.

## Objetivo

Permitir que el admin cargue productos manualmente, edite datos básicos del catálogo y actualice inventario de la bodega principal sin tocar el seed.

## Entregado

- Ruta `/admin/products`.
- Listado admin de productos.
- Búsqueda por nombre, marca, SKU y número de parte.
- Filtro por estado de inventario.
- Métricas de productos, activos, alertas y unidades.
- Ajuste rápido de inventario por producto:
  - cantidad;
  - punto de alerta;
  - estado.
- Ruta `/admin/products/new`.
- Ruta `/admin/products/[slug]/edit`.
- Creación y edición de:
  - nombre;
  - slug;
  - marca;
  - SKU;
  - número de parte;
  - precio;
  - categoría existente o nueva;
  - estado activo/destacado;
  - descripción corta;
  - descripción completa;
  - detalles técnicos;
  - compatibilidad por vehículo;
  - inventario inicial.
- Protección con el login admin temporal.
- Revalidación de catálogo, home, detalle de producto y admin después de guardar.

## Decisiones

- Se mantiene una sola bodega lógica `MAIN` / `Bodega principal`.
- Si la cantidad queda en `0`, el estado se normaliza a `No disponible`, excepto si el producto queda como `Preorden`.
- La compatibilidad se captura como líneas simples con el patrón `Marca Modelo Año-Año`.
- No se agregan imágenes todavía; se mantiene el visual generado/placeholder del catálogo.

## Fuera de alcance

- Auditoría de cambios admin.
- Multi-bodega.
- Carga masiva CSV.
- Scanner de factura.
- Gestión de imágenes reales.
- Roles separados para bodega/ventas.

## Checklist QA

- Entrar a `/admin/products` sin sesión y confirmar redirección a login.
- Iniciar sesión admin.
- Ver productos seed/mock persistidos.
- Buscar por SKU.
- Filtrar por `Últimas unidades`.
- Cambiar cantidad de un producto y guardar.
- Confirmar que el catálogo refleja la nueva disponibilidad.
- Crear un producto nuevo.
- Editar el producto nuevo.
- Confirmar que `/product/[slug]` muestra los datos actualizados.
- Validar que SKU o slug duplicado muestra error.
- Validar mobile/tablet/desktop.
