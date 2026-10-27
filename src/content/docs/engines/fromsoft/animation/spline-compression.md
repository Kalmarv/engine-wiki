---
title: Spline-compressed animation
description: Block layout, component masks, quantized splines and evidence for absent components.
sources:
  - title: Smithbox spline decoder
    url: https://github.com/vawser/Smithbox
  - title: HavokLib
    url: https://github.com/PredatorCZ/HavokLib
implementations:
  - name: havok-formats spline reader and sampler
    url: https://github.com/Kalmarv/havok-formats/blob/main/src/spline.rs
---

`hkaSplineCompressedAnimation` stores transform tracks in aligned blocks, with static, absent and spline-valued
components. Block offsets and frame durations come from the Havok object's metadata. :sourced[HavokLib]

Blocks begin on 16-byte boundaries. Each covers `maxFramesPerBlock - 1` frame intervals, sharing its boundary frame
with the next block. `floatBlockOffsets` are relative to the block start. :observed

## What the animation header states

Over the 49,634 spline-compressed animations the two installs' animation binders hold (10,865 of Sekiro, 38,769 of
Elden Ring; the 11 Sekiro tagfiles that name a compendium held in another binder, or are SDK 2015.1, are not among them),
the header fields obey these relations to a relative tolerance of 1e-5, every block read ends exactly at its
`floatBlockOffsets` entry, and padding to 16 reaches the next block or the end of the data except in the case under
"Trailing zero bytes". :proven[over the 51,478 blocks read]{games="sekiro elden-ring"}

| Field | Relation |
|---|---|
| `endian` | 0 |
| `maxFramesPerBlock` | between 1 and 256 |
| `frameDuration` | `duration / (numFrames - 1)` |
| `blockDuration` | `frameDuration * (maxFramesPerBlock - 1)` |
| `blockInverseDuration` | `1 / blockDuration` |
| `numBlocks` | `ceil((numFrames - 1) / (maxFramesPerBlock - 1))` |
| `blockOffsets` | strictly ascending, each a multiple of 16 |
| `maskAndQuantizationSize` | `4 * numberOfTransformTracks`, the size of the mask area (4 bytes a track) the walk finds in every block |
| `transformOffsets`, `floatOffsets` | empty arrays |
| `numberOfFloatTracks` | 0 |

The last three rows hold in all 49,634 animations. `maskAndQuantizationSize` equals `4 * transform tracks + float
tracks` rounded up to a multiple of 4, which is the transform-track formula with no float tracks; the per-track offset
arrays are therefore never populated, and whether their entries would count bytes or words is not observable in
these files. :proven[over the animations read]{games="sekiro elden-ring"} Every animation's `numberOfFloatTracks` and
every binding's float-track list is empty, so no stored clip drives a float slot. :proven[over the animations read]{games="sekiro elden-ring"}

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

| Selector | Scalar quantization | Confidence |
|---|---|---|
| 0 | 8-bit values between the component bounds | :sourced[Smithbox] |
| 1 | 16-bit values between the component bounds | :sourced[Smithbox] |

| Selector | Quaternion encoding | Alignment | Confidence |
|---|---|---|---|
| 0 | Polar32 | 4 bytes | :sourced[Smithbox] |
| 1 | ThreeComp40 | 1 byte | :sourced[Smithbox] |
| 2 | ThreeComp48 | 2 bytes | :sourced[Smithbox] |
| 5 | Uncompressed four-float quaternion | 4 bytes | :sourced[Smithbox] |

The external decoder's format model also names ThreeComp24 and Straight16 as selector values 3 and 4. :sourced[Smithbox]
Over the 5,240,225 transform tracks of the 49,634 animations (1,348,357 in Sekiro, 3,891,868 in Elden Ring), counting the
selector of every track's mask whether its rotation is stored or absent, selector 1 occurs 5,199,442 times (Sekiro
1,317,639; Elden Ring 3,881,803), selector 2 39,263 times (30,718; 8,545), selector 5 1,520 times (Elden Ring only),
and selectors 0, 3 and 4 never. :proven[over the tracks read]{games="sekiro elden-ring"}

Every spline track of every part (position, rotation, scale) has degree 1 or 3: Sekiro 578,820 tracks of degree 1 and
445,248 of degree 3, Elden Ring 1,562,834 and 1,436,343. Degrees 2 and 4 never occur, so the stored degree byte
spans 1 to 3 in these files. :proven[over the tracks read]{games="sekiro elden-ring"}

Selector 0 (Polar32) therefore never appears in the examined clips of either game, and nothing here exercises its
layout or the scale of its angle. :proven[over the tracks read]{games="sekiro elden-ring"}

## Trailing zero bytes after the last block

:only[elden-ring] The data of 4,975 of the game's 38,769 spline animations ends 16 zero bytes after the aligned end of
its final block. The extra bytes occur after the final block only: none of the 1,337 blocks that are followed by
another block has them, including 181 whose end has the same geometry. They are present exactly when the last
transform track's rotation mask selects ThreeComp40 (selector 1) and the end of that track's rotation, taken where the
rotation is stored or would be stored when it is absent, lies less than 3 bytes before the 16-byte-aligned end of the
block. That holds for all 4,975 and for none of the other 33,794 final blocks. :proven[over the animations read]

The rule reads as a guard so that an 8-byte read starting at a 40-bit rotation stays inside the data: a five-byte
quaternion ending within 2 bytes of the aligned end would otherwise let the read run 3 bytes past it. :inferred

:only[sekiro] The same geometry occurs in 1,243 of the 10,865 final blocks, and none is followed by extra bytes; the
2016.2 data ends at the aligned end. :proven[over the animations read]

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

Smithbox's decoder agrees on 609 Elden Ring animations: over 1,979,936 values no component differs in whether it
is present, and the largest differences are 5e-6 in position, 1.5e-7 in rotation and 1.4e-6 in scale.
:observed{games="elden-ring"} The two decoders share one lineage (HavokLib, then Smithbox's copy, then ours), so the
agreement checks the implementation, not the format; and since no track of either game selects Polar32, it cannot have
exercised that selector. :inferred

The all-character Sekiro scan explicitly identifies `c1090/hkx/a000_205000.hkx` as SDK 2015.1, outside the 2016.2
layout, rather than treating it as a malformed 2016.2 clip. :observed{games="sekiro"} Its own type table describes the
2015.1 layouts, whose `hkReferencedObject`-derived classes are 8 bytes smaller than 2016.2's; read with that table it
decodes as an ordinary clip ([Havok tagfiles](/engines/fromsoft/data-model/havok-tagfiles/)). :observed{games="sekiro"}

:::open[What happens outside a clip's stated time range?]
Independent decoders differ on clamping versus extrapolation beyond the final frame. Agreement inside the clip
does not establish engine behavior outside that range, or the complete animation blending system.
:::
