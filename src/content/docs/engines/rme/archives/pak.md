---
title: PAK archives
description: "The big-endian PAK v4 container of the RME engine: header, 32-byte entries, section markers, sdbm name hashes, attributes and the alignment word."
implementations:
  - name: primase worlds/shred (pak.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/shred/src/read/pak.rs
---

Every resource of Tony Hawk: SHRED sits in a **PAK** file. A PAK is a flat table of entries, then a string table of their names, then the entries' bytes; the engine
loads a PAK by *sections* (`MAIN`, `LOCAL`, `TEXTURES_STREAMED`, ...), which are runs of entries opened by marker entries. There are 336 PAKs on the disc, with 67,320 entries in all, and the same container
holds the game's compiled scripts. :proven[all 336 PAKs]

Every number in this page is big-endian. The disc carries these PAKs: 209 in `levels/layers`, 105 in `characters`, 10 in `levels`, 5 in `anim`, 3 in `flash`, 3 in the root of `USRDIR` and 1 in `database`. :observed

## Header

```layout
title: PAK header
size: 16
games: [shred]
note: Followed at once by the entry table.
fields:
  - {at: 0, size: 4, type: "char[4]", name: magic, value: "PAK\\0", level: proven}
  - {at: 4, size: 2, type: u16, name: byte_order_mark, value: "0xFEEB", level: proven, note: "the same in every PAK"}
  - {at: 6, size: 2, type: u16, name: version, value: "4", level: proven}
  - {at: 8, size: 4, type: u32, name: entry_count, level: proven}
  - {at: 12, size: 4, type: u32, name: string_table_size, level: proven, note: "bytes of names between the entry table and the data"}
```

The entry table follows at offset 16 (`16 + 32 × entry_count`), then the string table, then the data. The string table holds every name once as a zero-terminated string and the longest name is 137 characters. :proven[all 336 PAKs]
The executable's own reader does not check the magic or the version; they are the values every PAK carries. :observed

## Entry

```layout
title: PAK entry
size: 32
games: [shred]
note: A section marker precedes the entries it opens.
fields:
  - {at: 0, size: 4, type: u32, name: hash, level: proven, note: "sdbm of the name bytes, see Names and hashes"}
  - {at: 4, size: 4, type: u32, name: name_offset, level: proven, note: "from the start of the string table"}
  - {at: 8, size: 4, type: u32, name: attributes, level: proven, note: "flag value 1 section marker, 2 compressed (CSTR); the values on the disc are 0, 1 and 2"}
  - {at: 12, size: 4, type: u32, name: alignment, level: observed, note: "0, 16, 64 or 128; the allocation alignment the loader asks for"}
  - {at: 16, size: 4, type: u32, name: offset, level: proven, note: "of the payload from the start of the file"}
  - {at: 20, size: 4, type: u32, name: size, level: proven, note: "uncompressed bytes"}
  - {at: 24, size: 4, type: u32, name: compressed_size, level: proven, note: "stored bytes of a compressed entry, otherwise 0"}
  - {at: 28, size: 4, type: u32, name: loaded_offset, level: observed, note: "0 on the disc; the loader writes it when it materialises a section"}
```

The three attribute values divide the 67,320 entries into 2,744 section markers (`1`), 33,349 plain entries (`0`) and 31,227 compressed entries (`2`). :proven[all 336 PAKs]
A plain entry is stored as it is, `size` bytes at `offset`; a compressed entry occupies `compressed_size` bytes there and decodes to `size` bytes ([CSTR streams](/engines/rme/archives/cstr/)). :proven[all 336 PAKs]
Offsets add up exactly: the entries follow the string table without a gap, and over all 336 PAKs they tile the file to its last byte. :proven[all 336 PAKs]

The executable's reader rejects section markers when it opens a file, picks the compressed-stream wrapper when bit 1 is set, and passes the alignment word to its allocator, with values `0x10`, `0x40` and `0x80` meaning 16, 64 and 128 bytes. :observed[static reading of the executable]
Of the 63,175 entries with a nonzero alignment 59,206 are not aligned in the file, so the word is not a file layout rule. :observed
The alignment values over the disc are `0` for the 2,744 markers, 16 for 63,175 entries, 64 for 81 and 128 for 1,320. :proven[all 336 PAKs]
The executable's lookup also uses the flag value 4 as a loader state; no entry on the disc has it set. :observed

## Sections

A section marker is an entry with attribute `1`, no extension, size 0 and compressed size 0; it names the section that the entries after it belong to, up to the next marker. :proven[all 336 PAKs]

| Section | PAKs with it | Entries (excluding markers) | Holds |
|---|---:|---:|---|
| `MAIN` | 336 | 5,969 | `.scp`, `.mlp`, `.mmp` of the level; textures, animation, other `.bin` files |
| `LOCAL` | 325 | 624 | `.mgp` of the level (extra vertex attributes), a few textures |
| `SHADERS` | 324 | 2,854 | `.shp`, `.psp`, `.vsp` shader programs |
| `TEXTURES_PREFETCH` | 324 | 19,884 | `.thp` headers and `.txp` pixels of the small mip levels |
| `TEXTURES_STREAMED` | 324 | 25,962 | `.thp` and `.txp` of the textures |
| `PHYSICS` | 219 | 482 | `.hkw` Havok files |
| `ROBOTRAX` | 219 | 633 | `.bin` files |
| `ACTORS_MAIN`, `ACTORS_LOCAL`, `ACTORS_PREFETCH` | 219 each | 126, 42, 5,478 | the same kinds as the level's own sections, for actors |
| `CACHE_MOVIES`, `CACHE_TEXTURES`, `CACHE_MAIN`, `CACHE_LOCAL` | 3, 3, 2, 1 | 33, 722, 426, 88 | `.gfx` Scaleform movies, textures |
| `CHARACTERS`, `ENVIRONMENTS`, `ACTORS`, `ICE_PROGRAMS`, `LENS_FLARE`, `EFFECTS` | 2, 1, 1, 1, 1, 1 | 778, 2, 2, 286, 23, 162 | texture, material-bank, `.ice` and effect files |

The counts are over the 336 PAKs. :proven[all 336 PAKs] The executable's section loader names `SHADERS`, `TEXTURES_PREFETCH`, `MAIN` and `LOCAL`; what the remaining sections mean is read from their names and contents. :inferred

A texture appears in `TEXTURES_PREFETCH` and `TEXTURES_STREAMED` under the same name: the prefetch copy is its small mip levels. :observed

## Names and hashes

An entry's name is a lower-case path with backslash separators and its extension kept, for example `anim\actor_male\actor_male`. All 64,576 non-marker names contain a backslash and none contains an upper-case letter or a forward slash.
The names of section markers are upper-case words. :proven[all 336 PAKs]

The hash is **sdbm** of the name's bytes, as stored, with no case change or separator change:

```
h = 0
for each byte c of the name: h = (h * 65599 + c) mod 2^32
```

It matches the stored hash of all 67,320 entries, markers included. :proven[all 336 PAKs]
Five entries have no extension; the others carry one of 19 extensions: `.txp` 28,046, `.thp` 27,446, `.shp` 1,508, `.bin` 1,341, `.qsa` 1,142, `.psp` 765, `.vsp` 743, `.scp`, `.mlp`, `.mmp` and `.mgp` 657 each, `.hkw` 482, `.ice` 286, `.dwa` 76, `.gfx` 59, `.acs` 42, `.mbp` 3, `.mdp` 3 and `.lfx` 1. :proven[all 336 PAKs]
The executable looks entries up by hash (`0x003a5ebc`) and by name (`0x003a59f4`) and prefixes its PAK filesystem paths with `PAK:` or `PAKh:`. :observed

A name is not unique within a PAK: 25,365 names occur in two sections (a texture's prefetch and streamed copies), and 3 occur twice inside one section. :observed
The game's level files use the same hash for their own names (spots and splines). :observed

## Scripts

`SCRIPTS.SDAT` is an NPD-wrapped file that the RPCS3 emulator decrypts without any key to a PAK of this format: 1,282 entries, four section markers and 1,278 compiled Lua 5.1 scripts, 252 of them in CSTR streams. :observed
The scripts are not decompiled; their constants were parsed from every chunk. :observed

:::open[What does the offset of a section marker mean?]
A marker has zero sizes and, in the entries inspected, an offset equal to the start of the entry after it. The loader's use of that field is not traced.
:::

:::open[Which names occur twice in one section?]
Three names do so on the disc; whether the engine keeps the first or the last was not checked.
:::
