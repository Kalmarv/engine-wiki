---
title: FLVER vertex formats
description: Layout members, packed attributes, shader input lanes and vegetation pivots.
sources:
  - title: SoulsFormatsNEXT
    url: https://github.com/soulsmods/SoulsFormatsNEXT/blob/master/SoulsFormats/Formats/FLVER/LayoutMember.cs
    note: Type and semantic enum names
implementations:
  - name: primase worlds/fromsoft (flver/vertex.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/flver/vertex.rs
---

FLVER layouts describe the bytes of a vertex stream. A member's semantic identifies its role, while its type
describes its packing; the same type can be decoded differently for a normal, bone index or texture input.
:observed

```layout
title: Buffer layout
size: 16
fields:
  - {at: 0, size: 4, type: u32, name: member count, level: observed}
  - {at: 4, size: 8, type: bytes, name: reserved, value: 0, level: observed}
  - {at: 12, size: 4, type: u32, name: members offset, level: observed}
```

```layout
title: Layout member
size: 20
fields:
  - {at: 0, size: 4, type: u32, name: stream descriptor, level: sourced, note: 'Ordinary layouts use a stream word; SpeedTree splits it into stream u16 and modifier u16.'}
  - {at: 4, size: 4, type: u32, name: byte offset within stream, level: observed}
  - {at: 8, size: 4, type: u32, name: member type, level: observed}
  - {at: 12, size: 4, type: u32, name: semantic, level: observed}
  - {at: 16, size: 4, type: u32, name: semantic index, level: observed}
```

| Semantic | Role | Confidence |
|---|---|---|
| 0 | Position | :observed |
| 1 | Bone weights | :observed |
| 2 | Bone indices | :observed |
| 3 | Normal, with a possible rigid bone index in W | :observed |
| 5 | Texture-coordinate input, also used for layer weights and pivots | :observed |
| 6 | Tangent | :observed |
| 7 | Bitangent | :observed |
| 10 | Vertex colour | :observed |

## Types and consumer decoding

The table covers the types the current real-data reader decodes; a supported type is not evidence that every game
uses it. The additional enum values below are community documentation. :observed

| Type | Bytes | Interpretation in the checked semantic | Confidence |
|---|---:|---|---|
| `0x01` Float2 | 8 | UV: two float lanes | :observed |
| `0x02` Float3 | 12 | Position or normal XYZ; UV: three float lanes | :observed |
| `0x03` Float4 | 16 | Four floats; UV packs two coordinate pairs; position W is zero in checked ordinary data | :observed |
| `0x10` Color | 4 | Weights: signed bytes / 127; colour: unsigned bytes / 255; UV: two signed shorts / 2048 | :observed |
| `0x11` UByte4 | 4 | Bone indices: four bytes; UV: two signed shorts / 2048 | :observed |
| `0x12` Byte4 | 4 | UV: two signed shorts / 2048; normal: bytes 3,2,1 as signed / 127, byte 0 is W | :observed |
| `0x13` UByte4Norm | 4 | UV or colour: four unsigned bytes / 255; weights: unsigned bytes / 255 | :observed |
| `0x15` Short2 | 4 | UV: two signed shorts / 2048 | :observed |
| `0x16` Short4 | 8 | UV: two signed-short coordinate pairs / 2048; weights: four signed shorts / 32767 | :observed |
| `0x18` UShort4 | 8 | Bone indices: four unsigned 16-bit values | :observed |
| `0x1A` Short4Norm | 8 | Weights, normals and tangents: signed shorts / 32767; normal W remains an integer | :observed |
| `0x2D` Half2 | 4 | SpeedTree: two IEEE half floats | :observed{games="elden-ring"} |
| `0x2E` Half4 | 8 | UV semantic: four IEEE half floats; ordinary normal semantic: unsigned XYZ biased by 32767, signed integer W | :observed |
| `0x2F` Byte4E | 4 | Bone indices: four bytes; normal and tangent packing follows the byte rule below | :observed |
| `0x00` Float1 | 4 | One float | :sourced[SoulsFormatsNEXT] |
| `0x14` Byte4Norm | 4 | Four normalized signed bytes | :sourced[SoulsFormatsNEXT] |
| `0x17` UShort2 | 4 | Two unsigned shorts | :sourced[SoulsFormatsNEXT] |
| `0xF0` EdgeCompressed | 1 | Edge compression described by face-set members | :sourced[SoulsFormatsNEXT] |

For normal and tangent semantics of types `0x10`, `0x11`, `0x13` and `0x2F`, a byte component is
`(b - 127) * r`, where `r` is the float with bits `0x3C010204`. This is the shader's rounded reciprocal of 127;
division by 127 can differ by one ULP. A normal's W remains its raw bone-index byte. :observed

### Short coordinates and normalized weights

The vertex programs take Short2 texture inputs as integers and multiply by `1/2048`. `UByte4Norm` inputs instead
arrive as float `TEXCOORDn.xyzw` and pass through without that scaling: Elden Ring's
`M[AMSN_V][Mb3][Ov_N]_Gbuf.vpo` and Sekiro's `M_MultipleGround__Gbuf.vpo` show the distinction.
:observed

SoulsFormats reads the four bytes of a `0x13` UV member as two signed shorts / 2048. SoulsFormatsNEXT preserves the
four normalized values but splits them into two UV pairs. Neither representation describes the shader's one
four-lane input directly. :sourced[SoulsFormatsNEXT]

Repeated UV attributes follow stream order; tangent semantic indices can be sparse, so their index is not necessarily
their position in an array. :observed

### Half4 pivots

For the checked vegetation UV-semantic Half4 members, XYZ is a model-space pivot and W is zero. A vertex program
transforms the pivot as a point, including instance translation; it is not a signed-short texture coordinate.
:observed

The whole-install attribute inventory records these pivots on 306 Sekiro meshes (978,040 vertices) and 1,586 Elden
Ring meshes (5,301,513 vertices), with SpeedTree's stored members handled separately. The respective maximum
absolute components are 487.75 and 2,118. :observed

:::open[Does every declared member type have a consumer-verified meaning?]
No exhaustive shader-consumer check establishes every type/semantic combination. The table deliberately separates
sampled decoding from community enum descriptions; the name Half4 alone does not establish half-float decoding for
every semantic. :unknown
:::
