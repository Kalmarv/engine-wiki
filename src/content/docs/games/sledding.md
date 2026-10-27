---
title: Sledding Game
description: "Sledding Game's Unity 6000.3 data: the mountain scene, terrains with their trees, URP shaders, FishNet networking, Addressables for localization, and the traps in its data."
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
scripting backend and FishNet networking. :observed{games="sledding"} The observations are of Steam app 3438850, build 26054124. :observed{games="sledding"} Statements below that name build
25351629 were made on the earlier build and are not rechecked on 26054124; statements that name no build were made on 25351629
unless they say otherwise, and have not been rechecked on 26054124. :observed{games="sledding"}

## Data in the install

`Sledding Game_Data` holds seven loose serialized files, all container [version 22](/engines/unity/archives/serialized-files/):
`globalgamemanagers`, `globalgamemanagers.assets`, `level0`, `level1`, `resources.assets`, `sharedassets0` and `sharedassets1`.
:proven{games="sledding"} The build settings list `Boot` (`level0`, empty) and `Main Mountain Scene` (`level1`, the mountain with
the lodge inside it). :observed{games="sledding"} `StreamingAssets/aa` is an Addressables 2.9.1 folder of 50 bundles, almost
all localization ([bundles](/engines/unity/archives/unityfs-bundles/#sledding-games-addressables)); the scripts are in
`GameAssembly.dll` with `il2cpp_data/Metadata/global-metadata.dat` version 39 ([scripting backends](/engines/unity/runtime/scripting-backends/)).
:observed{games="sledding"}

In build 25351629 the mountain scene has 151,088 objects, among them 18,069 mesh renderers, 2,507 LOD groups, 4,151 box colliders,
57 lights ([scenes](/engines/unity/data-model/scenes-and-hierarchy/), [lights](/engines/unity/lighting/lights/)). :observed{games="sledding"}
In build 26054124 the scene draws 25 terrains and keeps 5,790 mesh renderers after the LOD and active-state rules (3,944 in
25351629), 21,147 terrain tree renderers (12,321 in 25351629) and 56 shining non-directional lights (53 in 25351629).
:observed{games="sledding"} The path ids of objects in `sharedassets1` and `resources.assets` are renumbered between the two builds
(a hot cocoa mug is `sharedassets1` 835 in 25351629 and 1126 in 26054124) while its geometry is identical. :observed{games="sledding"} Over all shaders of build
26054124 there are 5,987 fragment-program player variants in 375 shaders (9,182 in 347 shaders in 25351629). :observed{games="sledding"}

## What is special

- **Terrain.** Build 26054124 draws 25 terrains with 21,147 tree renderers. :observed{games="sledding"} Build 25351629 has nine
  1,000 m terrains of 513 × 513 samples, three splat layers each, 12,321 tree instances of three prototypes
  ([terrain](/engines/unity/terrain/terrain-data/)). :proven{games="sledding"}
- **Ambient light.** Build 26054124 stores trilight ambient with HDR colours and no skybox material, and a named sun
  ([ambient light](/engines/unity/lighting/ambient-and-probes/)). :observed{games="sledding"} Build 25351629 stores skybox ambient
  with fog on, and one RenderSettings shared by mountain and lodge. :proven{games="sledding"}
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
