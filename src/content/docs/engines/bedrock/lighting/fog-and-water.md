---
title: Water fog and water surface
description: "How the water distance fog comes in after the camera goes under (transition_fog), and where a biome's water surface opacity comes from: the legacy biomes_client.json and the client biomes."
sources:
  - title: Microsoft Learn, fog in resource packs
    url: https://learn.microsoft.com/en-us/minecraft/creator/documents/foginresourcepacks
    note: the fog_settings format, including transition_fog
  - title: bedrock.dev, Client Biomes
    url: https://bedrock.dev/docs/stable/Client%20Biomes
    note: "generated documentation, version 1.26.60.5"
  - title: MCPE-187943
    url: https://bugs-legacy.mojang.com/browse/MCPE-187943
    note: swamp water drawn at the default transparency after the move to client biomes, resolved Works As Intended
  - title: Mojang bedrock-samples
    url: https://github.com/Mojang/bedrock-samples
    note: vanilla resource pack, v1.26.60.5
---

A fog definition (`fogs/*.json`, `minecraft:fog_settings`) gives distance fogs for air, rain (`weather`) and water,
each with `fog_start`, `fog_end`, `fog_color` and `render_distance_type` (`fixed` blocks, or `render` fractions of
the render distance). :sourced[Microsoft Learn, fog in resource packs] The water fog may also say how it comes in once
the camera is under water; the water's surface itself takes its colour and opacity from the biome.

## How the water fog comes in

`transition_fog` is read only on the water distance fog. :sourced[Microsoft Learn, fog in resource packs] It holds:

| Field | Meaning | Confidence |
|---|---|---|
| `init_fog` | A distance fog (`fog_start`, `fog_end`, `fog_color`, `render_distance_type`) the water fog moves from | :sourced[Microsoft Learn, fog in resource packs] |
| `min_percent` | The least progress of the transition, 0 to 1 | :sourced[Microsoft Learn, fog in resource packs] |
| `mid_seconds`, `mid_percent` | The progress reached after `mid_seconds` | :sourced[Microsoft Learn, fog in resource packs] |
| `max_seconds` | The time the whole transition takes | :sourced[Microsoft Learn, fog in resource packs] |

Every vanilla fog with a water distance fog (79 of the 80 fog files) carries the same transition: `min_percent` 0.25,
`mid_seconds` 5, `mid_percent` 0.6, `max_seconds` 30, from an `init_fog` with `fog_start` 0 and `fog_end` 0.01 blocks
(`fixed`). :observed[every fog file of bedrock-samples v1.26.60.5] Read as a progress rising linearly to `mid_percent`
at `mid_seconds`, then linearly to 1 at `max_seconds`, never below `min_percent`, with the distances moving from
`init_fog`'s to the fog's own by it, this is the same curve as Java Edition's underwater vision (the fog end scaled by
at least 0.25, 0.6 at 5 seconds, 1 at 30). :inferred

## Water surface opacity

A biome's water surface has an opacity from 0 (invisible) to 1 (opaque): `surface_opacity` in a client biome's
`minecraft:water_appearance` component, beside `surface_color`. :sourced[bedrock.dev, Client Biomes] The legacy
`biomes_client.json` gives it per biome entry as `water_surface_transparency`, with a `default` entry for the rest;
the vanilla legacy file's swamps hold 1.0 there, so despite its name the value is an opacity. :inferred
Since 1.21.40 the game no longer reads `biomes_client.json` from its built-in vanilla packs; it still reads it from
other content. :sourced[bedrock.dev, Client Biomes]

The vanilla values the two formats hold differ for swamps:

| Biome | `biomes_client.json` | Client biome `surface_opacity` | Confidence |
|---|---|---|---|
| `default` (every biome not listed) | 0.65 | (not set in the other 86 client biomes) | :observed[bedrock-samples v1.26.60.5, every client biome] |
| `swampland`, `swampland_mutated` | 1.0 | 0.65 | :observed[bedrock-samples v1.26.60.5] |
| `warm_ocean` | 0.55 | 0.55 | :observed[bedrock-samples v1.26.60.5] |

Swamp water drawn at the default opacity since the move to client biomes is intended. :sourced[MCPE-187943]

:::open[What opacity does a client biome without surface_opacity get?]
The client biome documentation gives no default. The old file's `default` entry held 0.65, which the vanilla swamps'
explicit 0.65 matches.
:::

:::open[Which wins when a pack's biomes_client.json and a client biome both set a biome's water?]
The documentation calls client biomes the preferred format but gives no order between a pack's legacy entry and a
vanilla client biome of the same biome.
:::
