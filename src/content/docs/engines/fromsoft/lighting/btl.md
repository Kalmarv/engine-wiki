---
title: BTL light banks
description: Bank headers, the shared 232-byte light record and stored light properties.
sources:
  - title: SoulsFormatsNEXT BTL
    url: https://github.com/soulsmods/SoulsFormatsNEXT/blob/master/SoulsFormats/Formats/BTL.cs
implementations:
  - name: fromsoft-formats BTL reader
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/btl.rs
---

BTL banks store named point, spot and directional lights, with separate diffuse and specular colours and powers.
The checked Sekiro banks use version 16 and the decoded Elden Ring banks version 18; both use 232-byte records.
:observed{games="sekiro"} :proven[107 decoded banks]{games="elden-ring"}

The whole-install Elden Ring census covers 109 BTL banks: 107 decode, containing 11,228 lights; two are refused by
both readers. Every decoded bank's version and every light's name, type, colours, powers, shadow flag, cone, position,
rotation and radius agree with SoulsFormatsNEXT, with floats compared as bits. The strict reader accounts for the
complete bank length. :proven[107 decoded; 2 refused]{games="elden-ring"}

```layout
title: BTL header (Sekiro)
size: 60
games: [sekiro]
note: Little-endian. A name block of the stated length follows, then light count times 232 bytes through the file end.
fields:
  - {at: 0, size: 4, type: u32, name: unknown, level: unknown, note: Observed 2}
  - {at: 4, size: 4, type: u32, name: version, level: observed, note: 16}
  - {at: 8, size: 4, type: u32, name: light count, level: observed}
  - {at: 12, size: 4, type: u32, name: name block length, level: observed}
  - {at: 16, size: 4, type: u32, name: padding, level: observed, value: 0}
  - {at: 20, size: 4, type: u32, name: light record size, level: observed, value: 232}
  - {at: 24, size: 36, type: "u8[36]", name: padding, level: observed, value: 0}
```

```layout
title: BTL header (Elden Ring)
size: 60
games: [elden-ring]
note: Little-endian. A name block of the stated length follows, then light count times 232 bytes through the file end.
fields:
  - {at: 0, size: 4, type: u32, name: unknown, level: unknown, note: Observed 2}
  - {at: 4, size: 4, type: u32, name: version, level: proven, note: 18}
  - {at: 8, size: 4, type: u32, name: light count, level: proven}
  - {at: 12, size: 4, type: u32, name: name block length, level: proven}
  - {at: 16, size: 4, type: u32, name: padding, level: proven, value: 0}
  - {at: 20, size: 4, type: u32, name: light record size, level: proven, value: 232}
  - {at: 24, size: 36, type: "u8[36]", name: padding, level: proven, value: 0}
```

```layout
title: BTL light (Sekiro)
size: 232
games: [sekiro]
note: Fields without established meanings remain opaque; name offsets are relative to the name block.
fields:
  - {at: 0, size: 16, type: "u8[16]", name: unknown, level: unknown, note: Retained as four words}
  - {at: 16, size: 8, type: u64, name: UTF-16 name offset, level: observed}
  - {at: 24, size: 4, type: u32, name: light type, level: sourced, note: 0 point; 1 spot; 2 directional}
  - {at: 28, size: 1, type: u8, name: unknown boolean, level: unknown, note: 0 or 1}
  - {at: 29, size: 3, type: "u8[3]", name: diffuse RGB, level: sourced}
  - {at: 32, size: 4, type: f32, name: diffuse power, level: sourced}
  - {at: 36, size: 3, type: "u8[3]", name: specular RGB, level: sourced}
  - {at: 39, size: 1, type: u8, name: cast shadows, level: sourced}
  - {at: 40, size: 4, type: f32, name: specular power, level: sourced}
  - {at: 44, size: 4, type: f32, name: cone angle, level: sourced}
  - {at: 48, size: 8, type: "u8[8]", name: unknown, level: unknown, note: Retained as two words}
  - {at: 56, size: 12, type: "f32[3]", name: position, level: observed}
  - {at: 68, size: 12, type: "f32[3]", name: rotation, level: sourced}
  - {at: 80, size: 8, type: "u8[8]", name: unknown, level: unknown, note: Retained as two words}
  - {at: 88, size: 4, type: f32, name: radius, level: sourced}
  - {at: 92, size: 140, type: "u8[140]", name: auxiliary fields, level: unknown, note: Includes zero words at 96; 140; 148; 168; 176; 180}
```

```layout
title: BTL light (Elden Ring)
size: 232
games: [elden-ring]
note: Fields without established meanings remain opaque; name offsets are relative to the name block.
fields:
  - {at: 0, size: 16, type: "u8[16]", name: unknown, level: unknown, note: Retained as four words}
  - {at: 16, size: 8, type: u64, name: UTF-16 name offset, level: proven}
  - {at: 24, size: 4, type: u32, name: light type, level: proven, note: 0 point; 1 spot; 2 directional}
  - {at: 28, size: 1, type: u8, name: unknown boolean, level: unknown, note: 0 or 1}
  - {at: 29, size: 3, type: "u8[3]", name: diffuse RGB, level: proven}
  - {at: 32, size: 4, type: f32, name: diffuse power, level: proven}
  - {at: 36, size: 3, type: "u8[3]", name: specular RGB, level: proven}
  - {at: 39, size: 1, type: u8, name: cast shadows, level: proven}
  - {at: 40, size: 4, type: f32, name: specular power, level: proven}
  - {at: 44, size: 4, type: f32, name: cone angle, level: proven}
  - {at: 48, size: 8, type: "u8[8]", name: unknown, level: unknown, note: Retained as two words}
  - {at: 56, size: 12, type: "f32[3]", name: position, level: proven}
  - {at: 68, size: 12, type: "f32[3]", name: rotation, level: proven}
  - {at: 80, size: 8, type: "u8[8]", name: unknown, level: unknown, note: Retained as two words}
  - {at: 88, size: 4, type: f32, name: radius, level: proven}
  - {at: 92, size: 140, type: "u8[140]", name: auxiliary fields, level: unknown, note: Includes zero words at 96; 140; 148; 168; 176; 180}
```

Ashina Castle's examined banks `0000`, `0002` and `0004` contain point and spot lights with shadows disabled.
:observed{games="sekiro"}

:::open[How do bank powers map to physical light units?]
RGB transfer functions, power calibration, exact cone interpretation and spot orientation need runtime evidence;
stored values alone do not establish watts, lumens or lux.
:::

:::open[What is the version-15 BTL layout?]
Banks for `m60_42_33_00` and `m60_42_36_00` store version 15 and are the two agreed refusals in the 109-bank census.
Their light layout remains outside the proven version-18 scope. :observed{games="elden-ring"}
:::
