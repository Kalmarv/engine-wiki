---
title: Terrain deferred decals
description: Projection boxes, atlas windows and the virtual-terrain decal output layout.
games: [riders-republic]
implementations:
  - name: primase Anvil deferred decal reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/ddecal.rs
---

Terrain deferred decals project material information into terrain virtual-texture targets. Their output layout differs from the final scene G-buffer, even though both carry colour and normals. :observed[decal and terrain producer shaders]

HoudiniDecalInstancerComponent embeds a StaticDDecalLibrary, a counted DDecalModel reference list and counted static-instancer items. Each item's first model byte indexes that list on all 34,477 examined items. Instances are 100-byte projection-box records with world-space centres; applying the owning Entity transform again changes their positions incorrectly. :proven[model-index census] :observed[world-space box comparison]

```layout
title: Static deferred decal instance
size: 100
fields:
  - {at: 0, size: 8, type: u64, name: stored identity, level: unknown, note: "0 in the measured records"}
  - {at: 8, size: 4, type: u32, name: record class, value: "0x295F035C", level: observed}
  - {at: 12, size: 12, type: float3, name: first half-axis, level: observed}
  - {at: 24, size: 4, type: bytes, name: stored bytes, level: unknown, note: "not interpreted"}
  - {at: 28, size: 12, type: float3, name: second half-axis, level: observed}
  - {at: 40, size: 4, type: f32, name: fade, level: observed}
  - {at: 44, size: 12, type: bytes, name: stored fields, level: unknown, note: "not interpreted"}
  - {at: 56, size: 4, type: f32, name: atlas U offset, level: observed}
  - {at: 60, size: 12, type: float3, name: world centre, level: observed}
  - {at: 72, size: 4, type: f32, name: atlas U width, level: observed}
  - {at: 76, size: 12, type: float3, name: box minimum, level: observed}
  - {at: 88, size: 12, type: float3, name: box maximum, level: observed}
```

The atlas interval is `[offset,offset+width]`. The GPU pack uses centre `trunc((offset+width/2)*65535)` and half-width `trunc(width/2*65535)`, with opacity scaled by `(1-fade)*modelOpacity`. :observed[instance packer disassembly]

DDecalModel bodies are 115 bytes in all 70 stored entries. Four references supply Diffuse, Normal, Height and Mask1 maps, followed by flags and parameters. Model opacity is the f32 at body 72. :proven[body size census] :observed[field mapping]

| Terrain target | Meaning | Confidence |
|---|---|---|
| o0 | Albedo | :observed[executed terrain decal path] |
| o1 | Normal | :observed[executed terrain decal path] |
| o2.x | Terrain displacement from TerrainDisplacement parameters | :observed[program and parameter mapping] |
| o2.y | Mask1 G | :observed |
| o2.z | Normal A, roughness | :observed |
| o3.x | Mask1 R | :observed |

Alpha is `Mask1.B*(1-fade)*AlphaScale`, with discard below .4 in the examined terrain-family program. Fifty-three of 69 classified models use this family. All 5,490 USNAT instancers have ForTerrain enabled, CellMinSize 50 and CellMarge 5. :observed[model classification, instancer census and interpreted real-record execution]

:::open[How are all terrain decal permutations scheduled?]
The examined outputs and stored projection data are established; the full runtime ordering and compositing of every decal permutation with VT updates is not. :unknown
:::
