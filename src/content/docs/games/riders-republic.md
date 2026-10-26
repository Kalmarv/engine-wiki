---
title: "Riders Republic"
description: "Riders Republic\u2019s installed archives, evidence build and Anvil resource systems."
games: ["riders-republic"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
  - title: "Games Explained: From Game Engines to Going Gold (Ubisoft News)"
    url: https://news.ubisoft.com/en-us/article/P8R9SX3LGlQrlXuTuwAfQ
    note: Ubisoft names Anvil as the engine of Assassin's Creed, Riders Republic, For Honor and Ghost Recon.
---

Riders Republic is Ubisoft Annecy's outdoor sports game. Ubisoft names Anvil, developed by Ubisoft Montreal, as its engine. :sourced[Ubisoft News]

The recorded install is Steam app 2290180, build **25394987**; its executable is `RidersRepublic.exe`, with Ubisoft Connect and a `RidersRepublic_BE.exe` BattlEye launcher present. :observed

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

Every table of the six installed forges reads without refusals; their complete index census contains 1,301,684 entries spanning 905 type ids, including null/meta entries and both base and patch copies. These are not unique runtime resources. See the [complete type inventory](/engines/anvil/data-model/type-inventory/) for per-forge counts and independently graded names. :proven

## Data systems

The [forge container](/engines/anvil/archives/forge/) is version 27; ordinary [data blocks](/engines/anvil/archives/data-blocks/) use Zstandard and zero-seeded Adler-32 checksums. [Resource headers](/engines/anvil/data-model/resources/) distinguish type hashes from ClassIDs. :observed

The world uses [grids](/engines/anvil/world/grids/), [entities and groups](/engines/anvil/data-model/entities/), [local instances](/engines/anvil/world/placement/), [LOD selectors](/engines/anvil/world/lod-selector/) and [DataLayers](/engines/anvil/world/data-layers/). Collision uses [MeshShape](/engines/anvil/collision/mesh-shape/) or [primitive/compound shapes](/engines/anvil/collision/primitive-shapes/), independently of render geometry. :observed

[Animation clips](/engines/anvil/animation/clips/) map tracks to [skeleton](/engines/anvil/animation/skeletons/) bone-name hashes. [Splash and FX](/engines/anvil/effects/effect-entities/) provide particle and effect sequencing, and [BuildTables](/engines/anvil/data-model/build-tables/) describe customization resources. :observed

## Executable evidence

The checked executable is 41,742,840 bytes and has no raw `.text` bytes on disk. Its `.upx0`, `.upx1` and `.upx2` names resemble UPX, but the file lacks UPX magic and the UPX recognizer rejects it. Those section names alone do not establish UPX packing. :observed

The entry point, RVA `0x06780029`, lies in `.upx2`; the span of `.upx2` from RVA `0x48F3000` to `0x66F3000` has byte entropy 8.0, consistent with encrypted content. The entry stub pushes values with calls and rewrites the return slots, so recursive-descent disassembly of the file yields junk instructions rather than the engine's code. :observed

The unpacked runtime image contains [class registration strings and field metadata](/engines/anvil/data-model/class-registry/) absent from the disk image. Static string scans of the packed file therefore cannot establish that a class name is absent from the engine; a scan of its 279,045 strings finds none of the forge type ids' names. :observed

The unpacked image is resident once the game reaches its main menu: a guest-memory snapshot there holds 99.8% of the executable's image, including the unpacked `.text`, and one taken in the open world holds 47.9%. :observed

:::open[What are the exact engine revision and offline-mode requirements?]
Neither a precise public Anvil revision nor independent offline Zen Mode availability is established by the archive and runtime-image evidence. :unknown
:::
