---
title: Grass library and terrain selection
description: Grass models, rule groups, material fallbacks, terrain overrides and runtime instance generation.
games: [riders-republic]
implementations:
  - name: primase Anvil grass reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/grass.rs
---

Grass and low clutter use a world-level library and terrain rules. The stored chain supplies models, group choices, densities and scale ranges; it does not supply the resulting per-plant position list. Exact runtime scattering remains unresolved. :observed[stored library and model bodies] :unknown[scatter producer]

The whole-world cell lists GrassEntityGroup, which reaches SETUP_GrassUS_NAT. Its GrassComponent references the library, GrassSettings and 46 managed model Entities. A model index is its position in that array, matching GrassModelID and its library settings index on all 46 models; it is not the number in its Entity name. :proven[46-way identity join] :observed[world chain]

## Library structure

The only examined GrassPatternLibrary is 30,247 bytes and closes exactly: byte 1, u32 model count, byte 0, 46 pairs of 72-byte GrassModel and 60-byte BoundingVolume objects, zero u32, 190 groups and a 443-byte tail. The groups contain 218 rules: 61 empty groups, 57 with one rule, 55 with two and 17 with three. :proven[complete library]

```layout
title: GrassPatternElement
size: 94
note: Includes the twelve-byte object header.
fields:
  - {at: 0, size: 8, type: u64, name: object identity, level: observed}
  - {at: 8, size: 4, type: u32, name: GrassPatternElement class, value: "0xA6FC073D", level: observed}
  - {at: 12, size: 2, type: u16, name: GrassModelIndex, level: observed}
  - {at: 14, size: 1, type: u8, name: TilingLogCount, level: observed}
  - {at: 15, size: 4, type: f32, name: Density, level: observed}
  - {at: 19, size: 4, type: f32, name: TiltFactor, level: observed}
  - {at: 23, size: 1, type: u8, name: ScalingEnabled, level: observed}
  - {at: 24, size: 4, type: f32, name: ScaleA, level: observed}
  - {at: 28, size: 4, type: f32, name: ScaleB, level: observed}
  - {at: 32, size: 1, type: u8, name: HeightScalingEnabled, level: observed}
  - {at: 33, size: 4, type: f32, name: HeightScaleA, level: observed}
  - {at: 37, size: 4, type: f32, name: HeightScaleB, level: observed}
  - {at: 41, size: 4, type: f32, name: unnamed float, level: unknown, note: "5 on 145 rules; 0 on 66; also 2.5"}
  - {at: 45, size: 49, type: bytes, name: remaining fields, level: unknown, note: "includes byte 100, a u16, ten floats and six final bytes; semantics not established"}
```

Model settings include ZOffset, terrain-normal following, softness, normal bend, translucency and impostor controls. Their trailing LOD table commonly stores `00 01 02 03 03` and distance triples 5/10/20, 10/20/40 or 20/40/80. The interpretation of the latter as metre distances follows names and values. :observed[46 settings objects] :inferred[distance units]

Each model Entity directly names a GrassMesh_Model with three ranges carrying the same material, representing model LODs rather than three independently chosen materials. The material family is Clutters_Grass. :observed[46 model/mesh joins]

## Terrain group and weight

The terrain picker first gets a group from the material byte through the library's 256-entry table. **Block 5 overrides that choice unless its value is `0xFE`**, which leaves the material-derived group. `0xFF` denotes no group. The table is all `0xFF` except its final entry in the examined library, making an unpainted `0xFE` override commonly yield no grass, without making `0xFE` itself the no-grass code. :observed[picker disassembly and complete library table]

Block 4 supplies a weight: `w=value>>1`, except value 1 also counts as weight 1. Weight zero disables the group. Every node stores block-4 value `0x60`, giving weight `0x30`; the picker builds 17,424 group/weight pairs and a short group summary per node. :proven[all-node constant raster] :observed[picker]

Five rules in groups 185–189 refer to model indices 46–50 outside the 46-model set. No measured terrain override reaches those groups. A rule existing in the library is therefore not evidence that it is active terrain content. :observed[library and terrain value joins]

## Draw data and settings

GrassSettings includes WorldExtent 16,384, WorldMinZ 0, WorldMaxZ 7,168 and a visibility-distance value 250. Four tables of sixteen u16 start-distance values differ by model class. Not every remaining setting field has a reconciled serialization meaning. :observed[settings body and registry]

The draw shaders consume instance transforms and fade data. The matrix portion is three float4 rows rather than a stored full 4×4 array; apparent four-vector records include other instance data. Two compute programs previously associated with grass are named WorldParticles_EmitEntity and WorldParticles_EmitTerrain, and are not evidence for grass scattering. :observed[shader declarations and engine shader names]

:::open[How do density and seed produce plants?]
The exact instance count, within-cell position, random seed, rotation, slope rejection and scale sampling remain unresolved. Density and scale-range fields are stored; their names alone do not prove a particular stochastic generator. :unknown
:::
