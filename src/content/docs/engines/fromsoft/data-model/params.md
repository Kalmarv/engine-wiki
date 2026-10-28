---
title: PARAM tables and regulation
description: Parameter containers, external row definitions and NPC display-mask layouts.
sources:
  - title: Paramdex
    url: https://github.com/soulsmods/Paramdex
  - title: SoulsFormatsNEXT PARAM and regulation decryption
    url: https://github.com/soulsmods/SoulsFormatsNEXT
  - title: Smithbox
    url: https://github.com/vawser/Smithbox
    note: Ships Paramdex definitions with regulation-version fields, community enum names and earlier Elden Ring regulations
implementations:
  - name: fromsoft-formats PARAM reader
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/param.rs
  - name: fromsoft-formats paramdef reader
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/paramdef.rs
---

A PARAM is a numbered table of fixed-width rows. The file names its param type and data version, but does not carry
the definitions of individual row fields. Paramdex supplies community definitions of those fields for each game
and revision. :sourced[Paramdex]

| Game | Container | Confidence |
|---|---|---|
| Sekiro | `param/gameparam/gameparam.parambnd.dcx` in the archives | :observed{games="sekiro"} |
| Elden Ring | `regulation.bin` beside the executable | :observed{games="elden-ring"} |

## Shared PARAM envelope

Both games' params use little-endian integers, 64-bit row offsets, an offset to the ASCII param-type name and UTF-16
row names: 135 of Sekiro's 138 params and all 194 of the installed Elden Ring 1.17.3 regulation. Every byte of each
is accounted for by the header, the row index, the rows, the strings and zero padding at the end of the file, with no
gap between parts. :proven{games="sekiro elden-ring"} The same holds for all 5,489 params of the 29 Elden Ring
regulations examined (the installed release and 28 earlier ones). :observed{games="elden-ring"}

The file ends after the last string with 0, 2 or 8 zero bytes. Two follow the shared empty row name. Where no row has a
name, 8 follow the param type in 161 Elden Ring params (the five single-row `*CommonParam` types of each of the 29
regulations, and `RuntimeBoneControlParam`'s 1,465 rows in the 16 earliest regulations) and in five single-row Sekiro
params, and none follow it in 58 Elden Ring params (`NetworkParam` and `SpeedtreeParam` in each regulation) and 7
Sekiro. :observed{games="sekiro elden-ring"}

Row names are not stored as text in these params. In every param of this form either no row has a name offset (219
Elden Ring params, 12 Sekiro) or every row has the same non-zero offset, which points at one empty UTF-16 string after
the param type. None of the 4,323,743 name slots of the 29 Elden Ring regulations and Sekiro's 135 params names a
non-empty string. The names people use come from community lists. :observed{games="sekiro elden-ring"}

```layout
title: PARAM header (the 0x85 form of both games)
size: 64
fields:
  - {at: 0, size: 4, type: u32, name: strings offset, level: sourced, note: Individual string pointers remain authoritative}
  - {at: 4, size: 2, type: u16, name: padding, level: proven, value: 0}
  - {at: 6, size: 2, type: u16, name: unknown, level: unknown, note: "0, 1 or 2; fixed per param type (the same in all 29 Elden Ring regulations); 2 only in BehaviorParam and BehaviorParam_PC of both games, 1 in NpcParam"}
  - {at: 8, size: 2, type: u16, name: data version, level: proven}
  - {at: 10, size: 2, type: u16, name: row count, level: proven}
  - {at: 12, size: 4, type: u32, name: padding, level: proven, value: 0}
  - {at: 16, size: 8, type: u64, name: param type string offset, level: proven}
  - {at: 24, size: 20, type: "u8[20]", name: padding, level: proven, value: 0}
  - {at: 44, size: 1, type: u8, name: big endian, level: sourced, note: Zero in every param examined}
  - {at: 45, size: 1, type: u8, name: format flags 1, level: sourced, note: "0x85 in every Elden Ring param and in 135 of 138 Sekiro params; 0x80 offset param type, 0x04 long data offset (SoulsFormatsNEXT); the 0x01 bit is unexplained"}
  - {at: 46, size: 1, type: u8, name: format flags 2, level: sourced, note: "0x07 in the same params; bit 0 selects UTF-16 names"}
  - {at: 47, size: 1, type: u8, name: unknown, level: unknown, note: "Zero in all 5,627 params examined; not the definition's format version"}
  - {at: 48, size: 8, type: u64, name: row data start, level: proven}
  - {at: 56, size: 8, type: u64, name: padding, level: proven, value: 0}
```

```layout
title: PARAM row index entry (the 0x85 form)
size: 24
fields:
  - {at: 0, size: 4, type: i32, name: row ID, level: proven}
  - {at: 4, size: 4, type: u32, name: padding, level: proven, value: 0}
  - {at: 8, size: 8, type: u64, name: row data offset, level: proven}
  - {at: 16, size: 8, type: u64, name: row name offset, level: proven, note: "Zero means no name; the offset is one shared empty string in these params"}
```

The byte at offset 47 is zero in every param of both games, including the params whose Paramdex definition carries a
format version other than 0: 106 or 203 in Elden Ring, 106, 201 or 202 in Sekiro. The definition's format version is
not stored in the file. :proven{games="sekiro elden-ring"}

### The 32-bit form

Three Sekiro params, `default_AIStandardInfoBank`, `default_EnemyBehaviorBank` and `MenuColorTableParam`, use an older
form. :observed{games="sekiro"} Format flags 1 is 0x01 (the first two) or 0x02 (the last), flags 2 is 0. The param type is a
32-byte inline string at offset 12, padded with spaces. Row entries are 12 bytes from offset 48: row ID, row data
offset, row name offset. The 16-bit value at offset 4 is the offset of the first row's data. Every row is named, with
Shift-JIS text, 143 names in the three params (40, 22 and 81 rows); the rows are 128, 128 and 4 bytes. :observed{games="sekiro"}

### Row sizes from definitions

A definition's row size is the sum of its fields in order, with a bit field taking a container of its declared width
(`u8` one byte, `u16` two, `u32` four): consecutive bit fields of the same declared width share a container while their
bits fit, and a `dummy8` bit field shares the byte of a `u8` one. Under this rule the Paramdex definition's size equals
the file's row size for every param of the installed Elden Ring regulation (194 of 194) and of Sekiro's gameparam (135
of 135 in the 64-bit form), and for all 5,489 params of the 29 Elden Ring regulations when the definition is taken at
the regulation's version (below). :proven{games="elden-ring"} :observed{games="sekiro"}

The bit positions of the rule are confirmed by the data. In `DecalParam`, whose 32-bit flag word holds a four-bit
`pad_05` straddling a byte boundary, the rule leaves every padding bit zero in all 488 Elden Ring and 205 Sekiro rows;
placing bit fields byte by byte so that none straddles a byte boundary moves ten fields and puts non-zero bits into
`pad_05` in 347 and 113 of them. Across all params of the two installs, the 238 `dummy8` bit fields are zero in every row
under the container rule except one in Sekiro's `AtkParam_Npc`, whose two-bit padding field has its lower bit set in 22
of 2,396 rows.
:observed{games="sekiro elden-ring"}

### Typing rows with a definition

A definition belongs to a param by the param type string of the file's header, not by the name of the binder member:
the 194 members of the installed Elden Ring regulation have 160 distinct param types, and 11 types are shared by 45
members (`WWISE_VALUE_TO_STR_CONVERT_PARAM_ST` by 13, the two draw-distance scale types by 7 each,
`GRASS_TYPE_PARAM_ST` and `KEY_ASSIGN_PARAM_ST` by 3). :observed{games="elden-ring"} Paramdex states that its file names
are arbitrary and that a definition is applied by its metadata. :sourced[Paramdex]

Smithbox's copy of Paramdex's definitions, laid out by the container rule at the binder's regulation number, types every
param of every regulation examined: the 194 params of the installed Elden Ring regulation (179,358 rows), 135 of Sekiro's
138 (36,083 rows; the three 32-bit-form params are not read) and all 5,295 params of the 28 earlier Elden Ring regulations
(4,137,031 rows). In every row each text field decodes (`fixstr` as Shift-JIS, `fixstrW` as UTF-16, each ending at its
first NUL) and no bit that the definition does not declare is set. A second decoder written separately (its own XML,
PARAM header, layout and value code) gives the same value for every field of every row of all 5,624 params.
:observed{games="sekiro elden-ring"}

The upstream Paramdex repository (the March 2026 head) has no `FirstVersion` or `RemovedVersion` in its Elden Ring or
Sekiro definitions; only its Nightreign definitions carry them. Its Elden Ring definitions give the installed row size for
188 of the 194 params. The six that differ each give a smaller row than the installed regulation: `BUDDY_PARAM_ST` (96 against 160), `CHR_MODEL_PARAM_ST` (12 against 16), `GAME_SYSTEM_COMMON_PARAM_ST`
(800 against 1,024), `POSTURE_CONTROL_PARAM_WEP_RIGHT_ST` (112 against 144), `SIGN_PUDDLE_PARAM_ST` (32 against 48) and
`SOUND_CUTSCENE_PARAM_ST` (32 against 36). Its Sekiro definitions give the row size of all 135 params. :observed{games="sekiro elden-ring"}

Every bit field in the Elden Ring and Sekiro definitions has the type `u8`, `u16`, `u32` or `dummy8`; none is signed.
:observed{games="sekiro elden-ring"}

## NpcParam

Every row's ID and all 32 `modelDispMask` bits in both examined NPC tables match an independent SoulsFormats decode
using the corresponding Paramdex definition. This does not validate the meanings of every other row field. :proven

| Property | Sekiro | Elden Ring | Confidence |
|---|---|---|---|
| Param type | `NPC_PARAM_ST` | Same | :proven |
| Data version | 14 | 9 | :proven |
| Row size | 896 bytes | 736 bytes | :proven |
| Masks 0–15 | Bytes 334, 335 | Bytes 330, 331 | :proven |
| Masks 16–31 | Bytes 338, 339 | Bytes 334, 335 | :proven |

The bits select a model's marked meshes; the enemy placement supplies the NPC row. See
[character parts and masks](/engines/fromsoft/data-model/character-parts/). :sourced[SoulsFormatsNEXT]

The Elden Ring layout (data version 9, 736-byte rows, mask bytes 330, 331, 334 and 335) is the layout of
`NPC_PARAM_ST` in all 29 regulations examined, from 1.00.0 to 1.17.3; all four bytes carry set bits in each. A row's mask
is the same in every regulation that has the row for 7,034 of the 7,045 rows of 1.17.3. :observed{games="elden-ring"}

## GrassTypeParam

`GRASS_TYPE_PARAM_ST` has 276-byte rows (data version 1) in Elden Ring's three grass params and 244-byte rows (data
version 6) in Sekiro's one. The fields up to byte 244 are at the same offsets: `lodRange` at 0, `baseDensity` at 8, the
model name at 12 (16 UTF-16 characters), the flat texture name at 44 and the billboard texture name at 108 (32
characters each), `spacing` at 204 and `simpleModelName` at 212. Elden Ring adds a second 16-character model name,
`model1Name`, at 244. :observed{games="sekiro elden-ring"} Read this way, all 166 Sekiro rows and all 632 Elden Ring rows
have only printable ASCII in their name fields. :observed{games="sekiro elden-ring"} `lodRange` is signed in Sekiro,
where 5 rows hold -1; no Elden Ring row has the sign bit set. :observed{games="sekiro elden-ring"}

:::open[Which fields moved between regulations beyond the checked ones?]
Row sizes and data versions are known for every param of every regulation examined (below), and the NPC masks were read
in all of them. Whether the offsets of other fields stay put between regulations is checked only where a definition
changes size; the checks of the outfit fields (character parts) and grass types are on the installed release.
:::

:::open[What is the 16-bit value at offset 6?]
It is 0, 1 or 2, constant for a param type across all 29 regulations (1 in `NPC_PARAM_ST`, 2 in the behavior params of
both games). Nothing in the examined readers depends on it.
:::

## Elden Ring

### Regulation

:only[elden-ring] Regulation uses AES-256-CBC, with the first 16 stored bytes supplying the IV; decrypted bytes hold
a DCX envelope around a binder. Public decryption material is supplied by SoulsFormatsNEXT.
:sourced[SoulsFormatsNEXT]{games="elden-ring"} One key decrypts the installed regulation and 28 earlier ones (1.00.0 to
1.17.3), which hold 185 params (1.00.0 to 1.06), 186 (1.07 to 1.10) and 194 (1.12.1 on). The envelope is DFLT through 1.10
and ZSTD from 1.12.1. :observed{games="elden-ring"}

The binder's eight version bytes are the regulation number in ASCII digits, such as `11730034` for 1.17.3; this equals the
number in the release's name for all 29 files. :observed{games="elden-ring"} Paramdex's `FirstVersion` and `RemovedVersion`
on a field are these numbers: a field is in the row from the regulation named by `FirstVersion` and not from the one
named by `RemovedVersion`. Taking each definition at the regulation's number reproduces the file's row size for all 5,489
params of the 29 regulations; ignoring the numbers does so for 4,653. The definition's data version is a weaker guide:
it differs from the file's in 10 of the installed release's 194 params (`CHR_EQUIP_MODEL_PARAM_ST` is 1 in the file and 2 in
the definition) and in 151 of the 5,489 params of the 29 regulations, while the row size matches in every one of them. In Sekiro the definition's data version equals the file's for all 138 params. :observed{games="elden-ring"}

The data version and the row size change independently between regulations. Of the 18 changes seen between consecutive
releases, 3 moved both, 7 moved only the row size and 8 only the data version. :observed{games="elden-ring"}

| Param type | Regulation seen first | Data version | Row size |
|---|---|---|---|
| `ASSET_GEOMETORY_PARAM_ST` | 1.02.1, 1.07 | 3 to 4, 4 to 6 | 320 |
| `BONFIRE_WARP_PARAM_ST` | 1.03.1 | 6 | 168 to 236 |
| `BUDDY_PARAM_ST` | 1.08 | 2 | 96 to 160 |
| `CHR_MODEL_PARAM_ST` | 1.06, 1.12.1 | 2 to 3 (1.12.1) | 12 to 16 (1.06) |
| `EQUIP_PARAM_WEAPON_ST` | 1.02.1 | 5 to 6 | 648 to 664 |
| `GAME_SYSTEM_COMMON_PARAM_ST` | 1.02.1, 1.07, 1.12.1 | 2 to 3 (1.02.1) | 800 to 880 (1.07), 880 to 1024 (1.12.1) |
| `MAP_DEFAULT_INFO_PARAM_ST` | 1.02.1 | 4 to 6 | 64 |
| `OBJ_ACT_PARAM_ST` | 1.12.1 | 2 to 3 | 96 |
| `POSTURE_CONTROL_PARAM_WEP_RIGHT_ST` | 1.12.1 | 1 | 112 to 144 |
| `SIGN_PUDDLE_PARAM_ST` | 1.12.1 | 1 to 2 | 32 to 48 |
| `SOUND_CUTSCENE_PARAM_ST` | 1.02.1, 1.05 | 2 to 5, 5 to 6 | 32 to 36 (1.05) |
| `WEATHER_ASSET_REPLACE_PARAM_ST` | 1.12.1 | 1 to 2 | 64 |
| `WORLD_MAP_POINT_PARAM_ST` | 1.03.1 | 6 | 192 to 256 |

The regulation columns give the first release that holds the new value; a change may have been made in any
earlier release between it and the previous one. Nine params exist only from a later regulation:
`FinalDamageRateParam` from 1.07, and from 1.12.1 `ChrEquipModelParam`, `MapGridCreateHeightDetailLimitInfo`,
`MapNameTexParam_m61`, `MapPieceTexParam_m61`, `MimicryEstablishmentTexParam_m61`, `SignPuddleSubCategoryParam`,
`SignPuddleTabParam` and `WeatherLotTexParam_m61`. :observed{games="elden-ring"}

### BonfireWarpParam

Each warp row names a target entity and an event. In 1.17.2, row 100008 names entity 10001958 and event 71008,
and row 61423700 entity 1042371950 and event 76111. :observed{games="elden-ring"}
