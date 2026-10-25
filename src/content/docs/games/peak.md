---
title: PEAK
description: "PEAK's Unity 6000.3 data: loose serialized files for the menus and island, 208 generated level scenes in seven AssetBundles, Photon networking, and the earlier data.unity3d layout."
games: [peak]
sources:
  - title: peak-more-customizations
    url: https://github.com/Creta5164/peak-more-customizations
    note: community mod with fit documentation (bone order, the W/Character shader)
  - title: unity-peak-project-patcher
    url: https://github.com/Jettcodey/unity-peak-project-patcher
    note: community tool for rebuilding the project
  - title: AssetStudio
    url: https://github.com/Perfare/AssetStudio
    note: fails on the 2.6.b data bundle
---

PEAK (Aggro Crab and Landfall, 2025) is a cooperative climbing game on [Unity](/engines/unity/) 6000.3.15f1, Mono scripting, with
Photon networking. :observed{games="peak"} The observations are of Steam app 3527290, build 26134529, game version 3.0.0
(source revision `91eea2b95`); an earlier recon of 2.6.b (revision `82be08a25`) is noted where it differs.
:observed{games="peak"}

## Data in the install

`PEAK_Data` holds 13 loose serialized files, [version 22](/engines/unity/archives/serialized-files/), Unity 6000.3.15f1:
`level0` to `level4`, `sharedassets0` to `sharedassets4`, `globalgamemanagers`, `globalgamemanagers.assets` and
`resources.assets`. :proven{games="peak"} The build settings list `Pretitle`, `Title`, `MainMenu`, `Airport` and `WilIsland`.
:observed{games="peak"} The game's levels are **208 generated scenes** (`Level_0` to `Level_207`) in seven AssetBundles
`StreamingAssets/maps/levels*.assetbundle`, 2.18 GB each; their serialized files keep their type trees
([bundles](/engines/unity/archives/unityfs-bundles/#peak)). :observed{games="peak"}

The island scene `level4` has 623,157 objects (71,447 mesh renderers, 12,596 LOD groups, 15,658 mesh colliders, 15,173 capsule
colliders) ([scenes](/engines/unity/data-model/scenes-and-hierarchy/)). :observed{games="peak"}

## What is special

- **Build history.** 2.6.b kept the data in one 1,504,357,874-byte `PEAK_Data/data.unity3d`; AssetStudio does not open it (its
  cache is written beside the bundle and the shader parser then fails with `EndOfStreamException`). Build 3.0.0 does not
  have that file ([bundles](/engines/unity/archives/unityfs-bundles/#peak)). :observed{games="peak"}
- **Physics.** Gravity −19.62 m/s², 10 solver iterations, a single quality level ([colliders](/engines/unity/collision/colliders/)).
  :proven{games="peak"}
- **Ambient.** Loose scenes use skybox ambient or a flat ambient of intensity 0.5 with a stale probe
  ([ambient light](/engines/unity/lighting/ambient-and-probes/)). :observed{games="peak"}
- **Layers** include Character, GhostCharacter, Mirror, Hazard, Rope, Terrain, Map, SDF and Vines
  ([layers](/engines/unity/world/layers-and-cameras/)). :proven{games="peak"}
- **Code.** `Managed/` holds Photon (PUN, Realtime, Voice), Zorro utility assemblies, Sirenix Odin, DOTween, Cinemachine, the URP
  packages and Epic and Steam platform code ([scripting backends](/engines/unity/runtime/scripting-backends/),
  [networking](/engines/unity/runtime/networking/)). :observed{games="peak"}
- **Type tree gap.** `PlayerSettings` of 6000.3.15f1 is 4 bytes longer (896) than the layout common packages give (892)
  ([type trees](/engines/unity/data-model/type-trees/#a-short-layout)). :observed{games="peak"}

## Community

PEAK has community mods that load through BepInEx ([loading code](/engines/unity/mod-loading/bepinex/)). The fit documentation of
`peak-more-customizations` flags bone ordering and the `W/Character` shader as the traps for character mods.
:sourced[peak-more-customizations]
