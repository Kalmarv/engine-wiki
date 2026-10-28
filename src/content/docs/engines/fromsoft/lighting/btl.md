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
Sekiro's 18 banks (735 lights) all use version 16 and 107 of Elden Ring's 109 banks version 18; both use 232-byte
records. The other two Elden Ring banks store version 15 with a 240-byte record (see the open question below).
Point and spot lights also appear inside effect files; see [FXR effect files](/engines/fromsoft/effects/fxr/).
:proven[all 18 Sekiro banks]{games="sekiro"} :proven[107 version 18 banks, 2 version 15]{games="elden-ring"}

The whole-install Elden Ring census covers 109 BTL banks, 11,229 lights: 107 version 18 banks hold 11,228 lights and
the two version 15 banks one light. A strict reader that accounts for the complete bank length, the 240-byte record
included, reads all 109. For the 107 version 18 banks every bank's version and every light's name, type, colours,
powers, shadow flag, cone, position, rotation and radius agree with SoulsFormatsNEXT, with floats compared as bits;
that reader lists versions 1, 2, 5, 6, 16 and 18 only and refuses the two version 15 banks by their version.
:proven[109 of 109 read; 107 compared]{games="elden-ring"}

```layout
title: BTL header (Sekiro)
size: 60
games: [sekiro]
note: Little-endian. A name block of the stated length follows, then light count times 232 bytes through the file end.
fields:
  - {at: 0, size: 4, type: u32, name: unknown, level: unknown, note: Observed 2}
  - {at: 4, size: 4, type: u32, name: version, level: proven, note: 16}
  - {at: 8, size: 4, type: u32, name: light count, level: proven}
  - {at: 12, size: 4, type: u32, name: name block length, level: proven}
  - {at: 16, size: 4, type: u32, name: padding, level: proven, value: 0}
  - {at: 20, size: 4, type: u32, name: light record size, level: proven, value: 232}
  - {at: 24, size: 36, type: "u8[36]", name: padding, level: proven, value: 0}
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
  - {at: 16, size: 8, type: u64, name: UTF-16 name offset, level: proven}
  - {at: 24, size: 4, type: u32, name: light type, level: sourced, note: 0 point; 1 spot; 2 directional}
  - {at: 28, size: 1, type: u8, name: unknown boolean, level: unknown, note: 0 or 1}
  - {at: 29, size: 3, type: "u8[3]", name: diffuse RGB, level: sourced}
  - {at: 32, size: 4, type: f32, name: diffuse power, level: sourced}
  - {at: 36, size: 3, type: "u8[3]", name: specular RGB, level: sourced}
  - {at: 39, size: 1, type: u8, name: cast shadows, level: sourced}
  - {at: 40, size: 4, type: f32, name: specular power, level: sourced}
  - {at: 44, size: 4, type: f32, name: cone angle, level: sourced}
  - {at: 48, size: 8, type: "u8[8]", name: unknown, level: unknown, note: Retained as two words}
  - {at: 56, size: 12, type: "f32[3]", name: position, level: proven}
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

## Words with community names

The community editor names eleven words of the opaque auxiliary block. Over every light of both installs the values fit
the names, though no value establishes what the game does with them. :observed The zero words at 96, 140, 148, 168, 176
and 180 are zero in all 735 Sekiro and 11,229 Elden Ring lights. :proven[every light of both archive sets]

| Offset | Community name | Sekiro (735 lights) | Elden Ring (11,228 lights, version 18) |
|---|---|---|---|
| `0x74` | flicker interval minimum | 0.0 (680) or 0.2 (55) | 0.0 |
| `0x78` | flicker interval maximum | 0.0 (646), 0.8 (55) or 1.0 (34) | 0.0 |
| `0x7C` | flicker brightness multiplier | 1.0 (646) or 0.6 (89) | 1.0 |
| `0x80` | event ID (i32) | -1 | -1 |
| `0x9C` | near clip | 1.0 | 1.0 |
| `0xA3` | shadow model cull flip (byte) | 1 (729) or 0 (6) | 0 (9,599) or 1 (1,629) |
| `0xA4` | sharpness | 33 values, 0.2 to 30 | 70 values, 0.01 to 80 |
| `0xB8` | width | 16 values, 0 to 90 (0 on 668) | 28 values, 0 to 100 (0 on 11,006) |
| `0xBC` | light start cutoff | 20 values, 0 to 34 (0 on 670) | 23 values, 0 to 60 (0 on 10,997) |
| `0xC4` | enable distance | 8 values, 0 to 1000 (0 on 685) | 27 values, 0 to 1000 (40 on 4,928; 0 on 1,611) |
| `0xD0` | volume density | 17 values, 0 to 10 (1.0 on 302; 0 on 193) | 16 values, 0 to 10 (0 on 8,008; 1.0 on 2,221) |

Ashina Castle's examined banks `0000`, `0002` and `0004` contain point and spot lights with shadows disabled.
:observed{games="sekiro"}

:::open[How do bank powers map to physical light units?]
RGB transfer functions, power calibration, exact cone interpretation and spot orientation need runtime evidence;
stored values alone do not establish watts, lumens or lux. The lights of [effect files](/engines/fromsoft/effects/fxr/#placing-the-lights-of-an-effect)
are not on a common scale with these powers: no single factor relates them.
:::

:::open[What is the version-15 BTL layout?]
Banks for `m60_42_33_00` and `m60_42_36_00` store version 15; SoulsFormatsNEXT refuses them by their version.
Both declare a 240-byte light record: the first holds no lights (60 bytes), the second one light (332 bytes: the 60-byte
header, a 32-byte name block and 240). Its fields up to offset 232 read as in version 18 (point light, diffuse colour
`F0 B4 78`, diffuse power 0.15, a plausible position) and the 8 bytes after them are zero. :observed{games="elden-ring"}
Whether the extra 8 bytes ever hold more than zeros is not established.
:::
