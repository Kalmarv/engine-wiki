---
title: Custom maps for MECCHA CHAMELEON
description: "How the game loads player-made maps: the official mod kit, the content-only plugin a map is, its level and collision requirements, packaging as a cooked DLC, and the Steam Workshop route."
games: [meccha-chameleon]
sources:
  - title: Unreal Engine documentation, DLC and cooking
    url: https://dev.epicgames.com/documentation/en-us/unreal-engine/
    note: BuildCookRun with -DLCName and -basedonreleaseversion; the Project Launcher
---

MECCHA CHAMELEON (Unreal Engine 5.6.1, project `Chameleon`) is built to load user maps. Its install ships the plugins
`SteamWorkshopMaps`, `Mod.io-Main`, `Mod.io-UGC` and `Mod.io-UI` beside the engine's own, in the build's file manifest.
:observed{games="meccha-chameleon"} A map reaches the game as a cooked content package built against the game's own release.
:observed{games="meccha-chameleon"}

## The official mod kit

The developer publishes a mod kit, `MecchaCModKit_Load.zip`: a stock Unreal Engine 5.6 project that includes a cooked reference
map (`SampleMyUGC`). :observed{games="meccha-chameleon"}

## What a map is

A map is a **content-only plugin**: one World Partition level (with streaming off) in `Plugins/<P>/Content/Maps`, using stock
`StaticMeshActor`s and lights only. :observed{games="meccha-chameleon"}

| Requirement | Value | Confidence |
|---|---|---|
| actors | stock StaticMeshActors and lights; no game-specific actor classes | :observed{games="meccha-chameleon"} |
| collision profile | `CameraBlockWall` (a channel named CameraWall) | :observed{games="meccha-chameleon"} |
| UV lookup from hits | `bSupportUVFromHitResults=True` in the project settings | :observed{games="meccha-chameleon"} |
| Nanite | off | :observed{games="meccha-chameleon"} |
| lighting | Lumen with ray tracing | :observed{games="meccha-chameleon"} |
| spawn | fixed at the origin: (0, 0, 100) in the kit's first release and (0, 0, 0) after a game update | :observed{games="meccha-chameleon"} |

:::open[The spawn height]
The kit places the player at the origin at height 100, and after a game update at height 0; which of the two the game uses,
and whether the level can set its own start, is unresolved.
:::

## Packaging

The kit is cooked with the Project Launcher in its legacy form: first a **FullGame** profile with release version 1.0 (the base
the DLC is built against), then a **DLC** profile for the plugin. :observed{games="meccha-chameleon"} The command-line equivalent is `RunUAT BuildCookRun` with
`-DLCName=<plugin>` and `-basedonreleaseversion=<release>`. :sourced[Unreal Engine documentation]

What is shipped, per map, is `<P>MecchaCModKit_Load-Windows.pak`, `.ucas` and `.utoc` (an IoStore container beside a small pak),
`AssetRegistry.bin` and `Preview.png`, uploaded through SteamCMD as a Steam Workshop item. :observed{games="meccha-chameleon"}
The map's `.utoc` and the game's use the same table-of-contents version, 8, and container flags 0x09: unencrypted, unsigned
([IoStore containers](/engines/unreal/archives/iostore-containers/)). :observed{games="meccha-chameleon"}

For a local test the cooked files overwrite the item's folder under the Steam install: `steamapps/workshop/content/4704690/<item
id>/`. :observed{games="meccha-chameleon"}

## Importing meshes

Unreal's Interchange pipeline imports glTF into a level through a headless editor script (`import_scene`, with the level pipeline
creating actors and materials imported as material instances of a chosen parent material). :sourced[Unreal Engine documentation] Collision comes from mesh name
prefixes `UBX_`, `UCP_`, `USP_` and `UCX_` (box, capsule, sphere, convex). :sourced[Unreal Engine documentation]
