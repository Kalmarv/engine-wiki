---
title: MATBIN material definitions
description: Elden Ring's material binary header, typed values, sampler records and unreferenced tails.
games: [elden-ring]
sources:
  - title: SoulsFormatsNEXT
    url: https://github.com/soulsmods/SoulsFormatsNEXT/blob/master/SoulsFormats/Formats/MATBIN.cs
    note: Independent material binary reader
  - title: soulstruct
    url: https://github.com/Grimrukh/soulstruct
    note: Elden Ring shader stem grammar, map names and per-shader texture coordinate tables
implementations:
  - name: fromsoft-formats (matbin.rs)
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/matbin.rs
  - name: fromsoft-formats (shader.rs)
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/shader.rs
---

MATBIN stores the shader source path, material source path, parameters and samplers behind a FLVER material's
`.matxml` reference. Its magic is `MAB\0` and its version is 2. :proven

Every material-binder entry is compared with SoulsFormatsNEXT: shader and source paths, keys, parameter names,
types and float bit patterns, and sampler names, paths, keys and trailing floats. Extra stored float3 components
and truncated values are accounted for separately. :proven[all material binders]

## Records

Offsets below are file-relative 64-bit offsets; strings are NUL-terminated UTF-16. Parameter records immediately
follow the header, then sampler records, then referenced strings and values. :proven

```layout
title: MATBIN header
size: 56
fields:
  - {at: 0, size: 4, type: char, name: magic, value: 'MAB\0', level: proven}
  - {at: 4, size: 4, type: u32, name: version, value: 2, level: proven}
  - {at: 8, size: 8, type: u64, name: shader path offset, level: proven}
  - {at: 16, size: 8, type: u64, name: source path offset, level: proven}
  - {at: 24, size: 4, type: u32, name: key, level: unknown}
  - {at: 28, size: 4, type: u32, name: parameter count, level: proven}
  - {at: 32, size: 4, type: u32, name: sampler count, level: proven}
  - {at: 36, size: 20, type: bytes, name: reserved, value: 0, level: proven}
```

```layout
title: MATBIN parameter
size: 40
fields:
  - {at: 0, size: 8, type: u64, name: name offset, level: proven}
  - {at: 8, size: 8, type: u64, name: value offset, level: proven}
  - {at: 16, size: 4, type: u32, name: key, level: unknown}
  - {at: 20, size: 4, type: u32, name: type code, level: proven}
  - {at: 24, size: 16, type: bytes, name: reserved, value: 0, level: proven}
```

```layout
title: MATBIN sampler
size: 48
fields:
  - {at: 0, size: 8, type: u64, name: kind name offset, level: proven}
  - {at: 8, size: 8, type: u64, name: texture path offset, level: proven}
  - {at: 16, size: 4, type: u32, name: key, level: unknown}
  - {at: 20, size: 8, type: float2, name: stored scale, level: observed, note: Nonzero values participate in captured texture tiling.}
  - {at: 28, size: 20, type: bytes, name: reserved, value: 0, level: proven}
```

| Type | Value | Nominal bytes | Confidence |
|---|---|---:|---|
| 0 | Boolean | 1 | :proven |
| 4 | Signed integer | 4 | :proven |
| 5 | Two signed integers | 8 | :proven |
| 8 | Float | 4 | :proven |
| 9 | Float2 | 8 | :proven |
| 10 | Float3; some stored extents contain two further floats | 12 or 20 | :proven |
| 11 | Float4 | 16 | :proven |
| 12 | Float5; colours include intensity as the fifth component | 20 | :proven |

Of the 23,352 float3 values in the install's 20,619 MATBIN files, 20,599 are stored with two further floats and 2,753
end after three. The two further floats are `1.0` and `1.0` in every one of the 20,599. :proven[every MATBIN of the install, without the `DLC` archive pair]

A stored value's actual extent can end before its nominal type size, because the next referenced item begins
sooner. Some files also contain unreferenced tail bytes, including strings from an earlier material revision.
The type code alone therefore does not describe every byte after a value offset. :proven

## String and value order

After the sampler records every string and value is packed with no padding and no alignment between them, in this order:
for each parameter its name and then its value, for each sampler its kind name and then its path, the shader path, the
material's source path, and the unreferenced tail. A string may start at an odd offset. :proven[all 20,619 MATBIN files]
The tail holds every byte after the source path: it is empty in 17,623 files and holds 2,235,891 bytes in the other 2,996.
The source path is the last referenced item of all 20,619. :proven[all 20,619 MATBIN files] Writing the records and the
items in this order, with each value at its stored extent and the tail as it is, reproduces every file byte for byte.
:proven[an independent writer over all 20,619 MATBIN files]

The separate [METAPARAM](/engines/fromsoft/materials/metaparam/) supplies binding offsets, colour flags and texture
UV groups; MATBIN's stored values alone do not specify the uploaded shader words. :observed

## Shader names

A material names its shader by a stem, the file name of its shader path without the extension: `C[DetailBlend][S2]_cloth`,
`M[AMSN_V][Mb2][Ov_AN]_Edge`, `P[ChrCustomize][Hair]`. Most stems follow one grammar: ASCII letters for the category
(`C` a character, `CS` a cut-scene character, `P` a player part, `M` a map piece, `S` a sky or scenery piece, `PC`), the
shader family in the first brackets, any number of further bracketed tags, and suffixes after underscores. :proven[all 20,619
material binaries of the install] Of the 975 distinct stems, 692 follow it (19,867 materials) and 283 do not (752 materials):
the `GXFlver_*` family of Sekiro's layout, `SpeedTree_*`, `MultiBlend<n>_*`, test shaders (`Test_*`, `Fujir_*`) and a few
others. :proven[all 20,619 material binaries of the install] A stem rebuilt from its parts is the stem, for all 692.
:proven[all 20,619 material binaries of the install]

| Part | What the install holds | Confidence |
|---|---|---|
| Category | `M` 11,016 materials, `C` 8,082, `S` 378, `P` 280, `CS` 109, `PC` 2 | :proven[all material binaries] |
| Family | The last tag, else the first brackets, that is one of `AMSN` (10,796 materials), `DetailBlend` (5,592), `Fur` (911), `Crystal` (269), `Hair` (159), `Shell` (84), `Eye` (18), `Face` (8); the first brackets as written for the rest (232 distinct families in all) | :proven[all material binaries] |
| `[MbN]` tag | The number of blended layers: 1 for 16,679 materials, 2 for 1,644, 3 for 908, 4 for 617, 5 for 19 | :sourced[soulstruct] for the meaning, :proven[all material binaries] for the counts |
| `[Ov_*]` tag | An overlay layer and the maps it holds: `N` 4,289 materials, `AN` 873, then eight other spellings (5,314 in all) | :sourced[soulstruct] for the meaning, :proven[all material binaries] for the counts |
| Suffixes | `cloth` 1,293, `Edge` 914, `Glow` or `Emissive` 590, `SSS` 207, `Alpha` 144; a `Snow` tag on 211 | :proven[all material binaries] |

## Sampler names

A sampler's kind name is `<shader>_snp_Texture2D_<n>_<map>` with an optional `GSBlendMap_` or `RGB_` before the map name and an
optional `_<k>` index after it (`C_DetailBlend__snp_Texture2D_7_AlbedoMap`, `M_AMSN_Mb2__snp_Texture2D_1_GSBlendMap_AlbedoMap_0`).
:proven[152,138 samplers of the install, except 2,269 legacy names] The map names fold into sixteen kinds: `AlbedoMap` (59,034
samplers), `NormalMap` and `Normal` (62,747), `MetallicMap` (15,810), `Mask1Map` (5,863), `Mask3Map` (2,507), `EmissiveMap` (930),
`DisplacementMap` (625), `VectorMap` (588), `BlendEdgeTexture` and `BlendEdge` (422), `DistortionDepth` (312), `ReflectanceMap` (253),
`ShininessMap` (156), `Shadowmap` (21), `3Mask` (19), `BlendMaskTexture` (16) and `UniqueOpacityMask` (4). :proven[all
samplers of the install] Another 562 samplers carry 47 other map names (`FlowMap` 113, `Generic_*` sky maps, `Fire___*` effect maps,
`Extra__Base`), and 2,269 samplers of 28 names (`g_DiffuseTexture`, `g_BumpmapTexture2`, ...) have no `_snp_Texture2D_` part: they
belong to the `GXFlver_*` shaders. :proven[all samplers of the install]

## Texture coordinate sets per shader

A community table of 176 shader stems names the texture coordinate sets each reads (`UVTexture0`, `UVTexture1`, `UVDetail`,
`UVFurAlpha`, `UVSubNormals`, `UVBlend`) and, for 168 of them, the set each sampler group reads; it marks the entries by how sure
its author is. :sourced[soulstruct] Held to the models that use the shaders, its tuple lengths fit: of the 451 stems on the 75,826
meshes of the map, character, part, asset and object models that have a material binary (SpeedTree models excluded), 180 are in the
table, and for every one of them the length of its tuple is the number of texture coordinate attributes of some mesh using it; 55,811 of
the 56,770 meshes of those stems have exactly that many. :observed[the models of the map, character, part, asset and object binders]

### What the pixel programs read

A surface shader's pixel program computes each sampled coordinate from vertex-program outputs through constants of the material
(`FC_TextureTilingScale`-style scale and offset), and the vertex program passes the coordinate on from a `TEXCOORD` input. A
`TEXCOORD` input declared `int xy` is one coordinate set (two int16 lanes, divided by 2048), one declared `int xyzw` is a pair of
sets (a `UVPair` vertex member), and a float one is a single attribute that is not always a coordinate (the `UVBlend` layer weights of
`M[AMSN][Mb2]`); numbering the declared `TEXCOORD` inputs by index and counting a pair as two gives the shader's coordinate slots.
:observed[the Gbuf pixel and vertex programs of the 688 stems of the install's shader bundles that have a pair, walked as DXIL]
Of the 3,698 `Texture2D_<n>` textures they sample, 63 take no `TEXCOORD` into the coordinate, 204 also depend on the vertex position,
normal, tangent or colour, and 392 depend on another texture's sampled value. :observed[the same programs]

Against the community table, 172 of the 177 stems in it declare exactly as many coordinate slots as the table's tuple has entries;
the five others are the vertex-animation shaders `C[AMSN][VA_Loop]` (4 declared, 6 in the table), `C[c3320]_VA_Frame` (3, 5) and
`CS[c8901][VA_Frame]_Burn` with its `_cloth` variant (6, 8), and `M[AMSN_V][Mb3][3Mask][Ov_N]` (1, 2). :observed[the 177 stems of the
table that have programs] Of the 980 textures whose group the table names (the group of each texture is in the shader's metaparam) and
whose coordinate reads a slot, 811 read exactly the slot or slots whose name the table gives for the group and 169 read another; the
169 are in 24 stems, all character, hair, eye, grass and test shaders (the map shaders agree: 144 of 146; the character shaders
`C[...]`, `CS[...]` and `P[...]`: 579 of 740; `C[c4520]_Dragon`, `C[c4720]_Beast`, `C[c4480]_Flower_1` and `CS[c8901]_Burn`
each read slot 0 for some of their groups that the table puts on `UVDetail`). :observed[the 980 textures] The table's authors' own marks (HIGH, MEDIUM, LOW)
are not checked against this beyond the count. :unknown

:::open[What do the MATBIN keys identify?]
The keys are preserved and compared bit for bit, but their complete generation rule and runtime use are not
established here. :unknown
:::
