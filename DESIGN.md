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
  galvanized: "#8f979b"
  galvanized-dark: "#5f676a"
  ink-hairline: "color-mix(in srgb, #f2f5f2 24%, transparent)"
  ink-hardware: "color-mix(in srgb, #f2f5f2 32%, transparent)"
typography:
  display:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "clamp(30px, 4.2vw, 54px)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  brand:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "clamp(15px, 1.6vw, 19px)"
    fontWeight: 800
    letterSpacing: "0.02em"
  headline:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "clamp(15px, 4.6vw, 26px)"
    fontWeight: 800
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "clamp(24px, 3.6vw, 46px)"
    fontWeight: 800
    letterSpacing: "0.03em"
  lead:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "clamp(18px, 2.1vw, 23px)"
    fontWeight: 600
    lineHeight: 1.5
  place:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "clamp(17px, 2.2vw, 26px)"
    fontWeight: 600
    letterSpacing: "0.01em"
  contact-value:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "clamp(17px, 2vw, 21px)"
    fontWeight: 600
  body:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "clamp(15px, 1.7vw, 18px)"
    fontWeight: 400
    lineHeight: 1.6
  code:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 800
    letterSpacing: "0.06em"
  label:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 800
    letterSpacing: "0.2em"
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
  mount-air: "clamp(18px, 3vh, 34px)"
  post-drop: "clamp(52px, 7vh, 92px)"
components:
  sign-mount:
    rounded: "{rounded.none}"
    padding: "{spacing.mount-air} {spacing.gutter} 0"
  sign-post:
    backgroundColor: "{colors.galvanized}"
    rounded: "{rounded.none}"
    width: "clamp(10px, 1.1vw, 16px)"
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
    typography: "{typography.code}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "44px"
  nav-lang-hover:
    backgroundColor: "{colors.sign-white}"
    textColor: "{colors.sign-green-deep}"
  shield-lockup:
    textColor: "{colors.sign-white}"
    typography: "{typography.brand}"
    rounded: "{rounded.none}"
  shield-mark:
    backgroundColor: "{colors.sign-white}"
    textColor: "{colors.sign-green-deep}"
    rounded: "{rounded.none}"
    width: "46px"
    height: "38px"
  shield-mark-hover:
    backgroundColor: "{colors.sign-yellow}"
    textColor: "{colors.asphalt}"
  contact-value:
    textColor: "{colors.asphalt-ink}"
    typography: "{typography.contact-value}"
    rounded: "{rounded.none}"
  destination-row:
    textColor: "{colors.sign-white}"
    typography: "{typography.place}"
    rounded: "{rounded.none}"
    padding: "clamp(16px, 2.4vh, 26px) 0"
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
exit is. The plate is a mounted object, not a background band: it has air above
and beside it, a sheet edge below it, and two galvanized posts that descend
behind it and plant in the asphalt. The asphalt is the page ground — the sign is
seen *from* the road, so there is road behind it — with a painted lane stripe
running across it below the footings. The world is built from four marks and
survives the removal of all its copy: green field, authored arrow, distance in
time, yellow exit plate.

Nothing is simulated. There is no chrome, no gloss, no bevel pretending to be
relief, no drop shadow standing in for a photograph of a sign. The materials the
build carries are the four the world names and nothing else: flat enamel colour,
the inset white border of the kind a real plate has, galvanized steel (the two
posts, their footing plates, and the sheet's own bottom edge), and the painted
stripe — plus four bolt heads in the plate's corners, which are the fastening the
mount implies. Every one of them is drawn flat: the post is two hard-stopped
tones across its width, not a lighting ramp. The density is low and deliberate:
a single plate, two destination rows, one action, three facts, two contact
fields.

The plate's hierarchy is deliberately inverted against the habit of the web: the
legend is a greeting and sits at a conversational size, while the time in each
destination row is set large enough to be recognised before the phrase around it
is read. The time is the commercial argument — the part is in this warehouse and
you can have it today — so it is the loudest thing on the plate after the
legend, and on a phone it is the loudest thing in its row.

Type is one family at three weights, drawn from FHWA highway lettering and
self-hosted (downloaded at build by `next/font`, never fetched at runtime). The
page ships with zero images, by constraint: the business has no photographs
yet and none may be invented, so the world is carried entirely by colour,
geometry, and lettering.

**Key Characteristics:**
- The time in a destination row outranks the phrase around it and is read first
- Green enamel field dominant; white reserved for information
- Warning yellow exactly once per page, only on the primary action
- Zero corner radius; silhouette comes from `clip-path`, not from rounding
- One type family (Overpass) at weights 400 / 600 / 800
- Authored SVG arrows at a 3px stroke, matching the system rule weight
- No images, no photographs, no icon library
- The plate is mounted, not floated: two galvanized posts plant it in the ground
- Depth is material and tonal — sheet thickness, post, field change — never cast

## Colors

A reflective-signage palette: one saturated green field, one warning accent, a
galvanized grey for the hardware that holds the plate up, and a cold asphalt
ground, with no tint or decorative hue anywhere between them.

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

### Tertiary
- **Galvanized** (`{colors.galvanized}`): The lit face of a mounting post — the
  middle band of its two-tone section. This is the fourth material the world
  always named and the build drew only once the plate became an object.
- **Dark Galvanized** (`{colors.galvanized-dark}`): The post's turning edges, its
  footing plate where it meets the ground, and the plate's own bottom sheet edge.
  Hardware only; never a text colour and never a field.

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
- **Hairline Ink** (`{colors.ink-hairline}`): The 1px rules that bracket the
  destination column. Not a new colour: sign white at a quarter strength, derived
  from the token because an engraved line on enamel is the same paint at less
  force, not a separate ink.
- **Hardware Ink** (`{colors.ink-hardware}`): The four bolt heads in the plate's
  corners — sign white at a third strength, derived the same way.
- **Stripe** (`{colors.stripe}`): Road paint. The lane stripe across the asphalt
  (at 50% opacity) and the hover colour of a contact link.

### Named Rules
**The One Yellow Rule.** Warning yellow appears exactly once in the page body,
and only on the primary action. Its second appearance anywhere destroys the
signal. Browser-surface use (`::selection`, `:focus-visible`) is the one
exemption, because those are responses and not content.

**The Three Fields Rule.** Every surface is one of three fields: green plate
(the claim), asphalt (the facts and the page ground behind the sign), raised
asphalt (the close). There is no fourth background colour. The galvanized greys
are not a field: they are drawn hardware, and they only ever appear as the
structure that holds a plate up.

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
- **Display** (800, `clamp(30px, 4.2vw, 54px)`, line-height 1.02): The plate's
  legend. Mixed case, flush left, `max-width: 20ch`, `text-wrap: balance`. One
  per page. It is sized as a greeting, not as a billboard: it opens the plate and
  then yields to the destination rows, which carry the argument.
- **Brand** (800, `clamp(15px, 1.6vw, 19px)`, tracking 0.02em): The brand name
  beside the route shield in the plate head. Mixed case.
- **Headline** (800, `clamp(15px, 4.6vw, 26px)`): The exit plate's action text,
  set `nowrap`. The steep viewport coefficient is load-bearing, not decorative:
  the string must stay on one line, so it has to shrink with the viewport. A
  fixed size at 320px overflowed the document and the landing smoke test caught
  it.
- **Title** (800, `clamp(24px, 3.6vw, 46px)`, tracking 0.03em, uppercase): The
  distance-in-time value in a destination row, and the largest element on the
  plate after the legend. Set `nowrap`; right-aligned on the plate, left-aligned
  under its place name on a phone. It outranks Place by design — the time is what
  the visitor came to find out.
- **Lead** (600, `clamp(18px, 2.1vw, 23px)`, line-height 1.5): The first
  paragraph on asphalt.
- **Place** (600, `clamp(17px, 2.2vw, 26px)`): A destination name on the plate.
  It carries weight because the row is the page's structure, but it stays below
  the time it points at.
- **Contact Value** (600, `clamp(17px, 2vw, 21px)`): The values in the asphalt
  contact list. It starts one step above Place because it sits on asphalt rather
  than on enamel and has no arrow leading the eye to it.
- **Body** (400, `clamp(15px, 1.7vw, 18px)`, line-height 1.6): Supporting facts
  on asphalt, held to `max-width: 68ch`.
- **Code** (800, 15px, tracking 0.06em, uppercase): A short code on a small head
  plate — the locale on the language plate. Fixed, not fluid: a head plate is the
  same size at every width.
- **Label** (800, 12px, tracking 0.2em, uppercase): Short sign legends only. Its
  surviving instance is the terms in the asphalt contact list; the role is still
  real, but it no longer appears on the plate. (The exit plate's wide-tracked
  legend was removed from the build: it named the metaphor instead of saying what
  happens on tap, and the space it took forced the action text onto two lines on
  a phone.)
- **Meta** (400, 13px, line-height 1.6): The footer's single line.

### Named Rules
**The Mixed-Case Legend Rule.** The display legend is mixed case, not all caps.
Modern destination signage moved to mixed case because it is read faster at
speed, which is the condition this page imitates. Uppercase is reserved for
short legends — the time values and the contact terms — exactly where a real
sign uses it. (This is a cited deviation from the direction contract's
all-caps headline, argued in the surface brief and in the stylesheet.)

**The One Family Rule.** One family, three weights (400 / 600 / 800). No second
face, no italic, no condensed cut. If a level needs separating, change weight,
size, or tracking.

**The Tracking Inverse Rule.** Tracking tightens as size grows (-0.02em at
display) and opens as size shrinks (0.2em at the 12px label). A 12px string
without open tracking is not a sign legend.

**The Time Outranks The Greeting Rule.** In a destination row the time is set
larger than the place it belongs to, and it is the largest type on the plate
after the legend. The legend greets; the time is the reason to choose this
business, so it has to be recognisable before the phrase around it is read. A
row that sets its value at or below its label's size has inverted the page's
argument.

## Layout

A single column, full-viewport flex shell (`min-height: 100svh`) whose own
background is the asphalt ground. Inside it, a mount wrapper takes all the
remaining height and holds the green plate; the asphalt section follows, so the
plate always fills the first viewport regardless of copy length.

The mount is what makes the plate a piece rather than a band. It insets the plate
by the air token (`{spacing.mount-air}`) on top and by the gutter on the sides,
with nothing at the bottom, so the plate has visible edges on three sides and the
posts continue out of the fourth. It is `position: relative` with `z-index: 1`,
because the posts overshoot its bottom and the asphalt section — later in the flow
— would otherwise paint over them.

Horizontal rhythm is one token: a fluid gutter of `clamp(20px, 4vw, 56px)`, used
as the mount's and plate's inline padding, the asphalt's, and the footer's.
Vertical rhythm is fluid in the same way — `clamp(28px, 5vh, 56px)` between plate
regions, `clamp(28px, 4vh, 48px)` inside the plate body. Below the plate, one
token governs everything: the post drop (`{spacing.post-drop}`) sets how far the
posts descend past the plate, and both the asphalt's top padding
(`post-drop + clamp(34px, 5vh, 60px)`) and the lane stripe's offset
(`post-drop + clamp(22px, 3vh, 36px)`) are measured from it, so the stripe runs
*below* the footings instead of cutting across the posts. Fixed small steps are
2px (row gap), 4px, 10px, 16px.

The plate's internal composition reads top-left to bottom-right: route shield
and language plate in the head, legend and destination rows centred in the body
(`align-content: center`), exit plate pinned to the bottom edge
(`align-self: end`). A destination row is a three-column grid — place /
arrow / time — at `minmax(0, 1fr) auto minmax(9ch, max-content)`, with
`padding-block: clamp(16px, 2.4vh, 26px)`. The row's authority comes from air as
much as from size: it was given both when the time was promoted.

Measure is capped where text runs: 20ch on the display legend, 68ch on the
asphalt facts.

The two posts are absolutely positioned inside the mount at 18% from each edge,
descending from 35% of the plate's height (behind it) to `post-drop` below it.
Their inset is a proportion, not a measurement: a real sign's posts sit under the
plate's mass, so they move with the plate instead of holding a fixed gap.

One breakpoint, at 640px. It no longer only tightens: it restacks the row and
quiets the hardware.

- The destination row stops competing for width and stacks into two template
  areas — `"place place"` over `"arrow when"`, at `auto minmax(0, 1fr)` with a
  10px column gap and a 4px row gap. The time sits left-aligned beneath its
  place, with the arrow pointing from one to the other. At the promoted time size
  a side-by-side row wrapped the place onto three lines and read as misaligned.
- The mounting hardware steps back: the posts narrow to a fixed 8px and the bolt
  pseudo-elements drop to 0.55 opacity. Desktop is unchanged. At small sizes the
  hardware competed with what has to be read; it is attenuated, not removed —
  it is still what holds the plate up.
- The posts move in to 12% from each edge so they stay under a narrower plate,
  the arrow is 24px, and the exit plate stretches full width with its content
  pushed apart.

The arrow survives on phone deliberately — it is one of the four marks the world
is recognised by, on the device most traffic arrives from.

### Named Rules
**The Unbroken Stripe Rule.** The lane stripe runs horizontally across the full
inline axis and scales its dash with viewport width
(`clamp(40px, 7vw, 86px)` paint, `clamp(92px, 15vw, 190px)` period). It never
wraps to a second line and never becomes a texture.

**The One Gutter Rule.** All page-level horizontal inset comes from the gutter
token. No section invents its own margin.

**The Mounted Plate Rule.** A plate in this world is never full-bleed and never
floated. It gets air on top and sides so its edges read, a sheet edge below, and
two posts that leave the plate and plant in the ground below it. If a surface
cannot show where it is held up, it is a band of colour and not a sign.

**The Post Drop Rule.** One token (`{spacing.post-drop}`) owns the whole junction
between sign and road: the posts' overshoot, the asphalt's top padding, and the
stripe's offset are all measured from it. The stripe always passes below the
footings; nothing painted on the road crosses a post.

## Elevation & Depth

Nothing in this system is lifted and nothing casts. Depth is material and
tonal: the plate is a physical sheet held off the ground by posts, the fields
differ in colour, and the footer is one step lighter than the asphalt
(`{colors.asphalt-raised}`) to close the page without a divider.

The plate carries exactly one `box-shadow` declaration, in three layers, and not
one of them is elevation. Two are the enamel border — stacked inset rings that
reproduce the white line a real destination plate carries inside its edge. The
third is the plate's own bottom edge: a 3px band of dark galvanized directly
below the sheet, zero blur and zero spread, which is thickness rather than lift.
It is the cut edge of the metal, in the same material the posts are made of.

The plate's four mounting bolts and the posts' footing plates are the other
material details. The bolts are 14px flat discs in hardware ink
(`{colors.ink-hardware}`) inset 30px from the corners, drawn as pseudo-element
backgrounds; under 640px they drop to 0.55 opacity. The footings
are 6px-tall bars in dark galvanized, 320% of the post's width, centred where the
post meets the ground. All of it is hardware, not highlight — no gloss, no
gradient ramp, no ring.

### Shadow Vocabulary
- **Enamel border** (`inset 0 0 0 3px {colors.sign-white}, inset 0 0 0 12px
  {colors.sign-green}`): The white line inside a real plate's edge. On every green
  plate, always.
- **Sheet edge** (`0 3px 0 0 {colors.galvanized-dark}`): The thickness of the
  metal below a mounted plate. Bottom axis only, no blur, no spread, mount
  material colour. Only on a plate that is actually mounted.

### Named Rules
**The Nothing Faked Rule.** No chrome, no gloss, no metal *sheen*, no bevel
imitating relief, no cast or ambient shadow, no photograph, no stock image. The
permitted materials are exactly the four the world names plus their fastening:
flat enamel with its inset border, galvanized steel (post, footing, sheet edge),
painted stripe, and the bolt heads. A gradient is permitted solely as a drawing
primitive for a flat shape — the bolt discs, the stripe dashes, and the post's
two tones at hard stops — never as a lighting effect or a smooth highlight ramp.

**The Sheet Edge Rule.** A plate's thickness is drawn as a 3px zero-blur,
zero-spread band on the bottom axis only, in the mount's own material
(`{colors.galvanized-dark}`). Add a blur radius, a second axis, a black, or a
spread and it stops being an edge and becomes the drop shadow this world does not
have. It belongs only to a plate that visibly has posts.

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

The mount adds two more pieces of geometry, both rectangles: the post, a
`clamp(10px, 1.1vw, 16px)`-wide vertical bar (a flat 8px under 640px) whose round section is implied by
three hard-stopped colour bands across its width (dark 0–22%, lit 22–58%, dark
58–100%) rather than by a curve or a highlight; and its footing, a 6px bar at
320% of the post's width. Nothing in the mount is rounded and nothing is clipped.

Lines are a two-tier system: the 3px system rule (`--rule`) for the plate border,
the language plate's stroke, the focus outline, and the authored arrow's stroke
weight; and a 1px hairline in hairline ink (`{colors.ink-hairline}`) for the
rules that bracket the destination column. Nothing in between.

### Named Rules
**The Zero Radius Rule.** Radius is 0 on every surface. If a shape needs an
identity, cut it with `clip-path` from the signage vocabulary — never round it.

**The Round-By-Banding Rule.** Curvature is implied by flat bands at hard stops,
never by a smooth ramp. The post reads as a cylinder because it has a lit face
between two turning edges — three stops, no interpolation visible. The moment the
stops soften, it is a gloss effect.

**The Shared Rule Weight Rule.** The 3px rule token is one value doing five
jobs: plate border, button stroke, focus ring, arrow stroke, sheet edge. Drawn marks and
drawn borders are the same thickness, which is what makes the arrow read as part
of the sign rather than as an icon pasted on it.

## Components

### Buttons
- **Shape:** Square (0 radius), with the exit plate beveled 18px on its trailing
  edge via `clip-path`.
- **Primary (the exit plate):** Warning yellow field, asphalt ink, minimum height
  72px, padding `14px clamp(20px, 3vw, 32px)`, bottom-right of the plate. It
  carries two children in reading order: the action text (Headline role, `nowrap`)
  and the authored arrow. It has no legend above the action: an action plate says
  what happens on tap and nothing else. It is a plain anchor to WhatsApp and works
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
  stroke, no fill, 44px minimum height, 14px inline padding, the Code role
  (15px/800 at 0.06em), uppercase locale code. Hover inverts it: white fill, deep
  green text. It carries both `lang` and `hrefLang`, so the label is pronounced
  in its own language.
- **Route shield:** The brand lock-up in the head-left position a route number
  occupies on a real sign — the clipped white shield containing the two-letter
  mark in deep green (15px/800 at 0.04em, the Code step's size at tighter
  tracking), followed by the brand name in the Brand role.
  Hovering the lock-up turns the shield yellow with asphalt ink; this is the one
  place yellow appears as a transient state rather than as the action.

### Sign Mount (signature component)
The structure that turns the plate into an object. It is not decoration and it is
not optional on a plate surface: a destination sign that cannot be seen to be held
up reads as a coloured band.
- **Wrapper:** `position: relative`, `z-index: 1`, flex, padding
  `{spacing.mount-air} {spacing.gutter} 0`. The z-index is load-bearing: the posts
  overshoot the wrapper and the asphalt section paints after it.
- **Posts:** Two `aria-hidden` bars, `clamp(10px, 1.1vw, 16px)` wide (a flat 8px
  under 640px), at 18% from each edge (12% under 640px), running from 35% of the plate's height to
  `{spacing.post-drop}` below it, so they emerge from behind the plate and enter
  the road. The section is three hard colour stops across the width — dark / lit /
  dark — in the galvanized pair.
- **Footings:** A `::after` on each post, 6px tall and 320% of the post's width,
  centred at the bottom in dark galvanized. Without it a post looks cut off
  instead of planted.
- **Sheet edge:** The plate's third box-shadow layer, 3px of dark galvanized below
  the bottom edge. See Elevation & Depth.
- **Paint order:** `.sign-plate > *` carries `position: relative; z-index: 1`,
  because the bolt pseudo-element is the plate's last child and would otherwise
  paint over the exit plate.

### Destination Row (signature component)
The structural unit of the page, not a decorative list. Each row states a place
and how long it is away, because the distance that matters to someone with a
stopped car is time.
- **Grid:** place / arrow / time, baseline-aligned, `gap: clamp(12px, 2vw, 24px)`,
  `padding-block: clamp(16px, 2.4vh, 26px)`. Under 640px it stacks: place on its
  own line, arrow and time beneath it, time left-aligned.
- **Rules:** 1px hairline ink on top of each row, plus a bottom rule on the last,
  so the set reads as a bracketed column; rows are separated by a 2px grid gap.
- **Type:** place in the Place role (600), time in the Title role (800 uppercase)
  at nearly twice the place's size, right-aligned on the plate and left-aligned
  on a phone. The eye lands on the time first and reads the phrase afterwards;
  this ranking is the row's whole purpose, not a styling preference.
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
`clamp(24px, 5vw, 64px)` between them. Terms are the Label role (12px/800 uppercase at
0.2em tracking) in dim asphalt ink — the role's only remaining instance; values are the Contact Value role
(`clamp(17px, 2vw, 21px)`/600) in asphalt ink. Links
keep their underline at 2px thickness with a 5px offset, and on hover the text
goes stripe-white while the underline turns warning yellow.

### Preview Card
The share image (1200×630) is a **single frame of the plate**, not the page: full
bleed green with a 6px white border scaled for the raster, the route shield, the
legend, two destination rows, and the exit legend. It deliberately has no mount —
posts and sheet edge belong to a page that stands on a road, and there is no road
in a 1200×630 frame. Its px type values are **the previous ramp's** upper
bounds baked at one fixed width (legend 72, place 28, time 30, and a 15px
wide-tracked `SALIDA` legend above the action). The page's hierarchy change did
not reach the raster, so the card still shows the inverted weighting the plate
abandoned and still carries the exit legend the plate deleted. These are
build-carried divergences, not ramp steps and not system rules: a new surface
takes its sizes from the ramp above, never from this file. The rasterizer does not apply
`clip-path` to a container with children, so the exit plate ships unbeveled there;
the silhouette lives on the page.

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
- **Do** mount any plate that occupies a page: air on top and sides, the 3px
  galvanized sheet edge below it, and two posts that plant in the asphalt ground.
- **Do** measure the whole sign-to-road junction from the post-drop token
  (`clamp(52px, 7vh, 92px)`) — post overshoot, asphalt top padding, stripe offset
  — so the stripe runs below the footings and never across a post.
- **Do** draw implied roundness as flat bands at hard stops, the way the post's
  three-stop section does.
- **Do** spend warning yellow (`{colors.sign-yellow}`) on exactly one element per
  page: the primary action.
- **Do** express distance as time in the destination rows ("HOY", "HOY O
  MAÑANA"), uppercase, 800 weight, right-aligned on the plate and left-aligned
  under its place on a phone.
- **Do** set the time larger than the place it answers for
  (`clamp(24px, 3.6vw, 46px)` against `clamp(17px, 2.2vw, 26px)`), and give the
  row air to match (`padding-block: clamp(16px, 2.4vh, 26px)`). Authority is
  bought with size *and* space.
- **Do** keep the legend at greeting scale (`clamp(30px, 4.2vw, 54px)`,
  `max-width: 20ch`). A headline that takes the page's whole visual weight
  crowds out the only argument the page has.
- **Do** let a one-line action string scale with the viewport
  (`clamp(15px, 4.6vw, 26px)` with `white-space: nowrap`) instead of wrapping or
  overflowing at 320px.
- **Do** attenuate the mounting hardware on phone (8px posts, bolts at 0.55) so
  it stays present without competing with the information.
- **Do** set display and body copy in mixed case; keep uppercase for the time
  values and the contact terms, with tracking opened to 0.2em at 12px.
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
- **Don't** fake material: no chrome, no gloss, no metal sheen or highlight ramp,
  no bevel imitating relief, no drop shadow, no cast or ambient elevation of any
  kind. A gradient may only band a flat shape (the post's three stops, the bolt
  discs, the stripe dashes); it may never light one.
- **Don't** round a corner. There is no radius in this system.
- **Don't** use an icon library, an icon font, or a text-glyph arrow.
- **Don't** introduce a second type family, an italic, or a weight outside
  400 / 600 / 800; and don't load type at runtime — it is self-hosted at build.
- **Don't** set the display legend in all caps, and don't uppercase anything
  longer than a short legend.
- **Don't** let the lane stripe wrap to a second line or turn into a repeating
  texture or a diagonal hatch.
- **Don't** float a panel, card, or tinted box inside a field. The plate is the
  one inset piece and it is not floating: it is mounted, with posts reaching the
  ground and a sheet edge showing its thickness. An inset rectangle with neither
  is a card, and this world has none.
- **Don't** let a plate run full-bleed to the top and sides of the viewport. Its
  edges are what make it an object.
- **Don't** turn the sheet edge into a shadow: no blur radius, no horizontal
  offset, no spread, no black, and never on anything that isn't a mounted plate.
- **Don't** give the posts a gloss, a smooth gradient ramp, a highlight streak, or
  a rounded cap. Galvanized steel in this world is two flat tones meeting at a
  hard stop.
- **Don't** state a distance, time, price, figure, address, or hour that the
  business cannot hold. A destination row that promises an unsupported time
  breaks the column's grammar, not just its copy.
- **Don't** add a second button. A surface in this world has one action.
- **Don't** put a wide-tracked legend, kicker, or eyebrow above an action or a
  heading. The exit plate's `SALIDA` legend was deleted for exactly this reason:
  it served the metaphor instead of telling the visitor what happens on tap, and
  it cost the line the action needed.
- **Don't** let the legend outweigh the destination rows again. If a headline
  change pushes the time below the place's size, the hierarchy has inverted and
  the page has lost its argument.
- **Don't** keep a destination row side-by-side on a narrow screen once its time
  is at full size. Stack it — place above, arrow and time below — rather than
  letting the place wrap to three lines.
