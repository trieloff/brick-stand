// FDM-prototype export wrapper, left half.
// Pegs at Ø2.3 mm (FDM over-extrudes), hollow shell with internal ribs.
return require("./brick.forge.js", {
  Side: "left",
  Detail: "finished",
  Hollow: 1,
  PegDiameter: 2.3,
});
