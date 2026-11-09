---
title: Terrain tiles
description: "How blocks.json names terrain tiles, how a tile's list of textures is picked from, which vanilla lists hold the parts of one block rather than data values, and how flipbooks attach to a tile."
sources:
  - title: Mojang bedrock-samples
    url: https://github.com/Mojang/bedrock-samples
    note: vanilla resource pack, v1.26.60.5 (blocks.json, textures/terrain_texture.json, textures/flipbook_textures.json)
  - title: Bedrock Wiki, flipbook textures
    url: https://wiki.bedrock.dev/blocks/flipbook-textures
    note: the flipbook fields atlas_tile, atlas_index and atlas_tile_variant
  - title: Minecraft Wiki, Hopper
    url: https://minecraft.wiki/w/Hopper
    note: the hopper's block states (toggle_bit)
  - title: GeyserMC mappings-generator
    url: https://github.com/GeyserMC/mappings-generator
    note: "its Java → Bedrock block state table (BlockMappers.java)"
  - title: La Nature (resource pack by Carrot)
    url: https://www.curseforge.com/minecraft-bedrock/texture-packs/la-nature-by-carrot
    note: a third-party pack that indexes hopper tiles by power and points flipbooks at vanilla tiles
---

A block's entry in `blocks.json` names a terrain tile per face (`up`, `down`, `side`, a direction) or one tile for
all faces, and `textures/terrain_texture.json` gives each tile its texture. :sourced[Bedrock Wiki] A tile's
`textures` is a path, an object with a `path` or weighted `variations`, or a list of those. :proven[every tile of the
v1.26.60.5 file] 323 of the 1,367 vanilla tiles are lists. :proven[the v1.26.60.5 file]

## Lists by data value

A list is picked from by the block's legacy data value, the sum of its states each times its place in the old
data layout. :inferred[from the list orders, which follow the legacy data values] A hopper's data value is its
`facing_direction` plus 8 when `toggle_bit` is set, and `toggle_bit` is set while the hopper is powered and so
disabled. :sourced[Minecraft Wiki] Vanilla's hopper tiles are single textures, so the bit changes nothing in the
vanilla pack. :proven[the v1.26.60.5 file] A pack can give the hopper 14-entry lists and draw a powered hopper
differently at places 8 to 13. :observed[the La Nature resource pack]

GeyserMC's state table maps Java Edition's hopper `enabled` straight onto `toggle_bit`, with no inversion, while
mapping the bell's `powered` onto its `toggle_bit`. :sourced[GeyserMC mappings-generator] That reading contradicts the
one above for hoppers. :inferred

:::open[Which value of the hopper's toggle_bit does the game set while it is powered?]
The Minecraft Wiki and the bell's mapping say set when powered; Geyser's hopper mapping implies set when not. Placing
a hopper next to a redstone block in the game and reading its state would settle it.
:::

A cake's `cake_west` tile is `[cake_side, cake_inner]` and its other tiles hold one texture twice, so a whole cake
shows its side on the west and a bitten one the inside (bite counter 1 to 6, past the list's end, taking its last
entry). :observed[the v1.26.60.5 file; the clamp is inferred]

## Lists of one block's parts

Some vanilla lists hold the parts of one block rather than data values:

| Tile | Entries | Confidence |
|---|---|---|
| `sunflower_additional` | `double_plant_sunflower_front`, `double_plant_sunflower_back` | :observed[the v1.26.60.5 file] |
| `open_eyeblossom` | `eyeblossom_stem_blooming`, `eyeblossom_eyes_blooming` | :observed[the v1.26.60.5 file] |
| `firefly_bush` | `firefly_bush`, `firefly_bush_firefly` | :observed[the v1.26.60.5 file] |

The flower's face and back, and the glowing eyes and fireflies drawn over the plant, are separate parts of the
model, not states, so these blocks read both places at once. :inferred[from the names and the blocks having no state
that would select them]

## Flipbooks

`textures/flipbook_textures.json` animates a place of a tile: `atlas_tile` names it, `atlas_index` picks the entry of
a list and `atlas_tile_variant` the variation within it. :sourced[Bedrock Wiki] The vanilla file has 83 entries, and
each names a `flipbook_texture` that its tile already lists. :proven[every entry of the v1.26.60.5 file] A pack's
entry can name another texture than its tile's own (a lit redstone torch, the repeater's and comparator's lit tops
and torches, glow lichen) and the game then draws the flipbook's texture at that place. :inferred[from packs relying
on it; not checked in the game]

:::open[Is a flipbook's texture drawn in place of its tile's own?]
No vanilla entry tests it, as every one names its tile's texture.
:::
