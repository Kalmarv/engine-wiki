---
title: "Skeletons and bone identity"
description: "Bone trees, name hashes, stored poses and root transforms."
games: ["riders-republic"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "primase worlds/anvil (skeleton.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/skeleton.rs
---

Skeleton (`0x24AECB7C`) stores a bone hierarchy and local/global transforms. All 1,138 resources consume exactly with the checked grammar; their 54,925 bones are keyed by CRC-32 name hashes, matching [Animation mappings](/engines/anvil/animation/clips/). :proven[grammar coverage] :observed[name mapping]

| Ordered body portion | Representation | Confidence |
|---|---|---|
| Managed prefix / enum | One byte, then u32 `9C78EB24` (0–8 and 14 occur) | :observed |
| Bones | Count, tagged Bone objects `0x95741049` | :observed |
| Root | Null `03` or `02 + u64` back-reference | :observed |
| Own position / rotation | Two f32 vec4 values | :observed |
| BodyPartMapping | Ten-byte resource reference | :observed |
| Pose groups | Counted SkeletonPoseGroup → SkeletonPose → SkeletonPoseBone objects | :observed |
| IKData | Null or inline object `0x9A33101E`, no stored fields | :observed |
| LookAt / ReflexSystem | Resource reference, then null ReflexSystem in all 1,138 | :observed |
| Remaining fields | Two f32, optional byte-buffer Reflex3SkeletonConstraints, counted u32 array | :observed |

A Bone starts with its name hash, parent pointer, a second bone pointer and null BoneDisplayData in all checked bones. Global position, global rotation, local position and local rotation are vec4; rotations are unit xyzw quaternions, positions have fourth lane zero. The second pointer fits self on a chain and the opposite side on paired bones, but its full meaning is inferred. :observed :inferred

The rest includes a byte, enum, empty BoneModifier array, u32 array, constant word seven, float one and a packed word whose low 16 bits are array position and high 16 bits descendant count in checked data. SkeletonPoseBone has a custom 16-byte body not described by its registry list. :observed

SkeletonComponent (`0x71FDA747`) has four base bytes, main Skeleton reference, counted addon Skeleton references, ExpressionPack reference, counted 20-byte AnimTrackDefinition objects and embedded WindForce. Length is `56 + 10 × addons + 20 × track definitions` in the checked profile, including 56-byte NPC and 116-byte bike examples. :observed

For the checked rider pose, the Skeleton's own transform replaces the root bone's local transform rather than multiplying an additional offset onto it. The runtime pose snapshot distinguishes replacement from composition; mesh inverse bind matrices correspond to stored global transforms. :observed

:::open[How do all skeleton modifiers and pose records execute?]
Stored bones and bind transforms do not establish IK, Reflex constraint execution, the complete 16-byte pose-bone packing or all addon assembly rules. :unknown
:::
