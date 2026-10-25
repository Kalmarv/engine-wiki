---
title: String tables (.str)
description: The localised string tables of Forza Horizon 6, their layout, the key hash, and how car names link to car archives.
---

The game's text is stored in plain, unencrypted tables: `media\Stripped\StringTables\<LANG>.zip` holds one `.str` file
per table, in ordinary deflate zips. There are 24 languages (BR CHS CHT CZ DE DK EL EN ES FI FR GB HU IT JP KO MX NL NO
PL PT RU SV TR); English has 290 tables plus a `_list.txt` that names them, a few languages 289. :observed The text is
stored uncompressed as UTF-8; the high entropy is the hash tables. :observed

All figures on this page are from a recorded census of a build no longer installed. :observed

## Layout

```layout
title: String table (.str)
size: variable
games: [fh6]
note: "Little-endian. Two sections of the same shape, the texts first and then the keys; both list the same hashes in the same order."
fields:
  - {at: 0, size: 1, type: u8, name: zero, value: 0, level: observed}
  - {at: 1, size: 1, type: u8, name: eight, value: 8, level: observed, note: "every file"}
  - {at: 2, size: 128, type: "char[]", name: table name, level: observed, note: "NUL padded to offset 0x82"}
  - {at: 130, size: 2, type: u16, name: version, value: 2, level: observed}
  - {at: 132, size: 4, type: u32, name: text section offset, value: "0x8C", level: observed, note: "absolute"}
  - {at: 136, size: 4, type: u32, name: key section offset, level: observed, note: "= text section offset + 12 + text section size"}
```

```layout
title: String table section
size: variable
games: [fh6]
fields:
  - {at: 0, size: 4, type: u32, name: size, level: observed, note: "= count × 8 + string bytes"}
  - {at: 4, size: 4, type: u32, name: string bytes, level: observed}
  - {at: 8, size: 4, type: u32, name: count, level: observed}
  - {at: 12, size: "8 × count", type: "entry[]", name: entries, level: observed, note: "u32 hash, u32 offset into the string bytes"}
  - {at: "12 + 8 × count", size: "string bytes", type: "char[]", name: strings, level: observed, note: "NUL-terminated UTF-8"}
```

The key section's strings are the string ids (for example `IDS_DisplayName_1282`); the text section's are the texts.
:observed

## Key hash

The hash of a key is `h = 0xFFFFFFFF; for each UTF-8 byte c: h = rotl32(h ^ c, 7)`. :observed Over all 6,953 `.str` files
of all 24 languages: every file walks to its exact end, every string is strict UTF-8, the strings cover every byte of
every string blob, keys are unique per table, and 1,438,048 of 1,438,048 entry hashes equal the formula. :observed

## Car names

`Data_Car.str` holds two keys per car, `IDS_DisplayName_<carId>` (the model name: "240SX", "Acty") and
`IDS_ModelShort_<carId>` (the short label, usually with make and sometimes a year: "Nissan 240SX '93"). The `carId` is
the one in the car's [`.carbin`](/engines/forzatech/gameplay/carbin/). :observed There are 682 car archives with 682
distinct car ids, and all of them hit both keys with no table id left over. :observed

Other tables are keyed by database row ids, not by anything in the car files:

| Table | Content | Linkable from plain files | Confidence |
|---|---|---|---|
| `List_CarMake.str` | 94 makes (`IDS_DisplayName_<makeId>`, `IDS_Profile_<makeId>`) | no: no plain file stores a car's make id | :observed |
| `Upgrades.str` | 248 upgrade names and descriptions (`IDS_Name_<n>`) | no: neither the part id, the part enum nor the carbin level is that `n` | :observed |
| `UpgradeTypes.str` | 53 upgrade type names; numbers the same parts 38, 25, 24 ... where the part enum has 2, 9, 34 ... | no | :observed |

A car's year appears nowhere in plain files; the year in a file name does not always agree with the year in the
short label (`NIS_240SX_94` is "Nissan 240SX '93"). :observed The link from car to make, year and part names is in the
encrypted [game database](/engines/forzatech/archives/encrypted-files/). :inferred
