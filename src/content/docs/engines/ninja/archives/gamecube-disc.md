---
title: The GameCube disc and its files
description: "How the Sonic Adventure 2: Battle GameCube disc is laid out (header, file system table), and where the stage, texture, set and light files sit on it."
sources:
  - title: YAGCD (Yet Another GameCube Documentation)
    url: https://hitmen.c02.at/files/yagcd/yagcd/
    note: the GameCube disc header and FST layout
  - title: Dolphin (disc header and FST)
    url: https://github.com/dolphin-emu/dolphin
    note: documents the same disc structures
  - title: X-Hax SA Tools
    url: https://github.com/X-Hax/sa_tools
    note: the GameConfig and data mappings that list the stage modules; no licence file
---

Sonic Adventure 2: Battle on GameCube is read here from a disc image of the USA release, game id `GSNE8P`. All data lives as files of the disc's file system; there is
no archive format layered over them, only compression and relocation of individual files ([Stage modules](/engines/ninja/archives/stage-modules/)). :observed

The figures are from a recorded census of that disc image; they cannot be re-checked now. :observed

## Disc header and file system table

The header is big-endian: `0x000` game id, `0x01C` magic `C2339F3D`, `0x020` title, `0x420` the offset of `main.dol`, `0x424` the FST offset, `0x428` the FST size. :sourced[YAGCD]

The FST is a table of 12-byte entries followed by a string table; the root entry's `length` is the entry count. :sourced[YAGCD]

```layout
title: FST entry
size: 12
games: [sa2b]
note: Big-endian.
fields:
  - {at: 0, size: 1, type: u8, name: is directory, level: sourced, note: "YAGCD"}
  - {at: 1, size: 3, type: u24, name: name offset, level: sourced, note: "into the string table"}
  - {at: 4, size: 4, type: u32, name: offset, level: sourced, note: "file: position in the image; directory: parent index"}
  - {at: 8, size: 4, type: u32, name: length, level: sourced, note: "file: size; directory: one past the last child"}
```

On `GSNE8P` the FST is at `0x1FD100` with 2,821 entries (2,819 files; `event/` is the only subdirectory). All files lie inside the image: the largest file end is
`0x52597780`, the image size `0x57058000`. `main.dol` is at `0x1E700` and 1,960,448 bytes. :observed

## File kinds on the disc

| Kind | Files | Holds | Described in |
|---|---|---|---|
| `stgNND.rel`, `boss_*D.rel`, `ChaoStg*.prs` | stage modules | code and data of a stage: landtables, object lists, texture names | [Stage modules](/engines/ninja/archives/stage-modules/) |
| `landtxNN.prs`, `bgtexNN.prs` and other `.prs` | PRS-compressed GVM archives | the textures of a stage | [Textures](/engines/ninja/textures/gvm-textures/) |
| `setNNNN_s.bin`, `_u`, `_2P`, `_HD` | object placement | the SET files | [Object placement](/engines/ninja/world/set-files/) |
| `stgNN_light.bin`, `stgNN_light_gc.bin`, `stgNN_fog*.bin` | lighting | light slots and fog | [Light and fog](/engines/ninja/lighting/light-and-fog/) |
| `main.dol` | executable | start and end position tables | [Object placement](/engines/ninja/world/set-files/) |

All :observed except the SET file name pattern, which is :sourced[SA Tools] (SALVL's convention).

:::open[What do the event files hold?]
The `event/` directory is the only subdirectory of the disc and was not read.
:::
