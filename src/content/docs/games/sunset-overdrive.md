---
title: Sunset Overdrive
description: Insomniac's 2014 open-world shooter on the i16 engine, its PC port, where its data lives in the install, and the community tools that read it.
games: [sunset-overdrive]
sources:
  - title: ALERT (Tkachov)
    url: https://github.com/Tkachov/ALERT
    note: Python reader and asset browser for Insomniac archives, including Sunset Overdrive; GPL-3
  - title: ALERT wiki
    url: https://github.com/Tkachov/ALERT/wiki
    note: toc, DAT1, asset types and the Sunset Overdrive assets report
  - title: ZenHAX thread "Sunset Overdrive TOC and files"
    url: https://zenhax.com/
    note: earlier, unresolved community thread on the toc
---

Sunset Overdrive (Insomniac Games, 2014 on Xbox One, 2018 on PC) is an open-world action game set in Sunset City, built on Insomniac's [engine](/engines/insomniac/) at its **i16** generation.
The PC port is the one recorded here (made by Blind Squirrel according to the executable's timestamp and credits; Steam app 847370). :observed

The observations come from one recorded census of the Steam build **3373500** (`Sunset.exe`, x64, PE timestamp 2018-12-06; about 28 GB installed). The install is no longer
present, so the figures cannot be re-checked today. The counts are measurements over every asset of the stated kind and are marked :observed; nothing for this game is marked as proven. :observed

## Where the data lives

```
<game folder>\
  Sunset.exe, commandline.txt   (-archive assets_archive\toc -warn review -fullscreen)
  assets_archive\toc            the compressed index of every asset
  assets_archive\g00s000 .. g05s000, a00s002.us .. a00s010.br    the 20 archives (global and localised)
  layout.csv, archive_input.json, chunkmap.txt, scan.csv         build leftovers the game does not use
  Houdini Engine, Alembic, OpenVDB, Bink 2 and Wwise runtime libraries
```

All :observed. [The toc and the archives](/engines/insomniac/archives/toc-and-archives/) explains how the 399,775 assets are found and named.

## The city

One level, `levels/sunset_city/sunset_city.level`, with the open world in hexagonal tiles `hex_NNN` ([Zones](/engines/insomniac/world/zone/)): 1,422 zones of placements hold 953,948 placed models whose
4,711 distinct model paths resolve to 4,709 `.model` assets ([Models](/engines/insomniac/geometry/model/)). Collision is Havok `hknp` in `.zone_physics` assets ([Havok collision](/engines/insomniac/collision/havok-hknp/)).
The minimap is a 4688 × 3364 BC7 texture ([Textures](/engines/insomniac/textures/texture/)). :observed

## What is special about this game

- **It is an older generation of Insomniac's formats**: 32-bit asset ids, a zlib-compressed toc with 114 spans and duplicated assets, and archives that are plain concatenations. :sourced[ALERT wiki]
- **Assets have no paths in the archive.** Every one of the 399,775 gets its path from `layout.csv`, a build leftover. :observed
- **Compressed assets are one LZ4 block over the DAT1 and its pixels together**, so a reader must decompress to the DAT1 size plus the payload length. :observed
- **The index flag of a mesh is inverted in ALERT's OBJ writer**: `0x10` means indices relative to the vertex start. :observed
- **Collision is Havok `hknp` 2013.2.0-r1 with an empty types section**, so shape layouts are not self-describing. :observed
- **Traversal is authored in the zones** (`Grind`, `LedgePath`, `Mountable`, `Vaultable`, `UnderGrind`, `HorizontalPoleSwing`, `AllowHop` strings), but the records are not decoded. :observed

:::open[Which build do the observations come from?]
Steam build 3373500. Whether the census figures hold for other updates is not known.
:::
