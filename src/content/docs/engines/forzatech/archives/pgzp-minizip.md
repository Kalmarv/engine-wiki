---
title: PGZP minizip archives
description: The GeoChunk streaming archives of a Forza Horizon 6 track, their header, entry table, compression methods, and the companion files that name and type the entries.
sources:
  - title: ForzaTools (PlaygroundMiniZip)
    url: https://github.com/Nenkai/ForzaTools
    note: reader for the PGZP minizip of Forza Horizon 5; the published method table
  - title: ForzaTech-extraction-tools
    url: https://github.com/Doliman100/ForzaTech-extraction-tools
    note: modelbin reading and FH5 constants
  - title: ForzaTechStudio
    url: https://github.com/D3FEKT/ForzaTechStudio
    note: documents zip methods 21 and 22 of the platform zips
implementations:
  - name: forzatech-formats (minizip.rs)
    url: https://github.com/Kalmarv/forzatech-formats/blob/main/src/minizip.rs
---

A Forza Horizon 6 track keeps its world (every model, placement table and track texture) in four **GeoChunk**
archives, `GeoChunk0.minizip` to `GeoChunk3.minizip`, in the track's folder under `media\Tracks`. The format is not a
ZIP: the entries have no names inside the archive, only an index, a position and a compression method. The names and the
resource types come from companion text and binary files beside the archives. :observed

This page describes the Tokyo track `Brio`, the only track measured, as Steam build 25588841 ships it. Every
statement marked :proven was checked on all four of its GeoChunks: every entry read by a reader that refuses any value
the layout below does not allow, and compared field by field with ForzaTools' reading of the same files. :proven

## What a chunk holds

| Chunk | Size | Entries | Holds | Confidence |
|---|---|---|---|---|
| `GeoChunk0` | 39,724,802,048 bytes | 411,013 | every model, every `.pgeo` placement file and `.pb` texture (each with at least its lowest quality tier), terrain cluster models | :observed |
| `GeoChunk1` | 3,573,829,632 bytes | 3,065 | no `.modelbin`; its other contents (the models, placements and `.pb` textures are in chunks 0 to 2) are not described separately | :unknown |
| `GeoChunk2` | 49,414,393,856 bytes | 79,840 | higher quality tiers of textures, including the largest terrain cell maps (mainmap q5) and the `top.dxt` near-field layer files | :observed |
| `GeoChunk3` | 4,762,284,032 bytes | 1,476 | only the highest-resolution `builtmegatexture` records (the `.hq*` files) | :observed |

No path appears in two chunks. :observed Only `GeoChunk0` holds `.modelbin` files. :observed

## Header

```layout
title: PGZP header
size: 32
games: [fh6]
note: Little-endian. The folder index follows at 0x20.
fields:
  - {at: 0, size: 4, type: "char[4]", name: magic, value: "PGZP", level: proven}
  - {at: 4, size: 4, type: u32, name: version, value: 101, level: proven, note: "FH5 shipped 100 and 101 per ForzaTools; the FH6 chunks are 101"}
  - {at: 8, size: 4, type: u32, name: folder index offset, value: "0x20", level: proven}
  - {at: 12, size: 4, type: u32, name: entry count, level: proven, note: "411,013 / 3,065 / 79,840 / 1,476 for chunks 0 to 3"}
  - {at: 16, size: 4, type: u32, name: folder count, level: proven, note: "81,657 / 3,065 / 79,840 / 1,476"}
  - {at: 20, size: 4, type: u32, name: entries per sub-chunk, value: 512, level: proven}
  - {at: 24, size: 4, type: u32, name: sub-chunk count, level: proven, note: "ceil(entry count / 512): 803 / 6 / 156 / 3"}
  - {at: 28, size: 4, type: u32, name: reserved, value: 0, level: unknown, note: "0 in all four chunks"}
```

After the header comes the **folder index**: one `u32` per folder, the index of the folder's first entry, then one
more `u32`, the entry count. A folder's entries run from its value to the next, so the entries of a folder are
consecutive and the values never go down; no folder is empty. A zero `u32` pads the list to a multiple of 8 bytes
(chunks 2 and 3). :proven Then come the sub-chunks, and right after the directory (the end of the list below) the
first entry's data. :proven

## Sub-chunks and entries

Each sub-chunk is a `u64` absolute data start followed by the records of its entries: 512, the last sub-chunk the
rest. Every sub-chunk's first entry has relative offset 0. :proven One more 12-byte record ends the list: its data
offset, relative to the last sub-chunk's data start, is where the last entry's data ends, and its other fields are 0.
:proven

```layout
title: PGZP entry
size: 12
games: [fh6]
note: Preceded in each sub-chunk by a u64 absolute data start. Little-endian.
fields:
  - {at: 0, size: 4, type: u32, name: relative data offset, level: proven, note: "absolute offset = sub-chunk data start + this; a multiple of 4 for every entry"}
  - {at: 4, size: 4, type: u32, name: uncompressed size, level: proven}
  - {at: 8, size: 2, type: u16, name: flags, level: proven, note: "version 101: method = flags & 0x0FFF, padding = flags >> 12 (0 to 3 in FH6). Version 100 (per ForzaTools): flags & 0x3FFF and flags >> 14"}
  - {at: 10, size: 2, type: u16, name: folder, level: proven, note: "the low 16 bits of the entry's folder number (its folder by the folder index): chunks 0 and 2 have more than 65,536 folders, and the field wraps"}
```

An entry's stored bytes run from its offset to the next entry's offset (for the last entry, the end the closing
record gives), less its padding: the padding is the 0 to 3 bytes that bring the next entry to a multiple of 4. A
stored entry's stored bytes are exactly its uncompressed size. :proven After the last entry's data the file is zero
bytes up to a multiple of 4,096. :proven

| Method | Compression | Where | Confidence |
|---|---|---|---|
| 0 | stored | GeoChunks | :proven |
| 8 | raw DEFLATE (RFC 1951) | GeoChunk0 only | :proven |
| 31 | raw LZ4 block; the payload starts with an LZ4 token byte (`F0 30` = 15 + 48 literals) | GeoChunks; not in ForzaTools' FH5 table | :proven |
| 21 | XMemCompress LZX | platform zips per ForzaTechStudio; no entry of the 9,076 zips of the FH6 install uses it | :sourced[ForzaTechStudio] |
| 22 | deflate wrapped in [TFIT encryption](/engines/forzatech/archives/encrypted-files/) | platform zips (29,250 entries in 1,085 of the install's 9,076 zips), not GeoChunks | :observed |

| Chunk | Stored | DEFLATE | LZ4 | Confidence |
|---|---|---|---|---|
| `GeoChunk0` | 115,773 | 14,041 | 281,199 | :proven |
| `GeoChunk1` | 710 | 0 | 2,355 | :proven |
| `GeoChunk2` | 31,427 | 0 | 48,413 | :proven |
| `GeoChunk3` | 1,137 | 0 | 339 | :proven |

Every entry of the four chunks decodes to exactly its uncompressed size with every stored byte used: no DEFLATE
stream or LZ4 block ends early or leaves bytes over. :proven 1,800 entries (200 of each method of each chunk, spread
evenly) decode to the same bytes in ForzaTools (stored and DEFLATE entries) and K4os.Compression.LZ4 (LZ4 entries).
:observed ForzaTools never sets the closing record's offset, so the size it gives the last entry of `GeoChunk0` (a
compressed one) wraps and it cannot read that entry. :proven

## Companion files

Both sit beside the chunks, one pair per chunk. :observed

**`ChunkMapN.dat`** is exactly `4 × entry count` bytes: one record per entry, `u16 unknown, u8 unknown, u8` resource
type. :observed

| Type | Resource | Type | Resource |
|---|---|---|---|
| 0 | `.pgeo` placement file | 14 | `.dds` |
| 1 | `.phys` | 15 | `.hkx` (Havok) |
| 2 | placeholder | 16 | `.zip` |
| 3 | `.owb` | 17 | `.mtxmoddxt` near-field splat map |
| 4 | `.modelbin` | 18 | `.dxt` |
| 5 | `.pb` texture | 19 | `.mtp` grass clutter map |
| 7 | `.gr2` | 20 | pack |
| 8 | `.tz` trigger zone | 22 | `.gipack` |
| 9 | `.soundscape` | 24 | `.hqdxt` |
| 10 | `.bank` | 25 | streaming cell |
| 11 | `.lightblock` | 26 | `.tdft` |
| 12 | `.pvsz` per-cell visibility list | 27 | `.fvt` |
| | | 28 | `.predeform` |

All the type names are :observed from the extensions of the paths the contents file gives for each type. A model is
named in other files by `4 << 24 | id` and a texture by `PVSTextureIndex << 4 | (quality − 1)`. :observed

**`ChunkContentsMiniZipN.txt`** is ASCII with one line per entry in entry order, each ended by CR LF, in one of two
forms: `<PREZIPPED>d:\...\zipcache\pc\<path>|<folder>`, the entry's path on the machine that built the archive, or a
bare generated name and its folder, `__04965.pvsz|30579` or `__tz00021.tz|14717`. :proven `GeoChunk0` has 14,041 bare
lines (13,702 `.pvsz`, 339 `.tz`); the other chunks have none. :proven The number after the last `|` is the entry's
whole folder number, the one the folder index gives (not its 16-bit field). :proven

## Other files in the track folder

Beside the chunks sit the files below. They are named here and described on the pages that use them. :observed

| File | Holds | Described in |
|---|---|---|
| `ChunkAssign*.dat`, `Duplication_*.dat`, `TransHints_*.dat`, `Compensation.dat` | streaming assignment data | :unknown |
| `bin.zip` | shaders, DXIL permutations, 1,676 material files (419 parent materials × summer, spring, autumn, winter), `AssetManifest.xml` | [Material files](/engines/forzatech/materials/materialbin/), [Shader containers](/engines/forzatech/shaders/shaderbin/) |
| `Ribbon_00\` | `brio_00.pvs` (hand-placed instances) and the instance template libraries | [Hand-placed instances](/engines/forzatech/world/pvs-ribbon/), [Template libraries](/engines/forzatech/world/plib-templates/) |
| `trackroutes\*.nt` | plain XML track locators | [Coordinates and cells](/engines/forzatech/world/coordinates-and-cells/) |
| `triggerzones\tz_oceanparams\` | the ocean preset zones | [Water](/engines/forzatech/water/water/) |

The shared engine textures live outside the track, in `media\_library\TexturesPG\*.zip` (`.swatchbin`), and more track
textures in `media\Stripped\gs\swatchbins.zip` (`.pb`: festival banners and flags, some distance-level textures).
:observed

:::open[What do the ChunkAssign, Duplication, TransHints and Compensation files contain?]
They are present beside the chunks and were not read.
:::

:::open[What are the first three bytes of each ChunkMap record?]
Each record is `u16, u8` followed by the resource type byte; only the type byte is understood.
:::
