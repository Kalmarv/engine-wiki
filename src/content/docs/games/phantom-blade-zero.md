---
title: Phantom Blade Zero
description: "Phantom Blade Zero's Unreal Engine 5 data: an encrypted IoStore container in 66 partitions, version 12 pak files, and what its engine version rests on."
games: [phantom-blade-zero]
sources:
  - title: CUE4Parse
    url: https://github.com/FabianFG/CUE4Parse
    note: reader of pak and IoStore containers; the engine version it ties pak version 12 to
---

Phantom Blade Zero is a game by S-GAME on a custom branch of [Unreal Engine](/engines/unreal/) 5 (project `ProjectPBZ`).
The observations are of Steam app 4115450, build 26266538. :observed{games="phantom-blade-zero"}

## Engine version

Its pak files are version 12, which CUE4Parse reads as Unreal Engine 5.7 :sourced[CUE4Parse]; the executable holds
Unreal Engine 5.6 strings and a change Epic made in 5.8. The base is therefore most likely 5.7 with changes of the
developer's own. :inferred{games="phantom-blade-zero"}

## Data in the install

Content is in `ProjectPBZ/Content/Paks/`: the IoStore container `ProjectPBZ-Windows` (a 47,488,040-byte `.utoc`, 328,220
chunks, and 66 `.ucas` partitions of up to 2 GiB), the global container `global`, the pak `ProjectPBZ-Windows.pak` and
nine movie paks ([IoStore containers](/engines/unreal/archives/iostore-containers/#phantom-blade-zero)).
:observed{games="phantom-blade-zero"} Blocks are Oodle-compressed in 256 KiB blocks, and no Oodle library ships beside
the executable; the audio is Wwise. :observed{games="phantom-blade-zero"}

The executable `platform/steam/PBZ.exe` (signed by S-GAME) is protected by Denuvo anti-tamper, and the install ships no
anti-cheat: no EasyAntiCheat, BattlEye or ACE folder and no kernel driver (no `.sys` file at all); `EOSSDK-Win64-Shipping.dll` is
there without an EasyAntiCheat folder. The other SDKs are Steam, WeGame (`rail_api64`), TapTap and Migu (`MiguGameSDK64` 2.1.4.4
with `CheckEnv.exe`, `MRTCEngine` and `viumsgsdk`), for cloud play, anti-addiction and store features, and
`ProjectPBZ/Binaries/Win64/8za_v2.exe` is an archiver console program signed by S-GAME. :observed[a listing of every executable, library and driver of the
install]{games="phantom-blade-zero"}

## What is special

- **Encrypted containers.** The game container's flags are `0x0b` (compressed, encrypted, indexed) and every pak has an
  encrypted index, all under the zero key GUID; only `global` is unencrypted
  ([IoStore containers](/engines/unreal/archives/iostore-containers/#phantom-blade-zero)). :proven{games="phantom-blade-zero"}
- **Partitioned data.** One table of contents addresses 66 data files, against MECCHA CHAMELEON's one.
  :proven{games="phantom-blade-zero"}

:::open[The packages]
Without the key nothing inside the containers (the file tree, the packages, whether they need property mappings) is
described.
:::
