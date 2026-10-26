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

## Levels

The six numbered forges are the game's main levels, named by the district strings of the English text ([localization](/engines/anvil/gameplay/localization/)). Each name below carries the id of its string. :observed

| Forge | World id | District | String id | Evidence |
|---|---|---|---|---|
| `DataPC_01.forge` | `0x47AF3893` | The Midtown Quarter | 11233 | Level 01 holds the three STRIDE challenges that string 12861 places in THE MIDTOWN QUARTER; stations 0 and 1 (strings 11262, 11263) travel to this world. :observed |
| `DataPC_02.forge` | `0x47AF38BE` | The Downtown Quarter | 11238 | Level 02 holds the WENDY'S challenges that string 12862 places in THE DOWNTOWN QUARTER; station 2 (string 11264) travels to this world. :observed |
| `DataPC_03.forge` | `0x47AF38E9` | The Rising Island | 11242 | Station 3 (string 11265) travels to this world, whose content is an island. :observed |
| `DataPC_04.forge` | `0x47AF3914` | The Restricted Area | 11252 | Station 4 (string 11266) travels to this world. :observed |
| `DataPC_05.forge` | `0x817B7E55` | unknown | none found | The cells hold `05_SkateLab_*` entities; the strings 12637 (Restricted Area Complex) and 12638 (SkateLab) are adjacent. No station reaches this world. :inferred |
| `DataPC_06.forge` | `0x47AF396A` | unknown | none found | The entities include `06_Buildings_MinistryHQ`; no string names a Ministry headquarters. :inferred |
| `DataPC_SW.forge` | `0x954D44AF` | Shaun World | 11271, 11272 | Station 5 (string 11269, Shaun Station) travels to this world. :observed |

:::open[Is level 04 the Restricted Area or the Ministry Quarter?]
The station table sends station 4, named Restricted Area Station, to world 04, but the content of level 04 includes power-plant entities (`04_Obj_PowerPlant*`), and the Department of Energy (string 11251) belongs to The Ministry Quarter (string 11249). Both readings rest on observed data and they disagree. :unknown
:::

Strings 11233 to 11254 also name the subdistricts: Midtown Quarter (The Common Place, Midtown, The Safe Harbor, The Ministry Mall), Downtown Quarter (The Bureau of Edification, Conformity Square, Tranquility Square), The Rising Island, The Underground, The Park, Ministry Quarter (The Department of Truth, The Department of Energy) and Restricted Area (The Prison Quarter, The Department of Enlightenment). :observed

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
