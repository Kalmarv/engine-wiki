---
title: Particle block tests
description: "How a particle's block-list components name blocks, and which names current Bedrock no longer has."
sources:
  - title: Mojang bedrock-samples
    url: https://github.com/Mojang/bedrock-samples
    note: "v1.26.60.5: the vanilla block registry (metadata/vanilladata_modules/mojang-blocks.json) and the vanilla resource pack"
---

A particle can expire by the block it is in: `minecraft:particle_expire_if_in_blocks` ends it inside any block of a
list, `minecraft:particle_expire_if_not_in_blocks` outside all of them; the vanilla bubbles keep to water with the
second (`water`, `flowing_water`, `bubble_column`). :observed[the vanilla particle files of bedrock-samples v1.26.60.5] Packs use them
as probes: an invisible particle placed beside the emitter survives only in (or out of) the listed blocks, and an
event on its expiry or at the end of its life starts the visible effect. :observed[a third-party resource pack]

The lists name blocks by their identifiers, without states. :observed[the vanilla particle files of bedrock-samples v1.26.60.5]

## Names current Bedrock no longer has

The vanilla block registry of 1.26.60.5 lists 1,466 blocks. It has none of the old names that blocks were split from
or renamed from: `minecraft:leaves` and `leaves2` (now one block per wood: `oak_leaves`, `acacia_leaves`...),
`grass` (`grass_block`), `skull` (one block per head: `skeleton_skull`, `zombie_head`...), `chain` (`iron_chain`),
`coral_fan` and `coral_wall_fan` (one per coral: `tube_coral_fan`...). Nor has it `dark_oak_standing_sign`: the
dark oak sign is `darkoak_standing_sign`. `frame`, `glow_frame` (item frames, which are blocks in Bedrock) and
`border_block` are current. :proven[every name above looked up in the 1.26.60.5 registry]

:::open[Does a block list still match a removed name through an alias?]
Whether a particle's block list resolves a removed name to the blocks that replaced it is not published. If it does
not, a list naming `minecraft:skull` matches no head at all. :inferred
:::
