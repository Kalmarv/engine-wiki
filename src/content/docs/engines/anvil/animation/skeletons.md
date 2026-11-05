---
title: "Skeletons and bone identity"
description: "Bone trees, name hashes, stored poses and root transforms."
games: ["riders-republic", "shaun-white-skateboarding"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "anvil-formats (skeleton.rs)"
    url: https://github.com/Kalmarv/anvil-formats/blob/main/src/skeleton.rs
  - name: "anvil-formats (shaunwhite/skeleton.rs)"
    url: https://github.com/Kalmarv/anvil-formats/blob/main/src/shaunwhite/skeleton.rs
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

## Shaun White Skateboarding

:only[shaun-white-skateboarding]

Shaun White Skateboarding's Skeleton keeps the bone tree and the four bind transforms of each bone with 32-bit ids, and adds orientation constraints, pose groups, IK and centre-of-mass data and mirror pairs; it has no own transform, BodyPartMapping, LookAt or Reflex fields. Every Skeleton of the 33 data forges reads with the layout below to its exact end: 521 Skeletons holding 17,405 bones. :proven{games="shaun-white-skateboarding"}[every Skeleton of the install]

```layout
title: "Skeleton body"
size: "variable"
games: [shaun-white-skateboarding]
note: "Little-endian. n is the bone count. All 521 Skeletons of the install."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "managed", "value": "1", "level": "proven"}
  - {"at": 1, "size": 4, "type": "u32", "name": "id", "level": "proven"}
  - {"at": 5, "size": 4, "type": "u32", "name": "class", "value": "0x24AECB7C", "level": "proven"}
  - {"at": 9, "size": 4, "type": "u32", "name": "unknown", "level": "unknown", "note": "0 or 2"}
  - {"at": 13, "size": 4, "type": "u32", "name": "bone count n", "level": "proven"}
  - {"at": 17, "size": "variable", "type": "bones", "name": "bones", "level": "proven", "note": "n Bone records (below), each parent before its children"}
  - {"at": "variable", "size": 5, "type": "reference", "name": "root", "level": "proven", "note": "tag 2 and the first bone's id"}
  - {"at": "variable", "size": 4, "type": "u32", "name": "unknown", "level": "unknown"}
  - {"at": "variable", "size": "variable", "type": "objects", "name": "pose groups", "level": "proven", "note": "u32 count; each id, class 0xC8F8ABFF, u32 count of poses; a pose is id, class 0x209CF072, u32, u32 count of pose bones; a pose bone is id, class 0x071CEE50, bone name CRC, position f32 × 4, rotation f32 × 4"}
  - {"at": "variable", "size": "variable", "type": "pointer", "name": "IK data", "level": "proven", "note": "tag 3 none, or 0, id, class 0x9A33101E and a u32 count of bone name CRCs"}
  - {"at": "variable", "size": "variable", "type": "pointer", "name": "centre-of-mass data", "level": "proven", "note": "tag 3 none, or 0, id, class 0x9A67179A and two f32 × 4"}
  - {"at": "variable", "size": 4, "type": "u32", "name": "unknown", "level": "unknown"}
  - {"at": "variable", "size": "variable", "type": "object", "name": "mirror data", "level": "proven", "note": "id, class 0xE96B19A5, u32 count of pairs; a pair is id, class 0xE03CA1FD, two bone name CRCs and two bytes; the body ends here"}
```

```layout
title: "Bone record"
size: "variable"
games: [shaun-white-skateboarding]
note: "Little-endian. All 17,405 bones of the install."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "pointer tag", "value": "0", "level": "proven"}
  - {"at": 1, "size": 1, "type": "u8", "name": "managed", "value": "1", "level": "proven"}
  - {"at": 2, "size": 4, "type": "u32", "name": "id", "level": "proven"}
  - {"at": 6, "size": 4, "type": "u32", "name": "class", "value": "0x95741049", "level": "proven", "note": "Bone"}
  - {"at": 10, "size": 4, "type": "u32", "name": "name", "level": "observed", "note": "CRC-32 of the bone's name, the key Animation mappings use"}
  - {"at": 14, "size": "1 or 5", "type": "reference", "name": "parent", "level": "proven", "note": "tag 3 none (the root), or 2 and the id of a bone read before"}
  - {"at": "variable", "size": 73, "type": "object", "name": "BoneInitialTransforms", "level": "proven", "note": "tag 0, id, class 0x6350E5A6, then global position, global rotation, local position, local rotation, f32 × 4 each"}
  - {"at": "variable", "size": "variable", "type": "objects", "name": "orientation constraints", "level": "proven", "note": "u32 count; each tag 0, id, class 0x75116750, bone reference (itself), u8, u32 count of targets (tag 0, id, class 0xDF638110, bone reference, f32), u8 and a quaternion"}
  - {"at": "variable", "size": 1, "type": "u8", "name": "index", "level": "proven", "note": "the bone's position in the list"}
  - {"at": "variable", "size": 1, "type": "u8", "name": "bones below", "level": "proven", "note": "its descendant count"}
```

A position is x, y, z and 0, a rotation a unit quaternion x, y, z, w. On every one of the 16,884 bones that have a parent, the global transform is the parent's global composed with the bone's local transform (rotation `q_parent · q_local`, position `p_parent + q_parent · p_local`) to within 1e-3; a root's global equals its local. :proven{games="shaun-white-skateboarding"}[every bone of the install]

A skinned mesh's MeshBone matrices hold the inverse of the bind: their rotation equals the inverse of the bone's global bind rotation on 7,126 of 8,403 checked mesh bones, while their translations match on only 240, the others differing by a per-mesh scale mostly between 1.02 and 1.10. :observed{games="shaun-white-skateboarding"}[the meshes and skeletons loaded up to the second level]

The renderer skins with the MeshBone matrices. Its skinning vertex shaders hold a `g_Bones` array of 96 float4 registers from `c39`, three per palette entry: a bone's 3×4 matrix, the bone's pose times its MeshBone matrix in column form (the stored matrix is row-vector form, translation in its last row), with the world matrix in a separate `g_World`. A palette entry's bone is its draw range's palette index into the mesh's MeshBones. For a bone and its parent in the same draw, `IB_p · S_p⁻¹ · S_c · IB_c⁻¹` (`S` the registers, `IB` the MeshBone matrix in column form) is the child's local transform, and its translation is the Skeleton's stored local position to within 1e-3 on every one of the 85 parent-child pairs in the first frame each mesh is drawn. Over six frames, 214 of the 270 pairs are; the others are four bones of one mesh that its animation moves by 1.3 to 1.5 mm after its second frame. :observed{games="shaun-white-skateboarding"}[the bone constants of 40 skinned draws of six meshes (a train and five pigeons) traced at the draws, each draw's palette and mesh matched to stored data]
