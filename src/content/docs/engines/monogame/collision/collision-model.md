---
title: Collision models, ledges and physics materials
description: "STUNTBOOST's derived collision file: solid and trigger triangles, grippable-edge bits, ramps, the grind ledge graph, and the C_ physics materials that decide how a surface behaves."
games: [stuntboost]
sources:
  - title: StuntboostTools documentation
    url: https://github.com/bytinggames/StuntboostTools
    note: physics materials and the swap_collision_materials collection syntax
implementations:
  - name: primase worlds/stuntboost (read/derived.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/stuntboost/src/read/derived.rs
---

For each level part the game's content pipeline derives a **collision model** from the glTF and stores it as
`Level_<Name>_<N>Collision.xnb` (reader `SE.Pipeline.CollisionModelReader`). It holds what the game collides with, how the board
grips, and the **grind ledges** the board can lock onto. A custom map has no such file: the game compiles collision from the
glTF itself. :observed{games="stuntboost"}

## What gets collision

Every node whose name parses as solid (`<`) or transmissive (`#`, a trigger) gets a collision mesh from its mesh and its global
transform ([node names](/engines/monogame/gameplay/node-names/)). Grind ledges are computed per solid node unless its name
contains `no_grind` (`=OnlyGrindUpright()` is respected); ledges that are obstructed or short are omitted and nearby corners
linked. :observed{games="stuntboost"}

Over all 159 parts the game's own loader reads 3,022,926 collision triangles and 293,944 ledges: 287,956 `Edge`, 5,346 `RailBoost`
and 642 `RailNoBoost`. :proven{games="stuntboost"} A reader of the file layout below gives, for every part, the same
nodes with collision, the same triangles (corners to the bit, load order, grippable bits, ramps), the same ledges (type, corners, normal,
tangent, binormal, angles, lengths, group) and the same corner counts as the game's own code. :proven{games="stuntboost"}

## File layout

After the primary object's reader index, little-endian, a vector being three `f32`:

```layout
title: Collision model (CollisionModelReader object)
size: variable
games: [stuntboost]
note: "Read as a stream: sizes depend on the counts."
fields:
  - {at: 0, size: 12, type: vec3, name: solid cell size, level: proven, note: "the lookup grid's cell size for solid triangles"}
  - {at: 12, size: 12, type: vec3, name: trigger cell size, level: proven}
  - {at: 24, size: 4, type: i32, name: mesh count, level: proven, note: "one per glTF node"}
  - {at: "after the counts", size: "per mesh", type: "mesh[]", name: meshes, level: proven, note: "a byte 1 (present), the aggregate (byte: 0 solid, 1 trigger, 2 none), a part count (i32), then the parts"}
  - {at: "after the meshes", size: "variable", type: "ledges", name: ledge graph, level: proven, note: "corner count and corners, ledge count and ledges, then each corner's ledge directions"}
```

A **part** of a mesh: its triangle count (`i32`); per triangle three corners (vectors) and, for a solid mesh only, the
**grippable-edge bits** (a byte) and a **ramp id** (`i32`, −1 none); then the part's lookup grid cells (an `i32` count; each cell
three `i32` indices, a triangle count and that many triangle indices). The grid is derived from the triangles and is the game's
lookup structure. :proven{games="stuntboost"}

The **ledge graph**: the corner count (`i32`), each corner's position (vector) and its near corners (an `i32` count and
indices); the ledge count (`i32`), each ledge a minimum and a maximum angle (`f32`), a normal and a tangent (vectors), two
corner indices (`i32`), a length, the recursive lengths in each direction, a group id (`i32`), two lerp cut-offs (`f32`) and a
type byte (0 edge, 1 rail without boost, 2 rail with boost); then each corner's ledge directions (an `i32` count, each a ledge
index and a bool, forward). The binormal is not stored: the game derives it as `normalize(cross(tangent, normal))`.
:proven{games="stuntboost"}

The **shortcuts** file `Level_<Name>_<N>Cuts.xnb` is a reflective `SE.Pipeline.ShortcutContent` whose one property is a
`Dictionary<uint, int[]>`: the reader index, the entry count (`i32`), then per entry the key (`u32`) and the value (reader
index, an `i32` count and the integers; a null array is possible). :observed{games="stuntboost"}

## What the file does not store

The file stores grippable-edge bits and ramp ids for solid triangles only. The game's loader (`SE.CollisionModel.Load`) defaults
them to 0 for transmissive (trigger) triangles, so a dump through the game's loader shows zeros there, for 518 parts, that the
file does not hold. :proven{games="stuntboost"}

## Physics materials

The game's physics materials are glTF materials whose names begin `C_`, assigned to collision geometry (`_<`, not visual
meshes): `C_<behaviour>[_<substance>][_no_grind]`, a Blender `.NNN` suffix dropped. :sourced[StuntboostTools documentation]
The 28 distinct names in the 159 parts: :observed{games="stuntboost"}

| Behaviour | Meaning | Names (uses) | Confidence |
|---|---|---|---|
| `Default` | an ordinary solid surface | `C_Default` (126), `_Cardboard` (113), `_Wood` (97), `_PlasticHard` (95), `_Metal` (94), `_Fabric` (69), `_MetalHollow` (62), `_PlasticSoft` (60), `_PlasticHard_no_grind` (36) | :sourced[StuntboostTools documentation] |
| `Ramp` | ramp handling | `C_Ramp` (18), `_Cardboard` (63), `_MetalHollow` (30), `_Metal` (16), `_PlasticHard` (7), `_PlasticSoft` (3), `_Wood` (2) | :sourced[StuntboostTools documentation] |
| `RampV`, `RampVExtension` | vertical-ramp variants | `C_RampV_Cardboard` (34), `_Cardboard_no_grind` (25), `C_RampVExtension_Cardboard` (31), `C_RampV` (2), `_PlasticSoft` (1) | :inferred |
| `Kill` | a deadly surface | `C_Kill` (70) | :sourced[StuntboostTools documentation] |
| `RailBoost`, `RailNoBoost` | rails with and without a boost | `C_RailBoost` (13), `C_RailNoBoost` (4), `_MetalHollow` (1) | :sourced[StuntboostTools documentation] |
| `Ice` | | `C_Ice` (14) | :inferred |
| `SlowSkate` | | `C_SlowSkate_PlasticHard` (13) | :inferred |

Substances (`Wood`, `Metal`, `MetalHollow`, `Cardboard`, `Fabric`, `PlasticHard`, `PlasticSoft`) name a surface sound or feel. :inferred
The material of a collection can be swapped by a collection named `swap_collision_materials=C_Kill`. :sourced[StuntboostTools documentation]
