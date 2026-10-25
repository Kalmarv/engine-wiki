---
title: Landtables, COL entries and models
description: "How Sonic Adventure 2: Battle describes a stage's geometry as landtables of COL entries holding Ninja object trees, the three attach formats, the Ginja (GX) material words, and the winding rule."
sources:
  - title: X-Hax SA Tools
    url: https://github.com/X-Hax/sa_tools
    note: SAModel's LandTable, COL, NJS_OBJECT, GCAttach (Ginja), ChunkAttach and BasicAttach loaders; no licence file
---

A stage's geometry is a **landtable**: a list of **COL entries**, each with a bounding sphere, flags and a Ninja object (`NJS_OBJECT`) that points to the model data. SA2 uses three
model ("attach") formats: **Ginja** (the GameCube/GX one), **Chunk** (Dreamcast-style chunk lists) and **Basic** (the plain polygon list, used for collision). :sourced[SA Tools]
A stage module can hold several landtables; the disc has 101 in 79 stage data files. :observed Counts here come from a recorded census of the USA disc `GSNE8P`; they cannot be re-checked
now. :observed

## What the stages use

| Entries | Model format | Where | Confidence |
|---|---|---|---|
| 17,597 visible COL entries | Ginja | most landtables | :observed |
| 1,482 visible COL entries | Chunk | landtables with `format=SA2` | :observed |
| 8,816 invisible COL entries | Basic (collision) | all | :observed |
| 24 invisible COL entries | Ginja | | :observed |

All 27,919 COL entries and 10,006 distinct attaches build without error. :observed Visible pieces and collision-only pieces are distinct COL entries: SA2's visible meshes never carry the
`Solid` flag, and collision is the separate invisible `Solid` COL meshes. :observed SA2 surrounds its paths with tall invisible barrier walls made of these. :observed Some walkable collision has no
visible geometry because SA2 draws those parts with stage objects (Radical Highway). :observed

## Object transforms

Object transforms follow the Ninja convention, written for column vectors: `T · Rz · Ry · Rx · S`, or `T · Ry · Rx · Rz · S` when `EvalFlags` bit `0x20` is set; angles are BAMS (65,536 = 360°).
The `EvalFlags` NoPosition, NoRotate, NoScale, NoDisplay and NoChildren are honoured. :sourced[SA Tools] The game's own coordinates are Y-up; one game unit is about 0.1 m (City Escape's street is
130 units wide with a 1-unit kerb, which reads as realistic). :observed

## Ginja (GameCube) materials and meshes

Mesh parameters are GX state: they persist from mesh to mesh, through the opaque list and on into the translucent list, as SA Tools already treats index flags and its material. :sourced[SA Tools]

- **Texture tile word** (the `Texture` parameter, high 16 bits) is the GX wrap mode per axis: V in bits 0 to 1, U in bits 2 to 3; 0 = clamp, 1 = repeat, 2 = mirror. Across all 19,626 GC meshes only the
  nine combinations {0,1,2}×{0,1,2} occur (values 0, 1, 2, 4, 5, 6, 8, 9, 0xA); the value 3 never occurs and the bit SA Tools calls `Unk_1` (0x10) never occurs. :observed
  SA Tools' `MeshInfo` path clamps only when `Unk_1` is also set, so it never clamps. :observed
- **UV scale.** The `VtxAttrFmt` for Tex0 has the GX vertex-attribute fraction bits in its low byte, so `UV = s16 / 2^frac`. On the disc only 8 (16,553 meshes) and 10 (2,938 meshes) occur, and SA
  Tools' divider table gives the same results. :observed
- **Vertex colours** are RGBA8 throughout (5,359 vertex sets). SA Tools' `GC.Color` stores them byte-swapped (`Red` = A, `Green` = B, `Blue` = G, `Alpha` = R). :observed
- **Colour source.** `DiffuseColor` is a GX RGBA8 register with bytes R, G, B, A: the most common value is `B2B2B2FF`, the Ninja default diffuse (178, 178, 178, 255); alpha varies only in the last byte
  (`…5B`, `…7F`); vertex colours are present exactly when the strip flag VertexDiffuse (0x08) is set (18,512 meshes with, 1,114 without, no exceptions); every one of the 1,114 meshes without vertex
  colours has a DiffuseColor register. So the material colour is the vertex colour when VertexDiffuse is set and the register otherwise, the GX channel material source. :observed
- **Blending.** The opaque list is drawn without blending (SA Tools' viewer alpha-tests with `GREATER 0`). In the translucent list `SrcAlpha/InvSrcAlpha` (846 meshes) is alpha blending and
  `SrcAlpha/One` (53 meshes) is additive. :observed
- **Unlit.** The `StripFlags` byte bit 0 is IgnoreLight. The value 0x0B (IgnoreLight | IgnoreSpecular | VertexDiffuse) is used by 17,620 of 19,626 meshes, which are unlit. :observed
- **Environment maps.** 24 meshes have TexCoordGen `Matrix3x4 / Normal / Matrix4`: GX generates their texture coordinates from the normal through texture matrix 4, which the engine loads at run time and
  which is not in the data. :observed The Ninja environment-map convention `uv = 0.5 + 0.5 · view-space normal.xy` is probably what it computes. :inferred

### Winding

GX front faces are clockwise, so each GC triangle is reversed relative to a counter-clockwise convention (strip triangle 0 is v1, v0, v2). On meshes with normals the reversed order agrees with the
stored normals for 23,009 triangles against 7,778 (all landtables, chunk meshes included); on City Escape, Mission Street and Metal Harbor, whose GC meshes have no normals, 84 to 90% of the
near-horizontal visible area then faces up. :observed

:::open[How does the engine's lighting channel use the light slots and ambient source?]
The exact GX lighting channel setup (which light slots, ambient source) is engine code and was not traced; see [Light and fog](/engines/ninja/lighting/light-and-fog/).
:::

:::open[What are sky and background models and animated landtable entries?]
Sky and background models are drawn by stage code and are not in the landtable; no animated landtable entry occurs on this disc so far.
:::

## Paths

A stage module also contains **PathData** records (SplitTools layout): `s16 type, u16 count, f32 total distance, entries*, u32 code`, with each entry `u16 x rotation, u16 z rotation, f32 distance to
next, vec3 position` (0x14 bytes). The GameCube data mappings have no path list item, so they are found by scanning the module: a record is a path when some pointer in the module references it, type = 1,
code = 0, its entries lie inside the module and their distances sum to the total (within 1%). :observed Whether a path is a rail (a grind surface), a loop, a wall run or a floor path is not stored in the record. :unknown
