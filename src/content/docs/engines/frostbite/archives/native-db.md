---
title: Native DB object trees
description: Tagged binary trees used by layout.toc and bundle chunk metadata.
games: [skate]
implementations:
  - name: primase worlds/frostbite (db.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/frostbite/src/db.rs
---

Frostbite's native DB stores named or unnamed values in lists and objects. It carries the install manifest in
`layout.toc` behind the TOC envelope, and chunk metadata inside bundle manifests. It is distinct from
[EBX](/engines/frostbite/data-model/ebx/). :observed

```layout
title: Native DB node prefix
size: variable
fields:
  - {at: 0, size: 1, type: u8, name: node tag, level: observed, note: "Low five bits are type; bit 7 set means unnamed. Type zero terminates a container."}
  - {at: 1, size: variable, type: cstring, name: optional name, level: observed, note: Present only for a named non-terminator node; single-byte characters.}
  - {at: after optional name, size: variable, type: bytes, name: typed payload, level: observed}
```

| Type | Payload | Confidence |
|---|---|---|
| `1`, `2` | List/object: variable-length byte count, children, optional zero terminator | :observed |
| `7`, `19` | String/blob: variable-length byte count followed by bytes | :observed |
| `6` | One byte | :observed |
| `8`, `11` | Four bytes | :observed |
| `9`, `12` | Eight bytes | :observed |
| `15` | Sixteen bytes | :observed |
| `16` | Twenty bytes | :observed |

Lengths use seven payload bits per byte, least significant group first, with bit `0x80` indicating continuation.
Container lengths include their child data and any terminator. Type `8` carries little-endian `u32` values such as
`persistentIndex`; string payloads can include a trailing zero. :observed
