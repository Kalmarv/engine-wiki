---
title: Particles drawn from a block or item picture
description: "Particle effects on atlas.terrain and atlas.items: the variables the engine hands them to find a block's or item's picture, and when each starts."
sources:
  - title: Mojang bedrock-samples
    url: https://github.com/Mojang/bedrock-samples
    note: vanilla resource pack, v1.26.60.5 (particles/)
  - title: Minecraft Wiki, Particles (Bedrock Edition)
    url: https://minecraft.wiki/w/Particles_(Bedrock_Edition)
    note: when each effect appears, and its Java Edition counterpart
---

Most particle effects name one texture file. A few draw a piece of whatever block or item is involved (the block
being broken, the food being eaten): their texture is `atlas.terrain` or `atlas.items`, the game's block or item
atlas, and their UVs are expressions over variables that give the picture's place in that atlas.
:observed[the eight vanilla effects with an atlas texture, bedrock-samples v1.26.60.5] No file assigns those
variables, so the engine sets them when it starts the effect. :inferred

## The effects and what they read

| Effect | Atlas | Variables read and never assigned |
| --- | --- | --- |
| `minecraft:block_destruct` | `atlas.terrain` | `emitter_texture_coordinate`, `emitter_texture_size`, `emitter_particles_count`, `emitter_radius`, `velocity_scalar`, `color` |
| `minecraft:block_slide` | `atlas.terrain` | the same six |
| `minecraft:breaking_item_terrain` | `atlas.terrain` | `EmitterTextureCoord`, `EmitterTextureSize`, `num_particles`, `emitter_radius`, `size_modifier`, `speed_modifier` |
| `minecraft:breaking_item_icon` | `atlas.items` | the same six |
| `minecraft:smash_ground_particle`, `smash_ground_particle_center` | `atlas.terrain` | `surface_particle_texture_coordinate`, `surface_particle_texture_size`, `surface_particle_tint`, `smash_particle` |
| `minecraft:warden_dig` | `atlas.terrain` | `dig_particle_texture_coordinate`, `dig_particle_texture_size`, `dig_particle_color` |
| `minecraft:breeze_ground_particle` | `atlas.terrain` | `ground_particle_texture_coordinate`, `ground_particle_texture_size`, `ground_particle_color`, `ground_particle_amount`, `ground_particle_initial_speed` |

:observed[the vanilla particle files of bedrock-samples v1.26.60.5, Molang names compared case-insensitively]

Each coordinate and size is a struct with `.u` and `.v`, in the atlas's own UV space: none of the effects sets
`texture_width` or `texture_height`, which default to 1. :observed[the vanilla particle files of bedrock-samples v1.26.60.5]
These four draw a quarter of the picture at a random offset: `uv` is the coordinate plus a quarter of the
size times `particle_random_1 * 3` (and `particle_random_2 * 3` down), `uv_size` a quarter of the size.
:observed[block_destruct, block_slide, breaking_item_terrain and breaking_item_icon of bedrock-samples v1.26.60.5]
`breaking_item_terrain` and `breaking_item_icon` give their variables defaults in `creation_expression`
(`emitter_radius` 0.25, `num_particles`, `size_modifier` and `speed_modifier` 1, the UVs 0), so the engine may leave
any of them unset. :observed[the vanilla breaking_item_terrain and breaking_item_icon files of bedrock-samples v1.26.60.5]

## When each starts

`block_destruct` is the Java Edition `block` particle: it shows when a block is broken and when one is brushed, when
an entity lands from a long fall, and when players and cats sprint. :sourced[Minecraft Wiki, Particles (Bedrock Edition)]
`breaking_item_icon` is the Java `item` particle, for a tool breaking and for players and foxes eating;
`breaking_item_terrain` shows for feeding mobs and a panda eating bamboo or cake, the item drawn from the block
atlas. :sourced[Minecraft Wiki, Particles (Bedrock Edition)] The warden's digging and the breeze's ground particles are
their own effects (`warden_dig`, `breeze_ground_particle`), not `block_destruct`. :observed[the vanilla particle files of bedrock-samples v1.26.60.5]

:::open[What counts, radii and speeds does the engine hand block_destruct for each use?]
No published source gives them, and the Linux dedicated server (1.26.61.1) carries none of these variable names, the
particle code being client-only. A third-party pack's version of the effect starts its step effects for one particle
with `velocity_scalar` under 0.6, or for any count above one except 48, which suggests a broken block hands it 48
particles and a sprint step one slow one. :inferred
:::
