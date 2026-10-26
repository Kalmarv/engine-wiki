---
title: "Resource headers and references"
description: "Type hashes, ClassIDs, extended file headers and member objects."
games: ["riders-republic", "ghost-recon-breakpoint", "shaun-white-skateboarding"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
  - title: Breakpoint format reference
    url: https://github.com/dataterminals/grb-modding-knowledgebase
    note: Community documentation and readers.
implementations:
  - name: "primase worlds/anvil (data.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/data.rs
---

A resource has a type hash and a 64-bit ClassID. The outer type id and extension word after ClassID agree on the checked resources; type ids are CRC-32 hashes of class-name bytes, for example `Mesh` → `0x415D9568`. A type hash identifies a class, not an individual resource. :observed{games="riders-republic"}

Breakpoint also resolves resource identity by ClassID. An AnvilToolkit extraction filename's leading number is a positional label, and a decoded data container can hold several resource records. :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"}

```layout
title: "Resource record"
size: "variable"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 4, "type": "u32", "name": "type id", "level": "observed"}
  - {"at": 4, "size": 4, "type": "u32", "name": "payload length P", "level": "observed"}
  - {"at": 8, "size": 4, "type": "u32", "name": "name length N", "level": "observed"}
  - {"at": 12, "size": "N", "type": "char[]", "name": "name", "level": "observed"}
  - {"at": "12+N", "size": "H", "type": "bytes", "name": "file header", "level": "observed", "note": "H = 1 for tag 0; H = 8 + 12R for tag 1."}
  - {"at": "12+N+H", "size": 8, "type": "u64", "name": "ClassID", "level": "observed"}
  - {"at": "20+N+H", "size": 4, "type": "u32", "name": "extension", "level": "observed", "note": "Equals the type id on checked resources."}
  - {"at": "24+N+H", "size": "P-12", "type": "bytes", "name": "body", "level": "observed"}
```

Payload length includes ClassID, extension and body but excludes the file header. Missing that header shifts every subsequent record in a multi-resource container. :observed{games="riders-republic"} :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"}

```layout
title: "Extended file header"
size: "8 + 12R bytes"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "tag", "value": 1, "level": "observed"}
  - {"at": 1, "size": 3, "type": "bytes", "name": "unknown", "level": "unknown", "note": "02 00 00."}
  - {"at": 4, "size": 4, "type": "u32", "name": "row count R", "level": "observed"}
  - {"at": 8, "size": "12R", "type": "bytes", "name": "rows", "level": "unknown", "note": "Twelve-byte rows; meanings not established."}
```

The extended header occurs on all 9,087 clips in the five-archive Animation enumeration (WhiteRoom patch excluded), the AnimTrackBuiltinTracksTable (`0x46A37798`) and three ProxyTextures resources: 9,091 resources of the 1.3 million entries. The one stored AnimTrackBuiltinTracksTable is empty, so a table mapping track tags to classes is not stored in the data. :observed{games="riders-republic"}

The ordinary resource envelope (payload length, name, ClassID and extension) is validated as an exact-end record for all 147,289 Mesh and 25,162 MeshShape entries across all six installed forges, with no refusals in those populations. Extended-header rows and their Animation population remain separately scoped above. :proven[ordinary envelope]

```layout
title: "Reference"
size: 10
games: [riders-republic]
note: "Little-endian. All 48,862 LODSelector, 13,579 Material and 10,027 TextureSet resources across the six installed forges read without refusals; resource-reference tag/id framing is covered. Mode semantics remain unknown."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "tag", "value": "01", "level": "proven", "note": "03 and nine zero bytes: refers to nothing"}
  - {"at": 1, "size": 1, "type": "u8", "name": "mode", "level": "unknown", "note": "1 on every entry read"}
  - {"at": 2, "size": 8, "type": "u64", "name": "class id", "level": "proven", "note": "the resource referred to"}
```

Ten-byte references are measured across LODSelector, Material and TextureSet resources: `01`, mode, u64 ClassID; or `03` and nine zero bytes for null. This is not a universal pointer grammar: an instance's `03 01 + id` combines a null pointer and separate link. :observed{games="riders-republic"}

Owned and embedded objects generally store `u64 object id + u32 type + body`. Pointers add a tag: `03` null, `00` or `04` present object, `02 + u64` back-reference. These forms are measured in entity and skeleton bodies. :observed{games="riders-republic"}

:::open[What does the reference mode select?]
Modes 1 and 4 occur, but their complete runtime meaning is not established. :unknown{games="riders-republic"}
:::

## Shaun White Skateboarding

:only[shaun-white-skateboarding]

An entry of Shaun White Skateboarding does not hold one resource with a type, name and 64-bit ClassID header. In a level cell the first data block is an object directory and the second holds that many objects back to back. Object ids are 32 bits. :observed{games="shaun-white-skateboarding"}[all 1,624 cell entries]

```layout
title: "Object directory (first block)"
size: "2 + 8·N"
games: [shaun-white-skateboarding]
note: "Little-endian. Exact for 45,032 of 45,032 objects of the 253 cells of level 01 and for the 194,062 objects of all 1,624 cell entries; the objects of the second block add up to its length."
fields:
  - {"at": 0, "size": 2, "type": "u16", "name": "object count N", "level": "observed"}
  - {"at": 2, "size": "8·N", "type": "u32[2][N]", "name": "objects", "level": "observed", "note": "per object: its id, then the byte size of its header and body together"}
```

```layout
title: "Object header"
size: "13 + name length"
games: [shaun-white-skateboarding]
note: "Little-endian. Header plus declared body size equals the directory size for every class except the two block-allocator classes below."
fields:
  - {"at": 0, "size": 4, "type": "u32", "name": "class", "level": "observed", "note": "CRC-32 of the class name"}
  - {"at": 4, "size": 4, "type": "u32", "name": "declared body size", "level": "observed"}
  - {"at": 8, "size": 4, "type": "u32", "name": "name length L", "level": "observed"}
  - {"at": 12, "size": "L", "type": "char[]", "name": "name", "level": "observed", "note": "the object's name, for example a mesh or entity name"}
  - {"at": "12+L", "size": 1, "type": "u8", "name": "NUL", "level": "observed", "note": "absent on Animation and NavMeshManager"}
```

The first object of a cell is its `GridCellDataBlock`, and its id is the entry's index id. :observed

`Animation` (`0x0FA3067F`) and `NavMeshManager` (`0x0B4CE0E0`) are block-allocator classes: they have no NUL after the name, their body begins with the words `0x201` and `k`, and a table of `8 + 12·k` bytes follows the declared body. :observed

The body of a class derived from `ManagedObject` begins `[managed u8][id u32][class u32]` and then the fields. The id equals the directory id and the class equals the header class on every top-level object; the managed byte is 0 or 1 (1 on 5,581 and 0 on 1,562 decoded components). Classes that are not managed objects start `[id][class]`. :observed[level 01]

The same id repeats across cells of one forge: the 45,032 objects of level 01 carry 23,961 distinct ids. Repeats are byte-identical for `SoundBao`, `TextureMap`, `TextureMapSpec`, `Animation` and `MeshShape` objects and for the material class, but not for `Mesh`, where 1,445 repeats differ. :observed[level 01]

| Field kind | Stored form | Confidence |
|---|---|---|
| Handle or reference | One bare `u32` id | :observed |
| Object pointer | `u8` tag: 0 object inline, 1 external with `u32` id, 2 link with `u32` id, 3 null | :observed |
| Array | `u32` count then the elements; byte arrays are raw | :observed |
| String | `u32` length, the bytes, a NUL | :observed |
| Matrix | 16 `f32` | :observed |

Riders Republic uses ten-byte references with 64-bit ids instead. :observed

Every component starts with an inline non-managed object of class `0x3C6C77C8`: id, class, a kind byte (`0xFF` on 5,880 Visuals of level 01, `0xFE` on 1,296) and a target id. The meaning of `0xFE` is unknown. :observed

An entry named `*_DataBlock` is a level cell (253 in `DataPC_01`, 1,624 in all forges). Of the 17,905 ids the cells of level 01 list, 12,585 are objects of the same cell and 5,320 belong to other entries; all resolve. Materials, textures, sounds, the per-instance lighting objects and most meshes are reached only by reference. :observed[level 01]
