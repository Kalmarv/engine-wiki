---
title: MECCHA CHAMELEON
description: "MECCHA CHAMELEON's Unreal Engine 5.6.1 data: IoStore containers and a pak, and the content-only plugin route for custom maps through the Steam Workshop."
games: [meccha-chameleon]
sources:
  - title: Unreal Engine
    url: https://github.com/EpicGames/UnrealEngine
    note: the engine; container formats (source access requires an Epic-linked GitHub account)
---

MECCHA CHAMELEON is a game on [Unreal Engine](/engines/unreal/) 5.6.1 (executable `PenguinHotel`, project `Chameleon`). The
observations are of Steam app 4704690, build 25293176. :observed{games="meccha-chameleon"}

## Data in the install

Content is in `Chameleon/Content/Paks/`: the IoStore container `Chameleon-Windows` (a 2,526,778-byte `.utoc` and a 3,105,798,464-byte
`.ucas`, 12,407 chunks), the global container `global`, and an 88,565,611-byte version 11 pak
([IoStore containers](/engines/unreal/archives/iostore-containers/)). :proven{games="meccha-chameleon"} The containers are
unencrypted and unsigned; blocks are Oodle-compressed. :proven{games="meccha-chameleon"} The install also has `Engine/` (the
engine's content and config), two manifests of the shipped files (20,835 and 24 entries) and a plugin folder with the Mocopi
live-link plugin. :observed{games="meccha-chameleon"}

## What is special

- **Custom maps by design.** The game ships Steam Workshop and mod.io plugins; the developer publishes a mod kit and a map is a
  content-only plugin cooked as DLC ([custom maps](/engines/unreal/mod-loading/custom-maps/)). :observed{games="meccha-chameleon"}
- **A map's requirements.** One World Partition level with streaming off, stock actors, the collision profile `CameraBlockWall`,
  Nanite off, Lumen with ray tracing, a spawn at the origin ([custom maps](/engines/unreal/mod-loading/custom-maps/)).
  :observed{games="meccha-chameleon"}
- **Container version.** TOC version 8, flags 0x09, for the game's and a map's containers alike
  ([IoStore containers](/engines/unreal/archives/iostore-containers/#the-utoc-header)). :proven{games="meccha-chameleon"}
