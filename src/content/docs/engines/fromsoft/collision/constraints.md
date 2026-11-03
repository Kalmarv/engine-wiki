---
title: Constraint data and ragdoll atoms
description: "The hkp constraint data objects of ragdolls, hinges, ball and socket, fixed and wheel joints in Sekiro and Elden Ring tagfiles: the atoms each class holds, their type words and the values they take."
games: [sekiro, elden-ring]
implementations:
  - name: havok-formats constraint reader
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/constraint.rs
  - name: havok-formats cloth, ragdoll and constraint descriptions
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/cloth/mod.rs
---

A joint between two bodies is an `hknpConstraintCinfo` (the two body indices, a name, the constraint's group) that points to
a *constraint data* object. The data holds the joint's rules as *atoms*: small classes, each starting with a 16-bit `type`
word that names the rule (a pair of local frames, a limit, a motor, a friction). Characters carry their ragdolls this way
(`chr/c####.chrbnd`), and so do parts, objects and assets that move on joints.

Every `hknpConstraintCinfo` of the character, parts, object, asset and map collision binders of both installs points to
one of the classes below. :proven[every constraint of both installs]

| Class | Sekiro | Elden Ring | Elden Ring's `DLC` pair |
|---|---|---|---|
| `hkpRagdollConstraintData` | 2,031 | 5,739 | 3,146 |
| `hkpLimitedHingeConstraintData` | 439 | 1,260 | 478 |
| `hkpHingeConstraintData` | 26 | 1 | 0 |
| `hkpBallAndSocketConstraintData` | 0 | 681 | 101 |
| `hkpFixedConstraintData` | 0 | 36 | 14 |
| `hkpWheelConstraintData` | 0 | 48 | 0 |
| `hknpBreakableConstraintData` | 3 | 169 | 110 |

The counts are objects, each tagfile counted as often as a binder repeats it; the Elden Ring column is the base game's
archive pairs (`Data1` and `Data3` hold constraints), the last the expansion's `DLC` pair. The base game's counts are given
alike by a reader that decodes the constraint classes and by a walk over the tagfiles' type tables that shares no code with
it; the `DLC` pair's are the walk's, and the class reader reads the same 11,783 Elden Ring objects in all. :proven[every constraint of both installs, the `DLC` pair included]
A breakable constraint wraps one of the others and adds a `threshold`: a ragdoll joint in all 3 Sekiro cases, in 152 of
the 169 Elden Ring ones and 93 of the 110 in the `DLC` pair, a limited hinge in 16 of each Elden Ring set and a ball and
socket joint in 1 of each. :proven[every constraint of both installs, the `DLC` pair included]

## Atoms

The members of the data's `atoms` object are the atoms, each named after its role. The `type` word of an atom is the same
in every object of a class, and the same in both games for the atoms they share. :proven[every constraint of both installs]

| Atom class | `type` | Members |
|---|---|---|
| `hkpSetLocalTransformsConstraintAtom` | 2 | `transformA`, `transformB` (an `hkTransform` each: 16 floats) |
| `hkpSetLocalTranslationsConstraintAtom` | 3 | `translationA`, `translationB` (a vector each) |
| `hkpSetLocalRotationsConstraintAtom` | 4 | `rotationA`, `rotationB` (an `hkRotation` each: 12 floats) |
| `hkpBallSocketConstraintAtom` | 5 | `solvingMethod`, `bodiesToNotify`, `velocityStabilizationFactor` (an `hkUFloat8`), `enableLinearImpulseLimit`, `breachImpulse`, `inertiaStabilizationFactor` |
| `hkpLinConstraintAtom` | 7 | `axisIndex` |
| `hkpLinSoftConstraintAtom` | 8 | `axisIndex`, `tau`, `damping` |
| `hkpLinLimitConstraintAtom` | 9 | `axisIndex`, `min`, `max` |
| `hkp2dAngConstraintAtom` | 12 | `freeRotationAxis` |
| `hkpAngLimitConstraintAtom` | 14 | `isEnabled`, `limitAxis`, `cosineAxis`, `minAngle`, `maxAngle`, `angularLimitsTauFactor`, `angularLimitsDampFactor` |
| `hkpTwistLimitConstraintAtom` | 15 | `isEnabled`, `twistAxis`, `refAxis`, `minAngle`, `maxAngle`, `angularLimitsTauFactor`, `angularLimitsDampFactor` |
| `hkpConeLimitConstraintAtom` | 16 | `isEnabled`, `twistAxisInA`, `refAxisInB`, `angleMeasurementMode`, `memOffsetToAngleOffset`, `minAngle`, `maxAngle`, `angularLimitsTauFactor`, `angularLimitsDampFactor` |
| `hkpAngFrictionConstraintAtom` | 17 | `isEnabled`, `firstFrictionAxis`, `numFrictionAxes`, `maxFrictionTorque` |
| `hkpAngMotorConstraintAtom` | 18 | `isEnabled`, `motorAxis`, `targetAngle`, `motor` (a pointer), two scratch offsets |
| `hkpRagdollMotorConstraintAtom` | 19 | `isEnabled`, `target_bRca` (an `hkMatrix3`: 12 floats), `motors` (three pointers), two scratch offsets |
| `hkpSetupStabilizationAtom` | 23 | `enabled`, `maxLinImpulse`, `maxAngImpulse`, `maxAngle` |
| `hkp3dAngConstraintAtom` | 24 | none |

:proven[every constraint of both installs]

Each class stores its atoms in a fixed order, under fixed names:

| Class | Atoms (member name, `type`) |
|---|---|
| `hkpRagdollConstraintData` | `transforms` 2, `setupStabilization` 23, `ragdollMotors` 19, `angFriction` 17, `twistLimit` 15, `coneLimit` 16, `planesLimit` 16, `ballSocket` 5 |
| `hkpLimitedHingeConstraintData` | `transforms` 2, `setupStabilization` 23, `angMotor` 18, `angFriction` 17, `angLimit` 14, `2dAng` 12, `ballSocket` 5 |
| `hkpHingeConstraintData` | `transforms` 2, `setupStabilization` 23, `2dAng` 12, `ballSocket` 5 |
| `hkpBallAndSocketConstraintData` | `pivots` 3, `setupStabilization` 23, `ballSocket` 5 |
| `hkpFixedConstraintData` | `transforms` 2, `setupStabilization` 23, `ballSocket` 5, `ang` 24 |
| `hkpWheelConstraintData` | `suspensionBase` 2, `lin0Limit` 9, `lin0Soft` 8, `lin1` 7, `lin2` 7, `steeringBase` 4, `2dAng` 12; beside the atoms `initialAxleInB` and `initialSteeringAxisInB` (vectors) |
| `hknpBreakableConstraintData` | no atoms: `constraintData` (the wrapped object) and `threshold` |

:proven[every constraint of both installs]

The Havok 7.1 ragdoll data of [Tony Hawk's SHRED](/engines/rme/collision/havok-packfiles/#systems-and-constraints) holds the
same ragdoll atoms without `setupStabilization`: the types 2, 19, 17, 15, 16, 16 and 5. :observed{games="sekiro elden-ring"}

## Values

The transforms: an `hkTransform` is three rotation columns of four floats (x, y, z and a padding lane) and a translation
of four. The rotation is orthonormal (the largest error of a column's length or of two columns' dot product is
1.2 × 10⁻⁶) and right-handed in every stored transform but one. The padding lanes are not initialised: they are 0 in a minority of the
transforms and arbitrary in the others, and the translation's padding lane likewise. :proven[every constraint of both installs]
The one exception is in the `DLC` pair: of its 7,494 transforms, the `transformB` of the ragdoll joint at index 12 of item 23
of `c5320.hkx` (in `chr/c5320.chrbnd.dcx`) holds a quiet NaN (`0xFFC00000`) in all twelve lanes of its rotation, padding
included; its translation is finite. :proven[every constraint of both installs, the `DLC` pair included]{games="elden-ring"}

The integer members are constant per class in both games, wrapped or not, and the `DLC` pair's take the same values:

- `isEnabled` is 1 for the friction, twist, cone, planes and angle limits and 0 for the two motor atoms.
- `setupStabilization.enabled` is 1 for every constraint that is not wrapped in a breakable one and 0 for every wrapped one.
- `ballSocket.velocityStabilizationFactor` is 48, `bodiesToNotify` and `enableLinearImpulseLimit` are 0, and
  `solvingMethod` is 0, but 1 in every wrapped constraint.
- The axes are fixed per slot: a ragdoll's `twistLimit` has `twistAxis` 0 and `refAxis` 1, its `coneLimit` has
  `twistAxisInA` 0, `refAxisInB` 0, `angleMeasurementMode` 0 and `memOffsetToAngleOffset` 160, its `planesLimit` has 0, 1, 1
  and 0, and its friction frees 3 axes from axis 0; a limited hinge's `angLimit` has `limitAxis` 0 and `cosineAxis` 1 and
  its friction 1 axis from axis 0.
- A wheel's `lin0Limit` and `lin0Soft` are on axis 0, `lin1` on 1 and `lin2` on 2.

:proven[every constraint of both installs]

Every `minAngle` is at most its `maxAngle` (twist, cone, planes and hinge limits), the 10,211 limits of the `DLC` pair
among them, and no float of any constraint is infinite. :proven[every constraint of both installs, the `DLC` pair included]
`setupStabilization` stores the largest finite floats and about 1.8 × 10¹⁹ for `maxAngle`. :proven[every constraint of both installs]
Only one constraint holds a float that is not a number, none in Sekiro or the base game's pairs: the `c5320` ragdoll joint
above, whose `transformB` rotation and whole `ragdollMotors.target_bRca` (all twelve lanes) are `0xFFC00000`; every other
float of it is finite. :proven[every constraint of both installs, the `DLC` pair included]

:::open[Does the game ever simulate the `c5320` joint with NaN frames?]
A ragdoll joint whose frame in body B and motor target are not numbers cannot be solved as stored. Whether `c5320`'s ragdoll
is ever made active (its character's ragdoll settings, or the engine replacing such a frame) is not established.
:::

The motors are `hkpPositionConstraintMotor` objects (`type`, `minForce`, `maxForce`, `tau`, `damping`,
`proportionalRecoveryVelocity`, `constantRecoveryVelocity`). A ragdoll's three motor pointers are all set in 1,961 of
Sekiro's 2,031 unwrapped ragdoll joints and 5,715 of Elden Ring's 5,739, and all null in the others and in every wrapped
joint; a limited hinge's pointer is set in 395 of Sekiro's 439 and in all 1,260 of Elden Ring's, and null in the
wrapped ones. :proven[every constraint of both installs]
