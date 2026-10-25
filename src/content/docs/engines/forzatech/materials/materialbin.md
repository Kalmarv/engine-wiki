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

Counts below are from a recorded census of the Tokyo track `Brio`, no longer re-checkable. :observed

## Where materials are stored

The track's material store is `bin.zip` → `materials\[<season>\]_0xNNNNNNNN.materialbin`: 419 parent materials, each also
under `spring\`, `autumn\` and `winter\` with the same hashed name; the flat set is summer and is the only one the manifest
lists. There are no loose `.materialbin` files in the track folder. :observed The manifest `AssetManifest.xml` maps the hashed
names back to source paths, for example
`materials\_0x00000016.materialbin` → `tracks\brio\materials\assets\city\features\mat_cty_hrise_m_s3_feature_standard.material`
(419 entries). :observed

A model's `MatI` blob is a [Grub bundle](/engines/forzatech/data-model/grub-bundle/) of its own; its `ITAM` or `MatI` blob starts
with the parent material path as a 7-bit-length string. :observed A `MatI` blob can be empty (zero bytes: a name and nothing
else): 821 of 20,000 models' blobs, for example `OCC_Material`; in the two Tokyo areas checked the only empty one with
geometry is `Boing_material` on a 32-triangle plane. :observed

## Parameters (MTPR and DFPR)

```layout
title: Shader parameter
size: variable
games: [fh6]
note: "The blob starts with a count: u16 if the blob version is 2.1 or later, else u8. Little-endian."
fields:
  - {at: 0, size: 1, type: u8, name: version major, value: 3, level: observed}
  - {at: 1, size: 1, type: u8, name: version minor, value: 4, level: observed, note: "3.4 on every parameter except two car models' materials (3.3, same layout)"}
  - {at: 2, size: 4, type: u32, name: hash, level: observed, note: "CRC32 of the parameter name"}
  - {at: 6, size: 1, type: u8, name: flag, level: observed, note: "when non-zero a u32 follows: a hash, set on switches such as RoughnessMetal, NormalMap, Tint, Skinning"}
  - {at: "next", size: 1, type: u8, name: type, level: observed}
  - {at: "next", size: 16, type: "u8[16]", name: guid, level: observed}
  - {at: "next", size: variable, type: bytes, name: payload, level: observed, note: "by type, below"}
```

| Type | Payload | Notes | Confidence |
|---|---|---|---|
| 0 | 4 × f32 | float4, such as terrain `BlendMapScale` and `BlendMapOffset` | :observed |
| 1 | 4 × f32 | colour | :observed |
| 2 | f32 | | :observed |
| 3 | u32 | bool | :observed |
| 4 | i32 | mostly 0 or 1: feature switches | :observed |
| 5 | 4 × f32 | BlendShuffle: a channel order, (0,1,2,3), (0,2,1,3), (2,0,1,3) or (1,2,0,3) | :observed |
| 6 | 7-bit-length string + u32 | texture path and its path hash | :observed |
| 7 | 4 × u32 | sampler state (address U, address V, w2, 0); U and V are 1 or 3, w2 is 0 to 6 | :observed; 1 = wrap, 3 = clamp :inferred |
| 11 | 2 × f32 | | :observed |
| 12 | 4 × f32 | an FH6 addition missing from the FH5 notes; missing it desynchronises the parse near the 17th parameter | :observed |

After the last parameter a v2.0 blob (`MTPR`) has a 12-byte trailer (u64, u32 0); a v2.1 shader blob (`DFPR`) has nothing.
:observed Across 165,000 parameter blobs (the `bin.zip` materials and the `MatI` bundles of 20,000 models) only types 0 to 7,
11 and 12 occur (no 8, 9, 10), every parameter is v3.4 and every blob ends exactly at its trailer. :observed 649 materials of
two cars (`HOL_530_MalooFD_16` 389, `JAG_XJ220S_93` 260) use v3.3 with the same layout. :observed

### Texture path hash

The u32 after a texture path is `crc32(lowercase(full game path))` with backslashes, for example
`crc32("game:\media\tracks\brio\textures\assets\city\surface_tiling\tex_cty_tile_porcelain_tiles_a\swatches\tex_cty_tile_porcelain_a_bclr_2b7c5d03-e9d7-4023-8970-b24feb22a499.swatchbin") = 0xE513CC9F`.
It is written even when the path string is empty, which is the norm for instance materials. :observed A table from the archive
resolves it: the entry `…/pc/<rel>/<name>_<guid>_qualityN.pb` is the game path `game:\media\<rel>\<name>_<guid>.swatchbin`
(45,627 textures for Brio across the four chunks); shared engine textures live in `media\_library\TexturesPG\*.zip` with the
game path `game:\media\_library\texturespg\<path in the zip>`, and `ubershader_default_diffusea_8b3aeaf9-….swatchbin` hashes to
the stored `0x97ABD0EC`. :observed In a Tokyo area this resolves every texture parameter except 81 distinct hashes that are in
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

`crc32("NormalTiling") = 0x730F2086` matches the FH5 constants, so the hash is the same CRC32. :sourced[ForzaTech-extraction-tools]

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
2. Merge the parent chain (`ITAM` path → hashed entry via the manifest → `_0xNNNNNNNN.materialbin`), nearest definition
   winning; the chain ends at a `.shaderbin` path, the family. Name every parameter from the family's own `PARM` table. :observed
3. Which slots make the colour is defined per family by its compiled shader ([Environment](/engines/forzatech/shaders/environment/),
   [Other families](/engines/forzatech/shaders/world-families/)). File names are not reliable: short ids such as
   `_bclr_tupfjgh` replace GUIDs, and `..._lmbake_diff` is a lightmap, not a colour. :observed

A chain can end at `Materials\Default.materialbin` with no shader family: the `Areabound` material of the 44 drawn
`area_NN_boundary` walls, whose meshes are in no colour pass (bucket 0x18). :observed

Water, decals and roads are recognised by shader family only, never by material name: `Material__855` is a river;
`Ocean_2-6103ab46` is `ocean_shoreline` while `Ocean_2-0ce7d6f3` is `ocean`; `ATC_CTY_PIPE_WATER_*`, `ATC_CTY_WATERTOWER_*` and
`PRP_GBL_CON_WATER_WEIGHT_*` are metal, and `PRP_CTY_LIGHT_STREET_*`, `PRP_CTY_PYLON_*_STREETLIGHT*`,
`MAT_PRP_CTY_STREET_FIRE_EXT_*` and `TEX_SGN_CITY_DIRECTION_ATLAS_*` are metal, not foliage. :observed
