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

## Attachment interface

Same pattern as mark's tripod mount (`reference/ZSA Voyager Tripod Mount.stl`):

- **5 magnets** (10 mm Ø × 3 mm thick neodymium, N42) press-fit into pockets on the upper mating face. Pull the Voyager bottom plate down.
- **4 guide pins** for XY alignment. In the printed prototype, integral to the part (printed pins). In the stainless production part, press-fit dowel pins (e.g., 3 mm Ø × 6 mm hardened steel) into reamed holes.
- Mating face geometry matches the Voyager's bottom plate magnet/leg-socket pattern. Exact pocket positions to be extracted from `reference/bottom_plate_left.STL` / `bottom_plate_right.STL`.

## Geometry constraints

- **Footprint envelope:** stays within the Voyager half's vertical projection (≤ 138 × 137 mm). The brick should not be visibly wider than the keyboard.
- **Mating face:** a plane that, when the keyboard is set on it, places the four bottom-plate corners at the measured heights above the desk.
- **Base face:** parallel to the desktop (Z = 0 plane), full flat contact.
- **Body:** swept/filled volume between mating face and base face, with the visual language of a solid milled brick — chamfered top edges (e.g., 2 mm × 45°), generous corner radii on the perimeter (e.g., 6 mm), no visible draft, no decorative ribs.
- **Prototype-only:** internal hollowing for FDM printability (Vase-mode or 15–25 % infill achieved via a single offset shell ~3–4 mm thick). Hollowing must NOT change the external geometry — same brick from the outside.
- **Production:** solid stainless steel. Optional: machined recess on the bottom (e.g., 5 mm deep) leaving a ~5 mm wall around the perimeter, both to reduce mass slightly and to ensure 4-point contact on uneven desks.

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
| Brick body | 316 or 304 stainless steel, single piece | 1 | CNC from billet OR investment cast + finish-machined on mating face, magnet pockets, pin holes, and bottom |
| Neodymium magnet | 10 mm Ø × 3 mm, N42, axially magnetized | 5 | Press-fit or epoxy in pockets; polarity to match Voyager bottom-plate magnets |
| Dowel pin | DIN 6325 / ISO 8734, 3 mm Ø × 6 mm, hardened steel | 4 | Press-fit into H7 reamed holes |
| Urethane bumper foot | 3M Bumpon SJ5012 (black) | 4 | Self-adhesive into bottom pockets |

(Prototype BOM substitutes printed body + printed pins, same magnets, same feet.)

## Validation criteria

- Mating face places the four Voyager corners at 0/17/79/~96 mm ± 0.5 mm against a flat desk.
- No collision between brick body and Voyager underside, USB-C cable strain relief, or per-half cable when seated.
- Center of mass over the base footprint with at least 5 mm safety margin in all directions when keyboard is mounted (tip-over check at 29.8° tent).
- Wall thickness ≥ 3 mm everywhere in the FDM prototype shell. Minimum cross-section ≥ 5 mm everywhere in the production solid (handles cutter access).
- Magnet pockets: 10.1 mm Ø × 3.1 mm depth (press-fit). Pin holes: 3.0 mm Ø H7 production / 3.2 mm prototype.
- Bottom face flat to ± 0.2 mm prototype / ± 0.05 mm production.

## Final state target

**`BEST-EFFORT BUILD CANDIDATE`** — exact magnet and pin positions on the Voyager bottom plate must be extracted from the reference STL before the design can be called build-ready. Everything else (posture geometry, attachment philosophy, manufacturing path, BOM) is locked.
