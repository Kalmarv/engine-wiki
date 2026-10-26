---
title: Light records and attenuation
description: Authored local lights, bone placement, time masks and the Enhanced light shader's radial window.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: LightAttributes record names and bone-placement reference.
implementations:
  - name: primase worlds/gta (drawable.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/rage/drawable.rs
---

Drawables and fragments carry authored light lists. Records distinguish point (1), spot (2) and capsule (4) lights
and store position, colour, intensity, range, time flags, direction, cone angles and additional shadow/volume/corona
parameters. :observed

The proven light-record fields below are read for every light list in the accepted version-159 YDR/YDD and
version-171 YFT corpus. The whole-resource census rejects unknown light kinds, non-finite values and unexpected
reserved words and reports no such failures; fifteen other-version YDR copies are excluded. Runtime placement,
hour examples and CPU-to-shader mappings have separate evidence scopes. :proven[all accepted drawable resources]

Light positions and directions are in the space of the bone named by `bone_id`. A fragment can supply its own bone
pose; otherwise the skeleton's composed rest pose places the light in drawable space before the entity transform.
:observed

```layout
title: LightAttributes
size: 168
fields:
  - {at: 0, size: 8, type: bytes, name: unknown zero words, level: unknown, note: "zero in inspected records"}
  - {at: 8, size: 12, type: vec3, name: position, level: proven}
  - {at: 20, size: 4, type: u32, name: unknown zero word, level: unknown}
  - {at: 24, size: 3, type: RGB8, name: colour, level: proven}
  - {at: 27, size: 1, type: u8, name: flashiness, level: sourced}
  - {at: 28, size: 4, type: f32, name: intensity, level: proven}
  - {at: 32, size: 4, type: u32, name: flags, level: sourced}
  - {at: 36, size: 2, type: u16, name: bone tag, level: proven}
  - {at: 38, size: 1, type: u8, name: kind, level: proven}
  - {at: 39, size: 1, type: u8, name: group ID, level: sourced}
  - {at: 40, size: 4, type: u32, name: time flags, level: proven}
  - {at: 44, size: 4, type: f32, name: falloff range, level: proven}
  - {at: 48, size: 4, type: f32, name: falloff exponent, level: sourced, note: "CPU mapping to shader attenuation k is unknown"}
  - {at: 52, size: 16, type: vec4, name: culling plane, level: sourced}
  - {at: 68, size: 1, type: u8, name: shadow blur, level: sourced}
  - {at: 69, size: 7, type: bytes, name: unknown zero bytes, level: unknown}
  - {at: 76, size: 4, type: f32, name: volume intensity, level: sourced}
  - {at: 80, size: 4, type: f32, name: volume size scale, level: sourced}
  - {at: 84, size: 3, type: RGB8, name: volume outer colour, level: sourced}
  - {at: 87, size: 1, type: u8, name: light hash, level: sourced}
  - {at: 88, size: 4, type: f32, name: volume outer intensity, level: sourced}
  - {at: 92, size: 4, type: f32, name: corona size, level: sourced}
  - {at: 96, size: 4, type: f32, name: volume outer exponent, level: sourced}
  - {at: 100, size: 4, type: "u8[4]", name: light-shadow-specular-volume fade distances, level: sourced}
  - {at: 104, size: 4, type: f32, name: shadow near clip, level: sourced}
  - {at: 108, size: 4, type: f32, name: corona intensity, level: sourced}
  - {at: 112, size: 4, type: f32, name: corona Z bias, level: sourced}
  - {at: 116, size: 12, type: vec3, name: direction, level: proven}
  - {at: 128, size: 12, type: vec3, name: tangent, level: proven}
  - {at: 140, size: 4, type: f32, name: inner cone angle, level: sourced}
  - {at: 144, size: 4, type: f32, name: outer cone angle, level: sourced}
  - {at: 148, size: 12, type: vec3, name: capsule extent, level: sourced}
  - {at: 160, size: 4, type: u32, name: projected texture hash, level: sourced}
  - {at: 164, size: 4, type: u32, name: unknown zero word, level: unknown}
```

## Hours

The low 24 time-flag bits select hours; a zero hour mask means always on in the documented light interpretation.
Sampled street lamps carry `0xF0003F`, selecting 00–05 and 20–23. Their `emissivenight` lamp-head materials are also
dark by day; `Prop_StreetLight_head` has `EmissiveMultiplier` 16. :observed

Night therefore has three hour-keyed parts: light records by their time flags, emissive night materials, and
[night-only geometry](/engines/rage/materials/vertex-colours/) that its vertex shader collapses by day. :observed

## Shader window

Executing the sampled point-light and directional-light pixel programs under Microsoft WARP confirms that their
diffuse terms share a global scale `G`: point lighting uses `G * colour * intensity * window * albedo * NdotL`,
while sunlight uses `G * sun * albedo * NdotL`. The point-light radial window is `s / ((1-k)*s + k)`, with
`s = saturate(1 - d²/R²)`. This is evidence for these compiled programs and tested inputs. :proven[WARP execution]

The programs are `PS_pointCM_standard_6a549d93` (variant 0) and `PS_directional_just_dir_789981ad`. Over 112 point
and 20 sun cases, the formulas match the executed programs to a relative error of at most 1.5e-7. Neither has a
`1/π`, a factor of two or an exposure term; the albedo they read is the square root stored in the
[G-buffer](/engines/rage/shaders/deferred-shading/), squared. :proven[WARP execution]

| Constant | Meaning in the point-light program | Confidence |
|---|---|---|
| `lighting_locals` (`cb9`, space 1) row 3 `xyz` | Light colour | :proven |
| `lighting_locals` row 3 `w` | Intensity `I` | :proven |
| `lighting_locals` row 4 `z` | `1/R²` | :proven |
| `lighting_locals` row 7 `x` | Falloff scalar `k` | :proven |
| `misc_globals` row 14 `z` | Global scale `G`, shared with the sun program | :proven |

The shader window is not inverse-square attenuation. CodeWalker's renderer uses a different curve,
`(1-d)/(1+k*d²)`, which does not establish the game's compiled shader response. :observed[shader disassembly]

:::open[How do authored light values become shader constants?]
The CPU mapping from `falloff_exponent` to shader `k`, the absolute photometric units and any CPU intensity scale
are unresolved. Shader execution establishes the constant-to-pixel equation, not those upstream mappings. :unknown

The stored exponents range from 8 to 256 over the 107 lights of the Legion Square area. :observed The mapping
matters: at half the radius the window is `0.75 / (0.75 + 0.25k)`, so with `k` equal to the exponent, lights of
exponent 8, 32 and 64 are 2.75, 8.75 and 16.75 times dimmer there than with `k = 1`. :inferred
:::
