---
title: "Shaun White Skateboarding"
description: "Shaun White Skateboarding’s PC build, installed forge archives, levels and the Anvil systems its data uses."
games: ["shaun-white-skateboarding"]
---

Shaun White Skateboarding is Ubisoft Montreal's 2010 skateboarding game on an early Anvil (Scimitar) engine. Its class layouts and container versions follow the Assassin's Creed II generation rather than the later engine of [Riders Republic](/games/riders-republic/). :inferred[from the AC2-profile readers fitting its data]

The recorded PC build has the executable `Shaun White Skateboarding.exe`, 26,954,360 bytes, SHA-256 `c7eb65c89ab016694a2f60a5f586c451a5a02bf05f226bffc943d256128d35c4`. Every observation in the wiki's Shaun White pages comes from this executable and the data installed beside it. :observed

The game is set in the city of New Harmony, whose districts the player reaches by monorail. :observed

## Installed data

The base install holds 33 forge archives named `DataPC*.forge` beside the executable, 4,239,261,993 bytes in all, and they hold 3,894 entries. Every one of the 33 archive headers carries the `scimitar` signature and forge version 26. :proven[all 33 forges]

The archives fall into these groups. :observed

| Group | Archives | Content |
|---|---|---|
| Shared | `DataPC.forge`, `DataPC_extra.forge` | Bootstrap resources, localization and GUI data |
| Levels 01 to 06 | `DataPC_01.forge` to `DataPC_06.forge` | One world each, with its cells |
| Level variants | `_FYM`, `_Multi`, `_Robot_01`, `_Robot_02`, `_Stronghold` suffixes | Further worlds of their own, not overlays on a base level |
| Special worlds | `DataPC_SW.forge`, `DataPC_Main_Menu.forge`, `DataPC_Customization.forge` | The Shaun White world, the menu and character selection |
| Customization | `DataPC_*CustomizationData.forge` | Character and customization data |

Beside the executable are also the shader bundles `ekshadersPChigh.bin`, `ekshadersPCmed.bin` and `ekshadersPClow.bin` (see [SDB2](/engines/anvil/shaders/sdb2/)). The installed copy examined also carries `.forge.patch` files beside several forges; their layout has not been examined. :unknown

### The patched build

A patched copy of the game (executable dated 2011-08-23, forges dated 2010-10-27) differs from the recorded build in its
data. :observed It holds 40 forges: the same 33 `DataPC*` data forges plus seven `DataPC_StreamedSounds*.forge`.
:observed[one patched copy]

| | Recorded build | Patched build | Confidence |
|---|---|---|---|
| `DataPC.forge` | 38 entries, 20,545,833 bytes | 11 entries, 19,661,097 bytes | :observed |
| Entries of the 33 data forges | 3,894 | 3,867 | :observed |
| Other 32 data forges | | Same version, entry count and size as in the recorded build; 10 of them (dated 2010-10-19) byte-identical, 22 with other content | :observed |
| `DataPC_01.forge` | | Byte-identical | :observed |

Two independent readers of the forge tables, entry headers and block chunk tables agree on the patched `DataPC.forge`;
its `Graphic Bootstrap` entry keeps the same blocks (26 bytes stored raw, then 16 chunks decoding to 512,822 bytes).
No data forge of the patched copy has a bad chunk checksum, an entry header disagreeing with its records, or blocks that
do not fill their payload. :observed[every data forge of the patched copy]

The seven sound forges hold 10,308 entries besides their `GlobalMetaFile`s, and none of them begins with the
[data block](/engines/anvil/archives/data-blocks/) magic: their payloads are framed some other way. :observed

### Videos

The game's videos are loose Bink files under `Videos/`, not forge entries: the patched copy holds 77 `.bik` files,
253.7 MB and 32,596 frames in all, every one Bink 1 of revision `i`, played through the `binkw32.dll` (version 1.9u)
beside the executable. None of the 40 forges of that copy has a Bink entry, by their name records and by a byte scan.
:observed[the patched copy] Five are top-level clips, three play at start-up and 69 are trick-book clips. Five carry
audio: four clips with four tracks each at 48 kHz, and `head_tv.bik` in stereo at 44.1 kHz. :observed[the patched copy]

## Levels

The six numbered forges are the game's main levels, named by the game's district table and the strings of the English text ([localization](/engines/anvil/gameplay/localization/)). Each name below carries the id of its string. :observed

| Forge | World id | District | String id | Evidence |
|---|---|---|---|---|
| `DataPC_01.forge` | `0x47AF3893` | The Midtown Quarter | 11233 | Level 01 holds the three STRIDE challenges that string 12861 places in THE MIDTOWN QUARTER; stations 0 and 1 (strings 11262, 11263) travel to this world. :observed |
| `DataPC_02.forge` | `0x47AF38BE` | The Downtown Quarter | 11238 | Level 02 holds the WENDY'S challenges that string 12862 places in THE DOWNTOWN QUARTER; station 2 (string 11264) travels to this world. :observed |
| `DataPC_03.forge` | `0x47AF38E9` | The Rising Island | 11242 | Station 3 (string 11265) travels to this world, whose content is an island. :observed |
| `DataPC_04.forge` | `0x47AF3914` | The Ministry Quarter | 11249 | The district table lists world 04 and the Stronghold world under this district; the station of level 04 is named Restricted Area Station (string 11266). :observed |
| `DataPC_05.forge` | `0x817B7E55` | The Prison Quarter | 11253 | The district table lists this world under this district. :observed |
| `DataPC_06.forge` | `0x47AF396A` | none | none | No district lists this world; it appears only in mission tables. The entities include `06_Buildings_MinistryHQ`, but no string names a Ministry headquarters. :observed |
| `DataPC_SW.forge` | `0x954D44AF` | Shaun World | 11271, 11272 | The district table lists this world under this district; station 5 (string 11269, Shaun Station) travels to it. :observed |

The names come from the game's own district table, in the data block of the `Game Bootstrap` entry (entry 2) of `DataPC.forge`. A district object (class `0x8DF4697E`) holds a string reference (class `0x81A7045D`, the string id at offset 12 of the class word), then the ids of its worlds, then its sub-areas (class `0xBE759080`). The monorail station table is in the same block, with records of 114 bytes: the name string id at offset 0 and the world id at offset 89 (offset 129 for the Shaun station). :observed

| District | Worlds | Sub-areas (string ids) |
|---|---|---|
| The Midtown Quarter (11233) | 01 | The Common Place 11234, Midtown 11235, The Safe Harbor 11236 |
| The Downtown Quarter (11238) | 02 | The Bureau of Edification 11239, Conformity Square 11240, Tranquility Square 11241 |
| The Rising Island (11242) | 03 | The Underground 11247, The Park 11248 |
| The Ministry Quarter (11249) | 04, 04_Stronghold (`0x8B56B7D1`) | The Department of Truth 11250, The Department of Energy 11251, The Restricted Area 11252 |
| The Prison Quarter (11253) | 05 | The Department of Enlightenment 11254 |
| Shaun World (11271) | SW | Shaun World 11272 |

The station of level 04 is named Restricted Area Station (11266), but the world belongs to The Ministry Quarter, of which The Restricted Area is a sub-area. The English strings 11262 to 11269 name six stations: Midtown (01), Safe Harbor (01), Downtown (02), Rising Island (03), Restricted Area (04) and Shaun (SW). The in-game city map shows the Restricted Area node with the panel text of string 11249. :observed

Strings 12635 to 12638 (Conformity Square Rooftops, Rising Island Park, Restricted Area Complex, SkateLab) are four string references in the same block, each followed by a world id of a multiplayer world: `02_Multi`, `03_multi`, `04_Multi` and `05_MULTI`. They name those worlds, not levels 04 and 05. :observed

## Data systems

The container is a [forge](/engines/anvil/archives/forge/) of version 26 whose entries are framed as [data blocks](/engines/anvil/archives/data-blocks/) compressed with LZO2A. :proven[all 33 forges]

- Objects and classes: [object streams](/engines/anvil/data-model/resources/), [class ids](/engines/anvil/data-model/class-registry/), [entities](/engines/anvil/data-model/entities/) and [visuals with LOD selectors](/engines/anvil/data-model/visual-instances/).
- World: [world roots](/engines/anvil/world/world-resource/), [cells](/engines/anvil/world/grids/), [placement](/engines/anvil/world/placement/) and [world travel](/engines/anvil/runtime/world-travel/).
- Geometry: [meshes](/engines/anvil/geometry/mesh/) and [vertex layout](/engines/anvil/geometry/vertex-formats/).
- Materials and textures: [material body](/engines/anvil/materials/material/), [UV rotation](/engines/anvil/materials/uv-transforms/), [render state](/engines/anvil/materials/render-state/), [influence](/engines/anvil/materials/influence/), [texture maps](/engines/anvil/textures/texture-map/) and [format codes](/engines/anvil/textures/format-codes/).
- Shaders and light: [SDB2 bundles](/engines/anvil/shaders/sdb2/), [baked lighting](/engines/anvil/lighting/global-illumination/), [lights](/engines/anvil/lighting/lights-and-emission/) and [the sky light](/engines/anvil/lighting/sky-and-atmosphere/).
- Collision, grinds, trees and text: [mesh shapes](/engines/anvil/collision/mesh-shape/), [surfaces](/engines/anvil/collision/materials/), [skate guidance](/engines/anvil/gameplay/skate-guidance/), [RealTree meshes](/engines/anvil/vegetation/realtree/) and [localization](/engines/anvil/gameplay/localization/).

:::open[Which public engine revision is this?]
Forge version 26 and the class layouts match the Assassin's Creed II generation of Anvil, but an exact engine revision is not established. :unknown
:::
