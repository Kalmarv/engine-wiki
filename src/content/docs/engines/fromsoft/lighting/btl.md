---
title: BTL light banks
description: Bank headers, the shared 232-byte light record and stored light properties.
sources:
  - title: SoulsFormatsNEXT BTL
    url: https://github.com/soulsmods/SoulsFormatsNEXT/blob/master/SoulsFormats/Formats/BTL.cs
implementations:
  - name: primase BTL reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/btl.rs
---

BTL banks store named point, spot and directional lights, with separate diffuse and specular colours and powers.
Sekiro uses version 16 and Elden Ring version 18; both use 232-byte records. :observed

The Elden Ring comparison checks each independently readable bank's version and every light's name, type, colours,
powers, shadow flag, cone, position, rotation and radius against SoulsFormatsNEXT, with floats compared as bits.
Banks rejected by both readers remain outside that decoded scope. :observed{games="elden-ring"}

```layout
title: BTL header
size: 60
note: Little-endian. A name block of the stated length follows, then light count times 232 bytes through the file end.
fields:
  - {at: 0, size: 4, type: u32, name: unknown, level: unknown, note: Observed 2}
  - {at: 4, size: 4, type: u32, name: version, level: observed, note: 16 in Sekiro; 18 in Elden Ring}
  - {at: 8, size: 4, type: u32, name: light count, level: observed}
  - {at: 12, size: 4, type: u32, name: name block length, level: observed}
  - {at: 16, size: 4, type: u32, name: padding, level: observed, value: 0}
  - {at: 20, size: 4, type: u32, name: light record size, level: observed, value: 232}
  - {at: 24, size: 36, type: "u8[36]", name: padding, level: observed, value: 0}
```

```layout
title: BTL light
size: 232
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

Ashina Castle's examined banks `0000`, `0002` and `0004` contain point and spot lights with shadows disabled.
:observed{games="sekiro"}

:::open[How do bank powers map to physical light units?]
RGB transfer functions, power calibration, exact cone interpretation and spot orientation need runtime evidence;
stored values alone do not establish watts, lumens or lux.
:::
