---
title: TPF texture packages
description: PC package headers, variable descriptors, DDS payloads and pixel decoding evidence.
sources:
  - title: SoulsFormatsNEXT
    url: https://github.com/soulsmods/SoulsFormatsNEXT/tree/master/SoulsFormats/Formats/TPF
    note: TPF reference reader
  - title: bcdec
    url: https://github.com/iOrange/bcdec
    note: Independent BC pixel decoder
  - title: Smithbox
    url: https://github.com/vawser/Smithbox
    note: the file-name list of the asset texture packages
implementations:
  - name: fromsoft-formats (tpf.rs)
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/tpf.rs
---

PC TPF packages contain named DDS payloads, including their mip chains and any cubemap faces or volume slices.
The package's format byte is metadata beside the DDS; the DDS also declares its own pixel format. :observed

Sekiro's whole-install comparison visits packages inside ordinary and split binders, compares independent
metadata and DDS payloads, and accounts for entries both readers reject. The evidence is exhaustive for the
reference-readable package population: 14,481 packages holding 30,613 textures. One archive entry is refused
before its contents can be inspected; none of those 14,481 package records is refused. The proof does not
cover the unread archive payload. :proven{games="sekiro"}

## Header and descriptors

Elden Ring's 274,440 PC packages (301,807 textures; the `DLC` archive pair is not installed) were each read by a strict
reader that accounts for every byte of the file. All of them read, the 221,796 packages whose texture descriptors carry
the flag `0x80` once that byte is accepted. :proven{games="elden-ring"} The layouts below therefore hold for both games.

```layout
title: PC TPF header
games: [sekiro]
size: 16
fields:
  - {at: 0, size: 4, type: char, name: magic, value: 'TPF\0', level: proven}
  - {at: 4, size: 4, type: u32, name: data size, level: proven}
  - {at: 8, size: 4, type: u32, name: texture count, level: proven}
  - {at: 12, size: 1, type: u8, name: platform, value: 0, level: sourced, note: PC.}
  - {at: 13, size: 1, type: u8, name: package flags, level: unknown, note: 3 in every package; meaning not established.}
  - {at: 14, size: 1, type: u8, name: name encoding, level: proven, note: "1 is UTF-16 (14,480 packages); 2 is a byte string (one package, 17 ASCII names)"}
  - {at: 15, size: 1, type: u8, name: reserved, value: 0, level: proven}
```

```layout
title: PC TPF header
games: [elden-ring]
size: 16
fields:
  - {at: 0, size: 4, type: char, name: magic, value: 'TPF\0', level: proven}
  - {at: 4, size: 4, type: u32, name: data size, level: proven}
  - {at: 8, size: 4, type: u32, name: texture count, level: proven}
  - {at: 12, size: 1, type: u8, name: platform, value: 0, level: sourced, note: PC.}
  - {at: 13, size: 1, type: u8, name: package flags, level: unknown, note: 3 in every package; meaning not established.}
  - {at: 14, size: 1, type: u8, name: name encoding, level: proven, note: 1 is UTF-16 in every package.}
  - {at: 15, size: 1, type: u8, name: reserved, value: 0, level: proven}
```

```layout
title: PC TPF texture descriptor prefix
games: [sekiro]
size: 20
fields:
  - {at: 0, size: 4, type: u32, name: payload offset, level: proven}
  - {at: 4, size: 4, type: u32, name: payload length, level: proven}
  - {at: 8, size: 1, type: u8, name: package format code, level: sourced}
  - {at: 9, size: 1, type: u8, name: texture kind, level: proven, note: 0 image; 1 cube; 2 volume.}
  - {at: 10, size: 1, type: u8, name: mip count, level: proven}
  - {at: 11, size: 1, type: u8, name: texture flags, level: unknown, note: 0 in every texture; meaning not established.}
  - {at: 12, size: 4, type: u32, name: name offset, level: proven}
  - {at: 16, size: 4, type: u32, name: optional metadata present, level: proven}
```

```layout
title: PC TPF texture descriptor prefix
games: [elden-ring]
size: 20
fields:
  - {at: 0, size: 4, type: u32, name: payload offset, level: proven}
  - {at: 4, size: 4, type: u32, name: payload length, level: proven}
  - {at: 8, size: 1, type: u8, name: package format code, level: sourced}
  - {at: 9, size: 1, type: u8, name: texture kind, level: proven, note: 0 image; 1 cube; 2 volume.}
  - {at: 10, size: 1, type: u8, name: mip count, level: proven}
  - {at: 11, size: 1, type: u8, name: texture flags, level: unknown, note: "0, or 0x80 on the 221,796 textures of the map environment-probe packages; meaning not established"}
  - {at: 12, size: 4, type: u32, name: name offset, level: proven}
  - {at: 16, size: 4, type: u32, name: optional metadata present, level: proven}
```

```layout
title: Optional TPF metadata
games: [sekiro]
size: variable
fields:
  - {at: 0, size: 4, type: u32, name: metadata identifier, level: unknown}
  - {at: 4, size: 4, type: u32, name: payload byte length, level: proven}
  - {at: 8, size: payload byte length, type: u32 array, name: metadata words, level: unknown, note: Length is a multiple of four; words are not necessarily floats.}
```

```layout
title: Optional TPF metadata
games: [elden-ring]
size: variable
fields:
  - {at: 0, size: 4, type: u32, name: metadata identifier, level: unknown}
  - {at: 4, size: 4, type: u32, name: payload byte length, level: observed}
  - {at: 8, size: payload byte length, type: u32 array, name: metadata words, level: unknown, note: Length is a multiple of four; words are not necessarily floats.}
```

Optional metadata immediately follows its descriptor prefix, so descriptors are not necessarily a fixed-stride
array. Names and payload offsets are file-relative. Payloads start with `DDS `.
:proven[all 14481 packages]{games="sekiro"} :proven[all 274,440 packages]{games="elden-ring"}

In both installs the descriptor's texture kind byte agrees with the DDS file's own caps: every kind-1 texture is a
cube map (cubemap caps set), every kind-2 texture a volume (volume caps set) and every kind-0 texture neither, over all
30,613 Sekiro and 301,807 Elden Ring textures. :proven No texture of either install has the optional metadata (the
present flag is 0 in every descriptor), so the metadata layout below is not exercised by the shipped files. :proven
The package platform byte is 0 (PC) and the package flags byte is 3 in every package of both installs. :proven

In Elden Ring the texture flags byte is `0x80` on 221,796 textures and 0 on the other 80,011. Every `0x80` texture is the single texture of
one of the 221,796 TPF members of the 10,233 `mAA_BB_CC_DD_envmap_NN_middle_NN.tpfbnd.dcx` map binders; it is a volume
(176,964) or a cube map (44,832) in BC7, BC6H or 16-bit-float format, and its DDS payload is an ordinary uncompressed DDS
file whose mip count matches the descriptor's. :proven{games="elden-ring"} No Sekiro texture has it.

### The file's parts

A package is its header, the descriptors with their optional metadata, the names, the payloads, in that order. The names
follow the last descriptor directly: NUL-terminated, in texture order, UTF-16 for name encoding 1 and a byte string for
2. The payloads follow the names directly and one another with no gap and no alignment, in texture order, and nothing
follows the last. The data-size field is the sum of the payload lengths. Sekiro's `/font/dbgfont14h.tpf.dcx` is the one
exception to the first of these: 272 zero bytes lie between its 17 names and its first payload. Rebuilding every package
from its parsed fields by this rule gives the stored bytes of all of them.
:proven[all 14,481 packages]{games="sekiro"} :proven[all 274,440 packages]{games="elden-ring"}

## Pixel formats and colour transfer

SoulsFormatsNEXT's package-format table includes the following mappings. These describe its header reconstruction
rules across formats, not a census of which codes Sekiro or Elden Ring actually ships. :sourced[SoulsFormatsNEXT]

| TPF codes | Reference DDS mapping | Confidence |
|---|---|---|
| 0, 1, 25, 29 | BC1 / DXT1 | :sourced[SoulsFormatsNEXT] |
| 3 | BC2 / DXT3 | :sourced[SoulsFormatsNEXT] |
| 5, 23, 33 | BC3 / DXT5 | :sourced[SoulsFormatsNEXT] |
| 24, 103 | BC4 / ATI1 | :sourced[SoulsFormatsNEXT] |
| 36, 104 | BC5 / ATI2 | :sourced[SoulsFormatsNEXT] |
| 100, 113, 115 | BC6H unsigned float | :sourced[SoulsFormatsNEXT] |
| 102, 106, 107 | BC7 linear | :sourced[SoulsFormatsNEXT] |
| 112 | BC7 sRGB | :sourced[SoulsFormatsNEXT] |
| 6 | B5G5R5A1 | :sourced[SoulsFormatsNEXT] |
| 8, 9, 105 | RGBA8, BGRA8, RGBA8 respectively | :sourced[SoulsFormatsNEXT] |

The reference source is internally inconsistent on some remaining codes: its comments call 22 a half-float
format while its DXGI table uses 16-bit UNORM, and comments call 108–110 sRGB while that table gives linear BC
formats. These mappings cannot establish a runtime colour view. :sourced[SoulsFormatsNEXT]

DDS block-compressed formats identify both block packing and, for DXGI formats, linear or sRGB transfer.
Sekiro area-texture pixel comparisons match an independent BC decoder exactly, and independent C# and Pillow
decoders within one channel level where those readers support the format. Two m25 sky textures are explicit
unsupported-format cases for the C# reader. :observed{games="sekiro"}

BC blocks cover 4×4 texels; a sub-4×4 mip still occupies a whole block. BC1 and BC4 use eight-byte blocks;
BC2, BC3, BC5, BC6H and BC7 use sixteen-byte blocks. :sourced[bcdec]

Normal maps and masks are read as linear data; albedo sampling can require an sRGB view. In Elden Ring's Academy
material sample, 96 GSBlendMap albedo bindings point at DX10 sRGB DDS formats and 57 GSBlendMap normal bindings
at linear formats. This payload correlation does not prove every runtime resource-view format.
:observed{games="elden-ring"}

Over the albedo bindings of Elden Ring's models (each material a model uses, each sampler named `AlbedoMap`, the
FLVER texture of that name or else the definition's own path; 229,596 bindings, 74,348 of them with no path anywhere
and 837 naming a texture no package holds), 154,411 find their texture in a package. Of those, 152,518 (98.8%) have a
DX10 sRGB format (147,247 BC1, 5,271 BC7), 1,768 (84 textures) a legacy `DXT1` header, 122 (37 textures) BC7 UNORM
and 3 `ATI1`. The same format byte (0 or 102) occurs with and without the sRGB tag, so the tag is the DDS header's
alone. :observed{games="elden-ring"} The shader METAPARAM category 1 (albedo) of the slot is the sampler named
`AlbedoMap` in all 140,357 bindings where both exist, and 99.1% of them carry the sRGB tag; categories 4 (normal),
10 (flow) and 14 to 17 (metallic and masks) carry it on 0 to 2.2% of their bindings and category 6 (emissive) on 90%.
:observed{games="elden-ring"} Whether the game views the untagged albedo textures as sRGB is not in the files.
:unknown{games="elden-ring"}

## Package format codes in the installs

Over every texture of both installs, a package format code always means one DDS pixel family; within a code the DDS
header varies only in the colour transfer (a DX10 header with the linear or the sRGB DXGI format) or in using a legacy
four-character code instead of a DX10 header. :proven[all 30,613 Sekiro and 301,807 Elden Ring textures]

| Code | DDS format declared | Sekiro | Elden Ring |
|---:|---|---:|---:|
| 0 | BC1: DXGI 72 (sRGB) or legacy `DXT1` | 7,202 | 16,096 |
| 1 | BC1: DXGI 72 or `DXT1` | 2,405 | 4,201 |
| 5 | BC3 sRGB (DXGI 78) | 1 | none |
| 6 | 16-bit RGB with alpha | 2 | none |
| 9 | 32-bit RGB with alpha (masks) | none | 3 |
| 10 | 32-bit RGB without alpha (DXGI 93, or masks) | 2 | 4 |
| 22 | legacy format 113, four 16-bit floats | none | 1,193 |
| 102 | BC7: DXGI 98 (linear) or 99 (sRGB) | 10,125 | 211,107 |
| 103 | BC4: legacy `ATI1` or DXGI 80 | 998 | 7,106 |
| 104 | BC5: legacy `ATI2` | 39 | 92 |
| 105 | 32-bit RGB with alpha: DXGI 29 (sRGB) or masks | 29 | 974 |
| 106 | BC7: DXGI 98 (6,398) or 99 (2) | 6,400 | 9,653 |
| 107 | BC7: DXGI 98 | 1,113 | 3,770 |
| 108 | BC1: legacy `DXT1` | 59 | 3,072 |
| 110 | BC3: legacy `DXT5` | 4 | none |
| 112 | BC7 sRGB (DXGI 99) | 2 | none |
| 115 | BC6H unsigned float (DXGI 95) | 2,232 | 44,536 |

The 32-bit codes differ in channel order where the DDS header gives channel masks: code 9 stores blue, green, red, alpha
(masks `0xff0000`, `0xff00`, `0xff`, `0xff000000`), code 105 stores red, green, blue, alpha (`0xff`, `0xff00`, `0xff0000`,
`0xff000000`), code 10 stores blue, green, red and an unused byte (`0xff0000`, `0xff00`, `0xff`), and code 6 stores
one alpha bit over five bits each of red, green and blue (`0x8000`, `0x7c00`, `0x3e0`, `0x1f`). :proven[every texture of both installs whose header states masks:
3 of code 9, 1 of code 10, 2 of code 6 and 1,002 of code 105]

Codes 3, 8, 23, 24, 25, 29, 33, 36, 100 and 113 of the reference table above never occur in a PC package of either
install. The codes that occur map to the families the reference table gives them, with two differences: code 22 is
half-float (legacy format 113), not 16-bit UNORM as the reference table has it, and the textures of codes 108 and 110
carry legacy four-character codes, which cannot state a transfer function, so the reference comments calling them sRGB
have nothing to stand on in the files. :proven[both installs]

Texture names in the packages are UTF-16 with one exception: Sekiro's `/font/dbgfont14h.tpf.dcx` stores 17 byte-string
names (encoding 2), all ASCII. No name in either install has a byte above `0x7F` except two Elden Ring names that begin
with the full-width Latin letter U+FF43, in a character texture package. :proven[both installs]

:::open[What do the package flags 3 and the texture flags 0x80 mean?]
The package flags byte is 3 in every package, and the texture flags byte is 0 or `0x80` (Elden Ring's environment
probes only). Nothing in the files or the readers says what either selects.
:::

## Sekiro

### Map textures

Map textures are stored one per TPF in the split binders `/map/mXX/mXX_000N.tpfbhd`/`.tpfbdt`, each with a
low-resolution `_l` twin; other textures are in `/other/*.tpf` and in objects' own TPFs. :observed{games="sekiro"} The `m11`
archives hold 3,522 textures, mostly 256 to 1,024 px, with sky and cloud textures up to 2,048 × 512.
:observed{games="sekiro"}

A material of `m10_00_00_00` names a texture `3dsmax`, the name of the authoring tool rather than of a texture, and no
archive of the install holds a texture of that name. A reader of that area has to treat it as absent.
:observed{games="sekiro"}

| Role | DDS format | Textures | Confidence |
|---|---|---:|---|
| Albedo `_a` | DXGI 72, BC1 sRGB | 749 | :observed{games="sekiro"} |
| Normal `_n` | DXGI 98, BC7 | 723 | :observed{games="sekiro"} |
| Metallic `_m` | BC4 | 59 | :observed{games="sekiro"} |
| Mask `_3m` | BC1 | 130 | :observed{games="sekiro"} |
| Foliage and sky albedo | DXGI 99, BC7 sRGB | 8 | :observed{games="sekiro"} |
| `m11_00_water_v` | BC5 | 2 | :observed{games="sekiro"} |

129 of Ashina Castle's 347 BC1 albedos use BC1's punch-through mode: in a three-colour block, index 3 is
transparent black, so a decoder that ignores the mode loses their alpha. :observed{games="sekiro"}

## Elden Ring

### Asset textures and their low twins

A map's own folder holds no surface textures: Stormveil's `m10_00_00_00` holds only environment-probe binders (high, middle
and low), `ivinfobnd` binders (the same three) and a colour-grading package. :observed{games="elden-ring"} The surfaces of
assets are in `/asset/aet/aetNNN/aetNNN_MMM.tpf.dcx`, and each package has a twin `aetNNN_MMM_l.tpf.dcx` (8,388 and 8,387 in the
community file list). :sourced[Smithbox]{games="elden-ring"} Over every 40th pair of that list (147 pairs read, 313 textures),
every texture of a package has a texture `<name>_l` in its twin. The two are made separately, not one mip chain cut short: only
32 of the 313 low payloads are the tail of the full one's chain, and 71 have another DDS format (a DXT1 normal map with a BC7
twin, for example). :observed[147 pairs]{games="elden-ring"}

| Low width / full width | Textures | Confidence |
|---|---:|---|
| 1/2 | 28 | :observed{games="elden-ring"} |
| 1/4 | 121 | :observed{games="elden-ring"} |
| 1/8 | 123 | :observed{games="elden-ring"} |
| 1/16 | 8 | :observed{games="elden-ring"} |
| equal | 25 | :observed{games="elden-ring"} |
| low larger | 8 | :observed{games="elden-ring"} |

### Which form is drawn

The game keeps both forms resident and chooses one for each drawn instance by its distance. Each drawn model instance
(`CS::CSModelDispEntity`) owns a level object holding its world box (the union of its parts' boxes through their world
matrices) and its `PartsDrawParam` row, and its level starts at 1, the `_l` form. Each frame the step computes
`d = distance(camera, box) × tan(fovY / 2) / tan(21.5°)`, 0 inside the box (the reference field of view is 43°), and changes
the level: :observed[read from the executable's code]{games="elden-ring"}

- from 0 (full) to 1 (`_l`) when `d >= kA × (B + P) × s`;
- from 1 to 0 when `d < kB × (B − P) × s`;
- otherwise not, so `P` is a hysteresis band.

`B` and `P` are the row's `tex_lv01_BorderDist` and `tex_lv01_PlayDist` (offsets 40 and 44); a `B` of 0 means the instance never
switches. An asset `AEGggg_mmm` takes its row from `AssetEnvironmentGeometryParam` row `ggg × 1000 + mmm` (`refDrawParamId`,
offset 8); a map piece takes its layout part's draw-parameter row when the part uses one ([part fields](/engines/fromsoft/world/visibility/#other-entity-data-bytes)),
which fits all 20 map-piece draws checked. `s` is the scale of row `100 + lodType` (the row's byte at offset 80) of
`LoadBalancerDrawDistScaleParam`, 1.0 for rows 100 to 110 in this regulation. `kA` is the memory load balancer's factor (1, or
0.5, 0.25, 0.1 and 0 under memory pressure) and `kB` is `kA` times a ramp from 0 to 1 over the 3 s after the switching system
turns on; while it is off, every instance stays at 1. The texture quality setting is not read on this path. When the level
changes, an asset sets bit 1 of its `CSWorldGeomIns` word at `+0x264` (wants full) and a map piece the word at `+0x248`, and a
refresh is queued; it applies once a readiness flag of the instance is set. :observed[read from the executable's code]{games="elden-ring"}
The switching system is on when two setting bytes are both set. One of them is turned off by the map-move step
`MoveMapStep::STEP_BeginInit`, when a map load begins, and on again by `STEP_HorseWait`; the character-creation menu turns it off
and back on around its own screen. The other is set once at start-up. :observed[read from the executable's code, its type
information and string references]{games="elden-ring"} So every instance holds its `_l` textures through a map load, and the 3 s
ramp starts when the load is done. :inferred{games="elden-ring"}

In the running game (texture quality at maximum, two camera positions at the Stormveil gate, the textures of each draw found
by hashing the first 64 KiB of their top level against every `aet` texture of both forms): :observed[two recordings]{games="elden-ring"}

- A draw binds one form of its own group's textures (111 full, 12 low slots), and one form per instance batch. A texture is
  drawn in both forms within one frame by different draws (109 of 123 such textures), the same mesh section full in one
  draw and `_l` in another (72), so the form is not tied to a mesh LOD.
- Every full draw's median pixel lies at most 14.9 m from the camera and every `_l` draw's at least 21.3 m, but for one
  3-pixel full sliver at 24.0 m (42 read-backs of 24 draws). With the rule above and `kA = kB = 1` the measured draws fit:
  all 38 counted.
- A slot an asset binds to another group's textures (an `aetNNN` whose number is not the asset's) is the `_l` form in all 20
  unambiguous slots of five asset draws, even in draws whose own textures are full; map pieces' slots all follow the level
  (164 of 164). What makes the foreign slots low is not established.
- Right after a load almost everything is `_l` (30,663 low slots against 270 full in the first frame recorded); about 3.5 s
  later each frame holds about 3,500 full and 4,500 low slots, and stays so.

The projection in these draws is reverse Z: clip `z = −5e−6 × z + 0.050067`, `w = z` (near plane 0.05 m), so a depth `D` is
at `0.050067 / (D + 5e−6)` m. :observed{games="elden-ring"}

:::open[Why are another group's textures always low?]
An asset that binds textures of another `aet` group draws them in the `_l` form whatever its own level. The code path that
does this is not traced.
:::
