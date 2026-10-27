---
title: "Component body grammars"
description: "Measured component length rules and the boundary between framing and semantics."
games: ["riders-republic"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "anvil-formats (entity.rs)"
    url: https://github.com/Kalmarv/anvil-formats/blob/main/src/entity.rs
---

Component headers do not store a universal body size. Each class requires its own grammar; where that grammar is unknown, header recognition can retain bytes without establishing their fields. All lengths here exclude the 13-byte component header. :observed

| Type / id | Body rule | Checked scope | Confidence |
|---|---|---|---|
| Visual `EC658D29` | Object, polymorphic instance data, variable tail | Geometry and UI profiles | :observed |
| RigidBodyComponent `C177D702` | Usually 847 / 855 bytes; activity-zone array can extend it | 4,318 initial bodies; later NPC exception | :observed |
| AmbientEffectGeneratorComponent `713F0C7D` | `4 + u32 n + 87n + 4` = `12 + 87n` | 2,747 bodies, n 0–2 | :observed |
| MaterialOverrider `78A13BF7` | Four bytes, count, OverrideDefinition objects, ten-byte tail | 292 bodies, all count 1 | :observed |
| StartingGridComponent `1725EC54` | `4 + u32 n + 78n` | Measured USNAT bodies | :observed |
| UICheckpointController `4CB62343` | 51 bytes | Complete reached population | :observed |
| CheckpointComponent `69D5E169` | Counted inline objects, then 226-byte tail | Reached bodies | :observed |
| AnimatedEntityComponent `2996CA50` | `9 + 66n`, n 1–4 | 2,041 / 2,041 bodies | :observed |
| CapturableOpportunityComponent `341877D6` | `8 + 109n` | 190 / 190 measured bodies | :observed |
| TeamComponent `EEF3F11F` | Nine bytes: `00 01 00 00`, zero u32, `03` | 483 measured; 26 not measured | :observed |
| BreakableComponent `44F8FD99` | `40 + 9k + 9m + 102a` | 1,070 bodies, one count combination | :observed |
| AutoFakeOrchestratorComponent `D4B44556` | Counted index-span arrays | 4,052 / 4,052 bodies | :observed |
| DominoComponent `BE711F06` | Script and typed parameter list, 21-byte tail | 2,384 / 2,626 validated | :observed |
| BulkComponent `308358A4` | Template, member, state, sound and float arrays | 2,481 / 2,481 bodies | :observed |
| FXComponent `D2BF93A6` | Embedded command, parameter list, activation fields | 1,089 reached bodies | :observed |
| GameplayContextDisablerComponent `BB7F5B1D` | Recursive condition tree, link list, four-byte tail | 2,315 reached bodies | :observed |
| TriggerEventSenderComponent `DB883EE3` | Event-listener and event-seed object grammar | 1,489 measured ends | :observed |
| QuestInteractiveComponent `733E6F5A` | 103 bytes | Measured bodies | :observed |
| OutOfBoundsVisualComponent `29941A30` | 169 bytes | Measured bodies | :observed |
| TheaterComponent `7F0A4643` | 14 bytes | 18 initial bodies | :observed |
| EventListenerComponent `2AA179AB` | 17 bytes | Initial samples and animated-entity followers | :observed |
| TriggerComponent `ADF1D5E6` | 450 bytes | 15 initial bodies | :observed |
| WildlifeSpawnerComponent `A8ABFC79` | 46 bytes | 11 initial bodies | :observed |
| BehaviorBoostComponent `064C1BFA` | 24 bytes | Two initial bodies | :observed |
| WidgetComponent `8167852B` | 426 bytes | Two initial bodies | :observed |
| PlayerSpawnActivatorComponent `A7033693` | Nine bytes | One initial body | :observed |

A measured fixed length is not an on-disk length field. The single-count MaterialOverrider and Breakable profiles do not discriminate all possible arrangements of their repeated fields. :observed

```layout
title: "AnimatedEntityComponent body"
size: "9 + 66N bytes"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 4, "type": "bytes", "name": "component base", "level": "observed", "note": "ManagedObject and three component flags."}
  - {"at": 4, "size": 4, "type": "u32", "name": "parameter count N", "level": "observed"}
  - {"at": 8, "size": "66N", "type": "bytes", "name": "AnimationParameters", "level": "observed", "note": "Each item has object type 0xEF1C7C37 and two ValueWithRandom objects."}
  - {"at": "8+66N", "size": 1, "type": "u8", "name": "unknown", "level": "unknown", "note": "Stored bytes; meaning is not established."}
```

Each 66-byte item is `00 + u64 + type`, two u32, u8, two `ValueWithRandom` objects (`u64 + type 0xF85FBB25 + two f32`), then u32. The length reaches the next component or measured end on all 2,041 bodies. :observed

The unnamed component `0xE139F584` has `113 + 9k` bytes on 1,990 of 2,014 checked bodies: EventListener, counted links, null handle and SoundInstance. The 24 `COL_Relic_*` exceptions contain nested event objects. :observed

## What some opaque components hold

Several component types without a length rule have been identified by their owners and registry classes, which tells what they contribute without a byte grammar. :observed[six-forge census]

| Component | Bodies | Content | Confidence |
|---|---:|---|---|
| BillboardComponent | 1,148 | Only on `MAD_HUD_*_GROUP` minimap Entities, beside WidgetGroup and Layout and never a Visual: HUD markers | :observed |
| GrassVisual | 46 | The grass model library; see [grass](/engines/anvil/vegetation/grass/) | :observed |
| VisualTerrainComponent | 2 | On `Terrain_TemplateMap`, with PhysicsTerrain and PhysicsProps: terrain tuning values | :observed |
| StaticDDecalComponent | 2 | A deferred decal; see [terrain deferred decals](/engines/anvil/terrain/deferred-decals/) | :observed |

:::open[Which fixed-length rules generalize beyond their samples?]
One- and two-body measurements establish those bodies only. The opaque-component census and exceptions prevent treating every row as an exhaustive schema. :unknown
:::
