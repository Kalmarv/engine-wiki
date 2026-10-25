---
title: "Havok tree payloads"
description: "Breakpoint\u2019s MeshShape acceleration tagfile, distinct from Riders Republic\u2019s section stream."
games: ["ghost-recon-breakpoint"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
  - title: Breakpoint format reference
    url: https://github.com/dataterminals/grb-modding-knowledgebase
    note: Community documentation and readers.
---

Breakpoint MeshShape contains triangle geometry and a PhysicsSDKDataPack.SerializedRawData Havok tagfile holding its bounding-volume tree. The community describes SDK version string `20180200` in samples; this is distinct from Riders Republic's tagged section format. :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"}

| Structure | Breakpoint profile | Confidence |
|---|---|---|
| Tagfile container | TAG0 containing SDKV, DATA, TCRF and INDX | :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |
| TCRF | Type-compendium reference; no full local TYPE schema | :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |
| Item 1 | hknpExternMeshShapeData, compendium type 80, 128 bytes at DATA zero | :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |
| Item 2 | hkcdStaticTree::Codec3Axis6, compendium type 44, six-byte nodes | :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |
| Item 3 | hkcdSimdTree::Node, compendium type 52, two sentinel nodes in sampled profile | :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |

The reference samples 60 and then 300 runtime-shape entries per game in its Wildlands/Breakpoint comparison. It also records an exceptional Breakpoint shape with no tree, preventing a universal assumption that all shapes contain that node array. :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"}

:::open[Where is the referenced type compendium?]
The reference does not locate it in the executable or named forge resources. Cross-game tree conversion in the source is not runtime evidence of collision compatibility. :unknown{games="ghost-recon-breakpoint"}
:::
