---
title: Graphics parameters and environment selection
description: GPARAM groups, value IDs, time-of-day keys and unresolved file and volume selection.
sources:
  - title: SoulsFormatsNEXT GPARAM
    url: https://github.com/soulsmods/SoulsFormatsNEXT/blob/master/SoulsFormats/Formats/GPARAM.cs
  - title: Smithbox
    url: https://github.com/vawser/Smithbox
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
finds no draw-parameter file for `m31_*`, `m32_*` or their `_00` family stems: 20 of 21 `m30` maps have none under their
own stem and use `m30_00`, and the caves and tunnels name selectors whose files do not exist. :proven{games="elden-ring"}
Sekiro's first two bytes do not follow a `byte × 100 + byte × 10` rule: it names an existing file for 267 of 588
collisions with a selector. :observed{games="sekiro"}

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

:only[elden-ring] Additional files use `_weatherbase`, `_weatheroutdoor`, `_commonevent` and `_capturemap` layer
names. Their presence does not establish how the layers combine. :observed{games="elden-ring"}

Volumetric-fog groups include `GameScale`, near and far depth, fixed density, height density, scattering and light
colour fields. :observed The density unit and its relationship to `GameScale` are unresolved. :unknown

:::open[Which environment is active, and how are time keys interpolated?]
The selection from map, collision scene bytes, weather and events is not fully established. Nor are the engine's
curves between stored hours; linear interpolation is not an established engine rule.
:::

:::open[What selects local FogVolume sets?]
`FogVolume ParamEditor` is distinct from a part's `FogParamEditor` selector. Equal numeric IDs do not prove a join
between a placed volume and a FogVolume set. Comment tables, the opaque data block and extra group/ID records also
retain unresolved meanings.
:::
