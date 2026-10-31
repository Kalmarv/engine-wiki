---
title: Entity geometry
description: "Bone bind poses in entity geometry, what they turn, and the vanilla geometries whose published re-export lost them."
sources:
  - title: Mojang bedrock-samples
    url: https://github.com/Mojang/bedrock-samples
    note: "vanilla resource pack models, v1.26.60.5 and v1.21.0.3"
---

Entity geometry (`minecraft:geometry`) is a list of bones, each with a pivot, an optional rest `rotation`, cubes and a
parent. :observed[the vanilla geometries of bedrock-samples v1.26.60.5] A bone may also carry `bind_pose_rotation`, a
rotation of the bone's own cubes about its pivot that sits beneath the bone's animation. :inferred

## Bind poses

A bone's bind pose turns its own cubes only; its child bones do not inherit it. :inferred The vanilla cat shows this:
its second tail segment `tail2` is a child of `tail1` and has the same 90° bind pose about X, which continues the first
segment's direction only if each turns its own cubes (inherited, the second segment would be turned 180°).
:observed[geometry.cat of bedrock-samples v1.21.0.3] The animations assume the bind pose is in place and is not part of
the animated rotation: the fox's sitting animation turns its body by -60° from its 90° bind pose to sit at 30°, and
`"-this"` in the fox's and parrot's setup animations cancels only the animated rotation. :inferred

## Bind poses missing from the v1.26.60.5 samples

The geometry files of bedrock-samples v1.26.60.5 re-export several legacy geometries (formats 1.8 and 1.10) as format
1.21.0 without their bones' bind poses, while v1.21.0.3 still has them; on these bones the cubes (origins, sizes, UV)
are unchanged between the two releases. :observed[every bone of the vanilla geometries of both releases]

| Geometry | Bone | `bind_pose_rotation` in v1.21.0.3 | Confidence |
|---|---|---|---|
| `geometry.cat` | `body` | 90, 0, 0 | :observed |
| `geometry.cat` | `tail1` | 90, 0, 0 | :observed |
| `geometry.cat` | `tail2` | 90, 0, 0 | :observed |
| `geometry.fox` | `body` | 90, 0, 0 | :observed |
| `geometry.fox` | `tail` | 80, 0, 0 | :observed |
| `geometry.parrot` | `body` | 28.287, 0, 0 | :observed |
| `geometry.parrot` | `feather` | -12.685, 0, 0 | :observed |
| `geometry.villager_v2` | `brim` | -90, 0, 0 | :observed |

Drawn from the v1.26.60.5 files, these bodies stand upright under animations written for the bind pose. :inferred

:::open[Does the game's own install lack these bind poses too?]
Only the published samples were compared. Whether the 1.26 game files carry the bind poses (and the samples' export
dropped them) has not been checked on an install.
:::
