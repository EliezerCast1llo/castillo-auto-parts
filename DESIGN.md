---
name: Castillo Autoparts — Señal de Destino
description: Salvadoran highway destination signage: a green enamel plate, white information, one yellow exit, asphalt below.
colors:
  sign-green: "#0b6b3a"
  sign-green-deep: "#085129"
  sign-white: "#f2f5f2"
  sign-white-dim: "#c7d8cc"
  sign-yellow: "#f2b705"
  asphalt: "#16181a"
  asphalt-raised: "#1f2225"
  asphalt-ink: "#d7dadc"
  asphalt-ink-dim: "#9ea4a8"
  stripe: "#e8e4d9"
typography:
  display:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "clamp(42px, 7vw, 88px)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "clamp(18px, 2.4vw, 26px)"
    fontWeight: 800
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "clamp(16px, 2.1vw, 24px)"
    fontWeight: 800
    letterSpacing: "0.03em"
  lead:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "clamp(18px, 2.1vw, 23px)"
    fontWeight: 600
    lineHeight: 1.5
  place:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "clamp(15px, 1.9vw, 21px)"
    fontWeight: 600
    letterSpacing: "0.01em"
  body:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "clamp(15px, 1.7vw, 18px)"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 800
    letterSpacing: "0.22em"
  meta:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  none: "0px"
spacing:
  hairline: "2px"
  rule: "3px"
  xs: "4px"
  sm: "10px"
  md: "16px"
  bolt-inset: "30px"
  gutter: "clamp(20px, 4vw, 56px)"
  section-gap: "clamp(28px, 5vh, 56px)"
components:
  plate:
    backgroundColor: "{colors.sign-green}"
    textColor: "{colors.sign-white}"
    rounded: "{rounded.none}"
    padding: "{spacing.gutter}"
  button-exit:
    backgroundColor: "{colors.sign-yellow}"
    textColor: "{colors.asphalt}"
    typography: "{typography.headline}"
    rounded: "{rounded.none}"
    padding: "14px clamp(20px, 3vw, 32px)"
    height: "72px"
  nav-lang:
    textColor: "{colors.sign-white}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "44px"
  nav-lang-hover:
    backgroundColor: "{colors.sign-white}"
    textColor: "{colors.sign-green-deep}"
  shield-mark:
    backgroundColor: "{colors.sign-white}"
    textColor: "{colors.sign-green-deep}"
    rounded: "{rounded.none}"
    width: "46px"
    height: "38px"
  shield-mark-hover:
    backgroundColor: "{colors.sign-yellow}"
    textColor: "{colors.asphalt}"
  destination-row:
    textColor: "{colors.sign-white}"
    typography: "{typography.place}"
    rounded: "{rounded.none}"
    padding: "clamp(10px, 1.6vh, 16px) 0"
  footer:
    backgroundColor: "{colors.asphalt-raised}"
    textColor: "{colors.asphalt-ink-dim}"
    typography: "{typography.meta}"
    padding: "clamp(20px, 3vh, 28px) clamp(20px, 4vw, 56px) clamp(28px, 4vh, 40px)"
---

# Design System: Castillo Autoparts — Señal de Destino

## Overview

**Creative North Star: "The Destination Sign"**

This is Salvadoran highway destination signage rendered as a web surface. The
page is a green enamel plate read at speed: it names what exists, states how
far it is from your hands in time rather than kilometres, and marks where the
exit is. Everything below the plate is the asphalt it stands over, with a
painted lane stripe running across it. The world is built from four marks and
survives the removal of all its copy: green field, authored arrow, distance in
time, yellow exit plate.

Nothing is simulated. There is no chrome, no metal gradient, no bevel pretending
to be relief, no drop shadow standing in for a photograph of a sign. The only
materials the build carries are flat enamel colour, an inset white border of the
kind a real plate has, a painted stripe, and four bolt heads in the plate's
corners. The density is low and deliberate: a single plate, two destination
rows, one action, three facts, two contact fields.

Type is one family at three weights, drawn from FHWA highway lettering and
self-hosted (downloaded at build by `next/font`, never fetched at runtime). The
page ships with zero images, by constraint: the business has no photographs
yet and none may be invented, so the world is carried entirely by colour,
geometry, and lettering.

**Key Characteristics:**
- Green enamel field dominant; white reserved for information
- Warning yellow exactly once per page, only on the primary action
- Zero corner radius; silhouette comes from `clip-path`, not from rounding
- One type family (Overpass) at weights 400 / 600 / 800
- Authored SVG arrows at a 3px stroke, matching the system rule weight
- No images, no photographs, no icon library
- Flat throughout: depth is tonal (plate over asphalt), never cast

## Colors

A reflective-signage palette: one saturated green field, one warning accent, and
a cold asphalt ground, with no tint or decorative hue anywhere between them.

### Primary
- **Sign Green** (`{colors.sign-green}`): The plate itself. The dominant field of
  the upper section, edge to edge, and the background of the preview card. Any
  new surface in this world starts as this green.
- **Deep Sign Green** (`{colors.sign-green-deep}`): Ink colour for white-on-green
  inversions only: the route-shield mark's letters and the language plate's text
  when it fills on hover. Never a background field.

### Secondary
- **Warning Yellow** (`{colors.sign-yellow}`): The exit plate's field, the focus
  ring, the selection highlight, and the underline colour of a hovered contact
  link. On the page body it appears exactly once, on the primary action.

### Neutral
- **Sign White** (`{colors.sign-white}`): Information on green. Headline,
  destination names, the plate's inset border, the route shield's field, the
  language plate's stroke.
- **Dim Sign White** (`{colors.sign-white-dim}`): Arrow strokes inside the
  destination rows, so the arrow reads as hardware rather than as text.
- **Asphalt** (`{colors.asphalt}`): The ground of the lower section and the page
  root background; also the ink on yellow.
- **Raised Asphalt** (`{colors.asphalt-raised}`): The footer band, one step up
  from the ground so the page closes without a rule.
- **Asphalt Ink** (`{colors.asphalt-ink}`): Primary text on asphalt — the lead
  paragraph and contact values.
- **Dim Asphalt Ink** (`{colors.asphalt-ink-dim}`): Supporting facts, contact
  terms, footer text.
- **Stripe** (`{colors.stripe}`): Road paint. The lane stripe across the asphalt
  (at 50% opacity) and the hover colour of a contact link.

### Named Rules
**The One Yellow Rule.** Warning yellow appears exactly once in the page body,
and only on the primary action. Its second appearance anywhere destroys the
signal. Browser-surface use (`::selection`, `:focus-visible`) is the one
exemption, because those are responses and not content.

**The Three Fields Rule.** Every surface is one of three fields: green plate
(the claim), asphalt (the facts), raised asphalt (the close). There is no
fourth background colour and no card floating inside a field.

**The Inversion Rule.** White on green inverts to deep green on white; yellow
inverts to asphalt. Nothing else inverts, and no text sits on a tint.

## Typography

**Display Font:** Overpass (with `system-ui`, `sans-serif` fallback)
**Body Font:** Overpass — the same family at a lower weight
**Label Font:** Overpass at 800, wide-tracked

**Character:** Overpass is drawn from FHWA highway lettering: wide, low-contrast,
open apertures, legible at a glance and at a distance. One family does all the
work, so the hierarchy is carried by weight, size, and tracking rather than by
contrast between faces. Three weights ship: 400, 600, 800.

### Hierarchy
- **Display** (800, `clamp(42px, 7vw, 88px)`, line-height 0.98): The plate's
  legend. Mixed case, flush left, `max-width: 18ch`, `text-wrap: balance`. One
  per page.
- **Headline** (800, `clamp(18px, 2.4vw, 26px)`): The exit plate's action text.
- **Title** (800, `clamp(16px, 2.1vw, 24px)`, tracking 0.03em, uppercase): The
  distance-in-time value in a destination row. Set `nowrap`, right-aligned.
- **Lead** (600, `clamp(18px, 2.1vw, 23px)`, line-height 1.5): The first
  paragraph on asphalt.
- **Place** (600, `clamp(15px, 1.9vw, 21px)`): A destination name, and the
  contact values in the asphalt definition list.
- **Body** (400, `clamp(15px, 1.7vw, 18px)`, line-height 1.6): Supporting facts
  on asphalt, held to `max-width: 68ch`.
- **Label** (800, 12px, tracking 0.22em, uppercase): Short sign legends only —
  the word on the exit plate, and the terms in the contact list (0.2em there).
- **Meta** (400, 13px, line-height 1.6): The footer's two lines.

### Named Rules
**The Mixed-Case Legend Rule.** The display legend is mixed case, not all caps.
Modern destination signage moved to mixed case because it is read faster at
speed, which is the condition this page imitates. Uppercase is reserved for
short legends — the exit word, the time values, contact terms — exactly where a
real sign uses it. (This is a cited deviation from the direction contract's
all-caps headline, argued in the surface brief and in the stylesheet.)

**The One Family Rule.** One family, three weights (400 / 600 / 800). No second
face, no italic, no condensed cut. If a level needs separating, change weight,
size, or tracking.

**The Tracking Inverse Rule.** Tracking tightens as size grows (-0.02em at
display) and opens as size shrinks (0.22em at 12px label). A 12px string without
open tracking is not a sign legend.

## Layout

A single column, full-viewport flex shell (`min-height: 100svh`). The green
plate takes all the remaining height and the asphalt section follows it, so the
plate always fills the first viewport regardless of copy length.

Horizontal rhythm is one token: a fluid gutter of `clamp(20px, 4vw, 56px)`, used
as the plate's padding, the asphalt's inline padding, and the footer's. Vertical
rhythm is fluid in the same way — `clamp(28px, 5vh, 56px)` between plate
regions, `clamp(28px, 4vh, 48px)` inside the plate body, `clamp(44px, 7vh, 76px)`
at the top of the asphalt. Fixed small steps are 2px (row gap), 4px, 10px, 16px.

The plate's internal composition reads top-left to bottom-right: route shield
and language plate in the head, legend and destination rows centred in the body
(`align-content: center`), exit plate pinned to the bottom edge
(`align-self: end`). A destination row is a three-column grid — place /
arrow / time — at `minmax(0, 1fr) auto minmax(9ch, max-content)`.

Measure is capped where text runs: 18ch on the display legend, 68ch on the
asphalt facts.

One breakpoint, at 640px, and it only tightens: the destination row's time
column drops to `auto` with a 10px column gap, the arrow shrinks to 22px, and
the exit plate stretches full width with its content pushed apart. The arrow
survives on phone deliberately — it is one of the four marks the world is
recognised by, on the device most traffic arrives from.

### Named Rules
**The Unbroken Stripe Rule.** The lane stripe runs horizontally across the full
inline axis and scales its dash with viewport width
(`clamp(40px, 7vw, 86px)` paint, `clamp(92px, 15vw, 190px)` period). It never
wraps to a second line and never becomes a texture.

**The One Gutter Rule.** All page-level horizontal inset comes from the gutter
token. No section invents its own margin.

## Elevation & Depth

There are no shadows in this system. Nothing is lifted, nothing casts, nothing
is beveled to imitate relief. Depth is tonal and material: the green plate sits
over the asphalt ground because they are different fields, and the footer is one
step lighter than the asphalt (`{colors.asphalt-raised}`) to close the page
without a divider.

The single `box-shadow` in the build is not elevation: it is the plate's enamel
border, two stacked inset rings
(`inset 0 0 0 3px {colors.sign-white}, inset 0 0 0 12px {colors.sign-green}`)
that reproduce the white line a real destination plate carries inside its edge.

The plate's four mounting bolts are the only other material detail: 14px flat
translucent-white discs (`#ffffff52`) inset 30px from the corners, drawn as
pseudo-element backgrounds. They are hardware, not highlights — no gloss, no
gradient ramp, no ring.

### Named Rules
**The Nothing Faked Rule.** No chrome, no metal gradient, no gloss, no bevel
imitating relief, no drop shadow, no photograph, no stock image. Only flat
enamel, the inset border, the painted stripe, and the bolt heads. A gradient is
permitted solely as a drawing primitive for a flat shape (the bolt discs, the
stripe dashes), never as a lighting effect.

**The Flat Field Rule.** Surfaces are flat at every state. State is expressed by
colour inversion or by position, never by lift.

## Shapes

Zero radius, everywhere. There is no corner-rounding token in this system and no
surface receives one; `rounded.none` exists only so a generator has an explicit
answer.

Silhouette comes from clipping, and only twice:
- The **route shield**: `polygon(0 0, 100% 0, 100% 72%, 50% 100%, 0 72%)` — the
  pointed-bottom cut of a highway route marker, at 46×38px.
- The **exit plate**: `polygon(0 0, 100% 0, calc(100% - 18px) 100%, 0 100%)` — the
  18px bevel of a real exit panel, cut on the trailing edge in the direction of
  travel.

Lines are a two-tier system: the 3px system rule (`--rule`) for the plate border,
the language plate's stroke, the focus outline, and the authored arrow's stroke
weight; and a 1px hairline at `#ffffff3d` for the rules that separate destination
rows. Nothing in between.

### Named Rules
**The Zero Radius Rule.** Radius is 0 on every surface. If a shape needs an
identity, cut it with `clip-path` from the signage vocabulary — never round it.

**The Shared Rule Weight Rule.** The 3px rule token is one value doing four
jobs: plate border, button stroke, focus ring, arrow stroke. Drawn marks and
drawn borders are the same thickness, which is what makes the arrow read as part
of the sign rather than as an icon pasted on it.

## Components

### Buttons
- **Shape:** Square (0 radius), with the exit plate beveled 18px on its trailing
  edge via `clip-path`.
- **Primary (the exit plate):** Warning yellow field, asphalt ink, minimum height
  72px, padding `14px clamp(20px, 3vw, 32px)`, bottom-right of the plate. It
  carries three children in reading order: the wide-tracked uppercase legend, the
  action text, and the authored arrow. It is a plain anchor to WhatsApp and works
  without JavaScript.
- **Hover / Focus:** Hover slides the plate 10px along the travel direction
  (`translateX(10px)`, 220ms `cubic-bezier(0.16, 1, 0.3, 1)`); the colour does not
  change, because yellow has nowhere to go. Focus is the system ring: 3px solid
  warning yellow at a 3px offset. Under `prefers-reduced-motion: reduce` both the
  transition and the transform are removed.
- **Secondary:** There is none. The page has one action; a second button variant
  does not exist in this world.

### Navigation
- **Language plate:** A single anchor styled as a small sign plate — 3px white
  stroke, no fill, 44px minimum height, 14px inline padding, 15px/800 text at
  0.06em tracking, uppercase locale code. Hover inverts it: white fill, deep
  green text. It carries both `lang` and `hrefLang`, so the label is pronounced
  in its own language.
- **Route shield:** The brand lock-up in the head-left position a route number
  occupies on a real sign — the clipped white shield containing the two-letter
  mark in deep green, followed by the brand name at `clamp(15px, 1.6vw, 19px)`/800.
  Hovering the lock-up turns the shield yellow with asphalt ink; this is the one
  place yellow appears as a transient state rather than as the action.

### Destination Row (signature component)
The structural unit of the page, not a decorative list. Each row states a place
and how long it is away, because the distance that matters to someone with a
stopped car is time.
- **Grid:** place / arrow / time, baseline-aligned, `gap: clamp(12px, 2vw, 24px)`,
  `padding-block: clamp(10px, 1.6vh, 16px)`.
- **Rules:** 1px `#ffffff3d` on top of each row, plus a bottom rule on the last,
  so the set reads as a bracketed column; rows are separated by a 2px grid gap.
- **Type:** place at 600, time at 800 uppercase and right-aligned, so the eye
  crosses the row and lands on the time.
- **Count:** Two rows ship, not three. A third destination would have to promise
  a delivery time that courier shipping cannot hold, which would break the
  column's grammar; national coverage is stated on the asphalt instead. (Cited
  deviation, argued in the surface brief.)

### Authored Arrow (signature component)
A hand-authored SVG on a `0 0 48 24` viewbox: one shaft and two head strokes
(`M2 12h38M30 2l12 10-12 10`), no fill, `currentColor`, `stroke-width: 3`. It is
`clamp(28px, 3vw, 40px)` wide on the plate, 22px on phone, and inherits dim sign
white in a destination row and asphalt ink on the exit plate. The same path at
the same stroke weight is redrawn in the preview card.

### Contact List
A definition list on asphalt, laid out as wrap-capable flex columns with
`clamp(24px, 5vw, 64px)` between them. Terms are the 12px/800 uppercase label at
0.2em tracking in dim asphalt ink; values are 600 weight in asphalt ink. Links
keep their underline at 2px thickness with a 5px offset, and on hover the text
goes stripe-white while the underline turns warning yellow.

### Browser Surfaces
Selection and focus are part of the system, not left to the browser:
`::selection` is warning yellow with asphalt ink, and `:focus-visible` is a 3px
warning-yellow outline at a 3px offset on every focusable element.

### Named Rules
**The Authored Arrow Rule.** Arrows are authored SVG at the 3px system stroke.
No icon library, no icon font, no text glyph (`→`, `»`), no `<img>`. Any new
mark in this world is drawn at the rule weight or it is not drawn.

**The Single Action Rule.** One action per surface, rendered as the one yellow
plate, reachable without JavaScript. Additional calls to action do not get a
button; they get prose or nothing.

## Do's and Don'ts

### Do:
- **Do** start any new surface as the green plate (`{colors.sign-green}`) with the
  3px inset white enamel border, and put information in sign white.
- **Do** spend warning yellow (`{colors.sign-yellow}`) on exactly one element per
  page: the primary action.
- **Do** express distance as time in the destination rows ("HOY", "HOY O
  MAÑANA"), uppercase, right-aligned, 800 weight.
- **Do** set display and body copy in mixed case; keep uppercase for short sign
  legends and contact terms, with tracking opened to 0.2–0.22em.
- **Do** draw new marks as authored SVG at `stroke-width: 3`, matching the plate
  border, button stroke, and focus ring.
- **Do** cut identity with `clip-path` from the signage vocabulary — the pointed
  route shield, the 18px exit bevel — and keep every corner at 0 radius.
- **Do** derive all page-level horizontal inset from the gutter token
  (`clamp(20px, 4vw, 56px)`).
- **Do** theme `::selection` and `:focus-visible` from the palette on any new
  surface.
- **Do** pair every entering animation with a `prefers-reduced-motion` branch,
  and keep the stagger short (90ms between rows, 180ms to the exit plate).
- **Do** ship with no images. When photographs of the warehouse exist, they
  enter as a new, documented material; until then the world is colour, geometry,
  and lettering.

### Don't:
- **Don't** add a second yellow element, a yellow heading, or a yellow rule. The
  rarity is the whole mechanism.
- **Don't** fake material: no chrome, no metal gradient, no gloss, no bevel
  imitating relief, no drop shadow, no cast or ambient elevation of any kind.
- **Don't** round a corner. There is no radius in this system.
- **Don't** use an icon library, an icon font, or a text-glyph arrow.
- **Don't** introduce a second type family, an italic, or a weight outside
  400 / 600 / 800; and don't load type at runtime — it is self-hosted at build.
- **Don't** set the display legend in all caps, and don't uppercase anything
  longer than a short legend.
- **Don't** let the lane stripe wrap to a second line or turn into a repeating
  texture or a diagonal hatch.
- **Don't** put a card, panel, or tinted box inside a field; there are three
  fields and nothing floats in them.
- **Don't** state a distance, time, price, figure, address, or hour that the
  business cannot hold. A destination row that promises an unsupported time
  breaks the column's grammar, not just its copy.
- **Don't** add a second button. A surface in this world has one action.
