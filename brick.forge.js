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
// every surface.  Saves ~80% of filament.  In features/finished it's a real
// subtract (CLI/OCCT); in preview the cavity is invisible by default —
// flip ShowCavity on to see its extent.
const Hollow = Param.bool("Hollow", true);
const ShowCavity = Param.bool("ShowCavity", false);
// Peg square edge length, in mm.  The designer measured ~35 mm against the
// physical ZSA tripod-mount plate.  Exposed as a slider so the brick can
// be visually aligned against the imported Voyager mockup.
// Measured exact spacing of the peg receptacles in the bottom-plate STL:
// (48.099, 66.911) / (78.099, 66.911) / (48.099, 96.911) / (78.099, 96.911)
// — 30.000 mm square centered on (63.099, 81.911).
const PegSpacing = Param.number("PegSpacing", 30.0, { min: 20, max: 50, step: 0.1, unit: "mm" });
// Reserve a 20 × 80 × 3 mm strip along the keyboard's index-finger edge for
// the ZSA Navigator (trackball) bar.  The bar sits flush underneath the
// keyboard along that edge — the brick must not occupy that volume.  In
// preview the bar is rendered as a separate orange visualization; in
// features/finished it's a real subtract.
const ReserveNavigator = Param.bool("ReserveNavigator", true);
// Bar's bottom-left corner in keyboard-local XY (front-pinky-corner origin).
// Defaults place it flush against the keyboard's inner edge (X ≈ 96.18 mm,
// outer face at 116.18 mm) and 20 mm forward of the rear edge.
const NavigatorX = Param.number("NavigatorX", 96.18, { min: 0, max: 138, step: 0.5, unit: "mm" });
const NavigatorY = Param.number("NavigatorY", 36.87, { min: 0, max: 137, step: 0.5, unit: "mm" });

const w = g.FOOTPRINT_WIDTH;
const d = g.FOOTPRINT_DEPTH;
const r = g.PERIMETER_CORNER_RADIUS_MM;
const ceilingZ = g.TOP_Z_CEILING_MM;
const WALL_T = 3.0;

// Local peg-world-center helper using the live PegSpacing param.
// Peg positions originate in the keyboard's local frame, then get projected
// onto the desk for the brick's world frame (so the peg lands where the
// keyboard's mating zone projects on the desk).
const pegHalf = PegSpacing / 2;
const [czX, czY] = g.MOUNT_ZONE_CENTER_LEFT;
const pegCentersKb = [
  [czX - pegHalf, czY - pegHalf],
  [czX + pegHalf, czY - pegHalf],
  [czX + pegHalf, czY + pegHalf],
  [czX - pegHalf, czY + pegHalf],
];
const pegCenters = pegCentersKb.map(([x, y]) => g.projectKbToDesk(x, y));
const magnetCentersKb = g.magnetWorldCenters(); // keyboard-local coords
const magnetCenters = magnetCentersKb.map(([x, y]) => g.projectKbToDesk(x, y));

// ---------- Navigator reservation block ----------
// 20 × 80 × 3 mm bar lying flush UNDER the keyboard along its index-finger
// (inner / thumb-facing) side.  20 mm deep perpendicular to that edge,
// 80 mm long parallel to the edge (along Y), 3 mm thick (along the
// keyboard-plane normal).  Outer face of the bar sits flush against the
// keyboard's inner vertical edge (X ≈ 116.18 mm in left-half local frame,
// measured from the STL outline).
const NAV_DEPTH_X  = 20;
const NAV_LENGTH_Y = 80;
const NAV_THICK_Z  = 3;
function buildNavigatorBar() {
  let bar = box(NAV_DEPTH_X, NAV_LENGTH_Y, NAV_THICK_Z)
    .translate(NavigatorX, NavigatorY, -NAV_THICK_Z);
  bar = bar.rotate([0, 1, 0], -g.TENT_DEG, { pivot: [0, 0, 0] });
  bar = bar.rotate([1, 0, 0],  g.TILT_DEG, { pivot: [0, 0, 0] });
  return bar;
}
const navigatorBar = ReserveNavigator ? buildNavigatorBar() : null;

// ---------- 1. Outer wedge as a planar-trimmed prism. ----------
// Body footprint = the Voyager outline PROJECTED onto the desk plane at
// posture (compressed in X by cos(tent), in Y by cos(tilt) minus a small
// X-cross term).  Extruded up vertically, then trimmed by the tilted top
// plane.  This way the brick's XY shadow == the keyboard's XY shadow at
// posture — the keyboard sits flush, no overhang.
let body = polygon(g.VOYAGER_OUTLINE_LEFT_PROJECTED).extrude(ceilingZ);

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
// Projected bbox — used to size the cavity inside the projected outline.
const _projXs = g.VOYAGER_OUTLINE_LEFT_PROJECTED.map(p => p[0]);
const _projYs = g.VOYAGER_OUTLINE_LEFT_PROJECTED.map(p => p[1]);
const projMinX = Math.min(..._projXs), projMaxX = Math.max(..._projXs);
const projMinY = Math.min(..._projYs), projMaxY = Math.max(..._projYs);
const projW = projMaxX - projMinX;
const projD = projMaxY - projMinY;
function buildCavity() {
  // Cavity: roundedRect sized to fit inside the projected outline bbox with
  // generous margin (WALL_T + bulge slack), centered on the projected bbox.
  // Doesn't perfectly trace the contour, but the bulk of the brick is
  // hollowed and filament saving is large.  A future iteration could
  // compute a proper polygon offset.
  const innerW = projW - 2 * WALL_T - 8;
  const innerD = projD - 2 * WALL_T - 8;
  const innerR = Math.max(r - WALL_T, 0.5);
  let cav = roundedRect(innerW, innerD, innerR)
    .extrude(ceilingZ)
    .translate(projMinX + projW / 2, projMinY + projD / 2, WALL_T);
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
for (const [px, py] of pegCenters) {
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
  for (const [mx, my] of magnetCenters) {
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
for (const [mx, my] of magnetCenters) {
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

// Carve out the Navigator-bar volume so the trackball-mount strip can sit
// flush against the keyboard without interference.
if (ReserveNavigator && navigatorBar) {
  body = body.subtract(navigatorBar);
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
const pegColor = "#ff4da6";
const magnetColor = "#d4a857"; // brass-ish, reads clearly against steel body
const cavityColor = "#2a2f36"; // dark — reads as void inside the body
let result;
if (Detail === "preview") {
  // group() preserves identities/colors without a boolean — fast in WASM.
  // Body is translucent only when ShowCavity is on; otherwise it's opaque
  // and the cavity is hidden.
  const showCav = Hollow && cavity && ShowCavity;
  const bodyShape = showCav
    ? body.color(bodyColor).material({ opacity: 0.35 })
    : body.color(bodyColor);
  const children = [
    { name: "body", shape: bodyShape },
    ...previewPegs.map((p, i) => ({ name: `peg-${i}`, shape: p.color(pegColor) })),
    ...previewMagnets.map((m, i) => ({ name: `magnet-${i}`, shape: m.color(magnetColor) })),
  ];
  if (showCav) {
    children.push({ name: "cavity", shape: cavity.color(cavityColor) });
  }
  if (ReserveNavigator && navigatorBar) {
    children.push({ name: "navigator", shape: navigatorBar.color("#e0913a") });
  }
  result = group(...children);
} else {
  result = body.color(bodyColor);
}

if (Side === "right") {
  result = result.mirrorThrough([w / 2, d / 2, 0], [1, 0, 0]);
}

return result;
