---
title: Script fields of MonoBehaviours
description: "How a game's own script data is stored after a MonoBehaviour's base fields, the layouts measured for SkateBIRD's scripts and for the Universal Render Pipeline asset."
games: [skatebird, sledding, peak]
sources:
  - title: Universal Render Pipeline source (Unity-Technologies/Graphics)
    url: https://github.com/Unity-Technologies/Graphics
    note: UniversalRenderPipelineAsset field declaration order, asset version 13
implementations:
  - name: primase worlds/skatebird (read/scripts.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/skatebird/src/read/scripts.rs
  - name: unity-formats (pipeline.rs)
    url: https://github.com/Kalmarv/unity-formats/blob/main/src/pipeline.rs
---

A game's own components are **MonoBehaviours** (class id 114). Their [type tree](/engines/unity/data-model/type-trees/)
covers only the base fields; the fields the game's script declares follow in the object's bytes. A player build strips the
script's tree, so these bytes have no description in the file: the layout comes from the script's source or from measuring
the data. :observed

The serialization rules are Unity's: fields in declaration order, every value its type's size, the position padded to 4
bytes after a `bool` field that ends the object or precedes a wider one (a `ResetPosition`'s one flag is followed by three
zero bytes), a string a 32-bit length then the bytes and padding to 4, an object reference 12 bytes (`i32` file id, `i64`
path id; a path id of 0 is null). :observed{games="skatebird sledding"}

A layout read from measured bytes belongs to the Unity version and game build it was measured on. A reader that refuses
bytes of another length, a bool that is neither 0 nor 1, or padding that is not zero fails loudly instead of guessing.
:inferred

## SkateBIRD's scripts

Measured on SkateBIRD's Unity 2019.4.20f1 files: 134 `ResetPosition` scripts and the `MissionGiver` scripts of levels 1 to
5, 7, 12 and 13. :observed{games="skatebird"}

```layout
title: ResetPosition script fields
size: 4
games: [skatebird]
note: The bytes after the MonoBehaviour base fields.
fields:
  - {at: 0, size: 1, type: bool, name: startingPosition, level: proven, note: "1 on the point where the level starts; each level stores at most one such point, level7 none"}
  - {at: 1, size: 3, type: "u8[3]", name: padding, level: proven, note: "zero in every script read"}
```

`MissionGiver`'s first field is the mission's title: a string (a 32-bit length, that many UTF-8 bytes, zero padding to a
multiple of 4); the fields after it are not decoded. :observed{games="skatebird"} An empty title means the giver has none.
:observed{games="skatebird"}

```layout
title: GrindableRail script fields
size: 56
games: [skatebird]
note: One node of a rail; nodes are chained by their references. Measured over the 540 nodes of level1.
fields:
  - {at: 0, size: 12, type: PPtr, name: prev, level: observed, note: "previous node of the chain; a path id of 0 is none"}
  - {at: 12, size: 12, type: PPtr, name: next, level: observed, note: "next node of the chain"}
  - {at: 24, size: 12, type: PPtr, name: reference 3, level: unknown, note: "a reference to another object; its target and meaning are not established"}
  - {at: 36, size: 12, type: PPtr, name: reference 4, level: unknown, note: "a reference to another object; its target and meaning are not established"}
  - {at: 48, size: 8, type: "u8[8]", name: flags, level: unknown, note: "eight bytes, each 0 or 1 in every node read; meaning not established"}
```

A chain of nodes is a rail: start at a node with no `prev`, follow `next`. A chain with no such node is closed.
:observed{games="skatebird"} Chains of a single node carry no curve; a node whose `next` has a `prev` pointing elsewhere
makes the chain follow `next`; two nodes naming the same `next` end the second chain there. :observed{games="skatebird"}

## The Universal Render Pipeline asset

URP's settings live in a `UniversalRenderPipelineAsset` MonoBehaviour per quality level. Its fields are stored in the
class's declaration order, 4 bytes per value (a bool padded to 4), an object reference 12 bytes and an array its count and
elements. The layout is verified for `k_AssetVersion` 13: the three assets of Sledding Game (452 bytes each as read) give
settings equal to the keywords of the shader variants the build keeps for them. :observed{games="sledding"}

| Field group (in order) | Stored as | Confidence |
|---|---|---|
| `k_AssetVersion`, `k_AssetPreviousVersion` | `i32`, `i32` (13) | :observed{games="sledding"} |
| `m_RendererType`, `m_RendererData` | `i32`, reference | :observed{games="sledding"} |
| renderer list | count, then 12 bytes per reference | :observed{games="sledding"} |
| default renderer, depth and opaque texture, downsampling, terrain holes, HDR and its precision, MSAA, render scale, upscaling filter, FSR sharpness | 4 bytes each | :observed{games="sledding"} |
| LOD cross fade (bool), dithering type, SH evaluation mode, light probe system, probe volume budgets, flags and SH bands | 4 bytes each | :observed{games="sledding"} |
| main light mode (0 disabled, 1 per pixel, 2 per vertex), main light shadows, shadow map resolution | 4 bytes each | :observed{games="sledding"} |
| additional lights mode, per-object limit, additional light shadows and its resolution tiers | 4 bytes each | :observed{games="sledding"} |
| reflection probe blending, box projection, atlas | bool each, 4 bytes | :observed{games="sledding"} |
| shadow distance (`f32`), cascade count (1 to 4), cascade splits and border, depth and normal bias | 4 bytes each, splits 4 + 8 + 12 | :observed{games="sledding"} |
| soft shadows, enclosing sphere, soft quality, cookie resolution and format, SRP batcher, dynamic batching | 4 bytes each | :observed{games="sledding"} |
| mixed lighting, light cookies, light layers | bool each | :observed{games="sledding"} |

The later fields (batching, post-processing, the GPU resident drawer) follow; the layout past the first of them is not
verified. :observed{games="sledding"} Another asset version has another layout and is refused.
:inferred

### PEAK's pipeline

PEAK has one pipeline asset, `URPAsset` (asset version 13, in `globalgamemanagers.assets`), used by the graphics settings and every
quality level: depth texture and opaque texture required, MSAA 1, and two renderers, `URP_Renderer` (the default, index 0) and
`URP_RenderTexture`. :observed{games="peak"} Both are `UniversalRendererData` of asset version 3 in URP 17.3's layout, which
ends at `m_IntermediateTextureMode` (17.6 adds `m_TileOnlyMode`), the deprecated shader references coming before the feature
list; both renderers' bytes are consumed exactly. :observed{games="peak"}

| Setting | `URP_Renderer` | `URP_RenderTexture` | Confidence |
|---|---|---|---|
| Rendering mode | 2, Forward+ | 2, Forward+ | :observed{games="peak"} |
| Depth priming | 0, disabled | 0, disabled | :observed{games="peak"} |
| Copy depth | 1, after transparents | 1, after transparents | :observed{games="peak"} |
| Prepass layer mask | `0x8A309437` | `0x82318437` | :observed{games="peak"} |
| Opaque layer mask | `0x8A31D437` (adds layers 14, `Hazard`, and 16) | `0x82318437` | :observed{games="peak"} |
| Depth formats, accurate G-buffer normals | default, on | default, on | :observed{games="peak"} |

`URP_Renderer` has 15 renderer features, of which the stored active ones are an SCPE `EdgeDetectionRenderer`, a
`DecalRendererFeature` (technique 1, DBuffer, maximum draw distance 500, surface data 2: albedo, normal and MAOS, the
`_DBUFFER_MRT3` keyword) and two of its five `FullScreenPassRendererFeature`s; HBAO and the other SCPE effects are stored
inactive. :observed{games="peak"} The cameras of the scenes (`MainCamera` in `level0`, `level1`, `level2` and `level4`) use the
default renderer (index −1) with the depth option 2, the pipeline's setting; `HeroCamera` (renderer 1) and `PassportCamera` render
into textures. :observed{games="peak"}

So the frame has a full depth-normals prepass: in the game's own URP code (`Unity.RenderPipelines.Universal.Runtime.dll`), the
DBuffer pass asks for depth and normals, a forward renderer then runs a whole prepass (the partial one is for deferred), and with
depth priming off the depth copy is scheduled during the prepass, which renders into `_CameraDepthTexture` and sets it globally.
An opaque `UniversalForward` or `UniversalForwardOnly` program that samples `_CameraDepthTexture` therefore reads the prepass's
depth, which holds the opaque-queue renderers of the prepass layer mask drawn through their `DepthNormals` or
`DepthNormalsOnly` pass. :inferred[from the game's URP code, decompiled]{games="peak"} PEAK's `W/Peak_*` shaders have
`UniversalForwardOnly`, `ShadowCaster`, `DepthOnly`, `DepthNormalsOnly` and `MotionVectors` passes. :observed{games="peak"}

:::open[Script field layouts of the other games]
PEAK's and Big Walk's scripts are not decoded here. The IL2CPP games' script classes can be recovered from the generated
managed stubs, see [scripting backends](/engines/unity/runtime/scripting-backends/); the field order recovered that way is
4 bytes short on types with serialized fields the stubs lack.
:::
