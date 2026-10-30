---
title: FXR typed actions
description: "The 72 action types the installed effect files hold, where an action's parameters sit in its lists and which layout each stores, the node and config grammar, the enumerated parameters, the curve functions and modifiers of properties, and the files an action names."
games: [sekiro, elden-ring]
sources:
  - title: fxr
    url: https://github.com/EvenTorset/fxr
    note: Unlicense. The names, kinds, defaults, units and meanings of the parameters, the action slots, the modifier kinds and the curve functions
implementations:
  - name: fromsoft-formats (fxr/)
    url: https://github.com/Kalmarv/fromsoft-formats/tree/main/src/fxr
---

An [FXR effect file](/engines/fromsoft/effects/fxr/) is a tree of nodes whose configs hold actions. An action's type says
what it is for (emit particles on a schedule, give them a shape and a direction, move them, draw them as one of a dozen
forms, light the scene, play a sound, spawn another effect), and its parameters are the values in its lists. This page
records the types the installs use, where their parameters sit, which values they take and how nodes, configs and slots
are arranged. The 64-byte action record and the file layout are on the [FXR page](/engines/fromsoft/effects/fxr/).
The names of the types and parameters, their kinds and defaults, and what the values mean are the fxr project's.
:sourced[fxr]

## The types in the installs

The 2,913 Sekiro files and 12,155 Elden Ring files (copies of one effect in several binders included) hold 354,778 and
1,463,977 actions of 63 and 70 types besides type 0, the empty slot: 72 types in all, 61 of them in both games.
:proven[every action of every file of both installs; two independent readers count the same actions of every type]
Type 0 is 111,431 and 480,016 of those actions and holds no list at all. :proven
Nine types occur only in Elden Ring (11, 123, 700, 701, 702, 731, 10001, 10014 and 10015) and two only in Sekiro (733 and
10301). :proven
The project names 67 of the 72; it leaves 11, 130, 10100, 10400 and 10500 as `Unk` types. :sourced[fxr]

Files is the number of files holding at least one action of the type; actions are counted over all files. The slot is the
project's grouping of the types by the job they do; a config holds at most one action of a slot (see
[nodes, configs and slots](#nodes-configs-and-slots)). :sourced[fxr]

| Type | Name | Slot | Files (Sekiro / Elden Ring) | Actions (Sekiro / Elden Ring) |
|---|---|---|---|---|
| 1 | NodeAcceleration | NodeMovement | 2,457 / 8,943 | 10,794 / 35,506 |
| 11 | Unk11 | NodeMovement | - / 26 | - / 33 |
| 15 | NodeTranslation | NodeMovement | 139 / 508 | 295 / 869 |
| 34 | NodeSpin | NodeMovement | 346 / 817 | 582 / 1,481 |
| 35 | StaticNodeTransform | NodeTransform | 2,645 / 10,685 | 20,878 / 81,215 |
| 36 | RandomNodeTransform | NodeTransform | 123 / 739 | 248 / 1,104 |
| 46 | NodeAttachToCamera | NodeMovement | 62 / 110 | 136 / 124 |
| 55 | ParticleAcceleration | ParticleMovement | 1,449 / 5,216 | 4,196 / 17,436 |
| 60 | ParticleSpeed | ParticleMovement | 445 / 1,775 | 1,014 / 4,336 |
| 64 | ParticleSpeedRandomTurns | ParticleMovement | 189 / 902 | 430 / 1,431 |
| 65 | ParticleSpeedPartialFollow | ParticleMovement | 151 / 942 | 431 / 2,498 |
| 75 | NodeSound | NodeAudio | 882 / 3,443 | 947 / 3,519 |
| 83 | NodeAccelerationRandomTurns | NodeMovement | 20 / 91 | 28 / 141 |
| 84 | ParticleAccelerationRandomTurns | ParticleMovement | 515 / 2,096 | 988 / 3,254 |
| 105 | ParticleAccelerationPartialFollow | ParticleMovement | 791 / 3,615 | 2,616 / 10,364 |
| 106 | NodeAccelerationPartialFollow | NodeMovement | 277 / 831 | 1,993 / 2,438 |
| 113 | NodeAccelerationSpin | NodeMovement | 23 / 105 | 26 / 117 |
| 120 | NodeSpeed | NodeMovement | 18 / 49 | 39 / 84 |
| 121 | NodeSpeedRandomTurns | NodeMovement | 10 / 121 | 41 / 185 |
| 122 | NodeSpeedPartialFollow | NodeMovement | 26 / 38 | 72 / 53 |
| 123 | NodeSpeedSpin | NodeMovement | - / 14 | - / 24 |
| 128 | NodeAttributes | NodeAttributes | 2,671 / 10,818 | 21,825 / 88,805 |
| 129 | ParticleAttributes | ParticleAttributes | 2,669 / 10,818 | 21,248 / 86,669 |
| 130 | Unk130 | Unknown130 | 2,669 / 10,818 | 21,248 / 86,669 |
| 131 | ParticleModifier | ParticleModifier | 2,669 / 10,818 | 21,248 / 86,669 |
| 132 | SFXReference | SFXReference | 460 / 3,489 | 543 / 5,228 |
| 133 | LevelsOfDetailThresholds | LevelsOfDetailThresholds | 125 / 918 | 125 / 920 |
| 199 | StateConfigMap | StateConfigMap | 2,671 / 10,818 | 20,916 / 88,403 |
| 200 | SelectAllNodes | NodeSelector | 372 / 1,418 | 523 / 2,042 |
| 201 | SelectRandomNode | NodeSelector | 43 / 71 | 54 / 94 |
| 300 | PeriodicEmitter | Emitter | 1,976 / 7,918 | 8,740 / 38,788 |
| 301 | EqualDistanceEmitter | Emitter | 494 / 1,057 | 1,512 / 2,667 |
| 399 | OneTimeEmitter | Emitter | 2,634 / 10,622 | 11,573 / 47,350 |
| 400 | PointEmitterShape | EmitterShape | 2,653 / 10,757 | 17,690 / 70,747 |
| 401 | DiskEmitterShape | EmitterShape | 208 / 826 | 554 / 2,363 |
| 402 | RectangleEmitterShape | EmitterShape | 33 / 44 | 65 / 84 |
| 403 | SphereEmitterShape | EmitterShape | 205 / 1,140 | 451 / 2,202 |
| 404 | BoxEmitterShape | EmitterShape | 886 / 3,540 | 2,640 / 11,682 |
| 405 | CylinderEmitterShape | EmitterShape | 204 / 749 | 425 / 1,727 |
| 500 | NoSpread | DirectionSpread | 2,635 / 10,627 | 11,905 / 48,404 |
| 501 | CircularSpread | DirectionSpread | 2,085 / 7,789 | 9,549 / 38,617 |
| 502 | EllipticalSpread | DirectionSpread | 10 / 115 | 23 / 300 |
| 503 | RectangularSpread | DirectionSpread | 145 / 528 | 348 / 1,484 |
| 600 | PointSprite | Appearance | 342 / 2,179 | 587 / 3,375 |
| 601 | Line | Appearance | 28 / 6 | 29 / 6 |
| 602 | QuadLine | Appearance | 59 / 1,969 | 103 / 2,424 |
| 603 | BillboardEx | Appearance | 1,945 / 5,709 | 7,638 / 17,392 |
| 604 | MultiTextureBillboardEx | Appearance | 716 / 5,485 | 1,600 / 13,852 |
| 605 | Model | Appearance | 511 / 729 | 1,010 / 1,493 |
| 606 | LegacyTracer | Appearance | 157 / 93 | 282 / 122 |
| 607 | Distortion | Appearance | 119 / 1,148 | 167 / 1,359 |
| 608 | RadialBlur | Appearance | 453 / 1,266 | 485 / 1,338 |
| 609 | PointLight | Appearance | 714 / 4,369 | 834 / 4,999 |
| 700 | SimulateTermination | Termination | - / 10,872 | - / 10,884 |
| 701 | FadeTermination | Termination | - / 288 | - / 288 |
| 702 | InstantTermination | Termination | - / 844 | - / 844 |
| 731 | NodeForceSpeed | NodeForceMovement | - / 9 | - / 14 |
| 732 | ParticleForceSpeed | ParticleForceMovement | 173 / 356 | 520 / 923 |
| 733 | NodeForceAcceleration | NodeForceMovement | 1 / - | 1 / - |
| 734 | ParticleForceAcceleration | ParticleForceMovement | 25 / 180 | 91 / 535 |
| 10000 | GPUStandardParticle | Appearance | 31 / 76 | 47 / 99 |
| 10001 | GPUStandardCorrectParticle | Appearance | - / 5 | - / 5 |
| 10012 | Tracer | Appearance | 475 / 2,046 | 2,123 / 6,410 |
| 10013 | WaterInteraction | Appearance | 51 / 172 | 51 / 186 |
| 10014 | LensFlare | Appearance | - / 69 | - / 97 |
| 10015 | RichModel | Appearance | - / 1,766 | - / 3,052 |
| 10100 | Unk10100 | Unknown10100 | 2,910 / 12,005 | 2,910 / 12,005 |
| 10300 | WindForce | Appearance | 72 / 102 | 76 / 106 |
| 10301 | GravityForce | Appearance | 1 / - | 1 / - |
| 10400 | Unk10400 | Unknown10400 | 2,910 / 12,005 | 2,910 / 12,005 |
| 10500 | Unk10500 | Unknown10500 | 2,910 / 12,005 | 2,910 / 12,005 |
| 11000 | SpotLight | Appearance | 11 / 15 | 13 / 17 |

:proven

## Where a parameter is

An action stores up to four lists, all named by its record: the first and second **property** lists (40-byte records,
each a constant or a function of time, see [properties](/engines/fromsoft/effects/fxr/#properties)) and the first and
second **field** lists (32-bit words). A parameter is the entry at an index of one list. A vector parameter of a field
list spans two to four consecutive words. :sourced[fxr]
Two types keep their data in a third kind of list, a list of words in the field-lists section: the state-config map (199)
holds one config index per state, and the random node selector (201) one weight per child node. Their four ordinary
lists are empty in every action. :proven[every action of type 199 and 201]
The kind of a parameter (boolean, integer, float, vector or property) and its name are not stored; they come from the type
and the layout. :sourced[fxr]

The four stored lengths (properties 1, properties 2, field words 1, field words 2) are the action's **layout**. Types 200,
399 and 500 store nothing, and in Elden Ring neither do 11, 700 and 702; 199 and 201 store only their third list. :proven
Every other type stores the layouts below, one to six per type per game. Each entry is
`properties 1, properties 2, field words 1, field words 2 (actions)`, most common first.

| Type | Sekiro | Elden Ring |
|---|---|---|
| 1 NodeAcceleration | 4, 0, 3, 0 (10,794) | 4, 0, 3, 0 (35,506) |
| 11 Unk11 | - | 0, 0, 0, 0 (33) |
| 15 NodeTranslation | 1, 0, 0, 0 (295) | 1, 0, 1, 0 (869) |
| 34 NodeSpin | 6, 0, 1, 0 (582) | 6, 0, 1, 0 (1,481) |
| 35 StaticNodeTransform | 0, 0, 6, 0 (20,878) | 0, 0, 6, 0 (81,215) |
| 36 RandomNodeTransform | 0, 0, 12, 0 (248) | 0, 0, 12, 0 (1,104) |
| 46 NodeAttachToCamera | 0, 0, 2, 0 (136) | 0, 0, 2, 0 (124) |
| 55 ParticleAcceleration | 3, 0, 2, 0 (4,196) | 3, 0, 2, 0 (17,436) |
| 60 ParticleSpeed | 3, 0, 2, 0 (1,014) | 3, 0, 2, 0 (4,336) |
| 64 ParticleSpeedRandomTurns | 4, 0, 2, 0 (430) | 4, 0, 2, 0 (1,431) |
| 65 ParticleSpeedPartialFollow | 5, 0, 3, 0 (431) | 5, 0, 3, 0 (2,498) |
| 75 NodeSound | 0, 0, 3, 0 (947) | 0, 0, 3, 0 (3,519) |
| 83 NodeAccelerationRandomTurns | 5, 0, 3, 0 (28) | 5, 0, 3, 0 (141) |
| 84 ParticleAccelerationRandomTurns | 4, 0, 2, 0 (988) | 4, 0, 2, 0 (3,254) |
| 105 ParticleAccelerationPartialFollow | 5, 0, 3, 0 (2,616) | 5, 0, 3, 0 (10,364) |
| 106 NodeAccelerationPartialFollow | 6, 0, 4, 0 (1,993) | 6, 0, 4, 0 (2,438) |
| 113 NodeAccelerationSpin | 10, 0, 4, 0 (26) | 10, 0, 4, 0 (117) |
| 120 NodeSpeed | 3, 0, 3, 0 (39) | 3, 0, 3, 0 (84) |
| 121 NodeSpeedRandomTurns | 4, 0, 3, 0 (41) | 4, 0, 3, 0 (185) |
| 122 NodeSpeedPartialFollow | 5, 0, 4, 0 (72) | 5, 0, 4, 0 (53) |
| 123 NodeSpeedSpin | - | 9, 0, 4, 0 (24) |
| 128 NodeAttributes | 1, 0, 4, 0 (21,825) | 1, 0, 4, 0 (88,805) |
| 129 ParticleAttributes | 1, 0, 1, 0 (21,248) | 1, 0, 1, 0 (86,669) |
| 130 Unk130 | 8, 0, 9, 0 (21,248) | 8, 0, 9, 0 (86,669) |
| 131 ParticleModifier | 5, 0, 1, 0 (21,248) | 5, 0, 1, 0 (86,669) |
| 132 SFXReference | 0, 0, 1, 0 (543) | 0, 0, 1, 0 (5,228) |
| 133 LevelsOfDetailThresholds | 1, 0, 5, 0 (125) | 1, 0, 5, 0 (920) |
| 199 StateConfigMap | 0, 0, 0, 0 (20,916) | 0, 0, 0, 0 (88,403) |
| 200 SelectAllNodes | 0, 0, 0, 0 (523) | 0, 0, 0, 0 (2,042) |
| 201 SelectRandomNode | 0, 0, 0, 0 (54) | 0, 0, 0, 0 (94) |
| 300 PeriodicEmitter | 4, 0, 1, 0 (8,740) | 4, 0, 1, 0 (38,788) |
| 301 EqualDistanceEmitter | 3, 0, 2, 0 (1,512) | 3, 0, 2, 0 (2,667) |
| 399 OneTimeEmitter | 0, 0, 0, 0 (11,573) | 0, 0, 0, 0 (47,350) |
| 400 PointEmitterShape | 0, 0, 1, 0 (17,690) | 0, 0, 1, 0 (70,747) |
| 401 DiskEmitterShape | 2, 0, 1, 0 (554) | 2, 0, 1, 0 (2,363) |
| 402 RectangleEmitterShape | 3, 0, 1, 0 (65) | 3, 0, 1, 0 (84) |
| 403 SphereEmitterShape | 1, 0, 1, 0 (451) | 1, 0, 1, 0 (2,202) |
| 404 BoxEmitterShape | 3, 0, 2, 0 (2,640) | 3, 0, 2, 0 (11,682) |
| 405 CylinderEmitterShape | 2, 0, 2, 0 (425) | 2, 0, 3, 0 (1,602), 2, 0, 2, 0 (125) |
| 500 NoSpread | 0, 0, 0, 0 (11,905) | 0, 0, 0, 0 (48,404) |
| 501 CircularSpread | 2, 0, 0, 0 (9,549) | 2, 0, 1, 0 (38,524), 2, 0, 0, 0 (93) |
| 502 EllipticalSpread | 3, 0, 0, 0 (23) | 3, 0, 1, 0 (300) |
| 503 RectangularSpread | 3, 0, 0, 0 (348) | 3, 0, 0, 0 (1,484) |
| 600 PointSprite | 6, 7, 3, 39 (423), 6, 7, 3, 37 (95), 6, 7, 3, 38 (68), 6, 7, 3, 33 (1) | 6, 7, 5, 40 (3,375) |
| 601 Line | 8, 7, 1, 39 (24), 8, 7, 1, 37 (5) | 8, 7, 3, 40 (6) |
| 602 QuadLine | 10, 7, 1, 39 (83), 10, 7, 1, 37 (19), 10, 7, 1, 38 (1) | 10, 7, 3, 40 (2,424) |
| 603 BillboardEx | 25, 7, 15, 43 (6,050), 25, 7, 15, 37 (756), 25, 7, 15, 40 (471), 25, 7, 15, 42 (357), 23, 7, 17, 31 (3), 25, 7, 15, 35 (1) | 25, 7, 18, 45 (15,606), 25, 7, 18, 44 (1,766), 25, 7, 18, 42 (20) |
| 604 MultiTextureBillboardEx | 42, 7, 14, 42 (1,386), 42, 7, 14, 37 (109), 42, 7, 14, 39 (59), 42, 7, 14, 41 (46) | 42, 7, 17, 46 (13,111), 42, 7, 17, 44 (735), 42, 7, 17, 43 (6) |
| 605 Model | 27, 7, 17, 38 (772), 27, 7, 17, 37 (238) | 27, 7, 20, 38 (1,493) |
| 606 LegacyTracer | 16, 7, 14, 39 (233), 16, 7, 14, 37 (30), 16, 7, 14, 38 (19) | 16, 7, 17, 40 (122) |
| 607 Distortion | 17, 7, 12, 39 (156), 17, 7, 12, 37 (11) | 17, 9, 14, 39 (1,357), 17, 7, 14, 39 (2) |
| 608 RadialBlur | 10, 7, 3, 31 (442), 10, 7, 3, 30 (43) | 10, 7, 5, 31 (1,338) |
| 609 PointLight | 10, 5, 2, 29 (707), 10, 5, 2, 26 (82), 10, 5, 2, 28 (40), 10, 2, 2, 25 (5) | 10, 5, 2, 33 (4,486), 10, 5, 2, 31 (513) |
| 700 SimulateTermination | - | 0, 0, 0, 0 (10,884) |
| 701 FadeTermination | - | 1, 0, 0, 0 (288) |
| 702 InstantTermination | - | 0, 0, 0, 0 (844) |
| 731 NodeForceSpeed | - | 2, 0, 1, 0 (14) |
| 732 ParticleForceSpeed | 2, 0, 2, 0 (520) | 2, 0, 2, 0 (923) |
| 733 NodeForceAcceleration | 2, 0, 1, 0 (1) | - |
| 734 ParticleForceAcceleration | 2, 0, 2, 0 (91) | 2, 0, 2, 0 (535) |
| 10000 GPUStandardParticle | 21, 7, 167, 39 (31), 21, 7, 162, 37 (13), 21, 7, 162, 38 (3) | 21, 7, 168, 40 (99) |
| 10001 GPUStandardCorrectParticle | - | 21, 7, 168, 40 (5) |
| 10012 Tracer | 16, 7, 18, 39 (2,034), 16, 7, 17, 38 (34), 16, 7, 17, 37 (33), 16, 7, 18, 38 (22) | 16, 7, 22, 41 (6,410) |
| 10013 WaterInteraction | 0, 0, 5, 0 (51) | 0, 0, 5, 0 (186) |
| 10014 LensFlare | - | 12, 0, 75, 37 (97) |
| 10015 RichModel | - | 27, 7, 26, 38 (2,733), 21, 7, 23, 38 (300), 27, 7, 25, 38 (19) |
| 10100 Unk10100 | 0, 0, 56, 0 (2,910) | 0, 0, 56, 0 (12,005) |
| 10300 WindForce | 1, 0, 61, 0 (76) | 1, 0, 61, 0 (106) |
| 10301 GravityForce | 1, 0, 39, 0 (1) | - |
| 10400 Unk10400 | 0, 0, 65, 0 (2,910) | 0, 0, 65, 0 (12,005) |
| 10500 Unk10500 | 0, 0, 11, 0 (2,168), 0, 0, 10, 0 (735), 0, 0, 9, 0 (7) | 1, 0, 10, 0 (11,979), 0, 0, 11, 0 (26) |
| 11000 SpotLight | 11, 0, 24, 0 (8), 11, 0, 23, 0 (4), 11, 0, 21, 0 (1) | 11, 0, 28, 0 (12), 11, 0, 26, 0 (5) |

:proven[all actions of both installs]

A later build of a game appended parameters to the ends of the lists, so within a type a shorter layout names the same
parameters as the first entries of a longer one. :inferred[from the lists' tails, where the longer layouts of one type extend the shorter]

### Which layout an action has

The project lists a layout per type for each game it knows (Dark Souls III, Sekiro, Elden Ring, Armored Core 6 and
Nightreign). Taking, for each action, the game's own layout, then the other game's, then Dark Souls III's, the first whose
two property lists have the stored lengths is the action's layout, and the stored field lists are prefixes of its words,
for every one of the 219,346 Sekiro and 874,404 Elden Ring actions whose type the project gives a layout, but 5 (the billboards and
distortions with words past it, below) and the 300 rich models (whose first property list is shorter than any layout's).
:proven[every action of both installs]
The actions that are not in their game's own layout:

| Game | Type | Actions | What |
|---|---|---|---|
| Sekiro | 609 point light | 5 | Dark Souls III's layout (`10, 2, 2, 25`): no multiplier properties and one more word at index 12 ([lights](/engines/fromsoft/effects/fxr/#lights)) |
| Sekiro | 603 billboard | 3 | Dark Souls III's layout (`23, 7, 17, 31`), with one word past the 30 the project names |
| Elden Ring | 10500 root action | 26 | Sekiro's layout (`0, 0, 11, 0`): 11 field words and no property, where Elden Ring's has 10 words and the `rateOfTime` property |
| Elden Ring | 607 distortion | 2 | Sekiro's layout (`17, 7, 14, 39`), with two words past the 12 the project names in the first list |
| Elden Ring | 10015 rich model | 300 | no layout has their 21 properties in the first list; they fit Elden Ring's 27 as a prefix |

:proven[every action of both installs]
So a layout, not the game, decides which parameter names an action has: a Sekiro file can store an older game's layout and
an Elden Ring file Sekiro's, and the file stores no version for it. :proven
Reading every action with the layout so chosen refuses none. The actions that then hold something the project's names do not cover are
the lists of 199 (20,916 and 88,403 actions) and 201 (54 and 94), the 3 Sekiro billboards and the 2 Elden Ring distortions above.
:proven[all 15,068 files]

## Parameters

For each type and game the project names the entries of the lists and gives each a kind (boolean, integer, float, vector of
two to four floats, or a property of one to four components), a default and, for a property, the **argument** it is
evaluated at: 0 (constant), the particle's age, the time since the action became active, the effect time at which the
particle was emitted, or an external value. :sourced[fxr]
About half of its entries are placeholders whose names begin `unk` (words stored but not understood): 747 of the 1,427
entries of the 60 Sekiro layouts it names and 974 of the 1,843 of the 64 Elden Ring layouts. :sourced[fxr]

The project presents some stored values in other units or signs than the files hold. These conventions are its editor's:
:sourced[fxr]

| Parameter | Stored | Shown by the project |
|---|---|---|
| node offset and rotation (35), offset (36) | x as stored | x negated |
| turn interval (64, 65, 83, 84, 105, 106, 121, 122) | integer | divided by 50 (a count of 1/50 s) |
| follow rotation (65, 105, 106, 122) | boolean | inverted |
| stir speed (607) | radians | degrees |
| fade-out time (10300, 10301), initial simulation time (10500) | integer | divided by 30 (frames at 30 per second) |
| GPU particle (10000, 10001) emission interval, duration, random turn interval | integer | divided by 30 |
| GPU particle angular acceleration Z | radians | degrees |
| GPU particle size and growth with uniform scale | separate X and Y | Y added to X |
| rich model (10015) U and V offsets and speeds | separate parameters | one two-component UV parameter |
| point and spot light multipliers and fade-out time | as stored | scaled ([lights](/engines/fromsoft/effects/fxr/#lights)) |

Reading the files with the project's names and layouts, and these conventions, and comparing with the project's own reading
of the same files, gives the same type, the same parameter names and the same value in every parameter of 21,656 Sekiro
actions in 334 files and 91,888 Elden Ring actions in 1,246 files (for every type and layout the smallest file holding it,
and every tenth file; properties are compared by function, loop, keyframes, tangents and modifiers; the lights, whose
multipliers the project scales, are compared separately; the one Sekiro file the project refuses is left out).
:observed[1,580 of the 15,068 files]

## Nodes, configs and slots

Every node of both installs is one of five kinds and holds a fixed set of actions of its own; the ids and kind names are the
project's. :sourced[fxr]

| Node | Id | Nodes (Sekiro / Elden Ring) | Own actions | Configs |
|---|---|---|---|---|
| Root | 2000 | 2,913 / 12,155 | the unknown actions 10100, 10400 and 10500, one each (absent in 3 and 150 roots); in Elden Ring termination actions (700, 701, 702: one of them in 11,998 roots, all three in 6) | none |
| Proxy | 2001 | 543 / 5,228 | one SFXReference (132) | none |
| Levels of detail | 2002 | 125 / 920 | one state-config map | one, config id 1002 |
| Basic | 2200 | 20,222 / 85,359 | one state-config map | 1 to 3 (10 in 21 Elden Ring nodes), config id 1004 |
| Node emitter | 2202 | 569 / 2,124 | one state-config map | 1 or 2, config id 1005 |

:proven[every node of both installs]
Each config has the id its node kind takes: 125 and 920 levels-of-detail configs, 21,248 and 86,669 basic configs and 577 and
2,136 node-emitter configs. :proven

A config holds, for each slot of the project's, at most one action, and the slots a kind of config holds are fixed:

| Config | Exactly one of | At most one of |
|---|---|---|
| Basic (1004) | Emitter, EmitterShape, DirectionSpread, NodeAttributes (128), ParticleAttributes (129), ParticleModifier (131), Unknown130 | Appearance, NodeAudio, NodeForceMovement, NodeMovement, NodeTransform, ParticleForceMovement, ParticleMovement |
| Node emitter (1005) | Emitter, EmitterShape, DirectionSpread, NodeAttributes, NodeSelector | NodeMovement, NodeTransform |
| Levels of detail (1002) | LevelsOfDetailThresholds | |

:proven[every config of both installs]
Of the 21,248 and 86,669 basic configs, 15,046 and 56,332 hold an appearance (a billboard, point sprite, model, trail,
distortion, blur, light, force or any other Appearance type; a config that draws never holds two), 9,675 and 39,319 hold a particle
movement and 20,579 and 80,224 a node transform. :proven

An effect has one to ten states: Sekiro's 2,669 distinct effects have one in 2,585, two in 27 and three in 57; Elden Ring's
11,912 have one in 11,651, two in 232, three in 11, four in 3, seven in 6, nine in 3 and ten in 6. :proven[distinct effects; copies of an effect are byte-identical]

## Enumerated parameters

The project types 12 of its enumerations on parameters the installs store. Every stored value of each is a member the
project names, and no such parameter is animated (each is a constant, or the zero or one function, which are constants).
:proven[every enumerated parameter of every file of both installs]

| Enumeration | Stored values | Parameters | Members never stored |
|---|---|---|---|
| AttachMode | 0 None, 1 Parent, 2 DummyPoly, 3 ParentTranslation, 4 DummyPolyTranslation | 128, 129 `attachment` | none |
| BlendMode | 0 Unk0, 1 Source, 2 Normal, 4 Add, 5 Subtract, 6 Unk6, 7 Unk7 | 600, 601, 602, 603, 604, 605, 606, 607, 608, 10000, 10001, 10012, 10014 `blendMode` | 3 Multiply |
| DistortionMode | 0 Stir, 1 NormalMap | 607 `mode` | 2 Twist, 3 Unk3, 4 Unk4 |
| DistortionShape | 0 Rectangle, 1 Hemiellipsoid, 2 Ellipsoid | 607 `shape` | none |
| EmitterShape | 1 Box, 2 Box2, 3 Unk3, 4 Cylinder (Sekiro only), 5 Unk5 (Sekiro only) | 10000, 10001 `emitterShape` | 0 Line |
| ForceVolumeShape | 1 Sphere, 2 Box, 4 SquarePrism (Elden Ring only) | 10300, 10301 `shape` | 0 Boundless, 3 Cylinder |
| InitialDirection | 0 Emitter, 1 Up, 2 Down, 3 North, 4 LocalUp, 5 LocalDown, 6 LocalNorth | 400, 401, 402, 404, 405 `direction` | none |
| ModelOrientationMode | 0 North, 1 CameraPlane, 2 ParticleDirection, 4 GlobalYaw (Sekiro only) | 605 `orientation` | 3 GlobalPitch, 5 UnkGlobalPitch |
| OrientationMode | 0 South, 1 CameraPlane, 2 LocalSouth, 4 GlobalYaw, 5 East (Elden Ring only), 6 Camera, 7 LocalYaw, 11 Unk11 (Elden Ring only) | 603, 604, 607 `orientation` | 3 UnkSouth |
| ReflectionMode | 0 None, 1 Radial | 10014 `layer1Reflection`; 10014 `layer2Reflection`; 10014 `layer3Reflection`; 10014 `layer4Reflection` | 2 Horizontal |
| RichModelOrientationMode | 0 North, 1 CameraPlane, 2 ParticleDirection, 4 GlobalYaw | 10015 `orientation` | 3 UnkNorth |
| TracerOrientationMode | 0 Travel, 1 LocalZ, 2 Vertical, 3 GlobalX (Elden Ring only), 4 Cross | 606, 10012 `orientation` | 5 Diagonal |

:proven

## Property curves

The functions of a keyframed property and how their keyframes are stored are on the [FXR page](/engines/fromsoft/effects/fxr/#properties).
The project evaluates a property at an argument `x` as follows. Before the first keyframe it holds the first value and after
the last the last; a looping one takes `x` modulo the largest keyframe position (not a number when that is 0); keyframes
whose position goes backwards are dropped. :sourced[fxr]

- Stepped: the value of the last keyframe at or before `x`.
- Linear: `v1 + (v2 - v1) * t` between the keyframes around `x`, with `t = (x - p1) / (p2 - p1)`.
- Bezier: the cubic Bezier through the two keys with the control points `v1`, `v1 + a / 3`, `v2 - b / 3`, `v2`, where `a` is the
  first tangent value of the earlier key and `b` the second tangent value of the later one.
- Hermite: `v1 + (v2 - v1) * e(t)`, where `e` is built from the tangent **angles** the file stores, both taken from the
  earlier keyframe (`s1` its first, `s2` its second), with `q = pi / 4`:

```
H(m0, m1; u) = (3u^2 - 2u^3) + (u^3 - 2u^2 + u) * m0 + (u^3 - u^2) * m1
a(u)         = 1 - sqrt(1 - H(0.7, 1.5; u)^2)          slow start
b(u)         = sqrt(1 - (H(1.5, 0.7; u) - 1)^2)        slow end
e1           = a + (s1 / q) * (u - a)                  if s1 <= q
             = u + ((s1 - q) / q) * (b - u)            if s1 > q
e2           = b + (s2 / q) * (u - b)                  if s2 <= q
             = u + ((s2 - q) / q) * (a - u)            if s2 > q
e(u)         = e1 + u * (e2 - e1)
```

The stepped, linear and Bezier forms are the project's. The Sekiro executable computes a Bezier segment as the cubic Hermite
curve through the two keys with the stored tangents, which is the form above. :inferred[Sekiro 1.06 code read, not run]
The Hermite form is the executable's own scalar Hermite property function, read from the decompiled image; the project has only an
approximation of it, because the files store angles and not tangents, and the angles' reading (0 flat, 45 degrees a straight line,
more steeper) is the code's. :inferred[Sekiro 1.06 code read, not run]
Evaluating the files' keyframed properties both ways at the keyframes, between them and past the ends (up to 60 properties per
action type, parameter and function) gives the same value for stepped, linear and Bezier properties to 2e-4 of the largest key value, and for
Hermite ones to 5e-3 (the worst of all probes is 4.9e-3): 2,945 Sekiro properties (69 stepped, 2,098 linear, 81 Bezier, 697 Hermite) with
25,675 probe points, and 6,918 Elden Ring ones (142, 4,598, 181, 1,997) with 56,941. A probe at a whole number of loop
durations is left out: rounded to a 32-bit float it falls on the other side of the wrap from the project's double.
:observed[9,863 sampled properties]

## Property modifiers

A property's modifiers (the records on the [FXR page](/engines/fromsoft/effects/fxr/#properties)) vary or scale its value.
Type word A holds the component count minus one in its low two bits and the kind in `((A >> 12) & 3) << 4 | (A >> 4) & 15`.
Every modifier of both installs is one of the kinds below, with exactly the field words and conditional properties its
kind needs; only one and four components occur. :proven[every modifier of both installs]

| Kind | Number | Field words (c components) | Conditional properties | Sekiro (1 / 4 components) | Elden Ring (1 / 4 components) |
|---|---|---|---|---|---|
| Random delta | 21 | c seeds, c maxima | 0 | 24,949 / 1,662 | - |
| Random range | 24 | c seeds, c minima, c maxima | 0 | - | 105,804 / 7,038 |
| External value 1 | 38 | the external value's index | 1, the factor | - | 3,164 / 119 |
| External value 2 | 39 | the external value's index | 1, the factor | - | 294 / - |
| Random fraction | 53 | c seeds, c maxima | 0 | 20,655 / 3 | 113,347 / 82 |

:proven
Sekiro's files hold the random delta where Elden Ring's hold the random range, and neither game holds the other's. :proven
A random delta varies the value by up to `max` either way, a random range adds a random value between its minimum and
maximum, and a random fraction varies it by up to the fraction `max` of itself either way, each component from the stream
of its seed. An external-value modifier multiplies the value by the factor, a function of the external value's own argument;
the second kind is fixed when the effect is created. :sourced[fxr]
In Sekiro's executable the random number is uniform on [−1, 1): the hash's low 23 bits become the mantissa of a float in [1, 2)
(`hash & 0x7FFFFF | 0x3F800000`), which is doubled and less 3. A random delta adds that number times `max`, a random fraction
the value times it times `max`. :inferred[Sekiro 1.06 code read, not run]
Modifiers sit mostly on particle properties. Counted over the distinct effects, the properties with a modifier are, in Sekiro, 14,156
of the 220,410 of billboards (603), 13,612 of the particle modifier (131) and 7,151 of the multi-texture billboard (604), and in
Elden Ring 75,046 of the 673,113 of the multi-texture billboard, 57,540 of the particle modifier and 35,513 of the billboard.
:proven[distinct effects]

## Files an action names

Textures, models, model animations and sounds are named by number. The main texture of a particle and the model of a model
particle are properties (a constant, stored as a float: `1024.0` is texture 1024); every other texture (normal map, specular
parameter map, mask, detail map, the layers of a multi-texture billboard), the animation and the sound are integer field words.
:sourced[fxr]
The member that holds a number is in the `sfxbnd` binders beside the effects (a member in several binders counts once per binder):

| Kind | Member | Sekiro | Elden Ring |
|---|---|---|---|
| texture | `sfx/tex/s%05d[_suffix].tpf` | 451 members, no suffix for any kind an action asks for | 1,016 members: `_a` colour, `_n` normal map, `_m` specular parameters, `_d` detail |
| model (mesh particle) | `sfx/model/s%05d.flver` | 144 | 487 |
| model animation | `sfx/hkx/s%05d.anibnd` | 3 | 21 |
| resource list | `sfx/ResourceList/f%09d.ffxreslist` | none | 12,155, one per effect file |

:proven[every member of the effect binders of both installs]
Sekiro's binders also hold suffixed texture members (`_a`, `_n`, `_m`, `_r`: 79 ids, one of them named by a texture parameter),
and Elden Ring's `_em`, `_r`, `_3m` and `_1m` variants besides the four above (493 texture ids in all, 183 named by a texture parameter). :observed
How many of the numbers named by the constant texture and model parameters are members of the effect binders:

| Parameter | Ids named (Sekiro / Elden Ring) | Members present (Sekiro / Elden Ring) |
|---|---|---|
| colour texture | 203 / 162 | 199 / 157 |
| normal map | 30 / 27 | 29 / 27 |
| specular parameter map | 2 / 1 | 2 / 1 |
| detail map | 2 / 1 | 2 / 1 |
| model | 123 / 473 | 121 / 473 |

:proven[the distinct positive numbers of the constant parameters of all files]
The numbers that are members of no effect binder are 4 colour textures, 1 normal map and 2 models in Sekiro and 5 colour textures
in Elden Ring. :proven

An Elden Ring resource list is a text of file names, one a line, as the authoring tool names them: `.tif` for a texture
(`s00001_a.tif`), `.sib` for a model, `.hkt` for an animation and `_skeleton.hkt` for its skeleton, and, for the textures and
models of a map asset that an effect shares, names beginning `AET` or `AEG` (`AET999_645_a.tif`). Every line of all 12,155
lists reads as one of these. :proven

## Open questions

:::open[What do the unnamed types and words do?]
Types 11, 130 (in every basic config), 10100, 10400 and 10500 (in every root) have no name in the project, and about half of
the entries it does name are `unk` placeholders. The files hold their values; what they mean is not read.
:::

:::open[Are the Hermite angles read right?]
The angles' meaning and the ease functions come from the executable's code, not from a running game; no captured particle has
been compared with the curve.
:::

:::open[What does the game do with a parameter a shorter layout lacks?]
A file that stores an older layout has no value for the parameters appended later. Whether the game takes the project's
default, zero or something else is not established.
:::

:::open[What are the external values?]
The external-value modifiers (3,577 in Elden Ring) and the operands of the state conditions name external values by index; which
index is which, and what sets it, is not read.
:::

:::open[Why does one game hold a random delta and the other a random range?]
Sekiro's modifiers are all random delta or random fraction, Elden Ring's random range, random fraction or external value. Whether the two
kinds are the same random variation stored differently, or different variations, is not established.
:::
