---
title: Big Walk
description: "Big Walk's Unity 6000.3.17f1 IL2CPP build: one 2.45 GB UnityFS data bundle, a single 624,585-object world scene, Mirror networking and its peck puzzle system."
games: [big-walk]
sources:
  - title: Cpp2IL
    url: https://github.com/SamboyCoding/Cpp2IL
    note: dummy assemblies from the IL2CPP metadata
  - title: Mirror
    url: https://github.com/MirrorNetworking/Mirror
    note: the networking library
---

Big Walk (House House) is a cooperative open-world walking and puzzle game on [Unity](/engines/unity/) 6000.3.17f1 with the IL2CPP
scripting backend. :observed{games="big-walk"} The observations are of Steam app 1478500, build 25723723. :observed{games="big-walk"}

## Data in the install

The game's whole data folder is one 2,451,391,952-byte [UnityFS bundle](/engines/unity/archives/unityfs-bundles/),
`Big Walk_Data/data.unity3d` (43,598 blocks, LZ4HC, 19 files, 5.71 GB decompressed); there is no Addressables catalog and no
other bundle. :proven{games="big-walk"} Its 12 serialized files are [version 22](/engines/unity/archives/serialized-files/)
containers of Unity 6000.3.17f1 with their type trees stripped. :proven{games="big-walk"} Beside the bundle:
`il2cpp_data/Metadata/global-metadata.dat` (version 39), `boot.config`, `app.info` and three `sharedassets*.resource` audio
streams. :observed{games="big-walk"}

| Scene file | Role | Objects | Confidence |
|---|---|---|---|
| `level0` | platform init | | :inferred{games="big-walk"} |
| `level1` | menus and the offline base scene (1,026,828 bytes) | | :inferred{games="big-walk"} |
| `level2` | the whole world (91,750,964 bytes) | 624,585 | :proven{games="big-walk"} |
| `level3` | sky (6,772 bytes) | | :inferred{games="big-walk"} |

## What is special

- **One scene, no streaming**: the world is a single scene with 166,795 GameObjects, 61,551 mesh renderers, 18,676 LOD groups and 41,902 box, mesh and capsule colliders ([world and puzzles](/engines/unity/gameplay/big-walk-systems/)).
  :proven{games="big-walk"}
- **Networking.** Mirror with a KCP transport and Epic Online Services; every peer must run the same content
  ([networking](/engines/unity/runtime/networking/)). :observed{games="big-walk"}
- **Puzzle logic.** The peck system, props and homes, tickets for non-networked objects
  ([systems](/engines/unity/gameplay/big-walk-systems/)). :inferred{games="big-walk"}
- **IL2CPP dumps are 4 bytes short** on types that serialize fields the generated stubs lack
  ([scripting backends](/engines/unity/runtime/scripting-backends/)). :observed{games="big-walk"}
- **Loader.** A modded install uses BepInEx 6 with an IL2CPP interop layer ([loading code](/engines/unity/mod-loading/bepinex/)).
  :observed{games="big-walk"}
