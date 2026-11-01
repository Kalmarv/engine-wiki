---
title: Grub bundles
description: The container that holds Forza Horizon 6 models, materials, textures and shader data, and its blob and metadata records.
sources:
  - title: ForzaTools
    url: https://github.com/Nenkai/ForzaTools
    note: the Grub bundle reader and writer for Forza Horizon 5
  - title: ForzaTech-extraction-tools
    url: https://github.com/Doliman100/ForzaTech-extraction-tools
    note: a Grub bundle reader in its modelbin importer
implementations:
  - name: forzatech-formats (bundle.rs)
    url: https://github.com/Kalmarv/forzatech-formats/blob/main/src/bundle.rs
---

A **Grub bundle** is the general container of ForzaTech: a header, a table of typed **blobs**, and for each blob a list
of small metadata records. The same container holds `.modelbin` models, `.materialbin` materials, `.pb` and
`.swatchbin` textures, `.shaderbin` shader data, `.crowdbin` crowds and the car colour lists
(`ManufacturerColors.bin`); what a bundle is for is decided by its blob tags. :proven Over the install, every entry
whose first four bytes are `burG` has one of those seven extensions, and every `.modelbin`, `.pb`, `.swatchbin`,
`.materialbin` and `.shaderbin` is a bundle. :proven

A bundle can sit inside a blob of another: a model's `MatI` blobs are material-instance bundles, and a crowd's `ClsL`,
`Clas`, `Mdls`, `Modl`, `MtlI` and `Skls` blobs are bundles, some of them holding bundles in turn. :proven

Every statement on this page marked :proven{games="fh6"} holds on every bundle of the Steam build's install, the
nested ones included: the 526,129 bundles of the Tokyo track's GeoChunks and the zips under `media` (196,620
models, 191,602 `.pb` and 126,527 `.swatchbin` textures, 9,707 materials, 987 shaders, 682 car colour lists and 4
crowds) and the 1,526,529 bundles nested in their blobs. A reader that refuses any value or byte the layout below does not account for reads all
of them, and Doliman100's reader gives the same blobs, metadata records and payloads on every one.

## Tags

A tag is a u32 whose big-endian bytes spell its name: `Modl` is stored as the bytes `ldoM`, and the bundle's own tag
`Grub` as the bytes `burG`. :proven Names below are written the way the tag reads, not the way the bytes run.

## Header

```layout
title: Grub bundle header
size: 20
games: [fh6]
note: Little-endian. Version 1.1 in every bundle.
fields:
  - {at: 0, size: 4, type: u32, name: tag, value: "Grub (bytes burG)", level: proven}
  - {at: 4, size: 1, type: u8, name: version major, value: "1", level: proven}
  - {at: 5, size: 1, type: u8, name: version minor, value: "1", level: proven}
  - {at: 6, size: 2, type: u16, name: reserved, value: "0", level: unknown, note: "0 in every bundle; readers of older versions take a u16 blob count here"}
  - {at: 8, size: 4, type: u32, name: header size, level: proven, note: "where the first blob's data starts"}
  - {at: 12, size: 4, type: u32, name: total size, level: proven, note: "the bundle's length"}
  - {at: 16, size: 4, type: u32, name: blob count, level: proven}
```

The blob records follow at 20, 24 bytes each. :proven

```layout
title: Blob record
size: 24
games: [fh6]
fields:
  - {at: 0, size: 4, type: u32, name: tag, level: proven}
  - {at: 4, size: 1, type: u8, name: version major, level: proven}
  - {at: 5, size: 1, type: u8, name: version minor, level: proven}
  - {at: 6, size: 2, type: u16, name: metadata count, level: proven, note: "8-byte metadata records"}
  - {at: 8, size: 4, type: u32, name: metadata offset, level: proven, note: "from the bundle's start"}
  - {at: 12, size: 4, type: u32, name: data offset, level: proven, note: "from the bundle's start"}
  - {at: 16, size: 4, type: u32, name: data size, level: proven}
  - {at: 20, size: 4, type: u32, name: data size again, level: unknown, note: "equal to the data size in every blob"}
```

```layout
title: Blob metadata record
size: 8
games: [fh6]
note: "A blob's records sit one after another at its metadata offset."
fields:
  - {at: 0, size: 4, type: u32, name: tag, level: proven, note: "Name, Id, BBox, TXCH, ATST, XTRA, ..."}
  - {at: 4, size: 2, type: u16, name: size and version, level: proven, note: "payload size = value >> 4 (0xFFF: see below), version = value & 0xF"}
  - {at: 6, size: 2, type: u16, name: payload offset, level: proven, note: "from this record's own start"}
```

A payload of 0xFFF bytes or more has 0xFFF in its size field and its true size in a u32 just before it; the record's
offset points past that u32. :proven Only 16 `VDCL` records of shader bundles are that large. :proven A reader that takes the 12-bit field as the size reads the first 0xFFF bytes of such a payload and, if it
packs payloads itself, misplaces the records after it.

## Arrangement

The parts follow one another with no byte unaccounted for. :proven

1. The header and the blob records.
2. For each blob in record order: its metadata records, then their payloads in record order, packed with no gaps. A
   blob without metadata has its metadata offset where the next blob's records would start.
3. The header ends where the metadata ends, rounded up to 4 with zero bytes, except in 11 `.swatchbin` textures
   whose header ends unaligned where the metadata does, so that their first blob's data starts unaligned. :proven
   The install's 11 `TXCB` blobs of version 2.0 are rain masks in the weather textures; that they are those same 11
   is :observed on the bundles inspected.
4. Each blob's data in record order: the first at the header size, each next one at the previous one's end rounded up
   to 4, the gap zero.
5. The bundle ends where the last blob's data ends, rounded up to 4 with zeros, except in 8,418 `.swatchbin`
   textures, which end where the data does, 1 to 3 bytes short of that. :proven

A metadata `Name` payload is a string without a terminator and can be empty. :proven

## Blob tags

| Tag | Used in | Holds | Confidence |
|---|---|---|---|
| `Modl` | model | counts, LOD range, material variant table ([Models](/engines/forzatech/geometry/modelbin/)) | :observed |
| `Mesh` | model | per-mesh draw record | :observed |
| `VLay`, `ILay` | model | vertex layout; `ILay` only in crowd models | :observed |
| `IndB`, `VerB` | model | index and vertex buffers | :observed |
| `MBuf` | model | morph target deltas | :observed |
| `Skel`, `Skin` | model | skeleton and skin weights; every model has a `Skel` | :observed |
| `Mrph` | cars | names of morph weight slots | :observed |
| `MatI` | model | a material instance: a nested bundle holding a `MATI` blob (the material it derives from) and an `MTPR` blob | :observed |
| `MATL`, `MTPR`, `MTUD` | material (`.materialbin`) | the material, its shader parameters ([Materials](/engines/forzatech/materials/materialbin/)) | :observed |
| `PARM`, `VARS`, `CBMP`, `TXMP`, `SPMP`, `CBEX`, `DFPR`, `LSCE`, `DBLS`, `TRGT`, `TXRF`, `VERS`, `VERT`, `SHUD` | shader | parameter names, variants, register maps and programs ([Shader containers](/engines/forzatech/shaders/shaderbin/)) | :observed |
| `TXCB` with `TXCH` metadata | texture | mip chain and its header ([Swatch textures](/engines/forzatech/textures/pb-swatch/)) | :observed |
| `MNCL` | car colour list | factory paints ([Cars](/engines/forzatech/gameplay/car-paint/)) | :observed |
| `ClsL`, `Clas`, `Mdls`, `Skls`, `Anim`, `MdMt`, `ExtI`, `MtlI`, `RigI`, `MtOv` | crowd | crowd classes, models, skeletons and animations, as nested bundles | :observed |

The blob versions over the install, nested bundles included: `Anim` 1.0, `CBEX` 1.0, `CBMP` 3.1, `Clas` 3.0, `ClsL`
1.0, `DBLS` 1.10, `DFPR` 2.1, `ExtI` 1.0, `ILay` 1.1, `IndB` 1.0, `LSCE` 1.10, `MATI` 1.0, `MATL` 1.2, `MBuf` 1.1,
`MNCL` 2.0, `MTPR` 2.0, `MTUD` 1.0, `MatI` 1.0, `MdMt` 1.0, `Mdls` 1.0, `Mesh` 1.12 and 1.13, `Modl` 1.0 (crowds), 1.4
and 1.5, `Mrph` 0.0, `MtOv` 0.0, `MtlI` 1.0, `PARM` 1.2, `RigI` 1.0, `SHUD` 1.0, `SPMP` 3.1, `Skel` 1.0, `Skin` 1.1,
`Skls` 1.0, `TRGT` 1.1, `TXCB` 0.0 and 2.0, `TXMP` 3.1, `TXRF` 1.1, `VARS` 1.8, `VERS` 1.2, `VERT` 1.1, `VLay` 1.1,
`VerB` 1.1. :proven
