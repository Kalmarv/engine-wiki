---
title: "Scripting backends: Mono and IL2CPP"
description: "How the games' code ships (Mono assemblies or IL2CPP native code with a metadata file), how to recover class and field layouts from each, and the traps in the IL2CPP dumps."
games: [skatebird, sledding, peak, big-walk]
sources:
  - title: Cpp2IL
    url: https://github.com/SamboyCoding/Cpp2IL
    note: generates dummy managed assemblies from GameAssembly.dll and global-metadata.dat
  - title: ILSpy
    url: https://github.com/icsharpcode/ILSpy
    note: decompiler for the Mono games' managed assemblies
---

Unity runs a game's C# code through one of two backends, and the data folder shows which. :observed

| Game | Backend | Evidence | Confidence |
|---|---|---|---|
| SkateBIRD | Mono | `MonoBleedingEdge/EmbedRuntime/mono-2.0-bdwgc.dll`, `Managed/` with 104 assemblies including `Assembly-CSharp.dll` (1,245,696 bytes) and `Assembly-CSharp-firstpass.dll`; no `GameAssembly.dll` | :observed{games="skatebird"} |
| PEAK | Mono | `MonoBleedingEdge/` and `PEAK_Data/Managed/` (`Assembly-CSharp.dll`, Photon, Zorro, Sirenix, Unity packages) | :observed{games="peak"} |
| Sledding Game | IL2CPP | `GameAssembly.dll` and `Sledding Game_Data/il2cpp_data/Metadata/global-metadata.dat` (version 39, 26,654,580 bytes) | :observed{games="sledding"} |
| Big Walk | IL2CPP | `GameAssembly.dll` and `Big Walk_Data/il2cpp_data/Metadata/global-metadata.dat` (version 39, 20,269,204 bytes) | :observed{games="big-walk"} |

## Mono

A Mono game's code is ordinary .NET assemblies in `Managed/`, readable with a decompiler. SkateBIRD's `Assembly-CSharp.dll`
has 947 type definitions and is not obfuscated; its namespaces include `Skatebirb.Gameplay`, `Skatebirb.Managers` and
`ReflexCLI`. :observed{games="skatebird"} The list of assemblies is repeated in `ScriptingAssemblies.json`.
:observed{games="peak"}

A MonoBehaviour's script identity in a scene is a reference to a `MonoScript` object, which names the assembly, namespace and
class; its field bytes follow the base fields ([script fields](/engines/unity/data-model/script-fields/)). :observed

SkateBIRD's `Assembly-CSharp.dll` never mentions `AssetBundle`, `StreamingAssets` or a mods folder, so the game has no
code path that loads outside content. :observed{games="skatebird"}

## IL2CPP

An IL2CPP game's C# was translated to C++ and compiled into `GameAssembly.dll`. Class, method and field names survive in
`global-metadata.dat` (header magic `0xFAB11BAF`, then the metadata version). :observed{games="sledding big-walk"} Both IL2CPP
games here use **metadata version 39**. :proven{games="sledding big-walk"}

**Cpp2IL** (2022.1.0-pre.21) reads version 39 metadata and writes dummy .NET assemblies with the game's types and signatures,
and a decompiler on those gives the class and method list. :observed{games="big-walk"} For Big Walk the output was about
14,000 signature lines over 120 dummy assemblies. :inferred{games="big-walk"} The dummy assemblies lack serialized fields that the metadata does not give them,
so a type tree generated from them comes out **4 bytes short** on types that serialize such fields: in Big Walk, `PeckSwitch`,
`TrackedPeckState`, `PropHome` and `PlayerPose` (each has a serialized `ticket` field the dummies miss). Types from the
Dissonance voice package do not dump. :observed{games="big-walk"}

The metadata alone is enough to confirm that a class exists: Big Walk's contains `HouseNetworkManager`, `NetworkMinder`,
`PeckSwitch`, `TrackedPeckState`, `PeckManager`, `TicketOffice`, `ITicketed`, `PlayerGrease`, `CullingAgent`, `KcpTransport`,
`HouseAuthenticator`, `WorldManager`, `DevSettings`, `PropHome` and `SaveManager`. :observed{games="big-walk"} Sledding Game's
contains `SkiLift`, `PlayerSledController`, `SnowmanBall` and the FishNet generated code
([Sledding scripts](/engines/unity/gameplay/sledding-scripts/)). :observed{games="sledding"}

## Serialized MonoBehaviour fields under IL2CPP

A stripped IL2CPP player has no type tree for a script's fields either, so the same raw-bytes rule applies. A layout has to
come from the generated assemblies (with the 4-byte caveat above) or from measuring the data. :observed

:::open[A complete field recovery for IL2CPP scripts]
Which serialized fields the dummy assemblies miss, and whether a rule (for example attributes the metadata does not keep)
predicts them, is not established.
:::
