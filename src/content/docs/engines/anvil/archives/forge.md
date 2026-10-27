---
title: "Forge archives"
description: "Version 26 and 27 headers, FileSets, parallel index and name tables, and version 26 entry headers."
games: ["riders-republic", "ghost-recon-breakpoint", "shaun-white-skateboarding"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
  - title: Breakpoint format reference
    url: https://github.com/dataterminals/grb-modding-knowledgebase
    note: Community documentation and readers.
implementations:
  - name: "anvil-formats (forge.rs)"
    url: https://github.com/Kalmarv/anvil-formats/blob/main/src/forge.rs
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

## Shaun White Skateboarding

:only[shaun-white-skateboarding]

Shaun White Skateboarding's 33 forges are version 26. They keep the `scimitar` signature, the DataHeader1, DataHeader2, index and name tables and one FileSet, but every record is narrower, and each entry begins with a `FILEDATA` header that version 27 does not have. The header size is 1046 (0x416) in all 33 forges. All 33 forges and their 3,894 entries read with no refusals: counts agree, tables correspond row by row, every payload lies inside its file and its entry header agrees with both tables. :proven{games="shaun-white-skateboarding"}[every forge of the install]

| Structure | Version 27 | Version 26 | Confidence |
|---|---|---|---|
| File header, bytes 21 to 33 | `i64` 16, `i32` 1 | three `i32`: 16, 1, 0 | :proven{games="shaun-white-skateboarding"}[all 33 forges] |
| DataHeader1 | 44 bytes, four unnamed `i32` | 40 bytes, three unnamed `i32` | :proven{games="shaun-white-skateboarding"}[all 33 forges] |
| DataHeader2 | 48 bytes | 48 bytes, same fields | :proven{games="shaun-white-skateboarding"}[all 33 forges] |
| Index range (`index end` minus `index start`) | the index count | `MaxFilesForThisIndex` minus 1 | :proven{games="shaun-white-skateboarding"}[all 33 forges] |
| Index record | 20 bytes, `u64` id | 16 bytes, `u32` id | :proven{games="shaun-white-skateboarding"}[all 33 forges] |
| Name record | 192 bytes | 188 bytes | :proven{games="shaun-white-skateboarding"}[all 33 forges] |
| Name record type id | CRC-32 of the type name | 0 in every record | :proven{games="shaun-white-skateboarding"}[all 33 forges] |

```layout
title: "Version 26 index record"
size: 16
games: [shaun-white-skateboarding]
note: "Little-endian. All 3,894 records of the 33 forges read without refusals."
fields:
  - {"at": 0, "size": 8, "type": "i64", "name": "payload offset", "level": "proven", "note": "of the entry's FILEDATA header"}
  - {"at": 8, "size": 4, "type": "u32", "name": "id", "level": "proven"}
  - {"at": 12, "size": 4, "type": "i32", "name": "payload size", "level": "proven", "note": "counts the data blocks only, not the FILEDATA header"}
```

```layout
title: "Version 26 name record"
size: 188
games: [shaun-white-skateboarding]
note: "Little-endian. All 3,894 records of the 33 forges read without refusals; unnamed field meanings remain unknown."
fields:
  - {"at": 0, "size": 4, "type": "i32", "name": "size", "level": "proven", "note": "equals the index record's payload size in every row"}
  - {"at": 4, "size": 8, "type": "u64", "name": "id", "level": "proven", "note": "repeated in the entry's FILEDATA header; a different field from the index record's id"}
  - {"at": 12, "size": 4, "type": "i32", "name": "unknown", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": 16, "size": 4, "type": "u32", "name": "type id", "level": "proven", "note": "0 in every record"}
  - {"at": 20, "size": 20, "type": "i32[5]", "name": "unknown", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": 40, "size": 4, "type": "i32", "name": "timestamp", "level": "proven"}
  - {"at": 44, "size": 128, "type": "char[128]", "name": "name", "level": "proven", "note": "NUL-padded"}
  - {"at": 172, "size": 4, "type": "i32", "name": "unknown", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": 176, "size": 4, "type": "u32", "name": "meta-file key", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": 180, "size": 8, "type": "i32[2]", "name": "unknown", "level": "unknown", "note": "Stored bytes; meaning is not established."}
```

Because the name records of version 26 carry no type id, a reader cannot select entries by type from the tables. The class of an entry is read from its decoded resource instead (see [resources](/engines/anvil/data-model/resources/)). :proven{games="shaun-white-skateboarding"}[all 33 forges]

```layout
title: "FILEDATA entry header"
size: 440
games: [shaun-white-skateboarding]
note: "Little-endian. Precedes the data blocks of every entry; the index record's offset points at it and its size excludes it."
fields:
  - {"at": 0, "size": 8, "type": "char[8]", "name": "magic", "value": "FILEDATA", "level": "proven"}
  - {"at": 8, "size": 383, "type": "char[383]", "name": "name", "level": "proven", "note": "the entry's name from its name record, NUL-padded"}
  - {"at": 391, "size": 4, "type": "u32", "name": "index id", "level": "proven", "note": "equals the index record's id"}
  - {"at": 395, "size": 4, "type": "i32", "name": "size", "level": "proven", "note": "equals the index record's payload size"}
  - {"at": 399, "size": 8, "type": "u64", "name": "name id", "level": "proven", "note": "equals the name record's id"}
  - {"at": 407, "size": 33, "type": "bytes", "name": "unknown", "level": "unknown", "note": "eight i32 (the seventh equals the name record's timestamp) then a zero byte"}
```

:::open[What do the unnamed container fields control?]
Their positions and values are readable, but constants and positional fits do not establish their purpose. Breakpoint tool field names are not independently established meanings for all Riders Republic fields. :unknown{games="riders-republic"}
:::
