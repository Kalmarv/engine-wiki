---
title: Vertex transforms and camera space
description: Program-dependent view-projection semantics, palette layout and cloth-cancel transforms.
implementations:
  - name: primase worlds/fromsoft (vertex_probe.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/passes/layer_bake/vertex_probe.rs
---

A vertex program's constant names do not uniquely determine its transform convention. Programs named alike can
expect either absolute world positions or positions relative to the camera. :proven[executed vertex programs]

## View-projection

Executing a program with identity matrices and palettes, first at camera zero and then with a translated camera,
distinguishes the two observed forms: `VP * world` and `VP * (world-camera)`. The latter expects a view-projection
matrix for a world whose origin is the camera. :proven[executed vertex programs]

Among Elden Ring's 15,707 inspected vertex programs whose clip position has matrix-times-world form, 15,483 are
camera-relative and 224 are absolute. A `VC_MatrixViewProj` name therefore does not establish camera subtraction
by itself. :proven[executed vertex programs]{games="elden-ring"} Of Sekiro's 42 programs of that form, 41 are
camera-relative and one is absolute. :proven[executed vertex programs]{games="sekiro"}

The execution does not classify a program that fails to return the supplied position under identity inputs or
whose response to moving the camera fits neither form; no transform convention is established for that case.
:unknown

## Joint matrices

Every palette-applying vertex program in the bundle census reads each joint as three float4 rows, not columns: 17,455 Elden Ring
programs and 42 Sekiro programs. One additional Elden Ring program reads only joint translations, so its accesses
alone do not distinguish a complete matrix layout. :proven[whole-bundle palette census]

Some Elden Ring skinned programs apply `VC_aClothCancelObjMatrix` (constant buffer `cbClothCancelObjMatrix`,
register b12) before `VC_aObjMatrix` (`cbObjMatrix`, register b5), giving two distinct palettes. A vertex-indexed
constant-buffer access distinguishes a joint palette from an instance-only object matrix. :observed{games="elden-ring"}

:only[sekiro] Sekiro's skinned vertex programs declare no `BLENDINDICES` input: they take the joint index from
`NORMAL0.w`, the integer W of the stored normal ([nodes and skinning](/engines/fromsoft/geometry/nodes-and-skinning/)).
:observed{games="sekiro"}

Of Elden Ring's 18,530 vertex programs in its four shader-bundle binders, 3,928 bind constant buffer register 12 (their
runtime resource tables, read from every program): 2,972 name it `cbClothCancelObjMatrix` (2,520 in `C[…]` character bundles, 284 `CS[…]`, 64
`P[…]`, 56 `M[…]`, 28 cutscene, 20 `S[…]`) and the 956 SpeedTree programs name it `cbSpeedTree`.
:proven[every vertex program, resource table and reflection]{games="elden-ring"} In two disassembled programs, a skinned
one and one taking a single joint per vertex (from the normal's fourth lane), the vertex goes through the
cloth-cancel matrix first and the object palette second, both at the same index, the instance's matrix base plus the
joint: `Obj[i] * CC[i] * p` for the position, and the 3 x 3 parts for the normal and tangent; the skinned one blends
four joints' cloth-cancel matrices by their weights, then four joints' object matrices. :observed{games="elden-ring"} In a captured frame, a skinned draw's cloth-cancel
buffer is bound as large as its object palette (512 to 12,288 bytes), and of 12,230 recorded entries 7,940 are not the
identity (small rotations, translations of centimetres), 3,746 are and 544 are zero; many of the same draws' object
palette entries hold one matrix, the object's. :observed{games="elden-ring"} So the joint's transform is split between
the two palettes by the engine; which joints take which part is not established. :unknown

Sekiro's programs declare the cloth-cancel palette only in `parts_AMSN_clothmatcing`, which applies it the same way.
:observed{games="sekiro"}

The runtime buffer extent can exceed the shader's declared extent. The captured c3000 draws and their 256-matrix
palette are described under [nodes and skinning](/engines/fromsoft/geometry/nodes-and-skinning/).

## Census of the forms in use

Tracing the clip position (`SV_Position`) of every vertex program bound by the draws of ten Elden Ring frames (191
programs) back to the inputs it depends on, the programs fall into these forms. :observed[191 programs of ten captured frames]{games="elden-ring"}

| Form | Programs |
| --- | --- |
| Joint index from the normal's W, object palette, camera-relative view-projection | 78, plus 15 that add time or a force parameter, and 3 more that add a texture fetch |
| Skinned, object palette | 23 |
| Skinned, cloth-cancel then object palette | 15 |
| Joint from the normal's W, cloth-cancel then object palette | 7 |
| Skinned or rigid with a world matrix (`VC_World`) | 7 |
| SpeedTree, wind constants added | 11 (plus a billboard with view-projection only) |
| Clip position from the vertex, no matrix (full-screen) | 13 |
| Own matrix constants (volume and effect programs) | 7 |
| Clip position passed through as `SV_Position` input | 6 |
| No clip position in the program (a later stage writes it) | 8 |

In six Sekiro frames (79 programs) the same trace gives: joint from the normal's W, object palette, camera-relative
view-projection 25; skinned, object palette 19; world matrix 9; full-screen 8; pass-through 7; own matrices 8; clip
position written by a later stage 3. :observed[79 programs of six captured frames]{games="sekiro"}
In Elden Ring, 15 of the joint-from-normal programs add time, a force parameter or a texture fetch to the position
(by name: grass, vegetation, sway, flag and bird programs). :observed[191 programs of ten captured frames]{games="elden-ring"}

:::open[Which transform forms remain unclassified?]
The camera-relative or absolute test of the previous section covers programs of matrix-times-world form; the census
above adds the forms the draws of these frames use but does not rerun that test on them. The order in which the
`VC_World` programs apply the world matrix and the palette, and which stage writes the clip position where the program
has none, are not established, and programs not bound by these frames are not covered. :unknown
:::
