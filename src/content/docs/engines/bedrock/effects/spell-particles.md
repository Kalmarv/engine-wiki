---
title: Spell particles
description: "The effects Bedrock starts for potions, status effects and tipped arrows, and the variables they read."
sources:
  - title: Mojang bedrock-samples
    url: https://github.com/Mojang/bedrock-samples
    note: vanilla resource pack, v1.26.60.5 (particles/)
  - title: Minecraft Wiki, Particles (Bedrock Edition)
    url: https://minecraft.wiki/w/Particles_(Bedrock_Edition)
    note: when each effect appears
---

Bedrock draws the swirls of potions and status effects with several particle effects, where Java Edition has the
`entity_effect`, `effect` and `instant_effect` particle types. Each effect takes its colour from `variable.color`, a
struct with `.r`, `.g`, `.b` and `.a`, which no file assigns, so the engine sets it. :observed[the vanilla spell effects of bedrock-samples v1.26.60.5]

## The effects

| Effect | Emits | Variables read and never assigned |
| --- | --- | --- |
| `minecraft:mobspell_emitter` | one particle, once | `color` (all four channels) |
| `minecraft:mobspell_ambient` | one particle, once | `color` (`.r`, `.g`, `.b`; alpha fixed at 0.4) |
| `minecraft:arrow_spell_emitter` | one particle, once | `color` |
| `minecraft:mobspell_lingering` | `π × cloud_radius² × particle_multiplier` particles, once, over a disc of `cloud_radius` | `color`, `cloud_radius`, `particle_multiplier`, `cloud_lifetime` (the emitter's active time) |
| `minecraft:splash_spell_emitter` | 100 particles, once | `color`, `color_brightness`, `is_vertical`, `splash_power`, `splash_range` |

:observed[the vanilla particle files of bedrock-samples v1.26.60.5, Molang names compared case-insensitively]

## When each starts

`splash_spell_emitter` is produced by splash potions. `mobspell_emitter` is emitted by players with non-ambient
effects and is listed for area effect clouds from lingering potions too; `mobspell_ambient` by players with ambient
effects (a beacon's or a conduit's). `arrow_spell_emitter` floats off tipped arrows and trails behind spectral arrows.
`evoker_spell` is an evoker casting a spell. :sourced[Minecraft Wiki, Particles (Bedrock Edition)]

`mobspell_lingering`'s variables are named for a cloud (`cloud_radius`, `cloud_lifetime`), which points to the
lingering potion's cloud. :inferred

:::open[How often does the engine start mobspell_lingering, and with what multiplier and lifetime?]
One start of the effect emits its particles once (instant rate, a single emitter lifetime), so a cloud that shows
particles for its whole life must start it again and again. Its count, `π r²` with a multiplier of 1, is the number of
particles a Java Edition cloud spawns each tick, which suggests one start per tick. :inferred The Minecraft Wiki names
`mobspell_emitter` for the clouds instead, and gives `mobspell_lingering` no description.
:::
