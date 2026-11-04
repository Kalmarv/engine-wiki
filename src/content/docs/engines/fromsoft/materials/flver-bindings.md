---
title: FLVER material bindings
description: Material records, texture overrides, GX extensions and texture addressing.
sources:
  - title: SoulsFormatsNEXT
    url: https://github.com/soulsmods/SoulsFormatsNEXT/tree/master/SoulsFormats/Formats/FLVER/FLVER2
    note: Material, Texture and GXList readers
  - title: Smithbox GX item descriptors
    url: https://github.com/vawser/Smithbox
    note: Names and types for the words of the GX items
  - title: RunDevelopment GX investigation
    url: https://github.com/JKAnderson/SoulsFormats/issues/14
    note: GXMD framing and optional flag records
implementations:
  - name: primase worlds/fromsoft (materials.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/materials.rs
---

A FLVER material binds a mesh to an external definition and supplies texture-path overrides. Sekiro uses
[MTD](/engines/fromsoft/materials/mtd/); Elden Ring uses [MATBIN](/engines/fromsoft/materials/matbin/), even though
the FLVER reference may retain a `.matxml` source name. :observed

```layout
title: FLVER2 material
size: 32
fields:
  - {at: 0, size: 4, type: u32, name: material name offset, level: proven}
  - {at: 4, size: 4, type: u32, name: definition path offset, level: proven}
  - {at: 8, size: 4, type: u32, name: texture count, level: proven}
  - {at: 12, size: 4, type: u32, name: first texture index, level: proven}
  - {at: 16, size: 4, type: u32, name: string byte count, level: proven, note: "2 x (the characters of the material name, definition path and each binding's kind and path, each plus a terminator); SoulsFormatsNEXT names it the combined string size"}
  - {at: 20, size: 4, type: u32, name: GX list offset, level: proven}
  - {at: 24, size: 4, type: u32, name: material index, level: sourced, note: "equals the material's position in 92.4% of Sekiro's and 81.3% of Elden Ring's materials, never more than it"}
  - {at: 28, size: 4, type: u32, name: reserved, value: 0, level: proven}
```

```layout
title: FLVER2 texture binding
size: 32
fields:
  - {at: 0, size: 4, type: u32, name: path offset, level: proven}
  - {at: 4, size: 4, type: u32, name: texture kind name offset, level: proven}
  - {at: 8, size: 8, type: float2, name: scale, level: proven}
  - {at: 16, size: 1, type: u8, name: U tiling type, level: sourced, note: "0 or 1, and equal to the byte at 17 on every binding of both installs"}
  - {at: 17, size: 1, type: u8, name: V tiling type, level: sourced, note: "0 or 1, equal to the byte at 16"}
  - {at: 18, size: 2, type: bytes, name: reserved, value: 0, level: proven}
  - {at: 20, size: 12, type: float3, name: unknown values, level: unknown}
```

| Tiling code | Reference-reader name | Confidence |
|---|---|---|
| 0 | None | :sourced[SoulsFormatsNEXT] |
| 1 | Repeat | :sourced[SoulsFormatsNEXT] |
| 2 | MirrorRepeat | :sourced[SoulsFormatsNEXT] |
| 3 | Clamp | :sourced[SoulsFormatsNEXT] |
| 4 | Border | :sourced[SoulsFormatsNEXT] |
| 5 | MirrorOnce | :sourced[SoulsFormatsNEXT] |

Over every material of both installs the string byte count at offset 16 is exactly the value given in the layout: in all
43,435 Sekiro materials (versions `0x20013` to `0x2001A`) and all 86,644 Elden Ring materials of versions `0x20013` and
`0x2001A`. In Elden Ring's version `0x20014` SpeedTree files it is two bytes larger per bound texture in 684 of their
685 materials. :proven[every material of both archive sets] The material index at offset 24 equals the material's position
in 40,115 of Sekiro's 43,435 materials and 71,032 of Elden Ring's 87,329; where it differs it is smaller (0 in 737 and
6,129 of them). :proven[every material of both archive sets] The reserved word at 28 is zero in all of them.
:proven[every material of both archive sets]

Of the 241,231 Sekiro and 570,781 Elden Ring texture bindings, the two tiling bytes are `0` and `0` on 173,927 and 558,506
bindings with an empty path, `1` and `1` on 67,254 and 10,336 with a path, and `0` and `0` on the 50 and 1,939 with a path
that are left: no binding has different bytes, and no binding has a code above 1, so the codes 2 to 5 of the table are
not used by any shipped binding. :proven[every binding of both archive sets] The bytes behave as one flag that is set
for most bound textures, not as two independent addressing modes. :inferred

A nonempty FLVER texture path overrides the definition's fixed path for the matching kind. Elden Ring's
metaparam can supply a system texture for an otherwise unbound numbered slot; captured uploaded mip hashes on
Stormveil DetailBlend draws match those defaults. :observed

:only[sekiro] Sekiro's definitions leave slots empty too, and `/other/systex.tpf.dcx` holds the system textures
that would fill them: `SYSTEX_Dummy_` with the suffixes `a`, `m`, `r`, `n`, `em`, `g`, `d`, `v`, `1m` and `3m`, plus
`SYSTEX_WHITE` and `SYSTEX_BLACK`. :observed{games="sekiro"}

| Texture | Format | Contents | Confidence |
|---|---|---|---|
| `SYSTEX_Dummy_a` | BC1, sRGB | every texel sRGB 128 (about 0.216 linear) | :observed{games="sekiro"} |
| `SYSTEX_Dummy_m` | BC4 (ATI1) | zero | :observed{games="sekiro"} |
| `SYSTEX_Dummy_r` | sRGB | grey, sRGB 49 | :observed{games="sekiro"} |
| `SYSTEX_Dummy_n` | BC7 | a normal map | :observed{games="sekiro"} |

A Sekiro pixel program names each material texture it samples `<family>_snp_<k>_Texture2D_<N>` in its reflection, at
the register it reads it from, and the material definition names the same texture `<family>_snp_Texture2D_<N>_<role>`
(`M_Multiple__snp_0_Texture2D_8` and `M_Multiple__snp_Texture2D_8_AlbedoMap_0`). Every texture with a path that the
drawn materials of five frames at the Ashina Castle gate give their programs (the FLVER binding of that kind when its
path is not empty, else the definition's) is bound at the register so named: 16,211 of 16,211.
:observed[five captured frames, draws tied to their FLVER mesh and material by the mesh buffer]{games="sekiro"}

What an empty slot gets depends on the material family. The character families bind a system texture of the slot's
role; the layered map families bind one of two textures of one texel that the engine makes at start-up, not a file.
:observed[829 empty slots of five captured frames]{games="sekiro"}

| Family and role of the empty texture | Bound texture | Confidence |
|---|---|---|
| Character families (`Character_AMSN` and its `[DetailBlend]`, `SSS`, `[Cat_Eye]` and `AN_Blend_AMSN_[Fresnel]` variants, `Fur_NTC`): 510 slots; albedo | 16×16 BC1 sRGB whose bytes are `SYSTEX_Dummy_a`'s (the same bytes as `SYSTEX_Dummy`, `_em` and `_g`) | :observed{games="sekiro"} |
| Character families, normal | `SYSTEX_Dummy_n` | :observed{games="sekiro"} |
| Character families, metallic | 16×16 BC4 whose bytes are `SYSTEX_Dummy_m`'s (the same as `_1m`) | :observed{games="sekiro"} |
| `Character_AMSN_SSS`, reflectance | 16×16 BC1 of zeros, the bytes of `SYSTEX_BLACK ` and `SYSTEX_Dummy_3m` (and of several maps' black textures) | :observed{games="sekiro"} |
| Layered map families (`M[Multiple]`, `M[MultipleGround]`, `WallTest_dobei`): 313 slots of albedo, normal and mask | a 1×1 `B8G8R8A8_UNORM` texture of white (255, 255, 255, 255) | :observed{games="sekiro"} |
| `MetallicTex`, metallic (6 slots) | a 1×1 `B8G8R8A8_UNORM` texture of opaque black (0, 0, 0, 255) | :observed{games="sekiro"} |

The engine makes three such textures in its first frame: white, opaque black and transparent black (0, 0, 0, 0); the
last is bound to every draw at register 58 of the vertex and pixel programs. :observed[resources created in frame 1 of the
captured runs]{games="sekiro"} Where two system textures hold the same bytes, the bytes alone do not say which file the
engine loaded; the dummies sit among the other `systex` textures in creation order. :inferred{games="sekiro"} The 4.55
detail gain of the [character detail programs](/engines/fromsoft/materials/detail-blend/) is the reciprocal of the
albedo dummy's 0.216, which these draws bind. :inferred{games="sekiro"}

Elden Ring's frames show both kinds too. Over the ten Stormveil frames the textures of 16 by 16 texels or fewer that drawn
programs read at their `Texture2D_N` registers fall into two groups. :observed[ten captured frames, 3,000 to 3,600 bindings of
`Texture2D_N` registers a frame]{games="elden-ring"} The first holds the same bytes as Sekiro's file dummies: a BC1 texture of
`SYSTEX_Dummy_a`'s bytes in 16×16 (five mips) or 4×4 (three mips) form, a zero BC4 texture of `SYSTEX_Dummy_m`'s bytes,
a BC7 normal map of `SYSTEX_Dummy_n`'s bytes in 8×8 or 4×4 form, and the `_3m` and `_BlackAlpha_a` textures. The bound bytes are the
same in the Sekiro frame and the Elden Ring frames, and each one is bound only at slots whose metaparam default texture
has that file's name (`Dummy_a` at the albedo slots, `Dummy_n` at the normal slots, and so on).
:observed[Elden Ring frames m10 to m17 and the Sekiro idol frame, content keys compared]{games="elden-ring sekiro"} The
4×4 forms are the same file resident with its first two mips dropped. :inferred{games="elden-ring"} The second group is a
1×1 `R8G8B8A8_UNORM` texture of white (255, 255, 255, 255); the frame also holds 1×1 textures of opaque black, of flat normal
(128, 128, 255, 255) and of transparent black, the same four engine textures as Sekiro's three plus the normal.
:observed[ten captured frames]{games="elden-ring"} The white one is bound at the `Mask1Map` slot of `M[AMSN_V]_Grass2` (61 of
101 bindings) and `P[ChrCustomize][FaceHair]` (30 of 30), while the same `Mask1Map` slots of other families (`M[AMSN]`,
`M[AMSN_V][Mb3][Ov_N2_T]`) take the file dummy `Dummy_1m`, so the default's name does not decide which kind a slot gets.
:observed[ten captured frames]{games="elden-ring"} Elden Ring's layered map families (`M[AMSN_V][Mb2]`, `[Mb3]`, `[Mb4]`
and `[Ov_*]`) bind the file dummies (`Dummy_n`, `c80_SYSTEX_RED` and others) where Sekiro's `M[Multiple]` binds white.
:observed[ten captured frames]{games="elden-ring"} Sekiro's idol frame draws 24 material families; the 14 that bind a texture of
16 texels or fewer are those of the tables above, and the other 10 (landscape, sky, emissive, translucency and mesh-decal
families) bind only textures of 64 texels or more, so they show no empty slot. :observed[one captured frame]{games="sekiro"}

:::open[Which families take a file dummy and which an engine texture?]
Whether a small texture is an empty slot filled in or a small texture the material names cannot be told from a frame
alone: the FLVER binding of each draw's mesh is not joined to the Elden Ring draws, so the 1×1 white at `Mask1Map` of
grass and face hair may be the engine's fill or a texture the material binds. The rule that picks between the kinds is
not read from the code.
:::

The `N` in `Texture2D_N` identifies a logical texture across material and program names. It is distinct from the
metaparam slot/register: Sekiro's DetailBlend base albedo `Texture2D_7` is at register 1, while detail albedo
`Texture2D_2` is at register 7. :observed{games="sekiro"}

:only[elden-ring] Elden Ring's captured tiling rows are likewise indexed by the metaparam slot, not by `N`.
:observed{games="elden-ring"} Its programs are named the same way, and the register a program reads `Texture2D_N` from is
the `slot register` byte of the [metaparam](/engines/fromsoft/materials/metaparam/#textures-and-render-passes) texture whose
name holds that `N`, not `N` itself. In the ten recorded Stormveil frames every texture register of every drawn program that
names a `Texture2D_N` (117 to 122 programs and 426 to 449 textures a frame) equals the metaparam slot of that `N` in the
program's own bundle, with no exception, while `N` equals the register for only 122 of the 442 textures of one frame
(`Texture2D_7` is at `t10`, `Texture2D_11` at `t2`). :observed[ten captured frames at the Stormveil gate, each drawn program's
reflection against its bundle's metaparam]{games="elden-ring"} Reading `N` as the register, as an earlier reading of the
G-buffer programs did, is wrong for Elden Ring. :observed{games="elden-ring"} Sekiro's frame at the Ashina idol is alike: `N`
equals the register for 42 of the 273 textures of its 60 programs. :observed[one captured frame]{games="sekiro"}

The FLVER record layouts below are checked in the whole-install model population: 14,459 Sekiro files
and 22,050 reference-readable Elden Ring files. The reference refuses another 119 Elden Ring SpeedTree files;
those have a separate stream check. One Sekiro archive entry fails before model inspection and is excluded.
:proven[whole-install reference population]

## GX extension lists

GX lists preserve material extension payloads beside the ordinary texture bindings. :sourced[SoulsFormatsNEXT]

```layout
title: GX item header
size: 12
fields:
  - {at: 0, size: 4, type: bytes, name: identifier, level: proven}
  - {at: 4, size: 4, type: u32, name: version, level: sourced}
  - {at: 8, size: 4, type: u32, name: total item length, level: proven, note: Includes this header for ordinary items.}
```

The terminator identifier is `0x7FFFFFFF` or `0xFFFFFFFF`, with version word 100 and zero payload padding.
Ordinarily its length includes the 12-byte header; where the FLVER header's low word at `0x68` is 5, it counts
padding alone, as on Elden Ring SpeedTree files. :observed

### GX items in the installs

71,699 Sekiro and 114,256 Elden Ring GX items occur, under 22 and 18 `GXnn` identifiers plus `GXMD` (33 and 44 versions)
and, in Elden Ring, `GXUD` (119 items of 1,480 to 3,088 bytes). :proven[every material of both archive sets] An
identifier and version pair has one payload length, except `GXMD` 314 in Sekiro and `GX14` 101 (16 and 28 bytes),
`GXMD` 131, 133, 141 and 426 and `GXUD` 101 in Elden Ring. :proven[every material of both archive sets]

The community editor names the words of its `GXnn` descriptors. Every `GXnn` identifier and version of the installs has one
except `GX18` version 101 (565 Elden Ring items of 4 bytes). :observed The names fit the values for the three checked by range: the first word of `GX03` 100
(emissive intensity) is 0.7 to 3.32 over four distinct values in Sekiro and 0.6 or 1.0 in Elden Ring; the first word of
`GX05` 100 (translucency scale) is 1.0 or 10.0 in Sekiro and always 1.0 in Elden Ring; the first three words of `GX14` 101
(albedo colour) are within 0 to 1 and the fourth (its multiplier) within 0.8 to 1.0 in Sekiro and 0.79 to 1.36 in Elden
Ring. The remaining words of `GX03` and `GX05` are zero in every item. :observed

### Named GX items

The community's descriptors give every word of an item a name and a type (an integer, a float, or one the editor leaves unnamed).
:sourced[Smithbox] The items below occur in the installs; all other words are 0 in every item unless the row says otherwise. Sekiro
has 71,699 items and Elden Ring 114,256 over their materials. :proven[every material of both archive sets]

| Item | Words the editor names | Sekiro | Elden Ring | Confidence |
|---|---|---|---|---|
| `GX03` 100 | `[Emissive] EmissiveIntensity` (float) | 252 items, 0.7 to 3.32 in 4 values | 9 items, 0.6 or 1 | :observed |
| `GX05` 100 | `[Translucency] TranslucencyScale` (float) | 2,062 items, 1 or 10 | 5,140 items, 1 | :observed |
| `GX14` 101 | `[AlbedoColor]` red, green, blue, multiplier (floats) | 206 items, colour 0 to 1, multiplier 0.8 to 1 | 735 items, colour 1, multiplier 0.79 to 1.36; 684 store 16 bytes (the four named words), 51 the full 28 | :observed |
| `GX09` 100 | `Parallax1` and `Parallax2` offset and middle height | 3 items, offset 0, middle height 0.5 | 1 item, the same | :observed |
| `GX07` 104 | The water settings: three normal and two diffuse scroll speeds, Fresnel minimum and maximum, reflection and refraction offsets, depth fog colour, density and transparency, two fade ranges | 2 items (the `M[ARSN]_Water_3normaltet` river and waterfall of one map): normal V speeds -0.02 to -0.12, refraction offset 0.04, fog colour (0, 0.118, 0.118, 0.8), density 1, transparency 0.01, fade ranges 0.1 | none | :observed{games="sekiro"} |
| `GX04` 100 | Displacement mapping and tessellation mode (integers 0 or 1), tessellation factors, `Back Face Cull`, distances, bias, height (floats) | 6,480 items | 155 items | :observed |
| `GX20` to `GX34` | Per texture type, a U and a V scroll speed (floats) | `GX20` 1,116 items, `GX22`, `GX24`, `GX26` 912, `GX32` 252, `GX30` 23, the rest 3 | `GX20` 233, `GX22`, `GX24`, `GX26` 183, `GX30` 2, `GX32` 9 | :observed |
| `GX00` 100 to 102 | `Decal` and `[PaintDecal] SlotNo` (100); version 102 names none, its first four words are integers (0 to 3, 0 or 1, 0 to 2, -1 to 3) | 43,237 items | 86,390 items | :observed |
| `GX06` 101, `GX15` 100, `GX39` 100, `GX80` 100, `GX81` 100 | `SnowMaskIntensity`; unnamed floats; `Soft Volume`; damage rate and tiling | 2, 382, 7, 6 and 6 items | `GX15` 857 items | :observed |

Names that the values do not fit: `GX04`'s `Back Face Cull` is a float taking 0, 0.5 and 5 in Sekiro and 0.5 in Elden Ring, and its
distance and factor words take 1 and 5. :observed The parallax-occlusion items (`GX02`, `GX12`) and the others the editor names but
neither install stores (`GX01`, `GX08`, `GX13`, `GX35` to `GX37`) do not occur. :proven[every material of both archive sets]

### GXMD payloads

GXMD contains a 32-bit item count followed by typed ID/value entries, without a trailing sentinel. IDs can appear
in any order. Sekiro and Elden Ring can add a type-0 boolean record sharing the preceding value's ID; its meaning
is unresolved. :sourced[RunDevelopment]

```layout
title: GXMD item prefix
size: 8
fields:
  - {at: 0, size: 4, type: i32, name: item ID, level: sourced}
  - {at: 4, size: 4, type: i32, name: value type, level: sourced}
```

| Type | Following value | Confidence |
|---|---|---|
| 0 | One boolean word, 0 or 1; optional flag for an existing ID | :sourced[RunDevelopment] |
| 1 | One float | :sourced[RunDevelopment] |
| 2 | Two floats | :sourced[RunDevelopment] |
| 3 | Three floats | :sourced[RunDevelopment] |
| 11 | Five floats | :sourced[RunDevelopment] |

For the inspected Sekiro `MetallicValue` and `MetallicValue_MeshDecal` shader families, GXMD version 123 item
237 corresponds to the scalar named `snp_0_float_0_0`; their G-buffer programs read `cb2[20].x` for the metallic
mixture. This association is not established for other shader families or flagged values. :observed{games="sekiro"}

:::open[What do all GX payloads and trailing texture floats mean?]
The structural records do not establish the semantics of every extension or the three floats at texture offset 20.
They remain raw values rather than universal shader parameters. :unknown
:::
