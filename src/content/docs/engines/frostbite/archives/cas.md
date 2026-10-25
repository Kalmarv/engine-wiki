---
title: CAS compression blocks
description: Physical block framing and codec selection inside skate.'s CAS archives.
games: [skate]
sources:
  - title: ReSkate CAS implementation
    url: https://github.com/Dingo-Shenanigans/ReSkate/tree/main/Engine/Resource
implementations:
  - name: primase worlds/frostbite (cas.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/frostbite/src/cas.rs
---

An asset's CAS range is a sequence of eight-byte headers and exactly sized payloads. Concatenating the decoded
blocks reconstructs the asset. Physical range length includes the headers; decoded length does not. :observed

```layout
title: CAS block header
size: 8
fields:
  - {at: 0, size: 1, type: u8, name: dictionary metadata, level: unknown, note: Zero in the supported samples.}
  - {at: 1, size: 3, type: u24be, name: decoded length, level: observed}
  - {at: 4, size: 1, type: u8, name: codec and reserved bit, level: observed, note: Low seven bits select the codec; high bit is reserved.}
  - {at: 5, size: 1, type: u8, name: flags and payload length high bits, level: observed, note: Low nibble is length bits 16–19; upper nibble is flags.}
  - {at: 6, size: 2, type: u16be, name: payload length low bits, level: observed}
```

| Codec | Payload | Confidence |
|---|---|---|
| `0` | Stored bytes, equal in length to the decoded block | :sourced[ReSkate] |
| `2` | zlib | :sourced[ReSkate] |
| `0x11`, `0x15`, `0x19` | Oodle-compressed bytes | :sourced[ReSkate] |

Studio output uses Oodle CAS blocks. A block's codec is independent of its asset's resource type. :observed

:::open[Which dictionary and flag variants occur in stock data?]
The dictionary byte's nonzero forms and the upper flags nibble have no established interpretation here.
The measured framing does not establish support for every Frostbite CAS codec. :unknown
:::
