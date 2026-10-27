---
title: Skinning and blend shapes
description: "How a Unity mesh stores bone influences (four-influence channels and variable bone counts), bind poses, quality-dependent skin weights, and blend shapes."
games: [skatebird, sledding]
sources:
  - title: Unity scripting reference, SkinWeights and Mesh.GetAllBoneWeights
    url: https://docs.unity3d.com/ScriptReference/SkinWeights.html
    note: the quality setting and the variable-count weights
  - title: UnityPy
    url: https://github.com/K0lb3/UnityPy
    note: the reader used to recover the variable bone count layout
implementations:
  - name: unity-formats (mesh.rs)
    url: https://github.com/Kalmarv/unity-formats/blob/main/src/mesh.rs
---

A skinned mesh is drawn by a **SkinnedMeshRenderer** (class 137) that lists the bone Transforms (`m_Bones`); the mesh stores,
per vertex, which bones influence it and by how much, and per bone a bind pose. :sourced[Unity scripting reference]

## Influences

A mesh can hold its influences in two forms, and the engine draws one of them:

- **Blend channels.** `BlendWeight` (channel 12) and `BlendIndices` (13) hold up to four influences per vertex. Weights are
  Float (0), Float16 (1), UNorm8 (2) or UNorm16 (4); indices UInt8 (6), UInt16 (8) or UInt32 (10). An indices channel without
  a weights channel is one influence of weight 1: a rigid bind of each vertex to one bone. A weights channel without
  indices is not a valid skin. :observed{games="skatebird sledding"}
- **Variable bone counts.** `m_VariableBoneCountWeights.m_Data` is a list of `u32` words. The first *nv* + 1 words (for *nv*
  vertices) are start offsets, as word indices into `m_Data`: `offset[0] = nv + 1` and `offset[nv]` is the length. Vertex *v*'s
  influences are the words `offset[v]` to `offset[v+1]`, each a bone index in the low 16 bits and a weight in the high 16 bits
  as a normalised unsigned 16-bit value (`value / 65535`), sorted by descending weight and summing to 1.
  :observed{games="sledding"}

A mesh with variable bone counts also fills the blend channels with only its first four influences, renormalised. For
Sledding Game's toad body mesh, vertex 0 has eight influences (.4731, .2608, .1681, .0373, .0331, .0234, .0038, .0005)
and the channel holds .5036, .2776, .1789, .0397. :observed{games="sledding"}

## Which form is drawn

`QualitySettings.skinWeights` limits the influences the engine uses: 1, 2, 4, or 255 for unlimited. Unity draws the variable
data only at unlimited weights, and the four-influence channels (cut and renormalised) at four or fewer.
:sourced[Unity scripting reference]

| Game | `skinWeights` per quality level | Which form is drawn | Confidence |
|---|---|---|---|
| Sledding Game | 255 (unlimited) at all three levels | the variable data (21 meshes of the 129 SkinnedMeshRenderers have it) | :observed{games="sledding"} |
| SkateBIRD | 4, and 2 in the lowest two levels | the channels; its meshes never have variable data | :observed{games="skatebird"} |

## Bind poses

`m_BindPose` is one Matrix4x4 per bone, stored row-major, taking the renderer's local space to the bone's local space at bind
time. A bone slot in the influences indexes the renderer's `m_Bones`. :observed A zero-weight influence can name a slot
beyond the bind poses; its weight is zero, so it does not matter. :observed

## Blend shapes

`m_Shapes` holds a mesh's blend shapes in four arrays: `channels` (a name, the CRC-32 of the name that an animation curve
refers to it by, a first frame and a frame count), `shapes` (one per frame: its first vertex entry, entry count, and whether
it carries normal and tangent deltas), `vertices` (sparse deltas: the vertex index and the position, normal and tangent
deltas) and `fullWeights` (the weight each frame is at). Weights run from 0 to 100 for a full shape. :observed{games="sledding"}
The deltas apply to the mesh as stored, before skinning. :sourced[Unity scripting reference]

An animation clip drives a blend shape with a curve on the renderer, bound by the renderer's path hash and the shape's
name hash ([animation clips](/engines/unity/animation/clips/)). :observed{games="sledding"}

## SkateBIRD's bird

SkateBIRD's bird rig lives in `sharedassets0.assets`; the controller, avatar and clips of the bird are described in
[animator controllers](/engines/unity/animation/animator-controllers/). Skinned renderers account for 386 of the 86,103
objects of the playground. :observed{games="skatebird"}
