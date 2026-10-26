---
title: TextureMap and CompiledMip
description: Image headers, external high-resolution mips, layered images and transfer flags.
games: [riders-republic, ghost-recon-breakpoint, "shaun-white-skateboarding"]
sources:
  - title: GRB modding reference
    url: https://github.com/dataterminals/grb-modding-knowledgebase/blob/main/docs/09-textures.md
implementations:
  - name: primase Anvil texture reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/texture.rs
  - name: primase Anvil mip reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/mip.rs
---

A **TextureMap** describes an image and its mip chain. Larger levels can live in separate **CompiledMip** resources, while smaller levels remain in the parent body. :observed{games="riders-republic"}
Breakpoint also uses TextureMaps and TextureSets, supports separately stored high-resolution mips and uses unswizzled PC textures. These community descriptions do not establish the Riders Republic byte offsets for Breakpoint. :sourced[GRB modding reference]{games="ghost-recon-breakpoint"}

## TextureMap header

The complete six-forge header/body census reads 46,338 TextureMaps to their exact body end and refuses 27 of the 46,365 entries. The proven framing below applies to those 46,338 accepted bodies, not to every codec or every mip-chain interpretation. :proven[46,338 read; 27 refused]{games="riders-republic"}

```layout
title: TextureMap body header
games: [riders-republic]
size: 51
note: Little-endian; excludes the resource identity and class prefix.
fields:
  - {at: 0, size: 1, type: u8, name: managed byte, value: 1, level: proven}
  - {at: 1, size: 4, type: u32, name: width, level: proven}
  - {at: 5, size: 4, type: u32, name: height, level: proven}
  - {at: 9, size: 4, type: u32, name: depth, level: proven}
  - {at: 13, size: 4, type: u32, name: array size, level: proven}
  - {at: 17, size: 4, type: u32, name: format code, level: proven}
  - {at: 21, size: 4, type: u32, name: dimension, level: proven, note: "1 flat; 2 cube; 3 volume"}
  - {at: 25, size: 4, type: u32, name: transfer flag, level: observed, note: "0 linear; 1 requests sRGB treatment for supporting formats"}
  - {at: 29, size: 4, type: u32, name: mip count, level: proven, note: "zero is a single-level image in 15 measured maps"}
  - {at: 33, size: 14, type: bytes, name: remaining header fields, level: unknown, note: "retained; meanings not assigned here"}
  - {at: 47, size: 4, type: u32, name: external mip count r, level: proven}
```

The external list uses nine bytes per mip: zero tag byte and u64 identity. The compiled header follows another nine bytes, beginning at `60+9r`. This list uses a different envelope from the ten-byte references inside Materials. :proven[46,338 read; 27 refused]{games="riders-republic"}

The 60-byte compiled header starts with `0x13237FE9` (`CompiledTextureMap`), u32 1, then width, height, depth, array size, mip count, format, dimension and transfer flag. Sixteen more bytes precede its pixel-byte length. The metadata repeats the outer header, and the held pixel span closes the resource body. :proven[46,338 read; 27 refused]{games="riders-republic"}

Held levels run largest first from level r to the last mip. Width and height halve per level with a minimum of one. A block-compressed flat level occupies `ceil(width/4)*ceil(height/4)*blockBytes`; uncompressed levels occupy `width*height*pixelBytes`. Two maps declare two mips while their pixels hold a complete ten-level chain, so the declared count alone does not always describe the held bytes. :observed[measured map framing and storage census]{games="riders-republic"}

RRAssetStudio's PNG export is flipped vertically against the stored texel order. On the TerrainMaterials detail maps, the correlation between a normal map's green channel and its height map's row gradient is −0.21 and −0.31 on the exported PNGs and +0.18 and +0.30 decoded in stored order, while red is unchanged. Comparisons that depend on rows (normal green, UV v, atlas rows, terrain rasters) need the two orders reconciled first. :observed[TerrainMaterials detail maps]{games="riders-republic"}

## External mip body

```layout
title: CompiledMip body
games: [riders-republic]
size: variable
fields:
  - {at: 0, size: 1, type: u8, name: managed byte, value: 1, level: observed}
  - {at: 1, size: 4, type: u32, name: image byte length n, level: observed}
  - {at: 5, size: n, type: bytes, name: image, level: observed}
  - {at: "5+n", size: 1, type: u8, name: stored byte, level: unknown, note: "0 in the four original fixtures"}
  - {at: "6+n", size: 8, type: u64, name: parent TextureMap identity, level: observed}
  - {at: "14+n", size: 4, type: u32, name: mip level, level: observed}
```

The parent and level fields distinguish an image's external mips from another image's data. Four original fixtures comprise three level-0 mips and one level-1 mip, each with exact body closure; a sampled BC7 parent names levels 0 and 1 whose sizes match its missing levels. :observed{games="riders-republic"}

## Cubes, volumes and generated maps

Each mip contains its layers consecutively. The measured storage uses the header's depth × array size × six faces for a cube at each held level; these byte counts account exactly for all 25 cube and volume maps in the examined install. This is the measured file layout, independently of a graphics API's volume-mip convention. :proven[25 layered maps' lengths]{games="riders-republic"}

Seventeen BC6H environment cubemaps are 512×512×6 and belong to WorldAmbiance looks. The complete face orientation is a separate question from the established layer byte counts. :observed{games="riders-republic"}

Two debug-font maps end after an external-reference count of zero and a lone null tag 3, without a compiled image. They are image-less stored resources rather than truncated mip chains. Runtime generation is the interpretation given by their debug-font use. :observed[stored form]{games="riders-republic"} :inferred[generation]{games="riders-republic"}

See [format codes](/engines/anvil/textures/format-codes/) for codecs and the transfer flag's format-specific limits.

:::open[Which image-less and layered profiles exist beyond these samples?]
The sampled layered lengths establish storage, not every cube-face orientation or runtime-generated image producer. :unknown{games="riders-republic"}
:::

## TextureMap in Shaun White Skateboarding

:only[shaun-white-skateboarding]

A Shaun White Skateboarding texture is one `TextureMap` object that holds its whole mip chain inline: there are no separate high-resolution mip resources. A `CompiledTextureMap` is embedded in the same body. Width, height, depth, format, dimension, gamma, mip count and the address and filter modes are stored twice, once outside and once inside the compiled part, and the two copies agree. :observed{games="shaun-white-skateboarding"}[level 01 and the extra forge]

```layout
title: "TextureMap body (Shaun White Skateboarding)"
size: "var"
games: [shaun-white-skateboarding]
note: "Little-endian. Body offsets, with the managed byte at 0. No trailing byte follows the compiled part."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "managed", "value": "1", "level": "observed"}
  - {"at": 1, "size": 4, "type": "u32", "name": "id", "level": "observed"}
  - {"at": 5, "size": 4, "type": "u32", "name": "class", "value": "0xA2B7E917", "level": "proven", "note": "CRC-32 of TextureMap"}
  - {"at": 9, "size": 4, "type": "u32", "name": "width", "level": "observed"}
  - {"at": 13, "size": 4, "type": "u32", "name": "height", "level": "observed"}
  - {"at": 17, "size": 4, "type": "u32", "name": "depth", "level": "observed"}
  - {"at": 21, "size": 4, "type": "u32", "name": "pixel format", "level": "observed", "note": "see the format table"}
  - {"at": 25, "size": 4, "type": "u32", "name": "dimension", "level": "observed", "note": "1 flat, 2 cube"}
  - {"at": 29, "size": 4, "type": "u32", "name": "gamma", "level": "observed", "note": "0 linear, 1 sRGB"}
  - {"at": 33, "size": 4, "type": "u32", "name": "mip count", "level": "observed", "note": "0 means one level"}
  - {"at": 37, "size": 12, "type": "u32[3]", "name": "address U, V, W", "level": "observed"}
  - {"at": 49, "size": 12, "type": "u32[3]", "name": "magnification, minification and mip filters", "level": "observed"}
  - {"at": 61, "size": 4, "type": "u32", "name": "map type", "level": "observed"}
  - {"at": 65, "size": 4, "type": "u32", "name": "category", "level": "observed"}
  - {"at": 69, "size": 3, "type": "u8[3]", "name": "flags", "level": "unknown", "note": "the first byte takes the values 0, 1, 2, 4 and 5"}
  - {"at": 72, "size": 4, "type": "u32", "name": "user category", "level": "observed"}
  - {"at": 76, "size": 1, "type": "u8", "name": "compiled pointer", "value": "0", "level": "observed", "note": "inline object follows"}
  - {"at": 77, "size": 4, "type": "u32", "name": "compiled id", "level": "observed"}
  - {"at": 81, "size": 4, "type": "u32", "name": "compiled class", "value": "0x13237FE9", "level": "proven", "note": "CRC-32 of CompiledTextureMap"}
  - {"at": 85, "size": 4, "type": "u32", "name": "pixel byte length P", "level": "observed"}
  - {"at": 89, "size": "P", "type": "bytes", "name": "pixels", "level": "observed", "note": "levels largest first; cube maps hold six complete mip chains face by face"}
  - {"at": "89+P", "size": 60, "type": "u32[15]", "name": "compiled copy", "level": "observed", "note": "platform 2, SDK 32, width, height, depth, mips, format, dimension, gamma, address U V W, three filters"}
```

The texture reached from a material is a `TextureMapSpec` object whose last `u32` is the `TextureMap` id. :observed

The level cells of level 01 hold 6,413 TextureMaps and the 48 standalone texture-spec entries of the extra forge hold 48, with 2,434 unique TextureMap ids. They include 55 cube maps (2,484 unique faces), and their 13,019 decoded mip levels decode to the same pixels as an independent block decoder. :observed[level 01 and the extra forge]

Graphical interface textures keep their rows upside down. The loading screens of the extra forge are 1280 by 720 block-compressed images stored this way. :observed
