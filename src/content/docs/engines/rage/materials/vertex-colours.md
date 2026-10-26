---
title: Vertex colours and tint palettes
description: Shader-specific colour channels for opacity, ambient occlusion, palette columns and terrain weights.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: Effect and parameter names.
implementations:
  - name: primase worlds/gta (tint.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/passes/tint.rs
---

Vertex colours are shader inputs with several meanings. Treating every RGB channel as a direct albedo multiplier
does not reproduce the sampled Enhanced effects: red and green often control ambient occlusion, while blue can
select a palette column or contribute to emission. :observed[shader inspection]

| Input | Use | Confidence |
|---|---|---|
| `COLOR0.a` | Opacity is texture alpha times vertex alpha in 150 of the 336 effects scanned | :observed[shader disassembly] |
| `COLOR0.r/g` | Natural/artificial ambient-occlusion inputs in sampled deferred effects | :observed[shader evaluation] |
| `COLOR0.b` | Palette column in common `_tnt` effects | :observed[vertex shader inspection] |
| `COLOR1.b` | Palette column in some tree effects | :observed[vertex shader inspection] |
| `COLOR1.rgb` | Four-layer terrain blend inputs | :observed[pixel shader inspection] |

## Palette tint

Tinted vertex shaders point-sample `TintPaletteTex` at a column given by the selected colour byte divided by 255.
The entity's tint chooses the row; rows beyond the palette clamp to its edge. The sampled colour multiplies the
surface and interpolates between vertices across a triangle. :observed

Palette tint can therefore vary within one primitive. A single mean colour or a single palette column does not
describe the authored gradient. :inferred

## Special effect families

The sampled `cpv_only` G-buffer shader writes white albedo; vertex colour supplies ambient occlusion. A grey colour
substitution changes the surface colour rather than reproducing that shader. :observed[shader disassembly]

In `normal_spec_detail`, albedo is `DiffuseTex * (1 - detailSettings.x * specA * (d1 + d2 - 1))` and vertex colour
again supplies only ambient occlusion. :observed[shader disassembly] Here `specA` is the specular map's alpha and
`d1`, `d2` are the two detail-map samples. :inferred

`*_geomnightonly` vertex shaders collapse the geometry during the day. The stored mesh remains present in the file;
its daytime disappearance is shader behaviour. :observed[vertex shader inspection]

The sampled deferred emissive shader computes `RT3.z = saturate(COLOR0.b * DiffuseTex.a * EmissiveMultiplier *
engineGlobal / 16)`, with colour inputs normalized. Its forward alpha technique adds the corresponding emission to
lighting and uses `DiffuseTex.a * COLOR0.a` for alpha. :observed[shader disassembly]

The emissive vertex shader applies engine UV-animation rows to `(u,v,1)`. A material texture and static UVs alone do
not specify its animated appearance. :observed[shader disassembly]

The foam effects `water_terrainfoam` and `water_riverfoam` produce white foam with scrolling texture opacity driven
by engine time and globals; their names do not imply a water-surface shading model. :observed[shader disassembly]
