---
title: RSC7 resources
description: Resource envelopes, virtual pointers, system and graphics pages, and packed page flags.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: ResourceData and RpfResourcePageFlags describe the resource envelope.
implementations:
  - name: rage-engine-formats (resource.rs)
    url: https://github.com/Kalmarv/rage-engine-formats/blob/main/src/resource.rs
---

RSC7 wraps a typed resource in raw DEFLATE and two page descriptions. The decoded body contains system pages first,
then graphics pages. System pointers use base `0x50000000`; graphics pointers use base `0x60000000`.
:sourced[CodeWalker]

```layout
title: Loose resource header
size: 16
note: Little-endian; the compressed body follows immediately.
fields:
  - {at: 0, size: 4, type: "char[4]", name: magic, value: RSC7, level: sourced}
  - {at: 4, size: 4, type: u32, name: resource version, level: sourced}
  - {at: 8, size: 4, type: u32, name: system page flags, level: sourced}
  - {at: 12, size: 4, type: u32, name: graphics page flags, level: sourced}
```

[RPF7 entries](/engines/rage/archives/rpf7/) carry these flags directly. For an archived resource the high nibble of
the system flags supplies the version's high nibble, and the high nibble of the graphics flags supplies its low
nibble: `version = (systemFlags >> 28) * 16 + (graphicsFlags >> 28)`. :sourced[CodeWalker]

## Page flags

The page-size calculation is checked by decoding every one of the install's 348,598 resource entries. Each body
fills the flagged allocation or ends inside its final zero-filled page; a missing whole page is rejected.
:proven[all archived resources]

For either flag word, `base = 512 << (flags & 15)`. Each count below contributes `count * (base << shift)` bytes;
their sum is that memory kind's allocation size. :proven

| Flag bits | Count mask after shifting | Page-size shift | Confidence |
|---|---|---|---|
| 4 | `1` | 8 | :proven |
| 5–6 | `3` | 7 | :proven |
| 7–10 | `15` | 6 | :proven |
| 11–16 | `63` | 5 | :proven |
| 17–23 | `127` | 4 | :proven |
| 24 | `1` | 3 | :proven |
| 25 | `1` | 2 | :proven |
| 26 | `1` | 1 | :proven |
| 27 | `1` | 0 | :proven |

Some decoded streams end inside the last allocated page; its remaining bytes are zero-filled. The full-resource
census distinguishes this short final page from a body missing an entire page. :proven

A graphics offset can exceed 256 MiB and yield a pointer starting with `0x7`; classifying graphics pointers only by
the leading hexadecimal digit loses that range. :observed

## Enhanced payload versions

The version table comes from the full archive/resource census, including all archived copies. It establishes the
versions of the accepted Enhanced layouts, rather than claiming that no other version exists in the install.
:proven[all archived copies]

| Payload | Version | Confidence |
|---|---|---|
| Drawable (`ydr`) and drawable dictionary (`ydd`) | 159 | :proven |
| Fragment (`yft`) | 171 | :proven |
| Texture dictionary (`ytd`) | 5 | :proven |
| Clip dictionary (`ycd`) | 46 | :proven |

Other layout versions can occur in the same physical install. A census that counts Legacy or older-tool variants
without decoding them does not establish those variants' payload layouts. :proven
