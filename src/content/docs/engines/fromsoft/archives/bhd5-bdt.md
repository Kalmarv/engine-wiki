---
title: BHD5 and BDT archives
description: How Sekiro and Elden Ring pack their files into archive pairs, hash their paths, and encrypt their indexes and data.
sources:
  - title: SoulsFormats (BHD5)
    url: https://github.com/JKAnderson/SoulsFormats
    note: reference reader; the field names used here
  - title: SoulsFormatsNEXT
    url: https://github.com/soulsmods/SoulsFormatsNEXT
    note: reference reader for Elden Ring
  - title: UXM Selective Unpack
    url: https://github.com/Nordgaren/UXM-Selective-Unpack
    note: archive lists (EldenRingGameInfo.xml), public keys (ArchiveKeys.cs) and path dictionaries
implementations:
  - name: fromsoft-formats (bhd.rs)
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/bhd.rs
---

Almost every file the games load lives in an **archive pair**: a `.bhd` index and a `.bdt` data file of the same name
in the game folder. The index lists each file by the hash of its path, with where its bytes sit in the data file, how
long it is, and which of its byte ranges are encrypted. File names themselves are not stored anywhere: a path is found
by hashing it and looking the hash up. :proven

Reading a file is four steps: unwrap the index with the pair's RSA public key, find the path's hash in it, read the
listed bytes from the `.bdt`, and decrypt the listed ranges with the file's AES key. What comes out is usually a
[DCX envelope](/engines/fromsoft/archives/dcx/) around the real file. :proven

Every entry of both installs reads to the same bytes as the reference readers produce (SoulsFormats for Sekiro,
SoulsFormatsNEXT for Elden Ring, both with UXM's keys and dictionaries), and every index is accounted for byte by byte.
:proven[every entry]{games="sekiro elden-ring"}

## The archive pairs

| Game | Pairs | Confidence |
|---|---|---|
| Sekiro | `Data1` to `Data5` (there is no `Data0`) | :proven{games="sekiro"} |
| Elden Ring | `Data0` to `Data3`; `DLC` when the expansion is installed; the sound archives `sd/sd` and `sd/sd_dlc02` | :proven{games="elden-ring"} |

Elden Ring's list, and which of its pairs may be absent, is the one UXM's `EldenRingGameInfo.xml` gives.
:sourced[UXM]{games="elden-ring"} No path hash appears in two pairs of the same game, so a hash names one file across
the whole install. :observed

Sekiro's five indexes list 8,765 files, of which UXM's path dictionary names 8,752. :proven{games="sekiro"}
Elden Ring's six installed indexes list 97,118 files (5,878 in `Data0`, 39,419 in `Data1`, 39,684 in `Data2`, 1,672 in
`Data3`, 8,650 in `sd/sd` and 1,815 in `sd/sd_dlc02`); hashing every line of three community lists with the game's rule
and intersecting them with the six indexes shows that UXM's Elden Ring dictionary (revision 9501be8) names 97,031 of them,
the newer copy of that list bundled with Smithbox names 97,045, and Smithbox's own file dictionary (130,951 paths, no two
sharing a hash) names all 97,118. :proven{games="elden-ring"} The 87 entries UXM 9501be8 leaves unnamed are 77 `.dcx` files
(54 `parts/*.partsbnd`, 8 `chr/*.texbnd`, 4 `chr/*.anibnd`, 4 `chr/*.chrbnd`, 3 asset geometry binders, 2 `.gparam`
and 2 `.devpatch` shader bundles), 5 `.bnk` and 5 `.wem`. :proven{games="elden-ring"}
`Data5` holds the map files: its salt is `NTC_map` and its index lists 5,449 of them. :observed{games="sekiro"}

## The index is wrapped in RSA

A `.bhd` file on disk is a run of 256-byte blocks. Each block is the raw RSA public-key operation of a 255-byte
plaintext block (not PKCS#1 encryption: a signature-style envelope opened with the public key), and the plaintexts
joined in order are the index. :proven Each archive pair has its own 2048-bit public key. :proven Both games' public keys
are published by UXM (`ArchiveKeys.cs`). :sourced[UXM]

After the index's own length (the field at offset 12 below), the unwrapped bytes hold fewer than 255 zero bytes of
padding from the last block. :proven

## The index

The unwrapped index is a header, a table of hash buckets, the file records the buckets point at, and per-file hash
and key tables. Every byte of it belongs to one of these. :proven

```layout
title: BHD5 header
size: variable
note: "Offsets are from the start of the unwrapped index. Integers are little-endian when the flag at 4 is 0xFF."
fields:
  - {at: 0, size: 4, type: "char[4]", name: magic, value: "BHD5", level: proven}
  - {at: 4, size: 1, type: u8, name: endianness, level: proven, note: "`0xFF` little-endian, `0` big-endian"}
  - {at: 5, size: 1, type: u8, name: unknown, level: unknown, note: "0 or 1"}
  - {at: 6, size: 2, type: "u8[2]", name: reserved, level: proven, note: "always zero"}
  - {at: 8, size: 4, type: u32, name: version, value: 1, level: proven}
  - {at: 12, size: 4, type: u32, name: index length, level: proven, note: "bytes of index; what follows is RSA padding"}
  - {at: 16, size: 4, type: u32, name: bucket count, level: proven}
  - {at: 20, size: 4, type: u32, name: bucket table offset, level: proven}
  - {at: 24, size: 4, type: u32, name: salt length, level: proven}
  - {at: 28, size: "salt length", type: "char[]", name: salt, level: sourced, note: "SoulsFormats' name; nothing in reading depends on it"}
```

```layout
title: Bucket
size: 8
note: "The bucket table holds `bucket count` of these. A path's bucket is its hash modulo the bucket count."
fields:
  - {at: 0, size: 4, type: u32, name: file count, level: proven}
  - {at: 4, size: 4, type: u32, name: file records offset, level: proven, note: "`file count` records of 40 bytes each"}
```

A path's bucket is its hash modulo the bucket count: it holds for every record of every bucket, 8,765 in Sekiro's five
indexes and 97,118 in Elden Ring's six, so a lookup can read one bucket. :proven[every entry of both installs, Elden Ring
without the `DLC` pair] The bucket counts are 173, 23, 83, 199 and 787 in Sekiro's `Data1` to `Data5`, and 839, 5,639,
5,669, 239, 1,237 and 263 in Elden Ring's `Data0` to `Data3`, `sd/sd` and `sd/sd_dlc02`. :proven[every index]

### The file record

Both games use a 40-byte record with the same fields, laid out differently: Elden Ring widens the hash to 64 bits and
narrows the unpadded size to 32. :proven

```layout
title: File record (Sekiro)
size: 40
games: [sekiro]
note: "Dark Souls III uses the same layout."
fields:
  - {at: 0, size: 4, type: u32, name: path hash, level: proven, note: "base 37, see below"}
  - {at: 4, size: 4, type: u32, name: padded size, level: proven, note: "bytes stored in the .bdt"}
  - {at: 8, size: 8, type: u64, name: data offset, level: proven, note: "into the .bdt"}
  - {at: 16, size: 8, type: u64, name: hash table offset, level: proven, note: "0 when the file has none"}
  - {at: 24, size: 8, type: u64, name: key table offset, level: proven, note: "0 when the file is not encrypted"}
  - {at: 32, size: 8, type: u64, name: unpadded size, level: proven, note: "never more than the padded size"}
```

```layout
title: File record (Elden Ring)
size: 40
games: [elden-ring]
fields:
  - {at: 0, size: 8, type: u64, name: path hash, level: proven, note: "base 133, see below"}
  - {at: 8, size: 4, type: u32, name: padded size, level: proven, note: "bytes stored in the .bdt"}
  - {at: 12, size: 4, type: u32, name: unpadded size, level: proven, note: "never more than the padded size"}
  - {at: 16, size: 8, type: u64, name: data offset, level: proven, note: "into the .bdt"}
  - {at: 24, size: 8, type: u64, name: hash table offset, level: proven, note: "0 when the file has none"}
  - {at: 32, size: 8, type: u64, name: key table offset, level: proven, note: "0 when the file is not encrypted"}
```

Within one index no hash appears twice. :proven

The unpadded size is zero for most entries: for 7,851 of Sekiro's 8,765 and 71,332 of Elden Ring's 97,118 (every entry of
Sekiro's `Data2` and `Data4` and of Elden Ring's `Data1` and `Data3`, none of Elden Ring's `sd` pairs). Where it is stored, the padded size is it rounded up to 16 bytes,
except for 82 Sekiro entries and 6 Elden Ring ones. :proven[every entry of both installs, Elden Ring without
the `DLC` pair] The padded size is therefore the size to read, and "never more than the padded size" is all the stored
value guarantees. :proven

Within a pair the entries tile the `.bdt` file: ordered by data offset, each starts where the previous one ends, with no
gap and no overlap, and the first starts at offset 0. :proven[all 11 pairs] A `.bdt` has no header of its own: its first
bytes are its first entry's bytes (a DCX envelope in Sekiro's `Data1` and Elden Ring's `Data2`, ciphertext in the pairs
whose first entry is encrypted). :proven[all 11 pairs]

### Hash and key tables

A file's key table gives the AES key and the byte ranges it applies to; its hash table gives a digest and the ranges
it covers. Both list ranges the same way. :proven

```layout
title: Range
size: 16
fields:
  - {at: 0, size: 8, type: i64, name: start, level: proven}
  - {at: 8, size: 8, type: i64, name: end, level: proven, note: "exclusive; `(-1, -1)` is a disabled range"}
```

```layout
title: Key table
size: variable
fields:
  - {at: 0, size: 16, type: "u8[16]", name: AES key, level: proven, note: "AES-128"}
  - {at: 16, size: 4, type: u32, name: range count, level: proven}
  - {at: 20, size: "16 × range count", type: "Range[]", name: ranges, level: proven, note: "ascending, not overlapping, multiples of 16"}
```

```layout
title: Hash table
size: variable
fields:
  - {at: 0, size: 32, type: "u8[32]", name: digest, level: sourced, note: "a SHA-256 of the listed ranges per SoulsFormats; not checked"}
  - {at: 32, size: 4, type: u32, name: range count, level: proven}
  - {at: 36, size: "16 × range count", type: "Range[]", name: ranges, level: proven, note: "ascending, not overlapping"}
```

A file is decrypted by running AES-128 in ECB mode over exactly the ranges of its key table, block by block, and
leaving every other byte as stored. :proven Disabled ranges are skipped. :proven Bytes outside the listed ranges are
stored in the clear, so decrypting a whole file corrupts it. :proven

## Path hashes

A path is normalised before hashing: lower-cased, backslashes turned into forward slashes, and a leading `/` added if
it has none. The hash runs over the path's UTF-16 code units, starting from zero, with wrapping arithmetic. :proven

| Game | Hash | Confidence |
|---|---|---|
| Sekiro | `h = h × 37 + unit`, 32-bit | :proven{games="sekiro"} |
| Elden Ring | `h = h × 133 + unit`, 64-bit | :proven{games="elden-ring"} |

So `/map/m11_01_00_00/m11_01_00_00.msb.dcx` is found by hashing that string, never by a stored name. Names come from
dictionaries the community has assembled (UXM ships one per game); a hash no dictionary names is a file whose path is
not known, not a missing file. :proven Because the hash is lossy, a dictionary can map two paths to one hash; both are
then candidates for that file. :inferred

### The community's path lists

Smithbox's file dictionaries list, for each path, the archive it is said to be in and a flag that says whether the path was
validated. Sekiro's lists 8,949 paths (no archive named; 8,752 flagged valid and in the index, 197 flagged invalid and not) that
name 8,752 of the 8,765 index entries. :proven{games="sekiro"} Elden Ring's lists 130,951 lines (130,946 distinct paths) and
names all 97,118 index entries; 97,123 of its lines hash into the index (five paths twice). The archive it states is the pair
that holds the path for all but five paths (stated `dlc`, in `Data3`), but the flag is not exact: 10,467 paths flagged invalid are
in the index, and 33,750 flagged valid are in none; 33,757 of the lines state the archive `dlc`, which the index does not
list. :proven{games="elden-ring"}

:::open[What is the byte at offset 5 of the index header?]
It is 0 or 1. Neither reference reader gives it a meaning, and reading does not depend on it.
:::
