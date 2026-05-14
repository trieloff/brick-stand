// Throwaway exporter — passes finished-quality params to main.forge.js for
// the left half.  Used by `forgecad export stl _export_left.forge.js`.
return require("./brick.forge.js", {
  Side: "left",
  Detail: "finished",
  Hollow: 1,
});
