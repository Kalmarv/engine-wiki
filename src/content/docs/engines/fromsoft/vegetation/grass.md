---
title: Grass definitions and pivots
description: Grass meshes with per-vertex densities, GrassTypeParam resource references and pivot-driven vegetation deformation.
sources:
  - title: SoulsFormats GRASS reader (Smithbox)
    url: https://github.com/vawser/Smithbox
    note: The file's record layouts; the volume's first two words are corrected here
  - title: Paramdex
    url: https://github.com/soulsmods/Paramdex/blob/master/ER/Defs/GrassTypeParam.xml
    note: GRASS_TYPE_PARAM_ST field definitions
implementations:
  - name: fromsoft-formats (param.rs)
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/param.rs
  - name: fromsoft-formats (grass.rs)
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/grass.rs
---

Vegetation includes ordinary FLVER meshes with pivot attributes as well as Elden Ring's separate
[SpeedTree streams](/engines/fromsoft/vegetation/speedtree/). Pivot members give a deformation origin in model
space, rather than another texture-coordinate set. :observed

Sekiro pivot families include `Translucency_Pivot`, `Pivot_Parent` and `snake_Pivot`. Elden Ring grass, tree and
`Vesitation` families also store Half4 pivots, transformed by their vertex programs as positions.
See [vertex formats](/engines/fromsoft/geometry/vertex-formats/). :observed

## Grass meshes

A map piece or asset that grows grass carries a `.grass` file beside its model (member id 1200 of its `.mapbnd` or `.geombnd`
binder): 772 files in Sekiro and 1,925 in Elden Ring. :proven[every `.mapbnd` and `.geombnd` binder of both installs] It is a triangle mesh in
the model's space whose vertices each store six densities, one for each grass type the part's grass configuration names, and a
binary tree of volumes over the triangles. It holds no blade: where blades stand is not stored. :inferred The file is
little-endian and its tables fill it exactly: a 40-byte header, the volumes, the vertices, the faces and the boxes.
:proven[all 2,697 files]

```layout
title: Grass mesh header
size: 40
note: The record sizes and the box count are constant.
fields:
  - {at: 0, size: 4, type: u32, name: version, value: 1, level: proven}
  - {at: 4, size: 4, type: u32, name: header size, value: 40, level: proven}
  - {at: 8, size: 4, type: u32, name: volume size, value: 20, level: proven}
  - {at: 12, size: 4, type: u32, name: volume count, level: proven}
  - {at: 16, size: 4, type: u32, name: vertex size, value: 36, level: proven}
  - {at: 20, size: 4, type: u32, name: vertex count, level: proven}
  - {at: 24, size: 4, type: u32, name: face size, value: 24, level: proven}
  - {at: 28, size: 4, type: u32, name: face count, level: proven}
  - {at: 32, size: 4, type: u32, name: box size, value: 24, level: proven}
  - {at: 36, size: 4, type: u32, name: box count, level: proven, note: Equal to the volume count}
```

```layout
title: Grass volume
size: 20
note: A binary tree, the root first.
fields:
  - {at: 0, size: 4, type: u32, name: first child, level: proven, note: "Index of a volume after this one, 0 for none"}
  - {at: 4, size: 4, type: u32, name: second child, level: proven, note: As the first child}
  - {at: 8, size: 4, type: u32, name: first face, level: proven, note: The faces under the volume run from here}
  - {at: 12, size: 4, type: u32, name: end face, level: proven, note: To here, exclusive}
  - {at: 16, size: 4, type: u32, name: grass types, level: proven, note: A bit for each of the six types a vertex of one of its faces grows}
```

```layout
title: Grass vertex
size: 36
fields:
  - {at: 0, size: 12, type: "f32[3]", name: position, level: proven}
  - {at: 12, size: 24, type: "f32[6]", name: densities, level: inferred, note: "One for each grass type; 0 to 1"}
```

```layout
title: Grass face
size: 24
fields:
  - {at: 0, size: 12, type: "f32[3]", name: normal, level: observed, note: "Against the cross product of the edges; not always a unit vector"}
  - {at: 12, size: 12, type: "u32[3]", name: vertex indices, level: proven}
```

Each box (24 bytes, after the faces, one per volume in volume order) is a least and a greatest corner as six floats; the box of a volume
holds every vertex of the faces under it. :proven[all 2,697 files] The community's reader names the volume's first four words a
child range and a face range; the files show that the first two are the indices of the volume's two children (one child on 242
volumes of Sekiro and 19 of Elden Ring, none on a leaf), and that the fifth, which that reader leaves unnamed, is the set of
grass types. :proven[all 2,697 files]

In every file the volumes form one tree from volume 0: each child comes after its parent and has one parent, a child's faces are
within its parent's, and the root holds every face. :proven[all 2,697 files] A volume with two children (7,165 in Sekiro,
43,954 in Elden Ring) holds exactly their faces, the two ranges abutting; a volume with one child (242 and 19) holds more than its
child does. :proven[all 2,697 files]

The densities are in 0 to 1 and do not sum to one per vertex: 284,661 of Sekiro's 723,967 vertices and 1,169,828 of Elden Ring's
4,490,801 sum to more than one, and 133,503 and 574,942 have no type at all. :proven[all 2,697 files] The stored face normal points against
the right-hand cross product of the face's edges from its first vertex (cosine below -0.999 on 1,064,757 of Sekiro's 1,065,442
faces and 7,797,867 of Elden Ring's 7,799,267; 532 and 674 faces store none), but it has unit length on only 88% and 94% of them
(0.1 to 5 on the rest); what the length stands for is not known. :observed

:::open[Which GrassTypeParam row does each of the six densities drive?]
A part's grass configuration names six rows and the vertices store six densities; that the order is the same is likely and has not
been checked against a rendering.
:::

## Elden Ring

### Grass type references

Map-part grass configuration names six GrassTypeParam row IDs. Those rows name the detailed and simplified
models and flat or billboard textures, with density, spacing and LOD range. Reading references in m10_00_00_00,
m12_02_00_00 and m60_39_54_00 checks this resolution against `regulation.bin`; it does not establish blade placement.
:observed{games="elden-ring"}

```layout
title: GrassTypeParam resource fields
size: 276
games: [elden-ring]
note: Selected fields of the Paramdex layout; unlisted bytes are not described here. Names are fixed-width UTF-16.
fields:
  - {at: 0, size: 2, type: u16, name: LOD range, level: sourced}
  - {at: 8, size: 4, type: f32, name: base density, level: sourced}
  - {at: 12, size: 32, type: UTF-16, name: model0 name, level: sourced}
  - {at: 44, size: 64, type: UTF-16, name: flat texture name, level: sourced}
  - {at: 108, size: 64, type: UTF-16, name: billboard texture name, level: sourced}
  - {at: 204, size: 4, type: f32, name: spacing, level: sourced}
  - {at: 212, size: 32, type: UTF-16, name: simple model name, level: sourced}
  - {at: 244, size: 32, type: UTF-16, name: model1 name, level: sourced}
```

Empty resource-name fields denote no named resource. The resource-field layout requires at least 276 bytes;
this partial description does not assign meanings to the intervening fields or any appended bytes.
:sourced[Paramdex]{games="elden-ring"}

:::open[How are individual grass blades placed and animated?]
Density, spacing and row references do not specify a demonstrated placement algorithm. The sampled maps establish
which resources are named, not the runtime distribution, random seed, interaction response or complete wind model.
:unknown{games="elden-ring"}
:::
