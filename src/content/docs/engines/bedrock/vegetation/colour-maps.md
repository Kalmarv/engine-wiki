---
title: Colour maps
description: "The pictures foliage and grass take their colour from: the maps in textures/colormap, how a client biome names one, and the single-colour maps of birch, spruce and the swamps."
sources:
  - title: Mojang bedrock-samples
    url: https://github.com/Mojang/bedrock-samples
    note: vanilla resource pack, v1.26.60.5 (textures/colormap/, biomes/*.client_biome.json)
  - title: La Nature (resource pack by Carrot)
    url: https://www.curseforge.com/minecraft-bedrock/texture-packs/la-nature-by-carrot
    note: a third-party pack that replaces the birch, foliage and swamp maps with plain white ones
---

Grass, leaves and other foliage are drawn with grey textures tinted by a colour taken from a colour map, a 256 by 256
picture under `textures/colormap/`. :observed[the leaf textures and colour maps of bedrock-samples v1.26.60.5] The
vanilla resource pack has eight: `grass`, `foliage`, `dry_foliage`, `birch`, `evergreen`, `swamp_grass`,
`swamp_foliage` and `mangrove_swamp_foliage`. :proven[every file of textures/colormap in the v1.26.60.5 resource pack]

## Sampling by climate

A map is read at the biome's temperature and downfall, as the temperature–rainfall triangle of Java Edition's grass
and foliage maps: the grass and foliage maps' pixels change across the picture, the rest are flat. :inferred
`grass` has 4,663 distinct colours and `foliage` 8,837; `dry_foliage` 268. :proven[every pixel of the three maps in the v1.26.60.5 resource pack]

## The single-colour maps

Four maps are a single colour on every pixel, and `swamp_grass` has two:
:proven[every pixel of the eight maps in the v1.26.60.5 resource pack]

| Map | Colour | Taken to tint | Confidence |
|---|---|---|---|
| `birch` | `#80A755` | birch leaves | :inferred |
| `evergreen` | `#619961` | spruce leaves | :inferred |
| `swamp_foliage` | `#6A7039` | foliage in swamps | :proven[the client biomes of the v1.26.60.5 resource pack] |
| `mangrove_swamp_foliage` | `#8DB127` | foliage in mangrove swamps | :proven[the client biomes of the v1.26.60.5 resource pack] |
| `swamp_grass` | `#4C763C` (33,024 pixels) and `#6A7039` (32,512) | grass in swamps and mangrove swamps | :proven[the client biomes of the v1.26.60.5 resource pack] |

No data file names `birch` or `evergreen`: the engine applies them to the leaves of those names. :inferred The
`birch` and `evergreen` colours are the constants Java Edition tints birch and spruce leaves with, and the swamp
foliage colours its swamp and mangrove swamp foliage colours; `swamp_grass`'s two are the two colours Java Edition's
swamp grass alternates between by noise. :observed[Java Edition 26.3's block colours and biome definitions]
Being flat, these maps give the same colour in every biome; a pack that redraws one can make it vary by climate. :inferred

## Client biomes that name a map

A client biome's `minecraft:grass_appearance` or `minecraft:foliage_appearance` may give its `color` as a map,
`{"color_map": "swamp_foliage"}`, instead of a colour. :observed[the client biomes of bedrock-samples v1.26.60.5] Three
of the 89 vanilla client biomes do: `swampland` and `swampland_mutated` (foliage `swamp_foliage`) and `mangrove_swamp`
(foliage `mangrove_swamp_foliage`), all three with grass `swamp_grass`. :proven[every client biome file of the v1.26.60.5 resource pack]
A biome that names no map takes its grass and foliage from `grass` and `foliage`. :inferred

A resource pack that replaces a map's file changes every biome and block drawn with it. :observed[the La Nature resource pack, whose plain white birch, foliage and swamp maps leave its own coloured leaf textures untinted]
A pack's client biome file of the same identifier replaces the vanilla one, so a pack biome without
`foliage_appearance` no longer names the vanilla map. :inferred

:::open[Does a pack's client biome replace the vanilla file whole, or merge component by component?]
The vanilla data cannot show it, and no pack observed overrides one of the three biomes that name a map.
:::
