---
title: Data volume of the Tokyo track
description: How much geometry, how many textures and placements the Forza Horizon 6 Tokyo track holds, per area, per LOD and per season.
---

The figures below describe the content of the track `Brio` in the data, not what any tool built from it does. They come from
recorded censuses and exports of a build that is no longer installed. :observed

## Whole track

| Quantity | Value | Confidence |
|---|---|---|
| GeoChunk entries | 411,013 / 3,065 / 79,840 / 1,476 (chunks 0 to 3) | :observed |
| `.modelbin` files | 113,868 (all in `GeoChunk0`), 407,461 meshes | :observed |
| `.pgeo` files | 96,234 | :observed |
| `.pgeo` placements | 14,388,963 (after correcting the name scan); 8,454,531 groundcover records in 36,087 blocks | :observed |
| Track textures | 169,351 in `GeoChunk0` to `GeoChunk3`; 45,627 distinct game paths | :observed |
| Hand-placed (`.pvs`) instances | 154,254, of which 110,530 draw in the main view in summer | :observed |
| Heightfield terrain instances | 23,941 (17,868 drawn in summer) | :observed |
| `bin.zip` parent materials | 419, in four season sets (1,676 files) | :observed |
| Cars | 682 car archives; 527 aftermarket wheel archives; 197 tyre archives | :observed |
| Pause-map tiles | 85 (levels 0 to 3) | :observed |
| Seasons | 4 | :observed |

## Triangles per area

Triangles that draw in the main view in a box of the Tokyo core (placements and terrain), at the LOD named: :observed

| Area | LOD0 | LOD1 | LOD2 |
|---|---|---|---|
| 700 m box | 63.7 M | 46.1 M | 30.3 M |
| 512 m box (Tokyo) | | 14.4 M | |
| 1.2 km Shibuya box | 183.7 M | | |
| one Shibuya tile at LOD2 | | | 40.1 M placed triangles (12 tiles ≈ 480 M) |
| 450 m section at LOD1 | | 17 to 19 M | |
| Horizon Festival area | 22.3 M | | |

The Tokyo downtown contains 1,916 building proxies (distance levels) of 6.3 M triangles in total. :observed

## Materials of an area

In one Tokyo core area 6,059 materials resolve, 6,052 of them to exactly one shader variant. :observed

## LOD pitfalls in the data

A LOD file can change the material set or UV atlas of its template, so a lower level is not always a drop-in: bikes, fences, railings, grates
and chain-link have alpha-cut parts, and the LOD1 of a bike rendered zebra-striped with the LOD0 material mapping. Vegetation and props
under 2 m reduce to LOD1 without visible loss at street level (a 512 m block went from 18.4 M to 11.9 M triangles). :observed

## Other counts

- Placements with a scale below 0.1: 12 of 14.4 M. :observed
- `GeoChunk0` models with only occluder meshes: 5,938. :observed
- `.pgeo` templates: 554 distinct table hashes; 20,998 grasstemplate `.pgeo` files. :observed
- 44 drawn `area_NN_boundary` wall instances; `area_01`'s gameplay record carries routes 500 and 501. :observed
- Autumn, spring and winter reduce or add content as listed on [Seasons](/engines/forzatech/world/seasons/). :observed
