---
title: "Visuals and mesh instances"
description: "Visual references, LOD slots, instance matrices and material replacements."
games: ["riders-republic"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "primase worlds/anvil (entity.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/entity.rs
---

A Visual names a graphic object and its instance data. The common path is Visual → LODSelectorInstance → MeshInstanceData; direct MeshInstanceData also occurs. Five instance slots align to five selector descriptors in all 2,839 sampled selector instances. :observed

```layout
title: "Visual / StaticDecalComponent body"
size: "var"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "ManagedObject byte", "level": "unknown", "note": "0 on all"}
  - {"at": 1, "size": 1, "type": "u8", "name": "Active", "level": "observed"}
  - {"at": 2, "size": 1, "type": "u8", "name": "IsAnOptimizedComponent", "level": "observed"}
  - {"at": 3, "size": 1, "type": "u8", "name": "IsPartiallyOptimized", "level": "observed", "note": "Component.IsPartiallyOptimized: 0 on nearly all"}
  - {"at": 4, "size": 10, "type": "ref", "name": "object", "level": "observed", "note": "what it shows: a LODSelector on most, a Mesh on some; or none (03)"}
  - {"at": 14, "size": 1, "type": "u8", "name": "instance tag", "level": "observed", "note": "00: an instance object follows; 03: none, the tail follows at 15"}
  - {"at": 15, "size": 8, "type": "u64", "name": "instance id", "level": "observed"}
  - {"at": 23, "size": 4, "type": "u32", "name": "instance type", "level": "observed", "note": "LODSelectorInstance 0x01437462, MeshInstanceData 0x536E963B, LightInstance 0x554C614C (311 bytes, tail included), SplashFXInstanceData 0xB8B08A89"}
  - {"at": 27, "size": "var", "type": "bytes", "name": "instance body", "level": "observed", "note": "by its type (the LODSelectorInstance and MeshInstanceData boxes)"}
  - {"at": "var", "size": 125, "type": "bytes", "name": "Visual tail", "level": "observed", "note": "the Visual tail box (none after a LightInstance)"}
```

```layout
title: "LODSelectorInstance (after its header)"
size: "var"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 4, "type": "u32", "name": "instance count k", "level": "observed"}
  - {"at": 4, "size": "64Â·k", "type": "matrix4Â·k", "name": "instance matrices", "level": "observed", "note": "column-major; none: placed once by its owner"}
  - {"at": "4+64k", "size": 40, "type": "bytes", "name": "bounds", "level": "observed", "note": "BoundingVolume"}
  - {"at": "44+64k", "size": 10, "type": "bytes", "name": "InstanceShaderConstants pointer, LODSelector link", "level": "observed", "note": "the 10 bytes are GraphicObjectInstanceData.InstanceShaderConstants (a pointer, 03 = null) and LODSelectorInstance.LODSelector (a 9-byte link: tag 01 + the LODSelector's id): (03, 01) on 624,564 of 624,564"}
  - {"at": "54+64k", "size": "var", "type": "bytes", "name": "five level slots", "level": "observed", "note": "each 03 (empty), or 00 + u64 + u32 type and the slot's body: MeshInstanceData 0x536E963B or ImpostorInstanceData 0xB3F06BC3"}
```

```layout
title: "MeshInstanceData (after its header)"
size: "89 + 64n + 41a + 40b bytes"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 4, "type": "u32", "name": "instance count n", "level": "observed"}
  - {"at": 4, "size": "64Â·n", "type": "matrix4Â·n", "name": "instance matrices", "level": "observed", "note": "column-major"}
  - {"at": "4+64n", "size": 40, "type": "bytes", "name": "bounds", "level": "observed", "note": "BoundingVolume"}
  - {"at": "44+64n", "size": 1, "type": "u8", "name": "InstanceShaderConstants pointer", "level": "observed", "note": "GraphicObjectInstanceData.InstanceShaderConstants (a pointer): 03 = null"}
  - {"at": "45+64n", "size": 1, "type": "u8", "name": "IsFake", "level": "observed", "note": "MeshInstanceData.IsFake (bool): 1 on 2,036 of 2,195"}
  - {"at": "46+64n", "size": 1, "type": "u8", "name": "IsNearFake", "level": "observed", "note": "MeshInstanceData.IsNearFake (bool): 1 on 0 of 2,195"}
  - {"at": "47+64n", "size": 4, "type": "u32", "name": "FakeMeshIndex", "level": "observed", "note": "MeshInstanceData.FakeMeshIndex (u32): non-zero on 2,034 of 2,195 (e.g. 434 with IsFake)"}
  - {"at": "51+64n", "size": 1, "type": "u8", "name": "CompiledMeshInstance pointer tag", "level": "observed", "note": "00 (present); the pointer's class id is the next u32"}
  - {"at": "52+64n", "size": 8, "type": "u64", "name": "CompiledMeshInstance: object id", "level": "observed", "note": "0"}
  - {"at": "60+64n", "size": 4, "type": "u32", "name": "CompiledMeshInstance type", "value": "0x4368101B", "level": "observed"}
  - {"at": "64+64n", "size": 1, "type": "u8", "name": "VertexFormat", "level": "observed", "note": "CompiledMeshInstance.VertexFormat (registry byte): 11 2,036, 0 103, 2 46"}
  - {"at": "65+64n", "size": 4, "type": "u32", "name": "Streams count", "level": "observed", "note": "CompiledMeshInstance.Streams (array of CompiledMeshInstanceStream): count 0 2,195"}
  - {"at": "69+64n", "size": 4, "type": "u32", "name": "PlatformVersion", "level": "observed", "note": "CompiledMeshInstance.PlatformVersion: 31 2,195"}
  - {"at": "73+64n", "size": 8, "type": "u64", "name": "MeshHash", "level": "observed", "note": "CompiledMeshInstance.MeshHash (u64): non-zero on 2,195 of 2,195"}
  - {"at": "81+64n", "size": 4, "type": "u32", "name": "material-info count a", "level": "observed"}
  - {"at": "85+64n", "size": "41Â·a", "type": "bytes", "name": "material infos", "level": "observed", "note": "the Material info box"}
  - {"at": "85+64n+41a", "size": 4, "type": "u32", "name": "instance bounds count b", "level": "observed"}
  - {"at": "89+64n+41a", "size": "40Â·b", "type": "bytes", "name": "instance bounds", "level": "observed", "note": "BoundingVolume per instance"}
```

```layout
title: "Material info (41 bytes, \u00c3\u2014a)"
size: 41
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "tag", "value": "00", "level": "observed"}
  - {"at": 1, "size": 8, "type": "u64", "name": "id", "level": "observed"}
  - {"at": 9, "size": 4, "type": "u32", "name": "type", "value": "0x995BFBF5", "level": "observed"}
  - {"at": 13, "size": 1, "type": "u8", "name": "tag", "value": "02", "level": "observed"}
  - {"at": 14, "size": 8, "type": "u64", "name": "owner", "level": "observed"}
  - {"at": 22, "size": 1, "type": "u8", "name": "tag", "value": "00", "level": "observed"}
  - {"at": 23, "size": 8, "type": "u64", "name": "source Material", "level": "observed"}
  - {"at": 31, "size": 2, "type": "bytes", "name": "tag", "value": "01 01", "level": "observed"}
  - {"at": 33, "size": 8, "type": "u64", "name": "replacement Material", "level": "observed"}
```

```layout
title: "ImpostorInstanceData (after its header)"
size: "54 + 64n bytes"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 4, "type": "u32", "name": "instance count n", "level": "observed"}
  - {"at": 4, "size": "64Â·n", "type": "matrix4Â·n", "name": "instance matrices", "level": "observed"}
  - {"at": "4+64n", "size": 40, "type": "bytes", "name": "bounds", "level": "observed", "note": "BoundingVolume"}
  - {"at": "44+64n", "size": 10, "type": "bytes", "name": "impostor", "level": "observed", "note": "kept as stored: 03 00 + an Impostor's ClassID"}
```

Material-info entries identify a source Material ClassID and replacement Material ClassID, rather than an ordinal mesh range. Replacement modes `01 01` and `01 04` occur. :observed

The ten bytes after LODSelectorInstance bounds are a null InstanceShaderConstants pointer (`03`) and nine-byte selector link (`01 + id`) on 624,564 checked instances. They are not a ten-byte resource reference. :observed

The standard Visual tail is 125 bytes when its optional pointer is null. Its last 32 bytes are VisualShaderConstants data, interpreted by DataLayout; they are not universally a tint color. Material-layout values occur on user-content editor props, while the default view usually ends in four f32 ones. :observed

```layout
title: "Visual tail (125 bytes)"
size: 125
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "CanBeOccluder", "level": "observed", "note": "Visual bool 1 of the 4 stored bools (registry order): see the pattern below"}
  - {"at": 1, "size": 1, "type": "u8", "name": "HasUnshareContext", "level": "observed", "note": "Visual bool 2"}
  - {"at": 2, "size": 1, "type": "u8", "name": "OptimizedPackedLOD", "level": "observed", "note": "Visual bool 3"}
  - {"at": 3, "size": 1, "type": "u8", "name": "CopyInstanceDataOnDuplicate", "level": "observed", "note": "Visual bool 4. The four bytes: 01000000 630,674, 00000000 12"}
  - {"at": 4, "size": 4, "type": "u32", "name": "DisplayOrder", "level": "observed", "note": "Visual.DisplayOrder (a u32 bit field): 0 630,684, 1 2"}
  - {"at": 8, "size": 1, "type": "u8", "name": "pointer tag", "level": "observed", "note": "a pointer field not in the class list (03 = null on all read)"}
  - {"at": 9, "size": 8, "type": "bytes", "name": "unaccounted", "level": "unknown", "note": "zero (0000000000000000 630,686)"}
  - {"at": 17, "size": 8, "type": "u64", "name": "VisualShaderConstants: object id", "level": "observed", "note": "0 on all"}
  - {"at": 25, "size": 4, "type": "u32", "name": "VisualShaderConstants: class id", "value": "0xBFF5DF99", "level": "observed", "note": "= 0xBFF5DF99"}
  - {"at": 29, "size": 4, "type": "u32", "name": "DataLayout", "level": "observed", "note": "VisualShaderConstants.DataLayout (enum `VisualShaderConstants::Layout`): 0 607,490, 4 22,976, 3 210. Enumerators: 0 VSC_DefaultLayout, 1 VSC_UILayout, 2 VSC_SkinLayout, 3 and 4 hash-only"}
  - {"at": 33, "size": 8, "type": "u64", "name": "DefaultLayout: object id", "level": "observed", "note": "0"}
  - {"at": 41, "size": 4, "type": "u32", "name": "DefaultLayout: class id", "value": "0xD74FA591", "level": "observed", "note": "= 0xD74FA591 (no stored fields)"}
  - {"at": 45, "size": 8, "type": "u64", "name": "UILayout: object id", "level": "observed", "note": "0"}
  - {"at": 53, "size": 4, "type": "u32", "name": "UILayout: class id", "value": "0x9FAF160F", "level": "observed", "note": "= 0x9FAF160F (no stored fields)"}
  - {"at": 57, "size": 8, "type": "u64", "name": "SkinLayout: object id", "level": "observed", "note": "0"}
  - {"at": 65, "size": 4, "type": "u32", "name": "SkinLayout: class id", "value": "0x605001B7", "level": "observed", "note": "= 0x605001B7 (no stored fields)"}
  - {"at": 69, "size": 8, "type": "u64", "name": "62FA1E14 (GearLayout): object id", "level": "observed", "note": "0"}
  - {"at": 77, "size": 4, "type": "u32", "name": "GearLayout: class id", "value": "0xF54C16B8", "level": "observed", "note": "= 0xF54C16B8 (no stored fields)"}
  - {"at": 81, "size": 8, "type": "u64", "name": "2C2D56DE (MaterialLayout): object id", "level": "observed", "note": "0"}
  - {"at": 89, "size": 4, "type": "u32", "name": "MaterialLayout: class id", "value": "0xF977AE02", "level": "observed", "note": "= 0xF977AE02 (no stored fields)"}
  - {"at": 93, "size": 16, "type": "u32Â·4", "name": "VisualShaderConstants data, first 16 bytes", "level": "observed", "note": "The 32 bytes at 93..124 are the data block of the embedded VisualShaderConstants (0xBFF5DF99, class size 0x40): its five layout classes have only accessor fields (flags 0x1C, storage 0), views of one block, and DataLayout says which…"}
  - {"at": 109, "size": 16, "type": "f32Â·4", "name": "VisualShaderConstants data, last 16 bytes", "level": "observed", "note": "four f32. DataLayout 0: (1, 1, 1, 1) on 607,468 of 607,490 (10, 20 or 1.2 x 3 on 21; Vector4_1 by the class list). DataLayout 4 (the UGE props): a grey multiplier (g, g, g, 1), g from 0.5 to 2.49 (2.49 on 678, 2.41 on 403, 2.42 on 310,…"}
```

:::open[How do all shader-constant views affect rendering?]
Registry names and sampled values identify the views, but the material view's exact channel meanings and non-null optional-pointer variants remain incomplete. :unknown
:::
