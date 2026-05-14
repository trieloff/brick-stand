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
// FDM prototype hollow: subtract a same-shape wedge inset by WALL_T from
// every surface.  Saves ~80% of filament.  In preview the cavity renders
// as a separate translucent child so its extent is visible without paying
// for the boolean.  In features/finished it's a real subtract (CLI/OCCT).
const Hollow = Param.bool("Hollow", true);

const w = g.FOOTPRINT_WIDTH;
const d = g.FOOTPRINT_DEPTH;
const r = g.PERIMETER_CORNER_RADIUS_MM;
const ceilingZ = g.TOP_Z_CEILING_MM;
const WALL_T = 3.0;

// ---------- 1. Outer wedge as a planar-trimmed prism. ----------
// Rounded-rect prism, then trim by the tilted top plane z = a*x + b*y.
let body = roundedRect(w, d, r)
  .extrude(ceilingZ)
  .translate(w / 2, d / 2, 0);

const a = g.PLANE_A_LEFT;
const b = g.PLANE_B;
const kbN = g.KB_PLANE_NORMAL_UP;
body = body.trimByPlane([a, b, -1], 0);

// Inner cavity wedge: same construction inset by WALL_T on every face.
// Width and depth shrink by 2*WALL_T; corner radius shrinks by WALL_T.
// Base raised by WALL_T.  Top trimmed by the same tilted plane but offset
// down along its normal by WALL_T.  trimByPlane's offset argument is along
// the supplied (unnormalized) normal vector, so we scale by |normal| to
// get a wall thickness of WALL_T perpendicular to the keyboard surface.
const planeNormalLen = Math.hypot(a, b, 1);
function buildCavity() {
  const innerW = w - 2 * WALL_T;
  const innerD = d - 2 * WALL_T;
  const innerR = Math.max(r - WALL_T, 0.5);
  let cav = roundedRect(innerW, innerD, innerR)
    .extrude(ceilingZ)
    .translate(w / 2, d / 2, WALL_T);
  cav = cav.trimByPlane([a, b, -1], WALL_T * planeNormalLen);
  return cav;
}
const cavity = Hollow ? buildCavity() : null;

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

// Preview: instead of subtracting the pocket cylinders (which is the kernel
// killer), render the magnets themselves at their final position — top face
// flush with the keyboard plane, body extending MAGNET_THICKNESS into the
// brick.  Visually equivalent to seeing the pockets, much cheaper.
const previewMagnets = [];
if (Detail === "preview") {
  const magnetRadius = g.MAGNET_DIAMETER_MM / 2;
  const magnetThickness = g.MAGNET_THICKNESS_MM;
  for (const [mx, my] of g.magnetWorldCenters()) {
    const mz = g.plane(Side, mx, my);
    // Place the magnet cylinder so its top is on the tilted plane and its
    // body sits inside the brick (axis = keyboard normal).
    const baseX = mx - kbN[0] * magnetThickness;
    const baseY = my - kbN[1] * magnetThickness;
    const baseZ = mz - kbN[2] * magnetThickness;
    const magnet = cylinder(magnetThickness, magnetRadius)
      .pointAlong(kbN)
      .translate(baseX, baseY, baseZ);
    previewMagnets.push(magnet);
  }
}

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

// Hollow out the interior — real boolean, only in features/finished.
if (Hollow && cavity) {
  body = body.subtract(cavity);
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
const magnetColor = "#d4a857"; // brass-ish, reads clearly against steel body
const cavityColor = "#2a2f36"; // dark — reads as void inside the body
let result;
if (Detail === "preview") {
  // group() preserves identities/colors without a boolean — fast in WASM.
  // When hollow, render the body translucent so the cavity child shows
  // through.  When solid, render opaque.
  const bodyShape = (Hollow && cavity)
    ? body.color(bodyColor).material({ opacity: 0.35 })
    : body.color(bodyColor);
  const children = [
    { name: "body", shape: bodyShape },
    ...previewPegs.map((p, i) => ({ name: `peg-${i}`, shape: p.color(pegColor) })),
    ...previewMagnets.map((m, i) => ({ name: `magnet-${i}`, shape: m.color(magnetColor) })),
  ];
  if (Hollow && cavity) {
    children.push({ name: "cavity", shape: cavity.color(cavityColor) });
  }
  result = group(...children);
} else {
  result = body.color(bodyColor);
}

if (Side === "right") {
  result = result.mirrorThrough([w / 2, d / 2, 0], [1, 0, 0]);
}

return result;
