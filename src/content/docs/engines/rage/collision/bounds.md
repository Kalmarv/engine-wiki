---
title: Bounds and collision
description: YBN and embedded phBound trees, quantized vertices, polygon materials and map-state ownership.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: Bounds classes, polygon layouts and entity collision flag names.
implementations:
  - name: primase worlds/gta (bounds.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/rage/bounds.rs
  - name: primase worlds/gta (collision.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/read/collision.rs
---

Collision is stored as `phBound` trees in YBN files and embedded in some drawables and fragments. Static map YBN
vertices are already in world space; embedded bounds inherit the placed asset's transform. :observed

| Kind | Shape | Confidence |
|---|---|---|
| 0 | Sphere | :sourced[CodeWalker] |
| 1 | Capsule | :sourced[CodeWalker] |
| 3 | Box | :sourced[CodeWalker] |
| 4 | Geometry | :sourced[CodeWalker] |
| 8 | Geometry with BVH | :sourced[CodeWalker] |
| 10 | Composite | :sourced[CodeWalker] |
| 12 | Disc | :sourced[CodeWalker] |
| 13 | Cylinder | :sourced[CodeWalker] |
| 15 | Cloth | :sourced[CodeWalker] |

```layout
title: Common bound header
size: 112
fields:
  - {at: 0, size: 16, type: bytes, name: resource base, level: sourced}
  - {at: 16, size: 1, type: u8, name: bound kind, level: observed}
  - {at: 17, size: 3, type: bytes, name: unknown, level: unknown}
  - {at: 20, size: 4, type: f32, name: sphere radius, level: observed}
  - {at: 24, size: 8, type: bytes, name: unknown, level: unknown}
  - {at: 32, size: 12, type: vec3, name: box maximum, level: observed}
  - {at: 44, size: 4, type: f32, name: margin, level: observed}
  - {at: 48, size: 12, type: vec3, name: box minimum, level: observed}
  - {at: 60, size: 4, type: bytes, name: unknown, level: unknown}
  - {at: 64, size: 12, type: vec3, name: box centre, level: observed}
  - {at: 76, size: 4, type: bytes, name: primitive material bytes, level: observed, note: "first byte is material index"}
  - {at: 80, size: 12, type: vec3, name: sphere centre, level: observed}
  - {at: 92, size: 16, type: bytes, name: unknown, level: unknown}
  - {at: 108, size: 4, type: f32, name: volume, level: observed}
```

## Geometry and composites

Geometry vertices are signed 16-bit coordinate triples decoded component-wise as `integer * quantum + centre`.
Polygon records include triangles, spheres, capsules, boxes and cylinders. Triangle indices carry flags in their
high bits, alongside signed neighboring-polygon indices (`-1` means absent) and area. :observed

Geometry materials are two-word records. The low byte of the first word identifies the material type; the records
also carry procedural ID, room, ped density, flags and colour index. Each polygon has a byte index into the material
array. Names come from the ordered entries of `materials.dat`. :sourced[CodeWalker]

Composites own child pointers, child bounding boxes, two sets of per-child flags and 64-byte transforms. A transform
stores four columns of vec3-plus-word data, with translation in the fourth column. :observed

The existence of a BVH pointer does not establish its node layout here; geometry can be decoded independently of
the acceleration structure. :unknown

## Collision detail and map state

YBN names prefixed with `hi@` or `ma@` distinguish finer collision copies associated with weapons and vehicles from
plain map bounds used for walking or rolling. :sourced[CodeWalker]

Static collision streams by bound boxes. A YBN can be live only in Story or only in Online, so collision ownership
must retain the same [map-state distinction](/engines/rage/archives/mounts/) as placements. A file in one state is
not globally active simply because its bounds intersect a region. :observed

## Embedded collision

The inspected drawable layout has an embedded-bound pointer at `gtaDrawable + 0xC8`. Fragments reach the first
physics-LOD bound through `fragType + 0xF0`, then LOD-group `+0x10`, then physics-LOD `+0xE8`. :observed

The live Story drawable census finds embedded bounds in YDRs and fragments' first physics LOD, but none in YDD
entries or the fragment main drawable's own bound field. This is a corpus result, not a structural prohibition on
future resources. :observed[live Story drawables]

Entity flag value `4` is named “disable embedded collisions” by CodeWalker. :sourced[CodeWalker]

:::open[How are every bound flag and acceleration structure interpreted?]
The shape and material representation is broader than the decoded BVH and runtime filtering semantics documented
here. The remaining flag bits and BVH structure need separate evidence. :unknown
:::
