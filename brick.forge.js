// brick.forge.js — The Brick geometry, one half (solid-steel production).
//
// This script renders a single Brick at the canonical local pose.  Other
// scripts (main.forge.js) call it via `require("./brick.forge.js", { Side })`
// and pick up the returned Shape.
//
// Parameters:
//   Side — "left" | "right"
//
// NOTE: this script must run on the OCCT backend.  The default Truck/Manifold
// kernel collapses the trimByPlane + boolean chain.  Invoke via
// `forgecad run --backend occt`.

const g = require("./geometry.js");

const Side = Param.choice("Side", "left", ["left", "right"]);

const w = g.FOOTPRINT_WIDTH;
const d = g.FOOTPRINT_DEPTH;
const r = g.PERIMETER_CORNER_RADIUS_MM;
const ceilingZ = g.TOP_Z_CEILING_MM;

// ---------- 1. Outer wedge as a planar-trimmed prism. ----------
// Rounded-rect prism, then trim by the tilted top plane z = a*x + b*y.
let body = roundedRect(w, d, r)
  .extrude(ceilingZ)
  .translate(w / 2, d / 2, 0);

const a = g.PLANE_A_LEFT;
const b = g.PLANE_B;
// Top mating plane: z = a*x + b*y. trimByPlane keeps the positive side of the
// plane (where n · p > 0).  With normal (a, b, -1) and offset 0 we keep the
// half-space a*x + b*y - z > 0, i.e. z < a*x + b*y — the wedge BELOW the
// keyboard plane.
body = body.trimByPlane([a, b, -1], 0);

// ---------- 2. Mount features (pegs up, magnet pockets down). ----------
//
// The pegs and magnet pockets must be perpendicular to the keyboard bottom
// plane, not perpendicular to the desk.  Build them along +Z in a local
// frame, then reorient with pointAlong() so their axis lies along the
// keyboard-plane normal (which points up out of the brick).
//
// Strategy per feature:
//   1. Build cylinder along +Z, base at Z = 0 (ForgeCAD primitive convention).
//   2. pointAlong(KB_PLANE_NORMAL_UP) reorients it about the origin so its
//      axis is along the keyboard normal.
//   3. Translate it to the world point on the tilted top face at (x, y).
//      The base of the peg / top of the pocket sits exactly on the plane.

const kbN = g.KB_PLANE_NORMAL_UP; // unit vector, points up out of brick

const pegRadius = g.PEG_DIAMETER_MM / 2;
const pegHeight = g.PEG_HEIGHT_MM;
const pocketRadius = g.MAGNET_POCKET_DIAMETER_MM / 2;
const pocketDepth = g.MAGNET_POCKET_DEPTH_MM;

// Build pegs: cylinder grows in +kbN direction, base on the tilted plane.
for (const [px, py] of g.pegWorldCenters()) {
  const pz = g.plane(Side, px, py);
  const peg = cylinder(pegHeight, pegRadius)
    .pointAlong(kbN)
    .translate(px, py, pz);
  // .add() instead of union() — the trimmed body needs the method form so the
  // result keeps the wedge instead of collapsing to the tool operand.
  body = body.add(peg);
}

// Magnet pockets: cylinder grows in +kbN direction, but we want the TOP of
// the pocket flush with the tilted top face and the cavity extending DOWN
// into the body.  Build a cylinder of length `pocketDepth + slop` along +kbN,
// then translate it so its top end sits a hair ABOVE the plane (open cut)
// and its bottom end is `pocketDepth` below the plane.  Equivalently: place
// the base of the cylinder at `point - pocketDepth * kbN` and let it run
// upward through the top face for a clean subtract.
//
// We want a small overshoot above the plane (e.g. 0.2 mm) so the subtract
// reliably opens the pocket on the slanted surface.
const POCKET_OVERSHOOT = 0.3;
const pocketCutLen = pocketDepth + POCKET_OVERSHOOT;

for (const [mx, my] of g.magnetWorldCenters()) {
  const mz = g.plane(Side, mx, my);
  // Base of the cutting cylinder, in world coords: shift `pocketDepth` along
  // -kbN from the point on the plane.
  const baseX = mx - kbN[0] * pocketDepth;
  const baseY = my - kbN[1] * pocketDepth;
  const baseZ = mz - kbN[2] * pocketDepth;
  const pocket = cylinder(pocketCutLen, pocketRadius)
    .pointAlong(kbN)
    .translate(baseX, baseY, baseZ);
  body = body.subtract(pocket);
}

// ---------- 3. Bumper-foot pockets on the bottom. ----------
{
  const footR = g.FOOT_POCKET_DIAMETER_MM / 2;
  const footDepth = g.FOOT_POCKET_DEPTH_MM;
  const inset = g.FOOT_PATTERN_INSET_MM;
  const footPositions = [
    [inset, inset],
    [w - inset, inset],
    [inset, d - inset],
    [w - inset, d - inset],
  ];
  for (const [fx, fy] of footPositions) {
    const foot = cylinder(footDepth + 0.2, footR)
      .translate(fx, fy, -0.1);
    body = body.subtract(foot);
  }
}

// ---------- 4. Top-edge break (chamfer around the slanted top face). ----
// Done last, after pegs and pockets.  Wrap in try/catch — on a complex BRep
// this can fail; accept a sharp edge rather than fail the build.
try {
  const raw = selectEdges(body, {
    convex: true,
    perpendicular: [0, 0, 1],
    angleTolerance: 25,
    minLength: 0.5,
  }).filter(e => e.midpoint && e.midpoint[2] > 1.0);
  const merged = coalesceEdges(raw);
  if (merged.length > 0 && merged.length < 80) {
    body = chamfer(body, g.TOP_CHAMFER_MM_PRODUCTION, merged);
  }
} catch (err) {
  void err;
}

// ---------- 5. Mirror for right-hand side. ----------
if (Side === "right") {
  body = body.mirrorThrough([w / 2, d / 2, 0], [1, 0, 0]);
}

return body.color("#8b94a3");
