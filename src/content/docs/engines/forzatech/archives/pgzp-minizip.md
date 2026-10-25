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
---

A Forza Horizon 6 track keeps its world (every model, placement table and track texture) in four **GeoChunk**
archives, `GeoChunk0.minizip` to `GeoChunk3.minizip`, in the track's folder under `media\Tracks`. The format is not a
ZIP: the entries have no names inside the archive, only an index, a position and a compression method. The names and the
resource types come from companion text and binary files beside the archives. :observed

This page describes the Tokyo track `Brio`, the only track measured. :observed

## What a chunk holds

| Chunk | Size | Entries | Holds | Confidence |
|---|---|---|---|---|
| `GeoChunk0` | 37 GB | 411,013 | every model, every `.pgeo` placement file and `.pb` texture (each with at least its lowest quality tier), terrain cluster models | :observed |
| `GeoChunk1` | 3.3 GB | 3,065 | smaller set of textures and resources | :observed |
| `GeoChunk2` | 46 GB | 79,840 | higher quality tiers of textures, including the largest terrain cell maps and the top records of the near-field ground layers | :observed |
| `GeoChunk3` | 4.4 GB | 1,476 | only the highest-resolution `builtmegatexture` records (the `.hq*` files) | :observed |

No path appears in two chunks. :observed Only `GeoChunk0` holds `.modelbin` files. :observed

## Header

```layout
title: PGZP header
size: 32
games: [fh6]
note: Little-endian. The folder index follows at 0x20.
fields:
  - {at: 0, size: 4, type: "char[4]", name: magic, value: "PGZP", level: observed}
  - {at: 4, size: 4, type: u32, name: version, value: 101, level: observed, note: "FH5 shipped 100 and 101 per ForzaTools; the FH6 chunks are 101"}
  - {at: 8, size: 4, type: u32, name: folder indices offset, value: "0x20", level: observed}
  - {at: 12, size: 4, type: u32, name: directory entry count, level: observed, note: "411,013 / 3,065 / 79,840 / 1,476 for chunks 0 to 3"}
  - {at: 16, size: 4, type: u32, name: folder count, level: observed, note: "81,657 in chunk 0"}
  - {at: 20, size: 4, type: u32, name: files per sub-chunk, value: 512, level: observed}
  - {at: 24, size: 4, type: u32, name: sub-chunk count, level: observed, note: "ceil(entry count / 512); 803 in chunk 0"}
  - {at: 28, size: 4, type: u32, name: reserved, value: 0, level: observed}
```

After the header comes the folder index (`4 × folder count + 4` bytes, rounded up to a multiple of 8), then the
sub-chunks. :observed

## Sub-chunks and entries

Each sub-chunk is a `u64` data start followed by 512 twelve-byte entries; one extra 12-byte entry ends the list.
:observed

```layout
title: PGZP entry
size: 12
games: [fh6]
note: Preceded in each sub-chunk by a u64 absolute data start. Little-endian.
fields:
  - {at: 0, size: 4, type: u32, name: relative data offset, level: observed, note: "absolute offset = sub-chunk data start + this"}
  - {at: 4, size: 4, type: u32, name: uncompressed size, level: observed}
  - {at: 8, size: 2, type: u16, name: flags, level: observed, note: "version 101: method = flags & 0x0FFF, padding = flags >> 12. Version 100: method = flags & 0x3FFF, padding = flags >> 14"}
  - {at: 10, size: 2, type: u16, name: parent directory index, level: observed, note: "an index into the folder list, not an entry index"}
```

The compressed size of an entry is the next entry's data offset minus its own, minus the padding. :observed

| Method | Compression | Where | Confidence |
|---|---|---|---|
| 0 | stored | GeoChunks | :observed |
| 8 | raw DEFLATE (RFC 1951) | GeoChunks | :observed |
| 31 | raw LZ4 block; the payload starts with an LZ4 token byte (`F0 30` = 15 + 48 literals) | GeoChunks; not in ForzaTools' FH5 table | :observed |
| 21 | XMemCompress LZX | platform zips, not GeoChunks | :sourced[ForzaTechStudio] |
| 22 | deflate wrapped in [TFIT encryption](/engines/forzatech/archives/encrypted-files/) | platform zips, not GeoChunks | :observed |

A sample of 150 entries per chunk decompresses without failure in all four chunks. :observed

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

**`ChunkContentsMiniZipN.txt`** has one line per entry, `<PREZIPPED>d:\...\zipcache\pc\<path>|<folder index>`. The
line order is the entry order; the number after `|` is the parent directory index, not the entry index. The line
count equals the entry count and the distinct `|N` values equal the folder count. :observed

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
