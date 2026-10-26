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

The structural bound census reads all 14,692 YBN copies in every archive, including nested composite children, with
no refused files. The proven header, geometry, composite and triangle fields below describe that entire YBN corpus;
they do not establish the undecoded BVH structure or every runtime collision filter. :proven[all YBN entries]

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
  - {at: 16, size: 1, type: u8, name: bound kind, level: proven}
  - {at: 17, size: 3, type: bytes, name: unknown, level: unknown}
  - {at: 20, size: 4, type: f32, name: sphere radius, level: proven}
  - {at: 24, size: 8, type: bytes, name: unknown, level: unknown}
  - {at: 32, size: 12, type: vec3, name: box maximum, level: proven}
  - {at: 44, size: 4, type: f32, name: margin, level: proven}
  - {at: 48, size: 12, type: vec3, name: box minimum, level: proven}
  - {at: 60, size: 4, type: bytes, name: unknown, level: unknown}
  - {at: 64, size: 12, type: vec3, name: box centre, level: proven}
  - {at: 76, size: 4, type: bytes, name: primitive material bytes, level: proven, note: "first byte is material index"}
  - {at: 80, size: 12, type: vec3, name: sphere centre, level: proven}
  - {at: 92, size: 16, type: bytes, name: unknown, level: unknown}
  - {at: 108, size: 4, type: f32, name: volume, level: proven}
```

## Geometry and composites

```layout
title: Geometry bound fields
size: 304
note: Begins with the 112-byte common header described above.
fields:
  - {at: 0, size: 112, type: BoundHeader, name: common header, level: proven}
  - {at: 112, size: 8, type: bytes, name: undescribed fields, level: unknown}
  - {at: 120, size: 8, type: pointer, name: shrunk vertices, level: sourced}
  - {at: 128, size: 4, type: bytes, name: unknown, level: unknown}
  - {at: 132, size: 4, type: u32, name: shrunk vertex count, level: sourced}
  - {at: 136, size: 8, type: pointer, name: polygons, level: proven}
  - {at: 144, size: 12, type: vec3, name: coordinate quantum, level: proven}
  - {at: 156, size: 4, type: bytes, name: unknown, level: unknown}
  - {at: 160, size: 12, type: vec3, name: coordinate centre, level: proven}
  - {at: 172, size: 4, type: bytes, name: unknown, level: unknown}
  - {at: 176, size: 8, type: pointer, name: quantized vertices, level: proven}
  - {at: 184, size: 8, type: pointer, name: vertex colours, level: proven}
  - {at: 192, size: 16, type: bytes, name: undescribed fields, level: unknown}
  - {at: 208, size: 4, type: u32, name: vertex count, level: proven}
  - {at: 212, size: 4, type: u32, name: polygon count, level: proven}
  - {at: 216, size: 24, type: bytes, name: undescribed fields, level: unknown}
  - {at: 240, size: 8, type: pointer, name: materials, level: proven}
  - {at: 248, size: 32, type: bytes, name: undescribed fields, level: unknown}
  - {at: 280, size: 8, type: pointer, name: polygon material indices, level: proven}
  - {at: 288, size: 1, type: u8, name: material count, level: proven}
  - {at: 289, size: 15, type: bytes, name: undescribed tail, level: unknown}
```

```layout
title: Composite bound
size: 176
fields:
  - {at: 0, size: 112, type: BoundHeader, name: common header, level: proven}
  - {at: 112, size: 8, type: pointer, name: child bound pointers, level: proven}
  - {at: 120, size: 8, type: pointer, name: child transforms, level: proven}
  - {at: 128, size: 8, type: bytes, name: undescribed fields, level: unknown}
  - {at: 136, size: 8, type: pointer, name: child bounding boxes, level: sourced}
  - {at: 144, size: 8, type: pointer, name: child flags, level: proven}
  - {at: 152, size: 8, type: pointer, name: second child flags, level: proven}
  - {at: 160, size: 2, type: u16, name: child count, level: proven}
  - {at: 162, size: 14, type: bytes, name: undescribed tail, level: unknown}
```

Geometry vertices are signed 16-bit coordinate triples decoded component-wise as `integer * quantum + centre`.
Polygon records include triangles, spheres, capsules, boxes and cylinders. Triangle indices carry flags in their
high bits, alongside signed neighboring-polygon indices (`-1` means absent) and area. :proven

```layout
title: Triangle polygon
size: 16
fields:
  - {at: 0, size: 4, type: u32, name: area and polygon kind, level: proven, note: "low 3 bits select kind 0; clearing them gives the float area bits"}
  - {at: 4, size: 6, type: "u16[3]", name: vertex indices and flags, level: proven, note: "bit 15 is a flag; low 15 bits index vertices"}
  - {at: 10, size: 6, type: "i16[3]", name: edge neighbors, level: proven, note: "-1 means absent"}
```

Sphere, capsule and cylinder vertex words use all 16 bits as indices, unlike triangle words. Removing bit 15 from
every polygon kind changes legitimate large vertex indices. :sourced[CodeWalker]

Geometry materials are two-word records. The low byte of the first word identifies the material type; the records
also carry procedural ID, room, ped density, flags and colour index. Each polygon has a byte index into the material
array. Names come from the ordered entries of `materials.dat`. :sourced[CodeWalker]

Composites own child pointers, child bounding boxes, two sets of per-child flags and 64-byte transforms. A transform
stores four columns of vec3-plus-word data, with translation in the fourth column. :proven

The existence of a BVH pointer does not establish its node layout here; geometry can be decoded independently of
the acceleration structure. :unknown

## Collision detail and map state

YBN names prefixed with `hi@` or `ma@` distinguish finer collision copies associated with weapons and vehicles from
plain map bounds used for walking or rolling. :sourced[CodeWalker]

Drawn geometry and collision can describe one object differently. At the Vespucci skatepark (`vb_34_skate`), two
round rails are drawn as pairs of crossed flat strips with the alpha-tested `railing_whiterail_basic_a` material,
while their collision models round bars of radius 0.10 m; a third rail (`rsn_os_skatemetal`) is drawn as a real
tube. :observed

Static collision streams by bound boxes. A YBN can be live only in Story or only in Online, so collision ownership
must retain the same [map-state distinction](/engines/rage/archives/mounts/) as placements. A file in one state is
not globally active simply because its bounds intersect a region. :observed

## Embedded collision

The inspected drawable layout has an embedded-bound pointer at `gtaDrawable + 0xC8`. Fragments reach the first
physics-LOD bound through `fragType + 0xF0`, then LOD-group `+0x10`, then physics-LOD `+0xE8`. :observed

The live Story drawable census finds embedded bounds in 13,133 YDRs and in the first physics LOD of 40,658 YFTs, but
none in YDD entries or the fragment main drawable's own bound field (`FragDrawable + 0xF0`). This is a corpus result,
not a structural prohibition on future resources. :observed[live Story drawables]

Entity flag value `4` is named “disable embedded collisions” by CodeWalker. :sourced[CodeWalker]

:::open[How are every bound flag and acceleration structure interpreted?]
The shape and material representation is broader than the decoded BVH and runtime filtering semantics documented
here. The remaining flag bits and BVH structure need separate evidence. :unknown
:::
