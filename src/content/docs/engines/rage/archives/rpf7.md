---
title: RPF7 archives
description: Archive entries, block addressing, compression and the NG and AES ciphers.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: RpfFile and GTACrypto describe the archive and cipher layouts.
implementations:
  - name: primase worlds/gta (rpf.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/read/archive/rpf.rs
  - name: primase worlds/gta (ng.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/read/archive/ng.rs
---

An RPF7 archive holds directories, binary files and resources. Its table contains names; file data is addressed in
512-byte blocks relative to the archive's start. An uncompressed binary entry can itself be an RPF archive, with
its own header and block origin. :sourced[CodeWalker]

The entry table and name table follow the 16-byte header and use the header's cipher. Names are NUL-terminated
strings addressed by offsets into the name table. :sourced[CodeWalker]

```layout
title: RPF7 header
size: 16
note: Little-endian words. The magic's integer value is 0x52504637.
fields:
  - {at: 0, size: 4, type: u32, name: magic, value: "0x52504637", level: sourced}
  - {at: 4, size: 4, type: u32, name: entry count, level: sourced}
  - {at: 8, size: 4, type: u32, name: name table length, level: sourced}
  - {at: 12, size: 4, type: u32, name: cipher, level: sourced}
```

## Entry variants

Every entry is 16 bytes. A directory has `0x7FFFFF00` in its second word; otherwise bit 31 of that word distinguishes
a resource from a binary file. :sourced[CodeWalker]

```layout
title: Directory entry
size: 16
fields:
  - {at: 0, size: 4, type: u32, name: name offset, level: sourced}
  - {at: 4, size: 4, type: u32, name: directory marker, value: "0x7FFFFF00", level: sourced}
  - {at: 8, size: 4, type: u32, name: first child entry, level: sourced}
  - {at: 12, size: 4, type: u32, name: child count, level: sourced}
```

```layout
title: Binary entry
size: 16
fields:
  - {at: 0, size: 2, type: u16, name: name offset, level: sourced}
  - {at: 2, size: 3, type: u24, name: compressed length, level: sourced, note: "zero means uncompressed"}
  - {at: 5, size: 3, type: u24, name: block offset, level: sourced}
  - {at: 8, size: 4, type: u32, name: decoded length, level: sourced}
  - {at: 12, size: 4, type: u32, name: encrypted flag, level: sourced, note: "0 or 1"}
```

```layout
title: Resource entry
size: 16
fields:
  - {at: 0, size: 2, type: u16, name: name offset, level: sourced}
  - {at: 2, size: 3, type: u24, name: stored length, level: sourced, note: "includes the 16 bytes before the compressed body"}
  - {at: 5, size: 3, type: u24, name: block offset and resource flag, level: sourced, note: "low 23 bits are the block; top bit is set"}
  - {at: 8, size: 4, type: u32, name: system page flags, level: sourced}
  - {at: 12, size: 4, type: u32, name: graphics page flags, level: sourced}
```

Binary entries with a nonzero compressed length use raw DEFLATE; a zero compressed length uses the decoded length
as its stored length. Resources use the [RSC7 page layout](/engines/rage/data-model/rsc7/). Their archive entry supplies
the page flags; the 16 bytes preceding their body are not a trustworthy loose-file RSC7 header. :sourced[CodeWalker]

When a resource's 24-bit stored length is `0xFFFFFF`, its actual length is assembled little-endian from bytes
`7, 14, 5, 2` of those 16 preceding bytes. :sourced[CodeWalker]

## Ciphers

| Header value | Interpretation | Confidence |
|---|---|---|
| `0x4E45504F` | Clear table | :sourced[CodeWalker] |
| `0x4F50454E` | Alternative clear-table marker used by editing tools | :sourced[CodeWalker] |
| `0x0FFFFFF9` | AES-256 ECB | :sourced[CodeWalker] |
| `0x0FEFFFFF` | NG | :sourced[CodeWalker] |

Both cipher routines process complete 16-byte blocks and leave a trailing partial block unchanged. NG is a
17-round table cipher: rounds 1, 2 and 17 mix consecutive input bytes; rounds 3–16 take a diagonal byte spread.
:sourced[CodeWalker]

NG selects one of 101 keys using `(nameHash + length + 61) % 101`, with wrapping 32-bit addition. The archive uses its
own filename and length; an encrypted file uses its entry name and recorded file length. The cipher's name hash
maps bytes through a lookup table before mixing, so ordinary joaat is not interchangeable with it.
:sourced[CodeWalker]

The community key-material layout provides NG keys, decrypt tables, the hash lookup table and an optional AES key;
CodeWalker describes extraction from a game executable. :sourced[CodeWalker] The inspected Enhanced cipher reader
records no AES archives in its Enhanced corpus; AES support does not establish that this edition ships an AES
archive. :observed

:::open[Which ciphers occur in other builds?]
AES is a defined archive variant, but its presence in another edition or update needs a separate archive census.
:unknown
:::
