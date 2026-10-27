---
title: Avatars, Animators and controllers
description: "The Mecanim objects: Avatar skeletons, the compiled AnimatorController (layers, state machines, transitions, blend trees), how blend tree weights and state time are computed, and SkateBIRD's bird controller."
games: [skatebird, sledding]
sources:
  - title: Unity manual, Mecanim and Blend Trees
    url: https://docs.unity3d.com/Manual/BlendTree-1DBlending.html
    note: 1D blending, direct blend trees and 2D blend types
  - title: Johansen, Automated Semi-Procedural Animation for Character Locomotion (thesis, Aarhus University, 2009)
    note: chapter 6 gives the gradient band interpolation of the 2D blend trees
implementations:
  - name: unity-formats (animator/mod.rs)
    url: https://github.com/Kalmarv/unity-formats/blob/main/src/animator/mod.rs
  - name: primase worlds/unity (blend_tree.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/unity/src/blend_tree.rs
---

An **Animator** (class 95) component binds an **AnimatorController** (class 91) and an **Avatar** (class 90) to a rig. The
controller is stored compiled, as a `ControllerConstant`; names (states, parameters, layers, paths) survive only as CRC-32
hashes with a name table (`m_TOS`) beside them. :observed{games="skatebird sledding"}

## Avatar

An Avatar stores the skeleton Mecanim animates and, for a humanoid, the compiled muscle data:

| Part | Content | Confidence |
|---|---|---|
| skeleton | per node its parent (−1 for a root), the index of its axes (−1 for none) and the CRC-32 of its path; nodes carry a transform (translation, rotation as a quaternion `x, y, z, w`, scale) | :observed{games="skatebird sledding"} |
| axes | per bone its pre-rotation and post-rotation, the sign of each axis, the limits of its rotation in radians, its length and its type | :observed{games="skatebird sledding"} |
| human | for a humanoid, the human skeleton and its pose, which skeleton bone each human bone is (−1 for none), the retargeting proportions | :observed{games="skatebird sledding"} |
| HumanDescription | what the avatar was built from: per human bone the skeleton bone it names and its limits, the skeleton bones with their local transforms, and the arm, forearm, upper-leg and leg twist shares | :observed{games="sledding"} |
| name table | pairs of a CRC-32 and a path | :observed{games="skatebird sledding"} |

A generic avatar has an empty human skeleton. :observed{games="skatebird"}

## Controller

| Level | Content | Confidence |
|---|---|---|
| layers | the state machine each runs, a body mask, a skeleton mask (CRC-32 of a path and a weight), how it blends in (override or additive) and its weight | :observed{games="skatebird"} |
| state machine | states, an any-state list, the default state, entry and exit selector nodes | :observed{games="skatebird"} |
| state | its transitions, one blend tree per motion set (a plain clip is a tree of one leaf), the CRC-32 of its name and path, and the parameters that drive speed, mirror, cycle offset and time | :observed{games="skatebird"} |
| transition | a destination and its conditions | :observed{games="skatebird"} |
| condition | a mode (1 true, 2 false, 3 greater, 4 less, 6 equals, 7 not equal), the CRC-32 of the parameter, a threshold, and for an exit-time condition the time | :observed{games="skatebird"} |
| parameter | the CRC-32 of its name, its kind (1 float, 3 int, 4 bool, 9 trigger) and its place in the default values of that kind | :observed{games="skatebird"} |
| clips | `m_AnimationClips`: the clips the blend trees' leaves index, a null slot for a null pointer (a leaf's index counts it) | :observed{games="skatebird"} |

A transition's `destination` below 30,000 names a state of its machine; 30,000 + *n* names selector node *n* (an entry or an
exit). :observed{games="sledding"}

### Blend trees

A node of a blend tree has a kind (`blend_type`: 0 1D, 1 simple directional 2D, 2 freeform directional 2D, 3 freeform
cartesian 2D, 4 direct), the parameters it blends by, its children with thresholds or positions, and for a leaf the clip
(`u32::MAX` for none). A child can itself be an inner node whose weight splits among its children (weights multiply).
:observed{games="skatebird"}

| Kind | Weights | Confidence |
|---|---|---|
| leaf | 1 | :sourced[Unity manual] |
| 1D | at or below the first threshold the first child plays alone, at or above the last the last child; between two thresholds the two neighbours play with weights linear in the parameter | :sourced[Unity manual] |
| direct | child *i*'s weight is the value of its own parameter; with normalised blend values the weights are divided by their sum **only where the sum exceeds 1**; a sum of 1 or less stays as it is, so 0.2 and 0.1 play at 0.2 and 0.1, and all zeros play nothing | :observed |
| freeform cartesian | the gradient bands of Johansen's thesis (equation 6.6): child *i*'s weight is `h_i = min over j ≠ i of (1 − (p − p_i)·(p_j − p_i) / |p_j − p_i|²)`, clamped at 0, then divided by their sum | :observed |

The manual says direct blend values are divided by their sum; the editor (6000.6.4f1) does it only above 1, checked at 8
points. :observed The cartesian formula matches the editor to 1e-7 at 49 points around the bird's Idling positions and on an
uneven six-child set, outside the convex hull as well. :observed

:::open[The other 2D blend kinds]
The simple directional and freeform directional trees use polar gradient bands (Johansen, chapter 6.3.1); no engine
measurement of their weights has been taken.
:::

### State time

For a state of one clip, the clip is at `state time × speed + cycle offset × clip length` seconds, with the speed the state states
times its speed parameter's value when it names one, the cycle offset a fraction of the clip (the state's or its parameter's),
and the clip looped by its own looping. :sourced[Unity manual] A state that is a blend tree has a time that is the weighted length of
its clips. :sourced[Unity manual]

## SkateBIRD's bird

The bird's Animator is `level0` object 10796; its controller is `Skating Bird` (`sharedassets0.assets` object 1309) and its
avatar `sharedassets0.assets` object 1302. :observed{games="skatebird"} The controller has 3 layers, 3 state machines, 39 states,
30 parameters, 47 clips and 311 names, and every field read agrees with an independent reader's, field by field.
:observed{games="skatebird"}

| Layer | Content | Confidence |
|---|---|---|
| 0 `Beak Override` | 2 states: `Polite Beak Movements` plays `Beak Chatter`, `Beak Closed` plays `Bobbing and Twitching`, switched by the bool `beak_noise` | :observed{games="skatebird"} |
| 1 `Base Layer` | 35 states, default `Idling`, a freeform cartesian blend tree of 7 clips from `Bobbing and Twitching` to `Fastest Mood`, 24 transitions out of it; `Flapping` (state 1, speed 2.5), `Curled Up` (a 1D blend of two clips), the pushes, `Screm`, the bailed states, twelve grab states (states 11 to 22: the entry clip, then its loop) and the reaction states, entered from the entry selector at states 0, 11, 23 and 25 | :observed{games="skatebird"} |
| 2 `Blinking` | a 1D blend of `Blinking` and `Blinking HawkOwl` | :observed{games="skatebird"} |

All layers have blending mode 0 (override) and weight 1, and no any-state transitions. :observed{games="skatebird"}
