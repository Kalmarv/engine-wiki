---
title: Coordinate frames and map offsets
description: Placement transforms, map-local collision and the distinction between angular units.
sources:
  - title: SoulsFormatsNEXT
    url: https://github.com/soulsmods/SoulsFormatsNEXT
  - title: Smithbox
    url: https://github.com/vawser/Smithbox
  - title: Soulstruct Blender
    url: https://github.com/Grimrukh/soulstruct-blender
implementations:
  - name: primase pose arithmetic
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/pose.rs
---

The source coordinate frame is left-handed, with +Y up and distances in metres. Reflecting Z, `(x,y,z) → (x,y,-z)`,
changes it into a right-handed frame. :sourced[Soulstruct Blender] Sekiro model comparisons preserve positions,
normals and tangent directions under that reflection, including both tangent handedness signs. :observed{games="sekiro"}

## Placements

MSB rotations are degrees. A part applies scale, then rotations about X, Z and Y, then translation; with column
vectors this is `T × Ry × Rz × Rx × S`. :sourced[Smithbox] On rotated Ashina Castle pieces, collision alignment
discriminates this order from the alternative Euler orders: over the 594,736 triangles of pieces rotated by at
least 20° about X or Z, it puts 9.6% of top-down pixels within 5 cm of the decoded collision, and the other five
orders 1.3% to 4.5%. :observed{games="sekiro"}

FLVER bone rotations are radians; their local transform follows the same X-Z-Y axis order. Parent transforms
compose above the local transform to give model space. :sourced[SoulsFormatsNEXT]

## Sekiro

### MapOffset

:only[sekiro] MSB parts already occupy the shared world frame. MapOffset instead places map-local collision using
`world = Ry(yaw) × local + translation`; applying it again to part positions translates them twice.
:observed{games="sekiro"}

```layout
title: MapOffset event type data
size: 16
games: [sekiro]
note: The event record points here; yaw is in degrees.
fields:
  - {at: 0, size: 12, type: "f32[3]", name: translation, level: observed}
  - {at: 12, size: 4, type: f32, name: yaw, level: observed}
```

| Map | Translation | Yaw | Confidence |
|---|---|---|---|
| `m11_00` Ashina Outskirts | (90, 3, −40) | 20° | :observed{games="sekiro"} |
| `m11_01` Ashina Castle | no MapOffset: collision is already in the world frame | — | :observed{games="sekiro"} |
| `m11_02` Ashina Reservoir | (−8.5, −45, −62.5) | 27° | :observed{games="sekiro"} |
| `m13_00` Abandoned Dungeon | (−303, −54, 300) | 132° | :observed{games="sekiro"} |

:::open[Do all auxiliary map files share collision's local frame?]
Collision placement has a measured render-alignment comparison. Applying MapOffset to BTL, EDGE and navigation
data is an inference until each family has an equivalent comparison.
:::

### The player's position

:only[sekiro] The running game keeps the player's position in its character physics module, an
`NS_SPRJ::SprjChrPhysicsModule` (found by the vtable its RTTI names; of the 237 instances in one run, the one whose
owner, the pointer at `+0x08`, is a `PlayerIns`). The `float4` at `+0x80` is the position `(x, y, z, 1)`, with a copy at
`+0x90`, in the MSB frame of the map: right after a load it equals, to three decimals, the position of the Player part
the game spawned at (`c0000_0009` of `m11_01`, (−128.550, 40.900, 223.580)). :observed[one run, three snapshots]{games="sekiro"}

Walking forward from a spawn moves the player in x and z along `(−sin yaw, −cos yaw)` of that Player part's MSB yaw, at about
5 m/s: (0.809, 0.588) for the yaw of −126° at `c0000_0009`. :observed[one spawn measured; a second agrees to about 10°]{games="sekiro"}
