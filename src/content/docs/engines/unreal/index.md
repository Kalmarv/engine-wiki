---
title: Unreal Engine
description: "Unreal Engine 5 as MECCHA CHAMELEON ships it: IoStore containers beside a pak file, and the content-only plugin that makes a custom map."
sources:
  - title: Unreal Engine
    url: https://github.com/EpicGames/UnrealEngine
    note: source (access requires an Epic-linked GitHub account)
  - title: CUE4Parse
    url: https://github.com/FabianFG/CUE4Parse
    note: reader of pak and IoStore containers and Unreal assets
---

Unreal Engine 5 keeps a game's cooked content in **packages** (`.uasset`, `.uexp`, `.ubulk`), which a shipped game stores inside
containers rather than as loose files. The game documented here is **MECCHA CHAMELEON** (Steam app 4704690, Unreal Engine 5.6.1,
executable `PenguinHotel`, project `Chameleon`). :sourced[Unreal Engine source]

| Area | MECCHA CHAMELEON | Page | Confidence |
|---|---|---|---|
| content container | IoStore: a `.utoc` table of contents (version 8, flags 0x09: compressed, indexed, unencrypted, unsigned) with a `.ucas` data file, Oodle-compressed in 64 KiB blocks | [IoStore containers](/engines/unreal/archives/iostore-containers/) | :proven{games="meccha-chameleon"} |
| global data | a second container, `global`, with one script-objects chunk | [IoStore containers](/engines/unreal/archives/iostore-containers/#chunks-and-blocks) | :proven{games="meccha-chameleon"} |
| other files | a version 11 pak | [IoStore containers](/engines/unreal/archives/iostore-containers/#the-pak-file) | :observed{games="meccha-chameleon"} |
| user maps | a content-only plugin with one World Partition level, cooked as a DLC and shipped as a Steam Workshop item | [custom maps](/engines/unreal/mod-loading/custom-maps/) | :observed{games="meccha-chameleon"} |

The game ships plugins for Steam Workshop maps and for mod.io user content, with its Epic Online Services integration and
Mocopi live-link plugin; its cooked content is not encrypted or signed, so the containers can be read as they are.
:observed{games="meccha-chameleon"}

:::open[Asset formats]
The packages inside the containers (the export bundle layout, the class registry of Unreal 5.6, materials, meshes and levels as
this game cooks them) are not described here; only the container level and the custom-map route are.
:::
