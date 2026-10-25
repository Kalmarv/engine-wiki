---
title: "BuildTables"
description: "Typed rows, property paths and resource assembly tables."
games: ["riders-republic", "ghost-recon-breakpoint"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
  - title: Breakpoint format reference
    url: https://github.com/dataterminals/grb-modding-knowledgebase
    note: Community documentation and readers.
implementations:
  - name: "primase worlds/anvil (build_table.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/build_table.rs
---

BuildTable (`0x22ECBE63`) is a typed object graph of columns, rows, property paths and resource links. Riders Republic uses these tables for customization and settings, while Breakpoint's community tools expose them as editable assembly definitions. :observed{games="riders-republic"} :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"}

All 10,730 Riders Republic tables across DataPC, DataPC patch, USNAT, USNAT patch and base WhiteRoom consume exactly: 32,289 columns, 22,728 rows, 43,035 row properties and 14,632 DynamicResources objects containing 24,709 links. These counts include stored copies and do not denote unique parts or playable items. :proven{games="riders-republic"}

| Structure | Stored sequence in Riders Republic | Confidence |
|---|---|---|
| Table | Managed byte, column count / columns, row count / rows, four bytes, DynamicResources count / objects | :observed{games="riders-republic"} |
| BuildColumn `36839608` | Object header, ApplyPassBitField, PropertyPath, three u32, table pointer, declared typed value | :observed{games="riders-republic"} |
| PropertyPath `3C00B2E0` | Object header, node count / nodes, two bytes | :observed{games="riders-republic"} |
| PropertyPathNode `1A8750BA` | Object header, 41 bytes, optional solver object | :observed{games="riders-republic"} |
| BuildRow `348B28D6` | Object header, table pointer, f32 weight, BuildTag, BuildTags, property count / values | :observed{games="riders-republic"} |
| Row property | Column number u32, typed value | :observed{games="riders-republic"} |
| DynamicResources `DED3E212` | Object header, counted links | :observed{games="riders-republic"} |

```layout
title: "BuildTable typed value"
size: "12 + value bytes"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 4, "type": "u32", "name": "target class", "level": "observed"}
  - {"at": 4, "size": 2, "type": "u16", "name": "unknown", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": 6, "size": 4, "type": "u32", "name": "kind", "level": "observed", "note": "Low six bits select value grammar."}
  - {"at": 10, "size": 2, "type": "u16", "name": "unknown", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": 12, "size": "variable", "type": "bytes", "name": "value", "level": "observed", "note": "Scalar, link, resource reference or polymorphic object."}
```

The Riders Republic property-object profiles include SoundSwitch (33-byte body), KinoRTCPSetterEnum (19), KinoRTCPSetterBasicType (28), KinoReplaceIdentifier (28) and KinoLoadTagIdentifier (28). Solver bodies are 59 bytes for MaterialPropertyPathNodeSolver, 34 for VisualPropertyNodeSolver and six for ShaderConstantLayoutNodeSolver, measured on their occurrences. :observed{games="riders-republic"}

Breakpoint's exported XML distinguishes the root's 64-bit resource identity from file-local object handles such as `0xF8000000+`. These handle spaces must not be conflated. :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"}

:::open[What does each property path do at runtime?]
Typed values and cross-references establish storage. Every customization condition, row weight interpretation and property-path evaluator is not established by exact byte consumption. :unknown{games="riders-republic"}
:::

The six-archive inventory has 10,741 stored BuildTables; the 11 WhiteRoom-patch entries are outside the five-archive exact-end check above. :observed{games="riders-republic"}
