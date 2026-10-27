---
title: Sledding Game scene scripts and traps
description: "Sledding Game's own classes and the places where its Unity 6000.3 scene data is not what the serialized objects say: runtime-built chairlift cables, text mesh signs, procedural decals, opaque trees."
games: [sledding]
---

Sledding Game (Unity 6000.3.12f1, IL2CPP) keeps its rules in scripts whose fields have no type tree
([script fields](/engines/unity/data-model/script-fields/)). The class names are in its IL2CPP metadata
(`il2cpp_data/Metadata/global-metadata.dat`, version 39, 26,654,580 bytes). :observed{games="sledding"}

## Classes the metadata names

| Class | Role | Confidence |
|---|---|---|
| `PlayerSledController`, `Sled`, `SledSeat` | the sled the player rides and its seat | :observed{games="sledding"} |
| `SkiLift`, `SkiLiftChair` | the chairlifts and their chairs; chairlift achievements count full loops, rides with two or more people and distance travelled | :observed{games="sledding"} |
| `SnowmanBall`, `PlayerSnowmanRollingController` | the rolled snowman balls, with `Cmd_PushSnowmanBall` and `Cmd_DestroySnowmanBall` network calls | :observed{games="sledding"} |
| `LodgeMicController`, `ResetPlayerToLodge`, `GetLodgeLocation` | the lodge, where players are reset to | :observed{games="sledding"} |
| `ACH_SLEDDING_GAME`, `ACH_SLED_MASTER`, `ACH_MY_SLED_IS_COOLER`, ... | achievements | :observed{games="sledding"} |

The generated `FishNet.Serializing.Generated` readers and writers (`GRead___…`, `GWrite___…`), `NetworkInitialize___Early…` and
`Awake_UserLogic_…` methods show the game's networked classes are built on FishNet
([networking](/engines/unity/runtime/networking/)). :observed{games="sledding"}

## Where the serialized objects are not the whole story

These are the places where reading the scene's objects gives the wrong picture of the game. They come from reading the mountain
scene (`level1`) and have not been rechecked. :inferred{games="sledding"}

| Trap | What the data holds | What the game does | Confidence |
|---|---|---|---|
| chairlift cables | the serialized `LineRenderer` is a stub | the `SkiLift` script rewrites the cable at runtime from the towers and hubs | :inferred{games="sledding"} |
| sign text | TextMeshPro strings in the object's raw bytes (open-source field order), fonts are the game's own TTFs | text drawn by TextMesh Pro | :inferred{games="sledding"} |
| RectTransform positions | `m_LocalPosition` is stale | the position derives from the anchors ([scenes](/engines/unity/data-model/scenes-and-hierarchy/)) | :inferred{games="sledding"} |
| decals (Shapes package) | no type tree for the Shapes components; the mesh is a placeholder | the shaders build lines, discs, triangles and rings from component data; 108 lines, 26 triangles and 4 rings were identified from values | :inferred{games="sledding"} |
| pines | 12,321 tree instances (build 25351629) of a SpeedTree 7 material (`Tree Mat`, geometry type mesh): trunk and needles in one opaque mesh, no alpha test | opaque pines | :inferred{games="sledding"} |
| fires | 19 particle systems | flames and smoke | :inferred{games="sledding"} |
| edge-of-world slabs | 5 km-long backdrop slabs in the scene | a backdrop beyond the 3 km mountain | :inferred{games="sledding"} |

## Traps in the Unity 6000.3 data

- **PlayerSettings layout.** The AssetRipper type tree package shipped in UnityPy 1.25.4 has no 6000.3.12f1 entry; its
  6000.3.11f1 layout for `PlayerSettings` is 4 bytes short of the 940-byte object ([type trees](/engines/unity/data-model/type-trees/#a-short-layout)).
  :observed{games="sledding"}
- **Linear base maps.** A Texture2D with `m_ColorSpace` 0 used as a base map is sampled as linear data, darker than an sRGB base map
  ([textures](/engines/unity/textures/textures/#colour-space-and-normal-maps)). :observed{games="sledding"}
- **Variable bone counts.** 21 skinned meshes store more than four influences per vertex, and the game draws them all
  ([skinning](/engines/unity/geometry/skinning-and-blend-shapes/)). :observed{games="sledding"}
- **Field name families.** Physic material fields are `m_`-prefixed in this build ([type trees](/engines/unity/data-model/type-trees/#field-names-differ-by-version)).
  :proven{games="sledding"}
- **Additive planes.** Aurora planes are large quads (about 3 km) on an additive shader. :inferred{games="sledding"}

## The lodge

The lodge is inside the mountain scene (there is no lodge scene); the scene stores one ambient light for both. In build
25351629 it is a skybox-mode ambient of intensity 1 whose probe averages (0.1792, 0.2244, 0.3062)
([ambient light](/engines/unity/lighting/ambient-and-probes/)). :proven{games="sledding"} In build 26054124 it is a trilight ambient
of intensity 1 with HDR colours. :observed{games="sledding"}

:::open[Lighting inside the lodge]
Whether the game varies ambient light inside the lodge with a volume of its own is a separate question the scene's single
RenderSettings does not answer.
:::
