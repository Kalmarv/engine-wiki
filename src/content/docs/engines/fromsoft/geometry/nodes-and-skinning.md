---
title: FLVER nodes and skinning
description: Transform nodes, dummy attachment points, rigid bone selection and bind-space vertices.
sources:
  - title: SoulsFormatsNEXT
    url: https://github.com/soulsmods/SoulsFormatsNEXT/tree/master/SoulsFormats/Formats/FLVER
    note: Node and dummy records
  - title: Smithbox
    url: https://github.com/vawser/Smithbox
    note: Reference behaviour for static meshes with no valid node
implementations:
  - name: primase worlds/fromsoft (pose.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/pose.rs
---

FLVER nodes describe a transform hierarchy. Meshes can follow a node rigidly or carry weighted bone indices;
dummy points identify attachment locations independently of the drawable meshes. :sourced[SoulsFormatsNEXT]

## Nodes

```layout
title: FLVER2 node
size: 128
fields:
  - {at: 0, size: 12, type: float3, name: translation, level: observed}
  - {at: 12, size: 4, type: u32, name: name offset, level: observed}
  - {at: 16, size: 12, type: float3, name: Euler rotation, level: observed}
  - {at: 28, size: 2, type: i16, name: parent index, level: observed}
  - {at: 30, size: 2, type: i16, name: first child index, level: sourced}
  - {at: 32, size: 12, type: float3, name: scale, level: observed}
  - {at: 44, size: 2, type: i16, name: next sibling index, level: sourced}
  - {at: 46, size: 2, type: i16, name: previous sibling index, level: sourced}
  - {at: 48, size: 12, type: float3, name: minimum bounds, level: sourced}
  - {at: 60, size: 4, type: u32, name: node flags, level: sourced}
  - {at: 64, size: 12, type: float3, name: maximum bounds, level: sourced}
  - {at: 76, size: 52, type: bytes, name: reserved, value: 0, level: observed}
```

The community reader constructs the local transform, in row-vector notation, as
`Scale * RotationX * RotationZ * RotationY * Translation`. A parent index of `-1` marks a root.
:sourced[SoulsFormatsNEXT]

### Skeleton mappings

For FLVER version `0x2001A`, the skeleton set after the texture table maps hierarchy entries back to nodes.
The community reader calls the two lists BaseSkeleton and AllSkeletons; the latter includes control and ragdoll
hierarchies. :sourced[SoulsFormatsNEXT]

```layout
title: FLVER2 skeleton-set descriptor
size: 32
fields:
  - {at: 0, size: 2, type: i16, name: base skeleton count, level: sourced}
  - {at: 2, size: 2, type: i16, name: all skeletons count, level: sourced}
  - {at: 4, size: 4, type: u32, name: base skeleton offset, level: sourced}
  - {at: 8, size: 4, type: u32, name: all skeletons offset, level: sourced}
  - {at: 12, size: 20, type: bytes, name: reserved, value: 0, level: observed}
```

```layout
title: FLVER2 skeleton mapping entry
size: 16
fields:
  - {at: 0, size: 2, type: i16, name: parent index, level: sourced}
  - {at: 2, size: 2, type: i16, name: first child index, level: sourced}
  - {at: 4, size: 2, type: i16, name: next sibling index, level: sourced}
  - {at: 6, size: 2, type: i16, name: previous sibling index, level: sourced}
  - {at: 8, size: 4, type: i32, name: node index, level: sourced}
  - {at: 12, size: 4, type: u32, name: reserved, value: 0, level: observed}
```

## Rigid and dynamic data

Static vertices with a stored normal W use that integer to identify their rigid bone, at implicit weight one.
Where the layout stores no normal W, the mesh's NodeIndex supplies the bone instead. Dynamic vertices are stored
in model bind space. :observed

An empty mesh bone palette means that vertex indices name skeleton joints directly; a nonempty palette supplies
the local-to-skeleton mapping. :observed Elden Ring's c3000 model has 368 nodes and 49 meshes with empty palettes;
its largest joint index with nonzero weight is 101. :observed{games="elden-ring"}

Twenty captured c3000 skinned draws bind a 12,288-byte joint buffer: 256 affine matrices of 48 bytes, despite
the shader declaring only six rows. Reflection's declared array extent is therefore not the bound palette size.
:observed{games="elden-ring"}

Explicit stored weights need not sum to one. The inspected Sekiro c1010 model has byte-quantized weights
summing to `253/255` or `252/255` on some vertices; those sums are stored data, not evidence of a decoding error.
:observed{games="sekiro"}

Smithbox leaves a static mesh as stored when neither a normal W nor a valid NodeIndex supplies a bone.
:sourced[Smithbox] The corresponding game behaviour is not established. :unknown

## Dummy attachment points

```layout
title: FLVER2 dummy
size: 64
fields:
  - {at: 0, size: 12, type: float3, name: position, level: sourced}
  - {at: 12, size: 4, type: bytes, name: colour bytes, level: unknown, note: The reference reader cautions that channel ordering is uncertain.}
  - {at: 16, size: 12, type: float3, name: forward vector, level: sourced}
  - {at: 28, size: 2, type: i16, name: reference ID, level: sourced}
  - {at: 30, size: 2, type: i16, name: parent bone, level: sourced}
  - {at: 32, size: 12, type: float3, name: upward vector, level: sourced}
  - {at: 44, size: 2, type: i16, name: attach bone, level: sourced}
  - {at: 46, size: 1, type: bool, name: unknown flag, level: unknown}
  - {at: 47, size: 1, type: bool, name: use upward vector, level: sourced}
  - {at: 48, size: 4, type: i32, name: unknown 30, level: unknown}
  - {at: 52, size: 4, type: i32, name: unknown 34, level: unknown}
  - {at: 56, size: 8, type: bytes, name: reserved, value: 0, level: observed}
```

The reference ID identifies the point to scripts and effects; its meaning is external to FLVER. The parent bone
supplies the initial transform, while the attach bone is the bone the point follows physically, according to the
reference reader. :sourced[SoulsFormatsNEXT]

:::open[How are invalid rigid bone references handled by the game?]
The file population includes static meshes without a usable bone reference. Viewer behaviour is documented above,
but it does not establish the game's transform or visibility rule. :unknown
:::
