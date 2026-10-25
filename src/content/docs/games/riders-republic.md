---
title: "Riders Republic"
description: "Riders Republic\u2019s installed archives, evidence build and Anvil resource systems."
games: ["riders-republic"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
---

Riders Republic is Ubisoft Annecy's outdoor sports game using the Anvil engine. The recorded install is Steam app 2290180, build **25394987**; its executable is `RidersRepublic.exe`, with Ubisoft Connect and a `RidersRepublic_BE.exe` BattlEye launcher present. :observed

## Installed data

The six forge archives sit beside the executable. The main open world is MAD_USNAT; MAD_WhiteRoom is a small test-level dataset. :observed

| Archive | Stored bytes | Confidence |
|---|---:|---|
| `DataPC.forge` | 7,123,931,172 | :observed |
| `DataPC_patch_01.forge` | 937,196,599 | :observed |
| `DataPC_MAD_USNAT.forge` | 15,650,919,308 | :observed |
| `DataPC_MAD_USNAT_patch_01.forge` | 1,331,014,794 | :observed |
| `DataPC_MAD_WhiteRoom.forge` | 8,951,822 | :observed |
| `DataPC_MAD_WhiteRoom_patch_01.forge` | 1,021,872 | :observed |

The archive index census contains 1,301,684 entries spanning 905 type ids, including null/meta entries and both base and patch copies. These are not unique runtime resources. See the [complete type inventory](/engines/anvil/data-model/type-inventory/) for per-forge counts and independently graded names. :observed

## Data systems

The [forge container](/engines/anvil/archives/forge/) is version 27; ordinary [data blocks](/engines/anvil/archives/data-blocks/) use Zstandard and zero-seeded Adler-32 checksums. [Resource headers](/engines/anvil/data-model/resources/) distinguish type hashes from ClassIDs. :observed

The world uses [grids](/engines/anvil/world/grids/), [entities and groups](/engines/anvil/data-model/entities/), [local instances](/engines/anvil/world/placement/), [LOD selectors](/engines/anvil/world/lod-selector/) and [DataLayers](/engines/anvil/world/data-layers/). Collision uses [MeshShape](/engines/anvil/collision/mesh-shape/) or [primitive/compound shapes](/engines/anvil/collision/primitive-shapes/), independently of render geometry. :observed

[Animation clips](/engines/anvil/animation/clips/) map tracks to [skeleton](/engines/anvil/animation/skeletons/) bone-name hashes. [Splash and FX](/engines/anvil/effects/effect-entities/) provide particle and effect sequencing, and [BuildTables](/engines/anvil/data-model/build-tables/) describe customization resources. :observed

## Executable evidence

The checked executable is 41,742,840 bytes and has no raw `.text` bytes on disk. Its `.upx0`, `.upx1` and `.upx2` names resemble UPX, but the file lacks UPX magic and the UPX recognizer rejects it. Those section names alone do not establish UPX packing. :observed

The unpacked runtime image contains [class registration strings and field metadata](/engines/anvil/data-model/class-registry/) absent from the disk image. Static string scans of the packed file therefore cannot establish that a class name is absent from the engine. :observed

:::open[What are the exact engine revision and offline-mode requirements?]
Neither a precise public Anvil revision nor independent offline Zen Mode availability is established by the archive and runtime-image evidence. :unknown
:::
