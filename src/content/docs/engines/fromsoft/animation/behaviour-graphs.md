---
title: Behaviour graphs
description: The Havok Behavior tagfiles of the character binders, the hkb and FromSoftware Custom classes they hold, and the tables that tie a graph together.
sources:
  - title: HKLib
    url: https://github.com/The12thAvenger/HKLib
    note: member and enum names of the hk2018 classes; reads the Elden Ring files and writes their XML
implementations:
  - name: havok-formats behaviour module
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/behavior/mod.rs
---

A character's behaviour is a state machine of Havok Behavior (`hkb`) nodes: generators that choose and blend
animations, modifiers that adjust the pose, and transition effects between states. The graph is stored as `TAG0`
tagfiles in the character's `chr/c????.behbnd.dcx`. Where a [clip](/engines/fromsoft/animation/havok-clips/) is a
sampled animation, the graph decides which clip plays when, from the variables and events the game's scripts set.

## Files

Every `hkb` class of both installs is in a `chr/*.behbnd.dcx` binder: Sekiro's 79 binders hold 315 tagfile members
(305 distinct, by their bytes) and Elden Ring's 280 hold 1,119 (1,021 distinct). The census opened every entry of
each install's archives (8,764 of Sekiro's 8,765, the other being a DCX that holds two FLVERs and states more bytes than it has; all 97,118
of Elden Ring's; nested binders included) and found a tagfile with an `hkb*`
or `Custom*` class in no other place. :proven{games="sekiro elden-ring"} (Sekiro's `c9996.hkx` behaviour is a version 11
packfile of another SDK and is not part of this page.) :observed{games="sekiro"}

A binder has the members `Export\c????.hkx`, `Export\Characters\c????.hkx` and one or more
`Export\Behaviors\c????.hkx`, and a tagfile is one of three kinds by the class of the single variant of its
`hkRootLevelContainer`. :proven{games="sekiro elden-ring"}

| Kind | Root variant | Distinct files (Sekiro / Elden Ring) |
|---|---|---|
| Project | `hkbProjectData` with `hkbProjectStringData` | 79 / 280 |
| Character | `hkbCharacterData` with `hkbCharacterStringData`, `hkbMirroredSkeletonInfo` and the character properties' values | 79 / 280 |
| Behaviour graph | `hkbBehaviorGraph` with `hkbBehaviorGraphData`, `hkbBehaviorGraphStringData`, `hkbVariableValueSet` and the nodes | 147 / 461 |

Every file carries its own type table (none uses a compendium); Sekiro's are SDK `20160200` and Elden Ring's `20180100`.
:proven{games="sekiro elden-ring"} All the objects of a file are reachable from the root container through
pointers, in all 305 and 1,021 files. :proven{games="sekiro elden-ring"}

## Classes

The type tables of the behaviour files name 93 classes (nested structures such as `hkbStateMachine::StateInfo`
included) and 41 enumerations and flag sets whose names start with `hkb` or `Custom`. Within a game, each class has
one layout in every file that holds it (the same parent, size, version and members at the same offsets).
:proven{games="sekiro elden-ring"}

Of the 84 classes in both games' tables, 79 are identical in every respect (parent, version, size, every member with its
offset and flags). The five that differ are: `hkbFootIkDriverInfo` and its `Leg` (version 3 in Sekiro, 4 in Elden Ring:
Sekiro's `usefootEndToOnlyHeelRay` flag is stored in each leg in Elden Ring as `useFootEndToOnlyHeelRay`, with a new
`useAlwaysContinuousFlag`), `CustomManualSelectorGenerator` (Elden Ring adds the member `rideSync`), and
`CustomLookAtTwistModifier` and `hkbCharacterData` (members the runtime object keeps and the file does not store differ,
so the sizes differ: 224 and 208, 240 and 224). :proven{games="sekiro elden-ring"} `CustomDockingGenerator` and
`CustomHandIkControlsModifier` exist only in Sekiro's tables, and `CustomBoneFixModifier`, `hkbReferencePoseGenerator`, `hkbGeneratorTransitionEffect`,
`hkbHoldFromBlendingTransitionEffect` and `hkbJigglerModifier` (with `hkbJigglerGroup`) only in Elden Ring's.
:proven{games="sekiro elden-ring"}

The members each class stores are those HKLib's hk2018 class of the same name lists, in the same order, for all 90 of
Elden Ring's classes that HKLib has; of Sekiro's 87 classes, 85 are in HKLib and 82 of those agree, the other three being
the differences above (`CustomDockingGenerator` and `CustomHandIkControlsModifier` are not in HKLib). :proven{games="elden-ring"}
:observed{games="sekiro"}

A member in the type table is either stored or a member of the runtime object (bit 0 of its flags, 0x21, 0x23 and 0x25
in the tables). The runtime members are zero bytes in every object and structure element of both installs (1,125,889
member instances in Sekiro, 8,236,727 in Elden Ring), and so is `hkReferencedObject`'s `propertyBag`, a stored
8-byte member (62,949 and 419,254 objects). :proven{games="sekiro elden-ring"}

### Objects and structure elements by class

Objects are what a pointer refers to; structure elements are the runs inside arrays (a transition, a variable's info, an
event's info). The counts are over the distinct files; one class is one or the other.

| Class | Sekiro | Elden Ring |
|---|---:|---:|
| `CustomBoneFixModifier` | 0 | 11 |
| `CustomDockingGenerator` | 105 | 0 |
| `CustomHandIkControlsModifier` | 1 | 0 |
| `CustomLookAtTwistModifier` | 1,518 | 3,153 |
| `CustomLookAtTwistModifier::TwistParam` | 2,344 | 5,346 |
| `CustomManualSelectorGenerator` | 13,074 | 73,502 |
| `CustomPreDeleteIndexSelector` | 60 | 181 |
| `CustomTransitionEffect` | 213 | 736 |
| `hkRootLevelContainer` | 305 | 1,021 |
| `hkRootLevelContainer::NamedVariant` | 305 | 1,021 |
| `hkbAssetBundleStringData` | 158 | 560 |
| `hkbBehaviorGraph` | 147 | 461 |
| `hkbBehaviorGraphData` | 147 | 461 |
| `hkbBehaviorGraphStringData` | 147 | 461 |
| `hkbBehaviorReferenceGenerator` | 78 | 279 |
| `hkbBlenderGenerator` | 182 | 2,726 |
| `hkbBlenderGeneratorChild` | 1,435 | 10,801 |
| `hkbBlendingTransitionEffect` | 3 | 250 |
| `hkbBoneIndexArray` | 146 | 486 |
| `hkbBoneWeightArray` | 86 | 310 |
| `hkbCharacterData` | 79 | 280 |
| `hkbCharacterStringData` | 79 | 280 |
| `hkbClipGenerator` | 16,552 | 169,974 |
| `hkbEvaluateHandleModifier` | 2 | 8 |
| `hkbEventInfo` | 70,044 | 248,712 |
| `hkbFootIkControlsModifier` | 46 | 203 |
| `hkbFootIkControlsModifier::Leg` | 2 | 32 |
| `hkbFootIkDriverInfo` | 44 | 202 |
| `hkbFootIkDriverInfo::Leg` | 96 | 628 |
| `hkbGeneratorTransitionEffect` | 0 | 14 |
| `hkbGetHandleOnBoneModifier` | 102 | 552 |
| `hkbHandIkControlsModifier` | 47 | 200 |
| `hkbHandIkControlsModifier::Hand` | 104 | 546 |
| `hkbHandIkDriverInfo` | 44 | 200 |
| `hkbHandIkDriverInfo::Hand` | 100 | 554 |
| `hkbHoldFromBlendingTransitionEffect` | 0 | 157 |
| `hkbJigglerGroup` | 0 | 26 |
| `hkbJigglerModifier` | 0 | 13 |
| `hkbKeyframeBonesModifier` | 68 | 181 |
| `hkbKeyframeBonesModifier::KeyframeInfo` | 68 | 181 |
| `hkbLayer` | 145 | 383 |
| `hkbLayerGenerator` | 90 | 201 |
| `hkbManualSelectorGenerator` | 754 | 6,979 |
| `hkbManualSelectorTransitionEffect` | 2 | 3 |
| `hkbMirroredSkeletonInfo` | 79 | 280 |
| `hkbModifierGenerator` | 115 | 410 |
| `hkbModifierList` | 579 | 2,494 |
| `hkbProjectData` | 79 | 280 |
| `hkbProjectStringData` | 79 | 280 |
| `hkbReferencePoseGenerator` | 0 | 181 |
| `hkbScriptGenerator` | 298 | 2,099 |
| `hkbStateMachine` | 3,505 | 15,808 |
| `hkbStateMachine::StateInfo` | 14,112 | 73,205 |
| `hkbStateMachine::TransitionInfo` | 18,083 | 96,130 |
| `hkbStateMachine::TransitionInfoArray` | 4,070 | 22,223 |
| `hkbTwistModifier` | 19 | 58 |
| `hkbVariableBindingSet` | 4,392 | 27,521 |
| `hkbVariableBindingSet::Binding` | 13,536 | 53,682 |
| `hkbVariableBounds` | 11,766 | 37,054 |
| `hkbVariableInfo` | 14,765 | 47,014 |
| `hkbVariableValue` | 13,380 | 43,177 |
| `hkbVariableValueSet` | 226 | 741 |

:proven{games="sekiro elden-ring"} Elden Ring's counts are the result of reading every object of its 1,021 files with
HKLib too: its XML of each file has the same 420,275 objects with the same values (see below).

## Enumerations and flag sets

An `hkEnum` or `hkFlags` member stores an integer; the type table names the enumeration but lists no members.
:proven{games="sekiro elden-ring"} HKLib's classes list the members. Every value stored in the 197,121 enumeration and flag
members of Sekiro's objects and structure elements and the 1,027,972 of Elden Ring's is one HKLib names, apart from
Sekiro's `CustomDockingGenerator::_DockingType` (not in HKLib), which holds 105 values: 1 (3 times), 7 (7), 8 (24), 9 (18), 10
(50), 11 (2) and 0 (1). :proven{games="sekiro elden-ring"}

State machine transitions (`hkbStateMachine::TransitionInfo`) store four values of `flags` and no other:

| `flags` | Members (HKLib's names) | Sekiro | Elden Ring |
|---:|---|---:|---:|
| 0 | none | 1,059 | 7,009 |
| 2048 | `FLAG_IS_LOCAL_WILDCARD` | 2,259 | 10,365 |
| 3072 | `FLAG_IS_LOCAL_WILDCARD`, `FLAG_IS_GLOBAL_WILDCARD` | 153 | 2,439 |
| 3584 | the two wildcard flags and `FLAG_ALLOW_SELF_TRANSITION_BY_TRANSITION_FROM_ANY_STATE` | 14,612 | 76,317 |

:proven{games="sekiro elden-ring"} (Over all 18,083 and 96,130 transitions; the `priority` of each is 0.)

FromSoftware's `CustomManualSelectorGenerator` selects one of its child generators by an index set from outside and
carries an animation id (`animId`) and an `offsetType` that says what the id is relative to. Its 13,074 (Sekiro) and
73,502 (Elden Ring) objects hold these offset types, named by HKLib: :proven{games="sekiro elden-ring"}

| `offsetType` | Value | Sekiro | Elden Ring | Elden Ring `c0000` |
|---|---:|---:|---:|---:|
| `OffsetNone` | 0 | 114 | 396 | 34 |
| `IdleCategory` | 11 | 1,220 | 2,883 | 2,874 |
| `WeaponCategoryRight` | 13 | 340 | 183 | 183 |
| `WeaponCategoryLeft` | 14 | 183 | 62 | 62 |
| `AnimIdOffset` | 15 | 10,965 | 69,138 | 58 |
| `WeaponCategoryHandStyle` | 16 | 0 | 233 | 233 |
| `MagicCategory` | 17 | 252 | 194 | 194 |
| `SwordArtsCategory` | 18 | 0 | 413 | 413 |

The last column is the 4,051 objects of Elden Ring's player graph; the values are those its file stores.
:observed[the installed `c0000` graph]{games="elden-ring"}

:only[elden-ring] The player's attack clips are chosen through the offset type. The clip's id is the offset plus `animId`, and the
generator plays its child named `a%03d_%06d` from it; `AttackRightLight1_CMSG` is type 13 with id 30000 and `AttackBothLight1_CMSG`
type 16 with 32000 in `c0000.hkb`. Type 13 takes the right hand's weapon, type 14 the left's, and type 16 the left's when the arm
style is 2 (left weapon in both hands) and the right's otherwise. The offset is the weapon's `EquipParamWeapon` `wepmotionCategory`
(byte `+0xE7` of the 664-byte row): if the row's `spAtk` (`u16` at `+0xEE`) is non-zero and `a{spAtk}_{animId}` exists, that clip
plays; otherwise the category's, and if that does not exist `a023_` (right hand) or `a048_` (left); when none exists the
category's id is returned anyway. The generator then plays the child whose `animationName` is that id's `aGGG_NNNNNN`, else the
child named `a000_NNNNNN`, else child 0. The weapon row is looked up with the upgrade level removed (`itemId / 100 × 100`: 9000025
reads row 9000000). :observed[read from the code of 2.7.2.0 and the graph file]{games="elden-ring"} The selector itself reads the
category from a per-hand array of the player (`*(PlayerIns + 0x630)` indexed by hand), and the equipment code writes the left and
right weapons' `wepmotionCategory` into an array's first two entries (the third by arm style); that these are one array is not
read through, the store being in obfuscated code. :inferred{games="elden-ring"} The arm style is the first word of the character's equipment state, and the next
words the active slot of each hand and of the arrows and bolts; the equipped item ids are interleaved, the right weapon at
`2 × slot + 1` and the left at `2 × slot`. The save slot stores the same seven words (arm style, left, right, two arrows, two bolts).
:observed[read from the code and one save]{games="elden-ring"} The behaviour script takes the style from `env(207)`, and R1 with a
style of 2 or more goes to `W_AttackBothLight1`. :observed{games="elden-ring"} With the Uchigatana (category 29, `spAtk` 0) held in
both hands (style 3), the game plays `a029_032000`, by joint positions matched to 0.0 cm. :observed[one run]{games="elden-ring"}

A clip generator (`hkbClipGenerator`) names its animation by the stem of an animation file (`a000_003000`) in
`animationName`, and plays it single (`MODE_SINGLE_PLAY`: 12,864 in Sekiro, 129,951 in Elden Ring) or looping
(`MODE_LOOPING`: 3,688 and 40,023); no other mode occurs. :proven{games="sekiro elden-ring"}

## Variables, events and bindings

A behaviour graph declares its variables (`hkbVariableInfo` with a role and a type, `hkbVariableBounds`, a name in the
string data and an initial value in `hkbVariableValueSet`), its events (`hkbEventInfo` and a name) and the character
properties it reads. Over all 147 and 461 graphs: :proven{games="sekiro elden-ring"}

- the variable infos, bounds and names are as many as each other (11,766 variables in Sekiro's graphs, 37,054 in Elden Ring's);
- the event infos and names are as many as each other (70,044 and 248,712 events), and the graph's character-property infos and names as many as each
  other (1,385 and 3,837); the attribute tables are empty in every graph;
- the set of initial values has one word value for each variable; a variable of a quad type (`VARIABLE_TYPE_VECTOR3`,
  `VECTOR4`, `QUATERNION`) holds as its word the index of its value among the set's quad values, and a pointer variable
  its index among the variant values, both in order from 0;
- a node's variable binding (`hkbVariableBindingSet::Binding`) names a variable or a character property that exists:
  3,173 and 25,229 bindings to variables, 10,363 and 28,453 to character properties;
- a graph's root generator is set.

A character file declares its own character properties (1,614 in Sekiro's 79 files, 6,123 in Elden Ring's 280), with the
same layout of values.

## Layers

A layer generator (`hkbLayerGenerator`) plays a stack of layers (`hkbLayer`). A layer has a generator, a blending control
(`hkbEventDrivenBlendingObject`: a weight, whether the layer is on at the start, the events that turn it on and off, the
fade durations) and, optionally, a per-bone weight array (`hkbBoneWeightArray`). The weight can be bound to a variable
(`blendingControlData/weight` in the layer's binding set).

Searching a graph from its root generator through the objects' pointers, breadth first and not descending into a layer generator,
finds no layer generator or exactly one: over the 157 behaviour members of Sekiro's binders 79 have one, and over the 559 of
Elden Ring's 280 do. :proven{games="sekiro elden-ring"} The player's graph (`c0000`) has it under a script generator that sits under a blender
generator's child; the other 279 members of Elden Ring's have it as a blender generator's child, and Sekiro's other 78 under a
modifier and a script generator that sit in a state of the root state machine. :observed{games="sekiro elden-ring"}

Every `hkbBoneWeightArray` of both installs (86 in Sekiro's behaviour members, 310 in Elden Ring's) holds only finite values from 0
to 1: 0, 0.1, 0.6 and 1 in Sekiro's, and 0, 0.2, 0.3, 0.4, 0.5, 0.6 and 1 in Elden Ring's. :proven{games="sekiro elden-ring"} The arrays' lengths
differ between graphs, and 31 of Sekiro's and 264 of Elden Ring's are empty; a layer that has one is a layer with bone weights, 32 of
the 145 layers in Sekiro's and 32 of the 383 in Elden Ring's. :proven{games="sekiro elden-ring"}

:only[elden-ring] Giving one of the player graph's `AddBlend` layers a bone weight array (the `Jaw` and `Lips_Lower` array, moved
from the speak layer so that it has one owner) makes the game exit without a message when the character loads, in 4 launches of
build 1.17.2; the same graph with only the layers' variable binding sets cleared loads. :observed[one edit of the player's graph]
Why the game refuses it is not established.

:only[elden-ring] The player's `Master LayerGenerator` has 14 layers. Layer 0 plays `BasisAnim_CMSG`, a `CustomManualSelectorGenerator` of
nine clips (`a000_000009`, `a002_000009`, `a003_000009`, `a010_000009`, `a012_000009`, `a013_000009`, `a014_000009`, `a015_000009`,
`a016_000009`) at weight 1 with no bone weights; the file stores no selected index (the selector's `generatorIndexAtActivate` is
zero), so which clip plays is the game's choice. Layer 1 plays the state machine `Master_SM`; layers 2 to 11 play one clip each at a
weight bound to the variables `AddBlend09` to `AddBlend00` (initial value 0); layer 12 (`AddBlendSpeak_SM`, bone weights `Jaw` and
`Lips_Lower`) is off at the start; layer 13 (`EyeBlink_CMSG`, bone weights the four eye bones) is on, its weight bound to
`EyeBlinkBlend` (initial 1). :observed{games="elden-ring"}

:only[elden-ring] Each of the nine clips of layer 0 has two frames and drives all 30 finger bones (the largest rotation from the
reference pose 1.76 to 1.88 rad); of the player's 9,350 animations 2,306 drive any finger bone, and none of the 340 `a*_020xxx`
locomotion clips does. :observed{games="elden-ring"} In the running game the player's 30 finger bones, idle and walking, hold the
rotations of `a010_000009` within 0.0014 rad, which the state machine's clips there do not drive: a joint the clip of an upper layer
does not drive keeps the pose of the layers below it. :observed{games="elden-ring"} How layers are mixed (a weight below 1, or a bone
weight below 1) is not shown by that capture. :unknown

## The player's twists

:only[elden-ring] The player's graph (`Behaviors/c0000.hkx` in `chr/c0000.behbnd.dcx`) carries its twists in a modifier generator
over `Master_Script`, `ModifiersLayer_ModifierGenerator`, as modifier lists: `LookAt` (the look-at twists, sensing dummies 260,
261 and 266), `MoveAnimeTwist`, `Twist`, `EquipTwist`, `FemaleTwist`, `WeaponTwistElbow` and `ModifierList00` (foot and hand
IK). :observed{games="elden-ring"}

| Twist | Bones and axis | Angle from | Confidence |
|---|---|---|---|
| `MoveAnimeTwist`'s `TwistMaster` | bone 0 (`Master`), +Y, additive | `TwistMasterAngle` | :observed{games="elden-ring"} |
| `MoveAnimeTwist`'s `TwistRootRotYCancel` | bones 47 to 50 (`Spine` to `Spine2`), −Y | `TwistMasterAngle`: the upper body cancels the master's yaw, so the legs turn under a fixed upper body | :observed{games="elden-ring"} |
| `Twist`'s `TwistLowerRoot` (list enabled by `IsTurnTwist`) | bone 0, +Y | `TwistLowerRootAngle` | :observed{games="elden-ring"} |
| `MoveTwistModifier` | bones 45 to 86, about model −Z | `MoveTwistAngle` | :observed{games="elden-ring"} |

Every one of these angle variables starts at 0 and its name occurs once in the file, in the variable table, so nothing in the
graph writes them: the game's code does. :observed{games="elden-ring"} The executable resolves 41 graph variables by a name table of
its own (UTF-16): `IsLockon`, `MoveAngle`, `MoveSpeedLevel`, `MoveDirection`, `TurnAngle`, `AddBlend00` to `09`,
`OriginalityAddBlend00` to `04`, `Overwrite00` to `09`, `DebugPadRStickX` and `Y`, `SlopeAngle`, `TwistUpperRootAngle`,
`TwistLowerRootAngle`, `TwistMasterAngle`, `BlendSlope`, `RideOnAnimId`, `RiddenOnAnimId`, `SYS_IgnoreAllScript` and
`SYS_IgnoreAutoAnimeEndEvent`, keeping each one's index in the behaviour module. :observed[read from the executable's code]{games="elden-ring"}
The player's controller (`CS::PlayerCtrl`) owns a `CS::WalkTwist` (as does `CS::EnemyCtrl`), which on every update writes
`TwistUpperRootAngle` and `TwistMasterAngle` as its controllers' current angles (radians) × 57.29578. A controller moves its current
angle towards its target by its rate, either as a lerp by the rate or as a step of the rate per second; the master's target comes
from a requested direction and the sector the twist's degree limits give it, the upper body's is −(master × k), and a request of
weight 0 or less sets both targets to 0. :observed[read from the executable's code]{games="elden-ring"}

The look-at twists are `CustomLookAtTwistModifier`s, 18 in the player's graph (ids 0, 10, 30, 50, 100, 110, 120, 130, 200, 300,
301, 310 and 311); only `0_TwistLR`, `30_Attack` and the 3xx ones have left and right limits. A [TAE](/engines/fromsoft/animation/tae/)
`Enable Twist Modifier` event (type 700) names one by its id: twist 100, `100_Attack`, turns bones 7 to 48 (`RootPos` to `Spine1`)
at rate 1 with gains 0.9 for a new target, 0.1 on and 0.01 off, limits 30° up, 35° down and 0° left and right, minimums 18° up and
20° down, sensing dummy 261 over 180°, linear and additive. :observed{games="elden-ring"} Dummy 261 is on `c0000.flver` under the
node `LookAtセンシング用_固定`, attached to no bone, 1.166 m up and facing the model's forward. :observed{games="elden-ring"}

## Transition effects

:only[elden-ring] A blending transition's weight comes from its elapsed fraction: `t = min(1, min(timeInTransition + offset, duration)
/ duration)` (0 when the duration is 0), the duration being the time in the transition plus the time remaining, both advanced by
the step. The incoming pose's weight is a curve of `t` chosen by the effect's `blendCurve`, clamped to [0, 1]; in `f32`, with
`t2 = t × t` and `t3 = t2 × t`: :observed[read from the executable's code]{games="elden-ring"}

| `blendCurve` | Weight, in the order computed | Confidence |
|---|---|---|
| 0 | `(t2 × 3) − (t3 + t3)`: 3t² − 2t³ | :proven[the function's own code run on 74 fractions]{games="elden-ring"} |
| 1 | `t` | :proven[the function's own code run on 74 fractions]{games="elden-ring"} |
| 2 | `(t2 − t3) + t` | :proven[the function's own code run on 74 fractions]{games="elden-ring"} |
| 3 | `(t2 + t2) − t3` | :proven[the function's own code run on 74 fractions]{games="elden-ring"} |

`CustomTransitionEffect` shares `hkbBlendingTransitionEffect`'s code and stores no member beyond it. All 119 transition effects of
the player's graph that have a `blendCurve` store 0 (65 `hkbBlendingTransitionEffect`, 53 `CustomTransitionEffect`, one
`hkbHoldFromBlendingTransitionEffect`; its 14 `hkbGeneratorTransitionEffect`s and 3 `hkbManualSelectorTransitionEffect`s have
none). The standing forward jump's transitions are `W_NewJump` (0.5 s, from `Master_SM`'s wildcard), `W_Jump_F` (0.5 s),
`Jump_F_to_Jump_Loop` (0.5 s), `W_Jump_Land_N` (0.2 s) and `W_Jump_Land_F` (0.5 s), each with flags, end mode, start-time
fraction, self-transition mode and event mode 0, alignment bone −1 and no variable bindings. The jump and landing clips are
chosen by weapon style, as the idle is: `Jump_F_Direction_Front_CMSG` holds `a000`, `a002`, `a003`, `a010` and `a012` to `a016`
`_202020`, and `Jump_Land_N_NormalHeight` the same styles' `_202100`. :observed{games="elden-ring"}

:only[elden-ring] Those stored durations are not what the game blends with when the walk reaches a clip. Activating a
`CustomTransitionEffect` walks from the generator transitioned to through its active child (not its first) down to a clip, and looks
up that clip's [TimeAct](/engines/fromsoft/animation/tae/) event of type 16: the duration becomes that event's end time. The
loader replaces the event's stored offsets with its start and end as `f32` at the header's `+0` and `+8`, equal to the file's in all
222 events of 7 clips. When the walk reaches no clip the authored duration is used, floored at 0.05 s; when it reaches a clip without
the event, the authored value from before the floor. :observed[read from the code of 1.17.3, and 18 activations in a running game]{games="elden-ring"}
The durations in those 18 activations: :observed[18 activations]{games="elden-ring"}

| Transition | Clip reached | Duration (s) |
|---|---|---|
| `W_Jump_N` (a standing jump; not `W_NewJump`) | `Jump_NN_CMSG`, `a010_202000` | 0.2 |
| `W_Jump_Land_N` | `a010_202100` | 0.1333 |
| `W_Jump_F` (a running jump) | `Jump_F_Direction_Front_CMSG`, `a010_202020` | 0.2 |
| `W_Jump_Loop` | `a010_202040` | 0.2667 |
| `DefaultTransition`, landing into a run | `a010_202115` | 0.1333 |
| `DefaultTransition_Continue_IgnoreFrom`, back to idle | `a010_000000` | 0.3333 (authored 0) |

A clip whose event starts before 0 (`a000_004020`: −1/30 to 0.3) takes its end, 0.3, not its length. :observed{games="elden-ring"}
The duration found is not written back to the effect's stored duration (`+0xB8`), which reads 0.5 at every `W_Jump_N` activation.
The effects that run are per-activation instances, not the graph's template effects: in the 18 activations the effect passed to the
lookup sat at 17 heap addresses, none of them among the 84 effects (57 names) found by their virtual table, and one address held
`W_Jump_N` in one activation and `DefaultTransition_Continue_IgnoreFrom` in a later one, so the memory is reused.
:observed[18 activations of the player's graph]{games="elden-ring"} Whether some activation reaches no clip was not observed.
:unknown{games="elden-ring"}

## Corroboration by an independent reader

HKLib reads Elden Ring's tagfiles (`20180100`) and writes them as `hktagfile` version 3 XML. For all 1,021 distinct
behaviour tagfiles of Elden Ring, the objects of HKLib's XML (420,275 objects: their ids by first reference, their types,
every member's value) are equal to those read from the file's bytes, apart from one string, in the 36,527-object graph
of `c0000`, that holds a non-ASCII character: HKLib reads a string's bytes one character each. :proven{games="elden-ring"}
HKLib refuses Sekiro's `20160200` tagfiles; a separate reader of the type table and item table reads all 305 of them
without a refusal. :observed{games="sekiro"}

:::open[What sets a selector's index and the graph's variables?]
The graph reads variables and events that the game's scripts and animation events set; the scripts are not part of the
graph files, so which script sets which variable is not in this data.
:::
