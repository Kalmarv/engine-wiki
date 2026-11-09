---
title: Behaviour components the client draws with
description: "The behaviour pack components that set how an entity is drawn: minecraft:scale for its size, minecraft:color for the colour its colour-mask materials take, and minecraft:variant, mark_variant and skin_id for the textures its render controllers pick."
sources:
  - title: Mojang bedrock-samples
    url: https://github.com/Mojang/bedrock-samples
    note: vanilla behaviour pack (behavior_pack/entities), v1.26.60.5
---

A Bedrock entity is defined twice: a behaviour pack entity (`minecraft:entity`) holds its server-side components, and a
resource pack client entity (`minecraft:client_entity`) holds how it is drawn. :observed[the vanilla packs of bedrock-samples v1.26.60.5]
Some components of the behaviour entity change the drawing: its size, its colour and the textures it is drawn with. Components live either in the
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

## Texture choice: `variant`, `mark_variant` and `skin_id`

`minecraft:variant`, `minecraft:mark_variant` and `minecraft:skin_id` (each a `value`) are numbers that the client
reads as `query.variant`, `query.mark_variant` and `query.skin_id`, and render controllers index their texture arrays
by them. :inferred[from the vanilla render controllers indexing arrays by these queries] Each is set by a component
group, so the number stands for a state the behaviour pack keeps by group name. :observed[the vanilla villager_v2
behaviour file of bedrock-samples v1.26.60.5] The villager's :observed[the villager_v2 behaviour file of bedrock-samples v1.26.60.5]:

| Component | Groups and values |
|---|---|
| `minecraft:variant` (profession) | `unskilled` 0, `farmer` 1, `fisherman` 2, `shepherd` 3, `fletcher` 4, `librarian` 5, `cartographer` 6, `cleric` 7, `armorer` 8, `weaponsmith` 9, `toolsmith` 10, `butcher` 11, `leatherworker` 12, `mason` 13, `nitwit` 14 |
| `minecraft:mark_variant` (biome clothes) | `desert_villager` 1, `jungle_villager` 2, `savanna_villager` 3, `snow_villager` 4, `swamp_villager` 5, `taiga_villager` 6; plains has no group and keeps 0 |
| `minecraft:skin_id` | `villager_skin_0` to `villager_skin_5`, 0 to 5 |

The render controllers' arrays list the professions and biomes in the same order, plains first among the biomes.
:observed[the villager_v2 render controllers of bedrock-samples v1.26.60.5] A villager spawned, born or spawned with a
village gets one of the six skin groups at random, each with weight 1 (`minecraft:entity_spawned`,
`minecraft:entity_born`, `minecraft:spawn_from_village`). :observed[the villager_v2 behaviour file of bedrock-samples
v1.26.60.5] One cured from a zombie villager keeps that zombie's skin, tested by `is_skin_id`, and one converted from
the old `villager` entity draws a new one (`minecraft:entity_transformed`). :observed[the villager_v2 behaviour file
of bedrock-samples v1.26.60.5] The six skins all name the same texture,
`textures/entity/villager2/villager`, so the skin chosen changes nothing in the vanilla pack. :observed[the villager_v2
client entity of bedrock-samples v1.26.60.5]
