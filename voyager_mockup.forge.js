// voyager_mockup.forge.js — the actual Voyager bottom plate imported from
// ZSA's STL, positioned at the measured posture for visual co-inspection
// against the brick.  Inspection-only; not part of any BOM.
//
// Parameters:
//   Side — "left" | "right"

const g = require("./geometry.js");

const Side = Param.choice("Side", "left", ["left", "right"]);

const w = g.FOOTPRINT_WIDTH;
const d = g.FOOTPRINT_DEPTH;

// Import the actual bottom-plate geometry — gives the real outline, real
// peg receptacle positions, and the trackball-mount stepping all at once.
// The STL is in local frame: X 0..137.85, Y 0..136.87, Z 0..2.3.
let plate = importMesh("./reference/bottom_plate_left.STL");

// Tip the plate into the measured posture about (0, 0, 0).
// Rotation about +Y by NEGATIVE tent pushes +X (thumb) UP.
// Rotation about +X by POSITIVE tilt pushes +Y (rear) UP.
plate = plate.rotate([0, 1, 0], -g.TENT_DEG, { pivot: [0, 0, 0] });
plate = plate.rotate([1, 0, 0],  g.TILT_DEG, { pivot: [0, 0, 0] });

if (Side === "right") {
  plate = plate.mirrorThrough([w / 2, d / 2, 0], [1, 0, 0]);
}

return plate.color("#2a3540");
