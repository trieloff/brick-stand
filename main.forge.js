// main.forge.js — entry point for "The Brick" tenting stand.
//
// Solid-steel-only revision: the FDM-prototype hollowing has been dropped
// while the new ZSA tripod-mount interface is validated.
//
// Parameters:
//   Side               — "left" | "right"
//   ShowVoyagerMockup  — bool, overlay the keyboard plate at posture for
//                        inspection.  Adds no BOM rows.
//   ShowPair           — bool, render both halves side-by-side for posture
//                        inspection.  Adds no BOM rows.

const g = require("./geometry.js");

// NOTE: run with `forgecad run --backend occt`.

const Side = Param.choice("Side", "left", ["left", "right"]);
const ShowVoyagerMockup = Param.bool("ShowVoyagerMockup", true);
const ShowPair = Param.bool("ShowPair", false);

// ---------- BOM (one part / one half, solid stainless) ----------
bom(1, "Brick body (304/316 stainless steel, single piece)", {
  material: "stainless-steel-304-or-316",
  process: "CNC-or-investment-cast",
  notes: "one half; mirror for opposite hand. Integral Ø2.15×1.5 mm pegs.",
});

bom(4, "Neodymium magnet, Ø 5 mm × 2 mm, N42, axially magnetized", {
  diameter: 5,
  length: 2,
  material: "NdFeB-N42",
  notes: "press-fit or epoxy into Ø 5.1 × 2.1 mm pockets",
});

bom(4, "Urethane bumper foot, 3M Bumpon SJ5012 (black, Ø 10 × 2 mm)", {
  diameter: 10,
  notes: "self-adhesive into bottom pockets",
});

// ---------- Geometry ----------
function loadBrick(side) {
  return require("./brick.forge.js", { Side: side });
}
function loadMockup(side) {
  return require("./voyager_mockup.forge.js", { Side: side });
}

if (ShowPair) {
  const left = loadBrick("left");
  const right = loadBrick("right")
    .translate(g.FOOTPRINT_WIDTH + 30, 0, 0);

  const out = [
    { name: "Brick (left)",  shape: left,  color: "#9aa7b4" },
    { name: "Brick (right)", shape: right, color: "#8b94a3" },
  ];
  if (ShowVoyagerMockup) {
    out.push({
      name: "Voyager (left, mock)",
      shape: loadMockup("left"),
      color: "#3a4a5a",
    });
    out.push({
      name: "Voyager (right, mock)",
      shape: loadMockup("right")
        .translate(g.FOOTPRINT_WIDTH + 30, 0, 0),
      color: "#3a4a5a",
    });
  }
  return out;
}

const oneBrick = loadBrick(Side);

if (ShowVoyagerMockup) {
  return [
    { name: `Brick (${Side})`, shape: oneBrick, color: "#9aa7b4" },
    {
      name: `Voyager (${Side}, mock)`,
      shape: loadMockup(Side),
      color: "#3a4a5a",
    },
  ];
}

return oneBrick;
