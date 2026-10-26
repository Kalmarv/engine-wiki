---
title: Material render state
description: Blend modes, stored boolean flags, alpha reference, culling and draw-class masks.
games: [riders-republic, "shaun-white-skateboarding"]
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

The rest of the 102-byte prelude (body offsets 21 to 122) is mostly constant. Bytes 21–40 are eight zero bytes, u32 `0xDF5D6C0E` (the CRC-32 of `Mask`) and eight zero bytes; bytes 85–106 are `03`, seventeen zero bytes and u32 `0x92B95F74`, the hash AnvilToolkit registers for the class `Mask16`. Bytes 85–94 have the shape of a null ten-byte reference. Bytes 107, 108, 110, 117 and 120 take only 0 or 1; the remaining bytes after 106 are zero. Of the 445 distinct preludes, none departs from these constants. What the constant run and the Mask16 hash stand for is not established. :proven[all 13,579 Material preludes] :unknown[meaning]

The engine divides AlphaTestValue by 255 to obtain the alpha reference, enabling it through AlphaTestEnabled in the ordinary opaque/cut-out path. Other pass kinds have different conditions, including AlphaDisplayMode 2 or nonzero blend mode. A nonzero threshold byte alone does not establish that a draw alpha-tests. :observed[state update methods]

TwoSided disables culling; it changes the pixel permutation's back-face logic only with FlipNormalOnBackFace and template support. ZTestDisabled disables depth testing. Depth writes use the opaque-disable flag for blend mode 0 and the alpha-disable flag otherwise. :observed[state and key-composition methods]

The runtime material-class mask groups pass participation. LayerMaterial selects mask 2; ordinary opaque and blended materials add shadow-related mask `0x200` according to their respective shadow flags, while water/fake-water replaces the class mask with `0x80`. The complete semantic mapping of mask bits to every draw pass remains unresolved. :observed[mask update] :unknown[complete pass mapping]

:::open[How do all flag combinations affect draw scheduling?]
Known flag uses do not establish all unnamed flags, all blend modes or every pass interaction. The template's available permutations are not a per-Material record of the state selected on a particular draw. :unknown
:::

## Render state in Shaun White Skateboarding

:only[shaun-white-skateboarding]

A material's render state is spread over a few stored fields of the `SKGenericMaterial` body: the blend mode word at 21, the blended and alpha-test switches and the alpha reference after it, and the two culling bools at 36 and 37. The shader bundle's passes read the culling bools through a runtime variable; they set no depth-bias state. :observed{games="shaun-white-skateboarding"}

The blend enum's names, as the game's descriptor lists them in reverse order, are Copy 0, Additive 1, Substractive 2, Modulate 3, Alpha 4, Dodge 5 and AdditiveAlpha 6. A blended material draws with the source-alpha and inverse-source-alpha factors and no depth write. :observed

### Culling

| Stored bools | Culling the draw sets | Confidence |
|---|---|---|
| `TwoSided` set | none (`D3DCULL_NONE`) | :observed{games="shaun-white-skateboarding"}[the engine's code, read; flags of all 1,971 materials] |
| `TwoSided` clear, `InvertCulling` clear | clockwise (`D3DCULL_CW`) | :observed{games="shaun-white-skateboarding"}[the engine's code, read] |
| `TwoSided` clear, `InvertCulling` set | counter-clockwise (`D3DCULL_CCW`) | :observed{games="shaun-white-skateboarding"}[the engine's code, read] |

The material's virtual method at slot 5 (`0xCE2BE0` in the recorded build) reads one word of the base-class bools: bit 20 (`TwoSided`) selects no culling, otherwise the cull mode is clockwise or, with bit 21 (`InvertCulling`), counter-clockwise. The material constructor binds the shader bundle's runtime variable `g_Cullmode` to a slot that holds the Direct3D render state number 22 and this value, and the pass applier writes it through the device's cached `SetRenderState`. Property hashes are plain CRC-32 of the property name: `TwoSided` is `0x403525B2`, `InvertCulling` `0x4F892276`, and the neighbouring bools `InvertAlpha` `0x2E59D963` and `Unlit` `0x4FB26019`. :observed[the engine's code, read]

A second variable, `g_ShadowCullmode`, is declared in the shader source and set from the other value the method computes, but no compiled record binds it. The shadow-map and depth-only passes of the generic effect use `g_Cullmode`, like the colour pass. A one-sided material is therefore culled the same way when it casts a shadow. :observed

Of 6,399 effect and state records in the high-quality bundle, 6,217 bind `g_Cullmode` to the material. Thirty-seven set render state 22 to a literal (31 no culling, 6 clockwise) and so ignore the material. The frame jobs fix their own culling (clockwise for opaque, blended, shadow and depth passes, none for sky and sprites), and a material pass applies its value after the frame job's. :observed

| Level | Distinct materials | `TwoSided` | `InvertCulling` |
|---|---:|---:|---:|
| 01 | 1,012 | 76 | 2 |
| 02 | 1,014 | 72 | 2 |
| 03 | 721 | 49 | 2 |
| 04 | 852 | 61 | 2 |
| 05 | 270 | 40 | 0 |
| 06 | 371 | 46 | 0 |
| All six | 1,971 | 153 | 2 |

The table counts distinct material ids with a 647-byte body; no id has different flags in two cells. `InvertCulling` is set on only the two `GEN_GFX_Bonus` materials, and both are also `TwoSided`, so no material needs its winding reversed. The `TwoSided` set holds fences and wire, foliage cards, glass, cloth, light paint and beams, and two materials with `DOUBLESIDED` in their names; a name match alone is not the evidence: one `DOUBLESIDED` wall material and its single-sided sibling have bodies identical except for byte 36 and the texture ids. :proven{games="shaun-white-skateboarding"}[all 1,971 distinct materials of the six levels]

:::open[Does any code outside the shader passes read the shadow cull value?]
That no code outside the shader bundle's passes reads the second computed cull value (`g_ShadowCullmode`'s slot) is not shown; a breakpoint on the device's cull render state during a shadow pass would settle it. :unknown
:::
