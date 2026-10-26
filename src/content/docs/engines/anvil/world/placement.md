---
title: "Placement and instancing"
description: "Stored transforms, metres, local instance matrices and group relationships."
games: ["riders-republic", "shaun-white-skateboarding"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "primase worlds/anvil (placements.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/placements.rs
---

Entity matrices are column-major: translation occupies elements 12–14, and the last row is `(0, 0, 0, 1)` in measured placement samples. Scale is stored separately. A non-instanced vertex transforms as `world = T + R × (s × vertex)`. :observed

The length unit is the metre and z is up, supported by prop dimensions, terrain alignment and grid spacing. Map-image correspondence supports x east and y north, but those compass names are an interpretation rather than a serialized axis declaration. :observed :inferred

Instance matrices act in the owner's frame. Among 38,877 group instances with nonidentity owner rotation or scale, `AABB(R × I × mesh bounds)` fits stored bounds in 38,839 cases; instance-only transformation fits 4,334. This supports `world = T + R × (I × vertex)` for these instances. :observed

| Placement path | Stored relationship | Confidence |
|---|---|---|
| Entity → Visual → Mesh | Owner transform and separate scale; optional instances | :observed |
| Entity → Visual → LODSelector | Five instance slots align to descriptor slots | :observed |
| Group's own Visuals | Owner can rotate a batch of local instances | :observed |
| Group members | Referenced Entities/groups; membership alone proves no parent matrix | :observed |
| Collision shape | Shape-local transform, then owner placement | :observed |

Stored matrices can place a visual far from where it appears to belong, without a lost parent transform. Two `SpeedBoost_Arrow_A` props on the CITYSCHOOL campus (`_447`, `_448`) sit at z 2254–2255, 80–90 m under the ground at their x/y, while 17 siblings sit at z 2332–2346. Their bodies are byte-identical in flags, descriptor, filter and tail to above-ground siblings, with one Visual, no parent or attachment component, no DataLayer action and neither hidden nor phantom set; a level-0 cell lists them directly; their stored BoundingVolume z extent matches the tilted matrix; and none of the 38,903 parsed EntityGroups lists them as members. :observed[two Entities and their siblings]

One six-forge placement census finds 349,009 instanced Visuals among 576,844 then-readable Entities, with matrices in slot zero and none in the other mesh slots. That does not establish that the renderer never instances coarser LODs. :observed

:::open[Does owner Scale affect instances?]
For one family of 32 instances with scale 1.15, stored bounds fit without owner scale and fail with it. Other instanced owners in the measured census have scale one. A universal renderer rule remains unresolved. :observed
:::

## Placement in Shaun White Skateboarding

:only[shaun-white-skateboarding]

Entity matrices are row-major: a point is transformed as `world = v_local * M`, rows 0 to 2 are the local axes and row 3 is the origin, rather than the column-major convention above. The unit is the metre and Z is up. :observed{games="shaun-white-skateboarding"}[178 rotated entities of level 01]

The coordinates that the running game keeps for the skater's feet (east, north, up) equal the stored placement frame of the world with no offset and no rotation, checked on the Stronghold world: its ground props sit at the height of the feet at the arrival point, and the objects around that point match what the screen shows. :observed
