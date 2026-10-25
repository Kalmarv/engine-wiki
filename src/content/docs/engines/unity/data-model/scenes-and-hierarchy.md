---
title: Scenes and the object hierarchy
description: "What a scene file holds: GameObjects, Transforms, components, static batching, LOD groups, inactive state, UI transforms, and the frame Unity uses."
games: [skatebird, sledding, peak, big-walk]
sources:
  - title: Unity manual, GameObjects and components
    url: https://docs.unity3d.com/Manual/GameObjects.html
    note: the hierarchy and component model
implementations:
  - name: primase worlds/unity (read/scene.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/unity/src/read/scene.rs
  - name: primase worlds/unity (read/level.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/unity/src/read/level.rs
---

A scene (`levelN`) is a flat list of objects: **GameObjects** (class 1), each with a **Transform** (class 4, or a
RectTransform, 224, for UI) and a list of **components** (renderers, colliders, lights, cameras, scripts). Parents and
children are links between Transforms; the file has no nesting. :sourced[Unity manual] A scene file stores its own
GameObjects and components, not the meshes, materials and textures its renderers use: those are in the
`sharedassets` files, referenced by [file id and path id](/engines/unity/archives/serialized-files/#references-between-objects).
:observed{games="skatebird"}

## Contents of real scenes

| Scene | Objects | GameObject | Transform | MonoBehaviour | MeshRenderer | MeshCollider | BoxCollider | LODGroup | Confidence |
|---|---|---|---|---|---|---|---|---|---|
| SkateBIRD `level1` (bedroom 1) | 44,305 | 16,189 | 14,871 | 4,847 | 1,351 | 1,669 | 515 | 0 | :observed{games="skatebird"} |
| SkateBIRD `level12` (playground) | 86,103 | 32,277 | 31,256 | 8,186 | 2,655 | 4,133 | 1,338 | 0 | :observed{games="skatebird"} |
| Sledding Game `level1` (the mountain) | 151,088 | 45,145 | 42,057 | 12,168 | 18,069 | 694 | 4,151 | 2,507 | :observed{games="sledding"} |
| PEAK 3.0.0 `level4` | 623,157 | 184,286 | 181,348 | 47,571 | 71,447 | 15,658 | 7,098 | 12,596 | :observed{games="peak"} |
| PEAK 3.0.0 `level1` | 52,515 | 14,457 | 14,025 | 2,820 | 8,178 | 1,670 | fewer than 60 | 1,947 | :observed{games="peak"} |

Each count is the number of objects of that class in the one file. SkateBIRD's scenes hold no terrain, no `LODGroup` and no
navmesh; Sledding Game's holds terrains and tree prototypes
([terrain](/engines/unity/terrain/terrain-data/)). :observed{games="skatebird sledding"}

SkateBIRD's scene roots show how a game scene is built: every playable scene is self-contained, with the player bird, the
skateboard, cameras, post-processing, a dialogue manager and the mission set in it, so a scene is a whole level and not
geometry alone. The playground (`level12`) has 18 roots including `Level Elements`, `Missions - Playground`,
`Non-Static Level Elements`, `Reset Positions`, `Player Birb`, `Cinemachine SkateCam 2.0`, `Skateboard For Skating` and
`Main Camera`. :observed{games="skatebird"}

## The frame

Unity's frame is **left-handed, +Y up, +Z forward, in metres**. A yaw of 0 faces +Z. A renderer in a right-handed frame
with counter-clockwise front faces (glTF) is reached by negating one axis (z): positions, normals and tangent directions
negate z, triangle winding reverses, and a tangent's `w` flips because the mirror flips the bitangent
`cross(normal, tangent.xyz) * w`. :observed[every vertex and triangle of a sample of small real meshes, against an
independent decoder]{games="sledding"}

A Transform stores a local position, rotation (a quaternion `x, y, z, w`) and scale; the world matrix is the product of
the chain from the root, `Matrix4x4.TRS(position, rotation, scale)` at each step. :sourced[Unity manual] A RectTransform's
stored local `x` and `y` can be stale: they come from its anchors: the parent rectangle's minimum plus its size times the
anchors interpolated at the pivot, plus the anchored position. :observed{games="sledding"}

## Prefabs

A prefab instance placed in a scene is not recorded as such in a build: the scene file holds its GameObjects, Transforms and
components like any others, and no `PrefabInstance` object (class 1001) occurs in the SkateBIRD playground or its `sharedassets0`,
Sledding Game's mountain or `sharedassets1`, PEAK's island scene or Big Walk's world scene. :observed A prefab that something
refers to by object, such as a terrain tree prototype, is a hierarchy of objects in an assets file with a root GameObject.
:observed{games="sledding"} The scene therefore does not say which prefab an object came from; repeated structure shows as repeated
names (`Generated_Rail_Node*`, `Combined Mesh (root: scene) N`). :inferred

## Inactive state

A GameObject can be stored inactive and a component stored disabled. Unity draws or uses an object only when none of the
GameObjects on its Transform chain is inactive and the component is enabled; a file stores both flags as data, so a
reader sees every renderer, collider and light whatever its state. :observed

A **LODGroup** lists, per level, the renderers it switches between; which level draws is Unity's choice by screen size, not
a scene fact. A disabled LODGroup switches nothing off: its levels draw together. :observed{games="sledding peak"}
In Sledding Game, a LODGroup whose levels are one renderer each and whose coarser levels sit at the first level's world matrix
(up to rounding of a few f32 steps) is a mesh with a chain of coarser forms. :observed{games="sledding"}

## Static batching

A **static-batched** renderer draws a slice of a combined mesh whose vertices are already in world space; the renderer's
matrix is the identity, and the slice is a first submesh and a count. SkateBIRD's level meshes are such combined meshes
(`Combined Mesh (root: scene) N`) and ProBuilder output (`pb_Mesh<number>`). :observed{games="skatebird"}

## Materials and submeshes

Material *i* of a renderer draws submesh *i*. Submeshes beyond the renderer's materials are not drawn, and materials
beyond the submeshes draw the last submesh again as an extra pass. :sourced[Unity manual]

## Shadows

A renderer's shadow casting mode is off, on, two-sided or shadows-only; `m_ReceiveShadows` is a separate flag. :observed
Whether a draw receives shadows decides one of its shader keywords, see [draw keywords](/engines/unity/shaders/draw-keywords/).
:observed

## Build settings and scene identity

The scene list in `globalgamemanagers` gives each scene's path in the editor project and its build index; `levelN` is scene
*N*. :proven{games="skatebird"} A scene's root names can be stale copies from the scene it was cloned from, so identity comes
from the list. :observed{games="skatebird"}
