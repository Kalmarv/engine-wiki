---
title: Graphics parameters and environment selection
description: GPARAM groups, value IDs, time-of-day keys and unresolved file and volume selection.
sources:
  - title: SoulsFormatsNEXT GPARAM
    url: https://github.com/soulsmods/SoulsFormatsNEXT/blob/master/SoulsFormats/Formats/GPARAM.cs
  - title: Smithbox
    url: https://github.com/vawser/Smithbox
  - title: fromsoftware-rs (CSWorldSceneDrawParamManager)
    url: https://github.com/vswarte/fromsoftware-rs
implementations:
  - name: fromsoft-formats GPARAM reader
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/gparam.rs
---

GPARAM files describe graphics environments as named groups of typed fields. Fields hold arrays of values indexed
by value ID and, in version 5, time of day. Both examined games store version 5. :observed

Files live under `param/drawparam/`, for example `m11_01_0720.gparam.dcx` in Sekiro and `m10_00_0100.gparam.dcx` in
Elden Ring. Open-world tiles share prefixes such as `m60_00` and `m61_00` rather than placing tile coordinates in
these file names. :observed

## Structure

The magic is the eight bytes of UTF-16 `filt`. Groups carry keys, display names and field-offset lists; fields carry
their own keys, names, type, value count and offsets into value and value-ID arrays. :sourced[SoulsFormatsNEXT]

```layout
title: GPARAM version 5 header
size: 84
note: Little-endian absolute offsets to the major tables; records inside those tables can use base-relative offsets.
fields:
  - {at: 0, size: 8, type: "u16[4]", name: magic, value: filt, level: sourced}
  - {at: 8, size: 4, type: u32, name: version, value: 5, level: observed}
  - {at: 12, size: 1, type: u8, name: padding, value: 0, level: sourced}
  - {at: 13, size: 1, type: u8, name: time axis flag, level: observed, note: "non-zero: the time axis has period 24 and an offset (see Time of day)"}
  - {at: 14, size: 2, type: u16, name: padding, value: 0, level: sourced}
  - {at: 16, size: 4, type: u32, name: group count, level: sourced}
  - {at: 20, size: 4, type: u32, name: unknown, level: unknown, note: Named Unk14 by the reference reader}
  - {at: 24, size: 4, type: u32, name: group offset table offset, level: sourced}
  - {at: 28, size: 4, type: u32, name: group records offset, level: sourced}
  - {at: 32, size: 4, type: u32, name: field offset tables offset, level: sourced}
  - {at: 36, size: 4, type: u32, name: field records offset, level: sourced}
  - {at: 40, size: 4, type: u32, name: values offset, level: sourced}
  - {at: 44, size: 4, type: u32, name: value IDs offset, level: sourced}
  - {at: 48, size: 4, type: u32, name: opaque data offset, level: sourced}
  - {at: 52, size: 4, type: u32, name: extra record count, level: sourced}
  - {at: 56, size: 4, type: u32, name: extra records offset, level: sourced}
  - {at: 60, size: 4, type: u32, name: extra IDs offset, level: sourced}
  - {at: 64, size: 4, type: f32, name: unknown, level: unknown, note: Named Unk40 by the reference reader}
  - {at: 68, size: 12, type: "u32[3]", name: comment tables and text offsets, level: sourced}
  - {at: 80, size: 4, type: f32, name: time axis period, level: observed, note: "Unk50 to the reference reader; the period when the flag at 13 is 0"}
```

```layout
title: GPARAM group record
size: variable
fields:
  - {at: 0, size: 4, type: u32, name: field count, level: sourced}
  - {at: 4, size: 4, type: u32, name: field offset list, level: sourced, note: Relative to the field-offset-tables base}
  - {at: 8, size: variable, type: "u16[]", name: key then display name, level: sourced, note: Two consecutive NUL-terminated UTF-16 strings}
```

```layout
title: GPARAM version 5 field record
size: variable
fields:
  - {at: 0, size: 4, type: u32, name: value array offset, level: sourced, note: Relative to values base}
  - {at: 4, size: 4, type: u32, name: ID array offset, level: sourced, note: Relative to value IDs base}
  - {at: 8, size: 1, type: u8, name: field type, level: sourced}
  - {at: 9, size: 1, type: u8, name: value count, level: sourced}
  - {at: 10, size: 2, type: u16, name: unknown, level: unknown, note: Raw field header word}
  - {at: 12, size: variable, type: "u16[]", name: key then display name, level: sourced, note: Two consecutive NUL-terminated UTF-16 strings}
```

```layout
title: Version 5 value-ID entry
size: 8
fields:
  - {at: 0, size: 4, type: i32, name: value ID, level: sourced}
  - {at: 4, size: 4, type: f32, name: time of day, level: sourced}
```

Supported field types include signed and unsigned integers, floats, booleans, vectors, RGBA bytes and strings.
Two- and three-component float vectors occupy 16 bytes in the value array. :sourced[SoulsFormatsNEXT]

| Type code | Value | Stored bytes per value | Confidence |
|---|---|---|---|
| 1–4 | Signed integers, widths 8 / 16 / 32 / 64 | 1 / 2 / 4 / 8 | :sourced[SoulsFormatsNEXT] |
| 5–8 | Unsigned integers, widths 8 / 16 / 32 / 64 | 1 / 2 / 4 / 8 | :sourced[SoulsFormatsNEXT] |
| 9 / 10 | Float32 / Float64 | 4 / 8 | :sourced[SoulsFormatsNEXT] |
| 11 | Boolean | 1 | :sourced[SoulsFormatsNEXT] |
| 12–14 | Float vectors, 2 / 3 / 4 components | 16 | :sourced[SoulsFormatsNEXT] |
| 15 | RGBA, red first | 4 | :sourced[SoulsFormatsNEXT] |
| 16 | UTF-16 string | Variable | :sourced[SoulsFormatsNEXT] |

### Extra records

After the fields a file can list, per group, the value IDs whose stored values it means (SoulsFormats' `UnkParamExtra`): the
header gives the count of these records and their offset, and each names a group by its index. Version 3 records are 12 bytes,
without the word at 12. :sourced[SoulsFormatsNEXT]

```layout
title: GPARAM version 5 extra record
size: 16
fields:
  - {at: 0, size: 4, type: u32, name: group index, level: observed}
  - {at: 4, size: 4, type: u32, name: ID count, level: observed}
  - {at: 8, size: 4, type: u32, name: IDs offset, level: observed, note: "Relative to the extra IDs offset (header 60); that many i32 value IDs"}
  - {at: 12, size: 1, type: u8, name: created rows inactive, level: observed, note: "Non-zero: a value row created for a field the file lacks starts inactive"}
  - {at: 13, size: 1, type: u8, name: force value ID 0, level: observed, note: "Non-zero: the group's fields are looked up at value ID 0; 0 in every Elden Ring file"}
  - {at: 14, size: 2, type: u16, name: unknown, level: unknown}
```

Sekiro's `m11_01_0000` and `m11_01_0020` hold 23 records each: `LightSet` (group 0) lists the IDs 0, 100, 110 and 120 and
the tone map (group 4) the ID 0, and the `Bloom` record's word at 12 is 0 in one file and 1 in the other.
:observed[both files read byte by byte, agreeing with the reader]{games="sekiro"} Over 448 draw-parameter files of the Elden
Ring install, the bytes at 12 and 13 of a group's record (0 for a group with none) are (0, 0) for 11,048 of the 11,095 groups
and (1, 0) for 47; byte 13 is never set. :observed[an independent byte-level join over every installed extra table]{games="elden-ring"}

Both executables use the record when they load a file: :observed[read from the code of Elden Ring 2.7.2.0 and Sekiro 1.06]

- For a stored field, a value ID the group's list names takes the file's bytes, and any other takes the field's reference
  value; either way the value is then marked active. A value ID missing from the list is therefore not inactive: it stands
  at the reference value.
- When the game asks for a value ID the file lacks, every registered field of the group gets a new row from its reference
  value. The row starts inactive and is made active only when byte 12 is 0, so with byte 12 set a field the file lacks stays
  inactive and the [merge](#banks-and-layers) takes it from a lower bank.
- Byte 13, when set, makes the group's field lookups use value ID 0.

A field's reference value is a copy taken when the executable registers the field: the registration keeps a pointer to the
live field and a copy of its initial value, and the loader's fallback returns the copy, not the live field's current value
(a second operation writes the copy back through the pointer). :observed[read from the code of Elden Ring 2.7.2.0 and Sekiro 1.06]
Whether anything changes the copy after registration is not established. :unknown

## Part selectors

| Part graphics field | GPARAM group selected | Confidence |
|---|---|---|
| Light set | `LightSet ParamEditor` | :sourced[SoulsFormatsNEXT] |
| Fog | `FogParamEditor` | :sourced[SoulsFormatsNEXT] |
| Light scattering | `LightScattering : ParamEditor` | :sourced[SoulsFormatsNEXT] |
| Environment map | `Env Map:Editor` | :sourced[SoulsFormatsNEXT] |

These are value IDs within the active GPARAM, not names of GPARAM files. Collision scene data also stores four
signed bytes that Elden Ring's reference reader names as the base and override GPARAM sub-IDs, selecting hundreds
digits of file IDs. :sourced[SoulsFormatsNEXT]

### File IDs: slot and sub id

A draw-parameter file's four-digit ID is a *slot*, its hundreds digit, and a *sub id*, its last two digits. Every file of
both installs has a 0 as its first digit: the largest ID is 0930 in Sekiro and 0978 in Elden Ring. Sekiro's `m11_00` holds
0000, 0020 and 0030, then slots 1 to 9 with sub ids 0 and 20 (0100, 0120, 0200, 0220 and so on); `m11_01` holds 0000, 0010
and 0020, then 0100, 0120, 0200, 0220, 0300, 0320, 0400, 0420, 0600, 0700, 0710, 0720, 0740, 0750, 0800 and 0820.
:observed

Three things name an ID, each by these two numbers:

- A collision's scene block names one (next section): the first scene byte is the slot and, in Elden Ring, the byte at
  `+32` the sub id. The file of that ID exists for all 1,304 of Sekiro's collisions and for 3,209 of the 3,266 Elden Ring
  collisions (57 name a file their map's files lack; the 210 collisions of the 27 caves and tunnels, `m31` and `m32`, which use
  the catacombs' `m30_00` files, name one of them in 190 cases). :proven{games="sekiro"} :observed{games="elden-ring"}
- Sekiro's `2003:88` (the community calls it Set Area Gparam Sub ID) gives an area, a block, a sub id and a time in
  seconds. Its 43 calls, in 14 map scripts and the common script, name sub ids 0, 10, 20, 30, 40 and 50, and 35 of them
  name an area that has a file of exactly that number (`m11_00_0020` for sub id 20 of area 11 block 0); the other 8 name 40
  or 50 of `m11_01` and 30 of `m11_02`, which have no such file. :observed{games="sekiro"}
- Elden Ring's `2012:11` (Activate Gparam Override: a sub id and a time in seconds) and `2012:12` (Deactivate, a time).
  The 11 activations name 0, 1, 2, 3, 4 and 500; of the 10 that belong to a map's script, 6 name an existing file (0 in the
  open-world tiles, 500 in `m14_00`, which holds `m14_00_0500`); the other 4 name 1 in `m11_10` (whose only file is
  0000) and 4, 2 and 3 in `m20_01`, `m21_01` and `m25_00`, expansion maps, none of which has a file of that number (`m20_01` holds 0000, 0200 to 0600 and 0800, `m21_01`
  none, `m25_00` 0000 and 0100). There are 14 deactivations. :observed{games="elden-ring"}

Sekiro's `2003:81` (Set Lighting) takes a time of day, 1 to 5 (the community names them morning, noon, afternoon,
evening, night), and a time in seconds: 42 calls in 15 scripts. Whether the time of day is the slot (the map's files have
the slot `time of day - 1` in all 42 calls, and the slot `time of day` in 41) is not decided by that join.
:observed{games="sekiro"}

### Time of day

Sekiro's scripts set a time period, never an hour: `2003:81` (Set Lighting: the period as a byte, then a float) and `2002:13`
(Play Cutscene and Warp Player With Lighting: a period and a state). :proven[every event script of the install, each instruction
decoded against the community schema]{games="sekiro"} The community schema names the periods 1 morning, 2 noon, 3 afternoon, 4
evening and 5 night. :sourced[Smithbox]{games="sekiro"} The calls belong to story events: `m10_00`'s events 11005610, 11005640 and
11005800, `m11_01`'s 11110100 (night or morning), the opening event 11120110 of `m11_02` (night), and more in `m15`, `m20` and
`m25`. `2002:6` (Change Time Period) is in the schema, but no script of the install calls it. :proven[every event script of the
install]{games="sekiro"} No param definition maps a period to an hour, so that mapping is in the executable. :inferred{games="sekiro"}
The light sets of `m11_01_0000` key their values at the hours 0, 2, 4, 6, 12, 18 and 22, and set 0's `DiffColor0` at hour 0 is
(0, 0, 0, 1): no sun at midnight. :observed{games="sekiro"} Its `ColorGrading[Yebis]` `LutSourceId` stores value ID 0 at the
hours 0, 2, 6, 12, 18 and 22 as 0, 20, 0, 30, 0 and 20. :observed{games="sekiro"}

Elden Ring's scripts call `2001:4` (Set Current Time) 9 times in the 544 event scripts, each inside a story or NPC event and none
a clock the game starts with: `common.emevd` events 703 (23:45) and 910 (22:30), `m10_01` event 50 (23:45), `m18_00` events
18000021 and 18000022 (10:30), `m60_42_36_00` event 1042360710 (22:30), `m60_51_36_00` event 1051362220 and `m60_52_38_00` event
1252382860 (3:30), and `m61_46_40_00` event 2046402500 (8:00). :proven[every event script of the install]{games="elden-ring"} So no
data of the game states the hour a map is entered at. :inferred{games="elden-ring"} The hour reaches Elden Ring's sky programs as
`FC_TimeOfDay`, which Sekiro's programs do not read (see [what forward programs read](/engines/fromsoft/shaders/bundles/#what-forward-programs-read-from-the-frame)).

The game keeps this state in `CSWorldSceneDrawParamManager`: per area block an object holding two weather ids, an
override ID, a flag that an override is being transitioned to and its duration, and the manager holds sixteen
interpolators (`CSGparamIdLerper`: a destination ID, a begin ID and a timer) beside them. :sourced[fromsoftware-rs]{games="elden-ring"}

#### Looking up an hour

Both executables evaluate a field at an hour with one routine, all in `f32`: :observed[read from the evaluator's code in
Elden Ring 2.7.2.0 and Sekiro 1.06]

1. The file gives an axis offset `O` and a period `P`: when header byte 13 is non-zero, `P` is 24 and the axis has an
   offset; otherwise `O` is 0 and `P` is the float at offset 80. Files before version 5 have neither.
2. From the clock hour `t`: if `P` is not 0, subtract `P` while `t > P`; then `t -= O`, and add `P` if `t` is below 0.
3. The keys are searched in stored order, from the key found last time. A key `k` with `|t - k| <= 0.001` (`0x3A83126F`)
   gives its value with no blend. Otherwise the first key above `t` closes a blend from the key before it, at
   `w = (t - before) / (k - before)`.
4. Past the last key, a wrapping axis blends from the last key to the first at `w = (t - last) / ((P - last) + first)`, and a
   non-wrapping one takes the last key. Before the first key, a wrapping axis blends last to first at
   `w = t / ((P - last) + first)`: the weight leaves out the time from the last key to the axis's end, so the value is the last
   key's at the axis's 0 and jumps to the first key's there. A non-wrapping axis blends the first key with itself at
   `(t - first) / 0`.

Every Elden Ring file wraps with period 24; of the 102 files drawn at the Stormveil gate, 98 put the axis's start at 6.5 h and
4 at 7.0 h, so a key's time is the clock hour minus that offset. :observed{games="elden-ring"}

The blend of the two keys depends on the field's slot, chosen by the type the executable registers the field with (not the
type the file stores): :observed[the slot factory and the slots' code, Elden Ring 2.7.2.0 and Sekiro 1.06]

| Slot | Elden Ring | Sekiro |
|---|---|---|
| Float, integer, vector | Each field has an interpolate flag. Flag 1: `A` at `w <= 0`, `B` at `w >= 1` or when `A == B`, else `(1 - w)A + wB` in `f32`; integers go through `f32` and are truncated (`cvttss2si`: an `i32` out of range gives `INT_MIN`; a `u32` through a 64-bit truncation, its low 32 bits). Flag 0 (enums, counts, resolutions) takes `B` | No flag: every float, integer, vector and RGBA slot is `(1 - w)A + wB`, not clamped and with no equality test; RGBA per byte through `f32`, keeping the low byte of a 64-bit truncation |
| Enum (type 3, subtype 22) | The plain `i32` slot | The plain `i32` slot |
| Boolean | `B` | `B` |
| Subtype 25 (one float: `VolumetricFog Global HeightFogOffset`, Sekiro's `Fog-HeightOffset`) | A run-time value (beside the hour in the request) is added to both keys before the blend | the same |
| Subtype 23 (two floats: the light angles) | The directions `(sin ry cos rx, −sin rx, cos ry cos rx)` are slerped | the same |

The angle slot returns `A` at `w == 0`, `B` at `w == 1` or when every component differs by less than 2⁻²³, and otherwise turns
`B` toward `A` by `w` times the angle (`acos` of the normalized dot), with the game's own sine and cosine polynomial: `B` if
`B·A` exceeds the cosine, `A` if `|A − B(B·A)|² < 1e-4`, else `B·cB + n·cN` with `n` the normalized part of `A`
perpendicular to `B`. :observed[read from the code]{games="elden-ring"} Where the run-time value of subtype 25 is written is
not established. :unknown

Elden Ring 2.7.2.0 registers 415 field keys and Sekiro 1.06 340. Against every installed timeline with more than one key: Elden
Ring stores `ShadowParam Cascade Count` as `u32` (registered an `i32` enum) and `[GS]Lens Simulation Param  Enable` as `u32`
(registered `u8`); 13 keys that `m61_00_0000` stores at several hours are not registered, so the game never reads them; and
Sekiro's `VolumetricFog Global HeightFogReferenceOffset` and `ModeRate` (20 timelines each) are not registered either. Every
two-float timeline with more than one key, in both games, is a light angle. :observed[the registration tables read from both
executables, every installed file]

### The game's own tables

Elden Ring keeps three params that decide which draw-parameter file applies. The first is keyed by decimal map numbers, the
digits of the name run together (`30010000` is `m30_01_00_00`; the same form as the `Map ID` of the cutscene-warp
instructions, see [EMEVD](/engines/fromsoft/gameplay/emevd/#map-ids-in-arguments)); so are several others
(`MapDefaultInfoParam`'s 875 rows, `GparamRefSettingsParam`, the cutscene time and weather params).

- `GparamRefSettingsParam` (`GPARAM_REF_SETTINGS_PARAM_ST`, 32-byte rows, 70 rows): a map's row names in `RefTargetMapId` the map
  whose draw-parameter files it uses. 35 rows send the caves and tunnels (`m31_00` to `m31_22` and twelve of `m32_00` to `m32_12`, there being no `m32_06`) to
  `m30_00`; 20 send `m30_01` to `m30_20` to `m30_00`, 12 send expansion maps (`m21_01`, `m21_02`, `m40_01` ... `m43_01`) to
  their family's `_00`, one sends `m30_00` to itself, and two rows (`m99_99_00_01`, `m99_99_00_02`) hold -1. For each
  of the 68 rows with a target, the files that the map's own stem and its family's `mAA_00` give it in the install (the
  expansion archives included) are the target's. :observed{games="elden-ring"} The one base-game map with no row and no files of its own is `m11_72`,
  whose family `m11_00` has them. :observed{games="elden-ring"}
- `WeatherParam` (`WEATHER_PARAM_ST`, 68-byte rows, 162 rows): `GparamId` at `+20` is the number of the global weather set the
  weather uses. All 82 distinct values name a file `m00_00_<id>_weatheroutdoor` of the install, which holds 84 such files
  (the two no row names are 98 and 150). :proven{games="elden-ring"} So the `m00_00` weather files are chosen by the
  weather, not by the map.
- `WeatherLotParam` (`WEATHER_LOT_PARAM_ST`, 82-byte rows, 164 rows): sixteen `weatherType` entries (16-bit `WeatherParam` row IDs
  at `+4`) with sixteen `lotteryWeight` values (`+36`) and five time-zone bytes (`+68`). The 272 entries with a weight
  all name a `WeatherParam` row: 19 distinct rows, reaching 14 of the 82 file IDs. :observed{games="elden-ring"}

The event scripts name lots by ID (`IF Weather Lot Active`, `3:37`, 61 calls) and weathers (`Change Weather`, `2003:68`, 120
calls). How a lot is chosen for a map and an hour, and how the weather's file combines with the map's file, is not established.
:unknown{games="elden-ring"}

### Collision selectors

A collision's scene block (80 bytes at the part's `+120` slot) holds the selector bytes. In Elden Ring it holds a float
at `+16` (-1.0 on 3,236 of the 3,266 collisions, otherwise 0 to 7), four signed bytes at `+24`, the bytes `0xff` at `+28` and `0xff`, 0 or 1
at `+29`, and a byte pair at `+32` (255, 255 on 3,138 collisions; otherwise a value from 0, 10, 20, 21, 30, 31, 40, 41
and 42 and a 0). In Sekiro the four bytes sit at `+60` and a float follows them. :proven

Elden Ring's first selector byte (0 to 9 on 590 collisions; -1 on the rest) is the hundreds digit of a draw-parameter
file ID under the map's stem, with one rule needed for the stem:

| Collisions | First byte names a file of the map's own stem | of its family stem `mAA_00` | of no stem |
|---|---:|---:|---:|
| Dungeon maps (551 with a first byte) | 297 | 114 (108 in the `m30` catacombs, 5 in `m19`, 1 in `m11`) | 140 (101 in `m31`, 38 in `m32`, 1 in `m34_15`) |
| `m60` tiles (39), stem `m60_00` | 38 | n/a | 1 (value 5; no `m60_00_0500`) |

Trying all 10,000 IDs of every two-block stem of the install's layouts (and `m00_00`, `m61_00`) against the archive
finds no draw-parameter file for `m31_*`, `m32_*` or their `_00` family stems; 20 of 21 `m30` maps have none under their
own stem either. :proven{games="elden-ring"} The game's own table sends all of them to `m30_00` (below), and the first
selector byte of every one of the 139 collisions of `m31` and `m32` that stores one names a file `m30_00` holds (slots 2, 4,
5 and 9). :observed{games="elden-ring"}
In Sekiro the first byte alone is the slot: it is 0 to 9 on 398 of the 1,304 collisions (-1 on the other 906), and
`byte × 100` is a file of the map's stem for every one of the 398. A rule that takes the second byte as a tens digit
names an existing file for only 267 of the 588 collisions that store a selector. :observed{games="sekiro"}

In the overworld a second value appears. The collision type data holds a byte `GparamOverride` at `+0x35`: 255 on
3,225 collisions, otherwise 0, 1, 2, 3, 21, 31 or 41 on 41 collisions of `m60` tiles. The pair byte at `+32` of the
scene block takes exactly the values 10, 20, 21, 30, 31, 40, 41 and 42 (and 0), which are the two-digit file IDs of
`m60_00` (`m60_00_0010` and so on, 31 files in all), and on 40 of the 41 collisions with an override it restates it:
(override, scene byte) is (1, 10), (2, 20), (3, 30), (21, 21), (31, 31), (41, 41) or (0, 0); the other stores 255 in
the scene byte. :proven{games="elden-ring"} So the override and the scene byte are two encodings of one overworld file ID
(`m60_00_00BB`); how the game combines them with the hundreds-digit bytes is not established.

The draw-parameter files in the install are 446 in Elden Ring (47 `m` stems, 30 `s` stems) and 253 in Sekiro (37 `m`, 10
`s` stems). `m00_00` holds 93 in Elden Ring: `m00_00_0000`, 84 `weatheroutdoor`, 7 `commonevent` and 1 `weatherbase`
variants; no layout field names them. The open-world stems are `m60_00` (31 plain files and one `capturemap`) and
`m61_00` (41 files, present although the install holds no `m61` layout). :observed{games="elden-ring"}

In the running game (1.17.2, offline) a scan of its committed memory after the player respawned at the Stormveil main
gate (`m10_00`) finds draw-parameter names in two groups. For each of `m10_00` and `m34_10` there are ten names
`mAA_BB_0N00` for N = 0 to 9, including `m10_00_0700`, which the archive does not hold; and for `m00_00` there are 89 of
its 93 names (the plain file, `weatherbase`, 82 of the 84 `weatheroutdoor` and 5 of the 7 `commonevent` names), whichever
map is loaded. At the title screen only `m00_00_0000` is present. :observed{games="elden-ring"} So the `m00_00` files
are not picked per map: the game holds almost the whole set, and the hundreds digit selects a slot of a ten-name table
for the map's stem. :inferred

At the Stormveil spawn the tone map's colour scale reaches the screen from `m10_00_0000` alone. Replacing the `ColorScale`
value of seven of the map's draw-parameter files by seven different tints turns the whole picture red, the tint of
`m10_00_0000`; none of the other six slots' tints shows, as a blend or product of them with it would. :observed{games="elden-ring"}
Changing only the collision under the spawn (`h001300`) from the slot 0 to the slot 1, two bytes of the layout, with the same
tints, turns the whole picture green, the tint of `m10_00_0100`, where the stock layout gives red. :observed{games="elden-ring"}
A layout rewritten with no collision changed leaves the picture red, as the stock layout does, so the green comes from the changed slot.
So at the spawn the slot that reaches the screen is the one the collision under the player names, not a constant of the map
(one launch each, one collision, one place). Whether the slot is read again when the player walks onto a collision of another slot
was not observed. :unknown{games="elden-ring"}
Which slot another weather, time or event state selects, and whether a slot that lacks a group falls back to slot 0, was not
observed. :unknown{games="elden-ring"}

:only[elden-ring] Additional files use `_weatherbase`, `_weatheroutdoor`, `_commonevent` and `_capturemap` layer
names. Their presence does not establish how the layers combine. :observed{games="elden-ring"}

:only[elden-ring] One routine builds these names from an area, a block and a 16-bit id: `m%02u_%02u_%04u` for a map's own
set and `m%02u_%02u_%04u_WeatherBase`, `_WeatherOutdoor`, `_CommonEvent` and `_CommonEventMapUnique` for four further
layers, which the draw-parameter manager numbers 6, 7, 8 and 9. The weather layers are requested with area 0 and block 0,
so they always name `m00_00` files whichever map is loaded. :observed[the routine and its callers read from the decrypted
executable of build 1.17.2]{games="elden-ring"} When a weather starts, the weather system passes the 32-bit field at offset 20 of its weather row
(`WeatherParam.GparamId`) to the manager's weather setter, which tells every map's controller to drop its previous and
current weather ids and load `m00_00_<id>_WeatherOutdoor`; the manager also keeps a pending id with a blend time that a
per-frame step hands to the controllers, which keep a current and a previous id with two blend timers. :observed[the two
callers of the setter and the controller functions, read from the decrypted executable of build 1.17.2]{games="elden-ring"}
With every weather row's `GparamId` set to 130 in a loaded regulation, the two map controllers of a running build 1.17.2 read 130 as
both current id (offset 0x108) and previous id (offset 0x10c) at the starting site, three times 25 s apart, where the stock
regulation reads 0 in the same places; the manager's pending id stays 0. :observed[one start, one loaded regulation edit, build 1.17.2]{games="elden-ring"}
The weather, not the map, therefore selects the `weatheroutdoor` file. The id of the
`weatherbase` layer and the event that sets `commonevent` ids are not traced. :unknown{games="elden-ring"}

Volumetric-fog groups include `GameScale`, near and far depth, fixed density, height density, scattering and light
colour fields. :observed Sekiro's fog step copies the renderer's fog settings, divides `FixedDensity`, `HeightFogDistribution`
and `HeightFogDensity Scale` by `GameScale` and leaves `HeightFogOffset` as it is; the constants then take the fixed density,
the absolute value of the distribution (at least 0) and half the density scale, and subtract the height offset from the world-Y
row of the inverse view matrix (that row negated when the distribution is negative). :observed[read from the decrypted code]{games="sekiro"}
At the Ashina Castle gate (`m11_01_0000` value ID 0 at 18:00, `GameScale` 1) this gives 0.0015, 0.08 and 0.25 × 0.5 = 0.125,
the three constants of the recorded frame word for word, and the four height-row words from the frame's inverse view and
the offset −110. The fog's ambient, direct and opposite colours are the stored RGB bytes / 255, raised to 2.2 in `f32` and
weighted by the stored `w`: 9 of 9 words exact. :observed[one frame]{games="sekiro"}

`Env Map:Editor` (the fields `EnvMapId` and `ColorScale`) is in 11 of Sekiro's 253 draw-parameter files, mostly the `m95` and
`m96` test maps and `mapoverride0001` to `0003`; no `m11_01` file holds the group, and its values are keyed at no hour or
at hour 0 only, so it does not choose the environment volumes of Ashina by time. :observed[every draw-parameter path in the
community file list]{games="sekiro"}

Elden Ring's full `Tone Map[Yebis]` group is in 77 of the `m00_00_<id>_weatheroutdoor` files and 2 `commonevent` files;
`weatherbase` holds only the wet group. :observed{games="elden-ring"}

### Banks and layers

The executable holds the loaded draw-parameter files in numbered banks, one per layer, and merges them per field.

:only[sekiro] A table of 18 special names (16-byte entries) and a table of 18 bank keys beside it give `default` (name 1) bank 1,
`MapBase` (6) bank 4, `m00_00_0000` (7) bank 5, `MapOverride_0000` (8) bank 10 and `MapOverride_forRemo` (9) bank 11; only for
name 7 does the key take a sub-index 0 to 4 added to it. A file is loaded by formatting `gparam:/%s.gparam`, and the map loader
requests name 6, `MapBase`. A tone-map lookup takes the record of the requested bank and value ID, else bank 1's value 0, else
a record built into the editor. :observed[the name and key tables of the executable and the decrypted code]{games="sekiro"}

:only[sekiro] The merge walks 21 bank slots (64-byte descriptors) in ascending order. For a scalar it skips an inactive value of
any bank but 0 and blends each active one into the running value by the bank's weight; a weight of 1 or more takes the incoming
value outright, and an incoming value equal to the running one is taken before any weighting. :observed[read from the decrypted
code of 1.06]{games="sekiro"} So a later bank at full weight replaces an earlier one for the fields it holds active.
:inferred{games="sekiro"} `MapBase` reaches its bank through the map, not the ordinary file load: the map context's initializer
requests name 6 and registers that file at bank key 4 with an activation of 1, which makes the bank active, and the bank's blend
weight, a separate field, starts at 1. :observed[read from the decrypted code of 1.06]{games="sekiro"} How the activation ramps over
time is not traced. :unknown{games="sekiro"}

:only[sekiro] The tone map shows the rules at work. `default` stores `ReinhardContrast` 1.6 and `ReinhardWhiteBalance` 1.7 at value
ID 0, hour 0, `MapBase` 1.45 and 1.7, and `m11_01_0000` neither. All three list ID 0 in the tone map's extra record (group 4), with
byte 12 being 0, 0 and 1; `ColorGrading[Yebis]` (group 10) lists ID 0 with byte 12 0 in all three; `VolumetricFog` has no record in
`default` and lists ID 0 (group 22) with byte 12 0 in `MapBase` and 1 in `m11_01_0000`. :observed[the three installed files]{games="sekiro"}
Merging `default` (bank 1), `MapBase` (bank 4) and the map's file (bank 5) at full weight by these rules gives a contrast of 1.45,
the value of the [recorded tone curve](/engines/fromsoft/lighting/frame/#tone-curve), and 1.6 without `MapBase`.
:observed[the merge computed from the installed files, against one recorded frame]{games="sekiro"} The map's file lacks the
field and its byte 12 leaves the created row inactive, so the field falls through to `MapBase`. :inferred{games="sekiro"}

:only[elden-ring] The layer kinds have bank bases: kind 6 has base 5, so `WeatherBase` (kind 6, sub-kind 6) is bank 11 and
`WeatherOutdoor` (sub-kind 7) bank 12. The controller holds 21 weights, one per bank, each checked to be in [0, 1] and stored in
its bank's record. The merge walks the banks from 20 down to 0. For each field it finds the field's group and value ID in the
bank, skips a value that is absent or inactive, and takes the bank's weight (the record's weight times this one, in `f32`),
capped at what the field has left; what is left carries to the lower banks. A float is converted to `f64`, multiplied by its
weight, converted back and added to an `f32` sum. :observed[read from the decrypted code of 2.7.2.0]{games="elden-ring"} So a
higher bank at full weight hides the banks below it for the fields it holds. :inferred{games="elden-ring"} Which loader fills
which bank, beyond the two weather layers, is not traced. :unknown{games="elden-ring"}

:only[elden-ring] The `WeatherBase` layer's weight is a wetness that ramps. A weather row's `WetTime` (`f32` at `+0x10`), when
positive, gives a rate `1 / WetTime`; each update adds the elapsed time times that rate to the wetness, up to 1, and with a
`WetTime` of 0 or less the wetness falls at a separate rate, down to 0. An elapsed time of zero snaps to the end. That wetness is
the weight of bank 11 unless an override is on: the two getters that give the `WeatherBase` and `WeatherOutdoor` weights read the
owner's `+0x178` and `+0x17C`, but `+0x20` and `+0x24` when the byte at `+0xF5` is set. :observed[read from the decrypted code of
2.7.2.0]{games="elden-ring"} What sets that byte and those two weights is not traced, so the current weather row alone gives neither
weight. :unknown{games="elden-ring"} So the wet group of `weatherbase`
fades in over the weather's `WetTime` and out after it, rather than following the current weather at once. :inferred{games="elden-ring"}
The weather object holds the current `WeatherParam` row as a reference at `+0x30`: the signed row ID, then a pointer to the row's
68 bytes at `+0x38`. In one memory snapshot it read row 0 while the word at `+0x28` read 10, so `+0x28` is not the current row.
:observed[the decrypted code and one snapshot]{games="elden-ring"}

## From the light set to the lighting constants

The deferred sun program `GXLightAcc_DDirLightShadowed1` reads the light set from the constant buffer `cbLight`, field
`FC_DirLight[2]`: two light sets of 72 floats each, holding four directions, four diffuse colours, four specular colours,
then the ambient terms. :observed{games="sekiro"}

In a frame captured from the running game at the Ashina Castle gate (`m11_01`, 1.06) each set is one file's `LightSet
ParamEditor` value ID 0 at the 18:00 key, and no other: set 0 is `m11_01_0020`, set 1 is `m11_01_0000`. Predicting every
stored light field of every file and value ID of `m11_01` at 18:00 and comparing with both sets, each set agrees with exactly
one candidate on all five fields (the first direction, two diffuse and two specular colours), to float precision.
:observed{games="sekiro"} The volumetric fog's far depth (300) and fixed density (0.0015) in the same frame are the 18:00
values too. :observed{games="sekiro"}

| Stored field | Constant | Transfer | Confidence |
|---|---|---|---|
| `Directional Light DiffColor<n>` (r, g, b, w) | diffuse colour `n` of the set | (r²·w, g²·w, b²·w, w²) | :observed[n = 0, 1 of both sets of one frame]{games="sekiro"} |
| `Directional Light SpecColor<n>` (r, g, b, w) | specular colour `n` of the set | (r²·w, g²·w, b²·w, w²) | :observed[n = 0, 1 of both sets of one frame]{games="sekiro"} |
| `Directional Light Angle0` (rx, ry) radians | direction 0 of the set: towards the light | (sin ry · cos rx, −sin rx, cos ry · cos rx) | :observed[both sets of one frame]{games="sekiro"} |

The program decodes the world normal from G-buffer target 0, lights a surface by `saturate(dot(normal, direction))` and
forms its half vector from the view direction plus this direction, so the stored angle names the direction from the
surface towards the light, in the world frame; it picks the set by the light-group selector times 18 rows of 16 bytes (one
set is 288 bytes). :observed[the program's code]{games="sekiro"}

So the stored colours are squared and multiplied by the weight before the light reaches the program, the same squaring as
the colours of [BTL](/engines/fromsoft/lighting/btl/) light records. :inferred A sun stored as
(1.0, 0.784, 0.588, 2) lights the frame with (2, 1.230, 0.692). :observed{games="sekiro"}

The set's hemisphere ambient goes the same way: with `up` and `down` the set's two hemisphere colours, each squared and
multiplied by its own `w`, the set's ambient row at bytes 204, 220 and 236 holds per channel the mean `(up + down) / 2` and
the rows at 196, 212 and 228 the vertical slope `(up − down) / 2`. In both sets of the frame all six values match this
computed in `f32` bit for bit, for up (0.5695, 0.5294, 0.6078, 0.7) and down (0.3137, 0.3529, 0.3922, 0.1).
:observed[one frame, value ID 0 at 18:00]{games="sekiro"} Of Sekiro's 1,044 forward FLVER pixel programs, 852 declare
`AmbientSH` and 24 read its rows 12 to 14, all of them water programs (`Water`, `WaterInteraction`, `WaterBumpTri`,
`WaterBumpTriInteraction`, with their shadow and alpha variants), which take `max(0, dot(row, (n, 1)))` per channel; the walls'
ambient comes from the environment volumes instead ([rendered frame](/engines/fromsoft/lighting/frame/#irradiance-volumes)).
:observed[the operands of every forward program's disassembly]{games="sekiro"}

:::open[How do the two light sets reach the pixels?]
The program chooses a set per pixel by the [G-buffer](/engines/fromsoft/shaders/gbuffer/)'s light-group selector; which
parts write which value, and what selects `_0020` beside `_0000` for the map, is not established. The second direction is
not yet tied to a stored field.
:::

:::open[Which environment is active?]
The selection from map, collision scene bytes, weather and events is not fully established. How the hours between keys are
blended is read from the code ([looking up an hour](#looking-up-an-hour)).
:::

:::open[What selects local FogVolume sets?]
`FogVolume ParamEditor` is distinct from a part's `FogParamEditor` selector. Equal numeric IDs do not prove a join
between a placed volume and a FogVolume set. Comment tables, the opaque data block and the last two bytes of an
[extra record](#extra-records) also retain unresolved meanings.
:::
