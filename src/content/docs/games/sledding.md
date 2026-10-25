---
title: Sledding Game
description: "Sledding Game's Unity 6000.3 data: the mountain scene, nine terrains with 12,321 trees, URP shaders, FishNet networking, Addressables for localization, and the traps in its data."
games: [sledding]
sources:
  - title: UnityPy
    url: https://github.com/K0lb3/UnityPy
    note: independent reader for the census, mesh, texture, material, terrain and shader comparisons
  - title: AssetRipper
    url: https://github.com/AssetRipper/AssetRipper
    note: type tree package; its entry for the exact patch version matters
---

Sledding Game is a multiplayer sledding game on [Unity](/engines/unity/) 6000.3.12f1 with the Universal Render Pipeline, the IL2CPP
scripting backend and FishNet networking. :observed{games="sledding"} The observations are of Steam app 3438850, build 25351629.
:observed{games="sledding"}

## Data in the install

`Sledding Game_Data` holds seven loose serialized files, all container [version 22](/engines/unity/archives/serialized-files/):
`globalgamemanagers`, `globalgamemanagers.assets`, `level0`, `level1`, `resources.assets`, `sharedassets0` and `sharedassets1`.
:proven{games="sledding"} The build settings list `Boot` (`level0`, empty) and `Main Mountain Scene` (`level1`, the mountain with
the lodge inside it). :observed{games="sledding"} `StreamingAssets/aa` is an Addressables 2.9.1 folder of 50 bundles, almost
all localization ([bundles](/engines/unity/archives/unityfs-bundles/#sledding-games-addressables)); the scripts are in
`GameAssembly.dll` with `il2cpp_data/Metadata/global-metadata.dat` version 39 ([scripting backends](/engines/unity/runtime/scripting-backends/)).
:observed{games="sledding"}

The mountain scene has 151,088 objects, among them 18,069 mesh renderers, 2,507 LOD groups, 4,151 box colliders, 57 lights
([scenes](/engines/unity/data-model/scenes-and-hierarchy/), [lights](/engines/unity/lighting/lights/)). :observed{games="sledding"}

## What is special

- **Terrain.** Nine 1,000 m terrains of 513 × 513 samples, three splat layers each, 12,321 tree instances of three prototypes
  ([terrain](/engines/unity/terrain/terrain-data/)). :proven{games="sledding"}
- **Skybox ambient** with fog on, and one RenderSettings shared by mountain and lodge
  ([ambient light](/engines/unity/lighting/ambient-and-probes/)). :proven{games="sledding"}
- **URP shaders** whose variants keep their textures in parameter blobs (2021.2 layout)
  ([shader objects](/engines/unity/shaders/shader-objects/), [draw keywords](/engines/unity/shaders/draw-keywords/)).
  :observed{games="sledding"}
- **Skinning.** Unlimited bone influences at every quality level, 21 meshes with variable bone counts
  ([skinning](/engines/unity/geometry/skinning-and-blend-shapes/)). :observed{games="sledding"}
- **Humanoid animation.** The frog and yeti avatars with muscle-driven clips
  ([humanoid muscles](/engines/unity/animation/humanoid-muscles/)). :observed{games="sledding"}
- **Traps** in the 6000.3 data: a short `PlayerSettings` layout in common type tree packages, linear base maps, runtime-built
  chairlift cables, text mesh signs, Shapes decals ([scene scripts and traps](/engines/unity/gameplay/sledding-scripts/)).
  :observed{games="sledding"}
- **Physics.** Nine physic materials from Ice Lake (friction 0.01) to Maximum Friction (1000) ([colliders](/engines/unity/collision/colliders/)).
  :proven{games="sledding"}
- **Networking.** FishNet with Epic Online Services and Dissonance voice ([networking](/engines/unity/runtime/networking/)).
  :observed{games="sledding"}

## Layout of the store package

Beside the Steam files the install has `MicrosoftGame.config`, `layout.xml`, `Resources.pri` and store logos, the layout of a
Microsoft Store package. :observed{games="sledding"}
