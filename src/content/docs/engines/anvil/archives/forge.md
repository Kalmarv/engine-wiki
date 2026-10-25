---
title: "Forge archives"
description: "Version 27 headers, FileSets and parallel index and name tables."
games: ["riders-republic", "ghost-recon-breakpoint"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
  - title: Breakpoint format reference
    url: https://github.com/dataterminals/grb-modding-knowledgebase
    note: Community documentation and readers.
implementations:
  - name: "primase worlds/anvil (forge.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/forge.rs
---

A `.forge` stores resource entries and tables locating their bytes. In Riders Republic build 25394987 the six archives contain 1,301,684 entries. Index and name records correspond by position, with equal stored sizes row by row; their two id fields are not a join key. Every header and table of all six installed forges reads without refusals. :proven{games="riders-republic"}

Each of the six installed Riders Republic forges has one FileSet and next-FileSet offset `-1`. Breakpoint's community reference describes chained FileSets with up to 5,000 entries each; that limit is not established for Riders Republic. :proven{games="riders-republic"} :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"}

```layout
title: "Forge file header"
size: 33
games: [riders-republic]
note: "Little-endian. All six installed forges and all 1,301,684 index/name rows read without refusals; unnamed field meanings remain unknown."
fields:
  - {"at": 0, "size": 9, "type": "char[9]", "name": "magic", "value": "scimitar\\0", "level": "proven"}
  - {"at": 9, "size": 4, "type": "i32", "name": "version", "value": "27", "level": "proven"}
  - {"at": 13, "size": 8, "type": "u64", "name": "header size", "level": "proven", "note": "where DataHeader1 starts"}
  - {"at": 21, "size": 8, "type": "i64", "name": "unknown", "level": "unknown", "note": "observed 16"}
  - {"at": 29, "size": 4, "type": "i32", "name": "unknown", "level": "unknown", "note": "observed 1"}
```

```layout
title: "DataHeader1"
size: 44
games: [riders-republic]
note: "Little-endian. All six installed forges and all 1,301,684 index/name rows read without refusals; unnamed field meanings remain unknown."
fields:
  - {"at": 0, "size": 4, "type": "i32", "name": "entry count", "level": "proven"}
  - {"at": 4, "size": 16, "type": "i32[4]", "name": "unknown", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": 20, "size": 8, "type": "i64", "name": "unknown", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": 28, "size": 4, "type": "i32", "name": "MaxFilesForThisIndex", "level": "proven"}
  - {"at": 32, "size": 4, "type": "i32", "name": "FileSet count", "level": "proven", "note": "observed 1: one FileSet"}
  - {"at": 36, "size": 8, "type": "i64", "name": "DataHeader2 offset", "level": "proven"}
```

```layout
title: "DataHeader2"
size: 48
games: [riders-republic]
note: "Little-endian. All six installed forges and all 1,301,684 index/name rows read without refusals; unnamed field meanings remain unknown."
fields:
  - {"at": 0, "size": 4, "type": "i32", "name": "index count", "level": "proven"}
  - {"at": 4, "size": 4, "type": "i32", "name": "unknown", "level": "unknown", "note": "observed 2"}
  - {"at": 8, "size": 8, "type": "i64", "name": "index table offset", "level": "proven"}
  - {"at": 16, "size": 8, "type": "i64", "name": "next FileSet offset", "level": "proven", "note": "-1: none"}
  - {"at": 24, "size": 4, "type": "i32", "name": "index start", "level": "proven"}
  - {"at": 28, "size": 4, "type": "i32", "name": "index end", "level": "proven"}
  - {"at": 32, "size": 8, "type": "i64", "name": "name table offset", "level": "proven"}
  - {"at": 40, "size": 8, "type": "i64", "name": "unknown", "level": "unknown", "note": "observed: the name table's offset plus MaxFilesForThisIndex name records"}
```

```layout
title: "Index record"
size: 20
games: [riders-republic]
note: "Little-endian. All six installed forges and all 1,301,684 index/name rows read without refusals; unnamed field meanings remain unknown."
fields:
  - {"at": 0, "size": 8, "type": "i64", "name": "payload offset", "level": "proven"}
  - {"at": 8, "size": 8, "type": "u64", "name": "id", "level": "proven"}
  - {"at": 16, "size": 4, "type": "i32", "name": "payload size", "level": "proven"}
```

```layout
title: "Name record"
size: 192
games: [riders-republic]
note: "Little-endian. All six installed forges and all 1,301,684 index/name rows read without refusals; unnamed field meanings remain unknown."
fields:
  - {"at": 0, "size": 4, "type": "i32", "name": "size", "level": "proven"}
  - {"at": 4, "size": 8, "type": "u64", "name": "id", "level": "proven", "note": "a different field from the index record's id"}
  - {"at": 12, "size": 4, "type": "i32", "name": "unknown", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": 16, "size": 4, "type": "u32", "name": "type id", "level": "proven", "note": "CRC-32 of the type's name"}
  - {"at": 20, "size": 8, "type": "i32[2]", "name": "unknown", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": 28, "size": 12, "type": "i32[3]", "name": "unknown", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": 40, "size": 4, "type": "i32", "name": "timestamp", "level": "proven"}
  - {"at": 44, "size": 128, "type": "char[128]", "name": "name", "level": "proven", "note": "NUL-padded"}
  - {"at": 172, "size": 20, "type": "i32[5]", "name": "unknown", "level": "unknown", "note": "Stored bytes; meaning is not established."}
```

The index record is 20 bytes and the name record 192 bytes. The community Breakpoint description calls the offset-table record 192 bytes while listing fields totaling 20 bytes; the separately checked Riders Republic layout distinguishes the two tables. :proven{games="riders-republic"} :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"}

:::open[What do the unnamed container fields control?]
Their positions and values are readable, but constants and positional fits do not establish their purpose. Breakpoint tool field names are not independently established meanings for all Riders Republic fields. :unknown{games="riders-republic"}
:::
