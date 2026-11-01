---
title: "Minecraft: Bedrock Edition"
description: "Minecraft: Bedrock Edition on the Bedrock engine: the vanilla packs the wiki's entity facts come from, and where they are written."
games: [minecraft-bedrock]
sources:
  - title: Mojang bedrock-samples
    url: https://github.com/Mojang/bedrock-samples
    note: vanilla resource and behaviour packs, v1.26.60.5 and v1.21.0.3
---

Minecraft: Bedrock Edition (Mojang Studios) runs on the [Bedrock engine](/engines/bedrock/). :sourced[Mojang bedrock-samples]
The facts recorded here come from the vanilla resource and behaviour packs that Mojang publishes as bedrock-samples
(release v1.26.60.5, and v1.21.0.3 for older geometry), and from published copies of the 1.16-era entity materials and
shaders; no installed game was read. :observed{games="minecraft-bedrock"}

## What is written

- How render controllers, entity materials, geometry bind poses and behaviour components draw an entity: see the
  [engine overview](/engines/bedrock/).
- The v1.26.60.5 samples' geometries lack eight bind poses that v1.21.0.3 has
  ([entity geometry](/engines/bedrock/geometry/entity-geometry/)). :observed{games="minecraft-bedrock"}
- The tame cat textures mark the collar by alpha for the colour mask
  ([entity materials](/engines/bedrock/materials/entity-materials/#tame-cat-textures)). :observed{games="minecraft-bedrock"}
- 151 variables the vanilla scripts read are never assigned by any script, so the engine sets them
  ([engine variables](/engines/bedrock/data-model/engine-variables/)). :observed{games="minecraft-bedrock"}
- The birch, evergreen and two swamp foliage colour maps are each one colour, and three of the 89 client biomes name a
  map ([colour maps](/engines/bedrock/vegetation/colour-maps/)). :observed{games="minecraft-bedrock"}
- 151 block entries name carried textures, coloured-in pictures for the block's item
  ([item icons](/engines/bedrock/textures/item-icons/)). :observed{games="minecraft-bedrock"}
- Eight particle effects draw from the block or item atlas at UVs the engine hands them
  ([picture particles](/engines/bedrock/effects/picture-particles/)).
  :observed{games="minecraft-bedrock"}
- Potion and status-effect swirls are five effects whose colour, and a lingering cloud's radius, the engine hands
  them ([spell particles](/engines/bedrock/effects/spell-particles/)). :observed{games="minecraft-bedrock"}
