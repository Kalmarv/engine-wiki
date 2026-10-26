---
title: Collision, physics pools and grinds
description: Stock collision streaming, Studio collision grouping, surface resources and grind geometry.
games: [skate]
sources:
  - title: ReSkate physics capacity code
    url: https://github.com/Dingo-Shenanigans/ReSkate/tree/main/Engine/Game/Build/20260929
---

Stock collision streams with the world; render readiness does not imply that ground collision has arrived.
StaticModelGroups can share one PhysicsAsset per group, while render-only members are legal. :observed

Studio 20261012 generally places collision in resident level-root layers such as `default_1`. Below roughly
4,003 geometries it writes per-object `.physics` assets. Above that threshold it merges collision into 100-metre
areas named `collision_area_<x>_<z>`; when merged geometry still exceeds the budget it can stream collision
with WorldPartition cells. A measured 6.4-km cube-grid example streams up to 27,648 geometry slots in game.
:observed

The 4,003 threshold is a compiler budget, distinct from the stock geometry pool of 5,000 and ReSkate's raised
40,000-geometry pool. Studio warns when geometries across active WorldPartition ancestry exceed its native
resident budget. :observed

Studio's Blender add-on turns curves flagged `sk8_grind_curve` into invisible, open-ended, eight-sided collision
prisms. These are collision geometry rather than runtime grind splines. :observed

## Capacity assertions

The executable contains `FatalAssert failed: Exceeded <X> capacity of PhysicsWorld` checks for twenty pools,
for example FixedShapeCount at `Skate+0x26b122c`. `config/DisabledAsserts.cfg` disables them at every launch.
Disabling does not make an overflow safe: each check reports through `+0x7138370` and then executes
`mov dword [0],0` at its report site (for example `+0x265af98`, `+0x266eedb`), so an overflowing pool faults
there and the dump names that site. :observed

ReSkate caps fixed shapes and hull/mesh pools at `1<<20`. :sourced[ReSkate] Per-level capacity selection
appears related to the level's FBPhysicsWorldData, else the `Physics.DefaultClientWorldCapacity.*` settings,
going by the executable's assertion strings; that selection path is not exercised by the available evidence.
:inferred

## PhysicsResource

A PhysicsResource (resource type `0x41759364`) is the collision a PhysicsAsset or EcsPhysicsAsset names. It is
little-endian, and every offset in it is self-relative: the field's own position plus its value. :observed

```layout
title: PhysicsResource header
size: 56
fields:
  - {at: 0, size: 4, type: u32, name: version, value: 2, level: observed}
  - {at: 4, size: 4, type: u32, name: magic, value: "0x69af7015", level: observed}
  - {at: 8, size: 4, type: u32, name: unknown, level: unknown, note: "0 in the game's own resources, 1 in ReSkate Studio's"}
  - {at: 12, size: 4, type: u32, name: part count, level: observed}
  - {at: 16, size: 4, type: u32, name: count of 24-byte entries after the parts, level: observed}
  - {at: 20, size: 4, type: u32, name: unknown, level: unknown, note: Zero.}
  - {at: 24, size: 4, type: u32, name: shape count, level: observed}
  - {at: 28, size: 4, type: u32, name: count of 44-byte entries, level: observed}
  - {at: 32, size: 4, type: u32, name: unknown, level: unknown, note: Zero.}
  - {at: 36, size: 4, type: u32, name: body offset, level: observed, note: "Always 0x38"}
  - {at: 40, size: 4, type: u32, name: shape table offset, level: observed}
  - {at: 44, size: 4, type: u32, name: 44-byte entry table offset, level: observed}
  - {at: 48, size: 4, type: u32, name: part table offset, level: observed}
  - {at: 52, size: 4, type: u32, name: end of the part table, level: observed}
```

The body at `0x38` is empty in the game's own resources and `0x4c` bytes in ReSkate Studio's, copied from its
template. The 24- and 44-byte entry tables occur in dynamic props; their layout is not decoded. :observed

```layout
title: Shape record
size: 84
fields:
  - {at: 0, size: 12, type: "f32[3]", name: bounds minimum, level: observed}
  - {at: 12, size: 12, type: "f32[3]", name: bounds maximum, level: observed}
  - {at: 24, size: 2, type: u16, name: vertex count, level: observed}
  - {at: 26, size: 2, type: u16, name: corner count, level: observed}
  - {at: 28, size: 2, type: u16, name: face count, level: observed}
  - {at: 30, size: 2, type: u16, name: tree node count, level: observed}
  - {at: 32, size: 4, type: u32, name: unknown, level: unknown, note: Zero.}
  - {at: 36, size: 48, type: "u32[12]", name: array offsets, level: observed, note: "Vertices (f32x3), vertex-to-corner offsets, corner ids by vertex, corner vertices (u16), corner edge values (f32), concave bits, flat bits, face offsets, two unused (zero), face planes, bounding-volume tree"}
```

```layout
title: Part record
size: 72
fields:
  - {at: 0, size: 16, type: "f32[4]", name: rotation, level: observed}
  - {at: 16, size: 12, type: "f32[3]", name: position, level: observed}
  - {at: 28, size: 4, type: f32, name: unknown, value: "1.0", level: unknown}
  - {at: 32, size: 4, type: u32, name: unknown, level: unknown}
  - {at: 36, size: 4, type: u32, name: shape kind, level: observed, note: "2 box with face planes, 3 convex polyhedron, 5 triangle mesh"}
  - {at: 40, size: 12, type: "u32[3]", name: part ids, level: observed}
  - {at: 52, size: 4, type: u32, name: unknown, level: unknown}
  - {at: 56, size: 4, type: u32, name: shape index, level: observed}
  - {at: 60, size: 4, type: u32, name: unknown, level: unknown}
  - {at: 64, size: 4, type: u32, name: packed material, level: observed}
  - {at: 68, size: 4, type: u32, name: flags, level: observed, note: "0x800 in measured parts"}
```

The kind is stored in the part, not the shape. The game's own small parts are convex polyhedra (kind 3: polygon
faces, no edge data, no tree, zero bounds) and boxes with face planes (kind 2). A face plane is eight bytes: the
normal octahedrally encoded as two snorm16 values, then the offset as f32. Zero bytes follow the last plane to at
least 56 bytes past it. :observed

Shape arrays follow the tables by kind across all shapes in shape order: vertices, vertex offsets, corner ids,
corner vertices; then, four-aligned, each shape's edge values, concave bits and flat bits; face offsets;
four-aligned face planes; and, where a shape has a tree, eight-aligned trees followed by eight zero bytes.
:observed

Every PhysicsResource of every TOC of the base data reads and writes back byte for byte under this layout,
except those holding the undecoded 24- and 44-byte tables, which the reader refuses. The box, convex and mesh
part kinds all occur. :proven[every resource read; dynamic props with the two undecoded tables refused]

### Triangle-mesh shapes

Kind 5 shapes are triangle meshes with edge data and a tree; ReSkate Studio writes only this kind. A shape holds
at most 65,535 vertices and 21,845 faces, the capacity of its `u16` counts. Its vertices are recentred on the
box centre, the part position. :observed

Each face corner's edge runs to the next corner. When exactly one other corner holds the opposite directed edge,
the two face normals give `d = n1·n2`: the flat bit is set when `d >= cos(0.1°)`; otherwise, when the neighbour's
centroid lies on or above this face's plane, the concave bit is set if `d > 0`; otherwise the edge is convex and
stores `f32 cos(acos(d)/2)`. Every other edge value is `1.0` with neither bit. :observed

The tree is a complete bounding-volume hierarchy in heap layout with `faces - 1` `u64` nodes. An inner node packs
its children's minimum planes in 10/10/10 bits, rounded down, with owner bits 30 and 31, and its maximum planes in
10/9/10 bits with owner bits 61–63. The left child keeps the parent's planes by default. Every face of a
2,048-triangle test grid lies inside the box of the leaf it reaches when the boxes are followed from the root.
:observed

Studio's writer orders faces by their centroid on the axis of largest centroid extent, then face-box minimum x,
then index, and takes the left count from the heap shape. These ordering rules reproduce Studio's output byte
for byte on eight test meshes up to 8,192 triangles; they are the writer's rules, not a requirement the game is
known to check. :observed

:::open[What do the dynamic-prop tables and the unknown part words hold?]
The 24- and 44-byte entry tables, the header word at `8`, and several part words are stored but not decoded;
contact materials and grind-edge analysis are therefore not established from this layout. :unknown
:::
