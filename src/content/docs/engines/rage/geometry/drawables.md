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
data. Enhanced uses resource versions 159 for YDR/YDD and 171 for YFT. :proven

The structural census reads every copy with these versions: 84,592 YDRs, 23,108 YDDs and 61,064 YFTs, with no
structural failures. Fifteen YDR copies use other layouts (12 version 154 and three version 165) and are excluded
from these layout claims. Stored-field proofs below cover the accepted versions; they do not establish the
excluded layouts or every runtime use of a field. :proven[version-filtered full-install census]

## Drawable and models

Four model-list pointers describe high, medium, low and very-low detail. These lists are inside an asset, separate
from the [world's placement LOD hierarchy](/engines/rage/world/lod-and-priority/). :proven

```layout
title: Drawable base
size: 168
fields:
  - {at: 0, size: 16, type: bytes, name: resource base, level: sourced}
  - {at: 16, size: 8, type: pointer, name: shader group, level: proven}
  - {at: 24, size: 8, type: pointer, name: skeleton, level: proven}
  - {at: 32, size: 12, type: vec3, name: bounding sphere centre, level: proven}
  - {at: 44, size: 4, type: f32, name: bounding sphere radius, level: proven}
  - {at: 48, size: 16, type: vec4, name: box minimum, level: proven}
  - {at: 64, size: 16, type: vec4, name: box maximum, level: proven}
  - {at: 80, size: 32, type: "pointer[4]", name: LOD model lists, level: proven}
  - {at: 112, size: 16, type: "f32[4]", name: LOD distances, level: proven}
  - {at: 128, size: 16, type: "u32[4]", name: render masks, level: proven}
  - {at: 144, size: 8, type: pointer, name: joints, level: sourced}
  - {at: 152, size: 8, type: bytes, name: unknown, level: unknown}
  - {at: 160, size: 8, type: pointer, name: models block, level: sourced}
```

```layout
title: Drawable model
size: 48
fields:
  - {at: 0, size: 8, type: bytes, name: unknown, level: unknown}
  - {at: 8, size: 8, type: pointer, name: geometry pointer array, level: proven}
  - {at: 16, size: 2, type: u16, name: geometry count, level: proven}
  - {at: 18, size: 2, type: u16, name: repeated geometry count, level: proven}
  - {at: 20, size: 4, type: bytes, name: unknown, level: unknown}
  - {at: 24, size: 8, type: pointer, name: bounding boxes, level: proven}
  - {at: 32, size: 8, type: pointer, name: shader indices per geometry, level: proven}
  - {at: 40, size: 4, type: u32, name: skeleton binding, level: proven}
  - {at: 44, size: 2, type: u16, name: render mask, level: proven}
  - {at: 46, size: 2, type: bytes, name: unknown tail, level: unknown}
```

A model with several geometries has a whole-model box followed by geometry boxes; a single geometry uses one box.
Each geometry has its own vertex and index buffers and selects a shader through the model's shader-index array.
:proven

The sampled normal drawing path uses model render-mask bit 0. Models without that bit are other-pass proxies; the
complete meaning of every mask bit is not established. :observed

## Enhanced vertices

The Enhanced declaration is 320 bytes, with 52 semantic slots. Each present slot supplies a byte offset, stride and
one-byte SGA buffer-format code. Format zero marks an absent slot. Vertices are interleaved in offset order.
:proven

```layout
title: Enhanced vertex declaration
size: 320
fields:
  - {at: 0, size: 208, type: "u32[52]", name: byte offsets by semantic slot, level: proven}
  - {at: 208, size: 52, type: "u8[52]", name: strides by semantic slot, level: proven}
  - {at: 260, size: 52, type: "u8[52]", name: buffer formats by semantic slot, level: proven}
  - {at: 312, size: 8, type: u64, name: packed declaration word, level: proven, note: "bits 2–9 repeat stride; other bit meanings are not all established"}
```

| Slot range | Semantics | Confidence |
|---|---|---|
| 0–3 | `POSITION0`–`POSITION3` | :proven |
| 4–7 | `NORMAL0`–`NORMAL3` | :proven |
| 8–11 | `TANGENT0`–`TANGENT3` | :proven |
| 12–15 | `BINORMAL0`–`BINORMAL3` | :proven |
| 16–19 | `BLENDWEIGHT0`–`BLENDWEIGHT3` | :proven |
| 20–23 | `BLENDINDICES0`–`BLENDINDICES3` | :proven |
| 24–27 | `COLOR0`–`COLOR3` | :proven |
| 28–51 | `TEXCOORD0`–`TEXCOORD23` | :proven |

Indices are 16-bit triangle lists in the inspected Enhanced layout. :proven

```layout
title: Geometry
size: 152
fields:
  - {at: 0, size: 24, type: bytes, name: unknown prefix, level: unknown}
  - {at: 24, size: 8, type: pointer, name: vertex buffer, level: proven}
  - {at: 32, size: 24, type: bytes, name: unknown, level: unknown}
  - {at: 56, size: 8, type: pointer, name: index buffer, level: proven}
  - {at: 64, size: 24, type: bytes, name: unknown, level: unknown}
  - {at: 88, size: 4, type: u32, name: index count, level: proven}
  - {at: 92, size: 4, type: u32, name: triangle count, level: proven}
  - {at: 96, size: 2, type: u16, name: low 16 bits of vertex count, level: proven}
  - {at: 98, size: 2, type: u16, name: unknown constant, level: unknown, note: "3 in inspected layout"}
  - {at: 100, size: 4, type: bytes, name: unknown, level: unknown}
  - {at: 104, size: 8, type: pointer, name: bone palette, level: proven}
  - {at: 112, size: 2, type: u16, name: vertex stride, level: proven}
  - {at: 114, size: 2, type: u16, name: bone palette count, level: proven}
  - {at: 116, size: 36, type: bytes, name: remaining fields, level: unknown}
```

```layout
title: Enhanced vertex buffer
size: 64
fields:
  - {at: 0, size: 8, type: bytes, name: unknown prefix, level: unknown}
  - {at: 8, size: 4, type: u32, name: vertex count, level: proven}
  - {at: 12, size: 2, type: u16, name: stride, level: proven}
  - {at: 14, size: 10, type: bytes, name: unknown, level: unknown}
  - {at: 24, size: 8, type: pointer, name: vertex data, level: proven}
  - {at: 32, size: 24, type: bytes, name: unknown, level: unknown}
  - {at: 56, size: 8, type: pointer, name: declaration, level: proven}
```

```layout
title: Enhanced index buffer
size: 64
fields:
  - {at: 0, size: 8, type: bytes, name: unknown prefix, level: unknown}
  - {at: 8, size: 4, type: u32, name: index count, level: proven}
  - {at: 12, size: 2, type: u16, name: index size, level: proven, note: "2 in inspected layout"}
  - {at: 14, size: 10, type: bytes, name: unknown, level: unknown}
  - {at: 24, size: 8, type: pointer, name: index data, level: proven}
  - {at: 32, size: 32, type: bytes, name: unknown tail, level: unknown}
```

The format byte shares its code space with [Enhanced textures](/engines/rage/textures/ytd/); it is not a direct DXGI
enum cast. [Vertex-colour roles](/engines/rage/materials/vertex-colours/) depend on the shader. :proven

## Fragments and data exceptions

A fragment's extra drawable can have no shader group and inherit the main drawable's shaders. Its first physics LOD
can carry [embedded collision](/engines/rage/collision/bounds/). :proven

```layout
title: Enhanced fragment root
size: 304
fields:
  - {at: 0, size: 16, type: bytes, name: resource base, level: sourced}
  - {at: 16, size: 16, type: bytes, name: unknown, level: unknown}
  - {at: 32, size: 16, type: vec4, name: bounding sphere, level: sourced}
  - {at: 48, size: 8, type: pointer, name: main drawable, level: proven}
  - {at: 56, size: 8, type: pointer, name: extra drawable pointers, level: proven}
  - {at: 64, size: 8, type: pointer, name: extra drawable name pointers, level: proven}
  - {at: 72, size: 4, type: u32, name: extra drawable count, level: proven}
  - {at: 76, size: 12, type: bytes, name: unknown, level: unknown}
  - {at: 88, size: 8, type: pointer, name: fragment name, level: proven}
  - {at: 96, size: 72, type: bytes, name: unknown, level: unknown}
  - {at: 168, size: 8, type: pointer, name: bone pose, level: proven}
  - {at: 176, size: 64, type: bytes, name: unknown, level: unknown}
  - {at: 240, size: 8, type: pointer, name: physics LOD group, level: proven}
  - {at: 248, size: 8, type: pointer, name: cloth drawable, level: proven}
  - {at: 256, size: 16, type: bytes, name: unknown, level: unknown}
  - {at: 272, size: 16, type: list, name: light list, level: proven}
  - {at: 288, size: 16, type: bytes, name: unknown tail, level: unknown}
```

`prop_gascyl_02b.yft` contains non-finite tangent components in its high-detail vertices. A finite position stream does
not establish that every auxiliary stream is finite. :observed

:::open[What do the remaining render masks and packed declaration bits mean?]
Their stored locations are known; the interpretation above covers only the fields consumed by the inspected layout.
:unknown
:::
