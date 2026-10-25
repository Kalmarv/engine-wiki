---
title: "Compressed data blocks"
description: "Entry framing, chunk size tables, checksums and compression variants."
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

An ordinary Riders Republic entry contains two consecutive blocks: metadata decoding to 16 bytes, then a resource block. `GlobalMetaFile` is an exception without block magic. This framing is checked on real Mesh resources and a three-chunk CompiledMip. :observed{games="riders-republic"}

```layout
title: "Data block"
size: "variable"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 8, "type": "u64", "name": "magic", "value": "0x1004FA9957FBAA33", "level": "observed"}
  - {"at": 8, "size": 2, "type": "u16", "name": "version", "value": "2", "level": "observed"}
  - {"at": 10, "size": 1, "type": "u8", "name": "algorithm", "value": "5", "level": "observed", "note": "zstd"}
  - {"at": 11, "size": 2, "type": "u16", "name": "unknown", "level": "unknown", "note": "observed 0"}
  - {"at": 13, "size": 2, "type": "u16", "name": "unknown", "level": "unknown", "note": "observed 32772"}
  - {"at": 15, "size": 4, "type": "u32", "name": "chunk count n", "level": "observed"}
  - {"at": 19, "size": "8·n", "type": "u32[2]·n", "name": "chunk sizes", "level": "observed", "note": "each chunk's decoded and stored size"}
  - {"at": "19+8n", "size": "var", "type": "chunks", "name": "chunks", "level": "observed", "note": "per chunk: Adler-32 (from 0) of its stored bytes, then the bytes; a chunk whose stored size equals its decoded size is raw"}
```

| Rule | Riders Republic | Ghost Recon Breakpoint | Confidence |
|---|---|---|---|
| Magic | `0x1004FA9957FBAA33` | Same | :observed{games="riders-republic"} :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |
| Version / algorithm | `2 / 5`, Zstandard | `3 / 3`, Oodle Mermaid | :observed{games="riders-republic"} :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |
| Chunk sizes | Decoded and stored u32 pair | Same; decoded chunk maximum 32,768 bytes | :observed{games="riders-republic"} :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |
| Checksum | Adler-32 from **0**, over stored bytes | Same seed and byte domain | :observed{games="riders-republic"} :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |
| Equal sizes | Chunk stored raw | Reader recognizes raw chunks | :observed{games="riders-republic"} :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |

The entire size table precedes all chunk payloads. Each payload starts with its checksum; decoded chunks concatenate in order. :observed{games="riders-republic"}

```layout
title: "Breakpoint compressed block"
size: "variable"
games: [ghost-recon-breakpoint]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 8, "type": "u64", "name": "magic", "value": "0x1004FA9957FBAA33", "level": "sourced"}
  - {"at": 8, "size": 2, "type": "u16", "name": "version", "value": 3, "level": "sourced"}
  - {"at": 10, "size": 1, "type": "u8", "name": "algorithm", "value": 3, "level": "sourced", "note": "Oodle Mermaid in the documented profile."}
  - {"at": 11, "size": 4, "type": "u16[2]", "name": "block-size descriptor", "level": "unknown", "note": "Two words; the community reports a load-sensitive 32768 block-size value."}
  - {"at": 15, "size": 4, "type": "i32", "name": "chunk count N", "level": "sourced"}
  - {"at": 19, "size": "8N", "type": "i32[2][]", "name": "decoded and stored sizes", "level": "sourced"}
  - {"at": "19+8N", "size": "variable", "type": "bytes", "name": "checksummed chunks", "level": "sourced", "note": "Adler-32 from zero, then stored bytes for each chunk."}
```

:::open[Does Breakpoint reject every raw chunk?]
The community reference reports failed raw-block cloth loads and successful Mermaid loads, while its reader permits equal-size raw chunks. Later notes identify an incorrect block-size header as another independent hang cause. These observations do not establish universal rejection of raw chunks. :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"}
:::
