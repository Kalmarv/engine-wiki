---
title: Render skeletons, animation rigs and ECLP
description: Character bone identities, DOF mapping and the stored keyed animation codec.
games: [skate]
implementations:
  - name: primase worlds/reskate (game/rig.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/reskate/src/game/rig.rs
  - name: primase worlds/reskate (game/eclipse.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/reskate/src/game/eclipse.rs
---

skate.'s character render skeleton and animation rig are related but separate assets. The render
`characters/maincharacters/common/animbase/animbase_default_renderskeleton` has 386 bones. Its SkeletonAsset
stores BoneNames, Hierarchy, LocalPose, ModelPose, InverseModelPose, bone hashes and server/gameplay maps.
MeshSet section palettes address these bones by index. :observed

The animation `Animation/Dingo/AnimBase_Default_Rig` lives in `Win32/globals.toc`, bundle
`win32/configurations/gameconfigurations/delmargameconfiguration`. Its AntSkeletonAsset,
`animation/dingo/animbase_default_skeleton`, has 395 joints; joint records contain a name offset into the
NameTable, a NameHash (32-bit FNV-1 of the name), parent, child, sibling and type, but no rest transforms.
:observed Only this skeleton has at least 386 joints; the other AntSkeletonAssets have 27, 16, 14, 137 (four of
them), 184 and 246. The `medium`, `large` and `small_default_skeleton` documents have 176 names each. :observed

In the EBX string table of `animbase_default_skeleton`, which holds 434 names starting at `Reference`, names 101–107
are Neck, Neck1, Head, RM_Head, PS_Head_Sec (twice) and Face; a CAS hat's vertices are weighted to indices
102–107. :observed That the string-table order is the bone order is inferred from that fit. :inferred

The rig's DefaultPoseAsset supplies values keyed by DOF id. DofSetIdIndices partitions DofIds into runs associated
with DofSetAsset documents; their LayoutData maps run order to names such as `<joint>.q`, `.t` and `.s`.
The stored default has 2,721 DOFs and 2,644 values: 968 Vector3Values, 486 Vector4Values and 1,190
FloatValues, each keyed by a `u32` DOF id. The DOF id is not an FNV-1 or FNV-1a hash of the joint name, plain or
lowercased, with any of about 60 tested suffixes and 11 prefixes. A separate PoseBindPoseAsset,
`animbase_joint_poseset_0_bind`, holds 159 joints (108–272), not the head chain 101–107. :observed

Composing those default transforms matches the render skeleton's ModelPose within `1.2e-6` for every shared
bone except AITrajectory, whose difference is about one. All 386 render bones occur in the animation skeleton
with matching parent names. This is a comparison of those two assets, not every skeleton in the game.
:observed

## Clips and channels

A ClipControllerAsset supplies FPS, looping and its EclipseAnimationAsset. The latter names EndFrame,
ChannelToDofAsset and a resource of type `0x4088bf7e`, codec tag `0x45434c50` (`ECLP`). Channels are ordered
rotations, vectors, scalars; ChannelToDofIds maps that order to the rig's DOFs. :observed

Three clips from `dingolevel_mpr` decode with the track counts and frame bounds stated by their EBX assets.
Comparison against a decoder based on the executable's encoder agrees exactly on key frames and within
`1e-6` on values. That decoder comparison shares the same format interpretation and is not independent proof
of runtime interpolation. :observed

```layout
title: ECLP header
size: 64
note: Little-endian; record-table offsets are from the resource start, key-data offsets from the encoded stream.
fields:
  - {at: 0, size: 4, type: u32, name: rotation record count, level: observed}
  - {at: 4, size: 4, type: u32, name: rotation record table offset, level: observed}
  - {at: 8, size: 4, type: u32, name: unknown, level: unknown, note: Zero in measured resources.}
  - {at: 12, size: 4, type: u32, name: vector record count, level: observed}
  - {at: 16, size: 4, type: u32, name: vector record table offset, level: observed}
  - {at: 20, size: 4, type: u32, name: unknown, level: unknown, note: Zero in measured resources.}
  - {at: 24, size: 4, type: u32, name: scalar record count, level: observed}
  - {at: 28, size: 4, type: u32, name: scalar record table offset, level: observed}
  - {at: 32, size: 4, type: u32, name: unknown, level: unknown, note: Zero in measured resources.}
  - {at: 36, size: 4, type: u32, name: quaternion format, level: observed}
  - {at: 40, size: 4, type: u32, name: vector format, level: observed}
  - {at: 44, size: 4, type: u32, name: scalar format, level: observed}
  - {at: 48, size: 4, type: u32, name: time format, level: observed}
  - {at: 52, size: 4, type: u32, name: unknown, level: unknown, note: "Zero in all 4,469 ECLP resources of the measured base data."}
  - {at: 56, size: 4, type: u32, name: encoded stream size, level: observed}
  - {at: 60, size: 4, type: u32, name: encoded stream offset, level: observed}
```

Rotation records are twelve bytes: count, time offset and value offset. Count one stores a packed64 quaternion
inline at record `+4`, at frame zero. Otherwise time format zero uses bytes and format one uses big-endian
`u16` frames. :observed

Quaternion format one is a 48-bit smallest-three encoding, format two packed64 and format three four
little-endian floats. For packed64, the low two bits select the omitted nonnegative component; two 21-bit
components and one 20-bit component are offset about zero and scaled by `6.743499056938163e-7` and
`1.3487003798218211e-6`. The missing component is `sqrt(max(0,1-sum(kept²)))`. :observed

Vector records are 48 bytes, with count/times/values offsets, three-float `lo` at `+16` and extent at `+32`.
Scalar records are twenty bytes with scalar lo/extent. Their count-two form stores two frames directly in the
offset words and the two values directly in lo/extent. Otherwise formats zero/one/two store byte, big-endian
`u16` or little-endian float values; quantized values decode as `lo + q/max * extent`. :observed

:::open[How does the game interpolate between stored keys?]
The stored tracks are decoded; linear translation and quaternion slerp are not established as the executable's
evaluation policy. A Studio export comparison also differs on Hips translation and seven IK effectors, so it
cannot settle the full runtime pose. :unknown
:::
