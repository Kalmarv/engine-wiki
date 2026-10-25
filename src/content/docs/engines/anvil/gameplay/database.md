---
title: "Gameplay database resources"
description: "Breakpoint\u2019s multi-resource gameplay container and schema identities."
games: ["ghost-recon-breakpoint"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
  - title: Breakpoint format reference
    url: https://github.com/dataterminals/grb-modding-knowledgebase
    note: Community documentation and readers.
---

Breakpoint stores a major gameplay database in the `DBContainerEntry_0X104634F921` entry of DataPC and its patch. The community's complete container walk reports 61,426 base records and 61,446 patch records, matching metadata and the final decoded byte. These remain attributed measurements rather than independent checks here. :sourced[Breakpoint format reference]

The base population includes 23,914 `DB*`-named records and 37,512 other records, including spawn descriptors, reinforcement waves, dialogue, effects and UI. The stream uses ordinary [resource records](/engines/anvil/data-model/resources/), including unnamed records and extended headers. :sourced[Breakpoint format reference]

Schema identity is the resource type id, while instance names can share that schema. For example DBSimpleFightingBehaviour and DBDefensiveStrafeBehaviour both use `0x131086DD`; DBCircularSideBehaviour and DBAgressiveStrafeBehaviour use `0x6E77432E`. Name-prefix counts therefore are not distinct type counts. :sourced[Breakpoint format reference]

The documented AnvilToolkit profile unpacks and repacks those records as bytes but has no structured DB-class XML serializers. Storage access does not establish enemy perception or decision formulas. :sourced[Breakpoint format reference]

:::open[What are the gameplay field semantics?]
Names and byte differences give candidate meanings, but a complete executable schema and runtime validation of perception, health and reinforcement fields remain unresolved. :unknown
:::
