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

The stock manifests are all stored little-endian: the word at offset 4 reads `0x9d798ed6` in all 6,056, so the salt
`0x7065636e` is the only one that occurs. A manifest has no inline copy in its region; it is the region's first file
and is stored raw, without block headers. :proven[all 6,056 stock manifests]

A chunk entry's logical offset and logical size describe the byte range of the whole chunk that this bundle stores.
The logical offset is a multiple of 65,536 in all 239,810 chunk entries (its low 16 bits are zero in every entry; it is
nonzero in 40,504). The logical size equals the decoded size of the entry's CAS range in all 239,810 entries, so
`logical size` is the size of the stored range, not of the whole chunk. For an entry with a nonzero logical offset,
`logical offset + logical size` equals the decoded size of the whole chunk's CAS range in the superbundle's TOC chunk
table in all 40,504 entries, and the stored range is the last part of that chunk: in 12,679 entries it is the same
bytes in the same CAS file as the tail of the TOC's range, in 27,825 it is a separate copy in another CAS file.
:proven[all 239,810 stock chunk entries]

For a texture chunk the logical offset is the start of the 64 KiB block that contains the first stored mip level: in
all 40,504 texture entries with a nonzero offset it equals the largest multiple of 65,536 not above the byte offset of
mip level `first mip` in the chunk, and the sum with the logical size equals the chunk size in the texture header.
:observed[every texture whose chunk lies in its own bundle]

Chunk metadata is a native-DB `chunkMeta` list, one row per chunk in chunk order (6,039 bundles with chunks have a
list of exactly their chunk count; 17 bundles have no chunks and no list). Every row is an object with an `h64`
(eight bytes) and a `meta` object. `meta` is empty in 175,203 rows, holds only `firstMip` (a signed 32-bit value) in
58,570 rows, and holds a string `container` and a six-element `metrics` list in 6,037 rows (one per bundle).
:proven[all 239,810 stock rows] A `metrics` element is an object of a `resourceType` (a 32-bit resource type hash) and a
`value` object with one named 32-bit number (`persistentTextureSize`, `FreeStreamedTextureSize`, `bundledTextureSize`,
`freeStreamedMeshSizes`, `bundledMeshSizes`, `physicsSizes`). :proven[all 6,037 stock `container` rows: six metrics each, six distinct names] The manifests ReSkate Studio writes for the installed mods have the same row shapes (1,193,758 rows over 19,639 bundles:
951,041 empty, 234,172 `firstMip`, 8,545 `container`). They differ for a bundle with no chunks: 5,573 of them store an
empty list named `chunkMeta` (13 bytes) where the stock bundles store no metadata at all, and 5 store none.
:observed[every manifest of 82 mod folders] A measured root bundle has 8,506 chunks and 8,506 metadata rows
in the same order. :observed

Every TOC, bundle region, bundle manifest, depot, shader lookup table and `layout.toc` in a measured Studio patch
survives a byte-identical read/write round trip. This establishes that patch's representation; it does not establish
every variant in the install. :observed
