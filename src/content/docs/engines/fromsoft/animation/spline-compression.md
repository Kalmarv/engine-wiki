---
title: Spline-compressed animation
description: Block layout, component masks, quantized splines and evidence for absent components.
sources:
  - title: Smithbox spline decoder
    url: https://github.com/vawser/Smithbox
  - title: HavokLib
    url: https://github.com/PredatorCZ/HavokLib
implementations:
  - name: primase spline reader and sampler
    url: https://github.com/Kalmarv/primase/blob/main/toolkit/havok/src/spline.rs
---

`hkaSplineCompressedAnimation` stores transform tracks in aligned blocks, with static, absent and spline-valued
components. Block offsets and frame durations come from the Havok object's metadata. :sourced[HavokLib]

Blocks begin on 16-byte boundaries. Each covers `maxFramesPerBlock - 1` frame intervals, sharing its boundary frame
with the next block. `floatBlockOffsets` are relative to the block start. :observed

## Track masks

All track masks precede track data. Each track then stores position, rotation and scale data, with padding to four
bytes after each; the block ends on 16-byte alignment. :sourced[Smithbox]

```layout
title: Transform track mask
size: 4
fields:
  - {at: 0, size: 1, type: u8, name: quantization selectors, level: sourced, note: Bits 0–1 position; 2–5 rotation; 6–7 scale}
  - {at: 1, size: 1, type: u8, name: position component flags, level: sourced, note: Low nibble static; high nibble spline}
  - {at: 2, size: 1, type: u8, name: rotation component flags, level: sourced, note: Low nibble static; high nibble spline}
  - {at: 3, size: 1, type: u8, name: scale component flags, level: sourced, note: Low nibble static; high nibble spline}
```

A vector spline stores a control-point count and degree, byte knot values, component bounds and static values, then
quantized control points in XYZ component order. Static-only vectors store floats. Rotation tracks store aligned
quantized quaternions, with knots and degree when spline-valued. :sourced[Smithbox]

:::open[What do the optional 16 trailing zero bytes encode?]
Some examined 2018.1 blocks have a further 16 zero bytes before the next block when float data starts on a 16-byte
boundary. Their presence is observed; a semantic role beyond alignment is not established.
:::

## Absent components

An absent component has neither static nor spline flags. The neutral interpretation is zero translation, identity
rotation and unit scale, rather than the bone's reference transform. :inferred

For Sekiro's player idle, read-only live-memory comparisons distinguish these possibilities on 12 bones. All 12
are closer to neutral decoding, with residuals about `1e-6..1e-5`, versus `5e-5..3e-4` for reference-pose fallback.
Other bones retain unexplained runtime pose changes. :observed{games="sekiro"}

Across the decoded Elden Ring sample, absent components also occur frequently on bones with non-neutral reference
values, supporting the same fallback without a direct runtime pose comparison. :inferred{games="elden-ring"}

## Independent decoder scope

Sampled spline values agree with a second decoder derived from HavokLib, including fractional frames. This checks
implementation agreement; shared format assumptions remain shared assumptions. :observed

The all-character Sekiro scan explicitly identifies `c1090/hkx/a000_205000.hkx` as SDK 2015.1, outside the 2016.2
layout, rather than treating it as a malformed 2016.2 clip. :observed{games="sekiro"}

:::open[What happens outside a clip's stated time range?]
Independent decoders differ on clamping versus extrapolation beyond the final frame. Agreement inside the clip
does not establish engine behavior outside that range, or the complete animation blending system.
:::
