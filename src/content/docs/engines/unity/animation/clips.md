---
title: Animation clips
description: "How an AnimationClip stores its curves: the streamed, dense and constant blocks, the bindings that name what each curve drives, and the cubic form of a streamed key."
games: [skatebird, sledding]
sources:
  - title: AssetStudio
    url: https://github.com/Perfare/AssetStudio
    note: the independent clip decoder the layout was compared with
  - title: Unity scripting reference, AnimationClip
    url: https://docs.unity3d.com/ScriptReference/AnimationClip.html
implementations:
  - name: primase worlds/unity (read/clip.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/unity/src/read/clip.rs
  - name: primase worlds/unity (clipdata.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/unity/src/clipdata.rs
---

An **AnimationClip** (class 74) of Mecanim (`m_Legacy` false) stores its curves in `m_MuscleClip`. Legacy clips store curves
per kind and are a different layout. A clip's curves are numbered across three blocks, in this order: the **streamed** curves
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

A curve with only its initial entry is constant. Frames that do not end at +∞, a key of a curve beyond the count, and times that
go backwards are not valid streamed data. :observed

A clip's length is `m_StopTime − m_StartTime` seconds. Its animation events (`m_Events`) are a separate list.
:sourced[Unity scripting reference]

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
