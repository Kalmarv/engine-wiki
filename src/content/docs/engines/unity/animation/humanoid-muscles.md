---
title: Humanoid muscles
description: "How Mecanim turns a humanoid clip's muscle curves into bone rotations: degrees of freedom, the swing-twist rotation, limb twist sharing, the body's centre of mass and frame, as fitted to the editor."
games: [sledding]
sources:
  - title: Unity scripting reference, HumanPoseHandler and HumanTrait
    url: https://docs.unity3d.com/ScriptReference/HumanPoseHandler.html
    note: the API the editor measurements use
implementations:
  - name: primase worlds/unity (humanoid.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/unity/src/humanoid.rs
---

A humanoid clip does not store bone rotations. It stores 95 **muscle** values, the root's position and orientation, and
four IK goals; the **Avatar** says how the muscles become rotations on a particular skeleton
([Avatars and controllers](/engines/unity/animation/animator-controllers/)). Nothing public states the conversion exactly, so
the rules below were fitted to the editor's own results: Unity 6000.6.4f1 rebuilt the avatar of Sledding Game's frog from its
stored HumanDescription and was read back through `HumanPoseHandler`. The game was built with Unity 6000.3.12f1; the avatar
compiler agrees across the two versions (the rebuilt avatar's compiled axes equal the game's to 9e-8), but the muscle-to-rotation
step has no such cross-check because the game cannot be run for it. :observed{games="sledding"}

## The clip's attribute layout

A clip's Animator bindings number their curves from 7: attributes 7 to 41 are the root and the IK goals, in the order RootT
(3 values), RootQ (4), left foot T and Q, right foot T and Q, left hand T and Q, right hand T and Q (each goal 7 values), then
the 95 muscles: muscle *m* is attribute 42 + *m*. Unit-length quaternions in RootQ and the four goals confirm the layout on
Sledding Game's clips. :observed{games="sledding"} The first 55 muscles are the body's, then 20 for each hand. :observed{games="sledding"}

## From muscle to bone rotation

A human bone has up to three degrees of freedom (axes x, the twist, then y and z), each driven by one muscle `v` (−1 to 1;
beyond that it overshoots the range). With the axes' stored limits `min` (negative) and `max` in radians and sign `sgn`:

- the angle of a degree of freedom is `sgn · (v · max)` for `v ≥ 0` and `sgn · (−v · min)` below 0;
- the rotation inside the bone is `T(y, z) · Rx(x)`: a twist about x, then a swing `T` whose quaternion is
  `normalize(0, tan(y/2), tan(z/2), 1)`. A single axis is the plain rotation; two together are neither the product of two
  rotations nor the exponential map of the vector (both are off by 2° and more);
- the bone's local rotation is `pre · inner · post⁻¹`, with `pre` and `post` the axes' rotations, in the avatar's skeleton frame.

These rules equal the editor to 6e-5° on every bone of 300 random muscle poses, and exactly (0.0°) on every grid pose of the
spine, chest, upper chest, neck, head and shoulders. :observed{games="sledding"}

### Limb twist

The twist of a limb is shared down its chain (upper arm to forearm to hand, upper leg to lower leg to foot). A bone keeps the
share its HumanDescription states (arm, forearm, upper-leg and leg twist) of its own x angle and passes the rest to its child,
which applies it as `post_parent · Rx(rest) · post_parent⁻¹` before its own rotation. Checked at shares 0.5 and at (0.2, 0.7,
0.3, 0.9): the bone keeps the share, not 1 minus it. :observed{games="sledding"}

The total twist angle is wrapped into (−π, π] first: the pose is periodic in the twist muscle, 360° of total twist apart, and at
exactly 180° the editor's sign is float noise. An upper arm's muscle at 2 and −2 turns it by ±90°, not ±180° (muscle values −3
to 3 read back continuously with period 4, the sign flipping at ±2). Only the upper arm's wrap is measured; the same wrap is
assumed for the forearm and the legs. :observed{games="sledding"}

### Translations

Every human bone but the hips takes a constant translation from the avatar's human skeleton, whatever the scene's Transform
holds: with the frog's toe moved in the scene after the avatar was built, both poses read the toe back at the avatar's
0.0503881574, not the scene's 0.1. The frog's game scene differs from its avatar only at the toes (0.070169 against 0.050388, in
the foot's frame; every other human bone agrees to 2e-7). :observed{games="sledding"} That the running Animator does the same is
not tested. :inferred

## The hips: RootT and RootQ

`RootT` and `RootQ` are `HumanPose.bodyPosition` (the centre of mass over the avatar's human scale) and `bodyRotation` (the
body frame relative to the avatar's rest orientation, `m_RootX.q`). `GetHumanPose` reads the bones' rotations, not their
translations. :observed{games="sledding"}

- The **centre of mass** is the mean of the bones' masses at their segments' centres; the centre of a bone is the mean of its
  origin and its children's. The hips' is their children's alone; the head, hands and feet use their own; toes and eyes are no
  children; the left lower arm's own origin is the left upper arm's, which the editor does on both avatars read. The stored
  pose's centre of mass is `m_RootX.t` and its height the human scale `m_Scale` (frog and yeti, to float precision). The rule is
  exact to 1e-6 over the editor's poses on both. :observed{games="sledding"}
- The **body frame** has its up axis from the middle of the upper legs to the middle of the upper arms, its lateral axis the sum
  of the right-minus-left vectors of the upper arms and of the upper legs made perpendicular to the up axis, and its forward
  axis their cross product. At the avatar's stored pose this frame is `m_RootX.q` for the frog and the yeti. The up axis is exact
  (6e-5° over 1,932 poses). :observed{games="sledding"}

:::open[The remainder of the body rotation]
The body frame above is not the whole of the editor's: against the editor's hips the rotation is off by 0.05° rms (0.4° at most)
over 1,251 poses of the spine's muscles, 0.25° rms (3.2° at most) over 681 poses of every muscle at random on the frog, and 0.6°
rms (9.6° at most, a pose with every muscle near its limit) on the yeti. What the editor adds beyond these four points
(upper arms and upper legs) was not found: no linear combination of the landmark positions, no other normalisation or choice of
up, and no landmark beyond the upper arms and legs explains it.
:::

## Not evaluated

The IK goals and the fingers' muscles. No avatar read has finger bones, so the finger formula (the same as for the other
bones) has no measurement. The formulas for an avatar lacking optional bones (a chest, shoulders) are unchecked; both avatars
read have them. :observed{games="sledding"}
