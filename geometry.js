// geometry.js — pure helpers and constants for The Brick.
// No ForgeCAD globals used here. All units mm.

// Voyager-left-half footprint (X = pinky..thumb, Y = front..rear)
const FOOTPRINT_MM = {
  xMin: 0,
  xMax: 137.85,
  yMin: 0,
  yMax: 136.87,
  plateThickness: 2.3,
};

// Width / depth derived
const FOOTPRINT_WIDTH = FOOTPRINT_MM.xMax - FOOTPRINT_MM.xMin; // 137.85
const FOOTPRINT_DEPTH = FOOTPRINT_MM.yMax - FOOTPRINT_MM.yMin; // 136.87

// Measured corner heights above the desk (Z), in the Voyager-left local frame.
//   front-pinky  (x=0,     y=0)             = 0
//   rear-pinky   (x=0,     y=136.87)        = 17
//   front-thumb  (x=137.85,y=0)             = 79
//   rear-thumb   (x=137.85,y=136.87)        ~= 96 (derived from plane)
const CORNER_HEIGHTS_MM = {
  frontPinky: 0,
  rearPinky: 17,
  frontThumb: 79,
  rearThumb: 79 + 17, // 96, derived from plane z = a*x + b*y
};

// Derived plane coefficients for the LEFT half:  z(x, y) = a*x + b*y
//   a = 79 / 137.85    (tent, thumb-up rotation about Y)
//   b = 17 / 136.87    (tilt, rear-up rotation about X)
const PLANE_A_LEFT = 79 / FOOTPRINT_WIDTH; // ≈ 0.57309
const PLANE_B = 17 / FOOTPRINT_DEPTH;      // ≈ 0.12421

// Plane angles (degrees)
const TENT_DEG = Math.atan(PLANE_A_LEFT) * 180 / Math.PI; // ≈ 29.81
const TILT_DEG = Math.atan(PLANE_B) * 180 / Math.PI;      // ≈ 7.08

// Keyboard bottom-plane normal (pointing AWAY from the brick top face, into
// the keyboard).  Up to a positive scalar this is (-a, -b, +1); to point
// from the keyboard down toward the brick we use (a, b, -1).  We expose the
// "up out of the brick" version, which is what pegs grow along.
const KB_PLANE_NORMAL_UP = (() => {
  const v = [-PLANE_A_LEFT, -PLANE_B, 1];
  const n = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / n, v[1] / n, v[2] / n];
})();

// Mating-plane height at an (x, y) in the local frame, for either side.
// Geometry is mirrored at the Shape level rather than by sign-flipping `a`.
function plane(side, x, y) {
  void side;
  return PLANE_A_LEFT * x + PLANE_B * y;
}

// -------------- ZSA tripod-mount attachment interface --------------
//
// Center of the mount zone, in the Voyager-LEFT local frame.  Both halves
// model the mount in their own local frame at this point — the right-half
// mirror is applied to the whole brick at the top-level placement.
const MOUNT_ZONE_CENTER_LEFT = [63.10, 81.90];

// 4 corner pegs on a 33.26 × 33.26 mm square around the zone center.
const PEG_SPACING_MM = 33.26;
const PEG_HALF_SPACING = PEG_SPACING_MM / 2; // 16.63

// Peg shaft: Ø 2.15 mm × 1.5 mm tall, slip-fit into the keyboard receptacles.
const PEG_DIAMETER_MM = 2.15;
const PEG_HEIGHT_MM = 1.5;

// 4 magnets in a diamond, r = 9 mm from the zone center, at the cardinal
// directions (Y+, X+, Y−, X−).  Each magnet is Ø 5 × 2 mm N42 neodymium.
// Pocket: Ø 5.1 × 2.1 mm deep, recessed into the tilted top face.
const MAGNET_RADIUS_FROM_CENTER_MM = 9.0;
const MAGNET_DIAMETER_MM = 5.0;
const MAGNET_THICKNESS_MM = 2.0;
const MAGNET_POCKET_DIAMETER_MM = 5.1;
const MAGNET_POCKET_DEPTH_MM = 2.1;

// Peg corner offsets relative to the mount-zone center (2D, in local XY).
// Order is informational, matches the geometry-facts table.
const PEG_LOCAL_OFFSETS_2D = [
  [-PEG_HALF_SPACING, -PEG_HALF_SPACING], // front-pinky corner
  [+PEG_HALF_SPACING, -PEG_HALF_SPACING], // front-thumb corner
  [+PEG_HALF_SPACING, +PEG_HALF_SPACING], // rear-thumb  corner
  [-PEG_HALF_SPACING, +PEG_HALF_SPACING], // rear-pinky  corner
];

// Magnet diamond offsets, relative to the mount-zone center (2D).
const MAGNET_LOCAL_OFFSETS_2D = [
  [0, +MAGNET_RADIUS_FROM_CENTER_MM], // rear  (Y+)
  [+MAGNET_RADIUS_FROM_CENTER_MM, 0], // thumb (X+)
  [0, -MAGNET_RADIUS_FROM_CENTER_MM], // front (Y−)
  [-MAGNET_RADIUS_FROM_CENTER_MM, 0], // pinky (X−)
];

// World-XY peg centers (in the left-half local frame). The actual Z for
// each peg base is set by the plane() helper at (x, y).
function pegWorldCenters() {
  const [cx, cy] = MOUNT_ZONE_CENTER_LEFT;
  return PEG_LOCAL_OFFSETS_2D.map(([dx, dy]) => [cx + dx, cy + dy]);
}

function magnetWorldCenters() {
  const [cx, cy] = MOUNT_ZONE_CENTER_LEFT;
  return MAGNET_LOCAL_OFFSETS_2D.map(([dx, dy]) => [cx + dx, cy + dy]);
}

// -------------- Bumper feet on the brick's bottom face --------------
const FOOT_POCKET_DIAMETER_MM = 10.0;
const FOOT_POCKET_DEPTH_MM = 2.0;
const FOOT_PATTERN_INSET_MM = 12.0; // inset from the bbox corners

// External outline.
const PERIMETER_CORNER_RADIUS_MM = 6.0;

// Top-edge break (solid-steel production target only — FDM omitted in this
// solid-only revision).
const TOP_CHAMFER_MM_PRODUCTION = 2.0;

// Z safety so we don't fly into degenerate booleans at the rear-thumb peak.
const TOP_Z_CEILING_MM = CORNER_HEIGHTS_MM.rearThumb + 10; // generous

// Mirror helper for the right half.
function mirrorAcrossXcenter() {
  return {
    normal: [1, 0, 0],
    point: [FOOTPRINT_WIDTH / 2, 0, 0],
  };
}

module.exports = {
  // dimensions
  FOOTPRINT_MM,
  FOOTPRINT_WIDTH,
  FOOTPRINT_DEPTH,
  // posture
  CORNER_HEIGHTS_MM,
  PLANE_A_LEFT,
  PLANE_B,
  TENT_DEG,
  TILT_DEG,
  TOP_Z_CEILING_MM,
  KB_PLANE_NORMAL_UP,
  plane,
  // mount-zone (ZSA tripod-mount)
  MOUNT_ZONE_CENTER_LEFT,
  PEG_SPACING_MM,
  PEG_HALF_SPACING,
  PEG_DIAMETER_MM,
  PEG_HEIGHT_MM,
  PEG_LOCAL_OFFSETS_2D,
  MAGNET_RADIUS_FROM_CENTER_MM,
  MAGNET_DIAMETER_MM,
  MAGNET_THICKNESS_MM,
  MAGNET_POCKET_DIAMETER_MM,
  MAGNET_POCKET_DEPTH_MM,
  MAGNET_LOCAL_OFFSETS_2D,
  pegWorldCenters,
  magnetWorldCenters,
  // feet
  FOOT_POCKET_DIAMETER_MM,
  FOOT_POCKET_DEPTH_MM,
  FOOT_PATTERN_INSET_MM,
  // outline / breaks
  PERIMETER_CORNER_RADIUS_MM,
  TOP_CHAMFER_MM_PRODUCTION,
  // mirror
  mirrorAcrossXcenter,
};
