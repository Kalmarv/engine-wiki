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

:only[sekiro] `c0000.anibnd` contains the player skeleton and markers such as `c0000_a000_hi.txt` naming companion
animation binders. Object animation can be nested: 233 of the 1,395 object binders examined contain an `.anibnd`
member. :observed{games="sekiro"}

:only[elden-ring] Character animation can be split into divisions. For example, `c2010.anibnd` contains the skeleton
and `.blf` markers naming `c2010_div00.anibnd` and `c2010_div01.anibnd`. Player companion markers can instead use
`.txt`. :observed{games="elden-ring"}

An animation member named `a000_003000.hkx` corresponds to animation record 3000 in TAE.
:observed

## Animation and model skeletons differ

The animation skeleton is not necessarily the FLVER skeleton. Sekiro's `c1010` has 127 Havok bones and 400 FLVER
bones. Shared reference poses agree in examined `c1010` and player `c0000` data, but this does not establish equal
bone counts or index orders. :observed{games="sekiro"}

Elden Ring's `c3000` FLVER has 368 joints, 265 parentless; its Spine and Pelvis chains are separate roots there but
share an animation hierarchy in Havok. :observed{games="elden-ring"}

:::open[How does the engine transfer every animation to the model hierarchy?]
Name correspondence and matching model-space poses can construct a coherent pose across different hierarchies.
That reconstruction alone does not establish the engine's complete mapping, additive blending, IK or procedural
bone rules. Live Sekiro poses retain residual differences on some finger and twist bones.
:::
