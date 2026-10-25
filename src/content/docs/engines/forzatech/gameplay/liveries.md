---
title: Liveries and vinyl designs
description: The Forza Horizon 6 livery container, the group and layer grammar, vinyl and decal shapes, and how the layers are composited into the paint canvas.
sources:
  - title: ForzaDesigner6
    url: https://github.com/tokyubevoxelverse/ForzaDesigner6
    note: MIT. Published in-memory layer semantics (position, scale, rotation, colour, mask flag; shape 101 rectangle, 102 ellipse; scale divisors 127 and 63)
  - title: forza-painter-fh6
    url: https://github.com/bvzrays/forza-painter-fh6
    note: MIT. The research ForzaDesigner6 credits
---

A livery is a tree of vinyl **layers** (a shape, a colour, a transform) grouped per region of the car body and composited into one
2,048 × 1,024 canvas that the paint shader samples. The saved designs the platform keeps for the player are plain, unencrypted
containers. The layer fields (position, scale, rotation, colour, mask flag) and shape ids 101 (rectangle) and 102 (ellipse) with the scale
divisors 127 and 63 are published by the ForzaDesigner6 research. :sourced[ForzaDesigner6] They match the file fields below; the file
layout itself (container, grammar, tail, decal flag, shape-id rule) is not in either source. :observed

Every file of the shipped livery and of every plain design container of one player's save (69 `Livery_`, 4 `BaseLivery_`, 7 `LayerGroup_`:
206,102 layers in all) parses to its last byte with the grammar below, and the tail's per-section layer counts equal the parsed counts
on all 73 liveries. :observed

## Where liveries live

```
media\Livery\Vinyls.zip               1,480 vinyl shapes <G>_<NN>.modelbin (2-D meshes), groups A B C D E F G H I K KK L LL M MM N NN O OO P PP Q QQ R RR S SS T TT U UU V VV WW XX
                                      (no J, W, X); U and V hold 80 (U_01..80, V_01..40 + V_51..90), the others 40. K..XX are fonts (mesh names Text01 / Text001, NN = letter index: a = 1)
media\Livery\Decals.zip               270 decals: decalNNN.modelbin + Textures\decalNNN.swatchbin (BC7 sRGB)
media\Livery\DecalsHiRes.zip          188 higher-resolution decal textures
media\Livery\EntitlementLiveries.zip  shipped designs: <name>\header, C_livery, bigThumb.webp (one: se_supra)
media\Cars\<CAR>.zip  LiveryMasks\    Masks.xml + front/back/top/left/right/glass_*.swatchbin (2048×1024 BC4 UNORM)
media\ShadersDXIL.zip                 LiveryModel{.vshader,_OpaqueOnly,_NonOpaqueOnly,_OpaqueNonOpaque}.pshader, LiveryBlitMask,
                                      LiveryBlitSectionToLivery, LiveryBlitGroupToFinal(_Node), ...
media\Rendering.zip  Livery.xml       method 22 (deflate + TFIT): not readable
```

The saved designs sit in the platform's game-save folder as one directory per container, one file per blob ([Saves and tunes](/engines/forzatech/gameplay/saves-and-tunes/)):
`Livery_<carId>_<yyyymmddhhmmss>` (`C_livery`, `header`, `bigThumb.webp` rendered by the game), `BaseLivery_<carId>_m0_<time>`, and
`LayerGroup_0000_<time>` (`C_group`, `header`, `thumb.webp`, a saved vinyl group). `SoulBoundLivery_*` and `User_*` are
TFIT-protected. :observed

## Container files

`C_livery` and `C_group` are `u32 compressedSize, u32 size, zlib stream` (compressed size + 8 = file size; inflated length = size).
:observed `header` is little-endian with UTF-16LE strings (`u32 count` plus code units): :observed

```layout
title: Livery header
size: variable
games: [fh6]
fields:
  - {at: 0, size: 4, type: u32, name: version, value: 7, level: observed}
  - {at: 4, size: variable, type: str16, name: title, level: observed}
  - {at: "next", size: variable, type: str16, name: description, level: observed}
  - {at: "next", size: 16, type: SYSTEMTIME, name: time, level: observed, note: "all zero in the shipped design"}
  - {at: "next", size: 4, type: u32, name: kind, level: observed, note: "3 livery, 2 group"}
  - {at: "next", size: 8, type: u64, name: creator id, level: observed}
  - {at: "next", size: variable, type: str16, name: creator, level: observed}
  - {at: "next", size: variable, type: bytes, name: rest, level: unknown, note: "u32 1 and GUIDs"}
```

### C_livery

```
0x00 'vlrc'  u32 2 (version)  u32  u32  u32 carId (= the carbin car id)  6 bytes (byte 0x14 = 0..9, not decoded)
     'yrvl'  u32 0x13  19 bytes (contains the creator id; not decoded)
     'gyvl'  11 root groups, one per Masks.xml region in this order:
             Front Back Top Left Right Wing Glass_Front Glass_Back Glass_Top Glass_Left Glass_Right
     tail    'yrvl' | 12 × u32 (layers in each of the 11 sections, then 0)
             'yrvl' | u8 0 | u8 2 | u32 count | u32 0 | count × paint-slot record (27 B)
             u32 m | m × u64 slot hash | 'yrvl' | u32
```

A group is recursive: `f32 x, f32 y, f32 scale, f32 rotation (deg) | u8 flags | [f32 scaleY if flags & 0x10, else scaleY = scale] | u16 n | u32
k = ceil(n/8) | k bytes (bit i, LSB first, set = child i is a group) | [u8 extra (0 or 1, not decoded) if flags & 0x20]`, then *n* children in
draw order (group or layer). Flags seen: 00, 20, 30, 60, 70; `0x40` has no payload and is set on groups that hold mask-flag layers (not
all of them). :observed

```layout
title: Livery layer
size: 32
games: [fh6]
fields:
  - {at: 0, size: 1, type: u8, name: tag, value: 2, level: observed}
  - {at: 1, size: 2, type: u16, name: shape, level: observed, note: "bit 15 clear = vinyl shape id; set = decal id (bits 0 to 14)"}
  - {at: 3, size: 4, type: f32, name: rotation, level: observed, note: "degrees"}
  - {at: 7, size: 8, type: "f32[2]", name: "position x, y", level: observed}
  - {at: 15, size: 8, type: "f32[2]", name: "scale x, y", level: observed}
  - {at: 23, size: 4, type: f32, name: skew, level: observed}
  - {at: 27, size: 4, type: "u8[4]", name: colour, level: observed, note: "B, G, R, A as stored; alpha 0 to 255"}
  - {at: 31, size: 1, type: u8, name: mask, level: observed, note: "0 or 1"}
```

```layout
title: Paint-slot record
size: 27
games: [fh6]
fields:
  - {at: 0, size: 8, type: u64, name: slot hash, level: observed, note: "FNV-1a-64 of the carbin material-slot name; 0xF7DBE8A7C839A675 = Body"}
  - {at: 8, size: 1, type: u8, name: two, value: 2, level: observed}
  - {at: 9, size: 1, type: u8, name: has colour, level: observed}
  - {at: 10, size: 4, type: "u8[4]", name: colour, level: observed, note: "B, G, R, A"}
  - {at: 14, size: 5, type: "u8[5]", name: zero, level: observed}
  - {at: 19, size: 4, type: i32, name: paint type, level: observed, note: "3 or −1; the index → file table is not readable"}
  - {at: 23, size: 4, type: i32, name: flag, level: observed, note: "0 or 1"}
```

A design's colour for a slot is e.g. "959 Gulf" Body = #BCE3EB, "Baby blue" #0085FF; designs with no colour record keep the car's own paint
(the garage car's colour is not in the design). :observed

### C_group

`'gyvl' | 9 bytes (u32 1, u32 0, u8 3 on all 7) | one group without its 0x20 byte | u8 (that byte, stored last)`. The children follow the group
grammar. :observed

## Shapes

- **Vinyl id = 100 × G + n** → `Vinyls.zip` entry `<group>_<nn>.modelbin`, n = the file number. The id → group table is in no readable file.
  Confirmed by comparison with the game's own thumbnails: G 1 to 9 are A to I (101 = A_01 square, 102 = A_02 circle, matching the published
  101 and 102), and G 21 = U ("Super Wheelspin" draws its sunburst rays and the black plates behind its text with 2110 = U_10, a
  parallelogram; "Top Replica!" its Subaru stars with four 2104 = U_04). :observed
- G 19 and G 35 are fonts with n = letter (a = 1): 19 spells "rallyemontecarlo", 35 "R BURNS" and "R REID". Which of the 23 font groups
  each id names is not confirmed. :observed
- Over all 206,102 layers, G 10, 11, 12, 25, 32 and 33 never occur and ids reach G = 38 (36 to 38: 622 layers), so the table has at least 38
  entries for 35 groups. The "G-th name of the ordinal-sorted list" rule is disproven for 21 (it gives a font) and unconfirmed for the
  other groups. Ids with G = 36, 37, 38 and ids 2000 and 3000 (n = 0) have no file under that rule. :observed
- A decal id *d* → `Decals.zip` `decal<d, 3 digits>.modelbin` + `Textures/decal<d>.swatchbin` (se_supra uses decal364). :observed
- Mesh: positions after the mesh's position scale and offset, x and y used (z = 0), no axis change; `COLOR0.a` is the per-vertex alpha
  (anti-aliased edges); decal uv = `TEXCOORD0` after the mesh uv transform; `A_01` spans ±0.25. :observed

## Compositing

Read from the livery shaders. `LiveryModel.vshader`: `p = (POSITION · positionScale + positionOffset) × element 3×4 matrix × 4×4
view-projection`; `uv = TEXCOORD0 · scale + offset`; `COLOR0.a` passes through. `LiveryModel_*.pshader`: colour = constant buffer rgb, or the
decal texel when the decal switch is set (the layer rgb is then unused); `α = cb.a · COLOR0.a (· texel α)`; output `(colour·α, α)`,
premultiplied. `_OpaqueOnly` discards α < 1, `_NonOpaqueOnly` discards α = 0 and α = 1 (two passes, equivalent to drawing in order when
the opaque pass writes depth by draw order). `LiveryBlitMask` writes 1 where `mask.r ≥ 0.001` (the region clip). `LiveryBlitGroupToFinal_Node`:
the group target is a `Texture2DMS`; the resolve averages all samples. `LiveryBlitGroupToFinal` and `LiveryBlitSectionToLivery`:
`result = lerp(dst, cb1.rgb, t.a · cb1.w)` when `cb1.w > 0`, else a copy. :observed

The node and region transforms, confirmed by comparing rendered canvases with the game's own thumbnails of "7 Eleven X Forza" (se_supra),
"959 Gulf", BRAT "199 Ghymkhana", and the Impreza "Top Replica!" and "Super Wheelspin": :observed

```
node(x, y, sx, sy, rot, skew) = translate(x, y) · rotate(rot, CCW, y up) · shear(x += skew·y) · scale(sx, sy)
layer to region: root group · … · group · layer, shape vertex × 254 (the 127 / 63 divisors: A_01 full width = 127 at scale 1)
region to canvas: X = xorigin + x·xScale, Y = yorigin + y·yScale; pixel = (1024 + X, 512 − Y)   (Masks.xml)
draw: layers in file order, pixel-centre coverage, premultiplied "over"; pixels with mask.r < 0.001 skipped
mask-flag layer: erases its group's earlier layers (dst × (1 − α)); the group is composited "over" its parent colour
colour bytes are sRGB-decoded to linear (decals are BC7 sRGB)
```

The mask-layer erase rule (CPU blend state) is checked on thumbnails only. :observed

## On the car

In `car_automotive_paint` ([Car materials](/engines/forzatech/shaders/car-materials/)): with `UserLiverySwitch` (`cb0[27].x`) and
`cb11[0].x ≤ −1`, `L = sample(canvas, (TEXCOORD3.u × 0.5, TEXCOORD3.v))` (× 0.5 when `cb4[29].y ≠ 0`, the car paint case; established by
overlaying UV3 on the masks), `L.rgb /= L.a`, `paint = lerp(paint, L, L.a)` after the colour flop, `FlakeCoverage' = FlakeCoverage · (1 − L.a)`
and `FlakeRoughness' = lerp(FlakeRoughness, 0.4, L.a)`; the coat roughness is lerped by `L.a` towards a term with the run-time `cb4[62].y`. So
the livery replaces the flakes under it as well as the paint colour; the se_supra and 959 renders go from washed-out to matching once it
is applied. :observed `UniqueLiverySwitch` (`cb0[26].w`) lerps the paint to the material's `BaseColorAlpha` (a per-car livery texture) by its
alpha mask, not a design. `UserColorOverride` (`cb0[26].x`) makes `PaintColor` and `FlakeColor` both `UserColor0` (`cb0[2]`). The glass
families sample only the canvas alpha; the glass livery colour path was not traced. :observed

:::open[What do the unconfirmed livery fields mean?]
The `vlrc` +0x14 byte, the 19-byte `yrvl` block, the 0x20 extra byte of a group, the group-to-shape table for vinyl groups other than A to I
and U, and the paint type values 3 and −1 are read but not interpreted.
:::
