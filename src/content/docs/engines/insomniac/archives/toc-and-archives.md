---
title: The toc and the archives
description: "How Sunset Overdrive finds an asset: the zlib-compressed toc, its sections, the 20 archives with duplicated assets, and layout.csv, which names every asset."
sources:
  - title: ALERT (Tkachov)
    url: https://github.com/Tkachov/ALERT
    note: reader for Insomniac archives from Sunset Overdrive on; GPL-3
  - title: ALERT wiki (toc)
    url: https://github.com/Tkachov/ALERT/wiki/toc
    note: documents the toc sections of i16 (Sunset Overdrive), i20 and i29
---

Sunset Overdrive (Insomniac's engine generation **i16**) keeps every asset in a few large archive files under `assets_archive\`
and finds them through a single index file, `toc`. The game is launched with `-archive assets_archive\toc` (its `commandline.txt`).
:observed The toc and archives hold 399,775 assets; the engine addresses an asset by a 32-bit id, never by a path. :observed

The figures on this page come from a recorded census of the PC build 3373500 (Steam app 847370), no longer installed, so they cannot be
re-checked today. :observed

## The toc

The toc is a [DAT1 container](/engines/insomniac/data-model/dat1-container/) (magic `0x77AF12AF`) compressed with zlib and no end marker.
:observed :sourced[ALERT] It lists 20 archives and 114 spans (later Insomniac games use 256). :observed An asset is
defined by its id, the archive it is in, its offset and its size; Sunset Overdrive also stores copies: an asset's id is listed once, but its size
record counts how many copies exist and the offsets section has that many records. The copies are presumably there for faster access on a
hard disk. :sourced[ALERT]

| Section tag | Name | Content | Confidence |
|---|---|---|---|
| `EDE8ADA9` | Archive TOC Header | array of spans: two `u32` (index of the first asset, count) | :observed |
| `506D7B8A` | Asset IDs | array of `u32` asset ids, sorted ascending within a span | :observed |
| `65BCF461` | Asset Metadata | per asset three `u32`: copies, size, index of the first copy | :observed |
| `DCD720B5` | Asset Dupe Metadata | per copy two `u32`: archive index, offset | :observed |
| `398ABFF0` | File Metadata | per archive a 24-byte struct: `u32` install bucket, `u32` chunkmap, 16-byte name | :observed |

Archive names in the structure are only 16 characters long, and later games use 64. :sourced[ALERT] The meaning of the install bucket and
chunkmap numbers is not known; ALERT's research reports that using 0 works. :sourced[ALERT]

## The archives

Twenty archives sit beside the toc: `g00s000` to `g05s000` (global data) and `a00s002.us` to `a00s010.br` (localised). They are plain
concatenations of assets with no archive-level compression. :observed An asset's bytes are the 36-byte wrapper followed by its DAT1
([DAT1 container](/engines/insomniac/data-model/dat1-container/)). :observed

## Naming assets: layout.csv

The install ships build leftovers, `layout.csv` (561,794 rows), `archive_input.json`, `chunkmap.txt` and `scan.csv`, which the game does not use
itself. :observed Each row of `layout.csv` gives a path, a built path (`win/0xc4/0xc421ad02.built`, whose hex number is the toc id), the
archive, the offset and the size. Every one of the 399,775 toc assets gets a path from it, and 5,017 of 5,017 sampled rows equal a toc copy.
:observed The `Built Type` column marks a texture's HD mips as `stream` ([Textures](/engines/insomniac/textures/texture/)). :observed

Named assets by type (census of the layout): 265,887 `wem` (Wwise audio), 52,624 `texture`, 46,816 `lightgrid`, 8,780 `model`, 6,924
`material`, 4,936 `zone`, 2,568 `actor`, 2,536 `config`, 1,112 `zone_physics`, 419 `zone_static`, 1,012 `materialgraph`, 1 `level`. :observed

## The game folder

Besides the archives the folder ships the Houdini Engine run-time libraries (libSOP, libHAPI, libVEX, ...), Alembic, OpenVDB, Bink 2 and Wwise. `Sunset.exe`
is a native x64 binary (PE timestamp 2018-12-06; the PC port was made by Blind Squirrel) with no Denuvo or SteamStub strings or sections found. It has a
second `.text` section of 3.9 MB at the end of the image whose purpose is unknown. :observed

:::open[What are the install bucket and chunkmap numbers of an archive?]
The toc stores two `u32` per archive that leftover files call "install bucket" and "chunkmap". Their effect is not established.
:::
