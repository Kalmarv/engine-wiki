---
title: Near-field ground (megatexture)
description: How Forza Horizon 6 writes the ground colour near the camera with compute shaders from per-cell splat maps and per-layer textures, the file formats involved, the shader maths, and what only the running game holds.
---

Near the camera the ground colour is not the baked [far-field texture](/engines/forzatech/terrain/far-field-colour/). Compute
shaders write a **clipmap** every frame from per-cell **splat files** (`.mtxmoddxt`) and per-layer texture files
(`builtmegatexture\*.dxt`). Both file formats decode for every file, the channel-to-layer map of the splat weights is established,
and the shader maths for one to eight layers per tile reproduces bit-for-bit on real data. What places and parameterises the
layers is CPU-side, and none of it is in a readable file. :observed

Counts come from a recorded census of the Tokyo track `Brio` (988 `.mtxmoddxt` per season, 3,952 in all); the install is no
longer available. :observed

## What the files do not hold

| Run-time input | Where it lives | Why it is unreadable | Confidence |
|---|---|---|---|
| clipmap ring size (metres per texel) and ring origins (`terr_mega` pixel shader constant rows 36 to 42, 45 to 51) | engine | per-frame constants | :unknown |
| which layer record feeds which ring | CPU (the splat shaders' `SplatMaterialConstants` slots) | chosen by CPU code | :unknown |
| per-ring switches: modulate mode 0/1/2, BC1 diagonal check, height-blend sharpness | `MegaTexture.Params` (names in the executable: `ApplyModulatePerPixelLevel`, `CheckDiffuseDiagonalsLevel`, `HeightfieldBlendSharpnessPerMip`, `MinMip`, ...) | values in the encrypted `Rendering.zip` `Megatexture.xml` | :unknown |
| splat weights per texel (the float4 atlas) and which (at most 8) layers each clipmap tile draws | CPU, built from `.mtxmoddxt` (executable: `MegaTexture::UpdateBlendMapDecompressionCache`, `SplatMapAtlas`) | the byte layout and channel map are decoded; the atlas texel format, sampler and per-tile list are CPU-side | :unknown |
| per-layer weight scale (`SplatMaterialConstants` row 6 `.y`) and per-block height textures | CPU (`BlendHeight_R8`) | no file holds the scale; height files hold no record at the block resolution the shader reads | :unknown |
| GPU form of the layer textures (palette buffer, index and selector textures) | CPU, from the `builtmegatexture` files (`MegaTexture_SetupGPUTiledSourceTexture{BC1,BC3,BC5,...}`) | the file layout maps onto the shader inputs one to one | :observed |

None of the 30 splat shader names or the `MegaTexture::*` profiler names has a RIP-relative or absolute reference anywhere in the
executable (every code section scanned; only three references land in the megatexture string block), which means only that the
strings are not referenced directly. :observed

## How the pixel shader draws it

From the `terr_mega` G-buffer pixel shader (`_Default` variant, transcribed): the clipmap is a bindless `Texture2DArray` (space 4;
slot 3 albedo, slots 4, 5, 9 other channels). For ring `k = 0..6` the shader tests `|X + cam.x − C_k.x| ≤ C_k.z` and
`|Z + cam.z − C_k.y| ≤ C_k.w` (row 45+k) and takes the first ring that contains the point, adding the fade
`saturate(1 − 20 · margin · row[35+k].x · row[26].y)` to the ring index. Ring uv is `(P − O_k) · S_k` (row 36+k: `S` = `.x`,
`O` = `.zw`), the array slice is the ring index and the fractional part selects between the slice's two mips. For the finest rings
a uv × 2,048 indirection through `InterpolateFilterTexture` filters the slice (rings are 2,048 texels wide). :observed

## Splat shaders

`media\ShadersDXIL.zip` holds `MegaTextureSplat_{A,B,C}{,_G}_{1,4,8}`, `MegaTextureSplat_B_Hi{,_G}_{1,4,8}` and
`_DebugVis_{A,B,C}`. One 8 × 8 thread group handles a 32 × 32-texel clipmap tile, one thread a 4 × 4 block; each thread writes
finished BC blocks straight into the clipmap through UAVs (u0 colour, BC1). `_1`, `_4`, `_8` blend up to 1, 4 or 8 layers per tile
(weights from one float4 atlas `t0`, or `t0` for layers 0 to 3 plus `t1` for layers 4 to 7); `_G` adds a fifth UAV
(`GrassColour_BC1`); `_Hi` writes 16-byte blocks (`Normal_BC3`). Constant buffers: :observed

```
cb0 SplatTileConstants[64] (80 B): row 0 float4 atlasScaleOffset; row 1 int4 (srcBlockX, srcBlockY, dstBlockX, dstBlockY) in
                                   8-block units; row 2 int layerCount, float sharpness k, int, int; rows 3, 4 int4 material
                                   indices of layers 0-3, 4-7
cb1 SplatMaterialConstants[64] (112 B = 7 rows): row 0 {bindless index, size in blocks} of the palette / index / selector
                                   textures; row 3 the height texture; row 6 int flags, float weight scale
cb2 SplatConstants (40 B): r0.w = clipmap texel → modulate-cell scale; r1.xy = origin of the 4 × 4 modulate grid;
                           r1.z = modulate mode 0/1/2; r2.x = BC1 diagonal check
```

A layer texture reaches the shader as "palette DXT": a `StructuredBuffer<uint>` palette (R, G, B = bytes 0 to 2), a
`Texture2D<uint2>` of per-block palette indices `(i0, i1)` and a `Texture2D<uint>` of per-block selectors in BC1 order, addressed
with the clipmap block coordinate `& (size − 1)`: one layer texel per clipmap texel, wrapped. A layer's tiling in metres is
therefore its record size times the ring's texel size. :observed

### Single-layer colour (`MegaTextureSplat_B_1`, u0, exact in float32 in this order)

```
c0 = byte(pal[i0]) · 0.003921568859368563;  D = byte(pal[i1]) − byte(pal[i0])      per channel, bytes as floats
t_k = linear selector of texel k: BC1 index 0,1,2,3 → 0,3,1,2   (s' = ((s>>1 ^ s) & 0x55555555) | (s & 0x55555555) << 1)
T_k = (t_k · 0.0013071896973997355) · D + c0                                       (1/765 = 1/(3·255))
modulate M (per-cell 1024² maps on a 4 × 4 torus of cells):
  f = s · p   (s = cb2 r0.w, p = clipmap texel coordinate);   tile = ((floor f.x − ox) + 4 (floor f.y − oy)) & 15
  u = sat(f.x − floor f.x) · 0.9990234375 + 0.00048828125;   v = sat(floor f.y + 1 − f.y) · 0.9990234375 + 0.00048828125
overlay o(a, m): pivot P = 0.7320428490638733 (= 0.5^0.45), K1 = 3.7319400310516357 (= 1/(1−P)), K2 = 1.3660402297973633 (= 1/P)
  mode 1 (M at each texel):  a > P ? 1 − ((1−m)·K1)·(1−a) : (a·K2)·m for red, (m·K2)·a for green and blue
  mode 2 (M bilinear between the block corners p, p+4 at weights (k&3)·0.33333334, (k>>2)·0.33333334):
                             a > P ? 1 − ((1−a)·K1)·(1−m) : (a·K2)·m
  mode 0 (one M at the block corner, applied to the two palette endpoints, not to texels):
                             byte/255 > P ? 1 − (1−m)·(K1 − byte·0.014635059982538223) : (m·0.005357021000236273)·byte
                             → 565 with round_ne; endpoints swapped (selectors ^ 0x55555555) if c0 < c1; selectors 0 if equal
BC1 encode (modes 1, 2): bbox min/max of the 16 texels; if cb2 r2.x: the signs of the R-G and R-B covariances about the bbox
  centre swap the G and/or B extremes; inset 1/16 of the range; hi → c0, lo → c1 by round_ne(v · 31|63|31);
  if c1 ≥ c0: selectors 0, else index_k = round_ne(3 (T_k − hi)·(lo − hi) / |lo − hi|²) (linear order → BC1 order)
```

### Multi-layer colour (`MegaTextureSplat_B_4` for 2 to 4 layers, `_B_8` for 5 to 8)

```
corners c = 0..3 of the block (south-west, south-east, north-west, north-east; the shader's +y is north here):
  S_c = atlas sampled at uv = atlasScaleOffset.xy / 8 · (thread + (c & 1, c >> 1)) + .zw   (t0 = layers 0-3, t1 = 4-7)
  w_0 = max(S_c[0], 1e-6), w_i = S_c[i];   M = max(…max(w_0, w_1)…, w_i);   T = (…(w_0 + w_1) + w_2…) + w_i
  Ss = scale_i·w_i + (… + (scale_1·w_1 + scale_0·w_0));   hs = ((Ss·M) / T) · k     (scale = cb1 row 6 .y)
  height of layer i: Gather of its height texture at uv = ((block + 1) & (size − 1)) / size; corner 0 ← .w, 1 ← .z, 2 ← .x, 3 ← .y
  h_i = g_i·hs + w_i;   thr = max_i h_i − (1 − k)·M;   b_i = max(0, h_i − thr)
  sum = b_i + (… + (b_1 + b_0));   nb_i = (1 / sum) · b_i
  layer i > 0 is skipped when ((b_i[1] + b_i[0]) + b_i[2]) + b_i[3] == 0
texel k (fx = ((k & 3) + 0.5)·0.25, fy = ((k >> 2) + 0.5)·0.25), per layer i:
  bot = fx·(nb[3] − nb[2]) + nb[2];  top = fx·(nb[1] − nb[0]) + nb[0];  wt = fy·(bot − top) + top
  T_k = wt_0·T0_k, then T_k = wt_i·Ti_k + T_k        (Ti_k = layer i's palette texel as in B_1)
modes 1 and 2: o(a, m) = a > P ? 1 − ((1−a)·K1)·(1−m) : (a·K2)·m for every channel, then the B_1 encoder
mode 0: the B_1 encoder's bbox, diagonal check, inset and indices (against the unquantised endpoints, no c1 ≥ c0 test), then
  o'(e, m) = e > P ? 1 − ((1−m)·K1)·(1−e) : (m·K2)·e on the two float endpoints with one M at the block corner, quantised to 565
  with round_ne; hi > lo: (hi | lo << 16, sel); equal: selectors 0; else (lo | hi << 16, sel ^ 0x55555555)
```

With `k = 0` the heights drop out exactly (`hs = 0`, `thr = M − M = 0`, `b_i = w_i`), leaving the weight-normalised sum of the layers.
:observed These formulas were checked by running the compiled shaders in a DXIL interpreter on the same inputs and comparing
the output words: `B_1` 1,500 of 1,500 blocks at ring 4 and 1,500 of 1,500 at ring 6 (cell x−2046 z−10230); `B_4` and `B_8`
400 of 400 blocks at ring 4 (cell x−4092 z5115) and 400 of 400 at ring 6 (cell x−3069 z5115), two to eight layers. The real-data
run of `B_1` exposed an operation-order detail a random test had missed (mode 1 multiplies `(a·K2)·m` for red but `(m·K2)·a` for
green and blue). :observed This proves the reading of the shaders, not the run-time inputs. :observed

## .mtxmoddxt (the splat map of a cell)

`scene\intheightfield\autoterrain_x<l>_z<l>_<season>.mtxmoddxt`, one per cell and season (988 each): :observed

```layout
title: .mtxmoddxt
size: variable
games: [fh6]
note: "Little-endian. Tile rows run south to north; the trailing modulate map runs north to south."
fields:
  - {at: 0, size: 4, type: u32, name: version, value: 111, level: observed}
  - {at: 4, size: 4, type: u32, name: texels per cell side, value: 1024, level: observed}
  - {at: 8, size: 4, type: u32, name: tiles per side, value: 32, level: observed}
  - {at: 12, size: 4, type: u32, name: layer count N, level: observed}
  - {at: 16, size: "N × 4 strings", type: "str[]", name: layer names, level: observed, note: "per layer, four u32-length strings: diffuse, normal, roughness, height .dxt names; independent, a layer may pair gen_snow_fresh_4m_g_diffuse with gen_snow_rough_4m_g_normal"}
  - {at: "next", size: variable, type: "tile[1024]", name: tiles, level: observed, note: "32 × 32 tiles, row 0 = south"}
  - {at: "next", size: "0 to 3", type: u8, name: padding, level: observed, note: "to a 4-byte boundary"}
  - {at: "next", size: 524288, type: BC1, name: modulate map, level: inferred, note: "1,024 × 1,024, row 0 = north"}
```

A tile is `u8 mode` (bit 6: 16 × 16 blocks of 64 × 64 texels instead of 8 × 8; bits 0 to 5: *n* layers, 1 to 32 seen; bit 7
never set), then *n* `u8` layer indices into the *N* names (< N, distinct), then planes of 64 (256) blocks, one per group of
channels: *n* = 1 none; *n* = 2 one plane of 6-byte one-channel blocks `{u8 e0, u8 e1, u32 sel}`; *n* ≥ 3 *n* channels (three
for *n* = 4) in groups of three, where a group of 3 or 2 channels is a plane of BC1-form blocks and a group of 1 a plane of 6-byte
one-channel blocks. A BC1-form block is `00` = empty (1 byte); `01 02` plus three 6-byte one-channel blocks (20 bytes); `01` plus
an 8-byte BC1 block whose first byte is `00` or `01` (the escape, 9 bytes); else an 8-byte BC1 block. The escape explains itself:
green-dominant BC1 blocks start with `e0`/`e1` and red-dominant ones with `00`/`01`, which are the plane's empty and escape
markers. :observed

This grammar walks all 3,952 files (four seasons) exactly to the modulate map with 0 to 3 padding bytes, accounting for every
byte of every file. :observed Tile layer counts (summer, 120 files): 1 layer 21%, 2 to 4 layers 14%, 5 to 8 layers 16%, 9 or more
49%. :observed

**Orientation.** Tile rows run south to north and the modulate map north to south: on cell x−2046 z−10230 the modulate map's two
green patches (a park at the north-west corner, a strip at the east edge) sit exactly on multi-layer tiles of the opposite tile
row, and the modulate map is oriented like the far-field map. Within a tile, texel rows follow the tile rows. :observed

**Channel to layer.** Every plane maps BC1 green, red, blue (and the three one-channel blocks of an `01 02` block in R, G, B
order) to layers 3p, 3p+1, 3p+2 of the tile's list; a two-channel group maps green, red to 3p, 3p+1; a one-channel group to 3p; a
2-layer tile holds layer 0's weight. Next to a single-layer tile of layer L (200 summer files, 4,889 edges over 70 layer-count and
list-position pairs, up to 16 layers) the decoded channel the map gives L reads 1.00 on the shared edge and every other channel
0.00, for every list position seen. Of all six channel orders of 3-layer tiles scored over shared edges in 25 files, green, red,
blue = layers 0, 1, 2 mismatches 0.000 against single-layer neighbours (4,204 texels; next best 0.061), 0.019 against 2-layer
(next 0.222) and 0.039 against 3-layer neighbours (next 0.224). :observed

**Implied weights.** A 2-layer tile's second weight is 1 − the stored channel (continuous on both sides: 2-layer edges 0.020). A
4-layer tile stores three channels and the fourth weight is `max(0, 1 − their sum)`: next to the fourth layer alone the three
channels read 0.00 (55 edges in 200 files; 1 − sum = 0.998 on 36 such edges of a 60-file sample), and across 4,371 edges to tiles
of up to 4 layers the mismatch is 0.070 with it against 0.164 with none. 3-layer weights sum to 1 (mean 0.9998). :inferred

The trailing map is the modulate texture: one 1,024² map per 512 m cell, which is what the splat shader's 1,024-texel inset and
per-cell tile grid address; its neutral value is the overlay identity (cell x−2046 z−10230: mean 187/255 = 0.733 against the pivot
0.732); the executable names `ModulateBC1`, `ModulateBC7` and `DummyModulate`. :inferred `.mtp` files are grass-clutter maps, not
colour. :observed

## builtmegatexture layer files

`builtmegatexture\<layer>_{diffuse,normal,roughness,height}_{top,chain}.{dxt,hqdxt,hqbc3}`: `top.dxt` files sit in `GeoChunk2`,
`top.hq*` in `GeoChunk3`, `chain` files in `GeoChunk0`. Header: `u32 112, u32 flags, u32 len, char[len]` (the `.dxt` name the
`.mtxmoddxt` lists). Flags: `0x20` diffuse, `0x80` roughness, `0x40` normal, `0x500` height; `+0x4` top, `+0x2` chain; `+0x1`
on diffuse, roughness and height; `+0x8` on `.hqbc3`. :observed Diffuse and roughness files (`.dxt`, `.hqdxt`): :observed

```
u32 P;  P × u16 RGB565;  2P × u32: entry 2i = colour i expanded to RGB888 (bit replication, R in byte 0), entry 2i+1 = floor(that / 3)
records: { u32 width, u32 0, u32 selBytes (= width²/4), u32 0xFFFFFFFF, selBytes: u32 BC1-order selectors per 4 × 4 block,
           u32 idxBytes (= selBytes / 2), u32 0xFFFFFFFF, idxBytes: two u8 palette indices per block (i0, i1) }
```

Blocks are row-major. All 1,488 `.dxt` diffuse and roughness files (top and chain, every layer; 5,208 records) walk exactly to
their end, every palette index is below P, and every even table entry equals its RGB565 colour expanded. :observed This is the
shader's "palette DXT" input: palette = the even entries, index texture = the (i0, i1) pairs, selector texture = the selectors; a
record decoded the shader's way gives the expected seamless ground texture (for example `gen_grs_modulated_g`). :observed

Every layer (744 of 744) has exactly 7 diffuse records, `top` 2 and `chain` 5 (1,024 and 512 in `.dxt`, 2,048 and 1,024 in
`.hqdxt` for most layers, then the chain); the widths are not a mip chain (`gen_grs_suzuki_green_g_diffuse_chain.dxt`: 256, 512,
256, 512, 256). :observed Seven records per layer match the seven clipmap rings, one record per ring, and the height records follow
the same seven-slot pattern. :inferred A rule picking the record by width finds no record for some layers
(`gen_canopy_distant_trees_g`: 1,024, 512, 256, 512, 256, 128, 512); by index that layer is forest floor (mean colour 98, 79, 62)
in records 0 to 5 and tree canopy (39, 54, 10) in record 6, the ring that fades into the far field, whose map shows canopy
there. :inferred

Height files exist only as `.hqdxt` (726 files, 363 layers): `u32 0` (no palette) after the header, then 7 records per layer
`{width, 0, n, ~0, n bytes}`; record 0 has `n = width² / 4` (2 bits per texel, not decoded) and records 1 to 6 have `n = width²`
(one R8 height per texel; `BlendHeight_R8`). All 726 walk exactly, and in 346 of the 348 layers that also have `.hqdxt` diffuse
files the 7 height widths equal the diffuse widths index by index. :observed Normal files (flags `0x44`, `0x42`; `.hqbc3` `0x4C`,
`0x4A`) have another layout that is not decoded. :unknown

The first `_top.dxt` record of most layers is 1,024 texels, and the layers named for their size (`gen_snow_fresh_4m_g`,
`gen_snow_rough_4m_g`) have a 1,024-texel top record, so a 4 m layer at 1,024 texels suggests ring 0 near 1/256 m per texel and
ring 6 at 0.25 m, exactly the far-field texel. :inferred

## Where it matters

In the Shibuya area the `terr_mega` ground lies under road and pavement meshes everywhere (no downward ray on an 8 m grid hits it),
so the near field changes nothing visible there; parks (cell x−2046 z−9207) and the countryside show it. In the rural box (cells
−4,5 and −3,5) 1,464 of its 2,048 splat tiles have nine or more layers, so more than the shader's eight apply. :observed

:::open[What are the near-field ring sizes and per-ring switches?]
They live in per-frame constants and in the encrypted `Megatexture.xml`. The record-per-ring correspondence and the 1/256 m ring-0
texel are inferred from layer names and record widths only.
:::

:::open[What is the layout of the megatexture normal files and the 2-bit height record?]
`_normal` files (flags `0x44`, `0x42`, `.hqbc3`) and record 0 of the height files are not decoded.
:::
