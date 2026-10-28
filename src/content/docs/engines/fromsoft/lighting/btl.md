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
  - {at: 44, size: 4, type: f32, name: cone angle, level: observed, note: "Spot: full angle in degrees of the vertical axis of the cone; see below"}
  - {at: 48, size: 8, type: "u8[8]", name: unknown, level: unknown, note: Retained as two words}
  - {at: 56, size: 12, type: "f32[3]", name: position, level: proven}
  - {at: 68, size: 12, type: "f32[3]", name: rotation, level: observed, note: "Radians"}
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
  - {at: 44, size: 4, type: f32, name: cone angle, level: proven, note: "Spot: full angle in degrees of the vertical axis of the cone (read for Sekiro, see below)"}
  - {at: 48, size: 8, type: "u8[8]", name: unknown, level: unknown, note: Retained as two words}
  - {at: 56, size: 12, type: "f32[3]", name: position, level: proven}
  - {at: 68, size: 12, type: "f32[3]", name: rotation, level: proven, note: "Radians (every spot light of the install lies in -pi..pi)"}
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
| `0x9C` | near clip (not the spot's near plane) | 1.0 | 1.0 |
| `0xA3` | shadow model cull flip (byte) | 1 (729) or 0 (6) | 0 (9,599) or 1 (1,629) |
| `0xA4` | sharpness (the diffuse record's fourth value is 1 divided by it) | 33 values, 0.2 to 30 | 70 values, 0.01 to 80 |
| `0xB8` | width (a spot's full horizontal cone angle in degrees) | 16 values, 0 to 90 (0 on 668) | 28 values, 0 to 100 (0 on 11,006) |
| `0xBC` | light start cutoff (a spot's near plane) | 20 values, 0 to 34 (0 on 670) | 23 values, 0 to 60 (0 on 10,997) |
| `0xC4` | enable distance | 8 values, 0 to 1000 (0 on 685) | 27 values, 0 to 1000 (40 on 4,928; 0 on 1,611) |
| `0xD0` | volume density | 17 values, 0 to 10 (1.0 on 302; 0 on 193) | 16 values, 0 to 10 (0 on 8,008; 1.0 on 2,221) |

The meanings in the parentheses are read back from a running Sekiro (below, "Spot lights" and "How the renderer takes a light");
the other names are the editor's and rest on the values fitting them. :observed{games="sekiro"} The word at `0xE0` is the exposure
weight (below), 0 on every Elden Ring light. :proven[all 109 banks]{games="elden-ring"}

Ashina Castle's examined banks `0000`, `0002` and `0004` contain point and spot lights with shadows disabled.
:observed{games="sekiro"}

## How the renderer takes a light

Sekiro's deferred lighting stage takes every point light as one 208-byte record and every spot light as one 192-byte record,
from two structured buffers of 1,024 records that the engine fills each frame; compute programs sort the lights into
screen tiles and a tile-lighting pass shades with them. A per-light variant of the shader family reads one record from a
constant buffer instead. Over four frames of Ashina Castle the lighting passes that ran were the organise and tile-lighting
programs, with 19 point records in the buffer and none for spot lights. :observed{games="sekiro"}

A point record holds, as floats: the light's position in view space and `1 / radius^2` (offset 0); the diffuse colour (red,
green, blue) and a fourth value (16); the specular colour and a fourth value (32); the translucency parameters (48) and the
radius (60); the light type (64). :observed{games="sekiro"} Against the stored values of the five lights of the map's banks that
the frames held (matched by position, within 0.01 m, over two frames):

| Record field | Value | Largest relative difference |
|---|---|---|
| diffuse colour | `(diffuse byte / 255)^2 * diffuse power` per channel | 1.4e-7 |
| specular colour | `(specular byte / 255)^2 * specular power` per channel (0 for the four lights of specular power 0) | 7e-8 |
| position | the stored position, moved into view space | 2e-5 m |
| `1 / radius^2` and radius | the stored radius (offset `0x58`) | 2e-8 |
| diffuse fourth value | 1 divided by the float at record offset `0xA4` (0.5 on four lights, 4 on one) | 0 |
| specular fourth value | `0.2989 r + 0.5866 g + 0.1145 b` of the record's specular colour (0 where the power is 0) | 2e-8 |

The colour transfer is therefore the square of the byte over 255, not the sRGB curve: for a byte of 158 the record holds
0.3839 of the power where sRGB would give 0.3416. :observed{games="sekiro"}[5 lights, 2 frames, one area]

In the lighting shaders' disassembly the radius enters a point light's contribution only as the window `saturate(1 -
distance^2 / radius^2)`, which multiplies a wrapped Lambert term whose wrap depends on `distance * (the diffuse fourth
value)`; the colour is the record's diffuse colour times that. The same expression is in the tile compute program and in the
per-light pixel program. A spot light's record has a range instead of `1 / radius^2` (the shader squares it), the same window,
and a second factor `saturate(1 - x^2 - y^2)` on its position in the cone's projection space, which is zero at the edge of the
base. :observed{games="sekiro"}[disassembly of the programs, read not run]

### Spot lights

A spot light's record (192 bytes) holds the position and the range (the stored radius), the diffuse and specular colours as a point
light's, the translucency parameters, and a 4 x 4 matrix of rows that take a view-space position into the cone's space; the
shader shades with `max(0, 1 - x^2 - y^2)` of the cone-space coordinates, so there is no inner cone. :observed{games="sekiro"}
Read back from a running Sekiro in Ashina Castle, five spot records of two maps (the spot buffer held one record in one view and
five in another) match their banks' lights as follows. :observed{games="sekiro"}[5 lights, 2 maps]

| Bank word | Spot record |
|---|---|
| diffuse bytes and power, radius, the word at offset 164 | as for a point light: `(byte / 255)^2 * power`, range = radius, fourth diffuse value `1 / word` (to 2e-7) |
| cone angle (44) | the vertical axis's full angle in degrees: that row's scale is `cot(angle / 2)` (to 1.5e-7) |
| the word at 184 (community name "width") | the horizontal axis's full angle in degrees, `cot(angle / 2)`; where it is 0 the cone angle serves both (code read) |
| the word at 188 (community name "light start cutoff") | the near plane: the depth row's scale is `far / (far - near)` (to 1e-7) |
| rotation (68), radians | the beam is `Ry(y) * Rx(x) * Rz(z)` applied to +Z in the map frame, the cone's horizontal axis the rotated +X and its vertical axis the rotated +Y (to 4e-8) |

The five lights carry angles of 30 x 30, 90 x 8, 20 x 30, 10 x 50 and 25 x 20 degrees (horizontal x vertical). In the executable's
loader a spot light whose two angles are both 0 is left switched off. :inferred[code read]

### The exposure term

A light object carries a weight, read from the bank word at offset 224, and the packer multiplies the record's colours by
`2^(-weight * X)` where `X` is a value of the renderer's scene parameters (the engine's per-frame exposure term) when the weight
is not 0. :inferred[code read, Sekiro 1.06 and Elden Ring 1.17.2] Two Sekiro lights of weight 1 read back with a colour 1.081215
times their `(byte / 255)^2 * power` (identical on both lights to 1e-7, red, green and blue), a light of weight 0 with 1.0000000;
the weight is 0 on 120 of the 122 lights of the five Ashina banks (1.0 on two) and on all 11,228 lights of version 18 Elden Ring banks.
:observed{games="sekiro"}[3 lights] :proven{games="elden-ring"}[the weight word of every light]

:only[elden-ring] The lighting programs (DXIL) declare the same point-light structure and apply the same window; the executable's
point-light packer is the Sekiro packer's: the same squaring of the colour (through a helper that squares the three channels and keeps
the fourth), the same `1 / radius^2`, `1 / word` and exposure term (its scene value one field further on). :observed{games="elden-ring"}[code read] One
light of a bank was read back (`m10_00_00_00_0000` light 32: bytes 240, 180, 120, power 0.5, radius 8, fourth word 2): the record's diffuse
colour is `(byte / 255)^2 * power` per channel, 0.4429066, 0.2491350 and 0.1107266, to 2e-6. :observed{games="elden-ring"}[1 light]

:::open[How do bank powers map to physical light units?]
The renderer's unit is the record's `colour^2 * power`; stored values still do not establish watts, lumens or lux. The lights of
[effect files](/engines/fromsoft/effects/fxr/#how-the-renderer-takes-an-effect-light) are in the same unit: an effect light's
multiplier times its colour alpha is a BTL power, with no factor between them.
:::

:::open[What is the version-15 BTL layout?]
Banks for `m60_42_33_00` and `m60_42_36_00` store version 15; SoulsFormatsNEXT refuses them by their version.
Both declare a 240-byte light record: the first holds no lights (60 bytes), the second one light (332 bytes: the 60-byte
header, a 32-byte name block and 240). Its fields up to offset 232 read as in version 18 (point light, diffuse colour
`F0 B4 78`, diffuse power 0.15, a plausible position) and the 8 bytes after them are zero. :observed{games="elden-ring"}
Whether the extra 8 bytes ever hold more than zeros is not established.
:::
