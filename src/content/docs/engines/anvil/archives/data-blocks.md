---
title: "Compressed data blocks"
description: "Entry framing, chunk size tables, checksums, the Zstandard, Oodle, LZO2A and LZO1X variants, and the PrefetchingFileInfos records."
games: ["riders-republic", "ghost-recon-breakpoint", "shaun-white-skateboarding"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
  - title: Breakpoint format reference
    url: https://github.com/dataterminals/grb-modding-knowledgebase
    note: Community documentation and readers.
implementations:
  - name: "anvil-formats (data.rs)"
    url: https://github.com/Kalmarv/anvil-formats/blob/main/src/data.rs
  - name: "anvil-formats (prefetch.rs)"
    url: https://github.com/Kalmarv/anvil-formats/blob/main/src/prefetch.rs
---

An ordinary Riders Republic entry contains two consecutive blocks: metadata decoding to 16 bytes, then a resource block. `GlobalMetaFile` is an exception without block magic, and [`PrefetchingFileInfos`](#prefetchingfileinfos) one streamed block. This framing is checked on real Mesh resources and a three-chunk CompiledMip. :observed{games="riders-republic"}

```layout
title: "Data block"
size: "variable"
games: [riders-republic]
note: "Little-endian. Framing, sizes and checksums validated on every Mesh (147,289) and MeshShape (25,162) payload across all six installed forges; no refusals for those types. Other entry types are outside this stated scope."
fields:
  - {"at": 0, "size": 8, "type": "u64", "name": "magic", "value": "0x1004FA9957FBAA33", "level": "proven"}
  - {"at": 8, "size": 2, "type": "u16", "name": "version", "value": "2", "level": "proven"}
  - {"at": 10, "size": 1, "type": "u8", "name": "algorithm", "value": "5", "level": "proven", "note": "zstd"}
  - {"at": 11, "size": 2, "type": "u16", "name": "unknown", "level": "unknown", "note": "observed 0"}
  - {"at": 13, "size": 2, "type": "u16", "name": "unknown", "level": "unknown", "note": "observed 32772"}
  - {"at": 15, "size": 4, "type": "u32", "name": "chunk count n", "level": "proven"}
  - {"at": 19, "size": "8·n", "type": "u32[2]·n", "name": "chunk sizes", "level": "proven", "note": "each chunk's decoded and stored size"}
  - {"at": "19+8n", "size": "var", "type": "chunks", "name": "chunks", "level": "proven", "note": "per chunk: Adler-32 (from 0) of its stored bytes, then the bytes; a chunk whose stored size equals its decoded size is raw"}
```

| Rule | Riders Republic | Ghost Recon Breakpoint | Confidence |
|---|---|---|---|
| Magic | `0x1004FA9957FBAA33` | Same | :observed{games="riders-republic"} :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |
| Version / algorithm | `2 / 5`, Zstandard | `3 / 3`, Oodle Mermaid | :observed{games="riders-republic"} :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |
| Chunk sizes | Decoded and stored u32 pair | Same; decoded chunk maximum 32,768 bytes | :observed{games="riders-republic"} :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |
| Checksum | Adler-32 from **0**, over stored bytes | Same seed and byte domain | :observed{games="riders-republic"} :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |
| Equal sizes | Chunk stored raw | Reader recognizes raw chunks | :observed{games="riders-republic"} :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |

The entire size table precedes all chunk payloads. Each payload starts with its checksum; decoded chunks concatenate in order. :observed{games="riders-republic"}

The block reader accounts for every byte and checks each stored checksum on all 147,289 Mesh and 25,162 MeshShape payloads across the six installed archives, with no refusals for those types. This proves their block profile, not that every resource type uses it; GlobalMetaFile is a separate form. :proven

## PrefetchingFileInfos

Each of the six Riders Republic forges ends with an entry named `PrefetchingFileInfos` that is neither of the two forms above: one streamed block with no metadata block before it, compression version 2 and algorithm 0, LZO1X (miniLZO's format). It has no chunk table: each chunk is a marker byte 1, its stored size, decoded size and checksum (u32 each, the checksum Adler-32 from 0 over the stored bytes), then its stored bytes, and the chunks run to the entry's end. Each of the six entries' 222 chunks matches its checksum and decodes with a strict LZO1X decoder to exactly its stated size from exactly its stored bytes, the last chunk ending the entry. :proven{games="riders-republic"}[all six entries]

```layout
title: "PrefetchingFileInfos block"
size: "variable"
games: [riders-republic]
note: "Little-endian. The two words after the algorithm are 0 and 4 in all six, where the blocks with a chunk table hold 0 and 32772."
fields:
  - {"at": 0, "size": 8, "type": "u64", "name": "magic", "value": "0x1004FA9957FBAA33", "level": "proven"}
  - {"at": 8, "size": 2, "type": "u16", "name": "version", "value": "2", "level": "proven"}
  - {"at": 10, "size": 1, "type": "u8", "name": "algorithm", "value": "0", "level": "proven", "note": "LZO1X"}
  - {"at": 11, "size": 2, "type": "u16", "name": "unknown", "level": "unknown", "note": "0 in all six"}
  - {"at": 13, "size": 2, "type": "u16", "name": "unknown", "level": "unknown", "note": "4 in all six"}
  - {"at": 15, "size": "var", "type": "chunks", "name": "chunks", "level": "proven", "note": "per chunk: marker 1 (u8), stored size, decoded size, Adler-32 from 0 of the stored bytes (u32 each), the stored bytes; to the entry's end"}
```

Shaun White Skateboarding's streamed shader bundles hold 32768 and 0 in those two words where its blocks with a chunk table hold 32768 and 32768; in both games bit 15 of the second word is set exactly where the block has a chunk table. That it is a flag for the form is a fit to those values. :inferred

The decoded bytes hold a record for every other entry of the forge: the record count, a table of the records, then the records' bytes. :proven{games="riders-republic"}[all six entries, every record read to its size]

```layout
title: "PrefetchingFileInfos records (decoded)"
size: "variable"
games: [riders-republic]
note: "Little-endian. Offsets are relative to the decoded bytes; n records."
fields:
  - {"at": 0, "size": 4, "type": "u32", "name": "record count n", "level": "proven"}
  - {"at": 4, "size": "16·n", "type": "row·n", "name": "rows", "level": "proven", "note": "per record: the index id of the entry it is for (u64, ascending), the record's size and its offset in the record bytes (u32 each); each offset is where the record before it ends"}
  - {"at": "4+16n", "size": 4, "type": "u32", "name": "record bytes length", "level": "proven", "note": "the records' sizes added up"}
  - {"at": "8+16n", "size": "var", "type": "records", "name": "record bytes", "level": "proven", "note": "they end the decoded bytes"}
```

```layout
title: "PrefetchingFileInfos record"
size: "variable"
games: [riders-republic]
note: "Little-endian. Offsets are relative to the record; it ends at the size its row gives."
fields:
  - {"at": 0, "size": 2, "type": "u16", "name": "group count g", "level": "proven"}
  - {"at": 2, "size": "var", "type": "group·g", "name": "groups", "level": "proven", "note": "per group: a member count (u16), then per member a byte (0 or 1 seen; unknown) and an entry's index id (u64)"}
  - {"at": "var", "size": 2, "type": "u16", "name": "listed count c", "level": "proven"}
  - {"at": "var", "size": "var", "type": "listed·c", "name": "listed entries", "level": "proven", "note": "per entry: its index id (u64), a byte (1 or 4 seen; unknown), a value count (u16) and that many u16 values (unknown)"}
```

The records' keys are the index ids of every entry of their forge except the `GlobalMetaFile` and the `PrefetchingFileInfos` itself (163,354 records in `DataPC.forge`, 767,461 in `DataPC_MAD_USNAT.forge`), and every id a record holds, member or listed, is the index id of an entry of one of the six forges; a patch forge's records also list entries of its base forge and of `DataPC.forge`. :proven{games="riders-republic"}[all six entries]

| Forge | Records | Listed entries | Records with groups | Decoded bytes | Chunks |
|---|---|---|---|---|---|
| `DataPC.forge` | 163,354 | 198,447 | 0 | 5,450,005 | 21 |
| `DataPC_patch_01.forge` | 49,361 | 76,631 | 0 | 1,830,169 | 7 |
| `DataPC_MAD_USNAT.forge` | 767,461 | 1,695,568 | 6,675 | 34,303,570 | 131 |
| `DataPC_MAD_USNAT_patch_01.forge` | 320,775 | 824,351 | 4,898 | 15,729,802 | 61 |
| `DataPC_MAD_WhiteRoom.forge` | 386 | 417 | 2 | 12,341 | 1 |
| `DataPC_MAD_WhiteRoom_patch_01.forge` | 335 | 481 | 0 | 11,999 | 1 |

Groups appear only in GridCellDataBlocks' records, and every member is an entry of type `0x41813744`, the 1,548 of which in the six forges are named after the game's activities: events, tutorials, hubs, cinematics (`EVE_RocketWingsuit_SprayAndPray`, `TUT_Wingsuit_Basics`, `MUL_MassRace_MammothRush`, ...). Values appear only on the Entities and EntityGroups a GridCellDataBlock lists. :proven{games="riders-republic"}[all six entries]

What the game does with a record is not established. The name suggests the entries to fetch together with the one the record is for, and the groups the activities a cell's content belongs to. :inferred Shaun White Skateboarding's 40 forges have no `PrefetchingFileInfos` entry. :proven{games="shaun-white-skateboarding"}[all 40 forges]

## Shaun White Skateboarding

:only[shaun-white-skateboarding]

Shaun White Skateboarding's blocks keep the magic, the Adler-32 checksum of each chunk's stored bytes (started from 0) and the raw-chunk rule, but narrow the size fields to 16 bits and compress with LZO2A. Of the 3,894 entries of the 33 forges, 3,861 are two consecutive blocks that end the entry exactly, 7,722 blocks holding 208,739 chunks (32,628 of them stored raw); every one of the blocks has compression version 1, algorithm 2 and both unknown words 32768. The other 33 entries, one per forge, are the `GlobalMetaFile` and carry no block magic. :proven{games="shaun-white-skateboarding"}[every entry of the install; block headers, chunk tables and entry framing]

```layout
title: "Version 1 data block"
size: "variable"
games: [shaun-white-skateboarding]
note: "Little-endian. Offsets are relative to the block."
fields:
  - {"at": 0, "size": 8, "type": "u64", "name": "magic", "value": "0x1004FA9957FBAA33", "level": "proven"}
  - {"at": 8, "size": 2, "type": "u16", "name": "version", "value": "1", "level": "proven"}
  - {"at": 10, "size": 1, "type": "u8", "name": "algorithm", "value": "2", "level": "proven", "note": "LZO2A"}
  - {"at": 11, "size": 2, "type": "u16", "name": "unknown", "level": "unknown", "note": "observed 32768"}
  - {"at": 13, "size": 2, "type": "u16", "name": "unknown", "level": "unknown", "note": "observed 32768"}
  - {"at": 15, "size": 2, "type": "u16", "name": "chunk count n", "level": "proven"}
  - {"at": 17, "size": "4·n", "type": "u16[2]·n", "name": "chunk sizes", "level": "proven", "note": "each chunk's decoded and stored size"}
  - {"at": "17+4n", "size": "var", "type": "chunks", "name": "chunks", "level": "proven", "note": "per chunk: Adler-32 (from 0) of its stored bytes, then the bytes; a chunk whose stored size equals its decoded size is raw"}
```

The compression is LZO2A, the `lzo2a` format of LZO 2.10. Its stream interleaves a bit buffer with literal and match bytes: flag 0 is a literal byte; flags 1 0 a short match of 2 to 5 bytes at a distance of 1 to 256; flags 1 1 a two-byte match code whose zero length selects a long match and whose zero distance ends the stream. Every chunk of the Graphic Bootstrap entry and of a 1.0 MB level cell decodes to exactly its stated size from exactly its stored bytes. :observed{games="shaun-white-skateboarding"}[two entries]

Over all 1,624 cell entries of the 33 forges, every chunk passes its checksum and decodes to its stated size, and the decoded objects tile the resource exactly. :observed{games="shaun-white-skateboarding"}[cell entries only]

Some entries store a block entirely raw: its chunk sizes are equal. Sixty-six of the 253 cell entries of level 01 are stored this way, so a reader must not take a missing compression marker to mean a missing resource. :observed{games="shaun-white-skateboarding"}[level 01]

The size of an entry counts its blocks only, from the first block's magic; the 440-byte [`FILEDATA` header](/engines/anvil/archives/forge/) before them is not counted. :proven{games="shaun-white-skateboarding"}[all 33 forges]

Outside the forges, the compressed shader bundles beside the executable use the same magic, version, algorithm and checksum in another layout: no chunk table, and each chunk preceded by a flag and 32-bit stored and decoded sizes. It is described with the [SDB2 bundles](/engines/anvil/shaders/sdb2/#compressed-bundles). :proven{games="shaun-white-skateboarding"}[all four compressed shader bundles]

## Ghost Recon Breakpoint

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
