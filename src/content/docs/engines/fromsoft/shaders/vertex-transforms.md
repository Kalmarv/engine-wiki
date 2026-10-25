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
by itself. :proven[executed vertex programs]{games="elden-ring"}

The execution does not classify a program that fails to return the supplied position under identity inputs or
whose response to moving the camera fits neither form; no transform convention is established for that case.
:unknown

## Joint matrices

The inspected palette-applying programs read each joint as three float4 rows, not columns: 17,455 Elden Ring
programs and 42 Sekiro programs. One additional Elden Ring program reads only joint translations, so its accesses
alone do not distinguish a complete matrix layout. :observed

Some Elden Ring skinned programs apply `VC_aClothCancelObjMatrix` before `VC_aObjMatrix`, giving two distinct
palettes. A vertex-indexed constant-buffer access distinguishes a joint palette from an instance-only object
matrix. :observed{games="elden-ring"}

The runtime buffer extent can exceed the shader's declared extent. The captured c3000 draws and their 256-matrix
palette are described under [nodes and skinning](/engines/fromsoft/geometry/nodes-and-skinning/).

:::open[What are the remaining transform forms?]
The camera-relative/absolute proof applies only to programs classified by that experiment. It does not establish
the behaviour of programs with additional position deformation or missing runtime inputs. :unknown
:::
