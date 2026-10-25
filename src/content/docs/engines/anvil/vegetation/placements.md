---
title: Trees, bushes and rock clutter
description: Stored vegetation placements, prototype instances, procedural-group copies and distant impostors.
games: [riders-republic]
---

Trees, bushes and rocks have stored placements, unlike the grass instance set. They appear as individual Entities and prototype instance arrays reached through world cells or ProceduralEntityGroups. :observed[USNAT entity and group bodies]

Individual secondary-vegetation Entities carry their own transforms. Tree and rock instance-list Entities use a Visual with LODSelectorInstance and a counted array of 64-byte transforms relative to the owning Entity. Names such as `TREE_*_Instances_xNN_yNN` identify prototype/tile families, while `Fake_*` variants represent distant impostor copies. :observed[placement bodies and reference joins]

A sample of 190 secondary-vegetation placements has median +.03 metres above bilinearly decoded detailed terrain, with 72% within one metre. A 240-instance rock-scatter sample has median −.45 metres, with 50% within one metre. These are sample measurements, not an exact terrain-snap invariant for all vegetation. :observed[sampled placements]

The inspected procedural-group component contains copies of instance-list data rather than an additional independent tree population. All 941 single-component groups close exactly under its count grammar; sampled group items match the corresponding list placements. Coarser-level group members and far impostors must therefore be distinguished from duplicate near placements. :proven[941 group envelopes] :observed[group/list comparison]

TerrainProceduralMaterial and TerrainProceduralSet contain terrain-material recipes, not tree placement lists. Their names may mention forests or villages without referring to Entity, Mesh or LODSelector instances. :observed[479 procedural-material bodies and set references]

The grass path has its own [library and terrain selection](/engines/anvil/vegetation/grass/). Distant FakeForest surfaces likewise do not establish grass scattering or a complete tree-generation rule. :observed[separate resource families]

:::open[What drives the complete vegetation animation and far transition?]
Stored transforms and several impostor families are established. Complete wind deformation, impostor switching and all coarser-level procedural-group selection rules remain unresolved here. :unknown
:::
