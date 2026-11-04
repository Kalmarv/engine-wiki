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
  - {at: 12, size: 4, type: u32, name: end face, level: proven, note: "To here, exclusive"}
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

### Grass in the running game

A frame at the Stormveil gate holds two kinds of grass draw. Placed grass models (the `AEG210` asset family, `Grass_` and `Grass2_`
G-buffer programs) are ordinary one-instance indexed draws of 534 to 68,871 indices. Further away, `Grass2_LOD1` programs draw
two tiny meshes (14 and 4 triangles) as GPU instances, 160 to 315 to a draw, from the draw's `cbInstanceData` records: 315 is
what its 65,536-byte range holds of 208-byte records. :observed[one frame]{games="elden-ring"} The records are written by the
CPU each frame; a record is a 3×4 world matrix (translation in the fourth column), a fade alpha, `forceNum` and `forceIndex`
and a colour palette, the layout of every instanced model of the frame. :observed[one frame]{games="elden-ring"} That these
clumps are the blades the grass configuration places is likely and not shown: no frame says which `GrassTypeParam` row made
them. :inferred

Placement in that frame, over the 825 clumps of the three draws of the larger mesh (61 to 129 m from the eye): positions are not
on a grid (nearest-neighbour distance 0.15 to 3.6 m, median 0.84 m); the clump count per 8 m square runs from 1 to 83 and falls
off smoothly towards the patch edge, so the density varies from place to place by more than the 0.9 to 1.1 scatter of the clumps;
heading is uniform over all directions; horizontal scale is 0.9 to 1.1 (0.6 to 1.1 for the smaller mesh) and vertical scale
independent of it, 0.55 to 1.2. Draws are batches by distance (61 to 91 m, 91 to 108 m, 105 to 129 m for the larger mesh; 142 to
164 m and 175 to 210 m for the others), 315 clumps at most. :observed[one frame]{games="elden-ring"}

#### How grass moves

The `Grass2_LOD1` vertex program declares the structured buffer `g_forceParam` (`ForceParamStruct`, 96 bytes: a `uint4`
`SystemParam`, then float4 `PosAndSquareForce`, `DirAndSineForce`, `WindParam`, `GustParam` and `GustTimeParam`) and the byte
buffer `g_InstanceIndexBuffer`. :observed[the program's reflection]{games="elden-ring"} Its 256 records are filled by a buffer copy from the
upload ring early in the frame, and only 8 or 9 are non-zero. :observed[five frames]{games="elden-ring"} In five frames at the gate, the
non-zero records are the same six at the same positions and directions (in the frame's local coordinates, for example (-48.1, 48.5, 57.8)
with direction (0.899, 0, 0.437)), each with `SystemParam` (1, 1, 0, 0), `GustParam` (1, 1, 1, 0), `GustTimeParam` (3, 5, 10, 60),
`WindParam.x` 1 and `WindParam.w` 0.1, a per-record `WindParam.y` (123.8 to 179.6) that does not change between frames, and a
`WindParam.z` shared by the six that grows from frame to frame (155.07, 161.50, 167.91, 169.35, 169.80), 1.696 to 1.698 times
the frame clock `T` of [the SpeedTree wind](/engines/fromsoft/vegetation/speedtree/#wind-state-in-the-running-game).
:observed[five frames]{games="elden-ring"} The fourth word of `PosAndSquareForce` and of `DirAndSineForce` is one shared number (12.7 to 14.2, a different one in each
frame). One to three further records of each frame repeat some of those positions and directions with a `WindParam.z` of
0.99 and a fourth word near 12.1. :observed[five frames]{games="elden-ring"}
Two of the five frames also hold a record near the eye, at (3.7, 7.3, 10.0), with direction (-0.579, 0, -0.816),
`WindParam` (0.8, 55.4, ·, 0.3), `GustTimeParam.x` 2 and a fourth word near 7.3, which the other three frames lack; a force at the
player's place would fit. :inferred Each batch's instances carry `forceNum` and a `forceIndex` (2 and 1283 for the three
larger-mesh batches, 1 and 5 for the 142 to 164 m batch, 1 and 1 for the 175 to 210 m one); that `forceIndex` is a start into
the index buffer that names records of `g_forceParam` is the reading of the names, and the index buffer's contents at the start of
the frame (identity) do not show it. :inferred How a program turns these words into a blade's motion is in the program's code and was not read here.

:::open[Which GrassTypeParam row does each of the six densities drive?]
A part's grass configuration names six rows and the vertices store six densities; that the order is the same is likely and has not
been checked against a rendering. The frames show the result (the clump placement above) but not which row or density a clump came from:
that needs the part's configuration, its `.grass` file and a frame taken where they are loaded, and the instances' positions put in the
file's frame. Not done.
:::

:::open[How are individual grass blades placed and animated?]
Narrowed: in the frames the far grass is a CPU-written set of clumps with random heading and scale, denser where the
mesh says so, drawn in distance batches; its motion reads a table of wind and force records per frame whose clock is the
SpeedTree frame clock times 1.7. Not known: the seed and the rule that turns density and spacing into positions, how a
program uses the record words, and the near grass (the placed `Grass_` models), whose blades are in the model.
:::
