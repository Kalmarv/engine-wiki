---
title: "Shaun White Skateboarding"
description: "Shaun White Skateboarding’s PC build, installed forge archives and the Anvil systems its levels are stored in."
games: ["shaun-white-skateboarding"]
---

Shaun White Skateboarding is Ubisoft Montreal's 2010 skateboarding game on an early Anvil (Scimitar) engine. Its class layouts and container versions follow the Assassin's Creed II generation rather than the later engine of [Riders Republic](/games/riders-republic/). :inferred[from the AC2-profile readers fitting its data]

The recorded PC build has the executable `Shaun White Skateboarding.exe`, 26,954,360 bytes, SHA-256 `c7eb65c89ab016694a2f60a5f586c451a5a02bf05f226bffc943d256128d35c4`. Every observation in the wiki's Shaun White pages comes from this executable and the data installed beside it. :observed

The game is set in the city of New Harmony, and its levels are skate areas the player travels between by monorail. :observed

## Installed data

The base install holds 33 forge archives named `DataPC*.forge` beside the executable, 4,239,261,993 bytes in all, and they hold 3,894 entries. Every one of the 33 archive headers carries the `scimitar` signature and forge version 26. :proven[all 33 forges]

The archives fall into these groups. :observed

| Group | Archives | Content |
|---|---|---|
| Shared | `DataPC.forge`, `DataPC_extra.forge` | Bootstrap resources, localization and GUI data |
| Levels 01 to 06 | `DataPC_01.forge` to `DataPC_06.forge` | One world each, with its grid cells |
| Level variants | `_FYM`, `_Multi`, `_Robot_01`, `_Robot_02`, `_Stronghold` suffixes | Further worlds of their own, not overlays on a base level |
| Special worlds | `DataPC_SW.forge`, `DataPC_Main_Menu.forge`, `DataPC_Customization.forge` | The Shaun White world, the menu and character selection |
| Customization | `DataPC_*CustomizationData.forge` | Character and customization data |

The installed copy examined also carries `.forge.patch` files beside several forges. Their layout has not been examined. :unknown

## Data systems

The container is a [forge](/engines/anvil/archives/forge/) of version 26, not 27, and its entries are framed as [data blocks](/engines/anvil/archives/data-blocks/) compressed with a different algorithm from later games. :proven[all 33 forges]

:::open[Which public engine revision is this?]
Forge version 26 and the class layouts match the Assassin's Creed II generation of Anvil, but an exact engine revision is not established. :unknown
:::
