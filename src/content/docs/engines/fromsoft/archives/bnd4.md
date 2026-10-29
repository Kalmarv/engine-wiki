---
title: BND4 and split binders
description: File groups, optional names and IDs, compressed members, and BHF4/BDF4 pairs.
sources:
  - title: SoulsFormatsNEXT Binder formats
    url: https://github.com/soulsmods/SoulsFormatsNEXT/tree/master/SoulsFormats/Formats
implementations:
  - name: fromsoft-formats binder reader
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/binder.rs
---

A **binder** groups related files: a character's models, an animation set, or a map's collision. BND4 holds the index
and payload together; BHF4 holds an index whose payload is in a separate BDF4 file. The outer archive and any
[DCX envelope](/engines/fromsoft/archives/dcx/) are separate layers. :observed

Every top-level BND4 member of both installed archive sets decodes to the same bytes as SoulsFormats or
SoulsFormatsNEXT. The strict reader checks header constants, record sizes, names, IDs, payload bounds and byte
coverage for every top-level BND4 in both installs. This establishes the BND4 layouts below and member contents,
not the runtime purpose of every binder flag. :proven

## Header and member records

The header selects integer endianness, flag-bit ordering, name encoding and optional record fields. Names and signed
IDs are independently optional; a member need not have both. :sourced[SoulsFormatsNEXT]

```layout
title: BND4 header
size: 64
note: Integer byte order is selected at offset 9. Offsets are file-relative.
fields:
  - {at: 0, size: 4, type: "char[4]", name: magic, level: proven, note: BND4}
  - {at: 4, size: 2, type: "u8[2]", name: unknown booleans, level: unknown, note: Each is 0 or 1}
  - {at: 6, size: 3, type: "u8[3]", name: padding, level: proven, value: 0}
  - {at: 9, size: 1, type: u8, name: big endian, level: sourced}
  - {at: 10, size: 1, type: u8, name: bit ordering flag, level: sourced}
  - {at: 11, size: 1, type: u8, name: padding, level: proven, value: 0}
  - {at: 12, size: 4, type: u32, name: member count, level: proven}
  - {at: 16, size: 8, type: u64, name: header size, level: proven, value: 64}
  - {at: 24, size: 8, type: "char[8]", name: version string, level: sourced}
  - {at: 32, size: 8, type: u64, name: member record size, level: proven}
  - {at: 40, size: 8, type: u64, name: header end, level: proven}
  - {at: 48, size: 1, type: u8, name: Unicode names, level: sourced}
  - {at: 49, size: 1, type: u8, name: format flags, level: sourced}
  - {at: 50, size: 1, type: u8, name: extended mode, level: sourced}
  - {at: 51, size: 5, type: "u8[5]", name: padding, level: proven, value: 0}
  - {at: 56, size: 8, type: u64, name: hash table offset, level: sourced}
```

```layout
title: Member record
size: variable
note: Optional fields appear in the order listed; format flags are shown after bit-order normalization.
fields:
  - {at: 0, size: 1, type: u8, name: member flags, level: sourced, note: Bit 0 marks compression}
  - {at: 1, size: 3, type: "u8[3]", name: padding, level: proven, value: 0}
  - {at: 4, size: 4, type: i32, name: sentinel, level: unknown, note: Observed -1}
  - {at: 8, size: 8, type: u64, name: stored size, level: proven}
  - {at: 16, size: "8 if format & 0x20", type: u64, name: decoded size, level: sourced}
  - {at: after decoded size, size: "8 if format & 0x10 else 4", type: offset, name: payload offset, level: proven}
  - {at: after payload offset, size: "4 if format & 2", type: i32, name: member ID, level: proven}
  - {at: after member ID, size: "4 if format & 0x0c", type: u32, name: name offset, level: sourced}
  - {at: after name offset, size: "8 if format equals 4", type: "i32 + u32", name: alternate ID and zero padding, level: sourced}
```

Compressed members contain either zlib data or a DCX envelope. A decoded member may itself start with DCX; member
compression and an inner envelope are distinct. :observed Names are NUL-terminated UTF-16 when the Unicode flag is
set; the non-Unicode form is a narrow string. :sourced[SoulsFormatsNEXT]

### Format bytes and member flags in the installs

Walking every binder at any depth in the archives (Sekiro's 7,935 BND4 and BHF4 files, Elden Ring's 55,718) finds
three format bytes, and one member flag value. :proven[both archive sets, Elden Ring without the `DLC` pair]

| Format byte as stored | After bit-order normalization | Record size | Sekiro | Elden Ring |
|---|---|---:|---:|---:|
| `0x74` | `0x2E`: IDs, names, decoded size, 32-bit offsets | 36 | 7,928 (7,852 BND4, 76 BHF4) | 53,584 (51,588 BND4, 1,996 BHF4) |
| `0x54` | `0x2A`: IDs, one name flag, decoded size, 32-bit offsets | 36 | 7 | 2,132 |
| `0x70` | `0x0E`: IDs, names, 32-bit offsets, no decoded size | 28 | none | 2 |

Every member of both installs (84,074 in Sekiro, 527,404 in Elden Ring) stores the flag byte `0x40`, which is `0x02`
after normalization: no member has the compression bit set, and none has a bit above bit 1. The members that are
compressed are DCX envelopes in their own right, 19,244 in Sekiro and 45,809 in Elden Ring.
:proven[both archive sets, Elden Ring without the `DLC` pair] No binder has the format byte `0x04` that carries an
alternate ID.

### The name hash table

When the extended mode byte is 4, the header's hash table offset points at a table that finds a member by name.
It holds a group table and one hash per member. :proven[7,676 Sekiro and 53,547 Elden Ring binders]

```layout
title: BND4 name hash table
size: variable
note: "Little-endian. Present when the extended mode byte is 4."
fields:
  - {at: 0, size: 8, type: u64, name: hash entries offset, level: proven, note: "file offset of the hash entries, directly after the groups"}
  - {at: 8, size: 4, type: u32, name: group count, level: proven, note: "the smallest prime not below the member count divided by 7 (integer division)"}
  - {at: 12, size: 4, type: u32, name: constant, level: unknown, note: "bytes `10 08 08 00` in every table"}
  - {at: 16, size: "8 × group count", type: "Group[]", name: groups, level: proven, note: "member count u32, first hash entry index u32; groups are contiguous in order"}
  - {at: after groups, size: "8 × member count", type: "Hash[]", name: hash entries, level: proven, note: "path hash u32, member index u32; ascending by hash inside a group; the group is the hash modulo the group count"}
```

The hash is the base-37 hash of the [BHD5 archives](/engines/fromsoft/archives/bhd5-bdt/#path-hashes): `h = h × 37 + unit` over
the member's stored name with backslashes turned into forward slashes, a leading `/` added and ASCII letters
lower-cased, in 32 bits. The stored name is hashed whole, drive prefix included. It equals the stored hash for all
61,580 named members of Sekiro's 7,676 hashed binders and all 474,981 of Elden Ring's 53,547 (BND4 and BHF4 alike).
:proven[both archive sets, Elden Ring without the `DLC` pair] Every member of a hashed binder has a name, every member
index appears once, and the hashes are ascending inside each group. :proven[both archive sets] Folding ASCII letters
and lower-casing every letter give the same hash over these names, because none has a non-ASCII upper-case letter.
:observed

### Member IDs by binder kind

Reading a member by name needs no ID, but the IDs follow conventions that hold on every binder of a kind.
:proven[both archive sets]

| Binder | Member | ID | Games |
|---|---|---|---|
| `.chrbnd`, `.mapbnd`, `.geombnd`, `.objbnd`, `.partsbnd` | FLVER model | 200, then 201, 202 and so on for further models | both |
| `.mapbnd`, `.objbnd` | `_S.flver` (simplified model) | 1100, then 1101, 1102 | :only[sekiro] |
| `.mapbnd`, `.geombnd` | `.grass` | 1200 | :only[elden-ring] |
| `.mapbnd` | `.grass` | 1200 | :only[sekiro] |
| `.texbnd`, `.partsbnd`, `.objbnd` | `.tpf` | 100 | both |
| `.tpfbhd`, `.hkxbhd`, `.edgebhd`, `.wallbhd` | the split binders' files | the member's position in the file table | both |
| `.tpfbnd`, `.matbinbnd` | `.tpf`, `.matbin` | the member's position in the file table | :only[elden-ring] |

In `.objbnd` and `.partsbnd` binders the IDs of a second and later model count up from 200 and 1100.

### Where the parts and members sit

The parts of a binder follow each other in one order, whatever the format byte.
:proven[7,859 Sekiro and 53,722 Elden Ring BND4 binders, and the 29 binders of Elden Ring's `regulation.bin` files]

1. The 64-byte header, then one record per member from offset 64.
2. The names, directly after the records: NUL-terminated, in member order, with no gap between them and none shared.
3. Where there is a hash table, zero bytes up to the next multiple of 8, then the table. The byte after the last of these
   parts is the header's end, the field at offset 40.
4. The members in table order. A member that is not empty starts at the next multiple of 16 from the end of the one
   before (the first, from the header's end). An empty member starts where the one before ended, with no alignment, and
   the next member that is not empty aligns from there. Nothing follows the last member.

Rebuilding every one of these binders from its parsed fields (the header words, each record's flags, ID, name and
member size) by this rule gives the stored header region, every member offset and the file's length. Empty members occur: 87 of Sekiro's
binders hold one (136 empty `.txt` markers) and 559 of Elden Ring's (645 `.txt` and 3,164 `.ffxreslist` members), which is
what the empty-member rule is for. A member whose record states a decoded size states its stored size there when the
member is not marked compressed, a nested DCX envelope included, in all 611,113 members of both installs whose binders
have the field.
:proven[both archive sets, Elden Ring without the `DLC` pair]

## Divided binders

A character's animation binder can point at other binders that hold the rest of its files, by marker members named
`<id>_<set>` (`.txt` or `.blf`); the binder `/chr/<set>.anibnd.dcx` is in the archive. Sekiro's player (`c0000`) names seven this
way with `.txt` markers (`c0000_a000_hi`, `c0000_a000_lo`, `c0000_a000_md`, `c0000_a00x`, `c0000_a05x`, `c0000_a07x`, `c0000_a2xx`),
and no other of Sekiro's 142 character animation binders names any. :proven{games="sekiro"} In Elden Ring, 96 of the 567 character
animation binders hold `<id>_div00.blf`, `<id>_div01.blf` and so on (261 lists; 61 characters have two, 17 three, 9 four, 5 six,
3 five and 1 seven), each naming the binder `<id>_div<nn>.anibnd.dcx`; the player's binder names eleven by `.txt` markers, and two
further player markers name no binder of the archive. :proven{games="elden-ring"}

A `.blf` load list is text with CR LF line ends, `BLI3` on the first line and `#FILE_VERSION = 301` on the second, `//`
comment lines in Shift-JIS, and commands: a line `$<number>` and a line of six comma-separated fields, a path pattern in quotes
(a regular-expression dialect), three numbers, a file kind and a replacement in quotes. All 261 lists hold the same three commands:
`$1000000000`, the animation files (`_HKX`) of that division by a pattern over the animation numbers; `$6000000`, `div_data.txt`
(`_TXT`); `$9999999`, `ver_0001.txt` (`_TXT`); every number triple is `16, 2, 1`. :proven[all 261 lists] What the patterns and numbers
mean to the packager is not known. :unknown

## Split payload

BHF4 uses the same 64-byte header arrangement as BND4, with a zero field at offset 40. Its records point into BDF4,
while names and the lookup table remain in BHF4. Map `.hkxbhd`/`.hkxbdt` collision
pairs and `.tpfbhd`/`.tpfbdt` texture pairs use this arrangement. :observed

The index is laid out as above up to the end of its hash table, and the payload places the members by the same rule from
offset 48, where the header below ends. Both files end where their content does; the zero bytes after them in an
archive entry (up to 15) are the entry's own padding, which some entries have and others do not. Rebuilding all 76 Sekiro
and 1,996 Elden Ring pairs from their fields gives the index up to those zero bytes, every member offset and the payload's
length up to them. :proven[both archive sets, Elden Ring without the `DLC` pair]

```layout
title: BDF4 payload header
size: 48
fields:
  - {at: 0, size: 4, type: "char[4]", name: magic, value: BDF4, level: observed}
  - {at: 4, size: 2, type: "u8[2]", name: unknown booleans, level: unknown, note: Each is 0 or 1}
  - {at: 6, size: 3, type: "u8[3]", name: padding, value: 0, level: observed}
  - {at: 9, size: 1, type: u8, name: big endian, level: sourced}
  - {at: 10, size: 1, type: u8, name: bit ordering flag, level: sourced}
  - {at: 11, size: 5, type: "u8[5]", name: padding, value: 0, level: observed}
  - {at: 16, size: 8, type: u64, name: declared header size, level: proven, note: 48 in all 2,072 pairs}
  - {at: 24, size: 8, type: "u8[8]", name: version bytes, level: proven, note: "a copy of the index's version bytes (`07D7R6` in all 2,072 pairs)"}
  - {at: 32, size: 16, type: "u8[16]", name: padding, value: 0, level: observed}
```

:::open[What do the unknown binder booleans control?]
Their stored values are validated as booleans, but member-byte agreement does not establish their runtime meaning.
:::
