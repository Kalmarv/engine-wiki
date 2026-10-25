---
title: TextureMap and CompiledMip
description: Image headers, external high-resolution mips, layered images and transfer flags.
games: [riders-republic, ghost-recon-breakpoint]
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
