---
title: Havok cloth data
description: "The hcl cloth classes characters and armour parts ship, their member lists, particle index widths and enum values, how their transform sets and display buffers bind to the model, and how the running games step them."
sources:
  - title: HKLib
    url: https://github.com/The12thAvenger/HKLib
    note: the 2018.1 names of the platform and shape type enumerations
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
installs; the object's class says what it is: `hclSphereShape` is shape type 0, `hclPlaneShape` 1, `hclCapsuleShape` 2,
`hclTaperedCapsuleShape` 3 and `hclConvexGeometryShape` 9 in HKLib's `hclShapeType`. :sourced[HKLib]
:proven[every distinct tagfile with cloth of both installs]
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
| Platform value 2 | x64 (`HCL_PLATFORM_X64`, in the 2018.1 registry as well) | :sourced[HKX2Library, HKLib] |
| `hclLocalRangeConstraintSet.shapeType` (32-bit) | Sekiro: 0 in all 656 sets; Elden Ring: 0 in 4,527 sets, 1 in 117 | :proven[every named character and parts binder] |
| Shape type 0, 1 | Sphere, cylinder | :sourced[HKX2Library] |

## Transform sets and their skeleton

Every `hclTransformSetDefinition` of a cloth tagfile has the name and the `numTransforms` of the one `hkaSkeleton` the same
file holds (in its root `hkaAnimationContainer`): 610 of 610 sets in the 149 Sekiro cloth files, and 2,692 of 2,692 in the 745
Elden Ring cloth files that hold a skeleton (the other 69 hold no transform set). :proven[every distinct tagfile with cloth of
both installs] Transform *i* of the set is bone *i* of that skeleton. :observed[one capture of each game, below]

That skeleton is the cloth's own, not the character's animation skeleton. For the Wolf's muffler and coat (`bd_m_9040`) it has
146 bones; 104 of their 146 parents differ from those of the player's Havok skeleton in `c0000.anibnd`, and the part's model
has 173 bones in another order, but every one of the 146 names is a bone of that model. :observed{games="sekiro"} A transform
is therefore matched to the model's bone by name. :inferred

## Display buffers

A cloth's display buffers (`hclBufferDefinition` of type 4) are meshes of the model beside it, vertex for vertex. A buffer is
the [FLVER](/engines/fromsoft/geometry/flver/) mesh whose default node is named as the buffer, whose vertex count is the
buffer's `numVertices` and whose first face set has `numTriangles` triangles. That picks exactly one mesh for all 586 distinct
display buffers of Sekiro and 2,313 of Elden Ring's 2,325; the other 12 are pairs of meshes with the same name and counts. Where
several meshes share a name, their order is the order of the buffers' `subType` (474 of 474 such groups in Sekiro, 1,931 of 1,931
in Elden Ring). :proven[every cloth tagfile of both installs against its binder's model] Two characters bind one mesh from two
cloth datas (`c7201` :only[sekiro], `c4570` :only[elden-ring]). :proven

The vertices are in the mesh's order: in every object-space skin operator that writes a display buffer (729 operators and 336,495
vertices in Sekiro, 3,512 and about 1.2 million in Elden Ring), the bind position of display vertex *i* is the mesh's vertex *i*
to within 4.9e-5 of the mesh's size, the precision of the packed vectors the operator stores.
:proven[every such operator of both installs] The meshes the buffers bind also hold a second position, normal and tangent
(semantic index 1), equal to the first in the files. :observed[342 Sekiro and 1,320 Elden Ring meshes]

The triangles wind the other way: normals computed as the vertex-frame operator does, over the model's positions and first face set
with the cloth's stored triangle flips applied, agree with the model's normals at 95% of the vertices, and at almost none without
the flips. :observed So the flips turn the model's winding into the operator's. :inferred

Where a cloth state redirects a buffer, it is always a display buffer shadowed by an `hclShadowBufferDefinition` (type 7) of the
same vertex count, and neither definition states triangle indices: 2,886 redirections in Sekiro and 15,984 in Elden Ring.
Operators name the display buffer, never the shadow (an operator's used-buffer entry gives itself as its shadow); only the
state's own used buffers map it to the shadow. 4,876 and 26,090 operator uses name a redirected buffer, 501 and 3,131 of them an
`hclUpdateAllVertexFramesOperator` (484 and 2,533 with `trianglesRead` set). :observed[a census of both installs' cloth tagfiles]
So the triangles of a shadowed display buffer can only be those of the drawn mesh, which the game supplies at run time, and the
vertex frames are computed with the named buffer's triangles. :inferred

In the first state of 249 of Sekiro's 586 display buffers (397 of Elden Ring's 2,325) the operators write only part of the
buffer, the rest passing through the input conversion. :proven[every cloth tagfile of both installs] That fits the game handing
the cloth the mesh it has already skinned. :inferred

## At run time

The objects as the running games lay them out, read from the memory of Sekiro 1.06 (the player's seven cloth instances of
`bd_m_9040` over 300 steps, one save in one area) and of Elden Ring 1.17.2 (the player's rear rope, 299 steps):
:observed

| Object | Member | Sekiro | Elden Ring |
|---|---|---|---|
| `hclClothData` | `name`, `simClothDatas`, `bufferDefinitions`, `transformSetDefinitions`, `operators` | `+0x18`, `+0x20`, `+0x30`, `+0x40`, `+0x50` | |
| `hclClothInstance` | its cloth data | `+0x18` | |
| | sim cloth instances, buffers, transform sets | `+0x30`, `+0x40`, `+0x50` | sim cloth instances `+0x40`, transform set `+0x30` |
| transform set (no run-time type information) | the matrices (`hkArray`), their inverse transposes | `+0x18`, `+0x28` | the matrices `+0x18` |
| `hclSimClothInstance` | positions, previous positions, normals | `+0x20`, `+0x30`, `+0x40` | the same |
| | last substep length, damping | `+0x50`, `+0x54` | the same |
| | actions, collidables (`hkArray`) | `+0xE8`, `+0x178` | the same |
| `hclCollidable` | transform, linear velocity, angular velocity | `+0x20`, `+0x60`, `+0x70` | |
| buffer (one per buffer definition, in order, in the instance's array at `+0x40`) | world-from-mesh and mesh-from-world matrices | `+0x90`, `+0xD0` | |

The game sets each buffer's two matrices. The display buffer and its shadow buffer are in the character's space: world-from-mesh
is the character's root, at its feet, and mesh-from-world is a stored inverse, not one recomputed from it. The simulation,
previous-position and scratch buffers hold the identity. :observed{games="sekiro"} For the muffler's neck cloth
(`BD_M_9040_muffler_neck`), which skins into its display buffer, the pinned particles moved through these matrices match the game
bit for bit in all 299 steps; through the identity they differ by 1 to 5 ulp in nearly every step. :observed[one capture]{games="sekiro"}
The identity on the scratch buffers reproduces the game bit for bit on the scarf, the `c1010` hakama and kusazuri, the `c7200`
sleeve and Elden Ring's rear rope. :observed

A bone deformer (`hclSimpleMeshBoneDeformOperator`) normalises the bones it writes with the processor's approximate reciprocal
square root and no refinement, so their axes are not unit to 1e-4: over the `c1010` hakama and kusazuri and the `c7200` sleeve
(Sekiro) and the rear rope (Elden Ring), the game's driven bones are up to 4.9e-4 from unit squared length and orthogonal within
4.3e-7. :observed The driven bones sit 0.015 to 0.164 m from the cloth's particles, while the bones of the set that the instance
does not fill keep stale values hundreds of metres away. :observed

The w lane of every live particle position reads NaN (`0xFFC00000`). :observed{games="sekiro"} All seven of the player's cloth
instances share one transform set object. :observed{games="sekiro"}

The transform set holds world-space bone matrices: with the muffler's 146 entries, 110 of 138 bones sit at their reference
length from their parent in the cloth skeleton (5 to 7 with shuffled parents), and in the rear rope's capture 123 of 124 (4 to 8
shuffled). :observed The game fills only the entries some cloth reads. In Sekiro 25 of the 146 are rewritten every step, 23 of
them moving (the pelvis, spine, collar, neck, head, clavicle, shoulder and upper-arm bones), while the other 121 keep
model-space values that never change. :observed{games="sekiro"} Elden Ring's cloth skeletons include the bones the cloth drives
(`[cloth]BD_M_1360_BD_RearRope_001` and on), which the game moves. :observed{games="elden-ring"}

No file holds a cloth action, but both games add one each step. The game attaches one action object to each of the player's
sim cloth instances, of a class without run-time type information whose first virtual function is `hclAction`'s.
:observed{games="sekiro"} Elden Ring calls one action per cloth step (299 calls in the rear rope's 299 single-substep steps).
:observed{games="elden-ring"} Sekiro's action forwards to an object of the game's own, whose update walks a registry of world
objects, sums vectors from them and writes forces, so the force depends on the state of the world.
:inferred[read from the decrypted code]{games="sekiro"}

## Sekiro

The cloth steps at about 30 Hz: notifications come about 33.5 ms apart while frames take 16.7 to 40.7 ms. The muffler's simulate
config has 2 substeps, and its last substep length is the frame step divided by 2. :observed{games="sekiro"}

Each operator's `notifyPreExecution` (slot 3 of its virtual table) is called through the operator's virtual table, but `execute`
(slot 4) is not: with the tables replaced it is never called though the cloth simulates, and the executable has no direct call
to it. :observed{games="sekiro"} Elden Ring calls the simulate operator's `execute` through its virtual table.
:observed{games="elden-ring"}

These stages reproduce the recording on all 299 steps: :observed{games="sekiro"}

- the notify step: the substep length, the previous positions rescaled when the step length changes, and the damping
  `powf(1 - globalDampingPerSecond, dt)`;
- the object-space skin followed by the move-particles operator: the 28 pinned particles land bit for bit.

The collidables are driven to their bones without normalising the quaternions, then stepped forward each substep: that gives the
recorded collidables exactly on 198 of the 299 steps, and normalising them on 14. :observed{games="sekiro"} Without the game's
action forces the simulate step differs from the recording by about 1 cm. :observed{games="sekiro"}

The simulation step follows these rules: :inferred[read from the decrypted code of Sekiro 1.06]{games="sekiro"}

- The constraint stiffness model is the sim cloth instance's (`hclSimClothInstance` `+0x140`, an index into the table of
  `hclConstraintStiffnessDispatcher`: models 0 and 1 give 1.0; model 2 is adaptive, `powf(n * slowMotion * worldStepping, -1.725)`
  with the last substep's local range and ramped transitions). The instance's constructor sets model 1 and no cloth code changes
  it, so `adaptConstraintStiffness` does not soften the constraint sets; it only feeds their keep-velocity flag, which is set when
  `(model != 1 || adapt) && (subSteps != 1 || slowMotion != 1 || worldStepping != 1)`.
- The substep is `(1 / subSteps) * timeStep`, the reciprocal rounded first, with `timeStep = dt / slowMotion`.
- The sim cloth instance lists its constraint sets' instance data by set index at `+0x158`, in 16-byte entries.
- A volume constraint's instance data (`hclVolumeConstraintMxInstanceData`: a frame at `+0x20`, eigenvectors at `+0x60`)
  warm-starts its Jacobi eigen-solve from the last step's eigenvectors; a batch's target is `((c0 * x + t) + c1 * y) + c2 * z`.
- A transition constraint's instance data (`hclTransitionConstraintInstanceData`) holds its state at `+0x28` (0 simulated, 2
  blending to the animation, 3 blending to the simulation), its blend time at `+0x2C` (advanced before the notify) and the
  particles' start distances at `+0x18`. The blend multiplies by reciprocals rather than dividing: the bound is
  `((1 - (1 / period) * t) * start) * (1 / s)` towards the animation and `(((1 / period) * t) * toSimMaxDistance) * (1 / s)`
  towards the simulation, `s` being a further divisor of the code.

With these rules a reimplementation reproduces the recorded steps bit for bit: both of the scarf's cloths (the muffler and the
neck) in 299 of 299 steps, and both cloths of an NPC in 16 of 16. :observed[the recorded steps]{games="sekiro"}

The code's arithmetic fixes the order of every sum (Havok's SSE2 build; the executable has no `dpps` or `haddps`):
:inferred[read from the decrypted code of Sekiro 1.06]{games="sekiro"}

- A four-lane dot product adds the squares (or products) to themselves with the lanes swapped in pairs (`zwxy`), then adds that
  to itself with neighbours swapped (`yxwz`): `(x + z) + (y + w)`. A three-lane one is `(x + y) + z`.
- Driving a collidable to its bone takes the real part of `goal * conj(current)`, the angle `2 * acos` of it (through an `asin`
  polynomial), the axis by `rsqrt` and one Newton step, the angular velocity `axis * angle / dt` and the linear velocity
  `(target - current) * (1 / dt)`.
- Each substep turns the rotation by a half-angle quaternion whose w is `((1 - 0.822948 u) - 0.130529 u^2) - (0.044408 u) u^2`,
  with `u = |ω dt / 2|^2 * 4 / pi^2`, multiplies the current rotation by it and normalises the result.
- A plane query (`hclPlaneShape`, `hclPointContactPlanesShape` and the per-particle landscape contact planes) sums
  `((x * px + y * py) + z * pz) + w`, four particles at a time; the landscape test then adds the particle's radius.

## Elden Ring

### Collidables added at run time

A sim cloth's particles can collide with more collidables than its file holds. Over 814 distinct cloth tagfiles (2,875 sim
cloths), 75 sim cloths have `staticCollisionMasks` bits at or past their `perInstanceCollidables` count, 34 of them with no
per-instance collidable at all: their particles collide with collidables the game adds. :observed[814 tagfiles]{games="elden-ring"}
`BD_RearRope` of `bd_m_1360` and `bd_m_1361` has no collidable and every particle's mask 0, while `bd_m_1365`'s rope has 2
collidables and the mask `0x3` on 14 of its 17 particles. :observed{games="elden-ring"}

The type table of every one of those files describes the collidable and shape classes alike: :observed[814 tagfiles]{games="elden-ring"}

```layout
title: hclCollidable (version 4)
size: 160
games: [elden-ring]
fields:
  - {at: 32, size: 64, type: hkTransform, name: transform, level: observed}
  - {at: 96, size: 16, type: hkVector4, name: linearVelocity, level: observed}
  - {at: 112, size: 16, type: hkVector4, name: angularVelocity, level: observed}
  - {at: 128, size: 8, type: u64, name: userData, level: observed}
  - {at: 136, size: 8, type: pointer, name: shape, level: observed}
  - {at: 144, size: 8, type: pointer, name: name, level: observed}
  - {at: 152, size: 4, type: f32, name: pinchDetectionRadius, level: observed}
  - {at: 156, size: 1, type: u8, name: pinchDetectionPriority, level: observed}
  - {at: 157, size: 1, type: bool, name: pinchDetectionEnabled, level: observed}
  - {at: 158, size: 1, type: bool, name: virtualCollisionPointCollisionEnabled, level: observed}
  - {at: 159, size: 1, type: bool, name: enabled, level: observed}
```

`hclShape` is 32 bytes with its type (`int`) at `+0x18`; `hclCapsuleShape` is `0x60` bytes, `hclTaperedCapsuleShape` (version 2)
`0xB0`, `hclSphereShape` and `hclPlaneShape` `0x30` and `hclConvexGeometryShape` `0x120`. :observed[814 tagfiles]{games="elden-ring"}
The running game lays its collidables out the same way: the two that the player's rope instance lists in its collidable array
(`+0x178` of the sim cloth instance) read a pinch radius of 0.01 and enabled 1 at `+0x98`, and their shapes lie `0xB0` apart.
:observed[one recording]{games="elden-ring"}

The rope's two run-time collidables are the stowed spear's. The equipped weapon model `WP_A_0902` (a spear, weapon type 25)
ships `WP_A_0902_collidable.hkx`: an `hclClothContainer` with two `hclCollidable`s, `WP_Colidable_L_001` and `_002`, each with
an `hclTaperedCapsuleShape`, and no cloth data. The game's two shapes equal the file's within 1 to 12 ulp in every member (it
rebuilds them), and their flags and pinch radii are bit for bit the file's. :observed[one recording]{games="elden-ring"} The same
file (one hash) ships with about 35 spear, halberd and great-spear models (`09xx`, `10xx`, `1551`), every one hung by
`WepAbsorpPosParam` hang type 3 at the dummies 2037 and 2038. :observed{games="elden-ring"}

The game places both as one rigid body on the character's `Spine1`: each capsule is `Spine1 × A × T`, `T` its transform in the
file, with one `A` for both (to 5.7e−7) and `Spine1` the bone of the step before. `A`'s rotation is `c0000.flver`'s dummy 40
(`Model_Dmy_Storage(Spine)`, attached to `Spine1`) turned 180° about its z, to 1e−4; its origin is 5.4 cm from dummy 38, and the
rule for the origin is not established. :observed[one recording of 639 steps]{games="elden-ring"}

Between a cloth step and the next notify, each collidable's translation becomes its translation after the notify plus its
linear velocity times the step's `f32` time step, bit for bit in all 639 steps for both; its rotation changes every step, also
where the recorded angular velocity is 0, so it does not come from integrating that velocity. The velocities read before a
notify are already those of the next frame, and the notify itself leaves them unchanged (638 of 638). :observed[one recording of a
standing jump]{games="elden-ring"} With these collidables a replay of the particle step gives the game's positions bit for bit in
604 of the 639 steps; 24 of the 35 that differ fall while the rope touches the capsules, and the other 11 are small.
:observed[one recording]{games="elden-ring"}

The capsules act on the rope although every one of its particles has the mask 0. Their shapes run from (0, 0.75, 0) to
(0, −0.45, 0) in their own frame, with radii 0.07 to 0.35 and 0.21 to 0.70 (the small end at y 0.75), and a capture stores their
transforms row-major with the translation in the last row. Measured as the exact distance to each tapered hull (two end spheres and
the cone tangent to them), the game's particles after a step are never inside a capsule, 0 of 14,990 particle-steps in a 1,499-step
recording after a jump and none in the 639-step standing jump, and lie on a hull to ±2 µm in 41 and 49 particle-steps. A replay of
each step from the game's state without collision, otherwise bit for bit, puts exactly those particles inside, up to 4.6 cm, and
no other. :observed[two recordings]{games="elden-ring"} Against the capsules where they were before the step, 10 of the game's
particles would be inside, so the collision uses the collidables after they are moved. :observed[one recording]{games="elden-ring"}
How the game makes these run-time collidables apply to particles whose mask is 0 is not read from the code. :unknown{games="elden-ring"}

:::open[Where is the spear's collidable origin?]
The rotation of the spear's collidables is the storage dummy 40's turned about z, but their origin is 5.4 cm from dummy 38 and
matches neither dummy.
:::

### Wind

The cloth action pushes the cloth with the wind. On the player's rear rope at Stormveil it adds a horizontal force of about 5 to
10 N to each particle (mass 0.625) every step, towards about (3, 0, 4) in the world. Without it a simulation of the standing
character differs from the game by about 11 cm; with the forces the action recorded, a free run from the game's state, time steps
and bones gives the game's positions bit for bit for 47 steps, and within 0.05 mm while the character stands.
:observed[one recording]{games="elden-ring"}

The forces come from the effect system's force fields ([WindForce](/engines/fromsoft/effects/fxr-actions/#windforce)), each the
effect of a [wind region](/engines/fromsoft/world/msb/#wind-regions-type-6) of the map: at Stormveil the region
`_808003_1001` of `m10_00_00_00`, whose effect `f000808003` runs a `WindForce`. :observed[one recording]{games="elden-ring"}
The action finds them through handles, not by walking the fields: :observed[read from the code of 1.17.3]{games="elden-ring"}

1. It looks the sim cloth up in a registry of cloth owners (a vector of lists, each a vector of members whose object holds sims at
   `+0x40`, their count at `+0x48`); the first member that holds the sim gives its handle (`+0x68`, −1 none), and without one the
   action does nothing.
2. It queries the force fields for the sim's bounding box with that handle, and reads back a list of field handles, walked in order.
3. Each field handle (only its low 32 bits index) gives a registry entry whose state (`+0x40`) is active when 2, and whose
   `+0x48` is the `GXVfxDynamicForceField`; the force's weight and the rest are read through that field's virtual functions.

### The skin operator

`hclObjectSpaceSkinPNOperator` skins the pinned particles with this arithmetic, which equals Havok Cloth's: each bone's composite
column is `(B.c0 × x + B.c1 × y) + B.c2 × z` and its translation `((B.c0 × x + B.c3) + B.c1 × y) + B.c2 × z`; a weight byte is
multiplied by `0x3B808081` (1/255); a packed local position is `f32(word << 16) × f32bits(word3 << 16)`; the blend adds `M × w` in
bone order; and a point is `((c0 × x + c3) + c1 × y) + c2 × z`. Its transform set is the instance's `+0x30` indexed by the
operator's `+0x6C`. :observed[read from the code of 1.17.3]{games="elden-ring"} On the rear rope over 1,499 steps such a skin
gives the game's pinned particles bit for bit except particles 8 and 9 in 6 steps, by 1 ulp in one lane; each of these is fixed by
changing bone 132 by 1 ulp, a value the transform set never holds at any point of the frame. :observed[one recording]{games="elden-ring"}
The buffer's two matrices are exactly the identity, and the transform set's `+0x28` holds a second array of 136 matrices that do not
change. :observed[one recording]{games="elden-ring"}

:::open[Where does the skin's last ulp come from?]
In 6 of 1,499 steps two pinned particles of the rear rope differ by 1 ulp from a skin of the recorded bones, as if one bone were
1 ulp off; no recorded state holds that value.
:::
