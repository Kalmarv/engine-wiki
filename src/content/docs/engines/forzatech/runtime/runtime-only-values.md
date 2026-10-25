---
title: Values only the running game holds
description: Per-frame constants, encrypted settings and protected CPU code in Forza Horizon 6 that no readable file stores, with where each is consumed.
---

Some inputs to the shaders and to placement are not in any data file: they are per-frame or per-draw constants the engine computes, values
in the [encrypted settings archives](/engines/forzatech/archives/encrypted-files/), or results of CPU code stored encrypted in the
executable. A static reading of the install cannot recover them. Each row says where the value is consumed, so a GPU frame capture of
the running game (the bound constant buffers of the named draw) would know what to read. :observed

## The executable

`forzahorizon6.exe` is not packed: the entry point is the plain MSVC start-up (`sub rsp,28; call; add rsp,28; jmp`). `.text` is 104 MB at 7.74
bits per byte overall; in 64 KB windows, 160 look like ordinary compiled code (< 6.75 bits per byte), 1,053 are dense (6.75 to 7.9) and 380
are near random (> 7.9). Even the near-random windows hold real function boundaries (int3 padding runs about 98 and standard prologues about
36 per 64 KB, where uniform random bytes give 0). So the code is real, interleaved with high-entropy regions (embedded data, obfuscated or
protected functions); it is not encrypted wholesale. :observed Individual functions are: the `Instancing::InstancingData` registration calls
`0x14278E990` and `0x14278EBE0`, which `.pdata` lists as functions of 136 and 135 bytes whose bytes are random-looking (entropy about 6.6),
while neighbouring functions begin with ordinary prologues (`40 53 48 83 ec 20`). Selected functions are stored encrypted and decrypted in
memory at run time. :observed

## World values

| Value | Consumed by | Section |
|---|---|---|
| global LOD distance scale(s) | LOD selection (CPU); encrypted render settings | [LODs and clusters](/engines/forzatech/geometry/lods-and-clusters/) |
| clipmap ring size (metres per texel) and ring origins | `terr_mega` pixel shader rows 36 to 42 and 45 to 51 | [Near-field ground](/engines/forzatech/terrain/near-field-megatexture/) |
| per-ring megatexture switches (modulate mode, BC1 diagonal check, height-blend sharpness) | `MegaTexture.Params` in encrypted `Megatexture.xml` | same |
| CPU-built splat weights and layer buffers | the `MegaTextureSplat_*` compute shaders | same |
| decal depth offset `cb2[141].w`, `cb9[24].w` and the per-draw root constant | every non-instanced G-buffer vertex shader | [Decals](/engines/forzatech/effects/decals/) |
| depth, raster and blend state (decal blend op, alpha-to-coverage) | pipeline state (names in the executable, values encrypted) | same |
| alpha-test threshold `cb2[128].x` | every alpha-tested pixel shader | [Other world families](/engines/forzatech/shaders/world-families/) |
| AO strength `K = cb2[159].x` and the AO globals `cb2[92..93]` | `environment` and plot albedo | [Environment](/engines/forzatech/shaders/environment/) |
| sampler filter and address modes of run-time descriptors (e.g. the triplanar modulate sampler `s1`) | the families that use them | same |
| SplineDeform model x range `x0`, `x1` | `InstancingCB` register 1; the filling CPU code is stored protected | [Spline deform](/engines/forzatech/shaders/spline-deform/) |
| the draw path of "no curve" sentinel instances | the CPU's split of a block's instances into draws | same |
| emissive distance term `g(d)` and anything that undoes it | `emissiveonly`, `projection_lod _E`, `pylon_cables` | [Other world families](/engines/forzatech/shaders/world-families/) |
| specular exponent `LS[107].y` and its floor; caustics `cb2[171]`; transmittance remap switch | water and ocean shaders | [Water](/engines/forzatech/water/water/) |
| weather globals (rain `cb7[2].x`, wetness `cb2[91]`, `cb2[140]`, `cb2[144]`) | the shared wetness step | the identity when dry |
| light scenario (sun, sky, exposure) | lighting passes | not described |

All rows :unknown as values; the consumer column is :observed.

## Car values

| Value | Consumed by | Section |
|---|---|---|
| wheel size (2 morph weights), tyre outer radius and tyre model per car and upgrade | wheel and tyre vertex shaders; from `gamedbRC.slt` | [Wheels and tyres](/engines/forzatech/gameplay/car-wheels/) |
| tyre contact-patch bulge (slots 2 to 4, `cb4[36..37]`) | car and tyre vertex shaders | same |
| the default factory colour of each car; the user's garage (owned cars, fitted parts, paint, livery) | encrypted database and profile | [Factory paints](/engines/forzatech/gameplay/car-paint/) |
| the livery canvas (vinyl layers composited at run time) | paint shader, bindless space 43 index 1 | [Liveries](/engines/forzatech/gameplay/liveries/) |
| vinyl shape id → `Vinyls.zip` entry; paint-slot paint type; render-target sample count and blend state | game database and code | same |
| lamp and gauge light-group intensities (`Emissive_Trigger`, `LightFunction`) | most car families | [Car materials](/engines/forzatech/shaders/car-materials/) |
| brake-rotor glow, window dirt, wipers, glass break amount, interior-camera switch, car fade, fog in glass | car families | same |
| per-object matrix `cb9[4..7]`, per-wheel wear `cb4[67]`, blur `cb4[31+i].w`, sidewall V scale `cb4[61]`, AO V offset `cb4[47]` | `car_tires_pg` | same |
| plate characters `cb4[55..56]`; fan spin; screen render targets; planar mirror flags; wheel-blur render | individual families | same |
| screen-space normal variance in the GGX alpha | every car family | same |
| what an aftermarket wheel id names; the tune's wheel and tyre sizes, track and ride-height values | encrypted `gamedbRC.slt` and physics | [Saves and tunes](/engines/forzatech/gameplay/saves-and-tunes/) |
| the texture the engine binds when a material references one the install does not ship (215 paths) | every car family | [Swatch textures](/engines/forzatech/textures/pb-swatch/) |

All rows :unknown as values; the consumer column is :observed.
