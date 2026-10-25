---
title: "Sekiro: Shadows Die Twice"
description: Sekiro's observed PC data, archive organization and engine-format differences.
games: [sekiro]
sources:
  - title: SoulsFormats
    url: https://github.com/JKAnderson/SoulsFormats
  - title: UXM Selective Unpack
    url: https://github.com/Nordgaren/UXM-Selective-Unpack
  - title: Paramdex
    url: https://github.com/soulsmods/Paramdex
  - title: Sekiro modding wiki
    url: https://github.com/SekiroResurrection/modding-wiki/wiki
  - title: DSAnimStudio
    url: https://github.com/Meowmaritus/DSAnimStudio
---

Sekiro is FromSoftware's 2019 action game, using the [FromSoftware engine](/engines/fromsoft/).
:sourced[Sekiro modding wiki] File observations refer to the Steam install recorded on 2026-10-10; live pose and
render-state observations use executable version 1.06. :observed

## Data in the install

`Data1` through `Data5` sit beside the executable as `.bhd`/`.bdt` archive pairs. Their path hashes are 32-bit
base-37 hashes; the indexes and file ranges are encrypted. Public keys and path dictionaries are distributed with
UXM. See [BHD5/BDT](/engines/fromsoft/archives/bhd5-bdt/). :proven

| Path inside the archives | Contents | Confidence |
|---|---|---|
| `map/mapstudio/*.msb.dcx` | Map layouts | :observed |
| `map/<map>/` | Map models, collision and auxiliary data | :observed |
| `chr/` | Character model and animation binders | :observed |
| `obj/` | Object binders with models and optional collision or animations | :observed |
| `parts/` | Equipment parts and shared body textures | :observed |
| `param/gameparam/gameparam.parambnd.dcx` | Gameplay parameter tables | :observed |
| `param/drawparam/` | GPARAM graphics environments | :observed |
| `event/` | EMEVD event scripts | :observed |

Files commonly have [DCX Kraken envelopes](/engines/fromsoft/archives/dcx/) and
[BND4 binders](/engines/fromsoft/archives/bnd4/). :observed

## Distinctive data rules

[MSBS layouts](/engines/fromsoft/world/msb/) place parts in a shared frame; MapOffset places map-local collision
without reapplying the offset to those parts. :observed [EDGE records](/engines/fromsoft/gameplay/edge/) describe
grapple, hang and wall-hug traversal. :observed

Map collision uses [Havok 2016.2 tagfiles](/engines/fromsoft/collision/havok/), while character motion uses
[Havok clips](/engines/fromsoft/animation/havok-clips/) and [TAE actions](/engines/fromsoft/animation/tae/).
:observed [NPC masks](/engines/fromsoft/data-model/params/) and
[EMEVD world state](/engines/fromsoft/gameplay/emevd/) select different kinds of visible content. :observed

The captured renderer uses [D3D11 deferred contexts](/engines/fromsoft/runtime/render-state/). :observed
