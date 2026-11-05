---
title: What starts an effect
description: "The records that name an effect by its id (params, animation events, map regions, event scripts, other effects), how many effect files each reaches, and the routes from a spell, a bullet, an item and a weapon to its effects."
games: [sekiro, elden-ring]
sources:
  - title: Smithbox
    url: https://github.com/vawser/Smithbox
    note: Param Meta ExtRefs (which param fields name an FXR), the paramdefs and the TAE event templates
  - title: fxr
    url: https://github.com/EvenTorset/fxr
    note: Unlicense. The names of the FXR actions, among them SFXReference
implementations:
  - name: fromsoft-formats (census effects)
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/tests/census/effects.rs
---

An [FXR file](/engines/fromsoft/effects/fxr/) runs because something names its id: a param row (a spell's cast effect, a
bullet's flight and hit, a status's visual), an animation event (a one-shot effect at a dummy polygon, a weapon's blade), a
map region, an event script, or another effect that spawns it. An effect file names the effects it spawns and nothing that
starts it. :observed[every effect file of both installs]

## How much each kind of record reaches

A census reads every effect binder (`/sfx/*.ffxbnd.dcx`), every event file of the animation binders (`*.anibnd.dcx` and those
inside object, part and asset binders), every map layout, every event script and every param table of the install, and counts
an effect file as reached when one of these names it:

- a param field whose name or its table's says `sfx` or `ffx` (the community's paramdef names) and whose values agree: at
  least three distinct values of 1,000 or more in the field are effect files, and they are at least half of its distinct
  values of 1,000 or more (82 fields in Elden Ring, among them all fifteen of `HitEffectSfxParam`; 87 in Sekiro). The values
  leave the enumerations, sizes, flags and dummy polygons whose names say `sfx` and whose small values match low effect
  ids; the name leaves fields whose values match effect ids by chance (below);
- an animation event field the community template names `FFX ID` (events 96, 118 and 120 hold effect ids; see below);
- a map SFX or wind SFX region ([type 5 and 6](/engines/fromsoft/world/msb/#effect-regions-type-5));
- an event-script argument the instruction table names `SFX ID`, stored in the instruction or passed in by an initialiser that
  starts the event (in any script of the install);
- the `SFXReference` action of an effect that is itself reached, followed down the spawns (an effect only an unreached effect
  spawns is unreached).

| Effect files reached | Elden Ring | Sekiro | Confidence |
|---|---:|---:|---|
| effect files (distinct ids) | 11,912 | 2,669 | :proven[every member of every effect binder] |
| by params | 5,851 | 1,101 | :observed |
| by animation events | 3,300 | 825 | :observed |
| by a reached effect's spawn | 1,460 | 258 | :observed |
| by map layouts | 159 | 142 | :observed |
| by event scripts | 153 | 32 | :observed |
| by any of them | 9,571 (80.3%) | 2,058 (77.1%) | :observed |
| by none | 2,341 | 611 | :observed |

The counts hold for the rules above over every record of both installs (Elden Ring's with the Shadow of the Erdtree
archive, `DLC.bhd`), except three of Sekiro's param tables the census does not read (the two behaviour banks' defaults and
the menu colour table, whose headers carry format flags 1 and 2). :observed[every record of both installs] The effect files
are the same with and without the DLC archive: its effect binders are in the base archives. Without it, Elden Ring has 935
map layouts against 1,347 with it, and 1,088 animation event files against 1,299. :observed The largest single routes are
params alone (4,893 effects in Elden Ring, 874 in Sekiro) and animation events alone (2,794 and 726). :observed Of the
effects none of them reaches, Elden Ring's `commoneffects` binder holds 994, `commoneffects_dlc02` 255, the map binders 1,002
(`m60` 260, `m19` 116, `m21` 76), the character binders 121 and the mimic binders 150; Sekiro's `commoneffects` holds 380
and its map binders 253 (`m11` 142); an effect held by two binders counts in each. :observed

The values alone mark fields whose names say they hold something else. In Elden Ring 12 fields pass the value test but
have no `sfx` or `ffx` in the table or field name, among them `EquipParamAccessory.sellValue` (3 of its 4 values of 1,000
or more are effect ids), `BonfireWarpTabParam.sortId` (11 of 18), `AtkParam_Npc.throwTypeId` (5 of 6) and
`WeatherParam.SoundId` (3 of 3). In Sekiro there are 9, among them `CharaInitParam.equip_Helm` (3 of 5) and the four
`HitEffectSeHitWallParam` sound fields (4 of 4 each). Without the name test they reach 32 effect files in Elden Ring and 9
in Sekiro that nothing else does. :observed[every field of every param of both installs] That these are coincidences is
read from their names. :inferred

Held to Smithbox's Elden Ring param meta, the fields it marks as effect files (an `ExtRefs` to an `.fxr` path) agree with
the rule. Of the meta's effect fields in the tables read, 61 are taken. 215 hold no value of 1,000 or more, 54 hold at most
two effect ids, and `RoleParam.sosSignSfxId` holds 4 among 9. :observed[the meta at Smithbox fdde3225 against every row of
the install] The rule finds 21 effect fields the meta does not mark, each with every value of 1,000 or more an effect id:
the fifteen of `HitEffectSfxParam` (179 distinct ids each), `MapMimicryEstablishmentParam.mimicrySfxId0` to `2` (41, 41
and 40) and `WeatherParam.SfxId`, `SfxIdOutdoor` and `WindSfxId` (13, 6 and 3). :observed Sekiro's meta marks no field as
an effect file. :observed[every file of Smithbox's SDT meta]

The effects a field names do not all sit in one binder (counted below as distinct ids over all rows, the -1 and 0 that name
nothing left out). Of the distinct ids of each `HitEffectSfxParam` field, 168 are in `sfxbnd_commoneffects` and 11 in
`sfxbnd_commoneffects_dlc02`. `mimicrySfxId0` to `2` each name one effect of the common
binder (302604, 302605 and 302606), and every other id they hold is in a binder of its own named for it
(`sfxbnd_mimic000302607` holds 302607; 302756 is in two). `WeatherParam.SfxId` names 8 effects of the common binder, one of
the DLC's and four of the area binders `m11`, `m28` and `m61`; `SfxIdOutdoor` one of the common binder, one of the DLC's and
four of `m61`; `WindSfxId` three of the common binder (808004 also in the binders of characters 5210 and 5250).
:observed[every row of the three params against every effect binder of the install] Four sibling fields hold too little to
tell by their values: `mimicryBeginSfxId0` to `2` and `WeatherParam.SfxIdInoor` hold -1 in every row, `mimicryEndSfxId0` to
`2` hold 302603 in every row and `WeatherParam.GroundHitSfxId` holds 1004010 in 46 rows (-1 in the rest), both effects of the
common binder. :observed[every row of the two params] `HitEffectSfxParam` also has five `Neutral_*` fields named
like the fifteen; they hold 0 in every row. :observed[every row of the param] What starts these (the game's code, an id computed from another, a
record no rule here reads) is not known. :unknown

Event scripts name more effects through their arguments than in their instructions: Elden Ring's "Create Asset-following SFX"
names an effect file in 349 instructions directly and in 589 initialiser calls that pass the id to an event using it, and
"Spawn Oneshot SFX" in 231 and 24; Sekiro's "Create Object-following SFX" in 81 and 59. :observed[every event script of both
installs]

:::open[What starts the effects no record names?]
A fifth of Elden Ring's effect files and a quarter of Sekiro's are named by none of the records above.
:::

## Spells, bullets and items

A spell's effects are named by its `Magic` row and the bullets it fires: `castSfxId` (235 rows of Elden Ring's `Magic` name an
effect file), `fireSfxId` (220) and `effectSfxId` (131); a bullet's `sfxId_Bullet` (its flight: 10,190 rows in Elden Ring, 651 in
Sekiro), `sfxId_Hit` (5,858 and 411) and `sfxId_Flick` (1,613 and 338); an item's `EquipParamGoods` `castSfxId` (311 and 43),
`fireSfxId` (235 and 39) and `effectSfxId` (95, Elden Ring). :observed[every row of both regulations] The few rows of each
field that hold a positive id no effect file has (3, 5 and 13 in `Magic`; 52, 15 and 6 in Elden Ring's `Bullet`) name effects
the install does not hold. :observed The fields' meanings are their names'. :sourced[Smithbox paramdefs]
For example, Comet Azur (`Magic` 4200) names its cast effect 526250 and the effect 526255; its bullets 10420000 to 10420004
name the flight effects 526251, 526252 and 526254 and the hit 526253. :observed

:only[elden-ring] Glintstone Pebble's bullet 10400000 flies effect 523002 and hits with 523003; Great Glintstone Shard's
10400100 flies 523022 and hits with 523023 ([their rows](/engines/fromsoft/data-model/params/#magic-and-bullet)).
:observed{games="elden-ring"} The flight effect carries most of the spell's look, and most of it depends on motion: 523022
holds 7 Tracer nodes (6 on texture `s26041`, 1 on `s26061`), which draw a band along the emitter's past positions, and 4
EqualDistanceEmitter nodes, which by their name make particles at equal distances along the path, beside point sprites (`s10091`), billboards
(`s10020`, `s10030`), a Model node (model 83050) and a RichModel node (model 84016). :observed[the effect file]{games="elden-ring"}
In a frame with the shard launched by its id, its tracers are the frame's `GXFfxtessellateTracerTextureGlowD` draws on those
textures and its point sprites the `PointSpriteGlowD` draws; every one of its draws is a `GlowD` program, writing the
[glow target](/engines/fromsoft/lighting/tone-mapping/#glow-and-the-glare) beside the colour. :observed[one frame, the draws matched
to the nodes by texture]{games="elden-ring"} Two frames of one launched bullet show the motion: while the bullet had not yet
moved its tracers had no length, and once it flew they trailed 1.2 m behind its head. :observed[two frames]{games="elden-ring"}

An item's use plays a player animation numbered `50000 + 10 × goodsUseAnim`: for 44 of the 68 distinct values of
`EquipParamGoods.goodsUseAnim` (2,176 of its 2,329 rows) the player's `a00` event file holds that animation, and for 24 values
(153 rows; among them 16, 26, 42, 254 and 255) it holds none. :observed[every goods row against the player's event files]
That the game plays that animation for the value is a fit, not read from code. :inferred Its effects are the animation's
events: Golden Vow (`EquipParamGoods` 2003170, `goodsUseAnim` 49) is animation 50490, whose events start effect 302470 at
dummy polygon 901 from 0.167 to 2.867 s and effect 302471 at the same polygon from 1.0 to 1.1 s (both event 96), and name
special effect 530012 (event 401). :observed No param row names animation 50490 or effects 302470 to 302473.
:observed[every row of the regulation]

## The routes, and what the animation events hold

The routes one by one, with the share of ids in each that exist and reach a light (the effect itself or an effect it spawns
holds a light):

| Route | Elden Ring | Sekiro |
|---|---|---|
| param fields: 323 `ExtRefs` fields of 16 params (`AssetModelSfxParam` `sfxId_0` to `7`, `Bullet`, `Magic`, `SpEffectVfx`, `FootSfxParam`, `ThrowDirectionSfxParam`, ...) | 5,521 distinct ids, 5,139 exist, 2,858 reach a light | none (no definitions); the same kind of fields found by name and hit rate: 1,212 ids, 1,000 exist, 221 reach |
| map regions of type SFX (5): effect id in the first word of the type data, a start-disabled flag after it ([layout](/engines/fromsoft/world/msb/#effect-regions-type-5)) | 1,523 regions in 104 maps; 109 name an effect that reaches a light | 1,872 regions in 9 maps; 96 |
| WindSFX regions (6): effect id first | 72, none reach a light | 106, none |
| placed asset or object: ER asset part type data +0x1c (i16 relative id) selects [`AssetModelSfxParam`](/engines/fromsoft/data-model/params/#modelsfxparam-and-assetmodelsfxparam) row `(nnn x 1000 + mmm) x 1000 + relative id` for the model `AEGnnn_mmm`; Sekiro `ModelSfxParam` row `object model number x 1000` | 409,246 of 421,253 asset parts have -1; 9,396 parts on 352 models reach a light | 1,418 of 10,538 object parts on 80 models |
| TAE events 96 and 118 (and 120 in Elden Ring): the effect id is the first word (the other events the community templates give an effect field are below) | 2,788 ids; all that reach a light are in character animation binders | 762 ids; likewise |
| `HitEffectSfxParam`: 15 fields named by the kind of hit (`Slash_S` to `Thrust_Specific2` in Elden Ring, `Slash_S` to `Thrust_LLL` in Sekiro) | 193 rows, 585 distinct ids that exist | 69 rows, 101 ids |
| EMEVD instructions 2006[3] (effect id in argument 3) and 2006[4] (argument 2) | 35 and 78 ids | 10 and 11 ids |

:observed[hit-rate and reference census over both installs]
A scan of every field of every param, every payload word of every TAE event kind and every argument of every EMEVD instruction
in both installs (a location is a route when at least three distinct values of 1,000 or more in it are effect ids that exist
and they are at least half of its distinct values of 1,000 or more) finds, besides the routes above, only locations naming at
most 20 effects each, which read as numeric coincidences (for example `CharaInitParam` `equip_Helm` in Sekiro, `ObjActParam`
`actionFailedMsgId` in Elden Ring). With the two added rows, 1,991 of Sekiro's 2,669
effect files (74.6%) and 8,958 of Elden Ring's 11,912 (75.2%) are named by a route or spawned by an effect that is, against
1,869 (70.0%) and 8,298 (69.7%) by the routes before. :observed
That the EMEVD pair starts and stops a map effect is read from the instruction's neighbours and the counts of its two members, not
from the instruction's definition. :inferred
Of the animation events whose community template has an effect field, three types hold effect numbers in the stock files. Of the
events with a positive number in the first word, type 96 (a one-shot effect at a dummy polygon: the id, the dummy polygon's reference
id, a slot, and flags that include "follow dummy polygon") names an effect that exists in 7,583 of 7,586 in Sekiro and 16,885 of
20,078 in Elden Ring (the rest name numbers that no effect binder of the install holds), type 118 (a blade: the id, a dummy-polygon source of body, left
or right weapon, and the base and tip dummy polygons) in 182 of 182 and 2,692 of 2,723, and type 120 (one effect for each kind of
player: the first of twelve ids) in 1,472 of 1,473 in Elden Ring. :observed[every event of every character animation binder of both
installs, 336,787 events in Sekiro and 1,310,023 in Elden Ring] Type 112 (the effect determined by the floor) holds one of 6 (Sekiro,
2,941 events) or 15 (Elden Ring, 1,410) small numbers, type 110 one of 3 (8 events) or 5 (89), and type 119 (Elden Ring) an id that no
binder holds in 247 of its 249 events; types 95, 99 to 101, 104, 108, 109, 121, 122 and 961 hold no positive number in either game.
:observed[the same events] The first word of these is therefore not shown to be an effect number. :inferred The goods and magic
events (114, 115) name their effect through a param row by the template's "param type" and "SFX index" fields, and the throw
(117) and foot (792) events through an index. :sourced[community templates] Dummy polygon reference ids in type 96 are one of 166
(Sekiro) or 270 (Elden Ring) values; 6,907 of Sekiro's 7,589 and 18,448 of Elden Ring's 20,082 type 96 events set the follow flag.
:observed
Of the 7,764 Sekiro and 23,892 Elden Ring events of types 96, 118 and 120 with a positive first word and no weapon source (below),
the effect file is in the common binder for 6,533 and 17,127, only in `commoneffects_dlc02` for none and 1,322, in the
`sfxbnd_c<NNNN>` binder of the character whose animation binder holds the event for none and 1,727, in a map binder alone for
1,224 (Sekiro: `m10` to `m25`) and 7, in another character's binder for 515 (Elden Ring), and in no binder of
the install for 7 and 3,194. :observed[the inventory of every FXR member of every `sfxbnd` binder against every such event]
Of the 3,194 Elden Ring events that no binder holds, 2,916 are the player's (`c0000`) and 3,009 name one of ten numbers from 400 to
422 (400, 420, 410, 401, 421, 411, 412, 403, 422, 402, by count), which are not effect files in Elden Ring although all ten are
files of Sekiro's common binder (with 430 to 432; Elden Ring's holds 430 to 434 and 440 to 442 as files). :observed
All 3,009 are type 96 events: 2,891 in the player's animations (235 animation numbers from 30000 to 201400, among them the attack
animations; dummy polygon 80 in 2,878, 82 in 7 and 81 in 6; the follow and restrict flags set and no spawn condition or state in
all but one) and 118 in the animations of `c3510`, `c3060`, `c2270` and other characters. :observed[every such event of every
character animation binder] The commoneffects binders hold files numbered `number * 1000 + a variant` for most of these
numbers: `401000`, `401001`, `401002`, `401004` to `401007`, `401010` to `401012`, `401020`, `401021`, `401030`, `411000`,
`411001`, `411002`, `411007`, `412000` to `412002`, `412007`, `420000` to `420002`, `420007`, `421000` to `421002`, `421007`,
`422000` to `422002`, `422007` and `400001` to `400003`; none for 410 and 403 (`411000`, `420000` and `401000` are one effect
file of 12,208 bytes and 41 actions, `x001` a file of 1,312 bytes that spawns `x000`, `x002` and the later variants files of
12,240 to 13,104 bytes). :observed[the inventory of every FXR member]
The engine's handler of type 96 does not turn the event's number into one of these: it stores the first word of the event, with the
dummy polygon and the slot, in a slot of the character's effect module as it is, and the module hands that number to the
effect manager, whose create call looks up exactly that number in its table of loaded effects (numbers -2, 0 and 2000 to 2999
start nothing) and asks the file loader for the file of that number where the table has none. :observed[decompilation of the
executable's event dispatcher, effect module, instance and manager of one build] The handler reads no parameter and no state
of the character or the weapon. :observed[the same code] That the 3,009 events start nothing for lack of a file is therefore
what the code and the files show; what the loader does with a number that names no file is not decoded. :inferred
The event's flag bytes reach the effect's slot: byte 12 ("Ignore Dummy Poly Angle"), byte 13 ("Follow Dummy Poly") and byte 14
("Restrict to Dummy Poly") of a type 96 event are kept with the slot, and the effect follows its dummy polygon through an object
that gives the effect its matrices. :observed[decompilation of the handler, the slot and that object, Elden Ring 1.17.3] With
the ignore-angle byte set, that object rebuilds each matrix from the dummy polygon's position and its Z axis alone: the Y axis is
world up `(0, 1, 0)`, the X axis the normalised cross product of up with the dummy's Z axis, and the Z axis the cross product of X
with up, so the effect keeps the dummy's heading on the ground plane and drops its pitch and roll (a Z axis exactly vertical gives
the world's axes). :observed[the same decompilation and the constants it reads in the running image]{games="elden-ring"} With the
byte clear the effect takes the dummy polygon's full rotation. :inferred
The family files are reached by type 118. A blade event (type 118) is 16 bytes: the effect number (32 bits), the dummy polygon
source (16 bits at byte 4), the base polygon (16 bits at byte 6), the tip polygon (byte 8) and the slot (byte 10).
:observed[the handler's reads and 2,723 events] Its handler adds to the effect number a number the character's data keeps for
the hand, at byte `0x1e8` of the data for the right hand and `0x1f0` for the left: the source 2 adds the right hand's, 1 the
left's, and 0 the one the character's hand state names (-1 right, -2 left, any other none). :observed[decompilation of the
handler] The number of a stock blade event is `401001` (1,289 events), `401002` (872), `401004` (29), `401005` (4), `401007` (19),
`405000` (2), `411002` (5), `412002` (1), `413002` (3), `416002` (5), `420002` (4), `421001` (11), `421002` (7) and the numbers
of other characters' own effects. :observed[the same events] Added to `401001` the offsets 1, 3 to 6, 9 to 11, 19 and 20 give
files (`401002`, `401004` to `401007`, `401010` to `401012`, `401020`, `401021`) and 2, 12, 14 to 18, 21 and 24 to 28 do not; added
to `401002` the offsets 2 to 5, 9, 10, 18, 19 and 28 do. :observed[the file inventory] The special-effect param's `traceSfxIdOffsetType` takes the values 1 to 6, 9
to 12, 14 to 21 and 24 to 28 in 119 rows and is described by the community param documentation as the offset applied to a
blade trail's effect number, used for enchantments and weapon trails. :sourced[community param definitions] The character's
two numbers are therefore the sums of that field over the special effects active on the hand, or something the field selects.
:inferred How the field becomes the number is not decoded; the plain sum does not give a file for `401001` plus 2, a value that 12
rows hold. :observed The weapons' own `traceSfxId0` to `traceSfxId3` hold `401000` or -1 in all 3,636 rows. :observed[every
row] The enchantment path, which does not go through events, adds the weapon's `enchantSfxSize` to the effect number of a
special-effect row that sets the offset flag (`midstSfxId`, the `303xxx` numbers): the weapon row's field is read in one place
of the executable, the effect module's update of the special effects. :observed[decompilation, a scan of the image for reads of
the field]
A blade event whose dummy-polygon source is not 0 is a blade on a weapon's polygons: 8 events in Sekiro (source 1, characters
`c1020` and `c9820`, base polygon 300, tip 301) and 382 in Elden Ring (source 2 on 357 and source 1 on 25, 376 of them in
`c0000`). :observed[the same events] The community template of the Elden Ring events names the source's values 0 body, 1 left
weapon and 2 right weapon, and the two polygons the blade's base and tip. :sourced[community animation-event template] For a
source of 1 or 2 the handler first maps the base and tip numbers through a table of the engine's by the weapon's hand: a
number `n` becomes `20000 + n % 1000` for source 1 (the left hand's first weapon; `21000`, `22000` and `23000` for the next
three) and `10000 + n % 1000` for source 2 (the right hand's first weapon; `11000`, `12000`, `13000`), and `1000`, `2000`,
`3000` and `4000` for four more kinds. :observed[decompilation of the mapping and the table's values in the image]
Source 0 events name the character's dummy polygons as they are numbered in its combined table, and the player's blades are
such events: of Elden Ring's 2,723 blade events 2,341 have source 0, of which 1,577 name a polygon from 10000 to 11999 (809 the
right hand's first weapon's 300, i.e. `10300`, and 300 the second's `11300`), 58 one from 20000 to 21999, and 706 a polygon below
1000. :observed[the same events] The player's model (`c0000`) has 513 dummy polygons with 288 reference ids, none above 999:
100, 101, 110, 111, 120 and 121 on the left side (attach bone 73, 0.6 m to the left) and 130 on the right (bone 45), the places
a held weapon's own `100`, `120` and `130` meet. :observed[the model's dummy table] The weapon models carry the blade's polygons:
of the 496 weapon models of the 507 the weapon param names that the install holds (their FLVER dummy tables), reference ids 100,
120 and 130 are on 471, 110 on 466, 122 on 341, 300 and 301 on 337, 400 on 325, 401 on 286, 302 on 145 and 303 on 94, and 310,
330 and 10300 on none. :observed In weapon model 0100 the blade's polygons 300 and 301 lie along the
model's -y axis at -0.08 and -0.40, the grip polygons 100 to 130 between -0.36 and 0.12. :observed The weapon param holds
the same pairs for each weapon: `traceDmyIdHead0` to `traceDmyIdHead7` with `traceDmyIdTail0` to `traceDmyIdTail7`, whose first pair
is (300, -1) in 1,888 of 3,636 rows, (300, 301) in 702, (-1, -1) in 584, (10300, -1) in 201, (300, 302) in 96 and (300, 303) in 61, and
whose second pair is (310, -1) or (310, 311) in most rows that have one. :observed[every row of the weapon param] It does not show which
weapon (the one in the hand, by hand and slot) the game takes. :inferred

### Weapon trails

A light attack's trail is not an animation event's effect. In mod-free recordings of Sekiro's `a050_300000` (the Kusabimaru)
and Elden Ring's `a029_030000` (the Uchigatana) the trail shows exactly while the clip's attack event (type 1, the one with State
Info 0) is active, and it is the weapon's trace slot 0: `traceSfxId0` 401000 with `traceDmyIdHead0` 300 (tail 301 in Sekiro, −1 in
Elden Ring). :observed[two recordings] Effect 401000 is a Tracer (action 10012) of orientation 1 (LocalZ), 1.3 m wide in Sekiro and
1 m in Elden Ring, with 0.2 s segments, colour times 0.75 and alpha times 0.375. :observed Its fade endpoints (80 and 20, 90 and
10) are percentages of the trail's length. :sourced[fxr]

A trace slot's points are a run of the weapon model's dummy polygons. The code compares the head and tail as unsigned 32-bit
numbers: head and tail both −1 give no run; a tail of −1 walks up from the head while the model has each id, with no bound; a tail
above the head gives head to tail; anything else (a tail of 0, a tail at or below the head, a head of −1) gives none. The walk stops
at the first id the model lacks, the tail is rewritten to head + count − 1, and no trail is made from fewer than 2 points.
:inferred[read from the decompiled executable of build 1.07.3]{games="elden-ring"} The trace instance (`CSFD4TraceSfxIns`) hands
the effect one 3x4 matrix per point, at most 9 (the count at `+0x1F4` of its parameter block, the matrices from `+0x200`). A Tracer
appearance with a OneTimeEmitter (399) and more than one matrix keeps a sub-trail per point, with `v` the fraction of the
cumulative length along the points, and draws the band between neighbouring sub-trails' histories; with one matrix it draws the
point plus and minus the width times the scales along the emitter's local z, centred. The Tracer multiplies its fade endpoints by
0.01. :inferred[the same code]{games="elden-ring"}

Over every Elden Ring weapon trace slot whose model the archives hold (model 0's dummies), the Uchigatana's `wp_a_0550` (300, −1)
runs 300 to 303, guard to tip, and the slots with a tail of −1 have runs of 0 (539 slots), 1 (1), 2 (931), 3 (309), 4 (391), 5
(75), 6 (113), 8 (13) and 9 (13). Treating a tail of 0 or below as −1 gives the same counts, so no stock row tests that case. The
same rule gives Sekiro's (300, 301) slots runs of 2 in 33 of 38. :observed[every weapon trace slot with a model]
Of the lights a placed object reaches, the effects named by the placed routes and the effects they spawn are 322 files holding
172 point and 4 spot lights in Elden Ring and 164 files holding 54 point and 5 spot lights in Sekiro. :observed
An asset's effect attaches to the dummy polygon the row names (`dmypolyId_n`, 200 in the light rows). :observed
