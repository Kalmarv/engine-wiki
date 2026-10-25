---
title: Elden Ring
description: Elden Ring's PC archives, regulation, map tiles and observed runtime differences.
games: [elden-ring]
sources:
  - title: SoulsFormatsNEXT
    url: https://github.com/soulsmods/SoulsFormatsNEXT
  - title: UXM Selective Unpack
    url: https://github.com/Nordgaren/UXM-Selective-Unpack
  - title: Paramdex
    url: https://github.com/soulsmods/Paramdex
  - title: Smithbox
    url: https://github.com/vawser/Smithbox
  - title: DSAnimStudio
    url: https://github.com/Meowmaritus/DSAnimStudio
---

Elden Ring is FromSoftware's 2022 action RPG in the [FromSoftware engine](/engines/fromsoft/) lineage.
:sourced[Smithbox] File observations use regulation 11730034; the recorded runtime capture identifies App 1.17.2
and calibrations 1.17.3. These identify the observed data and runtime separately. :observed

## Data in the install

The game uses `Data0` through `Data3`, an optional `DLC` archive pair, and sound pairs `sd/sd` and `sd/sd_dlc02`.
Their path hashes are 64-bit base-133 hashes. See [BHD5/BDT](/engines/fromsoft/archives/bhd5-bdt/). :proven

| Path | Contents | Confidence |
|---|---|---|
| `regulation.bin`, beside the executable | Encrypted gameplay-parameter binder | :observed |
| `map/mapstudio/*.msb.dcx`, inside archives | MSBE layouts | :observed |
| `map/<map>/`, inside archives | Map resources and collision | :observed |
| `asset/aeg/`, inside archives | Placed asset geometry and separate collision binders | :observed |
| `chr/`, inside archives | Character models and divided animation sets | :observed |
| `parts/`, inside archives | Equipment models and common body textures | :observed |
| `param/drawparam/`, inside archives | GPARAM graphics and weather-related files | :observed |
| `event/`, inside archives | EMEVD event scripts | :observed |

## Differences from Sekiro

[MSBE](/engines/fromsoft/world/msb/) has assets in place of Sekiro's object part kind and no MapOffset event.
:observed Open-world areas `m60` and `m61` use [nested tiles](/engines/fromsoft/world/areas-and-tiles/) beginning at
256 m, with larger parent layouts carrying additional assets. :observed

Collision and animation use [Havok 2018.1](/engines/fromsoft/collision/havok/); compressed collision can reference
extern shapes. :observed [Regulation](/engines/fromsoft/data-model/params/) wraps the param binder in AES-CBC and a
ZSTD DCX envelope. :observed Character motion uses [companion animation divisions](/engines/fromsoft/animation/havok-clips/)
and [TAE](/engines/fromsoft/animation/tae/) action records. :observed

The [D3D12 capture](/engines/fromsoft/runtime/render-state/) shows draw-dependent palette bounds and dynamic
material constants; neither is completely described by shader declarations alone. :observed
