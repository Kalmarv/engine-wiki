---
title: TBF terrain files
description: Breakpoint's external terrain quadtree, predictive height codec and terrain material records.
games: [ghost-recon-breakpoint]
sources:
  - title: GRB terrain reader
    url: https://github.com/dataterminals/grb-modding-knowledgebase/blob/main/tools/tbf_read.py
  - title: GRB terrain material reader
    url: https://github.com/dataterminals/grb-modding-knowledgebase/blob/main/tools/terrain_material.py
---

Breakpoint keeps terrain nodes in `PCtgt_terrainlin0.tbf`, `PCtgt_terrainlin1.tbf` and `PCtgt_terrainlin2.tbf` in the install root. This is a different storage/codec profile from Riders Republic's [TNLChunk resources](/engines/anvil/terrain/height-and-node-storage/), even though both use 132×132 sampled tiles and quadtree positions. :sourced[GRB terrain reader]

## Header and tables

```layout
title: TBF file header
size: 28
note: Little-endian; Breakpoint version 2, as read by the community terrain reader.
fields:
  - {at: 0, size: 4, type: bytes, name: magic, value: "FBT\\0", level: sourced}
  - {at: 4, size: 4, type: u32, name: file version, value: 2, level: sourced}
  - {at: 8, size: 4, type: u32, name: field a, level: unknown, note: "32768 in lin0/lin1; 2703228928 in lin2"}
  - {at: 12, size: 4, type: u32, name: field b, level: unknown, note: "65536 in lin0/lin1; 1992864825 in lin2"}
  - {at: 16, size: 4, type: u32, name: field c, level: unknown, note: "64 in lin0/lin1; 59 in lin2"}
  - {at: 20, size: 4, type: f32, name: height range in metres, value: 1500, level: sourced}
  - {at: 24, size: 4, type: u32, name: node count, value: 349525, level: sourced}
```

The header is followed by one u64 offset per node, then one `(f32 minHeight,f32 maxHeight)` pair per node. Zero offset means the node is absent from that file. Nodes use index `(4^L-1)/3+row*2^L+column`, with ten levels. The second table is height bounds, not another offset table. :sourced[GRB terrain reader]

The first two files partition the main tree. lin0 holds complete levels 0, 1 and 5 plus a central 3×3 region at other levels; lin1 holds the remaining nodes. lin2 contains a localized chain whose purpose is unresolved. :sourced[GRB terrain reader]

## Node data

Each node begins with u16 `0xFEED`, u16 node version 16, byte 1, u32 compressed height length and zlib-compressed heights. Length-prefixed blocks follow, then a 40-byte trailer containing two floats and a 256-bit material mask. The trailer floats' meanings are not established by the community reader. :sourced[GRB terrain reader] :unknown[trailer floats]

The height stream decodes to 17,424 int32 values through int16 tokens: `0x7FFF` restarts with two following int32 literal samples; otherwise `height[i]=2*height[i-1]-height[i-2]+token`. Prediction continues across row boundaries. Metres are `value*1500/2^20`. The community reader reports exact consumption and token-stream round trips on sampled nodes. :sourced[GRB terrain reader]

The tile has a 128-sample pitch and a two-sample apron on each side. The world spans 32,768 metres centred at the origin, giving .5-metre leaf samples. `gx=(x+16384)/32768*65536`, tile column `floor(gx/128)`, and local sample `gx-128*column+2`; y maps to rows the same way. :sourced[GRB terrain reader]

| Following block | Encoding | Confidence |
|---|---|---|
| Material raster | Byte RLE with escape `0xFF` | :sourced[GRB terrain reader] |
| Second raster | Byte RLE with escape `0xFE` | :sourced[GRB terrain reader] |
| Two further rasters | Byte RLE with escape `0x00` | :sourced[GRB terrain reader] |
| Colour | Decoded length 8,712, Oodle-compressed BC1 | :sourced[GRB terrain reader] |
| Parameter image | Decoded length 17,424, Oodle-compressed BC7 | :sourced[GRB terrain reader] |

RLE represents literal bytes or `marker,count,value`, with byte counts 1–255. The escape marker comes from the block's slot and is not stored separately. :sourced[GRB terrain reader]

## Referenced material bank

TerrainMaterialBank supplies counted detail references, counted material references and one displacement reference. A material-raster value k indexes the material list in stored order. The community reader's 190 Breakpoint TerrainMaterial records are 356 bytes including their twelve-byte identity/type header; the final u32 is the bank index. :sourced[GRB terrain material reader]

Those records share a TextureSet identity and four map links for diffuse, normal, height and Mask1. They contain six tint records in two groups, a hole flag at offset 323 and a ground-material identity at 340, all measured from the record start including that twelve-byte header. Tint semantics are not established; the presumed UV scale/tiling fields at 75/79 are interpretations by value. :sourced[GRB terrain material reader] :unknown[tint semantics]

:::open[Which fields are rendering parameters?]
The three header words differ in lin2, its localized node chain has no established role, and the BC7 parameter channels and terrain tint semantics remain unresolved. Community codec and layout claims have not been independently checked against a Breakpoint install here. :unknown
:::
