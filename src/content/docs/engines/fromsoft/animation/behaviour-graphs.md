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

| `offsetType` | Sekiro | Elden Ring |
|---|---:|---:|
| `OffsetNone` | 114 | 396 |
| `IdleCategory` | 1,220 | 2,883 |
| `WeaponCategoryRight` | 340 | 183 |
| `WeaponCategoryLeft` | 183 | 62 |
| `WeaponCategoryHandStyle` | 0 | 233 |
| `MagicCategory` | 252 | 194 |
| `SwordArtsCategory` | 0 | 413 |
| `AnimIdOffset` | 10,965 | 69,138 |

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
