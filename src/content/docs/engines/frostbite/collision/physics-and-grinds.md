---
title: Collision, physics pools and grinds
description: Stock collision streaming, Studio collision grouping, surface resources and grind geometry.
games: [skate]
sources:
  - title: ReSkate physics capacity code
    url: https://github.com/Dingo-Shenanigans/ReSkate/tree/main/Engine/Game/Build/20260929
---

Stock collision streams with the world; render readiness does not imply that ground collision has arrived.
StaticModelGroups can share one PhysicsAsset per group, while render-only members are legal. :observed

Studio 20261012 generally places collision in resident level-root layers such as `default_1`. Below roughly
4,003 geometries it writes per-object `.physics` assets. Above that threshold it merges collision into 100-metre
areas named `collision_area_<x>_<z>`; when merged geometry still exceeds the budget it can stream collision
with WorldPartition cells. A measured 6.4-km cube-grid example streams up to 27,648 geometry slots in game.
:observed

The 4,003 threshold is a compiler budget, distinct from the stock geometry pool of 5,000 and ReSkate's raised
40,000-geometry pool. Studio warns when geometries across active WorldPartition ancestry exceed its native
resident budget. :observed

Studio's Blender add-on turns curves flagged `sk8_grind_curve` into invisible, open-ended, eight-sided collision
prisms. These are collision geometry rather than runtime grind splines. :observed

The executable contains capacity assertions for twenty PhysicsWorld pools. Disabled assertion configuration
does not make overflowing the underlying pool safe: report sites can still execute a null write. Per-level
capacity selection appears related to FBPhysicsWorldData and the default-client-world settings, but that
selection path is not exercised by the available evidence. :observed :inferred

:::open[What is the complete cooked PhysicsResource layout?]
The observed grouping and streaming behaviour do not establish a byte-complete parser for stock cooked physics
shapes, contact materials or grind-edge analysis. :unknown
:::
