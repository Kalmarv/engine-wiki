---
title: SkateBIRD
description: "SkateBIRD's Unity 2019.4 data: loose serialized files, eight skateable scenes, its mission and reset-point scripts, and the traps in its lighting and cameras."
games: [skatebird]
sources:
  - title: UnityPy
    url: https://github.com/K0lb3/UnityPy
    note: reader used as the independent census of the serialized files
  - title: AssetRipper
    url: https://github.com/AssetRipper/AssetRipper
    note: type tree package covering Unity 2019.4.20f1
  - title: PCGamingWiki, SkateBIRD
    url: https://www.pcgamingwiki.com/wiki/SkateBIRD
    note: config and save locations; lists a pre-release engine build
---

SkateBIRD (Glass Bottom Games, 2021) is a skateboarding game where the player is a bird, built on [Unity](/engines/unity/)
2019.4.20f1 with the built-in render pipeline and the Mono scripting backend. :observed{games="skatebird"} The observations on
these pages are of Steam app 971030, build 11275982 (191 files, 3,396,104,486 bytes). :observed{games="skatebird"} The shipped
engine version is 2019.4.20f1; a community page that lists 2018.4.12 dates from a pre-release demo. :observed{games="skatebird"}

## Data in the install

`SkateBIRD_Data` holds 31 serialized files, all container [version 21](/engines/unity/archives/serialized-files/): `level0` to
`level13`, `sharedassets0` to `sharedassets13`, `globalgamemanagers`, `globalgamemanagers.assets` and `resources.assets`.
:proven{games="skatebird"} There are no AssetBundles and no Addressables: the files are loose, `StreamingAssets` holds a 165-byte
readme, and the 104 managed assemblies are in `Managed/`
([player data folder](/engines/unity/archives/player-data-folder/), [scripting backends](/engines/unity/runtime/scripting-backends/)).
:observed{games="skatebird"} Across the 31 files there are 503,045 objects, which an independent reader and the reader of
[the container](/engines/unity/archives/serialized-files/) agree on exactly (path ids, class ids, offsets, sizes).
:proven{games="skatebird"}

| Scene | What | Page |
|---|---|---|
| `level1`, `level2`, `level3`, `level4`, `level5` | bedroom 1, rooftop, office, server room, bedroom 2 | [scripts](/engines/unity/gameplay/skatebird-scripts/) |
| `level7`, `level12`, `level13` | flashback, playground, skate heaven | [scripts](/engines/unity/gameplay/skatebird-scripts/) |
| `level0` | the title screen, itself a playable diorama | [player data folder](/engines/unity/archives/player-data-folder/#skatebird-steam-971030-build-11275982) |

All :observed{games="skatebird"}.

## What is special

- **Mission markers on layer 28.** `Minimap/Mission Marker` spheres are drawn only by the escape-menu map camera; the main camera's
  culling mask `0xe003ff17` excludes the layer ([layers and cameras](/engines/unity/world/layers-and-cameras/)).
  :proven{games="skatebird"}
- **Scripts carry the rules.** Reset points (one flagged as the level start), mission givers, collectibles and rails are
  MonoBehaviours with no type tree ([script fields](/engines/unity/data-model/script-fields/), [scene scripts](/engines/unity/gameplay/skatebird-scripts/)).
  :observed{games="skatebird"}
- **Lighting.** Trilight ambient in the level scenes with stale probes, skybox ambient with zero probes in the platform scenes,
  no baked lightmaps ([ambient light](/engines/unity/lighting/ambient-and-probes/), [lights](/engines/unity/lighting/lights/)).
  :proven{games="skatebird"}
- **Materials.** Built-in shaders shipped as real Shader objects, and a custom Lambert shader with stochastic tiling
  ([built-in shaders](/engines/unity/materials/builtin-shaders/)). :observed{games="skatebird"}
- **Physics.** A solver iteration count of 64, a 60 Hz fixed step and six physic materials
  ([colliders](/engines/unity/collision/colliders/)). :proven{games="skatebird"}
- **Skin weights.** Four influences per vertex, two at the lowest quality levels ([skinning](/engines/unity/geometry/skinning-and-blend-shapes/)).
  :proven{games="skatebird"}
- **Camera and post-processing.** The gameplay profile blurs everything away from the bird
  ([post-processing](/engines/unity/effects/post-processing/)). :observed{games="skatebird"}
- **Version 21 container.** Offsets in the object table are 32 bits; a reader written for version 22 refuses these files.
  :proven{games="skatebird"}

## Community

No dedicated mod platform exists for SkateBIRD; BepInEx 5 can host plugins ([loading code](/engines/unity/mod-loading/bepinex/)).
Config is kept in the registry under `HKCU\Software\Glass Bottom Games\SkateBIRD\` and saves in `saved_*.sav` under the user's
`LocalLow\Glass Bottom Games\SkateBIRD\`. :sourced[PCGamingWiki, SkateBIRD]
