---
title: Bedrock Engine (Minecraft)
description: "Minecraft: Bedrock Edition's engine: entities drawn from data-driven resource and behaviour packs (client entities, render controllers, geometry, materials) through Molang expressions."
sources:
  - title: Mojang bedrock-samples
    url: https://github.com/Mojang/bedrock-samples
    note: the vanilla resource and behaviour packs Mojang publishes per release
---

Bedrock Edition describes its entities in packs of JSON. A behaviour pack entity holds the server-side components
(size, colour, behaviour), and a resource pack client entity names what the client draws with: geometries, textures,
materials, animations, animation controllers and render controllers, all chosen and driven each frame by Molang
expressions. :observed[the vanilla packs of bedrock-samples v1.26.60.5] Add-ons and resource packs replace or extend
the same files, which is why the vanilla packs are the reference for what a pack builds on. :inferred The wiki records
one game on it, [Minecraft: Bedrock Edition](/games/minecraft-bedrock/).

How an entity is drawn:

- [Render controllers](/engines/bedrock/data-model/render-controllers/): which geometry, texture and bone materials
  each layer draws, which bones show, and the colours and texture offset its materials read.
- [Entity materials](/engines/bedrock/materials/entity-materials/): the shader stages a material's defines turn on
  (alpha test, colour mask, overlay, emissive light, texture animation).
- [Entity geometry](/engines/bedrock/geometry/entity-geometry/): bones and their bind poses.
- [Behaviour components the client draws with](/engines/bedrock/data-model/behaviour-components/): `minecraft:scale`
  and `minecraft:color`.
- [Engine variables](/engines/bedrock/data-model/engine-variables/): the variables scripts read that the engine sets.
- [Attachables](/engines/bedrock/data-model/attachables/): held and worn items drawn as models on their holder, and how
  they read the holder's variables.
- [First-person player](/engines/bedrock/animation/first-person/): how the player model is posed for its own view.

How the world and items are coloured:

- [Colour maps](/engines/bedrock/vegetation/colour-maps/): the maps grass and foliage take their colour from, by
  climate or by a client biome's `color_map`, and the single-colour birch, spruce and swamp maps.
- [Item icons](/engines/bedrock/textures/item-icons/): a block item's carried textures, and the potions' per-effect
  bottles.

:::open[What do the current renderer's compiled materials hold?]
The material and shader facts here are those of the 1.16-era renderer, from published copies. The game now compiles
its materials, and their definitions are not published.
:::
