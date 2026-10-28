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

The Sekiro community description gives the range as 01–31. :sourced[Sekiro modding wiki]{games="sekiro"}
Actual `c1010` materials also contain `#00#`. :observed{games="sekiro"}

Over every FLVER of both archive sets, 7,926 Sekiro material names (in 3,075 models) and 15,543 Elden Ring ones (in 3,378)
contain a `#`. :proven[every FLVER of both archive sets] Most are a mark at the start, `#dd#` followed by a name: 1,695
Sekiro materials in 238 models and 12,257 Elden Ring materials in 1,715. One-digit marks (`#1#`) are 6 Sekiro and 1,317
Elden Ring materials. Three-digit marks (`#100#`, `#101#`) are 76 Elden Ring materials in 4 models. A mark that does not
start the name (`c1200_Mukade#00#`, `AET652_007#1#`) is 4 Sekiro materials in 2 models and 2 Elden Ring materials in 1.
The other `#` are not marks: `Material #7` and the like, 6,221 and 1,891 materials. No name in either install has two
marks, a space inside a mark or an empty mark (`##`). :proven[every FLVER of both archive sets]

Rules that read only a mark at the start with one or two digits, and rules that scan for any `#digits#`, therefore give
the same groups for all but 82 materials in 7 models (the non-leading and the three-digit marks); a rule that takes
exactly two digits after a leading `#` reads `#100#` as group 10 and ignores the one-digit marks. Which of these the game
applies is not established. :unknown

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

:::open[What if one mesh contains several display marks?]
No examined character needs that combination. Neither the community description nor the checked renderer rule
establishes whether multiple marks mean any enabled bit or all enabled bits.
:::

## Sekiro

### Character binders

Character model IDs name characters: `c1010` is the Ashina Soldier, `c5000` the Corrupted Monk, `c5100` the
Guardian Ape and `c7400` Emma. :sourced[Smithbox]{games="sekiro"} The player model `c1000` holds no visible body; the
Wolf the player sees is assembled from equipment parts. :inferred{games="sekiro"}

`c1010.chrbnd.dcx` holds the FLVER, the Havok skeleton `c1010.HKX`, `c1010.hkxpwv`, `c1010_c.hkx` and
`c1010_c.clm2`. Its animation binder holds 350 Havok 2016.2 tagfiles (`hkaAnimationContainer`), one TAE and a type
compendium. The FLVER has 400 nodes, 81 dynamic meshes, 140,330 vertices and 76 dummies. :observed{games="sekiro"}

### Textures outside the model binder

:only[sekiro] Shared character detail textures `FC_A_0000_*` (60 of them: hair, fabric blends 01–05, metals,
chainmail, seams, straw, rope, bandage, skin detail, hand and footwear) are in the standalone
`/parts/common_body.tpf.dcx`. Characters also take textures from texture-only characters that their material
names mention: `c1010`'s body uses `c1019_body_merge_SSS.mtd`, whose textures are in `/chr/c1019.texbnd.dcx`;
`c1019` has no model binder. :observed{games="sekiro"}
Over the materials of all 129 character model binders of the install, the definitions bind 3,237 (model, texture) pairs
by a texture path of the definition (the FLVER's own texture paths are empty in 99.4% of its bindings). 2,257 are in the
model's own `texbnd`, `common_body.tpf.dcx` or `systex.tpf.dcx`; 939 are in the `texbnd` of a character whose id the
definition's texture path names (`c7201` binds `c7209_tilingskin03_a`, held by `/chr/c7209.texbnd.dcx`): 581 in the model's
own sibling `cNNN9` (the install holds 16 such binders: `c1019`, `c1029`, `c1219`, `c1259`, `c1459`, `c1559`, `c5069`,
`c5089`, `c5209`, `c5409`, `c7019`, `c7109`, `c7209`, `c7309`, `c7409`, `c7439`), 279 in another `cNNN9` and 79 in the binder
of a character with another id (`c5440` binds `c5408_weapon00_a`); the other 41 are in no character binder (20 are in the
area package `/map/m25/m25_0000`, 21 in no texture package of the install). No stem is held by both a `cNNN9` binder and
`common_body.tpf.dcx` or `systex.tpf.dcx`, so the order in which a reader searches them does not change which texture a
name gives. :proven{games="sekiro"}

:only[sekiro] A low-resolution `_l` part binder holds `_l` textures (`BD_M_9120_a_l`) while its materials name the
full textures (`bd_m_9120_a`), which are in the full sibling binder `parts/bd_m_9120.partsbnd`. The face's
materials name `fc_m_0200_*` textures, kept in `parts/fc_m_0200.partsbnd`. :observed{games="sekiro"}

### Part-built human NPCs

:only[sekiro] The equipment link is `MSB Enemy.CharaInitID → CharaInitParam → EquipParamProtector`.
NpcParam's display masks are a separate mechanism. :sourced[Paramdex]{games="sekiro"}

| Row | Relevant fields | Confidence |
|---|---|---|
| Sekiro CharaInitParam | Armor IDs at `+32..48`; `npcPlayerSex` at `+228` | :sourced[Paramdex]{games="sekiro"} |
| Sekiro EquipParamProtector | `equipModelId` at `+160`; gender mode at `+209` | :sourced[Paramdex]{games="sekiro"} |

A negative placement initializer ID names no authored initializer. :observed{games="sekiro"}

In Sekiro's gameparam the 203 CharaInitParam rows have 812 equipment slots at those offsets; 811 name an existing
EquipParamProtector row and one holds -1. Slot 0 names protectors of category 3 (169 rows) or 0 (33 rows), slot 1 of
category 2, slot 2 of category 1 and slot 3 of category 6, with no other category. :observed{games="sekiro"} The 39
protector rows have categories 0 (1 row), 1 (9), 2 (15), 3 (6), 5 (1) and 6 (7). Of the six category-3 rows with a model
id, all six have only an `fc_` part binder in the archives, while rows of the other categories have `am_`, `bd_`, `hd_`
and `lg_` binders under their model ids. :observed{games="sekiro"}

#### The Wolf's outfits

CharaInitParam rows 9000 to 9002 (Original Memory: Wolf) equip protector rows 100000 (head), 101000 (body),
102000 (arms) and 103000 (legs). EquipParamProtector maps them to models 200 (face, `fc_`), 9040 (body, `bd_`),
9000 (arms, `am_`) and 9000 (legs, `lg_`), male, so the default Wolf is `fc_m_0200_l`, `bd_m_9040_l`,
`am_m_9000_l` and `lg_m_9000_l`: the orange coat, scarf and prosthetic. Row 10000, the game's start, equips
100000, 141000, 112000 and 103000, without the prosthetic. :observed{games="sekiro"}

The parts `am_m_9120_l`, `bd_m_9120_l`, `lg_m_9120_l` and `hd_m_9120_l` with `fc_m_0220_l` are the Another's
Memory: Ashina costume, EquipParamProtector rows 400000 to 403000; head row 400000 uses model 220. None of the
39 EquipParamProtector rows uses model 9120 for the head. :observed{games="sekiro"} The Paramdex layouts used here match
the stored row sizes, 472 bytes for CharaInitParam and 508 for EquipParamProtector, and each row's slot flag
matches its category. :observed{games="sekiro"} That category 3 is the face matches the `fc_` binders just described. :observed{games="sekiro"}

`bd_m_9040_l` has no display-mask meshes. Its coat (`P_BD_M_9040_Court`, shader
`Character_AN_Blend_AMSN_[Fresnel]`) and scarf (`tops1_Maffler`, `Character_AMSN_[DetailBlend]`) blend the detail
fabrics `FC_A_0000_Fabric_blend01` and `FC_A_0000_Fabric_blend05`. :observed{games="sekiro"}

#### Joining parts into one skeleton

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

## Elden Ring

### Outfits of part-built humans

:only[elden-ring] The equipment link has the same shape as Sekiro's: an initializer row names four protector rows, and a
protector row names the part. The fields are at these offsets in every one of the 29 regulations examined (1.00.0 to
1.17.3), except `CHR_EQUIP_MODEL_PARAM_ST`, which exists from 1.12.1. :observed{games="elden-ring"}

| Row | Fields | Confidence |
|---|---|---|
| CharaInitParam (`CHARACTER_INIT_PARAM`, data version 2, 320-byte rows) | Protector row IDs at `+32` (head), `+36` (body), `+40` (arms), `+44` (legs); `npcPlayerSex` at `+228` | :observed{games="elden-ring"} |
| EquipParamProtector (`EQUIP_PARAM_PROTECTOR_ST`, data version 6, 416-byte rows) | `equipModelId` (u16) at `+164`; `equipModelCategory` at `+212`; `equipModelGender` at `+213` | :observed{games="elden-ring"} |
| ChrEquipModelParam (`CHR_EQUIP_MODEL_PARAM_ST`, data version 1, 12-byte rows) | Twelve rows; Paramdex names the first byte the category, the second the gender and the u16 at `+8` `equipModelId`; all twelve rows hold 0 in the first two bytes and 4 at `+4` | :sourced[Paramdex]{games="elden-ring"} |

Sekiro's offsets at `+160`, `+208` and `+209` are not valid in Elden Ring: read at those offsets the 838 protector rows hold
255 in both byte fields. The initializer's four slots are the same four offsets as in Sekiro. :observed{games="elden-ring"}

In the installed 1.17.3 regulation the 3,273 initializer rows have 13,092 slots: 11,880 name an existing protector row, 1,147
hold -1 and 65 name a row that does not exist. Every protector named by slot 0 has category 5, by slot 1 category 2, by
slot 2 category 1 and by slot 3 category 6 (2,898, 3,041, 2,919 and 3,022 slots). Reading the slots one byte further on
resolves none of them. The categories are 1 arms, 2 body, 4 hair, 5 head and 6 legs, and the genders 1 male, 2 female, 3
unspecified and 4 none, by the names of Smithbox's enums. :sourced[Smithbox] The 838 protector rows hold categories
1, 2, 4, 5, 6 in 137, 274, 41, 235 and 151 rows, and genders 1, 2, 3, 4 in 20, 25, 96 and 697. The hundreds digit of the
row ID is 2 for 136 of the 136 arms rows with a model id, 1 for 268 of 273 body rows, 0 for 233 of 234 head rows and 3
for 149 of 150 leg rows. :observed{games="elden-ring"}

A protector's model id names the part binder `parts/<hd|bd|am|lg>_<m|f>_<id, four digits>.partsbnd.dcx` for its category
(head, body, arms, legs). Of the 793 rows with a model id and one of those four categories, 789 have that binder in the
archives, and in none of the 793 does a binder lack its `_l` sibling or the reverse. By gender: the 693 gender-4 rows with
a binder have `m` only (688) or both letters (5), and 4 gender-4 rows have none; of 91 gender-3 rows, 88 have both
letters, 2 only `f` and 1 only `m`; the 5 gender-2 rows have `f` only. No `a` binder exists for any protector row.
:observed{games="elden-ring"}

:::open[Which part letter does `npcPlayerSex` select in Elden Ring?]
The value is 0 in 512 initializer rows and 1 in 2,761; no enum names the two values. Among the 22 slots that name a
female-only protector (gender 2), 19 belong to rows with value 0 and 3 to rows with value 1, and no row equips a male-only
protector in a body, arms, head or legs slot, so the examined rows do not say which value is the male one.
:::
