---
title: Big Walk's world, puzzle and prop systems
description: "Big Walk's scenes and culling system, the player and prop model, and its networked puzzle logic (pecks), as recovered from the IL2CPP metadata and an earlier reconnaissance of the build."
games: [big-walk]
---

Big Walk (House House, Unity 6000.3.17f1, IL2CPP) keeps all of its data in one [UnityFS bundle](/engines/unity/archives/unityfs-bundles/)
and its code in `GameAssembly.dll` ([scripting backends](/engines/unity/runtime/scripting-backends/)). The class names below are
in its IL2CPP metadata; what the classes do is from an earlier reconnaissance of the build and is not rechecked here.
:observed{games="big-walk"}

## Scenes

`level0` is platform initialization, `level1` the base scene (menus, offline mode), `level2` the whole world and `level3` the sky,
which is loaded additively by the network manager. :inferred{games="big-walk"} The world scene holds 624,585 objects:

| Class | Count in `level2` | Confidence |
|---|---|---|
| GameObject | 166,795 | :proven{games="big-walk"} |
| Transform | 164,517 | :proven{games="big-walk"} |
| MonoBehaviour | 93,569 | :proven{games="big-walk"} |
| MeshRenderer / MeshFilter | 61,551 / 61,335 | :proven{games="big-walk"} |
| LODGroup | 18,676 | :proven{games="big-walk"} |
| BoxCollider / MeshCollider / CapsuleCollider | 17,525 / 14,419 / 9,958 | :proven{games="big-walk"} |
| Light | 6,305 | :proven{games="big-walk"} |
| Rigidbody | 2,178 | :proven{games="big-walk"} |

The counts are of every object of `level2` in the bundle. :proven{games="big-walk"} There is no streaming: the whole world is one
scene. :inferred{games="big-walk"}

The terrain is four 1,024 m terrains (2,049 × 2,049 heightmaps, 0.5 m per sample), about 2,048 m square and centred on the
origin, with the root at y = −50. :inferred{games="big-walk"} The scene's roots include `WorldManager`, `VoiceManager`,
`LandmarksNonChallenge`, `LandmarksPlayerCountAny` (29 children), `TrainSystem`, `ChairLift`, `TunnelSystem`, `Rivers`, `Ocean`,
`World-Terrain`, `World-Scatter`, `World-HandPlaced`, `CullingTriggers` (45) and `EndingWall`. :inferred{games="big-walk"}

## Culling

Big Walk draws with its own culler, `HouseCulling`: `CullingAgent`, `CullingTrigger`, `CullingLocation` and `CullingRegion`
objects with a 64 × 64 visibility matrix. Objects added to the scene need `CullingAgent.neverCull` set or a new
`CullingTrigger`, or they are culled. :inferred{games="big-walk"}

## Player and props

The player is a `PlayerCharacter` hub of about 40 modules; the local player is `WorldManager.localPlayerCharacter`.
:inferred{games="big-walk"} `PlayerGrease.Teleport(Vector3, Quaternion, bool)` moves a player; 197 `TeleportPoint`s exist as
developer cheats reached through `PlayerCheater`. :inferred{games="big-walk"}

An item is a **`Prop`**, a networked behaviour; the template is `DevSettings.baseProp`, there are no item assets. A prop has a start
home, stickiness, a launch multiplier, poses, and switches for use, drop, eject and pickup; a **`PropHome`** is a socket that
props pin into, with a pin group and events. :inferred{games="big-walk"}

## Peck puzzles

Puzzle state is a **peck** system. A `TrackedPeckState` is a synchronized integer; a `PeckManager` holds a synchronized
dictionary of them; a `PeckSwitch` has a state mode (specific, wrap, map, ignore) and can need a key of a key type. Logic
blocks are `PeckRelay`, `PeckCombinator`, `PeckSystemBlock`, `PeckBus`, `PeckStateFilter` and `PeckCondition`; effects are 43
`PeckEffect*` classes (toggle, audio, animator, material property, particle, timer, tween, launch prop, teleporter, text input,
headset, ...). :inferred{games="big-walk"} The scene groups include `PokeButtonPeckLogic` (624), `BasicDoorPeckLogic` (171),
`GourdVice` (75) and `PegSlotHome` (371). :inferred{games="big-walk"}

Progression is 58 challenges that each yield a gourd, saved by `SaveablePropName` and `LandmarkSaveSetter.guid`.
:inferred{games="big-walk"}

## Voice

Voice is Dissonance over Mirror. Radio channels are rooms named by `RadioVoiceAssigner.roomName` (`RadioA`, `MegaphoneA`, ...,
`TrainIntercom`, `RingRoom1` to `4`, `CenturionSeance`, `JukeboxTeller`, `JukeboxWorker`); a `SpeechlessZone` blocks a player's
voice. :inferred{games="big-walk"}

:::open[Which of these systems the shipping build still has]
The class names listed here are present in the metadata of the measured build (25723723), but the roles, counts and scene
groups come from an earlier reconnaissance whose build is not recorded, and are not rechecked against this one.
:::
