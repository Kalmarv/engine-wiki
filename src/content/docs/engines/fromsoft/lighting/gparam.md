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
  - {at: 13, size: 1, type: u8, name: unknown flag, level: unknown, note: Raw header byte}
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
  - {at: 80, size: 4, type: f32, name: unknown, level: unknown, note: Named Unk50 by the reference reader}
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

The game keeps this state in `CSWorldSceneDrawParamManager`: per area block an object holding two weather ids, an
override ID, a flag that an override is being transitioned to and its duration, and the manager holds sixteen
interpolators (`CSGparamIdLerper`: a destination ID, a begin ID and a timer) beside them. :sourced[fromsoftware-rs]{games="elden-ring"}

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
So at the spawn the slot that reaches the screen is the one the collision under the player names, not a constant of the map
(one launch, one collision, one place). Whether the slot is read again when the player walks onto a collision of another slot
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
colour fields. :observed The density unit and its relationship to `GameScale` are unresolved. :unknown

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

:::open[How do the two light sets reach the pixels?]
The program chooses a set per pixel by the [G-buffer](/engines/fromsoft/shaders/gbuffer/)'s light-group selector; which
parts write which value, and what selects `_0020` beside `_0000` for the map, is not established. The ambient terms of the set (spherical-harmonic rows) and the second direction
are not yet tied to stored fields.
:::

:::open[Which environment is active, and how are time keys interpolated?]
The selection from map, collision scene bytes, weather and events is not fully established. Nor are the engine's
curves between stored hours; linear interpolation is not an established engine rule.
:::

:::open[What selects local FogVolume sets?]
`FogVolume ParamEditor` is distinct from a part's `FogParamEditor` selector. Equal numeric IDs do not prove a join
between a placed volume and a FogVolume set. Comment tables, the opaque data block and extra group/ID records also
retain unresolved meanings.
:::
