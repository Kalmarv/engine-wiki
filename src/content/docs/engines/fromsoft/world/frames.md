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
arrays of 150 `hkQsTransform` records, the pose, in both `PlayerIns` objects checked. :observed{games="elden-ring"} The records at
`+0x60` (translation, rotation and scale, 16 bytes each) are in the Havok skeleton's bone order and in model space, not local: for
the `c0000` skeleton's parents, `t_child − t_parent = q_parent (s_parent × rest offset)` to 0.0000 m on the legs, spine and fingers,
the root's rotation is the identity, and the translation's fourth word is not a coordinate. :observed[one idle sample]{games="elden-ring"}
Their rotations differ from the skeleton's bone frames by a twist about each bone's own axis, which no position shows: local
rotations derived from them as `conj(q_parent) q_child` match none of the 7,953 `c0000` clips (43° mean at best) and turn the knee
and elbow bends over, while the distances between joints match the clip `a029_032000` to 0.0 cm. :observed[one sample against
every `c0000` clip]{games="elden-ring"} So this pose is compared with clips by its joint positions. :inferred{games="elden-ring"}

The game also keeps the collision the player stands on. The local player (`WorldChrMan`'s `+0x1E508`) holds a floor handle at
`+0x2C8`; the hit instance with that handle at its `+8` holds a layout reader at `+0x70` and a part index at `+0x80` (a signed
short), and the reader's table of parts of kind 5 (collision parts, 16-byte entries at `+0x698 + 5 × 16`) gives the part with that
index, whose name pointer is first. At the Stormveil main gate the handle read `0x0A00000000000004` and the chain gave index 4,
`h001300`, the collision under the spawn. :observed[read from the code, one live reading of 1.17.3]{games="elden-ring"} This is
the floor under the character, not a part chosen by distance or by the camera. :inferred{games="elden-ring"} The overworld's
floor lookup goes through a separate tree, read in the code but not checked live. :unknown{games="elden-ring"}

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

In the scene constants (`cbSceneParam`, `b8`) the camera position is at byte 48, the view matrix at 80, the reverse-Z
projection at 256 and the camera-to-world rows at 320; the asset and map-piece G-buffer programs take a draw's instance
matrices from `b5`, 3 × 4 row-major with a stride of 48 bytes, as many as the draw's instance count. With the stock offset, the
instance matrices of 40 G-buffer draws at the Stormveil gate put every resolved placement on its layout part to under 1 cm.
:observed[40 draws of one recording]{games="elden-ring"} The camera-to-world rows (bytes 320 to 367) are three rows of four,
row-major, their translation the camera's position, and the view's forward is their third column (view +z): a render from that
eye along that axis at the projection's 48° frames the scene as the game's picture does. :observed[two recordings at the Stormveil
gate]{games="elden-ring"}

### World block offsets

Each world block holds its offset as a vector at `+0x70` (the setter writes x, y, z and a w of 0; a shift adds to it), and the
spawn matrix of the block's effects is the region's matrix times a translation by it ([wind regions](/engines/fromsoft/world/msb/#wind-regions-type-6)).
In a recording at the Stormveil gate the block's offset was (88, −16, −16), the negation of the start offset above.
:observed[read from the code of 1.17.3, one recording]{games="elden-ring"}

The offsets are kept by `CS::WorldGridAreaInfo`, which holds the area number (`+0x0C`), the current grid cell x and z (`+0x44`,
`+0x48`), a base cell (`+0x50`), a base offset (`+0x5C`), the cell size (`+0x64`), the accumulated shift (`+0x6C` to `+0x74`), a
distance threshold (`+0x78`, also read at 0.9 and 0.99 times), a block placed by the grid (`+0x80`) and trees of the world
blocks (`+0x90`) and of other entries that shift with them (`+0xC8`). Its set-up takes cells from a packed map id (area = id >> 24,
x = byte 2, z = byte 1, and a level from the low byte's high nibble for areas 50 to 88) and gives the placed block
`(cells − base) × size + base offset + shift`. Its shift (virtual slot 10) adds a delta to every block's offset, every entry and
the accumulated shift, then wraps the shift's x and z into `[−size / 2, size / 2]`, stepping the cell counters.
A block that registers takes its offset from a table of 16-byte entries `{id, vec3}` keyed by its id: the entry's vector minus an
object's position. :observed[read from the code of 1.17.3]{games="elden-ring"} Who calls the shift, and where that table comes
from, are not found in the code; so the 8 m truncation above is not yet seen in it. :unknown{games="elden-ring"}

The grid's cells are 256 m in x and z, set by its constructor. A block of level `L` at cell `i` is placed, per axis x and z, at
`offset + (f32(i × 2^L − cell) × 256 + ((2^L − 1) × 0.5) × 256)`, in that order of operations, `cell` and `offset` being the
grid's current cell and floating offset; y is the grid's y plus 0. The shift adds the delta to every block's translation first,
then to the grid's accumulated shift, and while x or z is beyond ±128 it moves it back by 256 and steps the cell; exactly ±128
stays in its cell. :observed[read from the code of 1.17.3; six runs of those instructions, levels and multi-cell shifts among
them, bit for bit; the tiles `m60_42_36_00` and `m60_21_18_01` placed the same]{games="elden-ring"} What triggers the shift and
how a dungeon's frame joins the grid are not established. :unknown{games="elden-ring"}

Since the offset belongs to the run, a recorded frame's camera and lights need that run's offset before they can be compared
with the map. Three things in a run's own data give it: physics modules standing on at least three distinct layout Player or
Enemy parts, to 0.01 m; the translation that puts the most point-light records on the bank's lights; or, from the camera
alone, the candidate offset under which a known actor projects through the frame's own view and projection matrices onto
where the picture shows it. In one run under the stock offset the eye was 3.1 m from the Main Gate grace `c1000_9008` and the
grace projected onto its flame in the picture; under the shifted offset it projected far outside the picture.
:observed[runs at the Stormveil gate]{games="elden-ring"}
