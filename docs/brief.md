# Build Brief — The Brick

A monolithic tenting stand for the ZSA Voyager split keyboard, code-named **The Brick**. Prototyped in FDM print, intended for production as a single-piece stainless steel block (machined billet or investment cast + finish-machined).

## Operating story

Personal product-design project by the designer, Lars Trieloff. The Brick replaces the Voyager's stock magnetic legs with a substantial, monolithic base that holds the keyboard at the designer's measured-from-life typing posture. The prototype is FDM-printed in PLA/PETG for fit validation; the production target is a single-piece stainless-steel base per half — heavy, monolithic, finished. The name is literal: it should look and feel like a brick of metal, not a printed gadget.

**Anti-generic bar:** This is *not* a printable hobby wedge. The brick exists because the designer wants a piece of bench-grade desk hardware: it should feel inevitable, machine-honest, and look as good cast in steel as it does printed in plastic.

## Artifact classification

- **Family:** fixture / personal product, monolithic mating-and-supporting part. Not a mechanism — no moving parts, no assembly.
- **Manufacturing posture (prototype):** FDM print, PETG preferred (PLA acceptable), hollowed with infill.
- **Manufacturing posture (production):** single-piece stainless steel — 3-axis CNC from billet, or investment cast + finish-machined on critical mating surfaces. The geometry must be honestly producible in both processes.
- **Duty:** general-duty (desk use, occasional removal, must survive being dropped on tile from desk height when steel).
- **Scale:** compact (one per keyboard half, fits within keyboard footprint).
- **Cost posture (prototype):** balanced. **Cost posture (production):** performance-first (the brick *is* the cost statement).

## Posture (measured from the designer's current setup)

Left half, three corners measured against desktop:

| Corner | Z above desk |
|---|---|
| Front-left (outer / pinky) | **0 mm** (touching desk) |
| Rear-left (USB-port side) | **17 mm** |
| Front-right (inner / thumb) | **79 mm** |
| Rear-right (derived from plane) | **~96 mm** |

Right half is mirrored.

Derived plane:

- **Tent angle (rotation about front-rear axis):** atan(79 / 138) ≈ **29.8°**, outer-pinky-low, inner-thumb-high.
- **Tilt angle (rotation about left-right axis):** atan(17 / 137) ≈ **7.1°**, rear-raised (typewriter / positive tilt).
- Combined plane normal: `(10823, 2346, -18906)` (unnormalized) in keyboard-local frame.

These angles are **fixed** in the design — no adjustment mechanism. The brick *is* the angle.

## Attachment interface — official ZSA tripod-mount pattern

The brick replicates the interface of ZSA's own tripod-mount plate (which the designer owns and measured). Centered at **(63.10, 81.90)** in the left-half frame. See `docs/geometry-facts.md` for verified positions.

- **4 registration pegs**, Ø 2.15 mm × 1.5 mm tall, at the corners of a **33.26 × 33.26 mm square**. Slip-fit into the four small receptacles in the Voyager bottom plate (verified at z=0.11 in the reference STL).
  - Prototype: pegs printed integral to the brick body.
  - Production: pegs machined integral to the stainless body (or, alternatively, press-fit dowel pins into reamed holes if 3-axis CNC can't reach such fine integral features cleanly; pin choice deferred to manufacturing review).
- **4 magnets**, Ø 5 mm × 2 mm N42 neodymium, in a diamond pattern at **r = 9 mm from zone center**, at the four cardinal directions. Magnet midpoint-to-midpoint between opposing magnets = 18 mm. Pockets are Ø 5.1 mm × 2.1 mm deep, in the top mating face. Magnets pull against the corresponding magnets / steel pucks ZSA placed in the keyboard at matching positions.
- **No central feature engaged.** The keyboard has a ~Ø 3.8 mm tripod-screw recess at the zone center; the brick does not engage this.

The four corner pegs handle XY registration and anti-rotation. The four diamond magnets handle Z retention. No additional alignment features are needed.

## Geometry constraints

- **Footprint envelope:** matches the full Voyager half's vertical projection — 138 × 137 mm. The brick fills the entire shadow under the keyboard. This is intentional: the keyboard sits flush on the brick along its whole base, the brick reads as a chunky block of metal, and the "brick" identity is preserved.
- **Top face:** a single tilted plane at the measured posture, matching the keyboard's bottom plane exactly. Surface continuous edge-to-edge (no raised mating pad — the keyboard rests on the entire top face, with the attachment features sunk into a centered 38 × 38 mm zone).
- **Mating zone** (centered at (63.10, 81.90) in keyboard coords): 4 pegs at the 33.26 × 33.26 mm square corners stick up 1.5 mm from the top face; 4 magnet pockets (Ø 5.1 × 2.1) recessed into the top face in the diamond pattern.
- **Base face:** parallel to the desktop (Z = 0 plane), full flat contact across the whole footprint.
- **Body:** swept/filled volume between top plane and base, with the visual language of a solid milled block — chamfered top edges (2 mm × 45° for steel, 1.5 mm fillet for FDM), perimeter corner radii 6 mm, no visible draft, no decorative ribs. Corner heights: front-pinky 0 mm, rear-pinky 17 mm, front-thumb 79 mm, rear-thumb ~96 mm.
- **Prototype-only:** internal hollowing for FDM printability — target ~3 mm shell wall. External geometry must remain identical to production.
- **Production:** solid stainless steel. Optional machined recess on the bottom (5 mm deep, 5 mm perimeter wall) for mass and 4-point desk contact.

## Feet / desk interface

- Four counter-bored pockets (Ø 10 mm × 2 mm deep) on the bottom face at the four base corners, sized for **3M Bumpon SJ5012** or similar urethane bumper feet. Same pattern for both prototype and production.

## Variant policy

- Single ForgeCAD project produces both halves via a `Side` parameter (`"left"` / `"right"`). Right is a mirror of left about the X axis.
- A `Process` parameter selects `"FDM-prototype"` (hollowed) vs `"steel-production"` (solid with optional bottom recess). Both share the same external geometry.
- Default render: one selected variant at a time. A `Show pair` debug mode renders both halves side-by-side for posture inspection, but collision/manufacturing inspection always runs on one selected variant.

## File organization

Multi-file ForgeCAD project:

- `main.forge.js` — entry point. Top-level `assembly()` selects variant via params, places either one or both halves, renders.
- `brick.forge.js` — the brick geometry itself, parameterized by `Side` and `Process`.
- `voyager_mockup.forge.js` — a low-detail proxy of the Voyager bottom plate (extracted bounding box + corner pin/magnet pattern) used only for collision and posture inspection. Not part of the final BOM.
- `geometry.js` — pure helpers and constants (measured corner heights, magnet pattern, derived plane normal). Plain `.js`, no rendered geometry.

## BOM (production part — one half)

| Item | Spec | Qty | Notes |
|---|---|---|---|
| Brick body | 316 or 304 stainless steel, single piece | 1 | CNC from billet OR investment cast + finish-machined on top mating face, peg posts, magnet pockets, bottom |
| Neodymium magnet | Ø 5 mm × 2 mm, N42, axially magnetized | 4 | Press-fit or epoxy into pockets; polarity to match the keyboard's internal magnets at the same positions |
| Urethane bumper foot | 3M Bumpon SJ5012 (black, Ø 10 × 2 mm) | 4 | Self-adhesive into bottom pockets |

(Prototype BOM: printed body with integral pegs, same magnets, same feet. The 4 corner pegs are integral to the body in both processes — no separate dowel pins.)

## Validation criteria

- Top face places the four Voyager corners at 0/17/79/~96 mm ± 0.5 mm against a flat desk.
- 4 corner pegs fall on the 33.26 × 33.26 mm square at (63.10, 81.90) ± 0.1 mm, slip-fit into the keyboard's peg receptacles.
- 4 magnet pockets at the cardinal r=9 mm positions ± 0.1 mm.
- No collision between brick top face and Voyager underside other than the intended flush contact.
- Center of mass over the base footprint with at least 10 mm safety margin in all directions when keyboard is mounted (tip-over check at 29.8° tent).
- Wall thickness ≥ 3 mm everywhere in the FDM prototype shell. Minimum cross-section ≥ 5 mm everywhere in the production solid.
- Magnet pockets: Ø 5.1 mm × 2.1 mm depth (press-fit). Peg shafts: Ø 2.15 mm × 1.5 mm tall.
- Bottom face flat to ± 0.2 mm prototype / ± 0.05 mm production.

## Final state target

**`BUILD-READY` for the prototype**, **`BEST-EFFORT BUILD CANDIDATE` for production** — the steel manufacturing review (CNC vs cast + finish, integral pegs vs press-fit dowels) needs a real shop quote before final lock.
