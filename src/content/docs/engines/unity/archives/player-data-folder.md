---
title: The player data folder
description: "How a Unity Windows player lays out its data: globalgamemanagers, scenes, shared assets, streamed resources, scripts and runtime, per game."
games: [skatebird, sledding, peak, big-walk]
sources:
  - title: Unity manual, Player data and build output
    url: https://docs.unity3d.com/Manual/
    note: general behaviour of the data folder
---

A Unity Windows build is an executable and a `<Name>_Data` folder beside it. The folder holds the scenes and assets as
[serialized files](/engines/unity/archives/serialized-files/), their bulk data in stream files, the managed or IL2CPP
scripts, and a few text files. The files are named by role, not by content, so the build's scene list is what says which
`levelN` is which scene. :observed

## Files and their roles

| File | Holds | Confidence |
|---|---|---|
| `globalgamemanagers` | the project-wide settings objects: the build's scene list (`BuildSettings`), player, graphics, quality, physics, input and tag/layer settings | :observed |
| `globalgamemanagers.assets` | assets those settings reference | :observed |
| `level0`, `level1`, ... | one scene each, in build-settings order: scene *i* is `level<i>` | :proven{games="skatebird"} |
| `sharedassets0.assets`, ... | the assets the scenes reference (meshes, textures, materials, shaders, clips, audio); numbered like the scene that introduced them | :observed |
| `resources.assets` | everything under `Resources/` folders of the project | :observed |
| `*.resS` | the bulk data of the serialized file with the same name: texture pixels, vertex streams | :observed |
| `*.resource` | audio and video streams (`sharedassets9.resource` is SkateBIRD's 857 MB of audio) | :observed |
| `Resources/unity default resources`, `Resources/unity_builtin_extra` | Unity's own built-in assets and shaders, referenced by file id from the other files | :observed |
| `boot.config` | key=value start-up options | :observed |
| `app.info` | two lines: the developer name and the product name | :observed |
| `Managed/` or `il2cpp_data/` | the game's code, see [scripting backends](/engines/unity/runtime/scripting-backends/) | :observed |
| `StreamingAssets/` | files shipped as they are: Addressables or AssetBundles, configuration | :observed |
| `Plugins/x86_64/` | native libraries | :observed |

An object names its streamed bytes with a **StreamingInfo**: an `offset`, a `size` and a `path`. The path is the stream
file's name, plain (`sharedassets0.assets.resS`) in a player and `archive:/<cab>/<name>` for a bundle's stream. The
bytes are `size` bytes at `offset` of that file. :sourced[UnityPy]

Scene numbers line up with the build-settings list in `globalgamemanagers`; the root-object names a scene file carries
can be stale copies from another scene and must not be used to identify it. :observed{games="skatebird"}

## Per game

### SkateBIRD (Steam 971030, build 11275982)

Unity 2019.4.20f1, Mono, built-in render pipeline, 191 files and 3,396,104,486 bytes. :observed{games="skatebird"}
`SkateBIRD_Data` holds `level0` to `level13`, `sharedassets0` to `sharedassets13`, `globalgamemanagers`,
`globalgamemanagers.assets`, `resources.assets`, `Managed/` (104 DLLs, including `Assembly-CSharp.dll`), `Plugins/x86_64/`
and a 165-byte readme in `StreamingAssets/`. :observed{games="skatebird"} The build settings list 14 scenes:

| Index | Scene | Notes |
|---|---|---|
| 0 | title screen | a playable diorama with the player bird |
| 1 | bedroom 1 | |
| 2 | rooftop | |
| 3 | office | its root is labelled `Missions - Server Room`, a stale copy |
| 4 | server room | |
| 5 | bedroom 2 | |
| 6 | credits | |
| 7 | flashback | a root is labelled `Missions - TEST` |
| 8 | loading | background loaded |
| 9 | MasterAudio | background loaded |
| 10 | Win10 Platform | platform airgap |
| 11 | Steam Store Platform | platform airgap |
| 12 | playground | |
| 13 | skate heaven | |

The table is :observed{games="skatebird"}. Size: levels and their `.resS` are 0.26 GB, the shared assets 2.84 GB
(`sharedassets9.resource` and `sharedassets0.assets.resS` the largest), `resources.assets` 2.1 MB. :observed{games="skatebird"}

### Sledding Game (Steam app 3438850, build 25351629)

Unity 6000.3.12f1, IL2CPP (`GameAssembly.dll`, `il2cpp_data/`). :observed{games="sledding"} The data folder has
`level0` and `level1`, `sharedassets0` and `sharedassets1` (with `.resS` and `.resource`), `resources.assets`,
`globalgamemanagers*`, `StreamingAssets/aa` (Addressables, see [bundles](/engines/unity/archives/unityfs-bundles/)) and
`StreamingAssets/EOS`. :observed{games="sledding"} The build settings list `Assets/Scenes/Boot.unity` (`level0`, an
empty boot scene) and `Assets/Scenes/Main Mountain Scene.unity` (`level1`, the mountain). :observed{games="sledding"}
The lodge is inside the mountain scene; there is no lodge scene. :observed{games="sledding"} The shipping package is a
Microsoft Store-style layout (`MicrosoftGame.config`, `layout.xml`, `Resources.pri`) beside the Steam files.
:observed{games="sledding"}

### PEAK 3.0.0 (Steam app 3527290, build 26134529)

Unity 6000.3.15f1, Mono (`Managed/`, `MonoBleedingEdge/`), with the Universal Render Pipeline assemblies in `Managed/`. :observed{games="peak"} Loose files: `level0` to `level4`
(`level4` is 134,642,692 bytes), `sharedassets0` to `sharedassets4`, `resources.assets` (+ 494 MB `.resS` and a 174 MB
`.resource`), `globalgamemanagers*`. :observed{games="peak"} The build settings list `Pretitle`, `Title`, `MainMenu`,
`Airport` and `WilIsland` under `Assets/8_SCENES/`; the game's 208 generated levels come from the seven AssetBundles in
`StreamingAssets/maps`, see [bundles](/engines/unity/archives/unityfs-bundles/). :observed{games="peak"} `version.txt`
beside the executable carries the build number (`3.0.0`) and a short source revision. :observed{games="peak"} The earlier
2.6.b build (revision `82be08a25`) kept its data in `PEAK_Data/data.unity3d`. :observed{games="peak"}

### Big Walk (Steam app 1478500, build 25723723)

Unity 6000.3.17f1, IL2CPP (`GameAssembly.dll`, `il2cpp_data/Metadata/global-metadata.dat`, 20,269,204 bytes).
:observed{games="big-walk"} All of the serialized files are inside the single `data.unity3d`
([UnityFS](/engines/unity/archives/unityfs-bundles/)); `Big Walk_Data` also holds `boot.config`, `app.info`
(`House House` / `Big Walk`), `StreamingAssets/EOS`, `StreamingAssets/PS5`, `Plugins/` and three `.resource` streams.
:observed{games="big-walk"}

## boot.config

The file is plain `key=value` lines. SkateBIRD's has `wait-for-native-debugger=0`, `vr-enabled=0` and
`hdr-display-enabled=0`; the Unity 6 games add `gfx-enable-gfx-jobs=1` and `gfx-threading-mode=6`, and a `build-guid`.
Sledding Game and Big Walk also state `gc-max-time-slice=3`. :observed

## Which Unity version a file states

The version string of the metadata (`2019.4.20f1`, `6000.3.12f1`) is the build's, and the same in every serialized file of
the install. :proven[every serialized file of each install]{games="skatebird sledding peak big-walk"} The `UnityPlayer.dll`
and executable version resources carry the same build (`2019.4.20.7197120` for SkateBIRD). :observed{games="skatebird"}
A community page that lists SkateBIRD's engine as `2018.4.12` dates from a pre-release demo; the shipped build is
`2019.4.20f1`. :observed{games="skatebird"}
