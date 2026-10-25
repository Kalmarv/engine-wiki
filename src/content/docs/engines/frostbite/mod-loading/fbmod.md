---
title: Studio FBMOD containers
description: The legacy Frosty version-six intermediate emitted by ReSkate Studio.
games: [skate]
sources:
  - title: FrostyToolsuite
    url: https://github.com/CadeEvs/FrostyToolsuite
implementations:
  - name: primase worlds/frostbite (fbmod.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/frostbite/src/fbmod.rs
---

Studio labels its intermediate FBMOD as Frosty version six, using a legacy variant with a length-prefixed profile
and no payload-table SHA-1. Other Frosty layouts also use version six, so the version word alone does not
identify the variant. Measured Studio files read to their exact end and reproduce byte for byte. :observed

```layout
title: Studio FBMOD prefix
size: variable
note: Little-endian integers.
fields:
  - {at: 0, size: 8, type: bytes, name: magic, level: observed, note: "FROSTY followed by bytes 00 01"}
  - {at: 8, size: 4, type: u32, name: version, value: 6, level: observed}
  - {at: 12, size: 8, type: u64, name: payload table offset, level: observed}
  - {at: 20, size: 4, type: u32, name: payload count, level: observed}
  - {at: 24, size: 1, type: u8, name: profile length, level: observed}
  - {at: 25, size: profile length, type: bytes, name: profile, level: observed}
```

The profile is followed by `u32 game_version`, six zero-terminated strings (title, author, category, version,
description and link), then `u32 entry_count` and the entries. The payload table has `u64 offset, u64 size`
pairs. Payloads use CAS framing and can be shared by index. :observed

An entry begins with `u8 kind`, `i32 payload_index` (`-1` means none) and name. Payload-bearing entries add SHA-1,
decoded size, flags, handler and a user string. All entries carry bundle hashes. Resource entries additionally
store type, resource id and length-prefixed metadata; chunk entries store range start/end, logical offset/size,
h32, first mip and added-bundle hashes. :observed

| Kind | Entry | Confidence |
|---|---|---|
| `0` | Embedded icon/screenshot | :sourced[FrostyToolsuite] |
| `1` | EBX | :sourced[FrostyToolsuite] |
| `2` | Resource | :sourced[FrostyToolsuite] |
| `3` | Chunk | :sourced[FrostyToolsuite] |

Payload SHA-1 covers encoded bytes. The intermediate's entries and bundle modifications are distinct from the
native deployed [TOC/CAS package](/engines/frostbite/mod-loading/costumes/). :observed
