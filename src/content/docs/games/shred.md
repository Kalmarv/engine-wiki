---
title: "Tony Hawk: SHRED"
description: "Robomodo's 2010 skateboarding and snowboarding game for PlayStation 3 on the RME engine: the recorded disc, where its data lives, and its ten levels."
games: [shred]
sources:
  - title: RPCS3
    url: https://github.com/RPCS3/rpcs3
    note: decrypts the executable and the script archive; used to check the disc's behaviour
---

Tony Hawk: SHRED (Robomodo, Activision, 2010) is a skateboarding and snowboarding game on Robomodo's own [RME engine](/engines/rme/). It runs on the
PlayStation 3 and checks for a skateboard-shaped controller peripheral at start-up; the disc, title ID `BLUS30542`, version `01.00`, is the one recorded here. :observed
Every observation in the wiki's SHRED pages comes from one dump of that disc: 1,124 files, 5,875,743,333 bytes, decrypted. :observed

## Where the data lives

```
PS3_GAME/
  PARAM.SFO                      title, title ID, version
  USRDIR/
    EBOOT.BIN                    the executable (SCE SELF)
    SCRIPTS.SDAT                 compiled Lua 5.1, a PAK inside an NPD wrapper
    levels/                      10 level PAKs
    levels/layers/               209 layer PAKs (sessions, difficulties, lighting)
    characters/, anim/, flash/   character, animation and Scaleform PAKs
    database/                    27 SQLite databases (MAIN.DB: levels, sessions, goals, surfaces)
    physics/                     8 Havok .HKX files
    audio/                       Wwise banks and packages, OGG
    videos/bik/                  451 Bink videos
PS3_UPDATE/PS3UPDAT.PUP          console firmware update
```

All of it observed on the dump; the file names are the disc's Joliet names ([The disc and its file names](/engines/rme/archives/disc/)). :observed
The 336 PAKs hold 67,320 entries ([PAK archives](/engines/rme/archives/pak/)); the largest groups are 28,046 texture pixel files and 27,446 texture headers. :proven[all 336 PAKs]

## Levels

The game has ten level archives. Their names are letters of the NATO alphabet, and the `levels` table of `MAIN.DB` gives each one's board type (skate or snow); the descriptions below are what that table and the level's session data name. :observed

| Archive | Kind | Content |
|---|---|---|
| Charlie | skate | training and pro challenges (big air, manual and grind challenges, HP training) |
| India | skate | New Orleans |
| Juliet | skate | Morocco |
| Mike | skate | the amusement park: the table's rows Kilo, Lima and Mike are its lower, combo and upper parts, in one archive |
| November | skate | Melbourne |
| Oscar | skate | the Wallows |
| Papa | skate | Santorini |
| Delta | snow | Beijing (halfpipe, big air) |
| Echo | snow | the French Alps |
| Foxtrot | snow | Whistler |

The table also lists Bravo, Golf and Hotel, which have no archive. :observed
Each level row names a load script, `script\level_load_<name>.lua`, which belongs to the encrypted script archive and has not been read. :observed
Besides the ten bases there are 209 layer PAKs whose names carry a map id, so one level archive serves several playable maps. :observed

:::open[What are the levels called in the game?]
The descriptions above are the database's. The display strings the menus show were not read.
:::

## Pages

- [Robomodo RME](/engines/rme/): the engine, its middleware and how sure the pages are.
- [PAK archives](/engines/rme/archives/pak/), [CSTR streams](/engines/rme/archives/cstr/), [The disc and its file names](/engines/rme/archives/disc/).
- Geometry: [Model libraries](/engines/rme/geometry/model-quartets/), [Vertex formats](/engines/rme/geometry/vertex-formats/), [Placements](/engines/rme/geometry/placements/), [Triangle winding](/engines/rme/geometry/winding/), [Skinned streams](/engines/rme/geometry/skinned-streams/).
- Materials: [Material banks](/engines/rme/materials/material-banks/).
