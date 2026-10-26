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

Skeleton (`0x24AECB7C`) stores a bone hierarchy and local/global transforms. All 1,138 Skeleton resources present in the six-archive inventory consume exactly with the checked grammar, with no refusals; their 54,925 bones are keyed by CRC-32 name hashes, matching [Animation mappings](/engines/anvil/animation/clips/). :proven[grammar coverage] :observed[name mapping]

| Ordered body portion | Representation | Confidence |
|---|---|---|
| Managed prefix / enum | One byte, then u32 `9C78EB24` (0–8 and 14 occur) | :proven[all 1,138 Skeletons] |
| Bones | Count, tagged Bone objects `0x95741049` | :proven[all 1,138 Skeletons] |
| Root | Null `03` or `02 + u64` back-reference | :proven[all 1,138 Skeletons] |
| Own position / rotation | Two f32 vec4 values | :proven[all 1,138 Skeletons] |
| BodyPartMapping | Ten-byte resource reference | :proven[all 1,138 Skeletons] |
| Pose groups | Counted SkeletonPoseGroup → SkeletonPose → SkeletonPoseBone objects | :proven[all 1,138 Skeletons] |
| IKData | Null or inline object `0x9A33101E`, no stored fields | :proven[all 1,138 Skeletons] |
| LookAt / ReflexSystem | Resource reference, then null ReflexSystem in all 1,138 | :proven[all 1,138 Skeletons] |
| Remaining fields | Two f32, optional byte-buffer Reflex3SkeletonConstraints, counted u32 array | :proven[all 1,138 Skeletons] |

A Bone starts with its name hash, parent pointer, a second bone pointer and null BoneDisplayData in all checked bones. Global position, global rotation, local position and local rotation are vec4; rotations are unit xyzw quaternions, positions have fourth lane zero. The second pointer fits self on a chain and the opposite side on paired bones, but its full meaning is inferred. :observed :inferred

The rest includes a byte, enum, empty BoneModifier array, u32 array, constant word seven, float one and a packed word whose low 16 bits are array position and high 16 bits descendant count in checked data. SkeletonPoseBone has a custom 16-byte body not described by its registry list. :observed

SkeletonComponent (`0x71FDA747`) has four base bytes, main Skeleton reference, counted addon Skeleton references (mode byte `04`), ExpressionPack reference (null as `03` and nine zero bytes), counted 20-byte AnimTrackDefinition objects (`u64 + type 0xA8037D53 + 8 bytes`) and embedded WindForce (`u64 + type 0xE7F9A244 + 12 bytes`). The addon Skeletons are the `MAD_CHR_SkelAddon_*` rigs a character's parts add (head, upper and lower body, outfit, hair); they repeat the main skeleton's upper chain, and bones join by name hash. 146 SkeletonComponents are stored. Length is `56 + 10 × addons + 20 × track definitions` in the checked profile, including 56-byte NPC and 116-byte bike examples. :observed

For the checked rider pose, the Skeleton's own transform replaces the root bone's local transform rather than multiplying an additional offset onto it. The runtime pose snapshot distinguishes replacement from composition; mesh inverse bind matrices correspond to stored global transforms. :observed

The engine's runtime pose array holds 48-byte records (position vec4, rotation vec4, scale). For `MAD_CHR_Skel_U` its root is at (0, 0, 0.964) with a +90° turn about z, the Skeleton's own transform, and the other bones hold their stored locals. For `MAD_CHR_Skel_Bike_U` the stored root local turns −90° and the own transform +90°, and the runtime root turns +90°: composing the two would give identity, so the own transform replaces the root local. In 1,033 of 1,120 Skeletons the stored root local already equals the own transform. :observed[runtime pose snapshot of two skeletons; stored census]

Every Skeleton has exactly one parentless bone, bone 0, the root. Stored bone globals exclude the own transform. Rider clips are authored with it applied: of 1,238 rider-root clip tracks, the median first-key z is 0.901, and 69% lie within 0.2 of 0.964. A rider faces +x in bone space (toes +x, left +y), which is the game's +y forward after the quarter turn. :observed

:::open[How do all skeleton modifiers and pose records execute?]
Stored bones and bind transforms do not establish IK, Reflex constraint execution, the complete 16-byte pose-bone packing or all addon assembly rules. :unknown
:::

The full inventory has 1,138 Skeleton entries, all in the four DataPC/USNAT base and patch archives; both WhiteRoom archives contain none. The exact-end check therefore covers every installed Skeleton despite not opening WhiteRoom patch. :proven
