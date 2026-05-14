// voyager_mockup.forge.js — low-detail proxy of the Voyager bottom plate at
// the measured posture.  Inspection-only; not part of any BOM.
//
// Parameters:
//   Side — "left" | "right"

const g = require("./geometry.js");

const Side = Param.choice("Side", "left", ["left", "right"]);

const w = g.FOOTPRINT_WIDTH;
const d = g.FOOTPRINT_DEPTH;
const t = g.FOOTPRINT_MM.plateThickness;

// Thin rounded slab matching the keyboard's projected footprint.
let plate = roundedRect(w, d, g.PERIMETER_CORNER_RADIUS_MM)
  .extrude(t)
  .translate(w / 2, d / 2, 0);

// Mark the ZSA tripod-mount peg receptacles as shallow dimples on the
// bottom face for visual reference (these align with the brick's pegs).
const recR = 1.2; // visual only — actual receptacle is Ø ~2.2 mm
for (const [px, py] of g.pegWorldCenters()) {
  const dimple = cylinder(0.5, recR).translate(px, py, -0.05);
  plate = plate.subtract(dimple);
}

// Tip the plate into the measured posture about (0, 0, 0).
// Rotation about +Y by NEGATIVE tent pushes +X (thumb) UP.
// Rotation about +X by POSITIVE tilt pushes +Y (rear) UP.
plate = plate.rotate([0, 1, 0], -g.TENT_DEG, { pivot: [0, 0, 0] });
plate = plate.rotate([1, 0, 0],  g.TILT_DEG, { pivot: [0, 0, 0] });

if (Side === "right") {
  plate = plate.mirrorThrough([w / 2, d / 2, 0], [1, 0, 0]);
}

return plate.color("#3a4a5a");
