---
title: IoStore containers (.utoc and .ucas) and pak files
description: "Unreal Engine 5's container format as MECCHA CHAMELEON ships it: the .utoc table-of-contents header (version 8), its arrays, chunk ids and types, compression blocks, flags, and the accompanying pak file."
games: [meccha-chameleon]
sources:
  - title: Unreal Engine source (IoStore.h, IoStore.cpp)
    url: https://github.com/EpicGames/UnrealEngine
    note: FIoStoreTocHeader, EIoStoreTocVersion, EIoContainerFlags, EIoChunkType5 (requires an Epic-linked GitHub account)
  - title: CUE4Parse
    url: https://github.com/FabianFG/CUE4Parse
    note: community reader of IoStore containers
---

Unreal Engine 5 packs cooked content into **IoStore** containers: a **`.ucas`** file holds the data in compressed blocks and a
**`.utoc`** file is its table of contents (which chunks exist, where, how they are compressed). The older **`.pak`** format
still ships beside them. MECCHA CHAMELEON (Steam app 4704690, Unreal Engine 5.6.1, executable `PenguinHotel`, project `Chameleon`)
has two IoStore containers and one pak in `Chameleon/Content/Paks/`. :sourced[Unreal Engine source]

| File | Size (bytes) | Holds | Confidence |
|---|---|---|---|
| `Chameleon-Windows.utoc` / `.ucas` | 2,526,778 / 3,105,798,464 | the game's cooked content | :proven{games="meccha-chameleon"} |
| `global.utoc` / `.ucas` | 770 / 3,135,872 | the engine's script objects (global data) | :proven{games="meccha-chameleon"} |
| `Chameleon-Windows.pak` | 88,565,611 | non-IoStore files | :observed{games="meccha-chameleon"} |

## The .utoc header

The header is 144 bytes, little-endian. :proven{games="meccha-chameleon"}

```layout
title: FIoStoreTocHeader
size: 144
games: [meccha-chameleon]
note: "Little-endian. Values are those of Chameleon-Windows.utoc; global.utoc differs where noted."
fields:
  - {at: 0, size: 16, type: "char[16]", name: magic, value: "-==--==--==--==-", level: proven}
  - {at: 16, size: 1, type: u8, name: version, value: "8", level: proven, note: "EIoStoreTocVersion 8 (ReplaceIoChunkHashWithIoHash) in both containers"}
  - {at: 17, size: 1, type: u8, name: reserved, level: proven, note: "zero"}
  - {at: 18, size: 2, type: u16, name: reserved, level: proven, note: "zero"}
  - {at: 20, size: 4, type: u32, name: header size, value: "144", level: proven}
  - {at: 24, size: 4, type: u32, name: entry count, level: proven, note: "chunks: 12,407 (global.utoc: 1)"}
  - {at: 28, size: 4, type: u32, name: compressed block count, level: proven, note: "124,297 (global: 48)"}
  - {at: 32, size: 4, type: u32, name: compressed block entry size, value: "12", level: proven}
  - {at: 36, size: 4, type: u32, name: compression method count, level: proven, note: "1 (global: 0)"}
  - {at: 40, size: 4, type: u32, name: compression method name length, value: "32", level: proven}
  - {at: 44, size: 4, type: u32, name: compression block size, value: "65536", level: proven}
  - {at: 48, size: 4, type: u32, name: directory index size, level: proven, note: "439,500 (global: 0, no directory index)"}
  - {at: 52, size: 4, type: u32, name: partition count, value: "1", level: proven}
  - {at: 56, size: 8, type: u64, name: container id, level: proven, note: "0x97ACDB3EDF1CD386 (global: 0xFFFFFFFFFFFFFFFF)"}
  - {at: 64, size: 16, type: "u8[16]", name: encryption key guid, level: proven, note: "all zero in both containers"}
  - {at: 80, size: 1, type: u8, name: container flags, level: proven, note: "0x09 (global: 0x00), see below"}
  - {at: 81, size: 1, type: u8, name: reserved, level: proven, note: "zero"}
  - {at: 82, size: 2, type: u16, name: reserved, level: proven, note: "zero"}
  - {at: 84, size: 4, type: u32, name: perfect hash seed count, level: proven, note: "6,204 (global: 1)"}
  - {at: 88, size: 8, type: u64, name: partition size, value: "0xFFFFFFFFFFFFFFFF", level: proven, note: "no size limit per partition"}
  - {at: 96, size: 4, type: u32, name: chunks without perfect hash count, level: proven, note: "0"}
  - {at: 100, size: 4, type: u32, name: reserved, level: proven, note: "zero"}
  - {at: 104, size: 40, type: "u64[5]", name: reserved, level: proven, note: "all zero"}
```

The **container flags** are a bit set: 1 compressed, 2 encrypted, 4 signed, 8 indexed (has a directory index). :sourced[Unreal Engine source]
The game's container has `0x09` (compressed and indexed): it is neither encrypted nor signed. :proven{games="meccha-chameleon"}
`global.utoc` has none. :proven{games="meccha-chameleon"}

## The arrays after the header

In this order, with no gaps; their sizes add up to the file's length exactly, so the layout holds for both containers.
:proven{games="meccha-chameleon"}

| Array | Element size | Count | Content | Confidence |
|---|---|---|---|---|
| chunk ids | 12 | entry count | `FIoChunkId`: an 8-byte id, a 2-byte index, a padding byte, and a **chunk type** byte at offset 11 | :sourced[Unreal Engine source] |
| offsets and lengths | 10 | entry count | each chunk's offset and length in the uncompressed address space: two 5-byte big-endian integers | :proven{games="meccha-chameleon"} |
| perfect hash seeds | 4 | seed count | seeds of the minimal perfect hash that maps chunk ids to entries | :sourced[Unreal Engine source] |
| chunks without perfect hash | 4 | count (0) | overflow entries | :sourced[Unreal Engine source] |
| compressed blocks | 12 | block count | a 5-byte offset into the `.ucas`, a 3-byte compressed size, a 3-byte uncompressed size, a 1-byte compression method index (little-endian) | :proven{games="meccha-chameleon"} |
| compression method names | 32 | method count | NUL-padded names: `Oodle` | :proven{games="meccha-chameleon"} |
| directory index | directory index size | one | the file tree: a mount point string, directory and file entries | :proven{games="meccha-chameleon"} |
| chunk meta | 24 | entry count | per chunk a 20-byte hash (`FIoHash`), flags and padding | :sourced[Unreal Engine source] |

The directory index's mount point is `../../../`. :proven{games="meccha-chameleon"} The 297,768 bytes after the directory index
are exactly 12,407 chunk meta entries of 24 bytes. :proven{games="meccha-chameleon"}

## Chunks and blocks

The type byte at offset 11 of the chunk ids takes only the values below in the two containers. :proven{games="meccha-chameleon"}
Chunk types seen (names from the engine's `EIoChunkType5`): :sourced[Unreal Engine source]

| Type | Name | `Chameleon-Windows` | `global` | Confidence |
|---|---|---|---|---|
| 1 | ExportBundleData | 6,549 | | :proven{games="meccha-chameleon"} |
| 2 | BulkData | 3,099 | | :proven{games="meccha-chameleon"} |
| 3 | OptionalBulkData | 1 | | :proven{games="meccha-chameleon"} |
| 5 | ScriptObjects | | 1 | :proven{games="meccha-chameleon"} |
| 6 | ContainerHeader | 1 | | :proven{games="meccha-chameleon"} |
| 8 | ShaderCodeLibrary | 4 | | :proven{games="meccha-chameleon"} |
| 9 | ShaderCode | 2,753 | | :proven{games="meccha-chameleon"} |

The 6,549 export bundle chunks equal the 6,549 `.uexp` and the 3,099 bulk chunks the 3,099 `.ubulk` entries of the build's
file manifest. :observed{games="meccha-chameleon"} The chunks' lengths add up to 7,533,837,449 bytes uncompressed (the largest
201,327,113); `global`'s one chunk is 3,135,860 bytes. :proven{games="meccha-chameleon"}

The uncompressed address space is cut into 65,536-byte blocks. The game's container has 124,297 blocks, 117,169 compressed with
Oodle (method index 1) and 7,128 stored (index 0); `global`'s 48 blocks are all stored. Every block starts at a multiple of 16 in
the `.ucas`. :proven{games="meccha-chameleon"} 12,396 blocks have an uncompressed size other than 65,536. :proven{games="meccha-chameleon"}

## The pak file

`Chameleon-Windows.pak` is a version 11 pak: the footer's magic `0x5A6F12E1` is 204 bytes from the end of the file, the index is
at offset 88,226,758 and is 74,330 bytes. :observed{games="meccha-chameleon"} The shipped game lists 20,835 files in a build
manifest (`Manifest_UFSFiles_Win64.txt`: 6,549 `uexp`, 6,527 `uasset`, 3,438 `res`, 3,099 `ubulk`, 415 `png`, 313 `svg`, 175
`uplugin`, 105 `ini`, 90 `locres`, 25 `ufont`) and 24 more outside the file system (`Manifest_NonUFSFiles_Win64.txt`: the
`.uproject`, config files, plugin descriptors and the engine's native libraries). :observed{games="meccha-chameleon"}

:::open[What the pak holds]
The pak is 88 MB; the cooked assets are in the IoStore container. Which of the manifest's files (the `.res` and `.png` files,
the config) the pak carries is not established.
:::
