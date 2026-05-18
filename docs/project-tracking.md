# Project Tracking - Tareas, agentes y visibilidad

## Objetivo

Mantener un tracking visual simple para que el QA/PO vea que esta haciendo cada agente, que esta bloqueado, que esta listo para revisar y que ya fue aprobado.

## Recomendacion inicial

Usar **GitHub + GitHub Projects** como sistema principal de tracking.

Motivo:

- conecta tareas con issues, branches, commits y pull requests;
- permite vista Kanban, tabla y roadmap;
- evita duplicar informacion entre tablero y codigo;
- funciona bien para un proyecto donde Codex implementara cambios en un repo;
- permite que cada feature tenga criterios de aceptacion y checklist QA.

Trello es valido si se quiere algo muy visual y simple, pero para desarrollo de software conviene que el tablero este cerca del codigo.

## Tablero recomendado

Columnas:

- `Backlog`
- `Ready for Product`
- `Ready for Design`
- `Ready for Dev`
- `In Progress`
- `Blocked`
- `Ready for QA`
- `QA Changes Requested`
- `Approved`
- `Done`

## Campos recomendados

- `Feature`
- `Priority`: P0, P1, P2, P3.
- `Agent`: Product, UX/UI, Frontend, Backend, QA, Marketing, Market Research, Codex.
- `Area`: catalog, cart, checkout, payments, admin, inventory, DTE, maps, SEO.
- `Risk`: low, medium, high.
- `MVP`: yes/no.
- `Status`
- `Target phase`

## Tipos de issue

- `Feature`
- `Bug`
- `Research`
- `Design`
- `Tech Debt`
- `QA`
- `Decision`

## Flujo por issue

1. Product Agent define alcance.
2. UX/UI Agent define experiencia si aplica.
3. Backend/Frontend implementan.
4. QA Agent crea checklist y pruebas.
5. QA/PO humano revisa.
6. Si hay cambios, vuelve a `QA Changes Requested`.
7. Si se aprueba, pasa a `Done`.

## Template de feature

```md
## Objetivo

## Usuario

## Alcance

## Fuera de alcance

## Criterios de aceptacion

## Agente responsable

## Riesgos

## Checklist QA

## Evidencia
```

## Template de decision

```md
## Decision

## Contexto

## Opciones consideradas

## Decision tomada

## Consecuencias

## Fecha
```

## Alternativas

### Linear

Buena opcion si se quiere una experiencia mas pulida para producto/desarrollo, cycles y roadmap. Recomendable si el equipo crece o si el tracking de GitHub Projects se siente limitado.

### Trello

Buena opcion si se quiere simplicidad visual. Menos ideal si se quiere conectar tareas con PRs, ramas y releases de forma natural.

### Notion

Buena opcion para wiki, decisiones y docs, pero menos fuerte que GitHub Projects/Linear como tracking tecnico.

## Decision recomendada

Iniciar con GitHub Projects. Si despues de 2 a 3 semanas se siente limitado, migrar a Linear. Mantener la documentacion viva en `docs/` para que el repo sea la fuente de verdad.
