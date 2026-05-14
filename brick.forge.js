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
// "preview"  = wedge + the 4 pegs (additions only — no subtractive ops, so
//              the WASM kernel cascade stays short).  Studio-friendly.
// "features" = preview + magnet pockets + foot pockets.  The pocket
//              subtracts after a trimByPlane drag the browser kernel into
//              minutes; reach for this via CLI only.
// "finished" = features + top-edge fillet.  CLI + OCCT only.
const Detail = Param.choice("Detail", "preview", ["preview", "features", "finished"]);

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
const kbN = g.KB_PLANE_NORMAL_UP;
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

const pegRadius = g.PEG_DIAMETER_MM / 2;
const pegHeight = g.PEG_HEIGHT_MM;
const pocketRadius = g.MAGNET_POCKET_DIAMETER_MM / 2;
const pocketDepth = g.MAGNET_POCKET_DEPTH_MM;

// Build pegs: a short cylindrical shaft topped by a full hemisphere.  Total
// peg height stays at PEG_HEIGHT_MM (shaft + hemisphere = pegHeight).  The
// dome aids insertion into the keyboard receptacle and gives the part a
// machined-pin look instead of a sharp-edged stub.
//
// In "preview" mode we collect the pegs separately and group() them with the
// body at the end — no boolean, fast in the WASM kernel.  In features and
// finished modes we union via .add() so the part is a single solid (the
// honest representation for CNC).
const pegShaftHeight = Math.max(pegHeight - pegRadius, 0.05);
const previewPegs = [];
for (const [px, py] of g.pegWorldCenters()) {
  const pz = g.plane(Side, px, py);
  if (Detail === "preview") {
    // Preview: a single cylinder, no sphere cap.  Even the cylinder+sphere
    // union per peg pushed the WASM kernel into ~30s; a single primitive is
    // cheap and good enough to communicate peg position and orientation.
    const peg = cylinder(pegHeight, pegRadius)
      .pointAlong(kbN)
      .translate(px, py, pz);
    previewPegs.push(peg);
  } else {
    const shaft = cylinder(pegShaftHeight, pegRadius);
    const cap = sphere(pegRadius).translate(0, 0, pegShaftHeight);
    const peg = shaft.add(cap)
      .pointAlong(kbN)
      .translate(px, py, pz);
    body = body.add(peg);
  }
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

if (Detail !== "preview") {
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
} // end if Detail !== "preview"

// ---------- 4. Top-edge fillet (round the perimeter of the slanted top). --
// Skipped in "fast" mode — fillet on this BRep is ~30s in the WASM browser
// kernel and times out the studio.  OCCT (CLI) handles it in ~1s.
if (Detail === "finished") {
// Round the convex edges where the tilted top face meets the vertical
// perimeter sides.  These edges are adjacent to the top face whose outward
// normal is roughly (a, b, -1) normalized.  Try fillet first; if OCCT
// refuses on this BRep, fall back to chamfer; on total failure, leave the
// top sharp rather than break the build.
const topFaceNormal = kbN; // top-face outward normal points up out of brick
const topFilletRadius = 1.5;
let edgesRounded = false;
try {
  const raw = selectEdges(body, {
    convex: true,
    adjacentFaceNormal: topFaceNormal,
    angleTolerance: 30,
    minLength: 0.5,
  });
  const merged = coalesceEdges(raw);
  if (merged.length > 0 && merged.length < 200) {
    body = fillet(body, topFilletRadius, merged);
    edgesRounded = true;
  }
} catch (err) {
  void err;
}
if (!edgesRounded) {
  try {
    const raw = selectEdges(body, {
      convex: true,
      perpendicular: [0, 0, 1],
      angleTolerance: 30,
      minLength: 0.5,
    }).filter(e => e.midpoint && e.midpoint[2] > 1.0);
    const merged = coalesceEdges(raw);
    if (merged.length > 0 && merged.length < 200) {
      body = fillet(body, topFilletRadius, merged);
      edgesRounded = true;
    }
  } catch (err) {
    void err;
  }
}
if (!edgesRounded) {
  try {
    const raw = selectEdges(body, {
      convex: true,
      adjacentFaceNormal: topFaceNormal,
      angleTolerance: 30,
      minLength: 0.5,
    });
    const merged = coalesceEdges(raw);
    if (merged.length > 0 && merged.length < 200) {
      body = chamfer(body, g.TOP_CHAMFER_MM_PRODUCTION, merged);
    }
  } catch (err) {
    void err;
  }
}

} // end if Detail === "finished"

// ---------- 5. Compose & mirror. ----------
const bodyColor = "#8b94a3";
const pegColor = "#b8c0cc";
let result;
if (Detail === "preview") {
  // group() preserves identities/colors without a boolean — fast in WASM.
  result = group(
    { name: "body", shape: body.color(bodyColor) },
    ...previewPegs.map((p, i) => ({ name: `peg-${i}`, shape: p.color(pegColor) })),
  );
} else {
  result = body.color(bodyColor);
}

if (Side === "right") {
  result = result.mirrorThrough([w / 2, d / 2, 0], [1, 0, 0]);
}

return result;
