---
title: Enhanced drawables and fragments
description: YDR, YDD and YFT payloads, model lists, geometry and Enhanced buffer declarations.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: Drawable, DrawableModel, DrawableGeometry and Gen9 vertex-buffer descriptions.
implementations:
  - name: primase worlds/gta (drawable.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/rage/drawable.rs
---

A drawable combines geometry, shader references, bounding volumes and an optional skeleton. A YDR holds one drawable;
a YDD holds drawables keyed by name hash; a YFT fragment holds a main drawable, additional drawables and physics
data. Enhanced uses resource versions 159 for YDR/YDD and 171 for YFT. :observed

## Drawable and models

Four model-list pointers describe high, medium, low and very-low detail. These lists are inside an asset, separate
from the [world's placement LOD hierarchy](/engines/rage/world/lod-and-priority/). :observed

```layout
title: Drawable base
size: 168
fields:
  - {at: 0, size: 16, type: bytes, name: resource base, level: sourced}
  - {at: 16, size: 8, type: pointer, name: shader group, level: observed}
  - {at: 24, size: 8, type: pointer, name: skeleton, level: observed}
  - {at: 32, size: 12, type: vec3, name: bounding sphere centre, level: observed}
  - {at: 44, size: 4, type: f32, name: bounding sphere radius, level: observed}
  - {at: 48, size: 16, type: vec4, name: box minimum, level: observed}
  - {at: 64, size: 16, type: vec4, name: box maximum, level: observed}
  - {at: 80, size: 32, type: "pointer[4]", name: LOD model lists, level: observed}
  - {at: 112, size: 16, type: "f32[4]", name: LOD distances, level: observed}
  - {at: 128, size: 16, type: "u32[4]", name: render masks, level: observed}
  - {at: 144, size: 8, type: pointer, name: joints, level: sourced}
  - {at: 152, size: 8, type: bytes, name: unknown, level: unknown}
  - {at: 160, size: 8, type: pointer, name: models block, level: sourced}
```

```layout
title: Drawable model
size: 48
fields:
  - {at: 0, size: 8, type: bytes, name: unknown, level: unknown}
  - {at: 8, size: 8, type: pointer, name: geometry pointer array, level: observed}
  - {at: 16, size: 2, type: u16, name: geometry count, level: observed}
  - {at: 18, size: 2, type: u16, name: repeated geometry count, level: observed}
  - {at: 20, size: 4, type: bytes, name: unknown, level: unknown}
  - {at: 24, size: 8, type: pointer, name: bounding boxes, level: observed}
  - {at: 32, size: 8, type: pointer, name: shader indices per geometry, level: observed}
  - {at: 40, size: 4, type: u32, name: skeleton binding, level: observed}
  - {at: 44, size: 2, type: u16, name: render mask, level: observed}
  - {at: 46, size: 2, type: bytes, name: unknown tail, level: unknown}
```

A model with several geometries has a whole-model box followed by geometry boxes; a single geometry uses one box.
Each geometry has its own vertex and index buffers and selects a shader through the model's shader-index array.
:observed

The sampled normal drawing path uses model render-mask bit 0. Models without that bit are other-pass proxies; the
complete meaning of every mask bit is not established. :observed

## Enhanced vertices

The Enhanced declaration is 320 bytes, with 52 semantic slots. Each present slot supplies a byte offset, stride and
one-byte SGA buffer-format code. Format zero marks an absent slot. Vertices are interleaved in offset order.
:observed

```layout
title: Enhanced vertex declaration
size: 320
fields:
  - {at: 0, size: 208, type: "u32[52]", name: byte offsets by semantic slot, level: observed}
  - {at: 208, size: 52, type: "u8[52]", name: strides by semantic slot, level: observed}
  - {at: 260, size: 52, type: "u8[52]", name: buffer formats by semantic slot, level: observed}
  - {at: 312, size: 8, type: u64, name: packed declaration word, level: observed, note: "bits 2–9 repeat stride; other bit meanings are not all established"}
```

| Slot range | Semantics | Confidence |
|---|---|---|
| 0–3 | `POSITION0`–`POSITION3` | :observed |
| 4–7 | `NORMAL0`–`NORMAL3` | :observed |
| 8–11 | `TANGENT0`–`TANGENT3` | :observed |
| 12–15 | `BINORMAL0`–`BINORMAL3` | :observed |
| 16–19 | `BLENDWEIGHT0`–`BLENDWEIGHT3` | :observed |
| 20–23 | `BLENDINDICES0`–`BLENDINDICES3` | :observed |
| 24–27 | `COLOR0`–`COLOR3` | :observed |
| 28–51 | `TEXCOORD0`–`TEXCOORD23` | :observed |

Indices are 16-bit triangle lists in the inspected Enhanced layout. :observed

```layout
title: Geometry
size: 152
fields:
  - {at: 0, size: 24, type: bytes, name: unknown prefix, level: unknown}
  - {at: 24, size: 8, type: pointer, name: vertex buffer, level: observed}
  - {at: 32, size: 24, type: bytes, name: unknown, level: unknown}
  - {at: 56, size: 8, type: pointer, name: index buffer, level: observed}
  - {at: 64, size: 24, type: bytes, name: unknown, level: unknown}
  - {at: 88, size: 4, type: u32, name: index count, level: observed}
  - {at: 92, size: 4, type: u32, name: triangle count, level: observed}
  - {at: 96, size: 2, type: u16, name: low 16 bits of vertex count, level: observed}
  - {at: 98, size: 2, type: u16, name: unknown constant, level: unknown, note: "3 in inspected layout"}
  - {at: 100, size: 4, type: bytes, name: unknown, level: unknown}
  - {at: 104, size: 8, type: pointer, name: bone palette, level: observed}
  - {at: 112, size: 2, type: u16, name: vertex stride, level: observed}
  - {at: 114, size: 2, type: u16, name: bone palette count, level: observed}
  - {at: 116, size: 36, type: bytes, name: remaining fields, level: unknown}
```

```layout
title: Enhanced vertex buffer
size: 64
fields:
  - {at: 0, size: 8, type: bytes, name: unknown prefix, level: unknown}
  - {at: 8, size: 4, type: u32, name: vertex count, level: observed}
  - {at: 12, size: 2, type: u16, name: stride, level: observed}
  - {at: 14, size: 10, type: bytes, name: unknown, level: unknown}
  - {at: 24, size: 8, type: pointer, name: vertex data, level: observed}
  - {at: 32, size: 24, type: bytes, name: unknown, level: unknown}
  - {at: 56, size: 8, type: pointer, name: declaration, level: observed}
```

```layout
title: Enhanced index buffer
size: 64
fields:
  - {at: 0, size: 8, type: bytes, name: unknown prefix, level: unknown}
  - {at: 8, size: 4, type: u32, name: index count, level: observed}
  - {at: 12, size: 2, type: u16, name: index size, level: observed, note: "2 in inspected layout"}
  - {at: 14, size: 10, type: bytes, name: unknown, level: unknown}
  - {at: 24, size: 8, type: pointer, name: index data, level: observed}
  - {at: 32, size: 32, type: bytes, name: unknown tail, level: unknown}
```

The format byte shares its code space with [Enhanced textures](/engines/rage/textures/ytd/); it is not a direct DXGI
enum cast. [Vertex-colour roles](/engines/rage/materials/vertex-colours/) depend on the shader. :observed

## Fragments and data exceptions

A fragment's extra drawable can have no shader group and inherit the main drawable's shaders. Its first physics LOD
can carry [embedded collision](/engines/rage/collision/bounds/). :observed

```layout
title: Enhanced fragment root
size: 304
fields:
  - {at: 0, size: 16, type: bytes, name: resource base, level: sourced}
  - {at: 16, size: 16, type: bytes, name: unknown, level: unknown}
  - {at: 32, size: 16, type: vec4, name: bounding sphere, level: sourced}
  - {at: 48, size: 8, type: pointer, name: main drawable, level: observed}
  - {at: 56, size: 8, type: pointer, name: extra drawable pointers, level: observed}
  - {at: 64, size: 8, type: pointer, name: extra drawable name pointers, level: observed}
  - {at: 72, size: 4, type: u32, name: extra drawable count, level: observed}
  - {at: 76, size: 12, type: bytes, name: unknown, level: unknown}
  - {at: 88, size: 8, type: pointer, name: fragment name, level: observed}
  - {at: 96, size: 72, type: bytes, name: unknown, level: unknown}
  - {at: 168, size: 8, type: pointer, name: bone pose, level: observed}
  - {at: 176, size: 64, type: bytes, name: unknown, level: unknown}
  - {at: 240, size: 8, type: pointer, name: physics LOD group, level: observed}
  - {at: 248, size: 8, type: pointer, name: cloth drawable, level: observed}
  - {at: 256, size: 16, type: bytes, name: unknown, level: unknown}
  - {at: 272, size: 16, type: list, name: light list, level: observed}
  - {at: 288, size: 16, type: bytes, name: unknown tail, level: unknown}
```

`prop_gascyl_02b.yft` contains non-finite tangent components in its high-detail vertices. A finite position stream does
not establish that every auxiliary stream is finite. :observed

:::open[What do the remaining render masks and packed declaration bits mean?]
Their stored locations are known; the interpretation above covers only the fields consumed by the inspected layout.
:unknown
:::
