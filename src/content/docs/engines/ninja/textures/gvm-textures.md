---
title: GVM textures and how a landtable binds them
description: "The PRS-compressed GVM texture archives of Sonic Adventure 2: Battle, their header, the texture list of a landtable, and the three rules by which a texture name finds its picture."
sources:
  - title: X-Hax SA Tools (ArchiveLib, TextureLib)
    url: https://github.com/X-Hax/sa_tools
    note: PuyoFile (GVM) and GvrTexture readers; the formats used by SA2's stage archives are CMPR/DXT1 and RGB5A3
---

Textures are GVM archives: a `GVMH` header and a series of `GVRT` textures (the GameCube format), PRS-compressed on disc (`landtxNN.prs`, `bgtexNN.prs`, ...). The only pixel formats the stage
archives use are CMPR (DXT1-like) and RGB5A3. :sourced[SA Tools]

Counts are from a recorded census of the USA disc `GSNE8P`; they cannot be re-checked now. :observed

## GVMH header

```layout
title: GVMH archive header
size: variable
games: [sa2b]
note: "The header size is little-endian, the other fields big-endian. After the header come the GVRT textures."
fields:
  - {at: 0, size: 4, type: "char[4]", name: magic, value: "GVMH", level: observed}
  - {at: 4, size: 4, type: u32, name: header size, level: observed, note: "little-endian"}
  - {at: 8, size: 2, type: u16, name: flags, level: observed, note: "big-endian: 1 global index, 2 dimensions, 4 format, 8 name"}
  - {at: 10, size: 2, type: u16, name: entry count, level: observed, note: "big-endian"}
  - {at: 12, size: variable, type: "entry[]", name: entries, level: observed, note: "per entry u16 id, then (flags & 8) char[28] name, (flags & 4) u16 format, (flags & 2) u16 dimensions, (flags & 1) u32 global index"}
```

## The texture list

A landtable has two texture fields: a texture-archive name at `+0x18` and an `NJS_TEXLIST*` at `+0x1C`; material texture ids index the list. A texlist is `NJS_TEXLIST { NJS_TEXNAME* textures; u32 nbTexture }`
with `NJS_TEXNAME { char* filename; u32 attr; u32 texaddr }`. :observed

| Evidence | Count |
|---|---|
| Landtables whose archive field names a file on the disc, and whose texlist names equal the archive's GVM entry names at every index | 84 of 86 |
| The two exceptions (stg29 and stg56 both use `landtx29`): the GVM has 25 entries, the texlist 26, and 18 names match at the same index | 2 |
| Landtables with no archive field: stg03, stg15, stg52, stg53, stg55, stg58 | 6 |
| Archive field names a file that is not on the disc (`landtx22_uv`, `_x`, `_poison`, `_light`, `_ani`, `_tani`) | 9 |

All :observed. These sub-landtables find all their texlist names in the `bgtexNN` archive; each `bgtexNN` name appears as a string in that stage's REL. stg03's texlist is exactly `landtx03` (24
names) followed by `landtx03_suimen` (14 names), and both names appear as strings in stg03's REL. :observed

## Binding by name

The following rule binds every case on the disc (the game's own loader was not read): a texlist name is looked up by exact, case-insensitive name in this order. :observed

1. **Pointer**: the archive named by the landtable's own field. 2,831 of 3,121 texlist entries. :observed
2. **Identity** (only when there is no archive field): a GVM whose name list equals the texlist, or two GVMs whose lists concatenated equal it. 211 entries; this resolves stg52, 53 and 55 uniquely.
   For stg15, `landtx15.prs` and `landtx20.prs` are byte-identical. :observed
3. **Module string**: GVMs whose file name occurs as a NUL-terminated string in the stage module. 76 entries; a name found in several with different pixel data stays unresolved. :observed

3,118 of 3,121 texlist entries are bound this way. The 3 that are not are `miu256_cg001` in stg29 and stg56, and `miu64_ig008` in stg58, which exists with different data in two archives. :observed
How the game's loader binds a texlist to loaded textures was not read from code. :unknown

:::open[How does the game bind a texlist to the loaded textures?]
The rule above is consistent with every case on the disc but was not read from the engine's code.
:::
