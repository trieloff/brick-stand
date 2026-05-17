// CNC-stainless production export wrapper, left half.
// Pegs at Ø2.5 mm (~50 µm slip-fit), solid body, top-edge fillet.
return require("./brick.forge.js", {
  Side: "left",
  Detail: "finished",
  Hollow: 0,
  PegDiameter: 2.5,
});
