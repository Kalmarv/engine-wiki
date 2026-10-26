---
title: Havok clips and skeletons
description: Animation containers, track bindings, companion binders and distinct animation and model skeletons.
sources:
  - title: HKLib
    url: https://github.com/The12thAvenger/HKLib
  - title: Smithbox
    url: https://github.com/vawser/Smithbox
implementations:
  - name: primase Havok animation container
    url: https://github.com/Kalmarv/primase/blob/main/toolkit/havok/src/animation.rs
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

A negative track-to-bone index drives no bone; two examined `c7300` files use such a binding in Sekiro.
:observed{games="sekiro"} Extracted root motion is a separate sampled reference frame with up and forward vectors,
duration and four-float samples containing XYZ translation and rotation about up. :sourced[HKLib]

## Binder relationships

An animation member named `a000_003000.hkx` corresponds to animation record 3000 in TAE.
:observed

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

:::open[Which sign does the player's root-motion rotation take?]
Over 602 heading steps of the player clips, 222 fit one sign convention and 380 the other, so the stored motion
alone does not settle it.
:::

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
