---
title: Fog and water surface
description: "The active fog stack that decides which fog setting applies, how the water distance fog comes in after the camera goes under (transition_fog), and where a biome's water surface opacity comes from: the legacy biomes_client.json and the client biomes."
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
    note: "vanilla resource pack, v1.26.60.5; metadata/doc_modules/fogs.json, Mojang's fog documentation"
---

A fog definition (`fogs/*.json`, `minecraft:fog_settings`) gives distance fogs for air, rain (`weather`) and water,
each with `fog_start`, `fog_end`, `fog_color` and `render_distance_type` (`fixed` blocks, or `render` fractions of
the render distance). :sourced[Microsoft Learn, fog in resource packs] The water fog may also say how it comes in once
the camera is under water; the water's surface itself takes its colour and opacity from the biome.

## The active fog stack

Each player has a stack of fog layers, bottom to top: the engine's hard-coded defaults; the data default, the fog that
the `default` entry of `biomes_client.json` names by `fog_identifier`; the biomes, an average of the fogs of the biomes
around the player; and the settings the `/fog` command has pushed on the player, themselves a stack. :sourced[Mojang bedrock-samples]
Every setting is looked up on its own, from the top down, and the first layer that defines it wins: a biome fog with no
`air` distance fog leaves the air fog to the data default, and failing that to the engine. :sourced[Mojang bedrock-samples]

The vanilla resource pack of 1.26.60 still ships a legacy `biomes_client.json`, headed "Vanilla 1.20.0", beside 89
client biome files (`biomes/*.client_biome.json`). :observed[bedrock-samples v1.26.60.5]

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

The water block's own textures are close to opaque, so the biome's opacity is nearly all of the water's
transparency. `water` and `flowing_water` draw their top and bottom with `still_water_grey` and their sides with
`flowing_water_grey` (`blocks.json`); `water_still_grey.png` has an alpha of 240 (0.94) on every pixel and
`water_flow_grey.png` 255. :proven[every pixel of both textures, bedrock-samples v1.26.60.5] Java Edition's water
textures carry the transparency themselves: `water_flow.png` and `water_overlay.png` have an alpha of 180 (0.71) on
every pixel. :proven[every pixel of both textures, Java Edition 26.3's client] How the engine combines the texture's
alpha with `surface_opacity` is not published; a product of the two is the plain reading. :inferred

:::open[What opacity does a client biome without surface_opacity get?]
The client biome documentation gives no default. The old file's `default` entry held 0.65, which the vanilla swamps'
explicit 0.65 matches.
:::

:::open[Which wins when biomes_client.json and a client biome both set a biome?]
The documentation calls client biomes the preferred format but gives no order between a legacy entry and a client biome
of the same biome, whether for its water or its fog, nor for one pack that sets a biome in both (a legacy entry naming one
fog and the pack's client biome another).
:::
