---
title: "World travel and the skater"
description: "How Shaun White Skateboarding changes world through the monorail station table, and where the running game keeps the skater's position."
games: ["shaun-white-skateboarding"]
---

Shaun White Skateboarding loads one world at a time, and the player moves between worlds from the city map. Executable addresses on this page are virtual addresses of the build recorded on the [game's page](/games/shaun-white-skateboarding/). :observed

## Station records

A `MonorailManager` singleton (pointer at `0x1C567F4`, vtable `0x19081A8`) holds six station records at the pointer stored at manager offset `0xD0`, 60 bytes (`0x3C`) each; the count is the word at offset `0xD4` masked with `0x3FFF`. :observed

| Record offset | Meaning | Confidence |
|---|---|---|
| `0x14` | `u32` id of the world the station's map node travels to | :observed |
| `0x38` | `u8`, nonzero when the station is unlocked | :observed |

The six stations are, in order, Midtown, Safe Harbor, Downtown, Rising Island, Restricted Area and Shaun. :observed

The unlock state of a station is the conjunction of a flag on the manager (offset `0xD8`), the station's own byte and a flag on a condition object that all six stations share; the handler that locks a station is at `0x80ECA0`. :observed

Stations 0 and 1 travel to level 01 (`0x47AF3893`), station 2 to level 02 (`0x47AF38BE`), station 3 to level 03 (`0x47AF38E9`), station 4 to level 04 (`0x47AF3914`) and station 5 to the Shaun White world (`0x954D44AF`). Writing a world id into a record's `0x14` field and then travelling from the map loads that world: level 06 (`0x47AF396A`) loaded from station 4, level 05 (`0x817B7E55`) loaded as well, and an id that is not a world root (`0x47AF393F`) crashed the game. :observed

Five `WorldLink` objects (vtable `0x190A838`, size `0x18`) hold a source and a destination world id at offsets `0x8` and `0xC`. The link from `0x47AF3914` (level 04) to `0x8B56B7D1` (the Stronghold world) is one of them, and it is the only path found into the Stronghold. :observed

Two event classes carry a world change: `EngineLoadWorldEvent` (`0x56F6A62D`, size `0x18`, a reference-counted world name at offset `0x14`) and `SWSkateLoadWorldOrTeleportEvent` (`0x15EA8398`, size `0x80`, a 4 x 4 matrix at `0x20`, a name object at `0x60` and a type word 9 at `0x68`). The function that posts either event has not been found. :observed

A career-start save reaches only the first level: the trigger from level 01 to level 02 answers that the bridge to the administrative district is raised, and the pause map entries are greyed. Setting the station flags above does not un-grey the map, which depends on a different gate. :observed

## The skater

The skater object (`S`) keeps its feet position at `S+0x370` and the centre of the body, 0.9 m higher, at `S+0x380`, `S+0x10` and `S+0xA0`, as east, north and up coordinates in metres. The feet value is produced by the virtual function at vtable offset `0x104` (`0x6F9570`) from a physics object `P`, the pointer at `S+0x610`, and `P` keeps exact copies of the feet position at `+0x130`, `+0x1E0`, `+0xA60`, `+0xA70`, `+0xC50` and `+0xC60`. Writing the position to all of them moves the skater. A move of more than about 25 m, or onto a place without loaded ground, hangs the game. :observed

The heap addresses of `S` and `P` differ on every run. The feet frame equals the [stored placement frame](/engines/anvil/world/placement/) of the world. :observed
