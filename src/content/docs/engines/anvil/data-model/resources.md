---
title: "Resource headers and references"
description: "Type hashes, ClassIDs, extended file headers and member objects."
games: ["riders-republic", "ghost-recon-breakpoint"]
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

The extended header occurs on all 9,087 clips in the current complete Animation enumeration, the empty AnimTrackBuiltinTracksTable and three ProxyTextures resources. :observed{games="riders-republic"}

```layout
title: "Reference"
size: "variable"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "tag", "value": "01", "level": "observed", "note": "03 and nine zero bytes: refers to nothing"}
  - {"at": 1, "size": 1, "type": "u8", "name": "mode", "level": "unknown", "note": "1 on every entry read"}
  - {"at": 2, "size": 8, "type": "u64", "name": "class id", "level": "observed", "note": "the resource referred to"}
```

Ten-byte references are measured across LODSelector, Material and TextureSet resources: `01`, mode, u64 ClassID; or `03` and nine zero bytes for null. This is not a universal pointer grammar: an instance's `03 01 + id` combines a null pointer and separate link. :observed{games="riders-republic"}

Owned and embedded objects generally store `u64 object id + u32 type + body`. Pointers add a tag: `03` null, `00` or `04` present object, `02 + u64` back-reference. These forms are measured in entity and skeleton bodies. :observed{games="riders-republic"}

:::open[What does the reference mode select?]
Modes 1 and 4 occur, but their complete runtime meaning is not established. :unknown{games="riders-republic"}
:::
