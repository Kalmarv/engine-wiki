---
title: Havok cloth data
description: The hcl cloth classes characters and armour parts ship, their member lists, particle index widths and the values of their enums.
sources:
  - title: HKX2Library
    url: https://git.kroner.dev/HKX2/HKX2Library
    note: names of the hclClothData platform bits and the local-range shape types, from a 2014.2 class dump
implementations:
  - name: havok-formats cloth reader
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/cloth.rs
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

## Values

| Field | Values | Confidence |
|---|---|---|
| `hclClothData.targetPlatform` | 2 in all 650 Sekiro and 4,357 Elden Ring cloth datas | :proven[every named character and parts binder] |
| same, counted over every distinct tagfile of the install | 2 in all 610 Sekiro (149 tagfiles) and 2,692 Elden Ring (814 tagfiles) cloth datas | :proven[every tagfile of both installs] |
| Platform value 2 | x64 | :sourced[HKX2Library] |
| `hclLocalRangeConstraintSet.shapeType` (32-bit) | Sekiro: 0 in all 656 sets; Elden Ring: 0 in 4,527 sets, 1 in 117 | :proven[every named character and parts binder] |
| Shape type 0, 1 | Sphere, cylinder | :sourced[HKX2Library] |
