---
title: Graphics parameters and environment selection
description: GPARAM groups, value IDs, time-of-day keys and unresolved file and volume selection.
sources:
  - title: SoulsFormatsNEXT GPARAM
    url: https://github.com/soulsmods/SoulsFormatsNEXT/blob/master/SoulsFormats/Formats/GPARAM.cs
  - title: Smithbox
    url: https://github.com/vawser/Smithbox
implementations:
  - name: primase GPARAM reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/gparam.rs
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
title: Version 5 value-ID entry
size: 8
fields:
  - {at: 0, size: 4, type: i32, name: value ID, level: sourced}
  - {at: 4, size: 4, type: f32, name: time of day, level: sourced}
```

Supported field types include signed and unsigned integers, floats, booleans, vectors, RGBA bytes and strings.
Two- and three-component float vectors occupy 16 bytes in the value array. :sourced[SoulsFormatsNEXT]

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
