---
title: Far-field ground colour
description: The per-cell baked ground colour of Forza Horizon 6, split over a mainmap and a submap swatch, and the formula the terr_mega shader applies.
---

Every 512 m cell ships a pre-baked albedo of the whole cell (fields, roads, snow, sand), used beyond the near-field clipmap
([Near-field ground](/engines/forzatech/terrain/near-field-megatexture/)). It is split over two swatches in
`textures\tbheightfield\swatches\`, whose names are the engine's even though they look swapped: the "colour" texture holds the
normal and a luminance, the "normal" texture holds chroma. :observed The formula is read from the `terr_mega` G-buffer pixel
shader. :observed

```
uv  = (X, Z) · BlendMapScale.xy + BlendMapOffset.xy        absolute world X/Z
      BlendMapScale = (1/512.5, −1/512.5)                   (material params, type 0: guid16 + float4)
      → u = (X − X0 + 0.25) / 512.5,   v = (Z0 + 512.25 − Z) / 512.5     X0, Z0 = cell minimum; row 0 = north
A   = TerrainColourTexture(uv)  = mainmap_x<lx>_z<lz>_x<season>x_diff   (BC7, linear)   rg = normal xy, a = luminance
B   = TerrainNormalTexture(uv)  = submap_x<lx>_z<lz>_x<season>x_diff    (BC7 sRGB)      rgb = chroma
far_albedo = B.rgb · A.a²      (linear)
albedo     = lerp(near_clipmap, far_albedo, saturate(ring − 6))
```

The material slot hash is `0x9C1C3F4E` (`TerrainColourTexture`; `0x98F344DA` on roads). The half-texel border makes neighbouring
cells share their edge texels. :observed Quality tiers are the same image at different sizes: q1 to q3 (128 to 512 px) in
`GeoChunk0`, q4 (1,024) and mainmap q5 (2,048 px = 0.25 m per pixel) in `GeoChunk2`. :observed Which pair a season uses is read
from the cell's `terr_mega` instances ([Seasons](/engines/forzatech/world/seasons/)), not from `_x<season>x_` in the names. :observed
`uber_megaroad` uses the same far-field base plus a near-field tint from its roadblend `_tint_` map at `TEXCOORD2`; city
`uber_road` meshes have their own textures. :observed

In the Shibuya cell the submap stores four tiers (1,024, 512, 256 and 128 px) and the mainmap five (2,048 down to 128), each tier one
block-compressed level. :observed[the one pair every terrain material of the box reads] The baked colour `B.rgb · A.a²` at the 1,024 px
submap tier (0.5 m per pixel) carries the road markings: zebra crossings, lane lines, kerb lines and painted text are separate marks of one
to a few pixels; at the 256 px tier (2 m per pixel) the same marks are smeared into grey bands. :observed[the cell's pair, both tiers
viewed] The stored data has smooth horizontal bands over the whole cell: the row means of the mainmap alpha range 60 to 108 with a
dominant period of 27 m (108 rows at 2,048 px, 54 rows at 1,024), and the submap's green row means range 235 to 248 with the same
27 m period; the period in metres is the same at every tier. :observed[the cell's pair, three independent BC7 decoders]
The three decoders give identical RGBA on all four tiers read (0 differing texels in 4,194,304, 1,048,576,
1,048,576 and 262,144), so the bands are in the stored swatches, not a decode artefact. :observed[three decoders over four tiers of one pair]

The far-field roughness is `sat(TerrainGlossTexture(uvB).r / 0.93)` and the normal is `x = 2A.r − 1, z = 2A.g − 1,
y = sqrt(sat(1 − x² − z²))` in world space, from the mainmap `A` ([Other world families](/engines/forzatech/shaders/world-families/)).
:observed

## Water seen through it

The water's colour is the far-field terrain colour below it seen through the water ([Water](/engines/forzatech/water/water/)). :observed

## Where the near field takes over

The pixel shader tests rings `k = 0..6`; outside every ring the ring index is 255, and `albedo = lerp(near, far_albedo,
saturate(ring − 6))` blends the outermost ring into the far field. :observed Ring 6 is 0.25 m per texel, exactly the far-field texel,
if the first layer record of 1,024 texels covers 4 m. :inferred
