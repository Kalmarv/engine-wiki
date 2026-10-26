---
title: "Anvil engine"
description: "Typed resources, forge containers and streamed worlds in Ubisoft\u2019s Scimitar lineage."
games: ["riders-republic", "ghost-recon-breakpoint", "shaun-white-skateboarding"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
  - title: Breakpoint format reference
    url: https://github.com/dataterminals/grb-modding-knowledgebase
    note: Community documentation and readers.
---

Anvil is Ubisoft's engine lineage also known as Scimitar; its archive signature retains the name `scimitar`. :sourced[Breakpoint format reference]
[Riders Republic](/games/riders-republic/) stores data in forge version 27 archives with typed resources identified by CRC-32 type hashes and 64-bit resource identities. All six archive headers and index tables read without refusals; the name-hash evidence is graded per entry in the type inventory. :proven{games="riders-republic"}
[Ghost Recon Breakpoint](/games/ghost-recon-breakpoint/) shares this archive generation and naming scheme. :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"}

[Shaun White Skateboarding](/games/shaun-white-skateboarding/) is an earlier game of the lineage: its forges are version 26 and its data blocks use LZO instead of Zstandard. :proven{games="shaun-white-skateboarding"}

The shared envelope does not make serialized bodies interchangeable: compression versions, resource grouping and class-specific serializers vary. :observed{games="riders-republic"} :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"}

| Boundary | Riders Republic | Ghost Recon Breakpoint | Shaun White Skateboarding | Confidence |
|---|---|---|---|---|
| Forge | Version 27; one FileSet in six checked archives | Version 27; chained FileSets documented | Version 26 :proven{games="shaun-white-skateboarding"} | :observed{games="riders-republic"} :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |
| Data compression | Version 2, algorithm 5, Zstandard | Version 3, algorithm 3, Oodle Mermaid | Version 1, algorithm 2, LZO2A :proven{games="shaun-white-skateboarding"} | :observed{games="riders-republic"} :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |
| Resource grouping | One per checked ordinary entry | Multiple per data container | Many objects per cell entry :observed{games="shaun-white-skateboarding"} | :observed{games="riders-republic"} :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |
| World evidence | Grid, entity, layer and placement measurements | Community archive-mounting analysis | Grid cells and world roots :observed{games="shaun-white-skateboarding"} | :observed{games="riders-republic"} :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |

The [forge](/engines/anvil/archives/forge/) locates entry bytes, [data blocks](/engines/anvil/archives/data-blocks/) decode them, and the [resource header](/engines/anvil/data-model/resources/) supplies identity and type. Riders Republic's [grids](/engines/anvil/world/grids/) list resources, and [entities](/engines/anvil/data-model/entities/) attach visuals, physics and gameplay components. :observed{games="riders-republic"}

:::open[Which exact engine revision does Riders Republic use?]
Archive version 27 identifies a container generation, not a public engine-version number. An exact engine revision is not established. :unknown{games="riders-republic"}
:::
