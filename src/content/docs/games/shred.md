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
The check reads the capability word the controller reports and refuses a controller that declares an analog stick
(bit 8, `HP_ANALOG_STICK`). With that single test skipped in the executable, an emulated controller that reports the bit moves on from the "no board connected" screen to the board's
calibration screen. :observed[the executable's check, read; one run under RPCS3 with the test skipped]
The executable has a second route past the board, a QA switch: the `u32` `qa_build` at `0x172B10C`, which only a `qa_build` entry of `boot.ini` (true or nonzero) sets at start-up. It gates the native cheat `CTRL`, which sets the globals `board_build` 0, `controller_build` 1 and `keyboard_build` 0, and the board-connect routine ignores the scripts' `controller_build` unless the switch is set. :observed[static reading of the executable]
With the switch and those three globals written into memory at start-up, an ordinary controller reaches the main menu and plays CHARLIE's training, the board test left as shipped and no disc bytes changed. :observed[runs under RPCS3]
`CTRL` is typed on the game's own cheat screen (`Universal/Initials/Initials.gfx`) and is not a row of `MAIN.DB`'s `cheat_codes`, whose one row is `RICE`. :observed
On a controller, the skating scripts push on R1, turn with the left stick's X axis and push while idle with its Y axis. :observed[static reading of the skating scripts]
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
- Textures: [Textures (THP and TXP)](/engines/rme/textures/gcm-textures/).
- Collision: [Havok 7.1 collision packfiles](/engines/rme/collision/havok-packfiles/).
- World: [SCP scene tables](/engines/rme/world/scp-tables/), [Spot chunks and spawns](/engines/rme/world/spot-chunks/), [Splines](/engines/rme/world/splines/), [Lights](/engines/rme/world/lights/), [Levels and layer PAKs](/engines/rme/world/layers/).
- Data model: [MAIN.DB and the other databases](/engines/rme/data-model/main-db/).
