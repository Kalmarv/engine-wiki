---
title: RPF7 archives
description: Archive entries, block addressing, compression and the NG and AES ciphers.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: RpfFile and GTACrypto describe the archive and cipher layouts.
  - title: ragekit
    url: https://github.com/RatPrez/ragekit
    note: a second RPF7 reader; its encryption values
implementations:
  - name: rage-engine-formats (archive/rpf.rs)
    url: https://github.com/Kalmarv/rage-engine-formats/blob/main/src/archive/rpf.rs
  - name: rage-engine-formats (archive/ng.rs)
    url: https://github.com/Kalmarv/rage-engine-formats/blob/main/src/archive/ng.rs
---

An RPF7 archive holds directories, binary files and resources. Its table contains names; file data is addressed in
512-byte blocks relative to the archive's start. An uncompressed binary entry can itself be an RPF archive, with
its own header and block origin. :proven

Every table entry across the install's 5,407 archives is checked against an independent CodeWalker listing. The
45,075 binary entries comprise 5,228 nested archives, parsed recursively, and 39,847 other payloads, decoded to their
declared lengths. All 348,598 resource bodies decode to their stream ends without a refusal. The proven archive
layouts and compression rules below apply to that full corpus. :proven[all archive entries]

The entry table and name table follow the 16-byte header and use the header's cipher. Names are NUL-terminated
strings addressed by offsets into the name table. :proven

```layout
title: RPF7 header
size: 16
note: Little-endian words. The magic's integer value is 0x52504637.
fields:
  - {at: 0, size: 4, type: u32, name: magic, value: "0x52504637", level: proven}
  - {at: 4, size: 4, type: u32, name: entry count, level: proven}
  - {at: 8, size: 4, type: u32, name: name table length, level: proven}
  - {at: 12, size: 4, type: u32, name: cipher, level: proven}
```

## Entry variants

Every entry is 16 bytes. A directory has `0x7FFFFF00` in its second word; otherwise bit 31 of that word distinguishes
a resource from a binary file. :proven

```layout
title: Directory entry
size: 16
fields:
  - {at: 0, size: 4, type: u32, name: name offset, level: proven}
  - {at: 4, size: 4, type: u32, name: directory marker, value: "0x7FFFFF00", level: proven}
  - {at: 8, size: 4, type: u32, name: first child entry, level: proven}
  - {at: 12, size: 4, type: u32, name: child count, level: proven}
```

```layout
title: Binary entry
size: 16
fields:
  - {at: 0, size: 2, type: u16, name: name offset, level: proven}
  - {at: 2, size: 3, type: u24, name: compressed length, level: proven, note: "zero means uncompressed"}
  - {at: 5, size: 3, type: u24, name: block offset, level: proven}
  - {at: 8, size: 4, type: u32, name: decoded length, level: proven}
  - {at: 12, size: 4, type: u32, name: encrypted flag, level: proven, note: "0 or 1"}
```

```layout
title: Resource entry
size: 16
fields:
  - {at: 0, size: 2, type: u16, name: name offset, level: proven}
  - {at: 2, size: 3, type: u24, name: stored length, level: proven, note: "includes the 16 bytes before the compressed body"}
  - {at: 5, size: 3, type: u24, name: block offset and resource flag, level: proven, note: "low 23 bits are the block; top bit is set"}
  - {at: 8, size: 4, type: u32, name: system page flags, level: proven}
  - {at: 12, size: 4, type: u32, name: graphics page flags, level: proven}
```

Binary entries with a nonzero compressed length use raw DEFLATE; a zero compressed length uses the decoded length
as its stored length. Resources use the [RSC7 page layout](/engines/rage/data-model/rsc7/). Their archive entry supplies
the page flags; the 16 bytes preceding their body are not a trustworthy loose-file RSC7 header. :proven

When a resource's 24-bit stored length is `0xFFFFFF`, its actual length is assembled little-endian from bytes
`7, 14, 5, 2` of those 16 preceding bytes. :proven

Script resources (`.ysc`) have encrypted compressed bodies without a separate resource-entry encryption flag; the
inspected reader selects decryption by extension. The resource body's stored length participates in NG key
selection. :proven

## Ciphers

| Header value | Interpretation | Confidence |
|---|---|---|
| `0` | No encryption | :sourced[CodeWalker, ragekit] |
| `0x4E45504F` | Clear table (`OPEN`) | :sourced[CodeWalker, ragekit] |
| `0x0FFFFFF9` | AES-256 ECB | :sourced[CodeWalker] |
| `0x0FEFFFFF` | NG | :sourced[CodeWalker] |

The byte-swapped word `0x4F50454E` is not a cipher value in either reader's source; both read `0` as none and
`0x4E45504F` as open. :sourced[CodeWalker, ragekit]

Both cipher routines process complete 16-byte blocks and leave a trailing partial block unchanged. NG is a
17-round table cipher: rounds 1, 2 and 17 mix consecutive input bytes; rounds 3–16 take a diagonal byte spread.
:sourced[CodeWalker]

NG selects one of 101 keys using `(nameHash + length + 61) % 101`, with wrapping 32-bit addition. The archive uses its
own filename and length; an encrypted file uses its entry name and recorded file length. The cipher's name hash
maps bytes through a lookup table before mixing, so ordinary joaat is not interchangeable with it.
:sourced[CodeWalker]

The community key-material layout provides NG keys, decrypt tables, the hash lookup table and an optional AES key;
CodeWalker describes extraction from a game executable. :sourced[CodeWalker]

Recounting every archive record in the retained listing gives 5,405 NG and two AES archives. The AES archives are
`x64c.rpf/anim/cutscene/cuts_random_event.rpf` and `x64c.rpf/anim/cutscene/cuts_trevor_4.rpf`. Enhanced therefore cannot
be treated as an NG-only corpus. :proven[5,407 unique archive paths]

:::open[Which ciphers occur in other builds?]
The two AES archives occur in the inspected listing. Their presence or absence in another edition or update needs
a separate archive census. :unknown
:::
