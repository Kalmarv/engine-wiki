---
title: Clip dictionaries and animation channels
description: YCD version 46 containers, nine channel types, bone tracks, sequence blocks and frame timing.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: ClipDictionary, Animation, Sequence and AnimChannel reference descriptions.
implementations:
  - name: primase worlds/gta (ycd.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/rage/ycd.rs
  - name: primase worlds/gta (ycd_channels.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/rage/ycd_channels.rs
---

YCD files are RSC7 version 46 clip dictionaries. They contain animations keyed by hash and named clips that play
one animation or a list of animation windows with playback rates. Animation and clip maps use hash buckets with
chained collision entries. :observed

The full-install comparison covers 25,961 unique archive-entry paths and 267,536 animations. Counts are over
dictionaries, including separate archived copies, rather than distinct animation hashes or raw dump rows.
:observed[unique-path recount]

Every animation in that corpus decodes with strict sequence boundaries: parameter bytes end at frame data, channel
lists end at root-motion references, and those references end at the sequence's data length. Independent CodeWalker
comparison checks channel streams bit for bit; reconstructed cached-quaternion vectors use a separate tolerance
comparison where full vector dumps are available. :proven[all dictionaries in the corpus]

## Animation and sequence records

```layout
title: Animation
size: 96
fields:
  - {at: 0, size: 16, type: bytes, name: resource base, level: sourced}
  - {at: 16, size: 2, type: bytes, name: unknown flags, level: unknown}
  - {at: 18, size: 2, type: bytes, name: unknown, level: unknown}
  - {at: 20, size: 2, type: u16, name: frame count, level: observed}
  - {at: 22, size: 2, type: u16, name: sequence frame limit, level: observed}
  - {at: 24, size: 4, type: f32, name: duration, level: observed}
  - {at: 28, size: 4, type: u32, name: unknown, level: unknown}
  - {at: 32, size: 24, type: bytes, name: unknown, level: unknown}
  - {at: 56, size: 4, type: u32, name: maximum sequence block, level: sourced}
  - {at: 60, size: 4, type: u32, name: usage count, level: sourced}
  - {at: 64, size: 8, type: pointer, name: sequence pointer array, level: observed}
  - {at: 72, size: 2, type: u16, name: sequence count, level: observed}
  - {at: 74, size: 2, type: u16, name: sequence capacity, level: observed}
  - {at: 76, size: 4, type: bytes, name: unknown, level: unknown}
  - {at: 80, size: 8, type: pointer, name: bone-track IDs, level: observed}
  - {at: 88, size: 2, type: u16, name: bone-track count, level: observed}
  - {at: 90, size: 2, type: u16, name: bone-track capacity, level: observed}
  - {at: 92, size: 4, type: bytes, name: unknown, level: unknown}
```

```layout
title: Sequence header
size: 32
note: DataLength bytes follow the header.
fields:
  - {at: 0, size: 4, type: u32, name: sequence ID, level: sourced}
  - {at: 4, size: 4, type: u32, name: data length, level: proven}
  - {at: 8, size: 4, type: u32, name: unknown zero word, level: unknown, note: "zero in decoded corpus"}
  - {at: 12, size: 4, type: u32, name: frame-data offset, level: proven, note: "relative to data start"}
  - {at: 16, size: 4, type: u32, name: root-motion-reference offset, level: proven, note: "relative to header start; subtract 32 for data-relative offset"}
  - {at: 20, size: 2, type: u16, name: unknown zero word, level: unknown, note: "zero in decoded corpus"}
  - {at: 22, size: 2, type: u16, name: sequence frame count, level: proven}
  - {at: 24, size: 2, type: u16, name: bytes per frame, level: proven}
  - {at: 26, size: 2, type: u16, name: indirect-quantize integer count, level: sourced}
  - {at: 28, size: 2, type: u16, name: quantize value bits, level: sourced}
  - {at: 30, size: 1, type: u8, name: linear-channel chunk size, level: proven}
  - {at: 31, size: 1, type: u8, name: root-motion-reference counts, level: proven, note: "high nibble position; low nibble rotation"}
```

```layout
title: Animation bone-track ID
size: 4
fields:
  - {at: 0, size: 2, type: u16, name: bone tag, level: observed}
  - {at: 2, size: 1, type: u8, name: unknown, level: unknown}
  - {at: 3, size: 1, type: u8, name: track number, level: observed}
```

## Channels

Sequence data orders channel parameters first, then fixed-size frame records, then nine channel-list counts and
their lists, then six-byte root-motion references. Frame bits are read least-significant bit first. Each list word
is `trackIndex << 2 | componentIndex`; each type's word list pads to a multiple of four words. :proven[strict corpus decode]

| Type | Meaning | Parameters / frame data | Confidence |
|---|---|---|---|
| 0 | Static quaternion | Three floats; reconstruct remaining unit component | :proven |
| 1 | Static vector | Three floats | :proven |
| 2 | Static float | One float | :proven |
| 3 | Raw float | 32 frame bits | :proven |
| 4 | Quantized float | Bit width, quantum, offset; `integer*quantum + offset` | :proven |
| 5 | Indirect quantized float | Frame index into a stored quantized-value table | :proven |
| 6 | Linear chunks | Start values and second-order deltas; no per-frame-record bits | :proven |
| 7 | Cached quaternion 1 | Reconstruct omitted component from three channels | :proven |
| 8 | Cached quaternion 2 | Second cached-quaternion form | :proven |

A linear channel stores chunk offsets, start values and signed deltas. The packed count bytes specify the widths
for offsets, starts and low delta bits. The high delta part counts zero bits before a one; a nonzero delta has a
sign bit. A running increment accumulates the deltas and advances the reconstructed value. :proven[strict corpus decode]

Cached quaternion reconstruction supplies the missing unit component from the first three channels, puts it in
the component position named by the channel word, then normalizes the resulting track quaternion. :observed

## Tracks and time

| Track number | Interpretation | Confidence |
|---|---|---|
| 0 | Bone local translation | :sourced[CodeWalker] |
| 1 | Bone local rotation | :sourced[CodeWalker] |
| 2 | Bone local scale | :sourced[CodeWalker] |
| 5 / 6 | Mover translation / rotation | :sourced[CodeWalker] |
| Others, including 22, 24–26 and 134 | Numeric tracks with unresolved meanings | :unknown |

Sequence blocks span `sequenceFrameLimit + 1` frames and overlap by one frame. The documented frame-time
interpretation is `i * duration / (frameCount - 1)`, placing the final frame at duration rather than one frame
interval before it. :observed

Sampled stored rotation tracks fit skeleton rest rotations more closely as stored than inverted. Ordinary map
entity quaternion inversion therefore does not establish a rule to invert animation rotations. :observed

:::open[How do tags, properties and unnamed tracks affect playback?]
Clip tags and properties exist alongside the decoded playback windows. Their full semantics, unnamed track roles
and the animation's intrinsic looping policy remain unresolved. :unknown
:::
