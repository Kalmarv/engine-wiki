---
title: Character parts, forms and display masks
description: Character containers, NPC mesh masks and the equipment links for part-built humans.
sources:
  - title: Sekiro modding wiki Models
    url: https://github.com/SekiroResurrection/modding-wiki/wiki/Models
  - title: Smithbox
    url: https://github.com/vawser/Smithbox
  - title: Paramdex
    url: https://github.com/soulsmods/Paramdex
implementations:
  - name: primase character reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/sekiro/read/character.rs
---

Characters use `chr/cNNNN.chrbnd.dcx` model binders and animation binders, while equipment parts use
`parts/<part>.partsbnd.dcx`. One part binder can contain multiple forms with separate models and animations.
:observed

Sekiro's `wp_a_0761_l` contains closed and open Loaded Umbrella forms, each with its own animation binder.
:observed{games="sekiro"} Elden Ring's `wp_a_1152_l` has two forms sharing mesh geometry with different materials.
:observed{games="elden-ring"}

## Display masks

A material-name mark `#XX#` assigns a mesh to display group XX. `NpcParam.modelDispMaskXX` enables that group; an
unmarked mesh is always visible under this rule. Smithbox applies groups 0–31. :sourced[Smithbox]

The Sekiro community description gives the range as 01–31, while actual `c1010` materials also contain `#00#`.
:sourced[Sekiro modding wiki]{games="sekiro"} :observed{games="sekiro"}

The NPC row comes from each enemy or dummy-enemy placement; it is not necessarily a property shared by every
occurrence of a character model. Every map enemy's model/NPC-row link in the independent comparison matches the MSB
decode. :proven

:only[elden-ring] `c3000` uses groups `#00#` through `#12#` for swords, crossbows, spears, shields, torch and whistle.
This makes visible weapons part of the mesh-mask selection for that model. :observed{games="elden-ring"}

Animation events can change these groups during a clip; see [TAE](/engines/fromsoft/animation/tae/).
:sourced[Smithbox]

## Part-built human NPCs

:only[sekiro] The equipment link is `MSB Enemy.CharaInitID → CharaInitParam → EquipParamProtector`.
NpcParam's display masks are a separate mechanism. :sourced[Paramdex]{games="sekiro"}

| Row | Relevant fields | Confidence |
|---|---|---|
| Sekiro CharaInitParam | Armor IDs at `+32..48`; `npcPlayerSex` at `+228` | :sourced[Paramdex]{games="sekiro"} |
| Sekiro EquipParamProtector | `equipModelId` at `+160`; gender mode at `+209` | :sourced[Paramdex]{games="sekiro"} |

A negative placement initializer ID names no authored initializer. :observed{games="sekiro"}

:::open[How are ambiguous part spellings and combinations resolved?]
The checked fields do not fully establish selection among `m`, `f`, `a`, `hd`, `fc` or level-suffix alternatives.
Choosing whichever binder exists is not evidence of the game's rule. Face generation, body shape and runtime
equipment replacement are also outside these field interpretations.
:::

:::open[What if one mesh contains several display marks?]
No examined character needs that combination. Neither the community description nor the checked renderer rule
establishes whether multiple marks mean any enabled bit or all enabled bits.
:::
