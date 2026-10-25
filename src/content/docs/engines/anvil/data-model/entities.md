---
title: "Entities and groups"
description: "Entity framing, component headers, inline hierarchies and group members."
games: ["riders-republic"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "primase worlds/anvil (entity.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/entity.rs
---

An Entity combines placement, components, bounds, layer actions and optional reset data. EntityGroup adds a member list to that same prefix. The structural census reads all 615,110 Entity and 56,837 EntityGroup records when bodies without length rules are retained between recognized headers. This measures framing coverage, not complete component interpretation. :observed

The common prefix is `01 03`. In 830 bodies, `01 00` introduces an inline Hierarchy (`u64 + type 0x788BAA0D + 64 bytes`) and HierarchyHandle (`u64 + type 0x709FB9D4 + u32 + 9 bytes`) before the matrix. :observed

```layout
title: "Entity body with null Hierarchy"
size: "var"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "tag", "value": "01", "level": "observed"}
  - {"at": 1, "size": 1, "type": "u8", "name": "tag", "value": "03", "level": "observed"}
  - {"at": 2, "size": 64, "type": "matrix4", "name": "placement", "level": "observed", "note": "column-major; translation at 50..61; last row 0 0 0 1"}
  - {"at": 66, "size": 4, "type": "u32", "name": "component count n", "level": "observed"}
  - {"at": 70, "size": "C", "type": "bytes", "name": "components", "level": "observed", "note": "n × the Component box, in order"}
  - {"at": "70+C", "size": 43, "type": "bytes", "name": "run", "level": "observed", "note": "the Run box"}
  - {"at": "113+C", "size": 4, "type": "u32", "name": "FakeCellIndex", "level": "observed", "note": "Entity.FakeCellIndex (registry u32): 0xFFFFFFFF on 18,913 of 21,000, a cell index on 2,087"}
  - {"at": "117+C", "size": 4, "type": "f32", "name": "Scale", "level": "observed", "note": "uniform (registry Scale)"}
  - {"at": "121+C", "size": 40, "type": "bytes", "name": "bounds", "level": "observed", "note": "BoundingVolume, relative to the translation"}
  - {"at": "161+C", "size": 8, "type": "u64", "name": "EntityDescriptor id", "value": "0", "level": "observed"}
  - {"at": "169+C", "size": 4, "type": "u32", "name": "EntityDescriptor type", "value": "0x60121A9E", "level": "observed"}
  - {"at": "173+C", "size": 4, "type": "u32", "name": "DescriptorType", "level": "observed", "note": "EntityDescriptor.DescriptorType (enum, table not found): 0 on 20,995 of 21,000 sampled, 1 on 3, 3 on 1"}
  - {"at": "177+C", "size": 4, "type": "u32", "name": "SubDescriptorType", "level": "observed", "note": "EntityDescriptor.SubDescriptorType (u32): 0 on 20,999, 3 on 1"}
  - {"at": "181+C", "size": 4, "type": "u32", "name": "NetworkType", "level": "observed", "note": "EntityDescriptor.NetworkType (enum, table not found): 0 on 15,214, 1 on 5,781, 2 on 1"}
  - {"at": "185+C", "size": 1, "type": "u8", "name": "IsPickableByPlayer", "level": "observed", "note": "EntityDescriptor.IsPickableByPlayer (bool): 0 on all sampled"}
  - {"at": "186+C", "size": 8, "type": "u64", "name": "DataLayerFilter id", "value": "0", "level": "observed"}
  - {"at": "194+C", "size": 4, "type": "u32", "name": "DataLayerFilter type", "value": "0xDB1D406E", "level": "observed"}
  - {"at": "198+C", "size": 4, "type": "u32", "name": "action count k", "level": "observed"}
  - {"at": "202+C", "size": "25·k", "type": "bytes", "name": "DataLayerActions", "level": "observed", "note": "the DataLayerAction box: the event or season layers it belongs to"}
  - {"at": "202+C+25k", "size": 4, "type": "u32", "name": "UIVisualsDisplayOrder link count M", "level": "observed", "note": "M nine-byte links follow; offsets below assume M = 0."}
  - {"at": "206+C+25k", "size": "var", "type": "bytes", "name": "tail", "level": "observed", "note": "ResetData pointer: 03 null, or inline GameStateData."}
```

The count after DataLayer actions counts links: tag `00` or `01` plus u64. Nonzero counts shift ResetData beyond the zero-link offsets above. :observed

```layout
title: "Component (\u00d7n)"
size: "13 + body bytes"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "tag", "value": "04 or 00", "level": "observed"}
  - {"at": 1, "size": 8, "type": "u64", "name": "id", "level": "observed"}
  - {"at": 9, "size": 4, "type": "u32", "name": "type", "level": "observed"}
  - {"at": 13, "size": "var", "type": "bytes", "name": "body", "level": "observed", "note": "Type-specific grammar; no universal stored component length."}
```

Component headers normally use `04`, with `00` on some UI and embedded objects. The registry identifies 291 Component-derived classes. Ids need not be consecutive and can use high-bit encodings; proximity to the Entity id is not a valid boundary rule. :observed

135 component types comprising 105,315 instances remain opaque in the full structural census. Header-delimited coverage does not establish a sequential length rule for them. :observed

```layout
title: "EntityGroup body"
size: "variable"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": "E", "type": "bytes", "name": "Entity prefix", "level": "observed"}
  - {"at": "E", "size": 4, "type": "u32", "name": "member count C", "level": "observed"}
  - {"at": "E+4", "size": "10C", "type": "references", "name": "members", "level": "observed"}
  - {"at": "E+4+10C", "size": 4, "type": "u32", "name": "link count M", "level": "observed"}
  - {"at": "E+8+10C", "size": "9M", "type": "links", "name": "member links", "level": "observed"}
  - {"at": "E+8+10C+9M", "size": 4, "type": "u32", "name": "GroupOptimizationState", "level": "observed", "note": "0 NotOptimized, 1 OptimizedAndEditable, 2 OptimizedAndSealed."}
```


In the USNAT group census, 16,743 groups own Visuals; 1,485 groups list 3,847 members. Members also occur in checked cell listings, so membership alone does not establish another placement or a parent transform. A second counted link list can follow the members before the final group-optimization word; the early zero-link formula `12 + 10 × members` is not universal. :observed

See [visual instances](/engines/anvil/data-model/visual-instances/), [flags](/engines/anvil/data-model/entity-flags/), [component grammars](/engines/anvil/data-model/component-grammar/) and [DataLayers](/engines/anvil/world/data-layers/).

:::open[What do opaque and nested components contribute?]
Retaining their bytes does not establish their behavior. An embedded Entity header alone does not prove an independently rendered placement. :unknown
:::
