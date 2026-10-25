---
title: Colliders and physics materials
description: "Collider components and their shapes under PhysX, physic materials with their friction and combine modes per game, and the project physics settings each game stores."
games: [skatebird, sledding, peak]
sources:
  - title: Unity scripting reference, Collider, PhysicMaterial and PhysicMaterialCombine
    url: https://docs.unity3d.com/ScriptReference/PhysicMaterial.html
    note: shape fields, material fields, combine modes
implementations:
  - name: primase worlds/unity (passes/lower_collision.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/unity/src/passes/lower_collision.rs
---

Collision in a Unity scene is made of **colliders**, components on GameObjects: `BoxCollider` (65), `SphereCollider` (135),
`CapsuleCollider` (136), `MeshCollider` (64), and `TerrainCollider`. Each stores its shape in the GameObject's local space,
whether it is a trigger, and an optional physic material. :sourced[Unity scripting reference] Collision geometry in
SkateBIRD is real geometry: its playground has 4,133 MeshColliders and 1,338 BoxColliders, bedroom 1 has 1,669 and 515.
:observed{games="skatebird"}

## Which colliders collide

A collider is collision geometry when it is not a trigger and is not moved by physics: it has no Rigidbody, or its Rigidbody is
kinematic. A trigger detects overlaps and does not collide. The GameObject must be active and the collider enabled
([inactive state](/engines/unity/data-model/scenes-and-hierarchy/#inactive-state)). :sourced[Unity scripting reference]

## Shapes under PhysX

| Shape | How Unity applies the transform | Confidence |
|---|---|---|
| box | the box `size` and `center` in the collider's space, under the whole world matrix (rotation and non-uniform scale apply exactly) | :sourced[Unity scripting reference] |
| sphere | the radius scales by the largest absolute axis scale of the world matrix | :sourced[Unity scripting reference] |
| capsule | the height scales by its axis' scale (`direction`: 0 x, 1 y, 2 z; the height includes the caps) and the radius by the largest of the other two | :sourced[Unity scripting reference] |
| convex mesh | the convex hull of the mesh's vertices; PhysX cooks at most 255 polygons per hull, so a larger hull is simplified | :sourced[Unity scripting reference] |
| concave mesh | the mesh's triangles, all submeshes, with each submesh's base vertex applied | :sourced[Unity scripting reference] |
| terrain | the heightfield of the terrain's TerrainData; a collider may name its own TerrainData whose heights differ from the drawn ones | :sourced[Unity scripting reference] |

A sphere or capsule under a non-uniform scale is not an ellipsoid: PhysX keeps the shape round and applies the rule above.
:sourced[Unity scripting reference]

SkateBIRD builds many of its colliders with a convex-decomposition tool (the `Technie.PhysicsCreator` types in
`Assembly-CSharp.dll`): an object's collision is a set of small convex pieces, so one piece's extent (such as 0.5 m) is not
the extent of the object it belongs to. :inferred{games="skatebird"}

## Physic materials

A **PhysicMaterial** (class 134) stores a dynamic friction, a static friction, a bounciness and two combine modes (0 Average,
1 Minimum, 2 Multiply, 3 Maximum). The field names depend on the Unity version, see [type trees](/engines/unity/data-model/type-trees/#field-names-differ-by-version).
:sourced[Unity scripting reference] Most colliders have none. :observed{games="skatebird"}

| Game | Material | Dynamic / static friction | Bounciness | Friction / bounce combine | Confidence |
|---|---|---|---|---|---|
| SkateBIRD | SkateBase Frictionless | 0 / 0 | 0 | Minimum / Minimum | :proven{games="skatebird"} |
| SkateBIRD | SkateBase InAir | 0.3 / 0.3 | 0 | Average / Average | :proven{games="skatebird"} |
| SkateBIRD | SkateBase Tumbling | 0.4 / 0.4 | 0 | Average / Average | :proven{games="skatebird"} |
| SkateBIRD | SkateWheels | 0.001 / 0.05 | 0.06 | Minimum / Minimum | :proven{games="skatebird"} |
| SkateBIRD | Bouncy Birb | 0.6 / 0.6 | 1.0 | Average / Average | :proven{games="skatebird"} |
| SkateBIRD | Hard Grippy Floor (`sharedassets5`) | 1.0 / 1.0 | 0 | Average / Average | :proven{games="skatebird"} |
| Sledding | Snow | 0.1 / 0.1 | 0 | Average / Average | :proven{games="sledding"} |
| Sledding | Ice Lake | 0.01 / 0.01 | 0.1 | Minimum / Average | :proven{games="sledding"} |
| Sledding | Slippery | 0.015 / 0.015 | 0.1 | Minimum / Average | :proven{games="sledding"} |
| Sledding | Maximum Friction, Snowman Ball | 1000 / 1000 | 0.5, 0.1 | Maximum / Average | :proven{games="sledding"} |
| Sledding | Bouncy | 0.6 / 0.6 | 1.0 | Average / Average | :proven{games="sledding"} |
| Sledding | Cornhold Beanbag, Ragdoll | 1.0 / 1.0 | 0 | Average / Average | :proven{games="sledding"} |
| Sledding | Curling Stone | 0.6 / 0.6 | 0 | Average / Average | :proven{games="sledding"} |
| PEAK | Slippery, Player | 0 / 0 | 0 | Multiply / Multiply | :observed{games="peak"} |
| PEAK | StickySnow | 1.0 / 1.0 | 0 | Minimum / Multiply | :observed{games="peak"} |
| PEAK | Backpack | 1.0 / 1.0 | 0 | Maximum / Multiply | :observed{games="peak"} |
| PEAK | Basketball, BasketballHoop | 1.0 / 1.0 | 0.7, 0.1 | Maximum / Maximum, Minimum | :observed{games="peak"} |
| PEAK | TumbleWeed | 0.6 / 0.6 | 0.7 | Average / Average | :observed{games="peak"} |

Each table row covers every PhysicMaterial of the install's serialized files (the PEAK rows cover its loose files, not its
level bundles). A "Proven" row is the whole of that install: SkateBIRD has six physic materials, Sledding Game nine.
:proven{games="skatebird sledding"}

## Project physics settings

The `PhysicsManager` in `globalgamemanagers` stores the project's settings; the `TimeManager` the simulation step.

| Setting | SkateBIRD | Sledding Game | PEAK 3.0.0 | Confidence |
|---|---|---|---|---|
| gravity (m/s²) | (0, −9.81, 0) | (0, −9.81, 0) | (0, **−19.62**, 0) | :proven{games="skatebird sledding peak"} |
| solver iterations | **64** | 6 | 10 | :proven{games="skatebird sledding peak"} |
| bounce threshold | 0.5 | 2 | 2 | :proven{games="skatebird sledding peak"} |
| default material | none | none | none | :proven{games="skatebird sledding peak"} |
| fixed timestep | 1/60 s (0.016667) | 0.02 s (a count over a rate of 141,120,000) | 0.01666 s (count 2,351,059 over 141,120,000) | :proven{games="skatebird sledding peak"} |
| maximum allowed timestep | 0.3333 s | 0.3333 s | 0.1667 s | :proven{games="skatebird sledding peak"} |

In the two Unity 6 games the fixed timestep is stored as a rational (`m_Count` over `m_Rate.m_Numerator`); SkateBIRD's
2019.4 build stores a float. :proven{games="skatebird sledding peak"}
