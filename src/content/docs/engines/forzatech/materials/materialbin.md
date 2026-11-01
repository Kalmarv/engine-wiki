---
title: Materials (.materialbin and MatI)
description: How Forza Horizon 6 stores material parameters, how a parameter value is resolved up the parent chain, how texture paths are hashed, and the parameter hashes used most.
sources:
  - title: ForzaTech-extraction-tools
    url: https://github.com/Doliman100/ForzaTech-extraction-tools
    note: the FH5 parameter types and the CRC32 parameter hashes the FH6 values match
---

A material is a small list of **shader parameters** with a parent. The material in a model (`MatI` blob, an instance) names a
parent material by path; the parent is a `.materialbin` in the track's `bin.zip`; the chain ends at a `.shaderbin` that names
the **shader family** (`environment`, `window_linecastroom`, `uber_road`, `environment_signage`, ...). What a pixel looks like
is decided by the family's compiled shader ([Shader containers](/engines/forzatech/shaders/shaderbin/)). :observed

Counts about the Tokyo track `Brio` below are from a recorded census, no longer re-checkable. :observed Counts about the
install (build 25588841) come from reading every material file of it with the rules below, each refusing any byte it does not
account for: 9,707 `.materialbin` files, 987 `.shaderbin` files and 196,620 `.modelbin` files (693 of them with no `MatI`
blob), holding 1,524,285 material instances. No file of any of them is refused. :proven[all 9,707 materialbins, 987 shaderbins and 196,620 modelbins]

## Where materials are stored

The track's material store is `bin.zip` → `materials\[<season>\]_0xNNNNNNNN.materialbin`: 419 parent materials, each also
under `spring\`, `autumn\` and `winter\` with the same hashed name; the flat set is summer and is the only one the manifest
lists. There are no loose `.materialbin` files in the track folder. :observed The manifest `AssetManifest.xml` ([Asset manifests](/engines/forzatech/data-model/asset-manifest/)) maps the hashed
names back to source paths, for example
`materials\_0x00000016.materialbin` → `tracks\brio\materials\assets\city\features\mat_cty_hrise_m_s3_feature_standard.material`
(419 entries). :observed

A model's `MatI` blob is a [Grub bundle](/engines/forzatech/data-model/grub-bundle/) of its own; its `MATI` blob (the bytes `ITAM`) starts
with the parent material path as a 7-bit-length string. :observed A `MatI` blob can be empty (zero bytes: a name and nothing
else): 821 of 20,000 models' blobs, for example `OCC_Material`; in the two Tokyo areas checked the only empty one with
geometry is `Boing_material` on a 32-triangle plane. :observed

## File layout

A `.materialbin` is a [Grub bundle](/engines/forzatech/data-model/grub-bundle/) of exactly three blobs, in this order, with
no other blob, blob version or metadata arrangement. :proven[all 9,707 materialbins]

| Blob | Version | Holds |
|---|---|---|
| `MATL` | 1.2 | three strings: the shader (`Game:\Media\...\<family>.shaderbin`), the technique (`Standard`, `AlphaTest`, `Road`, ... or empty) and a third string that is empty or `UBER_FOLIAGE` |
| `MTUD` | 1.0 | a `u8` pair count, then that many pairs of strings (a key such as `FM5Path` and its value) |
| `MTPR` | 2.0 | the parameters, below |

`MATL` carries the metadata `Name` (version 0: the material's name, its whole payload), `ATST` (version 2, 2 bytes), `BLST`
(version 1, 5 bytes) and on most also `XTRA` (version 4), in that order. :proven[all 9,707 materialbins]
A material instance (`MatI` blob of a model) is a bundle of two blobs: `MATI` 1.0 (stored as the tag bytes `ITAM`), whose data
is one string, the parent material path, with the metadata `Name` (version 0), `ATST` (version 2, 2 bytes) and `XTRA`
(version 5); then `MTPR` 2.0. :proven[all 1,524,285 material instances]
A string is a length in 7-bit groups (low group first, the high bit set on every byte but the last) and that many bytes of UTF-8.
:proven[every string of every material]
6,539 `MatI` blobs are empty (no bytes at all, not even a bundle header). :proven[all 196,620 modelbins]

What `ATST`, `BLST` and `XTRA` hold is not known. :unknown

## Parameters (MTPR and DFPR)

```layout
title: Shader parameter
size: variable
games: [fh6]
note: "The blob starts with a count: u16 if the blob version is 2.1 or later, else u8. Little-endian."
fields:
  - {at: 0, size: 1, type: u8, name: version major, value: 3, level: proven}
  - {at: 1, size: 1, type: u8, name: version minor, level: proven, note: "4 on all but a few materials; 3 on 649 materials of two cars (same layout); 1 on 12 texture parameters"}
  - {at: 2, size: 4, type: u32, name: hash, level: proven, note: "the parameter, as its shader's PARM table lists it; not always the CRC32 of the name (see below)"}
  - {at: 6, size: 1, type: u8, name: flag, level: proven, note: "0 or 1; when 1 a u32 follows: the flag hash, which for a shader default equals the CRC32 of the parameter's PARM name (set on switches such as RoughnessMetal, NormalMap, Tint, Skinning)"}
  - {at: "next", size: 1, type: u8, name: type, level: proven}
  - {at: "next", size: 16, type: "u8[16]", name: guid, level: proven}
  - {at: "next", size: variable, type: bytes, name: payload, level: proven, note: "by type, below"}
```

| Type | Payload | Notes | Confidence |
|---|---|---|---|
| 0 | 4 × f32 | float4, such as terrain `BlendMapScale` and `BlendMapOffset` | :proven[18,367,250 parameters] |
| 1 | 4 × f32 | colour | :proven[18,367,250 parameters] |
| 2 | f32 | | :proven[18,367,250 parameters] |
| 3 | u32 | bool | :proven[18,367,250 parameters] |
| 4 | i32 | mostly 0 or 1: feature switches | :proven[18,367,250 parameters] |
| 5 | 4 × f32 | BlendShuffle: a channel order, (0,1,2,3), (0,2,1,3), (2,0,1,3) or (1,2,0,3) | :proven[18,367,250 parameters] |
| 6 | 7-bit-length string + u32 | texture path and its path hash | :proven[18,367,250 parameters] |
| 7 | 4 × u32 | sampler state (address U, address V, w2, 0); U and V are 1 or 3, w2 is 0 to 6 | :observed; 1 = wrap, 3 = clamp :inferred |
| 8 | u32 count, then 4 bytes per entry | a gradient; 3 parameters in the install, all v3.4 | :proven[18,367,250 parameters] |
| 11 | 2 × f32 | | :proven[18,367,250 parameters] |
| 12 | 4 × u32 | an FH6 addition missing from the FH5 notes; missing it desynchronises the parse near the 17th parameter; 26,433 occur | :proven[18,367,250 parameters] |

Types 9 and 10 never occur, and no other type does. The census counts: type 0 1,646,364; 1 357,515; 2 4,901,345; 3 790,016;
4 2,410,103; 5 66,027; 6 6,879,839; 7 9,409; 8 3; 11 1,280,196; 12 26,433. :proven[all 18,367,250 parameters of 9,707 materialbins, 987 shaderbin defaults and 1,524,285 instances]

After the last parameter a v2.0 blob (`MTPR`) has a 12-byte trailer: a u32 that is 0, a u32 that varies from blob to blob
(its meaning is not known), and a u32 that is 0. :proven[all `MTPR` blobs] A v2.1 shader blob (`DFPR`) has a `u16` count and no
trailer. :proven[all 987 shaderbins] Every blob ends exactly at its trailer or its last parameter. :proven[all parameter blobs]
649 materials of two cars (`HOL_530_MalooFD_16` 389, `JAG_XJ220S_93` 260) use v3.3 with the same layout. :observed

### Texture path hash

The u32 after a texture path is `crc32(lowercase(full game path))` with backslashes, for example
`crc32("game:\media\tracks\brio\textures\assets\city\surface_tiling\tex_cty_tile_porcelain_tiles_a\swatches\tex_cty_tile_porcelain_a_bclr_2b7c5d03-e9d7-4023-8970-b24feb22a499.swatchbin") = 0xE513CC9F`.
It is written even when the path string is empty, which is the norm for instance materials. :observed Of the 569,170
texture parameters with a path, every one's hash is the CRC32 of the lowercased path, backslashes kept. :proven[all 569,170 texture parameters with a path]
6,310,669 texture parameters have an empty path and keep a hash all the same; 1,047 of them have hash 0. :proven[all 18,367,250 parameters]
A table from the archive
resolves it: the entry `…/pc/<rel>/<name>_<guid>_qualityN.pb` is the game path `game:\media\<rel>\<name>_<guid>.swatchbin`
(45,627 textures for Brio across the four chunks). Shared engine textures live in `media\_library\Textures.zip` and
`media\_library\TexturesPG\*.zip`, whose entries start below the zip (`swatches/<name>.swatchbin`). :observed Materials name a
`TexturesPG` entry by two paths: with the zip's name, `game:\media\_library\texturespg\<zip>\<path in the zip>`, and without it,
`game:\media\_library\texturespg\<path in the zip>`; `ubershader_default_diffusea_8b3aeaf9-….swatchbin` (in `objects.zip`)
hashes to the stored `0x97ABD0EC` by the second. :observed The track's GeoChunks store each such path as a texture of its own:
`.pb` tiers under exactly the path a material names, so `…\texturespg\objects\swatches\ubershader_default_lightmap_ba8a432b-…`
(named 168 times) and `…\texturespg\swatches\ubershader_default_lightmap_ba8a432b-…` (named 30 times) are two GeoChunk0
entries, and two `TexturesPG` paths that no library zip holds (`swatches\interpolate8_modu_…`, `swatches\ubershader_default_diffuseb_…`)
are in GeoChunk0 too. :observed[a scan of every `.materialbin` and `.shaderbin` of Brio's `bin.zip` for `_library` paths: 114
distinct paths; 96 in `Textures.zip`; of the 16 under `texturespg`, 15 are GeoChunk `.pb` entries of Brio under that exact path
(8 without a zip's name, 7 with `objects`) and the 16th, `texturespg\defaulttextures\swatches\greyscale_grey187_…`, is only in
`DefaultTextures.zip`; 2 paths are in no archive of the install] In a Tokyo area this resolves every texture parameter except 81 distinct hashes that are in
no track or library archive (festival banner art, some flag and projection-LOD textures). :observed

### Parameter values: the nearest definition wins

A parameter's value is the nearest definition up the parent chain: the instance, then each parent material, then the shader's
`DFPR` defaults. No definition is skipped because its texture looks like a placeholder. :observed In a Tokyo area, 337
`environment` materials set a static switch differently from their parent; with nearest-wins all 337 resolve to a permutation
compiled into `bin.zip`, with parent-wins 8 resolve to permutations that do not exist. :observed Sign variants also differ
only in their own instance values (colours, atlas cell). :observed

Some `PARM` tables name two hashes alike: `glass` `Roughness` (0x51D0FD93 is texture slot 3, 0xA05F6E3F the float),
`environment`, `environment_plot` and `environment_skinned` `_BrightnessStrength`, `_SaturationStrength` and
`_RoughnessStrength` (0xD158779A, 0x64CC6ACE, 0x95B2BF73 sit in the constant map; 0x77DED454, 0x8969749F, 0x963583F1 map to
offset 0 and are unused), and `uber_branch` and `uber_rock` `MicroNormal` (texture and switch). The shader reads the hash its
maps point to. :observed

## Parameter hashes used most

`crc32("NormalTiling") = 0x730F2086` matches the FH5 constants. :sourced[ForzaTech-extraction-tools] That is not so of every
parameter: in the 19,539 `PARM` records of the 987 shaderbins the record's key hash (the one materials, `CBMP`, `TXMP`, `SPMP`
and `DFPR` use; see [Shader containers](/engines/forzatech/shaders/shaderbin/)) equals the CRC32 of the record's name in only
3,362. The record's first u32 is that CRC32 on every record, and a flagged default's flag hash equals it. :proven[all 19,539 PARM records]

| Hash | Name | Swatch channel in file names | Confidence |
|---|---|---|---|
| `0x3170CD01` | DiffAlphaTex_A | `_bclr_` (base colour) | :observed |
| `0x2CE51028` | NormHeightTex_A | `_nrml_` | :observed |
| `0x360D57DE` | RoughMetAoPorTex_A | `_extra_` | :observed |
| `0x339E37DB`, `0x323B9E6D` | DiffAlphaTex_B, _C | `_diff_` | :observed |
| `0xDF6D462D` | TriPlanarModulateTexture | `_modul_` | :observed |
| `0xE1A40E95` | SwatchTintTexture | `_swatchtint_` | :observed |
| `0xAFA54042` | ConeMapTexture | `_rcsm_` | :observed |
| `0xDF897C94` | AoWetBlendContextTex | `_mask_` (data, never colour) | :observed |
| `0x1D111E8F` | LightmapTexture | `_lmap_`, `_lmbake_` (never colour) | :observed |
| `0x155B08EB` | EmissiveTexture | `_emis_` | :observed |
| `0x95B3E653` | Signage_DiffTex | sign mask atlas (BC4, one channel) | :observed |
| `0x62AE2840` | DualUv (bool) | secondary set on TEXCOORD1 | :observed |
| `0x9C1C3F4E` (`0x98F344DA` on roads) | TerrainColourTexture | per-cell terrain maps | :observed |

Signage constants: `0x73B013D4` Signage_BackGroundColor, `0x9CCEE62C` RColor, `0xFF4415E8` GColor, `0x297C1541` BColor,
`0x64941526` AColor, `0xA4E857E8` AtlasImages (vec2), `0x7C9DB9F9` AtlasIndex (vec2, 1-based), `0x2AB3A3AE`
UseFiveColorMask, `0x30613025` UseSteppedMask. :observed

## Resolving a material to a texture

1. Read the instance's own parameters and resolve empty texture paths through the path hash. :observed
2. Merge the parent chain (`MATI` path → hashed entry via the [manifest](/engines/forzatech/data-model/asset-manifest/#resolving-a-material-chain) → `_0xNNNNNNNN.materialbin`), nearest definition
   winning; the chain ends at a `.shaderbin` path, the family. Name every parameter from the family's own `PARM` table. :observed
3. Which slots make the colour is defined per family by its compiled shader ([Environment](/engines/forzatech/shaders/environment/),
   [Other families](/engines/forzatech/shaders/world-families/)). File names are not reliable: short ids such as
   `_bclr_tupfjgh` replace GUIDs, and `..._lmbake_diff` is a lightmap, not a colour. :observed

A chain can end at `Default.materialbin` with no shader family reached through the manifest: the `Areabound` material of
the 44 drawn `area_NN_boundary` walls, the `Bush_Flatten_LOD0` meshes (bucket 0x18) and the `OCC_occ_volume` occluder
volumes (bucket 0x58), all in no colour pass. :observed The file is not in the manifest's own zips but in
`_library/MaterialsPG/objects.zip` (`Default.materialbin`, with Autumn, Spring and Winter copies), and its shader is
`Game:\Media\_library\shaders\pg\diff1\diff1.shaderbin`. :observed

Water, decals and roads are recognised by shader family only, never by material name: `Material__855` is a river;
`Ocean_2-6103ab46` is `ocean_shoreline` while `Ocean_2-0ce7d6f3` is `ocean`; `ATC_CTY_PIPE_WATER_*`, `ATC_CTY_WATERTOWER_*` and
`PRP_GBL_CON_WATER_WEIGHT_*` are metal, and `PRP_CTY_LIGHT_STREET_*`, `PRP_CTY_PYLON_*_STREETLIGHT*`,
`MAT_PRP_CTY_STREET_FIRE_EXT_*` and `TEX_SGN_CITY_DIRECTION_ATLAS_*` are metal, not foliage. :observed
