---
title: "Animation clips and tracks"
description: "Animation body order, bone mappings, key timing and packed values."
games: ["riders-republic", "shaun-white-skateboarding"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "anvil-formats (animation.rs)"
    url: https://github.com/Kalmarv/anvil-formats/blob/main/src/animation.rs
  - name: "anvil-formats (shaunwhite/animation.rs)"
    url: https://github.com/Kalmarv/anvil-formats/blob/main/src/shaunwhite/animation.rs
---

Animation (`0x0FA3067F`) stores clip metadata, bone-name mappings and keyframe tracks. The complete track enumeration across DataPC, DataPC patch, USNAT, USNAT patch and base WhiteRoom contains 9,087 clips, 1,396,592 tracks and 25,241,022 keys; every clip's track framing consumes exactly to its body end. Event payloads remain opaque and use a following-object anchor, so this is complete track framing rather than complete event decoding. :observed[five archives]

All 9,087 checked clips use the [extended resource header](/engines/anvil/data-model/resources/). There are 1,923 clips with events, 4,053 with TTECLAnimation objects and 390 with a nonzero boolean flag in that enumeration. :observed[five archives]

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

Next is ECLAnimation: `03` null, or `00 + u64 + type 0xAC692A57` followed by byte, u32, u16 and byte arrays, each counted. Then come buffer `B832D26F` (`u32 byte length + bytes`), u32 `CB4E5F18`, track count and track blocks. This order is checked on all 9,087 clips and differs from registry field order. :observed[five archives]

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

For kind 3, bits 30–31 select the omitted component; bits 20–29, 10–19 and 0–9 give retained components in component order. Kind 4 uses low 15 bits of each u16; high bits of words zero and one form the omitted index, and word two's high bit is the sign, zero in the checked 84,886-key sample. :observed Which of the two high bits is the index's high bit is not established for Riders Republic: the checked first-key matches and fixtures leave out w (index 3, both bits set), which either order reads the same, and Shaun White Skateboarding stores the two bits with word zero's as the low bit. :unknown

:::open[Which order do Riders Republic's kind 4 index bits use?]
The smoothness of consecutive keys across a change of index, which settles the order for Shaun White Skateboarding, is not yet measured on Riders Republic's kind 4 tracks. :unknown
:::

For kind 5, retained components are bits 8–27, bits 52–63 followed by bits 0–7, and bits 32–51. The ring component is `(low8 << 12) | high12`. Bits 30–31 select the omitted component; bits 28–29 are zero on the checked keys. All 53,647 keys of 600 sampled tracks fit the component-square bound. :observed

## Entity use

AnimComponent (`0x8C8AA19D`) contains four base bytes, u32 count and ten-byte Animation references, then a tail. In the checked five-archive Entity enumeration, 70 Entities carry it and 19 list Animations. Rider clip selection therefore is not established by scanning these references alone. :observed

:::open[How does the engine interpolate and select tracks?]
Linear, Nearest, Cardinal, Natural and HermiteVel classes exist in the registry, but exact used-kind interpolation is not established. Event elements, high mask bits, kind-seven's top bit and kinds 16–25 still have unresolved semantics. The rider's Kino graph is not decoded here. :unknown
:::

The complete six-archive index has 9,111 stored Animation entries. WhiteRoom patch contributes 24 entries outside the five-archive exact-end check above. All six archive tables are counted, with no index-reader refusals. :proven[inventory count]

## Shaun White Skateboarding

:only[shaun-white-skateboarding]

Shaun White Skateboarding keeps the order of the Riders Republic body (length, a clip word, the event array, AnimTrackData with its bone mappings, then one track block per mapping) with 32-bit ids, no ECLAnimation, buffer or `CB4E5F18` fields, and its own track tags and kinds. Every Animation of the 33 data forges reads with the layouts below to the object's exact end: 80,466 objects holding 2,708 distinct clips and 6,593,436 tracks, with no refusals. :proven{games="shaun-white-skateboarding"}[every Animation of the install; framing, sizes and track values]

Animation is a block-allocator object ([object header](/engines/anvil/data-model/resources/)): its header byte is 1, and its bytes run past the declared body by exactly `7 + 12k`, the table that opens them. :proven{games="shaun-white-skateboarding"}[all 80,466 Animation objects]

```layout
title: "Animation object (from the byte after the header byte)"
size: "variable"
games: [shaun-white-skateboarding]
note: "Little-endian. k is the table's row count, E the events' length, n the mapping count. All 80,466 Animation objects of the install."
fields:
  - {"at": 0, "size": 3, "type": "u8[3]", "name": "table bytes", "value": "02 00 00", "level": "proven"}
  - {"at": 3, "size": 4, "type": "u32", "name": "row count k", "level": "proven"}
  - {"at": 7, "size": "12k", "type": "rows", "name": "table", "level": "unknown", "note": "per row: a class id (0, or an event class such as AnimTrackEvent, EventSeed, AudioEvent, AudioEventSeed), u16 0, u16, u32; the AnimTrackEvent rows' u32 is the event count where checked"}
  - {"at": "7+12k", "size": 1, "type": "u8", "name": "managed", "value": "1", "level": "proven"}
  - {"at": "8+12k", "size": 4, "type": "u32", "name": "id", "level": "proven", "note": "the directory's id"}
  - {"at": "12+12k", "size": 4, "type": "u32", "name": "class", "value": "0x0FA3067F", "level": "proven"}
  - {"at": "16+12k", "size": 4, "type": "f32", "name": "length", "level": "proven", "note": "seconds; every track's last key lies on length × 60 but for 25 of 6,593,436"}
  - {"at": "20+12k", "size": 4, "type": "u32", "name": "layout word", "level": "observed", "note": "repeated by AnimTrackData; clips sharing it share their mapping list for 274 of 275 values"}
  - {"at": "24+12k", "size": 4, "type": "u32", "name": "unknown", "level": "unknown", "note": "0 on the clips the game loads up to the second level"}
  - {"at": "28+12k", "size": 2, "type": "u16", "name": "unknown", "level": "unknown", "note": "0 on the clips the game loads up to the second level"}
  - {"at": "30+12k", "size": 4, "type": "u32", "name": "unknown", "level": "unknown", "note": "the clip's id plus 3 on 13,823 of the 14,363 Animation objects the game loads up to the second level"}
  - {"at": "34+12k", "size": 4, "type": "u32", "name": "event count", "level": "proven"}
  - {"at": "38+12k", "size": "E", "type": "objects", "name": "AnimTrackEvents", "level": "unknown", "note": "not decoded; AnimTrackData is the first place after them that reads as it, which is unique on every clip"}
  - {"at": "38+12k+E", "size": 4, "type": "u32", "name": "unknown", "level": "unknown", "note": "0 on the clips the game loads up to the second level"}
  - {"at": "42+12k+E", "size": 1, "type": "u8", "name": "AnimTrackData tag", "value": "0", "level": "proven"}
  - {"at": "43+12k+E", "size": 4, "type": "u32", "name": "AnimTrackData id", "level": "observed", "note": "0 on the clips the game loads up to the second level"}
  - {"at": "47+12k+E", "size": 4, "type": "u32", "name": "class", "value": "0x0181EFE8", "level": "proven", "note": "AnimTrackData"}
  - {"at": "51+12k+E", "size": 4, "type": "u32", "name": "layout word", "level": "observed", "note": "equals the one above on 80,367 of 80,466 objects"}
  - {"at": "55+12k+E", "size": 4, "type": "u32", "name": "mapping count n", "level": "proven"}
  - {"at": "59+12k+E", "size": "12n", "type": "mappings", "name": "mappings", "level": "proven", "note": "per mapping: id (0), class 0x653CAA76, CRC-32 of the bone name (0: the root's motion)"}
  - {"at": "59+12k+E+12n", "size": 2, "type": "u16", "name": "unknown", "level": "unknown", "note": "0 on the clips the game loads up to the second level"}
  - {"at": "61+12k+E+12n", "size": 4, "type": "u32", "name": "track count", "level": "proven", "note": "equals n"}
  - {"at": "65+12k+E+12n", "size": "variable", "type": "blocks", "name": "tracks", "level": "proven", "note": "one per mapping, in order; they end the object"}
```

Mappings are sorted by their bone CRC, and a bone with two tracks has its translation track first and its rotation track second. :observed{games="shaun-white-skateboarding"}[the 14,363 Animation objects the game loads up to the second level]

```layout
title: "Track block"
size: "9 + T + K × width"
games: [shaun-white-skateboarding]
note: "Little-endian. All 6,593,436 tracks of the install."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "tag", "level": "proven", "note": "kind << 2; bit 0: u16 times; bit 1: unknown flag that adds 2 bytes in memory"}
  - {"at": 1, "size": 4, "type": "u32", "name": "in-memory size", "level": "proven", "note": "2 + T, plus 2 with bit 1, rounded up to the kind's alignment, plus K × width"}
  - {"at": 5, "size": 4, "type": "u32", "name": "key count K", "level": "proven", "note": "at least 1"}
  - {"at": 9, "size": "T", "type": "u8[] or u16[]", "name": "key times", "level": "proven", "note": "K − 1 times in 1/60 s, the first key at 0; strictly rising on every track"}
  - {"at": "9+T", "size": "K × width", "type": "bytes", "name": "values", "level": "proven"}
```

Shaun White Skateboarding has no mask time form: bit 1 of the tag does not change the stored times. The in-memory size rule, with the widths and alignments of the table below, holds for every track block of the install, so a block whose size field disagrees is not a valid track. :proven{games="shaun-white-skateboarding"}[every track of the install]

| Kind (tag >> 2) | Width / alignment | Value | Confidence |
|---:|---|---|---|
| 4 | 6 / 2 | Rotation: smallest-three with 15-bit components in component order, as Riders Republic's kind 4, but the omitted index's low bit is bit 15 of the first word and its high bit bit 15 of the second (0 x, 1 y, 2 z, 3 w); bit 15 of the third word is 0 on every key | :observed{games="shaun-white-skateboarding"} |
| 5 | 8 / 4 | Rotation: smallest-three with 20-bit components on a bit ring, the Riders Republic kind 5 layout; bits 28 and 29 are 0 on every key | :observed{games="shaun-white-skateboarding"} |
| 6 | 12 / 4 | Rotation: x, y and z as f32, w the positive root | :observed{games="shaun-white-skateboarding"} |
| 7 | 12 / 4 | Three f32 on a few bones, not a unit quaternion's xyz | :unknown |
| 8 | 4 / 4 | Translation: x bits 21–31, y bits 10–20, z bits 0–9, two's complement, 1 mm units | :observed{games="shaun-white-skateboarding"} |
| 9 | 6 / 2 | Translation: three i16, 1 mm units | :observed{games="shaun-white-skateboarding"} |
| 10 | 4 / 4 | One f32 on tracks whose mapping is not a bone name | :unknown |
| 11, 17 | 1 / 1 | One byte on tracks whose mapping is not a bone name | :unknown |

The widths are fixed by the block grammar, which reads every track to the object's end. The decodes are told apart by the data: on the 14,363 Animation objects the game loads up to the second level, consecutive keys of the three rotation kinds have a median smallest |dot| of 0.9986 (kind 4), 0.9986 (kind 5) and 0.9979 (kind 6), where the other 64-bit layouts tried give 0.14; every key decodes to a unit quaternion. For kind 8 the median largest step between consecutive keys is 16 units with the 11/11/10 split and over 1,000 with the 10/11/11 and 11/10/11 splits. Kind 4's index bit order is told by the keys around a change of index. Over the 24,274 consecutive key pairs of the 2,708 distinct clips whose index changes, each of the twelve kinds of change keeps 96% to 99% of its pairs within |dot| > 0.9 of each other with word zero's bit as the low bit, as keys of one index do (99.6% to 100%). With the bits read the other way round, the eight changes between index 0 or 3 and index 1 or 2 keep 1% to 24%. Keys that leave out y or z are 11% of kind 4 first keys. Over the install, 275,189 of 5,046,170 rotation first keys lie within 1e-5 of a bind rotation of a bone of that name, and 96,881 of 614,189 translation first keys within 1 mm of a bind position; the 1 mm unit fits kind 9's i16 values against bind positions with a median ratio of 999 to 1,000 per metre. :observed{games="shaun-white-skateboarding"}

The renderer's bone matrices confirm the kind 5, 6, 8 and 9 decodes. A traced frame's local bone transforms come from its bone constants and MeshBone matrices as on the [skeleton page](/engines/anvil/animation/skeletons/), and a stored clip is sampled at a time between keys (linear, rotations normalized):

- a skinned train in four consecutive frames: one clip, at 4, 5, 9 and 13 ticks, gives the seven parent-child bones' rotations (kind 6) to within 1 − |dot| = 3e-8 and their four translations (kind 9) to within 0.04 mm; in the two frames before, the bones are at their bind pose;
- a walking worker's legs and torso in ten frames 20 presents apart: one clip, at times rising by about 13.8 ticks a step, gives every rotation (kind 5) to within 1 − |dot| = 1.3e-7 and every translation (kind 8) to within 0.013 mm.

A second walking character and the heads match no single stored clip at any time (the best leave 1 − |dot| of 0.09 to 0.17, or 1e-4 on one head bone), so they are blended or driven otherwise: no stored clip, of any kind and at any time, gives even one of their bones within 1 − |dot| = 1e-6 (a bone the clip has no track for taken at its bind rotation), and their child bones lie up to 2.4 m from their stored positions with no clip translating them. Kind 4, which their nearest clips use, is therefore not checked against the renderer under either index bit order. :observed{games="shaun-white-skateboarding"}[the bone constants of 290 skinned draws of 16 meshes in 16 traced frames of two runs]

### AnimSet

An AnimSet (`0x31984F55`) is a managed object: the managed byte 1, its id, its class, a u32 (0), a u32 count of AnimPairs and a final byte (0, or 1 on a few sets). An AnimPair is its id, the class `0x9DE9A987` and two u32 Animation ids. Every one of the 7,471 AnimSet objects of the install reads so to its exact end, and both ids of all 101,996 pairs are Animation ids of the install. Which clip of a pair the game plays when is not known. :proven{games="shaun-white-skateboarding"}[all AnimSets] :unknown[the pair's roles]
