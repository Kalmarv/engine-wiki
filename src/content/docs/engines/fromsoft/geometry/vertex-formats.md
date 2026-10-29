---
title: FLVER vertex formats
description: Layout members, packed attributes, shader input lanes and vegetation pivots.
sources:
  - title: SoulsFormatsNEXT
    url: https://github.com/soulsmods/SoulsFormatsNEXT/blob/master/SoulsFormats/Formats/FLVER/LayoutMember.cs
    note: Type and semantic enum names
implementations:
  - name: fromsoft-formats (flver/vertex.rs)
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/flver/vertex.rs
---

FLVER layouts describe the bytes of a vertex stream. A member's semantic identifies its role, while its type
describes its packing; the same type can be decoded differently for a normal, bone index or texture input.
:observed

```layout
title: Buffer layout
size: 16
fields:
  - {at: 0, size: 4, type: u32, name: member count, level: proven}
  - {at: 4, size: 8, type: bytes, name: reserved, value: 0, level: proven}
  - {at: 12, size: 4, type: u32, name: members offset, level: proven}
```

```layout
title: Layout member
size: 20
fields:
  - {at: 0, size: 4, type: u32, name: stream descriptor, level: sourced, note: 'Ordinary layouts use a stream word; SpeedTree splits it into stream u16 and modifier u16.'}
  - {at: 4, size: 4, type: u32, name: byte offset within stream, level: proven}
  - {at: 8, size: 4, type: u32, name: member type, level: proven}
  - {at: 12, size: 4, type: u32, name: semantic, level: proven}
  - {at: 16, size: 4, type: u32, name: semantic index, level: proven}
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

The layout records above are checked across the whole-install reference population: 14,459 Sekiro and 22,050
Elden Ring models. The reference refuses 119 Elden Ring SpeedTree models; those streams have a separate
program-execution check. One Sekiro archive entry is unreadable before model inspection.
:proven[whole-install reference population]

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

A UV set the vertex program reads is not necessarily one the draw uses. :only[sekiro] In the Wolf's default head and
the twelve Sekiro material variants (three distinct pixel programs) whose vertex programs compute outputs from the
third UV set, no pixel output lane (240 in all) and no discard depends on it: the pixel programs do not read the
two lanes that carry it. The Fur program reads only the third lane of that input register, which carries `COLOR1`.
:observed[a dependency trace of the outputs of those twelve variants]{games="sekiro"}

In Elden Ring the number of UV attributes a mesh stores (a Float4 or Short4 member counts as two, a Half4 pivot as one)
mostly follows its shader. Of the 76,822 meshes whose material has a MATBIN, the meshes of 443 of the 481 shader stems all
store the same count; the other 38 stems, mostly `M[AMSN_V]` variants, have meshes with one, two and three.
:proven[every mesh of the install with a MATBIN material, without the `DLC` archive pair]

How many attributes of each kind a vertex holds, over every FLVER the archives store as an entry or as a member of a
top-level BND4 binder: Sekiro's 14,459 models (166,873,569 vertices) and Elden Ring's 22,169 models (324,042,558
vertices). Entries stored over 256 MiB are not read, nor is one Sekiro entry whose DCX envelope the reader refuses; no
FLVER is refused. A UV attribute is one decoded four-lane value; the `0x13` columns count only the normalized-byte
members among them.

| Attributes a vertex holds | UV (Sekiro) | UV (Elden Ring) | `0x13` UV members (Sekiro) | `0x13` UV members (Elden Ring) | Tangents (Sekiro) | Tangents (Elden Ring) | Colours (Sekiro) | Colours (Elden Ring) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | 0 | 712 | 93,568,599 | 233,709,961 | 41,746,830 | 57,234 | 40,906,598 | 1,219,968 |
| 1 | 81,437,549 | 191,305,507 | 13,634,708 | 80,268,043 | 124,451,716 | 314,976,632 | 124,659,947 | 310,859,158 |
| 2 | 20,838,573 | 109,753,690 | 6,377,043 | 9,542,189 | 650,807 | 8,509,680 | 1,307,024 | 11,963,432 |
| 3 | 10,794,264 | 15,838,052 | 818,674 | 306,041 | 24,216 | 499,012 | 0 | 0 |
| 4 | 1,177,797 | 6,405,513 | 399,113 | 175,579 | 0 | 0 | 0 | 0 |
| 5 | 515,941 | 307,685 | 0 | 40,745 | 0 | 0 | 0 | 0 |
| 6 | 0 | 369,346 | 52,075,432 | 0 | 0 | 0 | 0 | 0 |
| 7 | 34,013 | 42,459 | 0 | 0 | 0 | 0 | 0 | 0 |
| 8 | 52,075,432 | 19,594 | 0 | 0 | 0 | 0 | 0 | 0 |

No vertex holds more than eight UV attributes, three tangents or two colours. Sekiro's 52,075,432 vertices with eight
UV attributes (31 % of its vertices) are the ones that hold six `0x13` members: the same count. :observed[a census of
every model the archives hold as an entry or top-level binder member]

### Half4 pivots

For the checked vegetation UV-semantic Half4 members, XYZ is a model-space pivot and W is zero. A vertex program
transforms the pivot as a point, including instance translation; it is not a signed-short texture coordinate.
:observed

The whole-install attribute inventory records these pivots on 306 Sekiro meshes (978,040 vertices) and 1,586 Elden
Ring meshes (5,301,513 vertices), with SpeedTree's stored members handled separately. The respective maximum
absolute components are 487.75 and 2,118. :proven[whole-install attribute inventory]

:::open[Does every declared member type have a consumer-verified meaning?]
No exhaustive shader-consumer check establishes every type/semantic combination. The table deliberately separates
sampled decoding from community enum descriptions; the name Half4 alone does not establish half-float decoding for
every semantic. :unknown
:::
