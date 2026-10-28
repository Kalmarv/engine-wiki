---
title: Data folders and superbundle TOCs
description: Install chunks, CAS locations, TOC indexes and bundle file tables in skate.
games: [skate]
implementations:
  - name: frostbite-formats (toc.rs)
    url: https://github.com/Kalmarv/frostbite-formats/blob/main/src/toc.rs
  - name: frostbite-formats (folder.rs)
    url: https://github.com/Kalmarv/frostbite-formats/blob/main/src/folder.rs
---

The game's `Data` directory contains `layout.toc` and a `Win32` tree of superbundle TOCs and CAS archives.
`layout.toc` is a [native DB](/engines/frostbite/archives/native-db/):
`installManifest.installChunks` maps each `persistentIndex` to the install-chunk directory named by `name`.
Together, install-chunk id and archive number locate a CAS archive. :observed

The stock `layout.toc` has 16 install chunks, each with both a `name` (a path under `Win32`) and an `installBundle`
(the same path behind `Win32/`); the two name the same directory for all 16, so either key finds the CAS directory.
The 72 CAS files of the install lie in exactly the 16 directories the chunks name. :proven[all 16 install chunks; all 72 CAS files]
The root object holds `superBundles`, `fs`, `head`, `layeredInstallChunkFiles`, `unlayeredInstallChunkFiles`,
`installManifest` and `meta`. :proven[the stock layout.toc]

## Initfs

The root's `fs` list names one file, `initfs_Win32`, which lies beside `layout.toc`. It carries the TOC envelope and
a [native DB](/engines/frostbite/archives/native-db/) object whose only child is a blob named `encrypted`
(742,864 bytes of near-random content); the file therefore has no readable configuration without a key.
:proven[the stock initfs_Win32]

A bundle's file reference also records whether its bytes belong to base data or patch data, its archive offset
and its stored size. The manifest describes the decoded assets separately.
:observed See [bundle manifests](/engines/frostbite/archives/bundles/).

## TOC indexes

Superbundle TOCs have a `0x22c`-byte envelope beginning `00 d1 ce 01`, followed by a big-endian header. Bundle names
and chunk GUIDs have separate perfect-hash indexes. Base-data names use Huffman coding when flag bit `4` is set;
Studio patch TOCs store plain strings. :observed

All 23 stock TOCs carry the flags word `4` and nothing else: no flag bit besides the Huffman-name bit is set, and
there is no Patch folder in the stock `Data`. Every bundle record's size-and-flags word has the upper two bits equal
to `01` (6,056 of 6,056 bundles), and every chunk reference is `0x80` followed by the index of a four-word record
(177,457 of 177,457; none is `-1`). The four-word record's patch byte (bits 48..55) and top byte (bits 56..63) are
zero in all of them. :proven[all 23 TOCs, 6,056 bundle records and 177,457 chunk references]

## Patch TOCs and the base game's TOC

The flags word has two more bits besides the Huffman-name bit (value `4`): the bit with value `1` says the base game's
TOC of the same superbundle holds bundles this TOC does not list, the bit with value `2` says it holds chunks this TOC
does not list. :sourced[FrostyToolsuite]
Of the 213 TOCs of the 82 mod folders installed beside the game, 167 carry the flags word `3` (both bits, no Huffman
names) and 46 carry `0`. :observed[every TOC of 82 mod folders] Of the 167, 153 have a TOC of the same path in the stock
`Data`; the other 14 are superbundles the mod adds (level superbundles), which have no base to merge with.
:observed[the 167 flagged TOCs] In the 153, all 5,990 bundles the mod TOC lists are bundles of the base TOC (matched by
lowercase name) and none is new; of their 164,345 chunk GUIDs, 161,186 are listed by the base TOC too and 3,159 are
not, and none is stored as removed. :observed[the 153 TOCs] Merging by the flags (the base's bundles and chunks the
patch does not name, then the patch's, a patch entry replacing the base entry of the same name or GUID) gives a TOC whose
bundle and chunk perfect hashes resolve and that writes and reads back. :observed[the 153 merged TOCs]

No TOC of the stock data or of the mods has a bundle record whose size word does not have the upper two bits `01`, a
chunk reference other than `0x80` or `-1`, or a removed (`-1`) chunk: the 213 mod TOCs hold 19,639 bundle records and
3,025,837 chunk references. :observed[every TOC of 82 mod folders] The compact three-word chunk record, removed
bundles and bundles stored outside the TOC that other Frostbite titles use therefore do not occur in this data.

The `superBundles` list of `layout.toc` names the superbundles (`Win32/globals`), one `name` each; the TOC of each is
that name plus `.toc` under the data folder. The stock list has 24 names, 23 of which have a TOC in `Data` and every
TOC of `Data` is named. :proven[the stock layout.toc and Data] In the 82 mod layouts every one of the 213 TOCs on disk is
named by its layout. :observed[82 mod folders] `fs` (`initfs_Win32`), `head` (625,200) and
`installManifest.settings.bundleFormat` (2,651,454,669) hold the same values in the stock layout and in all 82 mod
layouts. :observed[the stock layout and 82 mod layouts]

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
  - {at: 24, size: 4, type: u32, name: unknown, level: unknown, note: Equal to the chunk data offset (the word at 36) in all 23 stock TOCs.}
  - {at: 28, size: 4, type: u32, name: unknown, level: unknown, note: Equal to the chunk data offset (the word at 36) in all 23 stock TOCs.}
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

In the stock regions the first file's flag byte is `0x84` in all 6,056 regions, a later file's flag is `0x00`
(1,396,957 files) or `0x80` (17,920 files, where the archive changes), and flag `1` never occurs: all 1,420,933 file
references use eight-byte identifiers whose patch byte (bits 48..55) and top byte (bits 56..63) are zero. No stock
region holds an inline manifest (inline size 0 in all 6,056); the first file of every region is the bundle's manifest
and the region has exactly one file more than its manifest has assets. :proven[all 6,056 stock regions]

```layout
title: TOC bundle record
size: 16
note: Big-endian; table starts at the bundle record table offset.
fields:
  - {at: 0, size: 4, type: u32, name: name offset, level: observed, note: Bit offset for Huffman data; byte offset for plain names.}
  - {at: 4, size: 4, type: u32, name: region size and flags, level: observed, note: "Low 30 bits are size; upper two bits equal one for the measured inline regions."}
  - {at: 8, size: 8, type: u64, name: region offset, level: observed}
```

```layout
title: Bundle region header
size: 36
note: Big-endian; offsets are relative to the region start.
fields:
  - {at: 0, size: 4, type: u32, name: inline manifest offset, level: observed}
  - {at: 4, size: 4, type: u32, name: inline manifest size, level: observed}
  - {at: 8, size: 4, type: u32, name: file flags offset, level: observed}
  - {at: 12, size: 4, type: u32, name: file count, level: observed}
  - {at: 16, size: 4, type: u32, name: file table offset, level: proven, note: "0x24 in all 6,056 stock regions"}
  - {at: 20, size: 4, type: u32, name: repeated table offset, level: proven, note: "Equal to the file table offset in all 6,056 stock regions."}
  - {at: 24, size: 4, type: u32, name: repeated table offset, level: proven, note: "Equal to the file table offset in all 6,056 stock regions."}
  - {at: 28, size: 4, type: u32, name: unknown, level: unknown, note: "Zero in all 6,056 stock regions and in measured Studio output."}
  - {at: 32, size: 4, type: u32, name: repeated file count, level: proven, note: "Equal to the file count in all 6,056 stock regions."}
```

```layout
title: Extended archive identifier
size: 8
note: Big-endian integer; bit ranges are described in the notes.
fields:
  - {at: 0, size: 8, type: u64, name: archive location, level: observed, note: "archive number in bits 0–15; install chunk in 16–47; patch indicator in 48–55"}
```

## Envelope

All 24 envelope-carrying files of the install (the 23 TOCs and `layout.toc`) begin `00 d1 ce 01` and have the same
556-byte envelope shape. Bytes 4..8 are zero. Bytes 8..264 are a 256-byte block that differs in every file and has
near-uniform byte statistics; bytes 264..296 are the same in all 24 files; bytes 296..556 (260 bytes) are identical
in all 24 files and in `initfs_Win32`, which carries the same envelope shape with its own 256-byte block.
:proven[all 24 envelopes and the initfs]

## Catalogue files

The install holds no file named `cas.cat`: a search of the whole install folder outside the mod folders finds none.
Archive, offset and stored size of every file come from the bundle regions and the TOC chunk table.
:proven[the stock install]

:::open[What does the envelope's 256-byte block cover?]
The block differs per file and is not a function of the constant bytes around it. Its covered range and role are
not established. :unknown
:::
