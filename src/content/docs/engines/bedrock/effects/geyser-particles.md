---
title: Geyser particles
description: "The three effects of a potent sulfur geyser's eruption, the two variables the engine hands them, and how their sizes line up with Java Edition's water depth."
sources:
  - title: Mojang bedrock-samples
    url: https://github.com/Mojang/bedrock-samples
    note: vanilla resource pack, v1.26.60.5 (particles/geyser_*.particle.json)
---

A potent sulfur geyser's eruption is drawn by three particle effects: a column of spray (`minecraft:geyser_plume`), a
churn at its foot (`minecraft:geyser_base`) and short bursts of cloud (`minecraft:geyser_poof`). No block, entity or
animation file of the vanilla pack names them, so the engine starts them itself. :observed[every JSON file of the bedrock-samples v1.26.60.5 resource pack searched for the names]
How tall the eruption is and how long it lasts reach the effects as two variables that no file assigns,
`variable.plume_height` and `variable.active_time`. :observed[the three geyser effects of bedrock-samples v1.26.60.5]
The eruption's sounds are individual event sounds of their own, a start and an active sound for an eruption
(`geyser_eruption_start`, `geyser_eruption_active`) and another pair for a continuous one
(`geyser_continuous_eruption_start`, `geyser_continuous_eruption_active`); the particle effects have no such
pair. :observed[sounds.json of bedrock-samples v1.26.60.5]

## The effects

All three draw with the `particles_blend` material, a 16 by 128 texture of eight 16-pixel flipbook frames stretched
over each particle's life, and are lit (`particle_appearance_lighting`). :observed[the three geyser effects of bedrock-samples v1.26.60.5]

| Effect | Emits | Particle size | Reads |
| --- | --- | --- | --- |
| `minecraft:geyser_plume` | `7 × plume_height` particles a second, at most `5 × plume_height` alive, upward from a thin box, for `active_time` seconds; in the emitter's local space | `0.12 × (2 + plume_height / 8 + age / lifetime)` | `plume_height`, `active_time` |
| `minecraft:geyser_base` | 31 particles a second, at most 45 alive, outward and upward from a half-block box, for `active_time` seconds | `0.125 × (3 + 0.025 × plume_height)` | `plume_height`, `active_time` |
| `minecraft:geyser_poof` | 20 particles at once, emitter alive 0.5 seconds | `0.125 × (3 + 0.025 × plume_height)` | `plume_height` |

:observed[the three geyser effects of bedrock-samples v1.26.60.5]

A plume particle starts at `3 × √plume_height + 1.04 × plume_height` blocks a second, with a drag of 1.2, a fall of
8 blocks a second² easing to 2 by the end of its life and a sideways spread that grows with its age, and lives
`ln(1 + 0.15 × (3.74 × √plume_height + 1.04 × plume_height)) / 1.2` seconds. :observed[geyser_plume of bedrock-samples v1.26.60.5]
The constants are tuned so the spray tops out near `plume_height` blocks above the vent. :inferred

## What the variables hold

Java Edition sizes the same three particles by the depth of water over the potent sulfur block: its plume height is
5 blocks per block of water (at least 5), a plume particle grows from `2 + plume height / 8` to `3 + plume height / 8`
units of its base size, and a base or poof particle is `3 + 0.125 × water blocks`. :observed[Java Edition 26.3's geyser particle classes]
With `plume_height` at 5 blocks per block of water, Bedrock's plume size is Java's, and its base and poof size,
`3 + 0.025 × plume_height`, is Java's `3 + 0.125 × water blocks` exactly; so `plume_height` is the same plume height,
in blocks. :inferred

Java's eruption lasts 20 ticks (1 second) and bursts 20 poof particles every 10 ticks, where Bedrock's poof is 20
particles over a 0.5-second emitter. :observed[Java Edition 26.3's geyser particle classes] `active_time` is then the
eruption's length in seconds, and the poof is started again for each burst. :inferred

:::open[What does the engine set plume_height and active_time to?]
Neither value is published, and nothing in the packs assigns them. The fit with Java Edition's sizes points to 5 blocks
per block of water, but the eruption's length, how often the poof is started, and whether a continuous geyser (lava
under the block) restarts the plume and base or keeps one emitter alive have not been measured in the game.
:::
