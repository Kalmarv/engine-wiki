---
title: Factory paints (ManufacturerColors)
description: The per-car factory colour list of Forza Horizon 6 and how a material's customisation slot hash links to a paint layer.
---

Each car archive holds `ManufacturerColors.bin`, a [Grub bundle](/engines/forzatech/data-model/grub-bundle/) with one `LCNM` blob (the
bytes `MNCL` in the file, blob version 2.0) listing the car's factory paints. Walking it ends exactly at the blob end on 682 of 682
cars (3,890 colour entries in all). `str7` below is a 7-bit varint length plus ASCII. :observed

Counts come from a recorded census of the install's `media\Cars`; the install is no longer available. :observed

```layout
title: LCNM blob (ManufacturerColors.bin)
size: variable
games: [fh6]
note: "Little-endian."
fields:
  - {at: 0, size: 1, type: u8, name: colour count, level: observed, note: "0 on NUL_CAR_00"}
  - {at: 1, size: 1, type: u8, name: layer count, level: observed, note: "per colour; 1 to 6, the same for every colour of a car (240SX 2: primary, secondary)"}
  - {at: "next", size: variable, type: "layer[]", name: layers, level: observed, note: "per layer { u32 nSlots; nSlots × str7 slot name (Body, Hood, Mirror, Wing, p_WingEndPlates, Stripes, Body_SecondaryColor, Wheel1, Trim1, Override1, ...); f32 rgb[3]; str7 material path }"}
  - {at: "next", size: variable, type: "3 × { u8 present, f32 rgb[3] }", name: extra colours, level: unknown, note: "meaning not decoded"}
```

The layer's `rgb` is a display colour and not the shader's `PaintColor`. :observed The material path is a paint material under
`game:\Media\cars\_library\materials\_fmnext\CarPaint_Calibrated\<paint>.materialbin` with `PaintColor`, `FlakeColor`, `FlakeCoverage`,
`FlakeRoughness` and `ClearCoatRoughness` on the `car_automotive_paint` family ([Car materials](/engines/forzatech/shaders/car-materials/)).
:observed

## Slot link

The `u64 slot` of a carbin material ([Cars](/engines/forzatech/gameplay/carbin/)) is the **FNV-1a-64 of the slot name** (offset basis
0xCBF29CE484222325, prime 0x100000001B3, ASCII): `fnv1a64("Body") = 0xF7DBE8A7C839A675`, `"Hood"` 0x6AC1E9D87FE5D953,
`"WindowTint"` 0x9582FD1BA2FFF9A4, `"Rims"` 0xDCE6592BFA0DFA78, `"u_WingStruts"` 0xB0C163FF8ADE48FD. Over all cars, 16,760 carbin material
slots resolve to a slot name of their own car's colour list (Body 10,509, Stripes 1,402, Hood 1,388, ...); the rest (WindowTint, Rims,
wing and caliper slots) are customisation slots no factory colour paints. A factory colour therefore paints every material whose slot
hashes to one of its layers' slot names, with that layer's paint material. :observed

Which colour a stock car wears is not in the files: the player chooses at purchase and the database is encrypted. :unknown How the
runtime applies the paint material (replacing the slot's material or merging over it) is not traced. :unknown The same hash is used by
livery paint-slot records ([Liveries](/engines/forzatech/gameplay/liveries/)). :observed
