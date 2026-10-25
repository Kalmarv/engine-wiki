---
title: Layers, cameras and culling masks
description: "How Unity decides what a camera draws: the layer of each GameObject, a camera's culling mask and render target, the layer names each game defines, and SkateBIRD's minimap markers."
games: [skatebird, sledding, peak]
sources:
  - title: Unity manual, Layers and Camera culling mask
    url: https://docs.unity3d.com/Manual/Layers.html
    note: a mask is a 32-bit field with one bit per layer
implementations:
  - name: primase worlds/unity (passes/drawn.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/unity/src/passes/drawn.rs
---

Every GameObject has a **layer** from 0 to 31. A **Camera** (class 20) stores a **culling mask**, a 32-bit field with bit *n*
set when the camera draws layer *n*, and a target texture: none for a camera that draws to the screen, a RenderTexture for a
camera whose picture is used elsewhere (a minimap, a mirror). :sourced[Unity manual] Whether a renderer is seen by the
player depends on whether any screen camera draws its layer. :sourced[Unity manual]

## Layer names

Layer names are in the `TagManager` of `globalgamemanagers`; layers 0 to 7 are built in (Default, TransparentFX,
Ignore Raycast, Water at 4, UI at 5). The layers each game names:

| Game | Named layers | Confidence |
|---|---|---|
| SkateBIRD | 8 Wheels, 9 Board, 10 Ragdoll, 11 Ghost, 12 Ghost Listener, 13 Clothing Collisions, 14 See-thru Skatables, 15 Skate Zones, 16 Board-Interactive Deco, 17 Room Boundary Mesh, **28 Mini Map Markers**, 29 Collectibles, 30 Collectible Toucher, 31 Post-Processing | :proven{games="skatebird"} |
| Sledding Game | 6 Default_HardCameraBlock, 7 Sled, 8 Player, 9 Ragdoll, 10 Terrain, 11 UI World, 12 PlayerHitCollider, 13 OnlyCollideWithPlayer, 14 Interactable, 15 DefaultNoCollideWithRagdoll, 16 AudioCutoffBlocker, 17 BarrierForPlayer, 19 BillboardCamera | :proven{games="sledding"} |
| PEAK 3.0.0 | 8 DontCollideWithCharacter, 9 OnlyCollideWithCharacter, 10 Character, 11 GhostCharacter, 12 MIrror, 14 Hazard, 15 Rope, 20 Terrain, 21 Map, 22 InvisWall, 25 Lighting, 27 MirrorHidden, 29 Vines, 30 SDF, 31 Post | :proven{games="peak"} |

## Culling masks in SkateBIRD

SkateBIRD's `Minimap/Mission Marker` shader draws big spheres on ordinary MeshRenderers on layer 28 (`Mini Map Markers`).
They are invisible in the game: the player's `Main Camera` has the culling mask `0xe003ff17`, which excludes layer 28, and
only the `Objective Map Camera (for escape menu)`, which renders to a texture, has `0xf003ff17`, which adds layer 28.
:proven{games="skatebird"}

`0xe003ff17` draws layers 0, 1, 2, 4, 8 to 17 and 29 to 31; `0xf003ff17` adds 28. :proven{games="skatebird"} Every scene of the
install has this arrangement or a simpler one: scenes 0 to 7, 12 and 13 have exactly the `Main Camera` (mask `0xe003ff17`, depth
−1, near 0.1, far 5000) and the `Objective Map Camera (for escape menu)` (mask `0xf003ff17`, depth 0, near 0.3, far 1000, target
texture object 1283 of the same file); the credits scene (6) adds a `Credits Camera` with mask `0xffffffff` at depth 10 that draws
every layer to the screen; the loading scene (8) has one `Main Camera` with every layer; scenes 9 to 11 have no camera.
:proven{games="skatebird"} The main camera's field of view is 75° (40° in the title scene) and the map camera's varies by scene
(60° to 92.2°). :proven{games="skatebird"}

A renderer on a layer that no screen camera's mask draws is not seen by the player. :sourced[Unity manual]

## Other uses of layers

Layers also decide physics: the physics settings store a layer collision matrix, and a collider's layer decides what it
touches. Sledding Game and PEAK name layers for that purpose (`OnlyCollideWithPlayer`, `DontCollideWithCharacter`). :inferred

SkateBIRD's `Post-Processing` layer (31) holds the post-processing volumes, see
[post-processing](/engines/unity/effects/post-processing/). :inferred{games="skatebird"}

:::open[The layer collision matrices]
The matrices of the three games are not decoded here, so which layers collide with which is not described.
:::
