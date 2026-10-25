---
title: Data folders and superbundle TOCs
description: Install chunks, CAS locations, TOC indexes and bundle file tables in skate.
games: [skate]
implementations:
  - name: primase worlds/frostbite (toc.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/frostbite/src/toc.rs
  - name: primase worlds/frostbite (read/folder.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/frostbite/src/read/folder.rs
---

The game's `Data` directory contains `layout.toc` and a `Win32` tree of superbundle TOCs and CAS archives.
`layout.toc` is a [native DB](/engines/frostbite/archives/native-db/):
`installManifest.installChunks` maps each `persistentIndex` to the install-chunk directory named by `name`.
Together, install-chunk id and archive number locate a CAS archive. :observed

A bundle's file reference also records whether its bytes belong to base data or patch data, its archive offset
and its stored size. The manifest describes the decoded assets separately.
:observed See [bundle manifests](/engines/frostbite/archives/bundles/).

## TOC indexes

Superbundle TOCs have a `0x22c`-byte envelope beginning `00 d1 ce 01`, followed by a big-endian header. Bundle names
and chunk GUIDs have separate perfect-hash indexes. Base-data names use Huffman coding when flag bit `4` is set;
Studio patch TOCs store plain strings. :observed

```layout
title: Superbundle TOC header
size: 48
note: Big-endian; offsets are relative to the bytes after the 0x22c-byte envelope.
fields:
  - {at: 0, size: 4, type: u32, name: bundle hash table offset, level: observed}
  - {at: 4, size: 4, type: u32, name: bundle record table offset, level: observed}
  - {at: 8, size: 4, type: u32, name: bundle count, level: observed}
  - {at: 12, size: 4, type: u32, name: chunk hash table offset, level: observed}
  - {at: 16, size: 4, type: u32, name: chunk GUID table offset, level: observed}
  - {at: 20, size: 4, type: u32, name: chunk count, level: observed}
  - {at: 24, size: 4, type: u32, name: unknown, level: unknown, note: Not interpreted by the documented reader.}
  - {at: 28, size: 4, type: u32, name: unknown, level: unknown, note: Not interpreted by the documented reader.}
  - {at: 32, size: 4, type: u32, name: names offset, level: observed}
  - {at: 36, size: 4, type: u32, name: chunk data offset, level: observed}
  - {at: 40, size: 4, type: u32, name: chunk data word count, level: observed}
  - {at: 44, size: 4, type: u32, name: flags, level: observed}
```

For Huffman-coded names, three additional big-endian words follow: name-data word count, Huffman-table word count,
and Huffman-table offset, at `48`, `52` and `56`. :observed

The hash is an FNV-1 variant: multiply by `0x01000193`, XOR a sign-extended byte, wrap at 32 bits, then reduce
modulo `0x01000193` once after the string. The default seed is `0x811c9dc5`. Bundle keys are lowercase names.
:observed

Multi-key hash buckets use a stored seed; single-key buckets encode their destination as `-slot-1`. Huffman name
bits are consumed from least to most significant within each 32-bit word; leaf words encode the complemented
character, including a zero terminator. :observed

## Bundle regions

Each bundle's TOC region contains a file table and can also contain an inline manifest. A zero file flag reuses
the previous archive identifier, flag `1` supplies a compact four-byte identifier, and other nonzero flags supply
an eight-byte identifier. Offsets and stored lengths are big-endian 32-bit integers. :observed

```layout
title: Extended archive identifier
size: 8
note: Big-endian integer; bit ranges are described in the notes.
fields:
  - {at: 0, size: 8, type: u64, name: archive location, level: observed, note: "archive number in bits 0–15; install chunk in 16–47; patch indicator in 48–55"}
```

:::open[What does the TOC envelope contain beyond its signature?]
The fixed envelope is retained by readers, but its remaining fields are not described here. :unknown
:::

:::open[What is the catalogue format in this build?]
The documented read path resolves bundle file locations through TOCs and the install manifest. A separate
`cas.cat` byte layout and its runtime role are not established for this skate. build. :unknown
:::
