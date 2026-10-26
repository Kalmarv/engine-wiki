---
title: "Entity flags and bounds"
description: "The flag run, culling multipliers and BoundingVolume."
games: ["riders-republic"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "primase worlds/anvil (entity.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/entity.rs
---

After its components an Entity stores a 43-byte run of flags, enums and multipliers, then FakeCellIndex, Scale and BoundingVolume. Registry names identify the run; byte patterns in 21,000 sampled Entities support its field order. :observed

```layout
title: "BoundingVolume (40 bytes)"
size: 40
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 8, "type": "u64", "name": "id", "level": "observed"}
  - {"at": 8, "size": 4, "type": "u32", "name": "type", "value": "0x4AEC3476", "level": "observed"}
  - {"at": 12, "size": 12, "type": "f32·3", "name": "minimum", "level": "observed", "note": "x, y, z; an Entity's own bounds are relative to its translation"}
  - {"at": 24, "size": 12, "type": "f32·3", "name": "maximum", "level": "observed"}
  - {"at": 36, "size": 4, "type": "u32", "name": "Type", "level": "observed", "note": "BoundingVolume.Type (enum `BoundingVolume::BVType`): 0 AABBox on 15,190 of 21,000, 2 OOBBox on 5,809, 1 Sphere on 1"}
```

```layout
title: "Run (43 bytes, after the components)"
size: 43
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "SkipGroupMatrixUpdate", "level": "observed", "note": "Entity bool 1 of the serialized run (registry order); 0 on all"}
  - {"at": 1, "size": 1, "type": "u8", "name": "IsGraphicsUnitTestCameraReferencePosition", "level": "observed", "note": "Entity bool 2 of the serialized run (registry order); 0 on all"}
  - {"at": 2, "size": 1, "type": "u8", "name": "IsMovable", "level": "observed", "note": "Entity bool 3 of the serialized run (registry order); 1 on 22 of 21,000"}
  - {"at": 3, "size": 1, "type": "u8", "name": "IsPhantom", "level": "observed", "note": "Entity bool 4 of the serialized run (registry order); 1 on 6,006"}
  - {"at": 4, "size": 1, "type": "u8", "name": "IsHidden", "level": "observed", "note": "Entity bool 5 of the serialized run (registry order); 1 on 383"}
  - {"at": 5, "size": 4, "type": "u32", "name": "2B4BF1D9", "level": "unknown", "note": "Entity enum (target 0x060EC220, name not found; its table was not found in the image): low byte 4 on 10,951, 0 on 5,475, 3 on 1,749, 2 on 1,404, 1 on 1,402."}
  - {"at": 9, "size": 1, "type": "u8", "name": "RenderLast", "level": "observed", "note": "Entity bool (registry order); 1 on all 512 FakeWaterMeshComponent Entities, so bytes 6-10 are 00 00 00 01 00 there rather than zero"}
  - {"at": 10, "size": 1, "type": "u8", "name": "ForceIncludedInReflection", "level": "observed", "note": "Entity bool (registry order); 1 on 18"}
  - {"at": 11, "size": 1, "type": "u8", "name": "ForceExcludedFromReflection", "level": "observed", "note": "Entity bool (registry order); 1 on 20,894 (0 on 103)"}
  - {"at": 12, "size": 1, "type": "u8", "name": "IsCharacter", "level": "observed", "note": "Entity bool (registry order); 1 on 5"}
  - {"at": 13, "size": 1, "type": "u8", "name": "ShadowCaster", "level": "observed", "note": "Entity bool (registry order); 1 on 20,964"}
  - {"at": 14, "size": 1, "type": "u8", "name": "DynamicLightsReceiver", "level": "observed", "note": "Entity bool (registry order); 1 on 20,968"}
  - {"at": 15, "size": 1, "type": "u8", "name": "UseVisibilityQueries", "level": "observed", "note": "Entity bool (registry order); 1 on 20,959"}
  - {"at": 16, "size": 1, "type": "u8", "name": "VisibilityOccluder", "level": "observed", "note": "Entity bool (registry order); 1 on 383"}
  - {"at": 17, "size": 1, "type": "u8", "name": "AlwaysVisibilityOccluder", "level": "observed", "note": "Entity bool (registry order); 0 on all"}
  - {"at": 18, "size": 1, "type": "u8", "name": "IgnoreOcclusionForLODLevel", "level": "observed", "note": "Entity bool (registry order); 1 on 13"}
  - {"at": 19, "size": 4, "type": "u32", "name": "EntityCategory", "level": "observed", "note": "Entity enum `Entity::EntityCategory` (table not found): low byte 19 on 10,634, 0 on 10,203, 6 on 79, 4 on 75, 21 on 4, 1 on 4"}
  - {"at": 23, "size": 1, "type": "u8", "name": "UserMask1", "level": "observed", "note": "Entity bool: 0 on all"}
  - {"at": 24, "size": 1, "type": "u8", "name": "UserMask2", "level": "observed", "note": "Entity bool: 0 on all"}
  - {"at": 25, "size": 1, "type": "u8", "name": "UserMask3", "level": "observed", "note": "Entity bool: 0 on all"}
  - {"at": 26, "size": 1, "type": "u8", "name": "UserMask4", "level": "observed", "note": "Entity bool: 0 on all"}
  - {"at": 27, "size": 1, "type": "u8", "name": "UserMask5", "level": "observed", "note": "Entity bool: 0 on all"}
  - {"at": 28, "size": 1, "type": "u8", "name": "89EC9FA8", "level": "unknown", "note": "Entity bool (name not found): 1 on 10,079"}
  - {"at": 29, "size": 1, "type": "u8", "name": "IsExcludedFromParentBV", "level": "observed", "note": "Entity bool: 1 on 560"}
  - {"at": 30, "size": 4, "type": "u32", "name": "UICategory", "level": "observed", "note": "Entity enum `Entity::UICategory` (table not found): low byte 0 on 15,231, 1 on 5,350, 6 on 238, 3 on 88, 5 on 86, 2 on 6"}
  - {"at": 34, "size": 1, "type": "u8", "name": "UIFlag", "level": "observed", "note": "Entity bool: 1 on 17"}
  - {"at": 35, "size": 4, "type": "f32", "name": "WetnessBias", "level": "observed", "note": "Entity f32: 0.0 on all"}
  - {"at": 39, "size": 4, "type": "f32", "name": "CullDistanceMultiplier", "level": "observed", "note": "Entity f32: 1.0 on 20,977, 0.0 on 20"}
```

IsHidden and IsPhantom occur on UI/helper objects in checked area listings. Their names alone do not establish exclusion from every renderer path. Checked static-prop bounds are relative to translation in the source z-up frame. :observed

FakeCellIndex commonly equals `0xFFFFFFFF`; non-sentinel values relate to [far-view object cells](/engines/anvil/world/far-view/). :observed

:::open[What are the unnamed Entity fields?]
Enum hash `0x2B4BF1D9` and bool hash `0x89EC9FA8` lack semantic names; complete EntityCategory and UICategory enumerator tables are not established. :unknown
:::
