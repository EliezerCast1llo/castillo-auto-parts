# Roadmap vigente del MVP

Corte: **23 de octubre de 2026**. Meta: **compra real posible el 20 de diciembre
de 2026**, sujeta a aprobación del propietario y a los bloqueos descritos en
[Estado actual](mvp-current-status.md). El plan aprobado el 22 de octubre sustituye
el calendario anterior por fases y el horizonte relativo de “tres meses”.

## Backlog aprobado y estado verificado

Enlaces directos a GitHub: el estado de esta tabla es una foto del corte; abrir
el issue para conocer cambios posteriores. “Cerrado” acredita entrega técnica,
no configuración ni validación comercial de servicios reales.

| Ticket | Trabajo | Estado GitHub | Siguiente gate |
| --- | --- | --- | --- |
| [#87](https://github.com/EliezerCast1llo/castillo-auto-parts/issues/87) | Actualización de seguridad Next/Auth | Cerrado | Mantener dependencias revisadas; no es un audit de seguridad futuro. |
| [B2 / #88](https://github.com/EliezerCast1llo/castillo-auto-parts/issues/88) | Preparación de producción Railway, PostgreSQL, backups y cron | Cerrado | Propietario provisiona, configura y prueba servicios; ver también #101. |
| [B3 / #89](https://github.com/EliezerCast1llo/castillo-auto-parts/issues/89) | Dominio, URLs públicas y Resend | Abierto | Dominio/DNS y cuenta del propietario; validar entrega real. |
| [B4 / #90](https://github.com/EliezerCast1llo/castillo-auto-parts/issues/90) | Wompi sandbox, reconciliación y reembolso manual | Abierto | Sociedad/afiliación y credenciales; URL pública B2. Desarrollo simulado posible antes. |
| [B5 / #91](https://github.com/EliezerCast1llo/castillo-auto-parts/issues/91) | Boxful por API: cotización, guía y rastreo nacional | Abierto | Cuenta/API de pruebas, URL pública y medidas/pesos reales de B8. |
| [B6 / #92](https://github.com/EliezerCast1llo/castillo-auto-parts/issues/92) | Registro manual mínimo de DTE por pedido | Abierto | Sociedad/Hacienda y definición fiscal con contador. |
| [B7 / #93](https://github.com/EliezerCast1llo/castillo-auto-parts/issues/93) | Políticas comerciales en ayuda, footer y checkout | Abierto | Texto aprobado por el propietario; coherencia con cobertura B5. |
| [B8 / #94](https://github.com/EliezerCast1llo/castillo-auto-parts/issues/94) | Importación masiva CSV del catálogo | Cerrado | Propietario carga datos reales, verifica stock/medidas y desactiva demo. |
| [B9 / #95](https://github.com/EliezerCast1llo/castillo-auto-parts/issues/95) | Errores, logs correlacionados y alertas | Cerrado | Aprobar/configurar Sentry y probar alertas; conectar operaciones Boxful al completar B5. |
| [B10 / #96](https://github.com/EliezerCast1llo/castillo-auto-parts/issues/96) | Regresión y smoke contra producción | Abierto | B2–B9 operativos; compra real requiere autorización explícita. |
| [B12 / #97](https://github.com/EliezerCast1llo/castillo-auto-parts/issues/97) | Actualizar documentación de estado | Abierto, este trabajo | Revisar/aprobar el PR documental. |

Seguimientos técnicos ya cerrados y fusionados:
[#99](https://github.com/EliezerCast1llo/castillo-auto-parts/issues/99) (CSP/i18n/a11y),
[#101](https://github.com/EliezerCast1llo/castillo-auto-parts/issues/101) (seed/backups),
[#103](https://github.com/EliezerCast1llo/castillo-auto-parts/issues/103) (CSV),
[#107](https://github.com/EliezerCast1llo/castillo-auto-parts/issues/107) y
[#109](https://github.com/EliezerCast1llo/castillo-auto-parts/issues/109) (SKU).
No volver a tratarlos como desarrollo pendiente; conservar las verificaciones de
operación real que correspondan.

## Orden de avance y dependencias

1. **Negocio e infraestructura:** propietario resuelve sociedad, contador, accesos,
   dominio, políticas e inventario; configura los servicios Railway preparados
   en B2. [Guía de despliegue](deploy-production-railway.md).
2. **Integraciones:** B3 habilita dominio/correo; B4 completa pagos; B5 completa
   envío nacional; B6 registra el DTE. Las credenciales y decisiones externas son
   bloqueos distintos del código que puede desarrollarse con simuladores.
3. **Operación:** B7 publica políticas aprobadas; con B8 se carga catálogo real;
   se verifican backups, cron y alertas B9 con responsables designados.
4. **Salida:** B10 registra resultados contra URL pública, con pagos/correos/envíos
   y DTE validados. El propietario aprueba el lanzamiento para la meta del
   20/12/2026; CI verde por sí solo no autoriza ventas ni despliegues.

## Seguimiento y evidencia

GitHub Issues y PR son el sistema de coordinación acordado. Cada PR relaciona
su issue, evidencia de CI `quality`/`e2e`, límites conocidos y revisión humana;
ver [Project tracking](project-tracking.md). No se fusiona ni despliega sin
aprobación del propietario.

## Plan por fases anterior

Las fases 0–10 de mayo/junio se conservan en el historial Git de este archivo y
en los [documentos de fases históricos](historical-phases.md), sin borrar ninguno.
No son la cola de trabajo vigente: recomendaciones como volver a elegir marca,
alojamiento o proveedor de entrega se reemplazaron por las decisiones del
21–22 de octubre registradas en [Estado actual](mvp-current-status.md).
