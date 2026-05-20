# Fase 7C - Ajustes de retiro y zonas

Fecha: 2026-05-20.

## Estado

Primera versión implementada para QA.

## Objetivo

Permitir que el admin configure datos básicos de retiro en bodega y zonas/tarifas de envío local sin cambiar código.

## Entregado

- Modelo `DeliveryZone`.
- Campos operativos en `InventoryLocation`:
  - dirección;
  - horario de retiro;
  - instrucciones;
  - latitud;
  - longitud.
- Seed idempotente para:
  - `Bodega principal`;
  - `Santa Tecla` con tarifa USD 2.00;
  - `San Salvador` con tarifa USD 3.00.
- Ruta protegida `/admin/settings`.
- Edición de datos de retiro.
- Creación/edición de zonas de envío.
- Checkout leyendo zonas activas desde base de datos.
- Checkout mostrando dirección, horario, instrucciones y mapa de bodega.
- Backend de orden validando cobertura contra zonas activas.

## Decisiones

- Para el MVP se mantiene una bodega lógica `MAIN`.
- Las tarifas son por zona/municipio, no por colonia ni distancia todavía.
- Si no hay zonas activas por error de configuración, el checkout usa fallback seguro con Santa Tecla y San Salvador.
- El mapa sigue siendo iframe de Google Maps; el pin manual queda para la fase de mapa.

## Fuera de alcance

- Pin manual.
- Geocoding real.
- Validación por coordenadas.
- Tarifas por distancia.
- Horarios con bloqueo automático de días cerrados.
- Multi-bodega.

## Checklist QA

- Entrar a `/admin/settings` sin sesión y confirmar redirección a login.
- Iniciar sesión admin.
- Ver datos de retiro.
- Editar horario o instrucciones de retiro.
- Confirmar que checkout muestra el cambio.
- Ver zonas San Salvador y Santa Tecla.
- Cambiar tarifa de una zona.
- Confirmar que checkout usa la nueva tarifa.
- Crear una zona nueva y confirmar que aparece en checkout.
- Desactivar una zona y confirmar que no aparece como opción.
- Validar mobile/tablet/desktop.
