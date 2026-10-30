---
title: Ink outlines
description: "How STUNTBOOST draws the dark outline around level geometry: an inverted-hull redraw with distance-dependent thickness, the per-vertex shift attribute and the outline colour."
games: [stuntboost]
sources:
  - title: StuntboostTools (bake_v3 README)
    url: https://github.com/bytinggames/StuntboostTools
    note: the outline collection options and the shift attribute encoding
---

The ink outline around a level's meshes is **not** a post-process edge detector. It is an **inverted hull**: the level meshes are
drawn a second time with the opposite face culling and an outline flag set in the shader. :observed{games="stuntboost"} The
shell is pushed outwards by the thickness in the vertex shader, so the back faces show around the silhouette. :inferred

## How it is drawn

`DrawLevel.DrawWithOutline` redraws the level meshes with `CullCounterClockwise` and `ShaderRender.InverseHullOutlines = true`.
The shader's vertex constants include `OutlineThicknessOn0Meters` and `OutlineThicknessOn3Meters`, `InverseHullOutlines` and
`VertexShiftEnabled`; the thickness comes from settings that give 0.05 at 0 m and 2 at 3 m from the camera (the game multiplies both by a run-time
scale each frame), so the outline grows
with distance. :observed{games="stuntboost"}

The outline colour is the surface colour times (0.30, 0.18, 0.15); the constant is in the compiled pixel shader.
:observed{games="stuntboost"}

A separate effect, `Effects/D3/Outlines.fx`, is a depth-edge post pass. :observed{games="stuntboost"}

## The per-vertex shift

With `VertexShiftEnabled` the shader offsets each vertex of the hull by a per-vertex attribute, `_COLOR_SHIFT`, which the
exporter writes into the glTF as an application-specific attribute (two bytes per vertex) to make room for thick outlines. :observed{games="stuntboost"} The exporter encodes the shift vector in
colour space as `X × 0.1 + 0.5` per component. :sourced[StuntboostTools]

The exporter's collection options set it: `outline_shift=X|Y|Z` sets the attribute of every vertex; `outline_shift_relative` adds
to it; `outline_shrink` adds a gradient from 0 at the bottom to the given vector at the top (in local space); an empty named
`outline_shift` or `outline_shrink` supplies the direction from its local up vector; and `outline_max_thickness=X` limits the
thickness for a collection (default 1; 0 means no outline). :sourced[StuntboostTools]
