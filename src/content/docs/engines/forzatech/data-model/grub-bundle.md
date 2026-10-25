---
title: Grub bundles
description: The container that holds Forza Horizon 6 models, materials, textures and shader data, and its blob and metadata records.
sources:
  - title: ForzaTools
    url: https://github.com/Nenkai/ForzaTools
    note: the Grub bundle reader for Forza Horizon 5
  - title: ForzaTech-extraction-tools
    url: https://github.com/Doliman100/ForzaTech-extraction-tools
    note: modelbin constants for FH5
---

A **Grub bundle** is the general container of ForzaTech: a header, a table of typed **blobs**, and for each blob a list
of small metadata records. The same container is used for `.modelbin` models, `.materialbin` materials, `.pb` and
`.swatchbin` textures, `.shaderbin` shader data, car colour lists and the livery masks. What a bundle is for is decided
by its blob tags. :observed

A bundle can also sit inside another: a model's material instance (`MatI`) is a bundle of its own. :observed

## Structure

```layout
title: Grub bundle header
size: variable
games: [fh6]
note: Little-endian. A blob count of the legacy u16 is superseded by the u32 when the version is 1.1 or later.
fields:
  - {at: 0, size: 4, type: u32, name: tag, value: "0x47727562 (Grub)", level: observed}
  - {at: 4, size: 1, type: u8, name: version major, level: observed}
  - {at: 5, size: 1, type: u8, name: version minor, level: observed}
  - {at: 6, size: 2, type: u16, name: blob count (legacy), level: observed}
  - {at: 8, size: 8, type: "u32[2]", name: reserved, level: observed, note: "source data address and file size per the reader"}
  - {at: 16, size: 4, type: u32, name: blob count, level: observed, note: "present when the version is 1.1 or later; this is the one to read"}
  - {at: 20, size: "24 × blob count", type: "blob record[]", name: blob records, level: observed}
```

```layout
title: Blob record
size: 24
games: [fh6]
fields:
  - {at: 0, size: 4, type: u32, name: tag, level: observed, note: "four ASCII characters, see the table below"}
  - {at: 4, size: 1, type: u8, name: version major, level: observed}
  - {at: 5, size: 1, type: u8, name: version minor, level: observed}
  - {at: 6, size: 2, type: u16, name: metadata length, level: observed, note: "number of 8-byte metadata records"}
  - {at: 8, size: 4, type: u32, name: metadata offset, level: observed, note: "absolute"}
  - {at: 12, size: 4, type: u32, name: data offset, level: observed, note: "absolute"}
  - {at: 16, size: 4, type: u32, name: data size, level: observed}
  - {at: 20, size: 4, type: u32, name: unknown, level: unknown}
```

```layout
title: Blob metadata record
size: 8
games: [fh6]
note: "`metadata length` of these sit at the blob's metadata offset, indexed by i."
fields:
  - {at: 0, size: 4, type: u32, name: tag, level: observed, note: "`Name` 0x4E616D65, `Id` 0x49642020, `BBox` 0x786F4242, `TXCH` 0x54584348 for textures"}
  - {at: 4, size: 2, type: u16, name: version and size, level: observed, note: "size = value >> 4, version = value & 0xF"}
  - {at: 6, size: 2, type: u16, name: offset, level: observed, note: "relative to this record: the payload is at metadata offset + i × 8 + offset"}
```

On a scene model the first `Skel` blob sits at data offset 0x65C, and each following blob is 4-byte aligned. :observed

## Blob tags

| Tag | Used in | Holds | Confidence |
|---|---|---|---|
| `Modl` | model | counts, LOD range, material variant table ([Models](/engines/forzatech/geometry/modelbin/)) | :observed |
| `Mesh` | model | per-mesh draw record | :observed |
| `VLay` | model | vertex layout | :observed |
| `IndB`, `VerB` | model | index and vertex buffers | :observed |
| `MBuf` | model | morph target deltas | :observed |
| `Skel`, `Skin` | animated models, cars | skeleton and skin weights | :observed |
| `Mrph` | cars | names of morph weight slots | :observed |
| `MatI` (0x4D617449), `MatL` (0x4D41544C), `ITAM` (0x4D415449) | model, car | a material instance; `ITAM` is the form nested bundles use | :observed |
| `MTPR`, `DFPR` | material, shader | shader parameters ([Materials](/engines/forzatech/materials/materialbin/)) | :observed |
| `PARM`, `VARS`, `CBMP`, `TXMP`, `SPMP`, `CBEX` | shader | parameter names, variants and register maps ([Shader containers](/engines/forzatech/shaders/shaderbin/)) | :observed |
| `TXCB` with `TXCH` metadata | texture | mip chain and its header ([Swatch textures](/engines/forzatech/textures/pb-swatch/)) | :observed |
| `LCNM` | car colour list | factory paints ([Cars](/engines/forzatech/gameplay/car-paint/)) | :observed |

Within a model every mesh refers to its index buffer by position, and each file has exactly one `IndB`. :observed

## Byte order of tags

A blob tag appears in the file in reversed byte order of how it is written above when read as ASCII (the `MTPR` blob has
the bytes `RPTM`, the `LCNM` blob the bytes `MNCL`, the `PARM` blob the bytes `MRAP`). :observed
