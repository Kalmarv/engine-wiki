---
title: Havok clips and skeletons
description: Animation containers, track bindings, companion binders and distinct animation and model skeletons.
sources:
  - title: HKLib
    url: https://github.com/The12thAvenger/HKLib
  - title: Smithbox
    url: https://github.com/vawser/Smithbox
implementations:
  - name: havok-formats Havok animation container
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/animation.rs
---

Animation binders contain Havok `hkaAnimationContainer` tagfiles: skeletons, animations and bindings specifying the
skeleton bone driven by each track. Motion data and [TAE events](/engines/fromsoft/animation/tae/) are separate files
in the binder. :observed

The named skeleton contains bone names, signed 16-bit parent indices (`-1` is a root), reference transforms and
optional float slots. A binding carries `originalSkeletonName`, transform-track-to-bone indices, float-track-to-slot
indices, partitions and a blend hint. :sourced[HKLib]

```layout
title: hkQsTransform
size: 48
note: Four-float lanes; quaternion components are x, y, z, w.
fields:
  - {at: 0, size: 16, type: "f32[4]", name: translation, level: observed, note: Fourth lane is padding}
  - {at: 16, size: 16, type: "f32[4]", name: rotation quaternion, level: observed}
  - {at: 32, size: 16, type: "f32[4]", name: scale, level: observed, note: Fourth lane is padding}
```

The fourth lane of a translation and of a scale is padding that holds whatever bytes the writer left. Over the
15,920 bones of Sekiro's 316 skeletons a translation's fourth lane is exactly 0.0 on 2,079, exactly 1.0 on 318, a
nonzero value below 1e-3 in magnitude on 1,680 and some other value on 11,843; over Elden Ring's 72,571 bones in 966
skeletons the counts are 5,919, 974, 6,918 and 58,760. A scale's fourth lane is 0.0 on 15,602 (Sekiro) and 71,596
(Elden Ring) bones and 1.0 on 318 and 975. Every rotation is a unit quaternion to within 1e-4.
:proven[over the skeletons read]{games="sekiro elden-ring"}

A negative track-to-bone index drives no bone; two examined `c7300` files use such a binding in Sekiro.
:observed{games="sekiro"} Extracted root motion is a separate sampled reference frame with up and forward vectors,
duration and four-float samples containing XYZ translation and rotation about up. :sourced[HKLib]

## Header and binding fields

The census below covers every animation tagfile of the animation binders of both installs: 11,170 distinct tagfiles in
Sekiro's 465 binders (12,121 binder members), of which 11,159 open (10 name a compendium that only another character's
binder holds, 1 is SDK 2015.1), and 39,736 in Elden Ring's 1,657 binders (44,735 members), all of which open.

| | Sekiro | Elden Ring |
|---|---|---|
| Animations | 10,866 | 38,770 |
| `hkaSplineCompressedAnimation` | 10,865 | 38,769 |
| `hkaInterleavedUncompressedAnimation` | 1 | 1 |
| Animations with extracted motion | 6,864 | 20,606 |
| `frameType` of every reference frame | 0 | 0 |
| `blendHint` 0 / 1 / 2 | 10,542 / 321 / 3 | 34,634 / 4,136 / 0 |
| Bindings whose track lists match the animation's track counts | 10,866 | 38,770 |

:proven[over the tagfiles that open]{games="sekiro elden-ring"}

The reference frame's `frameType` member carries member flags 0x21 in the type tables, where the stored members such
as `blendHint` carry 0x20 (the 160 distinct Sekiro type tables that describe the class all agree).
:proven[over the Sekiro tables]{games="sekiro"} The extra bit is the flag Havok gives a member that is not written to
the file. :inferred The member reads 0 in all 27,470 reference frames (6,864 in Sekiro, 20,606 in Elden Ring), so it
holds no data. :proven[over the frames read]{games="sekiro elden-ring"}

`blendHint` is 0 on ordinary clips and 1 on additive ones (321 of Sekiro's bindings, in 62 binders; 4,136 of
Elden Ring's). The value 2 occurs on three Sekiro bindings, all in `c9520`, whose clips (`a000_009500`, `a000_009600`,
`a000_009999`) have the same numbers as additive clips that every other Sekiro character stores with 1.
:proven[over the bindings read]{games="sekiro elden-ring"} The type tables name the enum `hkaAnimationBinding::BlendHint`
but list no members, so the files do not say what 1 and 2 mean (whether an additive clip's deltas are in the parent's
or the child's space). :proven[over every table of both installs]{games="sekiro elden-ring"}

The one interleaved clip of each game stores `duration` as `(samples - 1)` frames of 1/30 s: Sekiro's `c1050`
`a000_400600` has 166 samples of 101 tracks and lasts 5.5 s; Elden Ring's `c4751` `a000_030000` has 2 samples of 185
tracks and lasts 1/30 s. :observed

A clip's annotation tracks differ by game. Every Sekiro animation has one annotation track per transform track and
none of them holds an annotation; the track's name is the name of the bone its transform track drives in 9,365 of the
9,400 animations whose skeleton is in the same binder (the other 35 are clips authored on another object's
skeleton). Elden Ring's animations mostly have none (36,245 of 38,770); the other 2,525 have one per transform track,
again with no annotations. :proven[over the animations read]{games="sekiro elden-ring"}

## Compendia and inline type tables

An animation binder holds no compendium or one: Sekiro 85 and 380 of its 465 binders, Elden Ring 763 and 894 of its
1,657. A compendium names 1 to 3 type-table ids (Sekiro 65, 312 and 3 compendia; Elden Ring 113, 702 and 79), and a
tagfile with a `TCRF` section names one of them. Every clip and skeleton tagfile of both games names an id its own
binder's compendium holds, except 10 Sekiro clips in `c0010_c5000.anibnd`, a binder with no compendium of its own: their
id is the common Sekiro character type table, which the compendia of 104 other binders hold, among them the player's.
:proven[over the tagfiles read]{games="sekiro elden-ring"}

Some stock animation tagfiles carry their own `TYPE` section instead. In Sekiro 49 distinct tagfiles do: 42 object and
part `skeleton.hkx`, six effect clips (`s04016_a000_000000.hkx` and others, each holding one animation) and the one
SDK 2015.1 clip `c1090`'s `a000_205000.hkx`. In Elden Ring 530 do: 473 skeletons, including `c2130`'s and `c4370`'s, and
57 effect clips, all SDK 2018.1; no Elden Ring character clip does.
:proven[over the tagfiles read]{games="sekiro elden-ring"}

## Binder relationships

An animation member named `a000_003000.hkx` corresponds to animation record 3000 in TAE; for groups other than `a000`
the record number depends on the character, see [TAE](/engines/fromsoft/animation/tae/). :observed

How the binders are divided differs between the games; see each game's section.

## Animation and model skeletons differ

The animation skeleton is not necessarily the FLVER skeleton. Each game's section gives an example.

:::open[How does the engine transfer every animation to the model hierarchy?]
Name correspondence and matching model-space poses can construct a coherent pose across different hierarchies.
That reconstruction alone does not establish the engine's complete mapping, additive blending, IK or procedural
bone rules. Live Sekiro poses retain residual differences on some finger and twist bones.
:::

## Sekiro

### Binder relationships

:only[sekiro] `c0000.anibnd` contains the player skeleton and markers such as `c0000_a000_hi.txt` naming companion
animation binders. Object animation can be nested: 233 of the 1,395 object binders examined contain an `.anibnd`
member. :observed{games="sekiro"}

The player's clips are in the seven companion binders those markers name: `c0000_a000_hi`, `c0000_a000_md`,
`c0000_a000_lo` and the `a00x`, `a05x`, `a07x` and `a2xx` sets. They hold 1,248 spline-compressed animations, 671
with extracted root motion sampled once per frame with up vector (0, 1, 0). :observed{games="sekiro"}

The reference frames of 6,858 of the 6,864 Sekiro clips with extracted motion, and of all 20,606 Elden Ring ones, have
`up` (0, 1, 0) and `forward` (0, 0, 1); six Sekiro clips have `up` (0, 0, 1) and `forward` (1, 0, 0).
:proven[over the frames read]{games="sekiro elden-ring"} In the clips whose path turns and whose steps keep one direction
in the character's own frame, the heading of the translation steps minus the rotation angle is constant for one sign
of the angle (a circular resultant above 0.95) and not for the other (below 0.8) in 27 Sekiro clips and 74 Elden Ring
clips. The sign that holds is the one where the heading rises with the stored angle, measured from `forward` towards
`up` × `forward`: all 27 Sekiro clips and 71 of the 74 Elden Ring clips. :observed The angle is then a right-handed
rotation about `up`. The other 666 turning Sekiro clips and 2,092 Elden Ring clips are not decided by this test,
because their steps change direction in the character's frame. :inferred

### Animation and model skeletons

Sekiro's `c1010` has 127 Havok bones and 400 FLVER
bones. Shared reference poses agree in examined `c1010` and player `c0000` data, but this does not establish equal
bone counts or index orders. :observed{games="sekiro"}

### The running pose

The running game (1.06) holds the player's local pose as arrays of 146 `hkQsTransform` records in Havok skeleton
order, and the skeleton's reference pose is in memory exactly as stored. During idle, an array matches clip
`a000_000000` evaluated at fractional frames (frame × 1/30 s) within 1e-5 on 59 to 64 of the 146 bones. Five bones
(4, 5, 6, 11 and 26) differ from every decoding of the clip by 2e-3 to 8e-3, and about 25 finger and twist bones by
about 3e-4. :observed{games="sekiro"}

The player's local pose array is rewritten once per frame: sampled from memory about 600 times a second for 24 s, it changed
exactly 1,440 times, at the 60 Hz frame rate. :observed{games="sekiro"} Over those 1,440 snapshots, which cover standing
idle, starting and stopping a walk, strafing and sprinting, every one of the 146 rotations has a length within 4.4e-7 of 1
(float rounding). During the walk transitions and the sprint, bones sit up to 105 to 149 degrees from their idle rotation,
so a linear blend of two such rotations that is not renormalised would be 0.27 to 0.7 short of unit length: the pose the
game hands on is normalised. :observed{games="sekiro"} The arrays that hold the clip samples before blending were not
found, so whether the blender or a later stage does the normalising is not established. :unknown{games="sekiro"}

## Elden Ring

### Binder relationships

:only[elden-ring] Character animation can be split into divisions. For example, `c2010.anibnd` contains the skeleton
and `.blf` markers naming `c2010_div00.anibnd` and `c2010_div01.anibnd`. Player companion markers can instead use
`.txt`. :observed{games="elden-ring"}

Elden Ring's 293 character animation binders hold 5,846 animations, all Havok 2018.1: 5,845
`hkaSplineCompressedAnimation` and one `hkaInterleavedUncompressedAnimation`, with 612,478 transform tracks, no
float tracks, and 3,233 animations with extracted motion. :observed{games="elden-ring"}

### Animation and model skeletons

Elden Ring's `c3000` FLVER has 368 joints, 265 parentless; its Spine (75 joints) and Pelvis (30) chains are separate
roots there but share an animation hierarchy in Havok, where Spine is under Pelvis. The clips move 26 of the 265
parentless joints; the other 239 never move. Its Havok skeleton has 129 joints, and 128 of them store a rest scale
that differs from 1 by up to 1.19e-6, float noise in the reference pose. :observed{games="elden-ring"}
