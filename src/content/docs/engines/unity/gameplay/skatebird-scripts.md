---
title: SkateBIRD scene scripts
description: "SkateBIRD's own gameplay objects: reset points and the level start, mission givers and the mission roots, collectibles, rails and ramp zones, the player's board, and the level spawn data."
games: [skatebird]
implementations:
  - name: primase worlds/skatebird
    url: https://github.com/Kalmarv/primase/blob/main/worlds/skatebird/src/lib.rs
---

SkateBIRD's `Assembly-CSharp.dll` (947 type definitions, not obfuscated) holds the game's rules; its scenes carry them as
MonoBehaviours whose field bytes have no type tree ([script fields](/engines/unity/data-model/script-fields/)).
:observed{games="skatebird"} The namespaces are `Skatebirb.Gameplay`, `Skatebirb.Managers`, `Skatebirb.Menus`, `Skatebirb.FX`,
`Skatebirb.Camera`, `Skatebirb.Platforms`, `Skatebirb.Birbs`, `Skatebirb.SkateControl`, `Skatebirb.Timeline`,
`Skatebirb.Animation`, `Skatebirb.Util`, plus third-party code: Rewired, I2 Localization, DOTween, Cinemachine, TextMeshPro,
ProBuilder, Odin Inspector attributes, Facepunch.Steamworks, SimpleJSON, DynamicBone and MidiJack. :observed{games="skatebird"}

## Scene structure

Every playable scene is self-contained: the player bird, the skateboard, cameras, post-processing, a dialogue manager and the
mission set are in it. The playground (`level12`, 18 roots) has `Rewired Initializer`, `Reflection Probes`, `Grass plane`,
`Level Elements`, `Missions - Playground`, `Non-Static Level Elements`, `Skatebirb Dialogue Manager`, `Directional Light`,
`Reset Positions`, `Player Birb`, `Cinemachine SkateCam 2.0`, `Skateboard For Skating`, `Main Camera`,
`Skatebirb Default Postprocessing`, `Birb Factory` and `Important Stuff`. Skate heaven (`level13`, 15 roots) has
`Reset Limiters`, `Mission - Skate Heaven`, `Level Contents`, `Core Elements` and `Reset Points`. The rooftop adds
`Start Positions`, `Partially Static Level Elements` and `Unlocks`; bedroom 1 adds `Sticky Notes` and
`Partially Dynamic Level Elements`. :observed{games="skatebird"} A `Level Elements/Bounds` object holds a city skyline and
clouds at up to 5.7 km. :observed{games="skatebird"}

All of the player's renderers sit under the root `Skateboard For Skating`. :observed{games="skatebird"}

## Reset points and the level start

A **ResetPosition** script marks a point the player is put back at. One flag, `startingPosition`, marks where the level starts
([layout](/engines/unity/data-model/script-fields/#skatebirds-scripts)). The game's `ResetPosition.ResetToStart`, called from
`ControlBoard` on the first play frame, teleports to the active ResetPosition whose flag is true; with no flag set it does
nothing and the serialized `Player Birb` placement is the spawn. :observed{games="skatebird"} Each scene stores at most one
starting point; flashback (`level7`) has none, and its `Player Birb` stands at (0, 1.189, 0). 134 ResetPosition scripts occur in
all, in the scenes 1 to 5, 7, 12 and 13. :proven{games="skatebird"}

| Scene | Start (x, y, z), Unity metres | Yaw | Confidence |
|---|---|---|---|
| level1 bedroom 1 | (45.40, 16.80, 55.77) | −54.82° | :observed{games="skatebird"} |
| level2 rooftop | (−18.70, 1.19, 84.80) | 172.93° | :observed{games="skatebird"} |
| level3 office | (−34.03, 11.98, −78.36) | 0.00° | :observed{games="skatebird"} |
| level4 server room | (28.36, −1.00, −16.86) | −58.66° | :observed{games="skatebird"} |
| level5 bedroom 2 | (−26.68, 15.20, 10.05) | −54.95° | :observed{games="skatebird"} |
| level7 flashback | none; `Player Birb` at (0, 1.19, 0) | 172.93° | :observed{games="skatebird"} |
| level12 playground | (−59.09, 1.10, 62.76) | 106.15° | :observed{games="skatebird"} |
| level13 skate heaven | (30.70, 0.20, −23.60) | −14.09° | :observed{games="skatebird"} |

The yaw is `atan2(forward.x, forward.z)` of the object's forward (Unity +Z), in degrees. :observed{games="skatebird"}

## Mission givers and missions

A **MissionGiver** script marks a bird that gives a mission; the title is its first field. Missions live under roots named
`Missions - <Level>` and `Unlocks`; the managers are `MissionManager`, `SaveToDiskManager` and `SpawnPools`, and the data types
`MissionDef`, `MissionGoalDef` and `MissionGoalTypes`. :observed{games="skatebird"} Root names can be stale copies: the office
scene carries a root named `Missions - Server Room`, and the flashback scene one named `Missions - TEST`.
:observed{games="skatebird"}

What a mission shows or hides while it runs is also stored in the scene, by these script roles over a GameObject and everything
beneath it:

| Script | Role | Confidence |
|---|---|---|
| `SkateCollectible` | a mission's collectible, shown while its mission runs | :observed{games="skatebird"} |
| `EnableOneAtRandom` | its children are candidates; the game shows one, picked at random | :observed{games="skatebird"} |
| `MissionGiver` | a bird that gives a mission | :observed{games="skatebird"} |
| `BirbDecorator` | a bird's dressing (hats, accessories) | :observed{games="skatebird"} |
| `PermanentUnlockingCollectible` | an unlock (a deck, wheels, clothes), shown until collected | :observed{games="skatebird"} |
| `SkateboardGateway` | the player's own board, placed in every level scene | :observed{games="skatebird"} |
| a Camera component | what hangs under a scene camera moves with the view, e.g. the HUD's mission arrow | :observed{games="skatebird"} |

World state that missions switch (`MissionToggled`) is stored as the scene has it. :observed{games="skatebird"} A static render
of a scene shows every mission prop at once: every random candidate stacked, every giver bird, every unlock.
:inferred

## Rails, ramps and the skating primitives

Skating surfaces are authored with marker objects: `GrindableRail`, `GrindableElementProgression`, `RampZone`, `VertZone`,
`FanZone`, `AreaDenialZone`, `BasicGapGate`, `GapGateZone`, `TrickGapGate`, `LippableNubbin`, `SkateboardGateway` and
`TrickableElement`. :observed{games="skatebird"} Scenes hold generated GameObjects named `Generated_Rail_Node*`,
`Generated_Ramp_Zone*` and `Generated_Vert_Zone*`; the rail, ramp and vert volumes come from these. :observed{games="skatebird"}
A rail is a chain of `GrindableRail` nodes ([layout](/engines/unity/data-model/script-fields/#skatebirds-scripts)); level1
has 540 nodes. :observed{games="skatebird"}

## Minimap markers

`Minimap/Mission Marker` spheres on layer 28 are visible only to the escape menu's map camera, see
[layers and cameras](/engines/unity/world/layers-and-cameras/). :proven{games="skatebird"}

## The developer console

`ReflexCLI` (13 types plus `ReflexCLI.UI`) is compiled into the game. :observed{games="skatebird"} The only command
found that moves the player to a level is `MissionManager.LoadLevel`; there is no teleport or camera command.
:observed{games="skatebird"}

## Levels' extents

The playable extents of each level are 100 to 300 m across by collider bounds (colliders wider than 100 m on any axis, such as
skylines and building sides, are left out): bedroom 1 is 137 × 50 × 118 m, the rooftop 175 × 97 × 179 m, the office
194 × 76 × 169 m, the server room 76 × 44 × 76 m, the playground 140 × 42 × 130 m and skate heaven 196 × 148 × 296 m.
:observed{games="skatebird"}
