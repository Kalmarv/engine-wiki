---
title: Havok cloth data
description: The hcl cloth classes characters and armour parts ship, their member lists, particle index widths and the values of their enums.
sources:
  - title: HKX2Library
    url: https://git.kroner.dev/HKX2/HKX2Library
    note: names of the hclClothData platform bits and the local-range shape types, from a 2014.2 class dump
implementations:
  - name: havok-formats cloth reader
    url: https://github.com/Kalmarv/havok-formats/tree/main/src/cloth
---

Cloth is Havok Cloth (`hcl`) data in tagfiles beside a model: a character's `cNNNN_c.hkx` in its `chrbnd`, and the
cloth of armour and other parts in `partsbnd` binders. An `hclClothData` lists its simulated cloths
(`hclSimClothData`), each with particles, fixed particles, rest poses and constraint sets, besides buffer, transform
set and operator definitions. :observed

Over every named character and parts binder, cloth sits in 131 Sekiro tagfiles (95 character, 36 parts; SDK
`20160200`) and 1,563 Elden Ring tagfiles (178 character, 1,385 parts; SDK `20180100`). They hold 650 and 4,357
`hclClothData` and 678 and 4,672 `hclSimClothData`. :proven[every named character and parts binder]

## Classes

The two games store the same members. `hclSimClothData` is version 13 in Sekiro and 14 in Elden Ring with the same 29
members: `name`, `simulationInfo`, `particleDatas`, `fixedParticles`, `doNormals`, `simOpIds`, `simClothPoses`,
`staticConstraintSets`, `antiPinchConstraintSets`, `collidableTransformMap`, `perInstanceCollidables`,
`maxParticleRadius`, `staticCollisionMasks`, `actions`, `totalMass`, `transferMotionData`, `transferMotionEnabled`,
`landscapeCollisionEnabled`, `landscapeCollisionData`, `numLandscapeCollidableParticles`, `triangleIndices`,
`triangleFlips`, `pinchDetectionEnabled`, `perParticlePinchDetectionEnabledFlags`, `collidablePinchingDatas`,
`minPinchedParticleIndex`, `maxPinchedParticleIndex`, `maxCollisionPairs`, `virtualCollisionPointsData`.
:proven[every named character and parts binder]

Every particle index is a `hkUint16`: `fixedParticles`, `triangleIndices`, `particleA`/`particleB` of the standard,
stretch, bend and compressible link sets, `particleA` to `particleD` of the bend-stiffness set, and `particleIndex`
and `referenceVertex` of the local-range and transition sets. Each class has one layout in both games. Every stored
particle index is below its cloth's particle count: 54,566 fixed particles and 698,241 triangle indices in Sekiro,
133,819 and 2,645,094 in Elden Ring, and every link. A cloth has at most 6,460 particles in Sekiro and 3,813 in Elden
Ring. :proven[every named character and parts binder]

## What the cloth data uses

Walking every archive entry of each install (named or not, nested binders and DCX envelopes opened) finds cloth in
149 distinct Sekiro tagfiles (from 167 binder members: 95 `chrbnd`, 36 `objbnd`, 36 `partsbnd`) and 814 distinct
Elden Ring tagfiles (from 1,605: 182 `chrbnd`, 1,418 `partsbnd`, 5 `geombnd`). None needs an external compendium.
Four Sekiro and 73 Elden Ring of them hold only the authoring graph (`hclClothSetupContainer` and its setup objects),
so the runtime data is in 145 and 741. :proven[every archive entry of both installs]

The objects of every class those files hold, counted by walking every `hcl` object through the generic value view, and
the same counts from a typed reader that refuses none of the files:
:proven[every distinct tagfile with cloth of both installs]

| Class | Sekiro | Elden Ring |
|---|---|---|
| `hclClothData` | 610 | 2,692 |
| `hclSimClothData`, `hclSimulateOperator`, `hclSimClothPose` | 638 each | 2,875 each |
| `hclClothState` | 3,094 | 13,659 |
| `hclStandardLinkConstraintSet` | 565 | 2,096 |
| `hclStretchLinkConstraintSet` | 634 | 2,807 |
| `hclBendLinkConstraintSet` | 203 | 268 |
| `hclBendStiffnessConstraintSet` | 262 | 2,340 |
| `hclCompressibleLinkConstraintSet` | 78 | 733 |
| `hclLocalRangeConstraintSet` | 592 | 2,836 |
| `hclTransitionConstraintSet` | 638 | 2,856 |
| `hclVolumeConstraintMx` | 24 | 326 |
| `hclMoveParticlesOperator` | 639 | 2,906 |
| `hclObjectSpaceSkin{P,PN,PNT}Operator` | 28, 443, 629 | 28, 2,457, 3,177 |
| `hclBoneSpaceSkin{P,PN,PNT}Operator` | 7, 137, 90 | 7, 351, 297 |
| `hclObjectSpaceMeshMeshDeform{P,PN,PNT}Operator` | 52, 180, 24 | 673, 1,157, 29 |
| `hclBoneSpaceMeshMeshDeform{P,PN,PNT}Operator` | 13, 234, 15 | 51, 103, 2 |
| `hclSimpleMeshBoneDeformOperator` | 197 | 827 |
| `hclMeshBoneDeformOperator` | 0 | 41 |
| `hclCopyVerticesOperator` | 944 | 3,265 |
| `hclGatherAllVerticesOperator`, `hclGatherSomeVerticesOperator` | 515, 0 | 2,944, 36 |
| `hclInputConvertOperator`, `hclOutputConvertOperator` | 579, 965 | 1,487, 3,597 |
| `hclUpdateAllVertexFramesOperator`, `hclUpdateSomeVertexFramesOperator` | 387, 54 | 1,744, 534 |
| `hclCollidable` | 268 | 3,460 |
| `hclCapsuleShape`, `hclTaperedCapsuleShape`, `hclSphereShape` | 117, 148, 3 | 1,745, 1,648, 3 |
| `hclConvexGeometryShape`, `hclPlaneShape` | 0, 0 | 63, 1 |

No file has an anti-pinch, bone-planes or plain volume constraint set, a link set of the batched `Mx` kind, a blend
operator, an action of any class (`actions` is empty on every cloth data and sim cloth), or a state transition
(`stateTransitions` is empty everywhere). :proven[every distinct tagfile with cloth of both installs]

Settings, over every simulate operator and sim cloth: :proven[every distinct tagfile with cloth of both installs]

| Setting | Sekiro | Elden Ring |
|---|---|---|
| Configs per simulate operator | 1 in all 638 | 1 in all 2,875 |
| `numberOfSolveIterations` | 1 in all | 1 in all |
| `subSteps` | 1 (516), 2 (111), 3 (10), 4 (1) | 1 (2,682), 2 (168), 3 (25) |
| `constraintExecution` set (ordered solve; `-1` entries) | 618 of 638 | 2,860 of 2,875 |
| `adaptConstraintStiffness` | 213 | 1,046 |
| `useAllInstanceCollidables`, `instanceCollidablesUsed` | 1 in all, empty in all | 1 in all, empty in all |
| `transferMotionEnabled`, `pinchDetectionEnabled` | 0 in all | 0 in all |
| `landscapeCollisionEnabled` | 13 | 80 |
| Virtual collision points (`numVCPoints` above 0) | 6 sim cloths, 810 points | 84 sim cloths, 25,065 points |
| `doNormals` | 619 | 2,874 |
| `globalDampingPerSecond` | 0.001 to 1 | 0 to 1.5 |
| `hclLocalRangeConstraintSet.stiffness` | 1 in all 592 | 1 in 2,834, 0.5 in 2 |
| `hclTransitionConstraintSet` `toAnimPeriod`, `toSimPeriod` | 0.1 in all | 0.1 in all |
| `collidableTransformMap.transformSetIndex` | 0 (174), -1 (464) | 0 (1,522), -1 (1,353) |
| Transform set definitions per cloth data | 1 in all | 1 in all |

Most cloth datas have five states (606 of 610 in Sekiro, 2,632 of 2,692 in Elden Ring).
:proven[every distinct tagfile with cloth of both installs] Their names follow one pattern: `#00#Empty` or
`#00#Stop`, `#01#Default` (or `#01#State`), `_Skin`, and `_preAtoS_` and `_curAtoS_` followed by the state they lead
to. :observed[state names over both installs]

The `type` member that `hclConstraintSet`, `hclOperator` and `hclShape` declare is 0 in every stored object of both
installs; the object's class says what it is. :proven[every distinct tagfile with cloth of both installs]
`hclConstraintSet` stores a `constraintId` (an `hkHandle`) :only[elden-ring], in all 14,262 Elden Ring constraint sets.
:proven[every distinct tagfile with cloth of both installs]

Besides the particle indices above, every index one part of a cloth data stores into another is in range, in every
distinct tagfile with cloth: state and simulate operator indices into `operators`, operator and state indices into
`bufferDefinitions` and `transformSetDefinitions`, `simClothIndex`, `constraintExecution` entries into the sim cloth's
constraint sets, move particles pairs (the particle in its sim cloth, the vertex in its reference buffer), local-range
and transition `referenceVertex` (below their reference buffer's `numVertices`), and a vertex copy's range (inside both
buffers). A sim cloth's `triangleIndices` hold whole triangles, and a collidable transform map has one bone and one
offset for each collidable. :proven[every distinct tagfile with cloth of both installs]

## Values

| Field | Values | Confidence |
|---|---|---|
| `hclClothData.targetPlatform` | 2 in all 650 Sekiro and 4,357 Elden Ring cloth datas | :proven[every named character and parts binder] |
| same, counted over every distinct tagfile of the install | 2 in all 610 Sekiro (149 tagfiles) and 2,692 Elden Ring (814 tagfiles) cloth datas | :proven[every tagfile of both installs] |
| Platform value 2 | x64 | :sourced[HKX2Library] |
| `hclLocalRangeConstraintSet.shapeType` (32-bit) | Sekiro: 0 in all 656 sets; Elden Ring: 0 in 4,527 sets, 1 in 117 | :proven[every named character and parts binder] |
| Shape type 0, 1 | Sphere, cylinder | :sourced[HKX2Library] |
