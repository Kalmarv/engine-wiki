---
title: Behaviour components the client draws with
description: "The behaviour pack components that set how an entity is drawn: minecraft:scale for its size and minecraft:color for the colour its colour-mask materials take."
sources:
  - title: Mojang bedrock-samples
    url: https://github.com/Mojang/bedrock-samples
    note: vanilla behaviour pack (behavior_pack/entities), v1.26.60.5
---

A Bedrock entity is defined twice: a behaviour pack entity (`minecraft:entity`) holds its server-side components, and a
resource pack client entity (`minecraft:client_entity`) holds how it is drawn. :observed[the vanilla packs of bedrock-samples v1.26.60.5]
Some components of the behaviour entity change the drawing: its size and its colour. Components live either in the
entity's `components` or in `component_groups` that its events add and remove, so the value an entity has depends on
its state (adult or baby, tame or wild). :observed[the 128 vanilla behaviour entity files of bedrock-samples v1.26.60.5]

## Size: `minecraft:scale`

`minecraft:scale` (`value`) sizes the entity, and the client entity's own `scripts.scale` multiplies it. :inferred
47 of the 128 vanilla behaviour entities carry it, in their components or in groups. :observed[the 128 vanilla behaviour entity files of bedrock-samples v1.26.60.5]
Examples :observed[the 128 vanilla behaviour entity files of bedrock-samples v1.26.60.5]:

| Entity | Where | Value |
|---|---|---|
| cat | group `minecraft:cat_adult` | 0.8 |
| cat | group `minecraft:cat_baby` | 0.4 |
| chicken | group `minecraft:chicken_baby` | 0.5 |
| fox | group `minecraft:fox_baby` | 0.5 |
| pufferfish | components | 1.2 |
| salmon | groups `scale_small`, `scale_normal`, `scale_large` | 0.5, 1, 1.5 |

The cat's geometry is therefore drawn at 0.8 of its modelled size as an adult and 0.4 as a kitten. :inferred

## Colour: `minecraft:color`

`minecraft:color` (`value`, a dye index) is the entity's colour, and it becomes the change colour (`CHANGE_COLOR`)
that the entity's colour-mask materials tint by when its render controller gives no `color`; see
[entity materials](/engines/bedrock/materials/entity-materials/). :inferred Four vanilla behaviour entities carry it
:observed[the 128 vanilla behaviour entity files of bedrock-samples v1.26.60.5]:

| Entity | Where | Value | Confidence |
|---|---|---|---|
| cat | group `minecraft:cat_tame` only | 14 (red) | :observed |
| wolf | group `minecraft:on_tame_collar_color` | 14 (red) | :observed |
| sheep | one group per wool colour (`minecraft:sheep_white` 0, `minecraft:sheep_black` 15, ...) | the wool's dye | :observed |
| tropical fish | groups per pattern colour, with `minecraft:color2` for the second colour | dye indices | :observed |

A wild cat has no `minecraft:color`, so its change colour is white and its colour-mask material leaves its texture as
it is. :inferred
