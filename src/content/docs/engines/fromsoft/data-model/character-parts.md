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

Character model IDs name characters: `c1010` is the Ashina Soldier, `c5000` the Corrupted Monk, `c5100` the
Guardian Ape and `c7400` Emma. :sourced[Smithbox]{games="sekiro"} The player model `c1000` holds no visible body; the
Wolf the player sees is assembled from equipment parts. :inferred{games="sekiro"}

`c1010.chrbnd.dcx` holds the FLVER, the Havok skeleton `c1010.HKX`, `c1010.hkxpwv`, `c1010_c.hkx` and
`c1010_c.clm2`. Its animation binder holds 350 Havok 2016.2 tagfiles (`hkaAnimationContainer`), one TAE and a type
compendium. The FLVER has 400 nodes, 81 dynamic meshes, 140,330 vertices and 76 dummies. :observed{games="sekiro"}

## Textures outside the model binder

:only[sekiro] Shared character detail textures `FC_A_0000_*` (60 of them: hair, fabric blends 01–05, metals,
chainmail, seams, straw, rope, bandage, skin detail, hand and footwear) are in the standalone
`/parts/common_body.tpf.dcx`. Characters also take textures from texture-only characters that their material
names mention: `c1010`'s body uses `c1019_body_merge_SSS.mtd`, whose textures are in `/chr/c1019.texbnd.dcx`;
`c1019` has no model binder. :observed{games="sekiro"}

:only[sekiro] A low-resolution `_l` part binder holds `_l` textures (`BD_M_9120_a_l`) while its materials name the
full textures (`bd_m_9120_a`), which are in the full sibling binder `parts/bd_m_9120.partsbnd`. The face's
materials name `fc_m_0200_*` textures, kept in `parts/fc_m_0200.partsbnd`. :observed{games="sekiro"}

## Display masks

A material-name mark `#XX#` assigns a mesh to display group XX. `NpcParam.modelDispMaskXX` enables that group; an
unmarked mesh is always visible under this rule. Smithbox applies groups 0–31. :sourced[Smithbox]

The Sekiro community description gives the range as 01–31. :sourced[Sekiro modding wiki]{games="sekiro"}
Actual `c1010` materials also contain `#00#`. :observed{games="sekiro"}

The NPC row comes from each enemy or dummy-enemy placement; it is not necessarily a property shared by every
occurrence of a character model. Every map enemy's model/NPC-row link in the independent comparison matches the MSB
decode. :proven

:only[elden-ring] `c3000` uses groups `#00#` through `#12#` for swords, crossbows, spears, shields, torch and whistle.
This makes visible weapons part of the mesh-mask selection for that model. :observed{games="elden-ring"}

NpcParam's `normalChangeTexChrId` names another character whose textures the model uses. :sourced[Paramdex] It is
set on 245 of the 577 NPC rows that Sekiro's map placements reference, and on 520 of 2,695 in Elden Ring.
:observed

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

### The Wolf's outfits :only[sekiro]

CharaInitParam rows 9000 to 9002 (Original Memory: Wolf) equip protector rows 100000 (head), 101000 (body),
102000 (arms) and 103000 (legs). EquipParamProtector maps them to models 200 (face, `fc_`), 9040 (body, `bd_`),
9000 (arms, `am_`) and 9000 (legs, `lg_`), male, so the default Wolf is `fc_m_0200_l`, `bd_m_9040_l`,
`am_m_9000_l` and `lg_m_9000_l`: the orange coat, scarf and prosthetic. Row 10000, the game's start, equips
100000, 141000, 112000 and 103000, without the prosthetic. :observed{games="sekiro"}

The parts `am_m_9120_l`, `bd_m_9120_l`, `lg_m_9120_l` and `hd_m_9120_l` with `fc_m_0220_l` are the Another's
Memory: Ashina costume, EquipParamProtector rows 400000 to 403000; head row 400000 uses model 220. None of the
39 EquipParamProtector rows uses model 9120 for the head. :observed{games="sekiro"} The Paramdex layouts used here match
the stored row sizes, 472 bytes for CharaInitParam and 508 for EquipParamProtector, and each row's slot flag
matches its category. :observed{games="sekiro"} That category 3 is the face is inferred. :inferred{games="sekiro"}

`bd_m_9040_l` has no display-mask meshes. Its coat (`P_BD_M_9040_Court`, shader
`Character_AN_Blend_AMSN_[Fresnel]`) and scarf (`tops1_Maffler`, `Character_AMSN_[DetailBlend]`) blend the detail
fabrics `FC_A_0000_Fabric_blend01` and `FC_A_0000_Fabric_blend05`. :observed{games="sekiro"}

### Joining parts into one skeleton

Each part binder holds one FLVER, version `0x2001A`. The five Another's Memory parts have 184, 185, 161, 155 and
422 nodes (arms, body, legs, head, face); every mesh is dynamic with an empty palette, and the UByte4Norm weights
sum to 0.988–1.0. :observed{games="sekiro"} The parts hold 502 distinct node names; `Ctrl_Spine` and `Ctrl_Spine1` occur
twice inside the face part, so the joined skeleton has 504 joints. :observed{games="sekiro"}

A part stores a node with parent −1 when its real parent lives in another part; the five parts have 391 such
detached roots. Their local rest transforms are placeholders that differ between parts by up to 2 m, and no vertex
weights them; every joint a part's skin weights has a complete chain inside it. :observed{games="sekiro"} The face part's head
and face joints differ from the body and head parts' copies by up to 4.7e-3 in matrix entries, about 1.05 mm of
vertex displacement. :observed{games="sekiro"}

:::open[How are ambiguous part spellings and combinations resolved?]
The checked fields do not fully establish selection among `m`, `f`, `a`, `hd`, `fc` or level-suffix alternatives.
Choosing whichever binder exists is not evidence of the game's rule. Face generation, body shape and runtime
equipment replacement are also outside these field interpretations.
:::

:::open[What if one mesh contains several display marks?]
No examined character needs that combination. Neither the community description nor the checked renderer rule
establishes whether multiple marks mean any enabled bit or all enabled bits.
:::
