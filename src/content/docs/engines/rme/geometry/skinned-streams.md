---
title: Skinned streams and skeletons
description: "The processed skinning stream embedded in the metadata of character and crowd meshes: 64-byte batch headers with a four-bone palette, 64-byte source vertices, the skeleton in the SCP, and the Morpheme rigs that supply the binding matrices."
---

Characters and the crowd outfits of the layer PAKs are skinned. Their vertices are not in the MMP: the mesh's [metadata](/engines/rme/geometry/model-quartets/) carries an **embedded stream** (the offset at `0x9C` is not `0xFFFFFFFF`), the MMP slice holds
only the indices, and the MGP slice is empty. The primary stream descriptor of such a mesh declares stride 36, which describes the compact vertex the GPU receives after skinning; it is not the size of the stored vertex. :observed
All 3,412 skinned meshes of the disc have the same variant: vertex-format mask `0x8007F` (position, colour, normal, two basis vectors and two UV sets), metadata flags bit 0 set (already processed) and source vertices of 64 bytes. :proven[all 3,412 skinned meshes]
They sit in 145 quartets: 103 in the character PAKs (1,375 meshes) and 42 in 21 layer PAKs (2,037 meshes), male and female crowd outfits. :proven[all 657 quartets]

A mesh whose stream seems to start with the ASCII text `STR` and `FF` has no magic: the bytes are the first batch's bone indices, 83, 84, 82 and 255, and the next batch happens to spell `YZX`. :observed

All numbers are big-endian. `ep` is the embedded-stream offset taken from the metadata, relative to the start of that mesh's metadata.

## Stream

```layout
title: Skinning stream envelope
size: "64 × (vertex_count + batch_count + 2)"
games: [shred]
note: A 64-byte envelope, then batches until the vertex count of the primary descriptor is covered, then a terminal batch header, then 16 bytes of metadata footer outside the stream.
fields:
  - {at: 0, size: 4, type: u32, name: stream_size, level: proven, note: "bytes of the stream including the envelope and the terminal header; equals 64 × (vertex_count + batch_count + 2)"}
  - {at: 4, size: 60, type: "u32[15]", name: padding, level: proven, note: "0xAABBCCDD in every word"}
```

The size equation holds for every mesh. The batch count is not stored: batches are read until the vertex count of the primary descriptor is covered, and the next header must be the terminal one (vertex count 0, influence count 0). :proven[all 3,412 skinned meshes]

```layout
title: Skinning batch header
size: 64
games: [shred]
note: "Followed by `vertex_count` source vertices of 64 bytes."
fields:
  - {at: 0, size: 4, type: "u8[4]", name: bones, level: proven, note: "bone indices into the quartet's skeleton; 255 for an unused slot"}
  - {at: 4, size: 2, type: u16, name: vertex_count, level: proven}
  - {at: 6, size: 2, type: u16, name: influence_count, level: proven, note: "1 to 4"}
  - {at: 8, size: 56, type: "u32[14]", name: padding, level: proven, note: "0xDDCCBBAA in every word"}
```

The four bones of a header are a **palette** shared by every vertex of the batch; a vertex carries no bone indices of its own, only weights for the palette. The disc has 31,471 batches of one influence, 69,931 of two, 94,313 of three and 116,120 of four, 311,835 in all. :proven[all 3,412 skinned meshes]

```layout
title: Skinning source vertex
size: 64
games: [shred]
fields:
  - {at: 0, size: 12, type: "f32[3]", name: position, level: proven, note: "bind-space position; inside the stored box in every mesh"}
  - {at: 12, size: 4, type: "u8[4]", name: weights, level: proven, note: "one per palette slot, divided by 255; they sum to 255; inactive slots are 0"}
  - {at: 16, size: 12, type: "f32[3]", name: normal, level: proven, note: "unit length except 14 vertices that are NaN"}
  - {at: 28, size: 4, type: u32, name: extra, level: unknown, note: "0 in every vertex; copied by the preprocessor"}
  - {at: 32, size: 12, type: "f32[3]", name: tangent, level: inferred, note: "not always unit or orthogonal to the normal"}
  - {at: 44, size: 4, type: f32, name: tangent_sign, level: inferred, note: "-1 or +1"}
  - {at: 48, size: 4, type: "f16[2]", name: uv0, level: proven}
  - {at: 52, size: 4, type: "f16[2]", name: uv1, level: proven}
  - {at: 56, size: 8, type: "u8[8]", name: padding, level: unknown}
```

Over the 3,302,877 vertices every position, UV and tangent is finite, every weight sum is exactly 255, every bone index is inside the skeleton of its quartet and no inactive slot has weight. :proven[all 3,412 skinned meshes]
3,302,863 of the normals are unit length within 0.005. The other 14 vertices (42 components) in four meshes are NaN in the stock data; the meshes use three shoe materials of the male 01 snow outfits and one of male 18 (skate). :proven[all 3,412 skinned meshes]
The normal sits at offset 16, not 32: the face normals of a sample character and a crowd mesh agree with offset 16 at a median alignment of 0.94 and 0.98, against 0.27 and 0.58 for offset 32. :observed
No bitangent is stored. The conventional reconstruction, the cross product of normal and tangent times the sign, is not shown to match what the game does. :inferred

## How the engine makes it

The stream is the output of a preprocessing step in the executable that runs when a mesh is first loaded (guarded by the flag at metadata offset `0xB4`). It takes an unprocessed 96-byte working vertex, sorts vertices by influence count and bone ids, remaps the indices to that order, groups equal palettes and writes the 64-byte batches and vertices. :observed[static reading of the executable]
Every mesh on the disc was shipped already processed, so the 96-byte input form does not occur in the data and its layout is known only from the code. :observed
At run time skinning jobs run on the SPUs (`job_actor_skinning_full` and `job_skinning_full` are the registered names), take the stream, the skeleton's matrices and two output streams of 16 and 20 bytes, and produce the vertices the GPU draws. :observed[static reading of the executable]
Nothing found makes this an EDGE geometry stream, although the disc's SPU modules include EDGE kernels. :observed

## Skeletons

The skeleton is in the **SCP** of the same quartet, not in the model files. Header word `0x20` is the bone count and `0x24` the offset of a table of 16-byte records. :observed

```layout
title: Skeleton bone record
size: 16
games: [shred]
fields:
  - {at: 0, size: 4, type: u32, name: word0, level: unknown}
  - {at: 4, size: 4, type: u32, name: parent, level: inferred, note: "0xFFFFFFFF or an index inside the table; its use is not traced"}
  - {at: 8, size: 4, type: u32, name: name_offset, level: proven, note: "offset in the SCP of a NUL-terminated ASCII name"}
  - {at: 12, size: 4, type: u32, name: matrix_offset, level: proven, note: "offset in the SCP of a 64-byte matrix"}
```

The 145 quartets hold 18,455 bone records, from 40 to 192 per skeleton (the crowd skeletons have 40). Every name and matrix pointer can be read, every matrix is finite and affine and no parent is out of range. :proven[all 145 skinned quartets]
For the sample character mesh `f1cf719c` the first palette resolves to LeftLegRoll, LeftFoot and LeftLeg, and its first vertex has weights 139, 113, 3 and 0. :observed

## Binding matrices and the animation rigs

When a skeleton is set up, a bone whose name matches a joint of the animation rig takes its binding matrix from that rig's reference pose; a bone with no match falls back to the matrix its SCP record points to (`matrix_offset`, converted to the engine's basis). :observed[static reading of the executable]
The SCP matrices are therefore not the whole bind for a character whose bones are in a rig.

The animation rigs are in Morpheme bundles, big-endian with 32-bit pointers, a layout unlike that of the public 64-bit Morpheme readers. There are five such containers on the disc, each an entry without an extension in its PAK: `actor_male`, `ai_skate`, `skate`, `snowboard` and `ui`. :observed
Read by the game's own relocation rules, all five parse to their exact ends: 1,680 records, of which ten are rigs (seven distinct by id and GUID, some repeated across containers) with 812 joints between them; the other 1,670 records are kept unread. :proven[all five containers]
A rig's reference pose is an array of XYZW quaternions and an array of XYZ positions; the fourth lane of each position holds bits that are not part of the value. :observed

:::open[How does the skeleton pose a bind-space vertex?]
Positions are already coherent in the stored bind arrangement. The binding matrix comes from the rig or the SCP as above, but how the two are composed with the rig header's own transform and the animation pose is not established. The exact SPU arithmetic that normalises and packs the tangent frame is also not recovered.
:::
