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

## Elden Ring

### The player's position

The running game keeps a character's position in its physics module, a `CSChrPhysicsModule`, found by the vtable its RTTI
names. In one run there are 283, and every one passes the check that the pointer at `+0x08` is its owner (a `ChrIns`), the
owner's `+0x190` points at a module container and the container's `+0x68` is the module again. Eight of them belong to an owner
of class `PlayerIns`, which human NPCs share with the player; the local player's is the one that moves with a held forward key,
and its flag bytes `+0x90` to `+0x93` read 0, 0, 1, 1 against 0, 1, 0, 0 on the seven others. The `float4` at `+0x70` is the
position. :observed[one run]{games="elden-ring"} Writing the player's `+0x70` and `+0x80` with another standing point of the same
frame moves the character there: the value reads back unchanged 0.5 s and 12 s later and the character does not fall.
:observed[one run, two points]{games="elden-ring"} The owner's `+0x398` points at an object whose `+0x50` and `+0x60` point at two
arrays of 150 `hkQsTransform` records, the pose, in both `PlayerIns` objects checked. :observed{games="elden-ring"}

### The physics and render frames

The physics position is not in the map's MSB frame but in one whose origin is a whole-metre offset from it: map-local = physics +
offset. Starting at the stock spawn of Stormveil (`m10_00_00_00`) the offset is (−88, 16, 16): the eight other `PlayerIns`
characters land exactly (to 0.000 m) on MSB Enemy parts of the map (`c0000_9035`, `c0000_9030`, `c0000_9028`, `c0000_9036`,
`c0000_9037`, `c0000_9027`, `c0000_9026`, `c1000_9008`), and the player's spawn, (−93.811, 21.536, 19.723) in the map's frame, is
0.16 m from the Player part `c0000_9017`. :observed[every run started in that state]{games="elden-ring"} A run that started
elsewhere, with the player at about (−216, 45.7, 17.6) in the map's frame, has every module shifted by (+128, −24, 0): an offset
of (−216, 40, 16). :observed[one run]{games="elden-ring"} Both offsets are the player's starting position truncated toward zero to
multiples of 8 m. :inferred[two runs]{games="elden-ring"} A map-local point written as a physics position, unconverted, puts the
character outside the scene and it falls out of the map. :observed{games="elden-ring"}

The renderer draws in such a frame too. In a frame captured at the Stormveil gate the light records' positions (see
[BTL](/engines/fromsoft/lighting/btl/#how-the-renderer-takes-a-light)) are the bank's moved by the whole-metre translation
(−216, 40, 16) from render to map, and the scene constants' `SC_CameraPos` equals `SC_RenderCameraPos`, so the frame's constants
state no offset. :observed[one capture]{games="elden-ring"} That the render frame and the physics frame share their origin is
:inferred{games="elden-ring"} from the same offset in both.
