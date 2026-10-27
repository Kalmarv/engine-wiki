---
title: "Entities and groups"
description: "Entity framing, component headers, inline hierarchies and group members."
games: ["riders-republic", "shaun-white-skateboarding"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "anvil-formats (entity.rs)"
    url: https://github.com/Kalmarv/anvil-formats/blob/main/src/entity.rs
---

An Entity combines placement, components, bounds, layer actions and optional reset data. EntityGroup adds a member list to that same prefix. The structural census reads all 615,110 Entity and 56,837 EntityGroup records when bodies without length rules are retained between recognized headers. This measures framing coverage, not complete component interpretation. :observed

The common prefix is `01 03`. In 830 bodies, `01 00` introduces an inline Hierarchy (`u64 + type 0x788BAA0D + 64 bytes`) and HierarchyHandle (`u64 + type 0x709FB9D4 + u32 + 9 bytes`) before the matrix. :observed

```layout
title: "Entity body with null Hierarchy"
size: "var"
games: [riders-republic]
note: "Little-endian. Mechanical framing is proven on the strict six-archive profile: 585,234 Entity bodies consumed exactly, 29,876 refused; 38,825 EntityGroup bodies consumed exactly, 18,012 refused. Metadata-derived meanings and newer link variants retain their separate confidence."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "tag", "value": "01", "level": "proven"}
  - {"at": 1, "size": 1, "type": "u8", "name": "tag", "value": "03", "level": "proven"}
  - {"at": 2, "size": 64, "type": "matrix4", "name": "placement", "level": "observed", "note": "column-major; translation at 50..61; last row 0 0 0 1"}
  - {"at": 66, "size": 4, "type": "u32", "name": "component count n", "level": "proven"}
  - {"at": 70, "size": "C", "type": "bytes", "name": "components", "level": "proven", "note": "n × the Component box, in order"}
  - {"at": "70+C", "size": 43, "type": "bytes", "name": "run", "level": "proven", "note": "the Run box"}
  - {"at": "113+C", "size": 4, "type": "u32", "name": "FakeCellIndex", "level": "observed", "note": "Entity.FakeCellIndex (registry u32): 0xFFFFFFFF on 18,913 of 21,000, a cell index on 2,087"}
  - {"at": "117+C", "size": 4, "type": "f32", "name": "Scale", "level": "observed", "note": "uniform (registry Scale)"}
  - {"at": "121+C", "size": 40, "type": "bytes", "name": "bounds", "level": "observed", "note": "BoundingVolume, relative to the translation"}
  - {"at": "161+C", "size": 8, "type": "u64", "name": "EntityDescriptor id", "value": "0", "level": "proven"}
  - {"at": "169+C", "size": 4, "type": "u32", "name": "EntityDescriptor type", "value": "0x60121A9E", "level": "proven"}
  - {"at": "173+C", "size": 4, "type": "u32", "name": "DescriptorType", "level": "observed", "note": "EntityDescriptor.DescriptorType (enum, table not found): 0 on 20,995 of 21,000 sampled, 1 on 3, 3 on 1"}
  - {"at": "177+C", "size": 4, "type": "u32", "name": "SubDescriptorType", "level": "observed", "note": "EntityDescriptor.SubDescriptorType (u32): 0 on 20,999, 3 on 1"}
  - {"at": "181+C", "size": 4, "type": "u32", "name": "NetworkType", "level": "observed", "note": "EntityDescriptor.NetworkType (enum, table not found): 0 on 15,214, 1 on 5,781, 2 on 1"}
  - {"at": "185+C", "size": 1, "type": "u8", "name": "IsPickableByPlayer", "level": "observed", "note": "EntityDescriptor.IsPickableByPlayer (bool): 0 on all sampled"}
  - {"at": "186+C", "size": 8, "type": "u64", "name": "DataLayerFilter id", "value": "0", "level": "proven"}
  - {"at": "194+C", "size": 4, "type": "u32", "name": "DataLayerFilter type", "value": "0xDB1D406E", "level": "proven"}
  - {"at": "198+C", "size": 4, "type": "u32", "name": "action count k", "level": "proven"}
  - {"at": "202+C", "size": "25·k", "type": "bytes", "name": "DataLayerActions", "level": "proven", "note": "the DataLayerAction box: the event or season layers it belongs to"}
  - {"at": "202+C+25k", "size": 4, "type": "u32", "name": "UIVisualsDisplayOrder link count M", "level": "observed", "note": "M nine-byte links follow; offsets below assume M = 0."}
  - {"at": "206+C+25k", "size": "var", "type": "bytes", "name": "tail", "level": "observed", "note": "ResetData pointer: 03 null, or inline GameStateData."}
```

The count after DataLayer actions counts links: tag `00` or `01` plus u64. Nonzero counts shift ResetData beyond the zero-link offsets above. :observed

```layout
title: "Component (\u00d7n)"
size: "13 + body bytes"
games: [riders-republic]
note: "Little-endian. Mechanical framing is proven on the strict six-archive profile: 585,234 Entity bodies consumed exactly, 29,876 refused; 38,825 EntityGroup bodies consumed exactly, 18,012 refused. Metadata-derived meanings and newer link variants retain their separate confidence."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "tag", "value": "04 or 00", "level": "proven"}
  - {"at": 1, "size": 8, "type": "u64", "name": "id", "level": "proven"}
  - {"at": 9, "size": 4, "type": "u32", "name": "type", "level": "proven"}
  - {"at": 13, "size": "var", "type": "bytes", "name": "body", "level": "proven", "note": "Type-specific grammar; no universal stored component length."}
```

Component headers normally use `04`, with `00` on some UI and embedded objects. The registry identifies 291 Component-derived classes. Ids need not be consecutive and can use high-bit encodings; proximity to the Entity id is not a valid boundary rule. Component ids are 41-bit numbers, a few stored as `bit63 | number << 20 | small index`, and ids within one Entity differ by up to about 1.8e12. Because `00`-tagged embedded objects inside payloads look like headers, counts and the first component's tag are needed to tell them apart. :observed

135 component types comprising 105,315 instances remain opaque in the full structural census. Header-delimited coverage does not establish a sequential length rule for them. :observed

```layout
title: "EntityGroup body"
size: "variable"
games: [riders-republic]
note: "Little-endian. Mechanical framing is proven on the strict six-archive profile: 585,234 Entity bodies consumed exactly, 29,876 refused; 38,825 EntityGroup bodies consumed exactly, 18,012 refused. Metadata-derived meanings and newer link variants retain their separate confidence."
fields:
  - {"at": 0, "size": "E", "type": "bytes", "name": "Entity prefix", "level": "proven"}
  - {"at": "E", "size": 4, "type": "u32", "name": "member count C", "level": "proven"}
  - {"at": "E+4", "size": "10C", "type": "references", "name": "members", "level": "proven"}
  - {"at": "E+4+10C", "size": 4, "type": "u32", "name": "link count M", "level": "observed"}
  - {"at": "E+8+10C", "size": "9M", "type": "links", "name": "member links", "level": "observed"}
  - {"at": "E+8+10C+9M", "size": 4, "type": "u32", "name": "GroupOptimizationState", "level": "observed", "note": "0 NotOptimized, 1 OptimizedAndEditable, 2 OptimizedAndSealed."}
```


In the USNAT group census, 16,743 groups own Visuals; 1,485 groups list 3,847 members. Members also occur in checked cell listings, so membership alone does not establish another placement or a parent transform. A second counted link list can follow the members before the final group-optimization word; the early zero-link formula `12 + 10 × members` is not universal. :observed

See [visual instances](/engines/anvil/data-model/visual-instances/), [flags](/engines/anvil/data-model/entity-flags/), [component grammars](/engines/anvil/data-model/component-grammar/) and [DataLayers](/engines/anvil/world/data-layers/).

:::open[What do opaque and nested components contribute?]
Retaining their bytes does not establish their behavior. An embedded Entity header alone does not prove an independently rendered placement. :unknown
:::

The strict sequential profile consumes exactly 585,234 Entity and 38,825 EntityGroup bodies from the complete six-archive census, refusing 29,876 and 18,012 respectively. That proves the accepted framing only. The later header-delimited opaque-body census above does not establish those missing component grammars. :proven[accepted strict profile]

## Shaun White Skateboarding

:only[shaun-white-skateboarding]

A level cell holds Entity objects that carry a world matrix, a list of components and a bounding volume. The layout has no layer actions and no 64-bit ids; it follows the Assassin's Creed II generation. :inferred[from the AC2-profile reader fitting its data]

```layout
title: "Shaun White Entity body"
size: "variable"
games: [shaun-white-skateboarding]
note: "Little-endian. Sequential decoding reaches the last byte for 3,316 of 6,861 entities of level 01 and 15,889 of 31,577 in all forges; the flag bytes through the tail verify on 6,758 of level 01."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "managed", "level": "observed"}
  - {"at": 1, "size": 4, "type": "u32", "name": "id", "level": "observed"}
  - {"at": 5, "size": 4, "type": "u32", "name": "class", "value": "0x0984415E", "level": "proven", "note": "CRC-32 of Entity"}
  - {"at": 9, "size": 64, "type": "f32[16]", "name": "GlobalMatrix", "level": "observed"}
  - {"at": 73, "size": "var", "type": "pointer", "name": "Hierarchy", "level": "observed", "note": "null (tag 3) on 6,857 of the 6,861 entities of level 01, inline on 4"}
  - {"at": "73+h", "size": "var", "type": "u32 + objects", "name": "Components", "level": "observed", "note": "count, then for each a pointer tag 0 and the inline object"}
  - {"at": "var", "size": 34, "type": "u8[34]", "name": "flag bytes", "level": "unknown", "note": "named only by position"}
  - {"at": "var", "size": "var", "type": "BoundingVolume", "name": "bounds", "level": "observed", "note": "Min v3, Max v3, enum; world axes, relative to the origin"}
  - {"at": "var", "size": 12, "type": "bytes", "name": "EntityDescriptor", "level": "unknown"}
  - {"at": "var", "size": 2, "type": "u8[2]", "name": "null pointers", "value": "03 03", "level": "observed"}
  - {"at": "var", "size": "var", "type": "GameStateData", "name": "ResetData", "level": "observed", "note": "u32, then two byte arrays"}
  - {"at": "var", "size": 16, "type": "bytes", "name": "tail", "level": "unknown"}
```

The matrix is applied as `world = v_local * M`, with the 16 `f32` of `M` stored as rows 0 to 2 for the local X, Y and Z axes in world space and row 3 for the origin. Z is up. For 178 entities turned 90 degrees, the entity's bounding volume equals the box of its mesh bounds transformed this way to within 0.5 m, where the transposed reading fits none. :observed[178 rotated entities of level 01]

The translations of the entities of one cell cluster in 32 m squares. :observed

Coverage is partial: components of classes with no known layout stop sequential decoding of the other 3,545 entities of level 01. The classes that stop the most are `0x5CDCA222` (661 entities; the skate guidance system), `0xE7E3A114` (524), `0x0873AE87` (300), `0x19D48AF6` (255) and `0xA0933257` (246). :observed[level 01]

:::open[Which components remain without a layout?]
Components of the classes `0xE7E3A114`, `0x0873AE87`, `0x19D48AF6`, `0xA0933257`, `0x089D59CA`, `0x734E7ADA` and `0x51734E21`, and classes such as `Scene`, `Trajectory` and `TriggerComponent`, do not decode field by field. The 34 flag bytes, the 12-byte descriptor and the 16-byte tail of the Entity are not interpreted. :unknown
:::
