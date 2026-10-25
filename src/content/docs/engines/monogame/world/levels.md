---
title: STUNTBOOST levels
description: "How STUNTBOOST stores a level: glTF parts wrapped in XNB, their buffers and derived files, the level, room and skybox parts, the sidecar, units, and what the 56 levels hold."
games: [stuntboost]
sources:
  - title: StuntboostTools
    url: https://github.com/bytinggames/StuntboostTools
    note: the Blender exporter and documentation that ship in the game's install; the export grammar
implementations:
  - name: primase worlds/stuntboost (read/level.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/stuntboost/src/read/level.rs
---

STUNTBOOST (Byting Games; a fingerboard racer) stores each level as one or more **parts**, each a glTF 2.0 document exported from
Blender, wrapped in an [XNB](/engines/monogame/archives/xnb-containers/). The collision of the shipped levels is
derived from the document by the game's content pipeline, and its output is shipped beside the glTF. :observed{games="stuntboost"}

## Files of a level

Under `Content/Models/Export`, for a level named `<Name>` with parts numbered from 0:

| File | Reader | Content | Count | Confidence |
|---|---|---|---|---|
| `Level_<Name>_.xnb` | `StringReader` | a JSON sidecar with the part count (`modelCount`) | 55 | :proven{games="stuntboost"} |
| `Level_<Name>_<N>.xnb` | `BytingPipeline.GLTFReader` | the part's glTF JSON | 159 | :proven{games="stuntboost"} |
| `Level_<Name>_<N>.bin.xnb` | `ArrayReader<Byte>` | the glTF's one buffer | 159 | :proven{games="stuntboost"} |
| `Level_<Name>_<N>Collision.xnb` | `SE.Pipeline.CollisionModelReader` | the part's collision, see [collision](/engines/monogame/collision/collision-model/) | 159 | :proven{games="stuntboost"} |
| `Level_<Name>_<N>Cuts.xnb` | `ReflectiveReader<ShortcutContent>` | the part's shortcut data | 159 | :proven{games="stuntboost"} |
| `Models/Resources/<Name>.export/Bake<N>_Denoised.xnb` | `QoiReader` | a baked lighting atlas, see [baked lighting](/engines/monogame/lighting/baked-lighting/) | | :observed{games="stuntboost"} |

There are 56 levels: AccelerateAndSteer, AirCrouch, AirGainSpeed, Bed, Bernie, BigAir, BoosterAndRewind, BoosterLaunching,
Bouncy, Bowls, Cake, CameraCalibration, Cards, Castle, CatTree, Crouch, DJump, DJumpHor, DJumpVert, Eyes, EyesPool, FullPipe,
GrindCurve, GrindLanes, GrindOptional, GrindPark, GrindTut, HalfPipes, Heights, HorizontalRamps, Ice180, IceBasics,
IceCylinders, IceCylinders2, IceFloe, IceLaps, IceSlide, IceWaves, Jump, JumpFaster, LandingDirection, LapsDonut, LapsIsland,
LegoLabyrinth, LegoLabyrinth2, LegoTower, Mod, RampMix, Skatepark, StairsSlide, Test_Gym, Tornado, Tornado12, Tower,
VerticalRamps and Wave. :proven{games="stuntboost"} Every level the sidecars list has its parts `0` to `modelCount − 1`.
:proven{games="stuntboost"} The differences: `Test_Gym` has parts and no sidecar (it is not a level the game lists), and
`GrindCurve` and `HorizontalRamps` ship one more part file than their sidecar counts, a lone skybox part.
:proven{games="stuntboost"}

## Parts

A level is two or three parts, told apart by what their nodes are:

| Role | Distinguishing node | Parts | Confidence |
|---|---|---|---|
| level | a node with the `=Spawn` call | 57 | :observed{games="stuntboost"} |
| room | neither | 46 | :observed{games="stuntboost"} |
| skybox | a node with the `=Skybox` call | 56 | :observed{games="stuntboost"} |

The roles come from the exporter's two **bake groups** (the *Level* collection and the *Room* collection, which do not share a
texture) and the *Skybox* scene, which holds a simple environment rendered to a cubemap. :sourced[StuntboostTools]
A room is the mostly empty room around the track and the unreachable clutter. :sourced[StuntboostTools]

## The glTF documents

All 159 parts were written by the Khronos glTF Blender exporter v4.3.47. :proven{games="stuntboost"} In total they hold 23,799
nodes, 20,875 meshes, 1,534 materials, 267 images and 12,522,067 triangles. :proven{games="stuntboost"} The largest part has about 456,000 triangles.
:observed{games="stuntboost"} Their extensions: `KHR_materials_specular` in 101 parts, `KHR_materials_emissive_strength` in 26,
`KHR_materials_ior` in 5 and `KHR_lights_punctual` in one. :proven{games="stuntboost"} Every material is `OPAQUE`.
:proven{games="stuntboost"}

Every node carries an `extras` object with the exporter's `sbe_properties`; 18,526 also have `sbe_parent_collection` and 6,629
`sb_props`, and some carry the Blender add-ons' properties (`MeasureGenerator` on 2,545, `ikeaItemNo` on 68). :proven{games="stuntboost"}
Node names follow a grammar that carries the gameplay, see [node names](/engines/monogame/gameplay/node-names/).

A mesh primitive may carry an application-specific vertex attribute, `_COLOR_SHIFT`, two bytes per vertex written by the
exporter, which the game's outline pass pushes each vertex by ([outlines](/engines/monogame/effects/outlines/)).
:observed{games="stuntboost"}

## Units

The glTF's units are not scaled by the game: there is no level scale in the code. Props are modelled at real size in centimetres
(an AA battery is 5.15 units long, a door 204), while the board's deck is 0.967 units long (`Board.gltf`, the `Deck_textured`
mesh; `Player.HalfWidthOfBoard` is 0.1221). So props are giant relative to the board, and a unit is about 0.83 m when the board is
read as a 0.80 m skateboard deck. :observed{games="stuntboost"}

## Models

Props, creatures and animated objects are glTF in XNB the same way (`Content/Models/Export/<Name>.xnb`). Four carry a skin:
Door (8 joints, 1 clip of 24 channels), Dragonfly (35 joints, 4 clips of 420 channels), Siegfried (34, 3 clips of 306) and
TestAnimation (3, 6 clips of 54). :proven{games="stuntboost"}
