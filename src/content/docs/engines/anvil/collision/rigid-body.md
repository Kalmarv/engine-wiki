---
title: "RigidBody and collision blockers"
description: "Entity shape ownership, filters and collision-only objects."
games: ["riders-republic"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "primase worlds/anvil (entity.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/entity.rs
---

RigidBodyComponent (`0xC177D702`) attaches a shape through an owned RigidBody. The shape reference starts at component-body offset 748 in the checked profile and resolves to triangle, primitive or compound shapes. Registry names identify drive and character-interaction flags separately from filtering. :observed

```layout
title: "RigidBodyComponent body (847 or 855 bytes)"
size: "847 + h bytes"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "ManagedObject byte", "level": "unknown", "note": "0 491,331, 1 641"}
  - {"at": 1, "size": 1, "type": "u8", "name": "Active", "level": "observed", "note": "Component.Active (registry bool): 0 330,635, 1 161,337"}
  - {"at": 2, "size": 1, "type": "u8", "name": "IsAnOptimizedComponent", "level": "observed", "note": "Component.IsAnOptimizedComponent: 0 481,177, 1 10,795"}
  - {"at": 3, "size": 1, "type": "u8", "name": "IsPartiallyOptimized", "level": "observed", "note": "Component.IsPartiallyOptimized: 0 491,716, 1 256"}
  - {"at": 4, "size": 4, "type": "u32", "name": "Damage", "level": "observed", "note": "PhysicComponent.Damage (enum): Medium 491,970, Light 2. Enumerators: 0 Damage_Light, 1 Damage_Medium, 2 Damage_Heavy, 3 Damage_Super_Heavy, 0xFFFFFFFF Damage_None"}
  - {"at": 8, "size": 4, "type": "u32", "name": "CharacterInteractionMode", "level": "observed", "note": "PhysicComponent.CharacterInteractionMode (enum): Blocking 491,958, Ignore 12, Debris 2. Enumerators: 0 Blocking, 1 Debris, 2 PushableAlways, 3 PushableIfMoving, 4 BlockingMobile, 5 PushableIfShoving, 6 Ignore (prefix CharacterInteraction_)"}
  - {"at": 12, "size": 1, "type": "u8", "name": "DriveEntity", "level": "observed", "note": "PhysicComponent.DriveEntity (bool): 1 491,920, 0 52"}
  - {"at": 13, "size": 1, "type": "u8", "name": "EntityDriven", "level": "observed", "note": "PhysicComponent.EntityDriven (bool): 0 491,956, 1 16"}
  - {"at": 14, "size": 4, "type": "u32", "name": "Resistance", "level": "observed", "note": "InteractivePhysicComponent.Resistance (enum): Normal 491,968, Fragile 2, Indestructible 2. Enumerators: 0xFFFFFFFF FirstHit, 0 Fragile, 1 Normal, 2 Solid, 1000 Indestructible (prefix Resistance_)"}
  - {"at": 18, "size": 8, "type": "u64", "name": "GPSurfaceNavType: object id", "level": "observed", "note": "RigidBodyComponent.GPSurfaceNavType, an embedded object of a class with no fields (u64 id, u32 class id)"}
  - {"at": 26, "size": 4, "type": "u32", "name": "GPSurfaceNavType: class id", "value": "0x1C4B22AA", "level": "observed", "note": "= 0x1C4B22AA, the class `GameplaySurfaceNavType`"}
  - {"at": 30, "size": 8, "type": "u64", "name": "RigidBody: object id", "level": "observed", "note": "RigidBodyComponent.RigidBody, an owned object (kind 0x13: u64 id, u32 class id, body); the id is non-zero"}
  - {"at": 38, "size": 4, "type": "u32", "name": "RigidBody: class id", "value": "0x228F402A", "level": "observed", "note": "= 0x228F402A, the class `RigidBody`"}
  - {"at": 42, "size": 8, "type": "u64", "name": "CollisionFilterInfo: object id", "level": "observed", "note": "RigidBody.13963E14, an embedded CollisionFilterInfo (the same class as CollisionMaterial's, whose slots are named in that box); 0"}
  - {"at": 50, "size": 4, "type": "u32", "name": "CollisionFilterInfo: class id", "value": "0x43EF99C2", "level": "observed", "note": "= 0x43EF99C2"}
  - {"at": 54, "size": 1, "type": "u8", "name": "642F141F", "level": "unknown", "note": "CollisionFilterInfo bool (name not found): 1 491,936, 0 36"}
  - {"at": 55, "size": 1, "type": "u8", "name": "4A4D57A9", "level": "unknown", "note": "CollisionFilterInfo bool (name not found): 1 491,936, 0 36"}
  - {"at": 56, "size": 8, "type": "u64", "name": "QueryFlags: object id", "level": "observed", "note": "0"}
  - {"at": 64, "size": 4, "type": "u32", "name": "QueryFlags: class id", "value": "0xA2FFD626", "level": "observed", "note": "= 0xA2FFD626, the class `QueryLayerBits`"}
  - {"at": 68, "size": 272, "type": "u64·34", "name": "QueryFlags slots", "level": "observed", "note": "34 u64 slots of QueryLayerBits; named slots include Static, Dynamic, CameraCollision and Raycast."}
  - {"at": 340, "size": 8, "type": "u64", "name": "DAE8214F: object id", "level": "unknown", "note": "0"}
  - {"at": 348, "size": 4, "type": "u32", "name": "DAE8214F: class id", "value": "0xF5EBC0BE", "level": "unknown", "note": "= 0xF5EBC0BE, the class `CollisionLayerBits`"}
  - {"at": 352, "size": 192, "type": "u64·24", "name": "DAE8214F slots", "level": "unknown", "note": "Stored field; complete meaning is not established."}
  - {"at": 544, "size": 8, "type": "u64", "name": "883E5FCA: object id", "level": "unknown", "note": "0"}
  - {"at": 552, "size": 4, "type": "u32", "name": "883E5FCA: class id", "value": "0xF5EBC0BE", "level": "unknown", "note": "= 0xF5EBC0BE"}
  - {"at": 556, "size": 192, "type": "u64·24", "name": "883E5FCA slots", "level": "unknown", "note": "the 24 bit slots of the second CollisionLayerBits. Set: Static 49,170; 89CA5860 49,170; Dynamic 2; Debris 1,168; DetectionZone 13; D0D6077F 11; 8025B1D3 11; WaterLevel 11; 901DDA28 2; TerrainLod0 4; 1F1A0AB5 797"}
  - {"at": 748, "size": 10, "type": "ref", "name": "Shape", "level": "observed", "note": "RigidBody.Shape (registry; a reference to an ObjectShape): MeshShape, SphereShape, ReferenceListShape, CapsuleShape or BoxShape. Tag 1 or 3 (null): 1 491,947, 3 25"}
  - {"at": 758, "size": 4, "type": "f32", "name": "Mass", "level": "observed", "note": "RigidBody.Mass: 10.0 491,970, 0.2 2"}
  - {"at": 762, "size": 4, "type": "f32", "name": "LinearDamping", "level": "observed", "note": "RigidBody.LinearDamping: 0.1 491,968, 0.8 2, 0.99 2"}
  - {"at": 766, "size": 4, "type": "f32", "name": "AngularDamping", "level": "observed", "note": "RigidBody.AngularDamping: 0.1 491,968, 0.9 4"}
  - {"at": 770, "size": 4, "type": "f32", "name": "GravityFactor", "level": "observed", "note": "RigidBody.GravityFactor: 1.0 491,972"}
  - {"at": 774, "size": 4, "type": "u32", "name": "DrivingMode", "level": "observed", "note": "RigidBody.DrivingMode (enum `RigidBody::DrivingMode`): Fixed 491,948, 256 20, 513 2. Enumerators: 0 Fixed, 1 KeyFramed, 2 Dynamic"}
  - {"at": 778, "size": 1, "type": "u8", "name": "1AD9BC48", "level": "unknown", "note": "RigidBody bool (name not found; the RigidBody's bit-field group is stored last): 0 491,972"}
  - {"at": 779, "size": 10, "type": "ref", "name": "ImpactData", "level": "observed", "note": "RigidBodyComponent.ImpactData (a reference): tag 3 491,968, 1 4 (3 = null)"}
  - {"at": 789, "size": 4, "type": "u32", "name": "B99D101E", "level": "unknown", "note": "RigidBodyComponent u32 (name not found): 0 491,968, 1 4"}
  - {"at": 793, "size": 1, "type": "u8", "name": "UseGravityWhenKeyFramed", "level": "observed", "note": "RigidBodyComponent bool 1 of the 5 stored bools (registry order, after the other fields): 0 491,972"}
  - {"at": 794, "size": 1, "type": "u8", "name": "FEB136EB", "level": "unknown", "note": "bool 2 (name not found): 0 491,972"}
  - {"at": 795, "size": 1, "type": "u8", "name": "AutoUpdatePhysicHierarchy", "level": "observed", "note": "bool 3: 1 491,970, 0 2"}
  - {"at": 796, "size": 1, "type": "u8", "name": "UpdateEntityBV", "level": "observed", "note": "bool 4: 0 491,964, 1 8"}
  - {"at": 797, "size": 1, "type": "u8", "name": "IsGround", "level": "observed", "note": "bool 5: 0 458,012, 1 33,960"}
  - {"at": 798, "size": 8, "type": "u64", "name": "Sleeping: object id", "level": "observed", "note": "RigidBodyComponent.Sleeping, an embedded RigidBodySleeping; the id is non-zero"}
  - {"at": 806, "size": 4, "type": "u32", "name": "Sleeping: class id", "value": "0x87BD5866", "level": "observed", "note": "= 0x87BD5866, the class `RigidBodySleeping`"}
  - {"at": 810, "size": 4, "type": "f32", "name": "7A3F735D", "level": "unknown", "note": "RigidBodySleeping f32 (name not found): 0.0 491,972"}
  - {"at": 814, "size": 4, "type": "f32", "name": "D38E02CF", "level": "unknown", "note": "RigidBodySleeping f32 (name not found): 0.0 491,972"}
  - {"at": 818, "size": 4, "type": "f32", "name": "E2C7281D", "level": "unknown", "note": "RigidBodySleeping f32 (name not found): 0.0 491,972"}
  - {"at": 822, "size": 4, "type": "u32", "name": "967B0AFB", "level": "unknown", "note": "RigidBodySleeping enum CB6326B3 (enumerators hash-only: 0 = 3F0755E0, 1 = 0D3657D0, 2 = 2E60A5CB): 0 491,972"}
  - {"at": 826, "size": 1, "type": "u8", "name": "GuidanceSystemPtr: tag", "level": "observed"}
  - {"at": 827, "size": "h", "type": "u64", "name": "GuidanceSystemPtr: id", "level": "observed", "note": "present when the tag is 05"}
  - {"at": "827+h", "size": 4, "type": "u32", "name": "SoundOcclusionLinks count", "level": "observed", "note": "RigidBodyComponent.SoundOcclusionLinks (an array of Entity links): its count, 0 491,972"}
  - {"at": "831+h", "size": 8, "type": "u64", "name": "PhysicsActivityZone: object id", "level": "observed", "note": "RigidBodyComponent.PhysicsActivityZone, an owned object (kind 0x13); non-zero"}
  - {"at": "839+h", "size": 4, "type": "u32", "name": "PhysicsActivityZone: class id", "value": "0x18D528B6", "level": "observed", "note": "= 0x18D528B6, the class `PhysicsActivityZone`"}
  - {"at": "843+h", "size": 4, "type": "u32", "name": "Zones count", "level": "observed", "note": "PhysicsActivityZone.Zones (an array of ActivityZoneDesc): its count, 0 491,971, 2 1"}
```

Usual body length is 847 or 855 bytes depending on a null/present handle. The final PhysicsActivityZone has a counted ActivityZoneDesc array, so these sizes are not universal: the high-resolution NPC puppet (`MAD_Entity_NPC_HighResPuppet`) carries two 27-byte items and totals 901 bytes. Each item is a u64 id, type `0x56F0AAEA` (ActivityZoneDesc), a u32, two f32 and three bytes; every other body stores a zero count. :observed

Some `MAD_COL_*` Entities have only RigidBodyComponent and no Visual. A closed-gate owner references `MAD_COL_GEN_MAM_Campus_ClosedGate_A`; these are invisible collision blockers rather than missing render meshes. Checked Area 52 and The Deck listings contain 44 and 12 such owners respectively. :observed

:::open[What are unusual DrivingMode values?]
Twenty-four measured bodies have values such as 256, 512 or 513 outside the ordinary named-mode profile. Their interpretation is unresolved. :unknown
:::
