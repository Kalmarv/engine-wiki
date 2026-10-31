---
title: Item icons
description: "Which pictures an item is drawn with in the inventory: a block's carried textures, and the potions' per-effect bottles."
sources:
  - title: Mojang bedrock-samples
    url: https://github.com/Mojang/bedrock-samples
    note: vanilla resource pack, v1.26.60.5 (blocks.json, textures/terrain_texture.json, textures/item_texture.json, textures/blocks/, textures/items/)
  - title: La Nature (resource pack by Carrot)
    url: https://www.curseforge.com/minecraft-bedrock/texture-packs/la-nature-by-carrot
    note: a third-party pack that redraws carried textures and potion bottles
---

## Blocks: carried textures

A block's entry in `blocks.json` names the terrain tiles it is drawn with in `textures`; an entry may also name
`carried_textures`, in the same form: one tile, or tiles by face (`up`, `down`, `side` or a direction).
:observed[the blocks.json of bedrock-samples v1.26.60.5] Of the 1,352 vanilla entries, 151 have `carried_textures`:
143 as one tile and 8 by face (the dispenser, dropper, grass, dried kelp block, piston, sticky piston and the two sculk
sensors). :proven[every entry of the v1.26.60.5 blocks.json] In 33 of the 151 the carried tiles are the block's own
(the corals, the wood blocks). :proven[every entry of the v1.26.60.5 blocks.json]

The carried tiles are the ones the block's item is drawn with, in the inventory and in the hand. :inferred Where the
block is tinted in the world, its carried picture is coloured in: vanilla `leaves_birch` averages `#828081` and
`leaves_birch_carried` `#405529`, `leaves_oak` `#908F90` and `leaves_oak_carried` `#266409`, `waterlily` `#858585` and
`carried_waterlily` `#436624`. :observed[those six textures of bedrock-samples v1.26.60.5] An item drawn with a carried
picture is not tinted again. :inferred The per-face entries give the item a front on one face, as the dispenser's
item shows its mouth. :inferred A block with no carried textures draws its item with its block textures. :inferred

A pack that redraws a carried texture changes the item and not the placed block, and the other way round.
:observed[the La Nature resource pack, whose carried birch, oak and dark oak leaves and lily pad are pictures of their own]

:::open[Which variation does an item drawn with a tile of weighted variations show?]
A terrain tile may list weighted `variations`, from which the world picks one per block position. The item has no
position; the first variation is the natural candidate, unconfirmed.
:::

## Potions

`item_texture.json` gives the potions' pictures as lists: `potion_bottle_drinkable` 31 entries,
`potion_bottle_splash` 30 and `potion_bottle_lingering` 21, each starting with the plain bottle and continuing with
one picture per effect, and `potion_bottle_empty` one. :proven[the item_texture.json of the v1.26.60.5 resource pack]
The per-effect pictures are named by the effect's identifier: `potion_bottle_moveSpeed`,
`potion_bottle_splash_damageBoost`, `potion_bottle_lingering_slowFall`. :proven[the item_texture.json of the v1.26.60.5 resource pack]
The drinkable list runs in the order of the effects' numeric identifiers (speed 1, slowness 2, haste 3, ... infested
30); the splash list leaves out one (levitation) and the lingering list ten. :inferred A potion's entry is picked by its effect, so
every potion of one effect (long, strong) shares a picture, and potions with no effect (water, mundane, thick,
awkward) take the plain bottle. :inferred

A pack redraws a potion by replacing the file of that name; La Nature does so for 19 effects, of each kind of bottle,
without listing them again. :observed[the La Nature resource pack]
