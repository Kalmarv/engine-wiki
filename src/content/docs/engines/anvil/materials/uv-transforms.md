---
title: Material UV transforms
description: Eight-float UV properties, runtime matrix observations and unresolved rotation and animation order.
games: [riders-republic, "shaun-white-skateboarding"]
---

A UVTransform property stores eight floats and three bytes. Its template binding identifies the material constant-buffer rows used to transform `(u,v,1)`. The census contains 21,928 UV properties on 6,166 of the 13,579 stored Materials. :proven[all stored UV-property records]

```layout
title: UVTransform property payload
size: 47
note: Begins after the sixteen-byte Material property header.
fields:
  - {at: 0, size: 8, type: u64, name: object identity, level: observed}
  - {at: 8, size: 4, type: u32, name: repeated class, value: "0xC52E2125", level: proven}
  - {at: 12, size: 4, type: f32, name: U scale, level: observed}
  - {at: 16, size: 4, type: f32, name: V scale, level: observed}
  - {at: 20, size: 4, type: f32, name: U translation, level: observed}
  - {at: 24, size: 4, type: f32, name: V translation, level: observed}
  - {at: 28, size: 4, type: f32, name: U translation speed, level: inferred, note: "name and animated-value correlation; time rule unresolved"}
  - {at: 32, size: 4, type: f32, name: V translation speed, level: inferred, note: "name and animated-value correlation; time rule unresolved"}
  - {at: 36, size: 4, type: f32, name: rotation in radians, level: observed}
  - {at: 40, size: 4, type: f32, name: rotation speed, level: inferred, note: "no resident animated-rotation case"}
  - {at: 44, size: 1, type: u8, name: AnimateTranslation candidate, level: inferred, note: "1 on 133 properties; correlated with speed fields"}
  - {at: 45, size: 1, type: u8, name: AnimateRotation candidate, level: inferred, note: "1 on eight properties"}
  - {at: 46, size: 1, type: u8, name: unnamed byte, level: unknown, note: "1 on four properties; otherwise 0"}
```

Eleven distinct runtime matrices match stored static float combinations to five significant digits, each matching one combination. Five have rotation only and uniform scale; six have translation only, including nonuniform scale. They establish unscaled signed translation in the third column and a final row `(0,0,1,0)`. :observed[world-memory matrix comparison]

For the measured uniform-scale rotated cases, rows are `(s*cos(t),-s*sin(t),0,0)` and `(s*sin(t),s*cos(t),0,0)`. Translation-only rows are `(su,0,tu,0)` and `(0,sv,tv,0)`. These observations do not distinguish `S*R` from `R*S` when rotation and nonuniform scale occur together. :observed[eleven matrices]

The corpus has 32 distinct static combinations with unequal scales and nonzero rotation and 45 with rotation plus translation, but none is identified among the sampled resident matrices. Extrapolating a complete composition order is therefore an inference. :observed[corpus/snapshot comparison] :inferred[general composition]

Animated examples have translations with signs and zero components matching the stored speed directions, but a single common elapsed-time multiplier does not explain them. Their clock, wrapping and update timing are unresolved. :observed[animated runtime matrices] :unknown[time rule]

:::open[How are nonuniform scale, rotation and time combined?]
The static special cases are established. Their general product order, translation combined with rotation, animated time term and third byte remain unresolved. :unknown
:::

## Rotated UV slots in Shaun White Skateboarding

:only[shaun-white-skateboarding]

Each diffuse slot of an `SKGenericMaterial` stores a scale, an offset and a rotation in degrees (see [the slot block](/engines/anvil/materials/material/)). The setter converts the degrees to radians in double precision (multiplying by pi / 180), rounds that to `f32`, and takes the `f32` cosine and sine. With scale `(sx, sy)`, offset `(ox, oy)` and angle `a`, the two matrix rows it writes are `(sx·cos a, −sx·sin a, ox)` and `(sy·sin a, sy·cos a, oy)`. A texture coordinate is therefore `S · R(a) · uv + o`: the rotation acts about the origin first, then the scale, then the offset. :proven[the engine's own setter, run on its own inputs]

The engine's setter (`0xCD7590` of the recorded build) was run in a host that mapped the executable and applied its relocations by hand; its 66 output matrix words equal the formula above exactly. The full pixel program of a material rotated by 26.27 degrees, run on a reference rasteriser with patterned textures, gave 105 colour values equal to the formula. The full original vertex program, run for a street pavement material with scale 2 by 1, gave the same derived coordinates as the formula in 70 of 70 checks, with identity and altered-rotation controls changing the outputs as expected. :proven[the engine's own code, run on constructed inputs]

Materials with a nonzero rotation on a populated slot occur in every one of the six levels. :observed
