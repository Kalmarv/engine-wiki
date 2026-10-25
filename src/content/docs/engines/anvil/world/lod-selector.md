---
title: "LODSelector"
description: "Five descriptors, dependency-filled leading slots and distance fields."
games: ["riders-republic"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "primase worlds/anvil (lod.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/lod.rs
---

LODSelector describes five graphic-object levels, directly referenced or supplied by leading dependency meshes. All 48,862 selectors in the six-archive enumeration consume exactly with the counted BoneIDs array and footer: body size is `266 + 4 × sum(BoneIDs counts) + 13 × dependency count`. :proven

```layout
title: "LODSelector body (head)"
size: 12
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "ManagedObject byte", "value": "01", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": 1, "size": 1, "type": "u8", "name": "DescriptorMask", "level": "observed", "note": "registry field of GraphicObject, an 8-bit mask. 0 (44,945), 16 (2,594), 128 (660), 1 (658) over 48,857 selectors; the same byte of a Mesh takes 0, 1, 2, 8, 16, 17, 18, 32, 64, 128. What each bit selects is not established."}
  - {"at": 2, "size": 1, "type": "u8", "name": "Generated", "level": "observed", "note": "GraphicObject bool; 0 in all 48,857 selectors (and all 85,577 Meshes)"}
  - {"at": 3, "size": 1, "type": "u8", "name": "VertexStride", "level": "observed", "note": "GraphicObject bit field; 0 in all 48,857 selectors (and all 85,577 Meshes)"}
  - {"at": 4, "size": 4, "type": "f32", "name": "MaxCullingDistance", "level": "observed", "note": "GraphicObject f32; 0.0 in all 48,857 selectors (in Meshes: 660.0 on 2,729, 820.0 on 94, 2,580.0 on 35, 100.0 on 14 of 85,577)"}
  - {"at": 8, "size": 4, "type": "u32", "name": "EstimatedMemoryUsage", "value": "0", "level": "observed", "note": "GraphicObject.EstimatedMemoryUsage (u32, flags 0x02000000), the base class's last stored field after MaxCullingDistance; 0 in all 48,857 selectors"}
```

```layout
title: "Level (48 + 4n bytes, \u00d75)"
size: "48 + 4n bytes"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 8, "type": "u64", "name": "LODDescriptor object id", "level": "observed", "note": "the u64 id every embedded object starts with (kind 0x16: u64 id, u32 class id, body)."}
  - {"at": 8, "size": 4, "type": "u32", "name": "marker", "value": "0xA360319A", "level": "observed", "note": "the CRC-32 of `LODDescriptor`"}
  - {"at": 12, "size": 10, "type": "ref", "name": "Mesh", "level": "observed", "note": "the level's Mesh, or none"}
  - {"at": 22, "size": 4, "type": "f32", "name": "SwitchDistance", "level": "observed", "note": "LODDescriptor.SwitchDistance (registry): > 0 on 244,283 of 244,285 levels, up to 30,004 (USNAT)"}
  - {"at": 26, "size": 4, "type": "f32", "name": "TransitionZoneSize", "level": "observed", "note": "LODDescriptor.TransitionZoneSize: 0.0 on all 244,285 levels"}
  - {"at": 30, "size": 4, "type": "f32", "name": "FadeTimeMultiplier", "level": "observed", "note": "LODDescriptor.FadeTimeMultiplier: 1.0 on 103,967 of the 104,035 USNAT levels (0.0 on 62, 0.5 on 3, 3.0 on 1; 2 others)"}
  - {"at": 34, "size": 4, "type": "u32", "name": "FakeType", "level": "observed", "note": "LODDescriptor.FakeType (enum `LODDescriptor::FakeType`), a u32: 0 on 238,372 of 244,285 levels, 1 on 5,913 (levels 1 to 3 only)"}
  - {"at": 38, "size": 1, "type": "u8", "name": "Optional", "level": "observed"}
  - {"at": 39, "size": 4, "type": "u32", "name": "ShaderLOD", "level": "observed", "note": "LODDescriptor.ShaderLOD (enum `ShaderLODLevel`, u32): 0, 1 or 2; level 0: 0 on 32,069 and 1 on 16,788 of 48,857; level 3: 0 on 21,528, 2 on 16,769, 1 on 10,560 Enumerators: 0 ShaderLOD_High, 1 ShaderLOD_Low, 2 ShaderLOD_UltraLow."}
  - {"at": 43, "size": 4, "type": "u32", "name": "BoneIDs count n", "level": "observed", "note": "LODDescriptor.BoneIDs is an array of u32; its count: 0 to 136, > 0 on 13,424 of 244,285 levels (every one of the 48,857 selectors reads to its end with it)"}
  - {"at": 47, "size": "4·n", "type": "u32·n", "name": "BoneIDs", "level": "observed"}
  - {"at": "47+4n", "size": 1, "type": "u8", "name": "3B574E9D", "level": "unknown", "note": "Unnamed bool, one on 11,536 of 244,285 measured descriptor slots."}
```

```layout
title: "LODSelector footer (after the 5th level)"
size: "var"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 4, "type": "u32", "name": "count d", "level": "observed", "note": "1 or 2 in the traced samples"}
  - {"at": 4, "size": "9d", "type": "bytes", "name": "dependencies", "level": "observed"}
  - {"at": "4+9d", "size": 4, "type": "u32", "name": "count d again", "level": "observed", "note": "must equal d"}
  - {"at": "8+9d", "size": "4d", "type": "u32·d", "name": "dependency words", "level": "observed", "note": "one u32 per dependency."}
  - {"at": "8+13d", "size": 6, "type": "bytes", "name": "LODSelector bools", "level": "observed", "note": "the six bool fields of the class LODSelector in the registry's order: TransitionToEmptyLOD, UseNearNullObjects, ForceNoBlend, ForceNoComputeBlendFactor, UseBlendFactorWithDefaultTransition, 0xB0CD17D3 (name not found)."}
```

```layout
title: "Dependency (9 bytes, \u00d7d)"
size: 9
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "tag", "value": "0", "level": "observed"}
  - {"at": 1, "size": 8, "type": "u64", "name": "ClassID", "level": "observed"}
```

Every selector's dependency count equals its leading-empty-slot count. All 39,250 stored dependency occurrences resolve to Mesh resources. The patch-over-base deduplicated population instead contains 24,430 selectors and 19,623 dependencies; these are different counting units. :proven[slot relationship]

Across 244,310 slots, direct references include 123,716 Mesh and 238 Impostor references; four use mode four. A level is not restricted to Mesh. :observed

SwitchDistance, TransitionZoneSize, FadeTimeMultiplier, FakeType, Optional, ShaderLOD and BoneIDs are registry names checked against stored descriptors. Common switch-distance sets include `(25, 60, 120, 640, 641)` and `(4, 8, 20, 40, 160)` metres. Interpreting each distance as the end of its slot's display interval fits the ordering, but is not a complete renderer rule. :observed :inferred

Dependency words match compiled geometry size on 12,088 of 12,681 checked ranged dependencies. The mismatches prevent treating them as authoritative buffer lengths. :observed

:::open[How are distance fields converted into instance fade bands?]
The exact conversion to per-instance shader data and bool hash `0x3B574E9D` remain unresolved. :unknown
:::

See also [geometry LOD forms](/engines/anvil/geometry/lod/) for the meshes and impostors reached by these descriptors.
