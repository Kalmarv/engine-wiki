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

The FLVER record layouts below are checked in the whole-install model population: 14,459 Sekiro files
and 22,050 reference-readable Elden Ring files. The reference refuses another 119 Elden Ring SpeedTree files;
those have a separate stream check. One Sekiro archive entry fails before model inspection and is excluded.
:proven[whole-install reference population]

## Nodes

```layout
title: FLVER2 node
size: 128
fields:
  - {at: 0, size: 12, type: float3, name: translation, level: proven}
  - {at: 12, size: 4, type: u32, name: name offset, level: proven}
  - {at: 16, size: 12, type: float3, name: Euler rotation, level: proven}
  - {at: 28, size: 2, type: i16, name: parent index, level: proven}
  - {at: 30, size: 2, type: i16, name: first child index, level: sourced}
  - {at: 32, size: 12, type: float3, name: scale, level: proven}
  - {at: 44, size: 2, type: i16, name: next sibling index, level: sourced}
  - {at: 46, size: 2, type: i16, name: previous sibling index, level: sourced}
  - {at: 48, size: 12, type: float3, name: minimum bounds, level: sourced}
  - {at: 60, size: 4, type: u32, name: node flags, level: sourced}
  - {at: 64, size: 12, type: float3, name: maximum bounds, level: sourced}
  - {at: 76, size: 52, type: bytes, name: reserved, value: 0, level: proven}
```

In every node of both installs (129,270 in Sekiro's 14,459 models, 535,503 in Elden Ring's 22,169), following the next-sibling
indices from a node's first child index visits exactly the nodes whose parent index is that node, and the
previous-sibling index undoes the next-sibling one. :proven[every node of both installs] The first child is the lowest-index
child in all but 75 Sekiro and 37 Elden Ring nodes, and siblings are not otherwise in index order. :proven[every node of both installs]
The two bounds are either a box (minimum not above maximum on every axis: 66,485 Sekiro and 139,011 Elden Ring nodes) or
the inverted sentinel, minimum `+3.4028235e38` and maximum `-3.4028235e38` on every axis, of a node with no bound vertices
(62,785 and 396,492); no node has anything else. :proven[every node of both installs] The flags word takes only the values
0, 1, 2, 4, 6, 8, 10, 12 and 14 in both games, so only its low four bits are used. :proven[every node of both installs]
Bit 1 is set only on nodes that have no children and that no mesh and no dummy point names: all 50,370 Sekiro and
363,132 Elden Ring nodes with it set. :proven[every node of both installs] Bit 2 is set only on nodes a dummy point names
as parent or attach bone in Elden Ring (all 24,493 nodes with it; 771 named nodes lack it), and in Sekiro on 8,377 named
nodes and 1,964 unnamed ones (27 named nodes lack it). :proven[every node of both installs] What bits 4 and 8 select is
not explained by a node being a mesh's default bone or by its name. :unknown

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
  - {at: 12, size: 20, type: bytes, name: reserved, value: 0, level: proven}
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
  - {at: 12, size: 4, type: u32, name: reserved, value: 0, level: proven}
```

## Rigid and dynamic data

Static vertices with a stored normal W use that integer to identify their rigid bone, at implicit weight one.
Where the layout stores no normal W, the mesh's NodeIndex supplies the bone instead. Dynamic vertices are stored
in model bind space. :observed

In Ashina Castle, map pieces' bones are identity, so their vertices need no bone transform. Objects' rigid bones
are not: the cannon cart `o114670`, for example, has a bone scale of 0.00937, and its vertices are stored in that
bone's space. :observed{games="sekiro"} The vertex's position is usable only after the bone's world transform
(the node's local transform, composed up through its parents) is applied; read raw, the cannon mesh is about 400 m
long and stacked straw bags sit at the model origin. :observed{games="sekiro"}

Across Ashina Outskirts (`m11_00`), Ashina Castle (`m11_01`) and Ashina Reservoir (`m11_02`), no map-piece vertex is
bound to a non-identity bone, while many object placements are of models that have such vertices:
:observed{games="sekiro"}

| Map | Object placements whose model has vertices on a non-identity bone | Confidence |
|---|---|---|
| `m11_00` Ashina Outskirts | 683 of 1,453 | :observed{games="sekiro"} |
| `m11_01` Ashina Castle | 776 of 1,613 | :observed{games="sekiro"} |
| `m11_02` Ashina Reservoir | 374 of 773 | :observed{games="sekiro"} |

An empty mesh bone palette means that vertex indices name skeleton joints directly; a nonempty palette supplies
the local-to-skeleton mapping. :observed Elden Ring's c3000 model has 368 nodes and 49 meshes with empty palettes;
its largest joint index with nonzero weight is 101. :observed{games="elden-ring"}
Sekiro's `c1010` has 400 nodes and 81 meshes, all dynamic with empty palettes; its highest used index is 109.
The five equipment parts of the Another's Memory: Ashina costume also have empty palettes. :observed{games="sekiro"}

Twenty captured c3000 skinned draws bind a 12,288-byte joint buffer: 256 affine matrices of 48 bytes, despite
the shader declaring only six rows. Reflection's declared array extent is therefore not the bound palette size.
:observed{games="elden-ring"}

Explicit stored weights need not sum to one. The inspected Sekiro c1010 model has byte-quantized weights
summing to `253/255` or `252/255` on 31,544 of its 140,330 vertices; those sums are stored data, not evidence of a decoding error.
:observed{games="sekiro"}

Smithbox leaves a static mesh as stored when neither a normal W nor a valid NodeIndex supplies a bone.
:sourced[Smithbox] The corresponding game behaviour is not established. :unknown

## Dummy attachment points

```layout
title: FLVER2 dummy
size: 64
fields:
  - {at: 0, size: 12, type: float3, name: position, level: sourced}
  - {at: 12, size: 4, type: bytes, name: colour bytes, level: proven, note: "Alpha, red, green, blue: byte 12 is 255 on every dummy point"}
  - {at: 16, size: 12, type: float3, name: forward vector, level: sourced}
  - {at: 28, size: 2, type: i16, name: reference ID, level: sourced}
  - {at: 30, size: 2, type: i16, name: parent bone, level: sourced}
  - {at: 32, size: 12, type: float3, name: upward vector, level: sourced}
  - {at: 44, size: 2, type: i16, name: attach bone, level: sourced}
  - {at: 46, size: 1, type: bool, name: unknown flag, level: unknown}
  - {at: 47, size: 1, type: bool, name: use upward vector, level: sourced}
  - {at: 48, size: 4, type: i32, name: unknown 30, level: unknown}
  - {at: 52, size: 4, type: i32, name: unknown 34, level: unknown}
  - {at: 56, size: 8, type: bytes, name: reserved, value: 0, level: proven}
```

The four colour bytes have the alpha channel first (ARGB): the first byte is 255 on all 20,268 Sekiro and 88,340 Elden Ring
dummy points, and the other three are 255 (white) on all but 34 Sekiro and 3,239 Elden Ring points, which are grey (128)
or a colour with the red and green bytes zero and the blue 208. :proven[every dummy point of both installs] The unknown
flag at 46 is 1 when the attach bone is set and 0 when it is -1 on 86,081 of Elden Ring's 88,340 dummy points and 20,232 of
Sekiro's 20,268 (it is 0 with an attach bone on 2,157 and 8, and 1 without one on 102 and 28). :proven[every dummy point of both installs]
The use-upward flag at 47 is 1 on all of them. :proven[every dummy point of both installs]

The reference ID identifies the point to scripts and effects; its meaning is external to FLVER. The parent bone
supplies the initial transform, while the attach bone is the bone the point follows physically, according to the
reference reader. :sourced[SoulsFormatsNEXT]

:::open[How are invalid rigid bone references handled by the game?]
The file population includes static meshes without a usable bone reference. Viewer behaviour is documented above,
but it does not establish the game's transform or visibility rule. :unknown
:::
