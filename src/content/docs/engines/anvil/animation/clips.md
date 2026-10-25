---
title: "Animation clips and tracks"
description: "Animation body order, bone mappings, key timing and packed values."
games: ["riders-republic"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "primase worlds/anvil (animation.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/animation.rs
---

Animation (`0x0FA3067F`) stores clip metadata, bone-name mappings and keyframe tracks. The complete track enumeration across DataPC, DataPC patch, USNAT, USNAT patch and base WhiteRoom contains 9,087 clips, 1,396,592 tracks and 25,241,022 keys; every clip's track framing consumes exactly to its body end. Event payloads remain opaque and use a following-object anchor, so this is complete track framing rather than complete event decoding. :proven[track framing]

All 9,087 checked clips use the [extended resource header](/engines/anvil/data-model/resources/). There are 1,923 clips with events, 4,053 with TTECLAnimation objects and 390 with a nonzero boolean flag in that enumeration. :proven[complete enumeration]

## Body order

```layout
title: "Animation fixed prefix"
size: "variable"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "ManagedObject byte", "level": "unknown", "note": "01."}
  - {"at": 1, "size": 4, "type": "f32", "name": "Length", "level": "observed"}
  - {"at": 5, "size": 4, "type": "u32", "name": "F4F597FF", "level": "unknown", "note": "Varies by clip."}
  - {"at": 9, "size": 4, "type": "u32", "name": "322B96B8", "level": "unknown", "note": "Zero throughout the clip census."}
  - {"at": 13, "size": 4, "type": "u32", "name": "556E9166 array count A", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": 17, "size": "2A", "type": "u16[]", "name": "556E9166", "level": "unknown", "note": "Empty throughout the census."}
  - {"at": "17+2A", "size": 4, "type": "u32", "name": "251905D9 array count B", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": "21+2A", "size": "2B", "type": "u16[]", "name": "251905D9", "level": "unknown", "note": "Empty throughout the census."}
  - {"at": "21+2A+2B", "size": 4, "type": "u8[4]", "name": "four bool fields", "level": "unknown", "note": "Hashes 1F4DA15F, 93847F6A, ABC2D4B8, 0D7D1D50; fourth set on 390 streamed clips."}
  - {"at": "25+2A+2B", "size": 4, "type": "u32", "name": "event count", "level": "observed"}
  - {"at": "29+2A+2B", "size": "variable", "type": "objects", "name": "AnimTrackEvents", "level": "unknown", "note": "Type 0x41682213; nested audio events not fully decoded."}
```

After the events comes AnimTrackData: `00 + u64 id + type 0x0181EFE8`, a u32 hash field, a mapping count, mapping objects, and a u16. Each mapping is `u64 id + type 0x653CAA76 + u32 bone-name CRC-32`; zero names root-motion tracks. Mappings and tracks correspond one-to-one in order. :observed

Next is ECLAnimation: `03` null, or `00 + u64 + type 0xAC692A57` followed by byte, u32, u16 and byte arrays, each counted. Then come buffer `B832D26F` (`u32 byte length + bytes`), u32 `CB4E5F18`, track count and track blocks. This order is checked on all 9,087 clips and differs from registry field order. :proven[body framing]

## Track blocks

```layout
title: "Animation track block"
size: "9 + times + values"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "tag", "level": "observed", "note": "3 × kind + time form."}
  - {"at": 1, "size": 4, "type": "u32", "name": "size word", "level": "unknown", "note": "Within eight bytes of stored payload length in checked clips; not a payload byte count."}
  - {"at": 5, "size": 4, "type": "u32", "name": "key count K", "level": "observed"}
  - {"at": 9, "size": "T", "type": "bytes", "name": "time data", "level": "observed", "note": "Selected by tag modulo 3."}
  - {"at": "9+T", "size": "K × value width", "type": "bytes", "name": "values", "level": "observed"}
```

| Time form | Serialized times | Unit / evidence | Confidence |
|---|---|---|---|
| 0 | K−1 u8 values; first time implicit zero | 1/60 s, endpoints compared with Length | :observed |
| 1 | K−1 u16 values; first time implicit zero | 1/60 s, endpoints compared with Length | :observed |
| 2 | Marker then 1–8 mask bytes; popcount equals K | Set-bit frame at 1/30 s; 3,683 sampled tracks | :observed |

For mask form, low six marker bits count bytes; high bits are `0x40`, `0x80` or `0xC0`. Their complete semantic distinction is unknown. All interpreted track times rise and remain within Length plus 1/30 s in the whole-corpus value check. :observed

| Kind | Bytes / value | Meaning or decode | Confidence |
|---:|---:|---|---|
| 3 | 4 | Smallest-three quaternion, three 10-bit components | :observed |
| 4 | 6 | Smallest-three quaternion, three 15-bit components | :observed |
| 5 | 8 | Smallest-three quaternion, three 20-bit components on a bit ring | :observed |
| 7 | 2 | Rotation about z from low 15 bits | :observed |
| 8 | 12 | Quaternion xyz as f32, positive reconstructed w | :observed |
| 9 | 12 | Translation xyz as f32 | :observed |
| 16, 18 | 1 | Scalar bytes, complete semantics unresolved | :unknown |
| 17 | 2 | Scalar word, complete semantics unresolved | :unknown |
| 21, 22 | 4 | Values associated with non-bone hashes | :unknown |
| 25 | 8 | Eight observed tracks; packing unresolved | :unknown |

Packed component decode is `(v / maximum × 2 − 1) / sqrt(2)`, with maxima 1023, 32767 or 1048575. The omitted quaternion component is the nonnegative square root making unit length. First-key matches against mapped Skeleton local rotations distinguish these packings from alternatives; this is data evidence rather than execution of the track decoder. :observed

For kind 3, bits 30–31 select the omitted component; bits 20–29, 10–19 and 0–9 give retained components in component order. Kind 4 uses low 15 bits of each u16; high bits of words zero and one form the omitted index, and word two's high bit is the sign, zero in the checked 84,886-key sample. :observed

For kind 5, retained components are bits 8–27, bits 52–63 followed by bits 0–7, and bits 32–51. The ring component is `(low8 << 12) | high12`. Bits 30–31 select the omitted component; bits 28–29 are zero on the checked keys. All 53,647 keys of 600 sampled tracks fit the component-square bound. :observed

## Entity use

AnimComponent (`0x8C8AA19D`) contains four base bytes, u32 count and ten-byte Animation references, then a tail. In the checked five-archive Entity enumeration, 70 Entities carry it and 19 list Animations. Rider clip selection therefore is not established by scanning these references alone. :observed

:::open[How does the engine interpolate and select tracks?]
Linear, Nearest, Cardinal, Natural and HermiteVel classes exist in the registry, but exact used-kind interpolation is not established. Event elements, high mask bits, kind-seven's top bit and kinds 16–25 still have unresolved semantics. The rider's Kino graph is not decoded here. :unknown
:::

The complete six-archive index has 9,111 stored Animation entries. WhiteRoom patch contributes 24 entries outside the five-archive exact-end check above. :observed
