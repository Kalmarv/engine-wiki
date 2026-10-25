---
title: Node names and gameplay objects
description: "The grammar of STUNTBOOST's glTF node names: visibility and collision characters, code calls that make gameplay objects, the classes the levels use, and how the game draws a node by its name."
games: [stuntboost]
sources:
  - title: StuntboostTools (bake_v3 README)
    url: https://github.com/bytinggames/StuntboostTools
    note: the exporter's object, collection, vertex group and modifier naming syntax
implementations:
  - name: primase worlds/stuntboost (components/names.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/stuntboost/src/components/names.rs
---

STUNTBOOST's levels carry their gameplay in the **names** of the Blender objects, exported as glTF node names. The game's content
pipeline parses each name (`SE.Pipeline.ParsedName`) into a visible name, type flags and a code. Every one of the 23,799 node
names in the 159 level parts parses to the same result under an independent reader of the grammar as under the game's own
parser: visibility, collision aggregate, bake shadows, inner name and code. :proven{games="stuntboost"}

## Grammar

`{hide} {name} {type} {= {Class(args)} {.Property or Method(args)} } {.001}`, every part optional. :sourced[StuntboostTools]

- **Name and code.** With an `=`, the name is what precedes the first `=`, and the **code** is the rest from the `=` on, kept
  whole (a Blender `.NNN` suffix after the code stays part of it). Without an `=`, the name ends at its first `.`; what follows,
  normally Blender's `.NNN`, is dropped. :proven{games="stuntboost"}
- **Type characters** are read backwards from the end of the node name (the name up to its first `.`), in any order, until
  another character; as many characters as were read come off the end of the name. When the same kind appears twice, the one
  nearer the start wins. :proven{games="stuntboost"}

| Character | Meaning | Nodes in the 159 parts | Confidence |
|---|---|---|---|
| `_` | invisible, in the game and in the bake | 19,745 | :observed{games="stuntboost"} |
| `*` | visible in the bake but not baked to | 0 | :observed{games="stuntboost"} |
| `°` | invisible in the bake | 744 | :observed{games="stuntboost"} |
| `<` | solid collision | 18,632 | :observed{games="stuntboost"} |
| `#` | transmissive: a trigger, passed through | 1,288 | :observed{games="stuntboost"} |

The counts are of the characters read at the end of the nodes' names. :observed{games="stuntboost"} A solid collision node that is
also invisible is written `_<`; an invisible trigger `_#`. :sourced[StuntboostTools]

- **Code.** A C#-like chain of calls without spaces and without `new`: a class, then property setters or methods, each
  `Name` or `Name(args)`, arguments split at top-level commas (`Vector3(1,0,0),x` is two). No class (code starting with `=.`,
  or none) means `Entity()`. A trailing three-digit `.NNN` is Blender's duplicate suffix and not a call.
  :proven{games="stuntboost"}
- **Hide prefixes** in Blender: `/` hides the object before export (it can still affect the bake, as a shadow helper), `//`
  excludes it from the bake and from the export. :sourced[StuntboostTools]

Parsing never fails: a name is what it says; what the game makes of an unknown class is the game's own matter. A node with an
unknown class shows as a red wireframe box in the game. :sourced[StuntboostTools]

## Classes the levels use

The class is the first call after the `=`. The levels use it as follows (counts of nodes whose code starts with the class):

| Class | Nodes | Meaning | Confidence |
|---|---|---|---|
| `Woosh` | 1,384 | | :observed{games="stuntboost"} |
| `Transparent(a)` | 619 | a drawn-transparent node with alpha *a*, see [level materials](/engines/monogame/materials/level-materials/) | :observed{games="stuntboost"} |
| `BackfaceShadowCaster()` | 553 | drawn only into the static shadows; every room's ceiling | :observed{games="stuntboost"} |
| `Booster(speed)` | 274 | a boost pad; the speed is the exporter's `CM/S` modifier | :sourced[StuntboostTools] |
| `Checkpoint` | 269 | a checkpoint trigger | :inferred |
| `BoomboxButton` | 180 | an interactive prop (a boombox button) | :inferred |
| `RoomKill` | 142 | | :observed{games="stuntboost"} |
| `Spawn(<name>[,n])` | 133 | a spawn point; a custom map needs `=Spawn(start)` or `=Spawn()` | :sourced[StuntboostTools] |
| `DoorHandle`, `Door` | 115, 36 | interactive door props | :inferred |
| `CDCaseTransparent`, `CassetteCaseTransparent`, `TransparentBowl` | 99, 96, 56 | transparent props | :inferred |
| `Detour` | 94 | a shortcut detour (the pipeline's `Cuts` data) | :inferred |
| `LightSwitch`, `PowerButtonStrip`, `PowerButtonPC`, `PCSpeakerKnob`, `PCScreenGlass` | 93, 80, 52, 56, 27 | room props | :inferred |
| `Text` | 90 | text drawn in the level | :inferred |
| `Drum`, `Cymbal`, `Boombox`, `TurntableArm` | 72, 31, 30, 44 | interactive props | :inferred |
| `Goal` | 57 | the finish | :inferred |
| `SetBakedLighting()` | 56 | marks a level drawn from its baked lighting | :observed{games="stuntboost"} |
| `PreviewCamera` | 56 | the camera of the level's preview | :inferred |
| `Skybox` | 56 | marks the skybox part | :observed{games="stuntboost"} |
| `Sun`, `CustomSunRegion` | 55, 29 | the sun, and regions with another sun | :inferred |
| `CheckpointSpawn` | 55 | a spawn after a checkpoint | :inferred |
| `HiddenCollectible` | 54 | a collectible | :inferred |
| `Kill` | 42 | a kill volume | :inferred |
| `EyeGlass`, `EyePupil`, `EyeTriggerMesh` | 30, 30, 27 | the eyes of the Eyes levels | :inferred |
| `SignTrigger`, `GoalCameraPoints`, `RestartTut`, `LvlBowlsBowl` | 29, 28, 28, 36 | | :inferred |

Gameplay objects in the level glTFs include boosters (`#=Booster(speed)`), doors with handles, drums, cymbals and
turntables, and collectibles. :observed{games="stuntboost"}

The lap goal and mandatory checkpoint assets of the tools (`lap_goal`, `checkpoint_mandatory`) mark laps: a lap goal activates only
after every mandatory checkpoint. :sourced[StuntboostTools]

## How the game draws a node

By its name, in this order: an invisible node (`_`) is never drawn; a node with a `BackfaceShadowCaster` call is drawn only into the
static shadows; a node whose name contains `Transparent` is drawn sorted back to front; otherwise it is drawn. A `_<` collision
node is never drawn. :observed{games="stuntboost"} 870 nodes over all levels contain `Transparent`. :observed{games="stuntboost"}

## Collections, vertex groups and modifiers

The exporter also reads names on collections (`bake_group` for a bake map, `bake_size=X` for UV scale, `rename=from|to`,
`append_prop=Code`, `swap_collision_materials=C_Kill`, `prevent_join`, `outline_max_thickness=X`, `outline_shift`,
`outline_shift_relative`, `outline_shrink`, `delete_collisions`), vertex groups (`bake_size=0.2`) and modifiers (`//name` ignored,
`/name` removed after the bake). A `//` or `/` prefix on a collection excludes it. :sourced[StuntboostTools]

:::open[The classes with no stated meaning]
`Woosh` (1,384 nodes), `RoomKill` and several props have no meaning stated in the tools' documentation; what the game does for
each class is in its code and has not been tabulated.
:::
