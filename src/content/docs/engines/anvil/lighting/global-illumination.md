---
title: Global illumination and environment data
description: Dynamic surfel GI, probe positions, world transfer maps and ambiance environment cubemaps.
games: [riders-republic, "shaun-white-skateboarding"]
implementations:
  - name: primase Anvil GI reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/gidyn.rs
---

GIDynResource describes the geometry and visibility inputs for dynamic global illumination, rather than a ready-to-display set of baked probe colours. Its update shaders relight surface samples and accumulate probe radiance. :observed[GI update shader disassembly] :inferred[complete relighting interpretation]

## Spatial organization

The [GIDynResource storage page](/engines/anvil/data-model/gidyn-resource/) describes its serialized framing and four streams.

USNAT's base forge has one `GIDyn_<n>` resource for each of the 16,384 cells of its 128×128 grid. Patch copies cover changed cells. The sampled resource's position offset is the cell centre, and its half-float probe coordinates are relative offsets in metres. :observed[complete base index and sampled resources]

The inspected one-volume/one-box profile has a voxel-to-probe grid, probe positions, encoded sample data and encoded directional data. Reading 418 bodies establishes this profile's framing and length relations; it does not establish that every GI resource uses only that profile. :observed[418 bodies]

The low 15 bits of a nonempty voxel-grid word identify a probe; `0xFFFF` marks none. The high flag bit's meaning is unresolved. Voxel index bounds are not sufficient evidence for a guessed voxel-to-world transform. :observed[grid values and bounds] :unknown[flag and full grid transform]

## Lighting update

Static reading of GIDynUpdateSample, UpdateProbe, UpdateSky and UpdateVolume shows surface-sample lighting from the sun, shadow comparisons, a previous-volume bounce term and packed RGB565 albedo. Probe updates project directional radiance to first-order spherical harmonics: four coefficients per colour, twelve floats per probe. :observed[update programs]

The sky direction set has 192 Fibonacci-sphere directions: `z=1-(2*i+1)/192`, `phi=i*.618034*2*pi`. Probe updates read sample-or-sky indices for these directions, and the volume update uses the voxel-to-probe grid. Complete directional-table decoding and the exact GPU texture construction are unresolved. :observed[shader arithmetic] :unknown[complete table and GPU construction]

## World maps and cubes

World holds references to SkyVisibility and TransferSH0–3. The transfer maps include an unsigned BC6H base term and signed BC6H higher terms. Their interpretation as terrain sky visibility and low-order SH transfer is supported by names and coherent map content, rather than an executed complete ambient-light path. :observed[references and decoded content] :inferred[transfer interpretation]

WorldAmbiance selects the environment cube for a look. All 17 examined BC6H cubes are referenced by at least one WorldAmbiance; they are global ambiance resources rather than a list of placed local probe entities. Region and weather names describe their intended looks, but the exact reflection/ambient selection beyond those references remains unresolved. :observed[all cube-reference joins] :unknown[full lighting use]

:::open[How does stored visibility become irradiance?]
Sample decoding, the directional-table remainder, grid flags and the complete resource-to-GPU construction are not all established. No baked irradiance values can be claimed merely by decoding probe positions. :unknown
:::

## Shaun White Skateboarding

:only[shaun-white-skateboarding]

The static world of Shaun White Skateboarding is lit by baked data, not by the stored omni and spot lights. Three stored kinds of baked data take part. :observed{games="shaun-white-skateboarding"}[level 01 and the shader sources]

| Class | Id | Size | Holds |
|---|---|---:|---|
| `LightMapData` | `0xAA9C9CB4` | 75 bytes | A reference to a light-map texture named `LMP_ColLightMapTexture*` (BC3, one mip) |
| `VertexLightData` | `0x37542FA0` | 71 bytes | Per-instance baked vertex colours, held with the placement's mesh instance data (class `0x536E963B`), in a block of class `0x4368101B`: a header of nine `u32`, then 4 bytes per vertex |
| `CompositeLightingStaticComponent` | `0x95DC9CD6` | variable | Seven `float4` of spherical-harmonic coefficients, a direction and two `float4` for the uninfluenced state |

The class ids equal the CRC-32 of the class names `LightMapData`, `VertexLightData` and `CompositeLightingStaticComponent`. :proven[computed from the names]

A stored baked value is decoded as `value · scale + bias`, with the pair stored in a `StaticColorModification` object (class `0x40F951DA`) as the bias `float4` followed by the scale `float4`. The bias equals the level's sky ambient colour in all six levels: 70, 70, 70, 90, 70 and 50 of 255 for levels 01 to 06 (0.2745, 0.2745, 0.2745, 0.3529, 0.2745, 0.1961). :observed[all six levels]

The shader permutations for the generic effect are named `STATIC_LIGHTMAP`, `STATIC_VERTEXLIGHTING` (the per-instance colour stream) and `COMPOSITELIGHTING` (the spherical harmonics plus ambient). The attenuation function for omni lights is compiled in only for the tool build. :observed

Stored local lights therefore do not reach dark places: in the level 05 tunnel the nearest omni light is 24.8 m from the spot and has a range of 25 m, and in level 06 the 16 lights are at least 150 m away. A black box mesh (`05A_CoridorBlackBox01`, material `Gen_Black_Mat`) faces inward around the tunnel, so the darkness is authored. :observed[levels 05 and 06]
