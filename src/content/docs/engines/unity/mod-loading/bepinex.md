---
title: Loading code into Unity games (BepInEx and Doorstop)
description: "How plugins are loaded into the Mono and IL2CPP Unity games: Unity Doorstop and BepInEx 5 or 6, what each game's data allows, and the loader files each install shows."
games: [skatebird, peak, big-walk, sledding]
sources:
  - title: BepInEx
    url: https://github.com/BepInEx/BepInEx
    note: the plugin loader; version 5 for Mono games, version 6 for IL2CPP
  - title: Unity Doorstop
    url: https://github.com/NeighTools/UnityDoorstop
    note: the proxy DLL that starts BepInEx before the game's code
  - title: peak-more-customizations
    url: https://github.com/Creta5164/peak-more-customizations
    note: community PEAK mod and its fit documentation (bone order, the game's character shader)
  - title: unity-peak-project-patcher
    url: https://github.com/Jettcodey/unity-peak-project-patcher
    note: community tool for PEAK
---

None of the Unity games here has a built-in mod loader. Code reaches them through **Unity Doorstop**, a proxy DLL placed beside
the executable (`winhttp.dll`) that reads `doorstop_config.ini` and runs `BepInEx\core\BepInEx.Preloader.dll` before the game's
code. :sourced[Unity Doorstop] **BepInEx** then loads plugin assemblies from `BepInEx/plugins`. :sourced[BepInEx]

| Game | Loader | What a loader-equipped install shows | Confidence |
|---|---|---|---|
| SkateBIRD (Mono) | BepInEx 5 (x64) | the game's code never loads a bundle or a mods folder, so a loader has to be injected | :observed{games="skatebird"} |
| PEAK (Mono) | BepInEx 5 | `winhttp.dll`, `doorstop_config.ini` (Doorstop with the preloader as target assembly) and a `BepInEx/plugins` folder beside `PEAK.exe` | :observed{games="peak"} |
| Big Walk (IL2CPP) | BepInEx 6 | `winhttp.dll`, `doorstop_config.ini`, a `dotnet` runtime folder and `BepInEx/interop`, `core`, `cache`, `config` folders, which are an IL2CPP loader's layout | :observed{games="big-walk"} |

The loader files in the table are not part of the shipped game; they are what an install with the loader added looks like.
:observed

BepInEx 6's changelog in the Big Walk install lists "improved support for IL2CPP metadata v23 to 106 (Unity 6+)" and a Doorstop
upgrade to 4.5.0. :observed{games="big-walk"}

## What a plugin can do in each game

A plugin on a Mono game can call `AssetBundle.LoadFromFile`, `SceneManager.LoadScene(..., LoadSceneMode.Additive)` and set the
camera. It must be built against assemblies of the same Unity line (SkateBIRD's 2019.4.20f1) for serialized compatibility.
:sourced[BepInEx]

For SkateBIRD, a plugin placed in a copy of the install can load scenes, teleport the player and lock `Camera.main` at an exact
pose and field of view with the HUD, the bird and the lens effects off. The game runs without Steam: its `SteamClient.Init`
failure is caught. :observed{games="skatebird"}

PEAK's community documents flag two fitting traps for character mods: the order of the bones and the game's `W/Character`
shader. :sourced[peak-more-customizations]

## Community scene

SkateBIRD has no dedicated mod platform: its Thunderstore community page does not exist, the Nexus page showed no mods, and the
Steam guides cover no modding. Ten GitHub repositories (`SIGFAI/skatebird-*`, updated October 2026) are AI-generated "takeover"
plugins built on BepInEx 5. :sourced[GitHub search, 2026-10-18]

:::open[Loading a Sledding Game plugin]
Sledding Game's install ships FishNet and has no Doorstop files; how a plugin would be loaded into this IL2CPP build is not
established.
:::
