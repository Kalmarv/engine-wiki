---
title: Animation clips
description: "How an AnimationClip stores its curves: the streamed, dense and constant blocks, the bindings that name what each curve drives, and the cubic form of a streamed key."
games: [skatebird, sledding, peak, enter-the-gungeon, risk-of-rain-2, schedule-i]
sources:
  - title: AssetStudio
    url: https://github.com/Perfare/AssetStudio
    note: the independent clip decoder the layout was compared with
  - title: UnityPy
    url: https://github.com/K0lb3/UnityPy
    note: type tree reader of the legacy curves and object bindings compared with
  - title: Unity scripting reference, Keyframe and WeightedMode
    url: https://docs.unity3d.com/ScriptReference/Keyframe.html
  - title: Unity scripting reference, AnimationClip
    url: https://docs.unity3d.com/ScriptReference/AnimationClip.html
implementations:
  - name: unity-formats (clip.rs)
    url: https://github.com/Kalmarv/unity-formats/blob/main/src/clip.rs
  - name: primase worlds/unity (clipdata.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/unity/src/clipdata.rs
---

An **AnimationClip** (class 74) of Mecanim (`m_Legacy` false) stores its curves in `m_MuscleClip`. Legacy clips store curves
per kind and are a different layout ([legacy clips](#legacy-clips)). A clip's curves are numbered across three blocks, in this order: the **streamed** curves
(`m_StreamedClip`), the **dense** curves (`m_DenseClip`, one sample per frame at a fixed rate) and the **constant** curves
(`m_ConstantClip`, one value each). :observed{games="skatebird sledding"}

## Bindings

`m_ClipBindingConstant.genericBindings` lists what the curves drive, in curve order. Each binding has:

| Field | Meaning | Confidence |
|---|---|---|
| `path` | the CRC-32 (the zlib one) of the path of GameObject names below the Animator's own GameObject; the Animator's GameObject itself is the empty path, hash 0 | :observed{games="skatebird sledding"} |
| `attribute` | for a Transform (`typeID` 4): 1 position, 2 rotation (a quaternion), 3 scale, 4 Euler angles; for another class the hash of the property | :observed{games="skatebird sledding"} |
| `typeID` | the target's class id: 4 Transform, 95 Animator, 137 SkinnedMeshRenderer, ... | :observed{games="skatebird sledding"} |
| curve count | a binding takes one curve for a float property; for a Transform attribute 3 (position, scale, Euler) or 4 (rotation) | :observed{games="skatebird sledding"} |

The path hash is the CRC-32 of the target's path; an avatar's name table (`m_TOS`) maps hashes back to names.
:observed{games="skatebird"} A clip's blend shape curve binds to a SkinnedMeshRenderer by its path hash and the shape's name
hash. :observed{games="sledding"}

## The streamed block

The streamed block is a sequence of frames. Each frame is a `time` (`f32`), a count (`i32`) and that many keys, each an `index`
(`i32`, which curve) and four `f32` coefficients. A key opens a cubic segment of its curve that lasts until the curve's next
key:

`value(dt) = ((c0 · dt + c1) · dt + c2) · dt + c3` for `dt` seconds after the key,

so `c3` is the key's value and `c2` its outgoing slope; the incoming slope of the next key is the derivative at the segment's
end. The first frame is at time `−f32::MAX` and gives every curve's initial value; the last is at `+∞` and has no keys. A
segment whose coefficients are not finite is a **step**. :observed{games="skatebird sledding"} The slopes are per second:
scaling a slope by the segment length again would count the length twice. :observed{games="skatebird"}

A curve with only its initial entry is constant. Frames that do not end at +∞ and times that go backwards are not valid streamed
data. :observed

A key's curve index can reach past the clip's curve count. In PEAK (Unity 6000.3.15f1), 98 of the 740 clips of two level bundles
(`levels0-31` and `levels192-207`) have keys whose index is at or past the streamed block's `curveCount`, in the first frame and
in later ones, most with coefficients that are not zero; the other 642 keep every key below it. All 98 end at the +∞ frame.
:observed{games="peak"} `RespawnChest_Open` (also in the loose `sharedassets4.assets`, so not an effect of the bundle) has a
`curveCount` of 17, no dense curves and 17 generic bindings; its first frame keys indices 0 to 17, index 17 with all-zero
coefficients, and its later frames 0 to 16. :observed{games="peak"}

:::open[What does a curve index past the count address?]
Whether the extra indices of those 98 PEAK clips drive bindings past the streamed block or are a placeholder curve is not
established.
:::

## Object curves

A binding whose `isPPtrCurve` is set drives an object reference (a renderer's material, a sprite). It takes one curve like a
float property, and the curve's values are indices into `m_ClipBindingConstant.pptrCurveMapping`, the list of objects the clip
swaps in. In Risk of Rain 2, 5 of its 4,898 Mecanim clips have such bindings (20 of them, all on a SkinnedMeshRenderer, class
137, attribute 0), their mappings name 28 objects, and every one of their 26 keys is a whole number that indexes the mapping;
the bindings and mappings are the ones an independent type tree reader gives. :proven{games="risk-of-rain-2"} No binding of
those clips or of Schedule I's 279 sets `isIntCurve` or `isSerializeReferenceCurve`. :observed{games="risk-of-rain-2 schedule-i"}

A clip's length is `m_StopTime − m_StartTime` seconds. Its animation events (`m_Events`) are a separate list.
:sourced[Unity scripting reference]

## Legacy clips

A **legacy** clip (`m_Legacy` true, played by the Animation component) keeps a default `m_MuscleClip` (no curves,
`m_StartTime` 0 and `m_StopTime` 1) and no generic bindings; its curves are Unity's own keyframe curves, stored by kind with
the path of their target as text:

| Field | Curve | Value of a key |
|---|---|---|
| `m_RotationCurves` | a Transform's rotation | a quaternion (`x y z w`) |
| `m_EulerCurves` | a Transform's Euler angles, with `m_RotationOrder` | three floats |
| `m_PositionCurves`, `m_ScaleCurves` | a Transform's position and scale | three floats |
| `m_FloatCurves` | a property of a component: `attribute` (its name), `classID`, `script` | one float |
| `m_PPtrCurves` | an object property: `attribute`, `classID`, `script` | a PPtr |
| `m_CompressedRotationCurves` | rotation curves in a compressed form, with `m_Compressed` | |

Each curve is an `AnimationCurve`: `m_Curve`, a list of keyframes of `time`, `value`, `inSlope` and `outSlope` (from Unity
2018.1 also `weightedMode`, `inWeight` and `outWeight`), and `m_PreInfinity`, `m_PostInfinity` and `m_RotationOrder`. The
clip's wrap mode is `m_WrapMode` (0 default, 1 once, 2 loop, 4 ping-pong, 8 clamp forever). :sourced[Unity scripting
reference]

Every legacy clip of Enter the Gungeon (27), Risk of Rain 2 (25) and Schedule I (187) reads in that layout, each key of each
curve equal to an independent type tree reader's. :proven{games="enter-the-gungeon risk-of-rain-2 schedule-i"} None of them is
compressed or has object curves, every Euler curve is of rotation order 4 (Z, then X, then Y), and every pre- and
post-infinity is 2 (clamp). :observed{games="enter-the-gungeon risk-of-rain-2 schedule-i"} The muscle clip's stop time is not
the clip's length: 179 of Schedule I's 187 legacy clips have keys past 1 s or end before it. :observed{games="schedule-i"} Two
of Schedule I's clips start at a first key later than 0. :observed{games="schedule-i"} Gungeon's (Unity 2017.4) keyframes have
no `weightedMode`. :observed{games="enter-the-gungeon"} One of Schedule I's legacy clips wraps ping-pong (`m_WrapMode` 4): it plays forward, then
backward. :proven{games="schedule-i"}

A legacy curve's path names its target as a mechanim binding's path hash does: its CRC-32 is the hash. Mecanim's Transform
attributes 1 to 4 are the position, rotation, scale and Euler kinds, and a float curve's attribute names its property as a
binding's attribute hash does. :inferred

### Tangents and weights

Between two keys a curve is a cubic Hermite spline of their values and their slopes (per second). A slope that is infinite on
either side of a segment makes it a step: the segment holds the first key's value. :sourced[Unity scripting reference]
`weightedMode` bit 1 (`In`) makes the key's `inWeight` count and bit 2 (`Out`) its `outWeight`. A weighted side of a segment
is the Bezier handle that fraction of the segment's span from its key, along its slope; an unweighted side is a third, which is
where the Hermite spline's handles are. The segment is then the cubic Bezier curve in time and value of those handles, not a
cubic in time. :sourced[Unity scripting reference] Schedule I has 24 curves with weighted keys. :proven{games="schedule-i"}

## Humanoid curves

A humanoid clip's Animator binding (`typeID` 95) carries the root, the IK goals and the muscles; see
[humanoid muscles](/engines/unity/animation/humanoid-muscles/). :observed{games="sledding"}

## SkateBIRD

### Checks against another decoder

Three clips of SkateBIRD's bird, decoded by AssetStudio and by a reader of the layout above, then evaluated with Unity's cubic
Hermite rule between keys: `Flapping` (path id 1250 of `sharedassets0.assets`, 48 bindings, 160 curves), `Grab Left Loop`
(1274; 90 bindings, 300 curves) and `Bounce Dance Mood` (1257; 12 bindings, 40 curves). The blocks hold exactly those curves,
every binding matches a joint by the CRC-32 of its path, and the two decoders drive the same (joint, property) pairs.
Constant curves agree to 5e-9. With the slopes read per second, the animated curves agree to 4.8e-6, 7e-4 and 2.3e-5 degrees
(rotation). :observed{games="skatebird"}

`sharedassets5.assets` holds another `Flapping` with 391 bindings for a different rig. :observed{games="skatebird"}
