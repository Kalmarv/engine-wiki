---
title: Material render state
description: Blend modes, stored boolean flags, alpha reference, culling and draw-class masks.
games: [riders-republic]
---

Material state controls depth, culling, alpha testing and pass participation separately from the texture formulas. The deserializer stores BlendMode, AlphaDisplayMode and AlphaTestValue, then 35 individual boolean bytes; the runtime object packs them into a flag word. :observed[deserializer and registry]

```layout
title: Render state within the Material body
size: variable
note: Absolute body offsets; boolean meanings come from the registry and inspected state methods.
fields:
  - {at: 41, size: 4, type: u32, name: BlendMode, level: observed}
  - {at: 45, size: 4, type: u32, name: AlphaDisplayMode, level: observed}
  - {at: 49, size: 1, type: u8, name: AlphaTestValue, level: observed}
  - {at: 50, size: 35, type: "u8[35]", name: boolean flags, level: observed, note: "one serialized byte per flag, not a packed on-disk bitset"}
```

| Body offset | Flag | Confidence |
|---:|---|---|
| 50, 51 | ZWriteDisabledOpaque, ZWriteDisabledAlpha | :observed |
| 52 | ZTestDisabled | :observed |
| 53 | LayerMaterial | :observed |
| 54–57 | LayerOverrideAlbedo, Roughness, Normal, Metalness | :observed |
| 58 | Name hash `C8E67A40`; meaning unresolved | :unknown |
| 59 | LayerOverrideEmissive | :observed |
| 60, 61 | PreTransparent, FlipNormalOnBackFace | :observed |
| 62, 63 | ShadowCasterOpaque, ShadowCasterAlpha | :observed |
| 64 | Name hash `AE6CBDDC`; meaning unresolved | :unknown |
| 65–67 | RenderInLowResolution, IsAtlasMaterial, IsObjectAtlasMaterial | :observed |
| 68 | Name hash `519195EE`; meaning unresolved | :unknown |
| 69–71 | IsWaterMaterial, IsFakeWaterMaterial, Wireframe | :observed |
| 72, 73 | Name hashes `84AB1602`, `6FD2D0EE`; meanings unresolved | :unknown |
| 74, 75, 76 | AlphaTestEnabled, TwoSided, MaterialDisabled | :observed |
| 77 | `A7CA9CFC`; selects among rasterizer/depth states, full semantic name unresolved | :observed[use] :unknown[name] |
| 78–80 | Name hashes `1CE25055`, `0F0CDE39`, `A3179B76`; meanings unresolved | :unknown |
| 81–83 | ExcludeWaterClipMaterial, IgnoreWaterDepthTest, WaterClipMaterial | :observed |
| 84 | Name hash `42452A12`; meaning unresolved | :unknown |

The engine divides AlphaTestValue by 255 to obtain the alpha reference, enabling it through AlphaTestEnabled in the ordinary opaque/cut-out path. Other pass kinds have different conditions, including AlphaDisplayMode 2 or nonzero blend mode. A nonzero threshold byte alone does not establish that a draw alpha-tests. :observed[state update methods]

TwoSided disables culling; it changes the pixel permutation's back-face logic only with FlipNormalOnBackFace and template support. ZTestDisabled disables depth testing. Depth writes use the opaque-disable flag for blend mode 0 and the alpha-disable flag otherwise. :observed[state and key-composition methods]

The runtime material-class mask groups pass participation. LayerMaterial selects mask 2; ordinary opaque and blended materials add shadow-related mask `0x200` according to their respective shadow flags, while water/fake-water replaces the class mask with `0x80`. The complete semantic mapping of mask bits to every draw pass remains unresolved. :observed[mask update] :unknown[complete pass mapping]

:::open[How do all flag combinations affect draw scheduling?]
Known flag uses do not establish all unnamed flags, all blend modes or every pass interaction. The template's available permutations are not a per-Material record of the state selected on a particular draw. :unknown
:::
