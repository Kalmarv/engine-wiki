---
title: Bundle manifests
description: EBX, resource and chunk records, their parallel tables and their CAS file references.
games: [skate]
implementations:
  - name: frostbite-formats (bundle.rs)
    url: https://github.com/Kalmarv/frostbite-formats/blob/main/src/bundle.rs
---

A bundle groups EBX documents, resources and chunks for loading. Its binary manifest names EBX and resource
entries, supplies resource types and ids, and identifies chunks by GUID. Its TOC region supplies the corresponding
physical file locations, with the manifest first, then EBX, resources and chunks. :observed

```layout
title: Bundle manifest header
size: 36
note: The first word is always big-endian. The salted magic determines the remaining words' endianness.
fields:
  - {at: 0, size: 4, type: u32, name: declared length minus four, level: observed}
  - {at: 4, size: 4, type: u32, name: salted magic, level: observed, note: "XOR 0x7065636e gives 0xed1cedb8"}
  - {at: 8, size: 4, type: u32, name: total entry count, level: observed}
  - {at: 12, size: 4, type: u32, name: EBX count, level: observed}
  - {at: 16, size: 4, type: u32, name: resource count, level: observed}
  - {at: 20, size: 4, type: u32, name: chunk count, level: observed}
  - {at: 24, size: 4, type: u32, name: string table offset minus four, level: observed}
  - {at: 28, size: 4, type: u32, name: chunk metadata offset minus four, level: observed}
  - {at: 32, size: 4, type: u32, name: chunk metadata size, level: observed}
```

The body starts with one 20-byte SHA-1 per entry. EBX and resources then have eight-byte name/size records;
resource type ids, 16-byte resource metadata and 64-bit resource ids follow in separate parallel arrays.
Chunk records follow those arrays. :observed

```layout
title: Named entry
size: 8
fields:
  - {at: 0, size: 4, type: u32, name: name offset in string table, level: observed}
  - {at: 4, size: 4, type: u32, name: original size, level: observed}
```

```layout
title: Chunk entry
size: 24
fields:
  - {at: 0, size: 16, type: GUID, name: chunk GUID, level: observed, note: Big-endian manifests reverse the stored 16 bytes relative to the little-endian representation.}
  - {at: 16, size: 4, type: u32, name: logical offset, level: observed}
  - {at: 20, size: 4, type: u32, name: logical size, level: observed}
```

In measured Studio MeshSet and depot entries, the SHA-1 covers the CAS-encoded bytes and `original size` describes
the decoded payload. :observed

Chunk metadata is a native-DB `chunkMeta` list. A measured root bundle has 8,506 chunks and 8,506 metadata rows
in the same order; rows contain `h64` and a `meta.firstMip` value. :observed

Every TOC, bundle region, bundle manifest, depot, shader lookup table and `layout.toc` in a measured Studio patch
survives a byte-identical read/write round trip. This establishes that patch's representation; it does not establish
every variant in the install. :observed
