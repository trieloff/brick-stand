# Master Prompt — Modeling Pass

```text
You are producing a ForgeCAD build-ready physical artifact package, not a concept sketch.

Treat this as a serious product-team prototype assignment.
The goal is to produce a credible internal engineering package for a real build candidate, not a generic maker example.

Target artifact:
- artifact: monolithic tenting base ("The Brick") for the ZSA Voyager split keyboard, one part per half (mirrored).
- request summary: design a fixed-angle tenting stand that holds the user's measured posture and is honestly producible both as a hollowed FDM print and as a single-piece stainless steel block.
- normalized interpretation: a rigid wedge with a planar upper mating face (Voyager interface) and a planar lower base face (desk interface). No moving parts. Magnet + guide-pin attachment replaces the stock Voyager legs.

Specific operating story:
- organization / team: personal product-design project by the designer (no invented employer).
- project / prototype revision: "Brick v0.1" — first geometry pass for fit validation.
- milestone / review moment: working FDM print at the designer's desk, validated against the in-use Voyager; then sourcing quote for single-piece stainless production.
- domain context: ergonomic keyboard accessories / custom desk hardware.
- production reason: replace stock Voyager magnetic legs with a substantial, monolithic base at a specific measured posture.
- test setting: designer's desk, real Voyager keyboard, real typing session.
- generic-output failure mode to avoid: a printable hobby wedge with hollow ribs that visibly screams "FDM" — must look credible cast or machined in steel.
- benchmark class / public comparison anchor: ZSA's official Voyager printables for the interface pattern; "Brick"-class desk hardware aesthetic (single milled block, chamfered edges, generous radii).

Chosen intake classification:
- artifact family: fixture / personal product, monolithic mating-and-supporting part (no mechanism).
- duty level: general-duty.
- scale level: compact (≤ 138 × 137 mm per half).
- cost posture: balanced for prototype, performance-first for production.
- job style: single-piece replacement for the stock Voyager legs.
- manufacturing / process stack: prototype = FDM (PETG preferred, 3–4 mm shell, 15–25 % infill); production = single-piece 304/316 stainless steel via 3-axis CNC from billet, or investment cast + finish-machined on the mating face, magnet pockets, pin holes, and bottom.
- budget posture: prototype cheap, production "as-good-as-it-deserves".

Working assumptions chosen to close missing inputs:
- these assumptions are provisional and family-scoped; they apply to monolithic fixtures / personal product, not as universal defaults.
- Posture is fixed at the designer's measured corner heights: (front-outer, rear-outer, front-inner, rear-inner) = (0, 17, 79, 96) mm on a 138 × 137 mm footprint. Tent ≈ 29.8°, tilt ≈ 7.1° rear-raised.
- Attachment: 5 × Ø10×3 mm N42 magnets press-fit into pockets on the mating face, 4 × Ø3×6 mm hardened dowel pins press-fit (production) or printed integral (prototype). Pattern positions extracted from `reference/bottom_plate_left.STL` — to be verified during implementation.
- Feet: four Ø10×2 mm bottom pockets for 3M Bumpon SJ5012 urethane bumpers.
- External geometry is identical between prototype and production; only the *internal* hollowing differs (prototype = offset shell, production = solid or with optional bottom recess).

Hard constraints:
- use ForgeCAD.
- no `assembly()` for a moving mechanism is required — there is no mechanism. Use `assembly()` only to compose the brick + Voyager mockup for inspection.
- the brick is one solid body; do not split it into multiple parts that would have to be joined.
- choose manufacturing/processes that fit a single-piece stainless production part: no undercuts unreachable by a 3-axis mill from top + bottom, no internal voids that an investment-cast pattern could not realize, no thin protrusions < 3 mm wall.
- include realistic process-appropriate clearances on the magnet pockets and pin holes for both prototype (looser, accommodate FDM expansion) and production (H7 press-fit).
- include manufactured, printed, and purchased parts only where each is an honest choice.
- include a BOM that is concrete enough to buy and assemble from.
- do not hide uncertainty; choose defaults and continue.
- do not claim the designer works for a named company.
- do not clone proprietary named products; mark's tripod mount is a *pattern reference* for the magnet/pin interface, not a design to copy.

Acceptable final states:
1. `BUILD-READY` once the magnet/pin pattern is extracted and verified against the Voyager bottom-plate STL.
2. `BEST-EFFORT BUILD CANDIDATE` if the pattern extraction is approximate.

Required outputs:

0. Operating story and anti-generic bar — already stated above.
1. Problem normalization — already stated above.
2. Assumption bundle — already stated above.
3. Architecture choice
   - One monolithic wedge per half. Upper face = measured-posture plane. Lower face = desk plane (Z=0). Body = swept solid between them, clipped to a chamfered-and-radiused prismatic outline.
   - Rejected: adjustable hinge mechanism (no need, posture is fixed); two-part stacked wedges (defeats the "brick" identity and adds an interface that wants to wobble); minimal three-point post stand (no mass, fails the "feels like a brick" criterion).
4. Detailed mechanical design
   - Footprint outline: chamfered rectangle inscribed in the Voyager projection. Corner radii 6 mm. External top edges chamfered 2 mm × 45° on production, fillet 1.5 mm on prototype (FDM aesthetic).
   - Mating face: defined by the four measured corner heights. Pattern of 5 magnet pockets and 4 pin features mirrors the Voyager bottom-plate sockets.
   - Base face: flat, parallel to desk, with four feet pockets at the corners and (production only) an optional bottom recess.
   - No motion ranges, no joints, no stops.
5. Actuation and transmission — not applicable. The brick is static.
6. Manufacturing package
   - Prototype: FDM, brick lying mating-face-up so the magnet pockets print with clean ceilings via bridging, the base face prints flat against the bed for dimensional accuracy. Single-shell vase-mode-style 3 mm wall thickness, 15 % gyroid infill in a top zone for stiffness. Pin features printed integral, no support required if oriented correctly. Print sensitivities: bottom flatness (first-layer squish), magnet pocket diameter (FDM tends to over-shrink small features — add 0.2 mm radial allowance).
   - Production: 3-axis CNC from a 304 or 316 stainless billet. Two setups: top-down for the angled mating face, magnet pockets, pin reaming, and side chamfers; bottom-up for the base recess and feet pockets. Investment casting alternative: cast near-net, finish-machine the mating face flat-and-true, ream pin holes, drill/bore magnet pockets, surface-grind base flat.
7. Bill of materials — see `docs/brief.md` BOM table. Reproduce inline in the implementation output.
8. Assembly package
   - Production: press magnets into pockets (light tap with arbor press, witness mark on polarity); press dowel pins; peel-and-stick urethane feet onto bottom pockets.
   - Prototype: same, except pins are printed integral so only magnets and feet are pressed/stuck.
9. Validation package
   - Verify mating face places the four Voyager corners at 0/17/79/96 mm ± 0.5 mm.
   - Render-inspect with the Voyager mockup mounted: no collision with USB-C cable strain relief, no collision with the per-half cable boss.
   - Tip-over check: center of mass projected onto base must lie ≥ 5 mm inside the base outline in all directions.
   - Wall thickness: ≥ 3 mm prototype shell, ≥ 5 mm production minimum cross-section.
   - Compare both rendered halves to ensure mirror correctness.
10. ForgeCAD implementation package
    File structure:
    - `main.forge.js` — runnable entry point. Params: `Side` (left/right), `Process` (FDM-prototype / steel-production), `ShowVoyagerMockup` (boolean), `ShowPair` (boolean, debug). Returns either one brick, one brick + mockup, or both bricks side-by-side.
    - `brick.forge.js` — `function brick({ side, process })` returning the solid.
    - `voyager_mockup.forge.js` — `function voyagerMockup({ side })` returning a thin proxy plate at the measured posture.
    - `geometry.js` — pure constants: `CORNER_HEIGHTS_MM`, `FOOTPRINT_MM`, `MAGNET_PATTERN`, `PIN_PATTERN`, `MATING_PLANE_NORMAL`, mirror helper.
    Use `bom()` to declare magnets, pins, feet, and the body. Export STL for prototype, STEP for production.
11. Final verdict
    - `BEST-EFFORT BUILD CANDIDATE` until the magnet/pin pattern is extracted from the Voyager STL with verified positions.

ForgeCAD-specific quality bar:
- The brick is static; no joints required.
- Use `assembly()` only to compose brick + Voyager mockup for inspection — clearance logic must be physically honest there.
- A pretty rendered wedge is not success. Success = collision-clean inspection bundle against the Voyager mockup, all four corner heights verified, and a BOM that someone could quote against today.
```
