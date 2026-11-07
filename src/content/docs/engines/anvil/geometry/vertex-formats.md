---
title: Packed vertex formats
description: Positions, signed UVs, colour, normal frames and skin streams in Riders Republic meshes.
games: [riders-republic, "shaun-white-skateboarding"]
implementations:
  - name: anvil-formats Anvil vertex decoder
    url: https://github.com/Kalmarv/anvil-formats/blob/main/src/vertex.rs
---

Mesh vertex-format bytes select the engine's input declarations. Runtime declaration tables identify the semantics and DXGI formats; shader disassembly supplies the arithmetic. All vertex permutations in the 432 template entries agree on the corresponding input semantics. :observed

## The 24-byte static vertex

```layout
title: Static vertex, kind 2
size: 24
note: Little-endian. The DXGI declaration and vertex programs determine these interpretations.
fields:
  - {at: 0, size: 6, type: "i16[3]", name: position components, level: observed}
  - {at: 6, size: 2, type: i16, name: position scale and handedness, level: observed}
  - {at: 8, size: 3, type: "u8[3]", name: normal XYZ, level: observed}
  - {at: 11, size: 1, type: u8, name: auxiliary normal component, level: observed, note: "UINT input; an unorm auxiliary value in the fragment-recording path"}
  - {at: 12, size: 3, type: "u8[3]", name: tangent XYZ, level: observed}
  - {at: 15, size: 1, type: u8, name: auxiliary tangent component, level: observed, note: "UINT input; an unorm auxiliary value in the fragment-recording path"}
  - {at: 16, size: 4, type: "u8[4]", name: COLOR0 RGBA, level: observed, note: "R8G8B8A8_UNORM; red first"}
  - {at: 20, size: 4, type: "i16[2]", name: TEXCOORD0 UV, level: observed, note: "R16G16_SNORM multiplied by 16"}
```

Static positions decode as `(x*w, y*w, z*w) / 32768`. In the exhaustive 1,170 inline multi-mesh comparison, integer products followed by floating-point division reproduce every independent position hash, including the sign of zero. :proven[inline multi-mesh positions]

Normal and tangent components decode as `(byte - 127) / 127`, from `R8G8B8A8_UINT` inputs. Their fourth bytes are not a stored geometric Z or the tangent handedness. The bitangent sign is negative when the position's signed scale word is negative; `B = cross(N,T) × sign`. :observed[declarations and vertex programs]

For either UV word `w`, `uv = 16 × max(w / 32767, -1)`. It is signed, has divisor 32767 rather than 32768, and the vertex program does not flip V. :observed[DXGI declaration and shader arithmetic]

Kind 3 extends this vertex to 28 bytes with `TEXCOORD1` at bytes 24–27, decoded by the same signed formula. :observed

## The 16-byte static vertex

Kind 11 stores the position in bytes 0–7, a four-byte packed frame at 8–11, and UV words at 12–15. It has no colour or separate tangent input. :observed

For an azimuth byte `a` and height byte `z`, let `a' = a/127 - 1` and `z' = z/127 - 1`. The vector is `(sqrt(max(0,1-z'²))*cos(pi*a'), sqrt(max(0,1-z'²))*sin(pi*a'), z')`. Bytes 10,11 give one vector; bytes 8,9 give the other. Which of these the pixel stage uses as its shading normal is not established by the vertex declaration alone. :observed[vertex-program arithmetic]

## Split vertices

Kinds 0 and 1 put positions and the frame in a separate 12-byte stream. Primary bytes 0–3 are `COLOR0`; 4–7 are the UV pair delivered to the pixel stage through `TEXCOORD1`. Kind 1 adds another pair at 8–11; both use the signed UV formula above. :observed

The first three i16 values of the position stream decode as `component × scale / 32768`. The shared f32 scale is the last material descriptor's final four bytes, following a u32 value 31. All 29,174 split meshes match the independent reader's decoded positions; compiled centre/extent bounds agree within three quantization steps. :proven[all split meshes]

The i16 at position-stream offset 6 supplies flags: negative values become zero. Bytes 8–11 decode to `p = min(byte/127 - 1, 1)`. For each pair `(p0,p1)`, form `X=(p0+p1)/2`, `Y=(p0-p1)/2`, `Z=1-|X|-|Y|` and normalize. Flag bit 0 negates the normal's Z; bit 1 negates the tangent's Z; bit 2 makes bitangent handedness negative. :observed[layout-0 vertex program]

The skin stream stores N slot bytes followed by N weight bytes, with N=4 or 8. Slots index the mesh's bone-record array. Every vertex's weights sum to 255 over 39,795,423 vertices of the 29,174 split meshes. :proven[split skin census]

```layout
title: Mesh bone record
size: 81
fields:
  - {at: 0, size: 8, type: u64, name: object identity, level: observed}
  - {at: 8, size: 4, type: u32, name: MeshBone class, value: "0x9EF0E7A1", level: observed}
  - {at: 12, size: 4, type: u32, name: bone name CRC-32, level: observed}
  - {at: 16, size: 64, type: "f32[16]", name: InitialMatrixInverse, level: observed, note: "mesh bind-pose matrix; not necessarily the skeleton rest matrix"}
  - {at: 80, size: 1, type: u8, name: IsUsedBySubMeshes, level: observed}
```

Over the 29,174 meshes with bones in the six forges, 497,168 of their 497,194 bone records name a bone of some Skeleton by
its CRC-32. The other 26 hold six ids, in the meshes of two front forks and two bike frames: two ids in each LOD of
`MAD_CHR_CR_FrontFork_002_U` and two in each of `MAD_CHR_CR_FrontFork_002_U_A001`, one in the four LODs of
`MAD_CHR_CG_Frame_001_U_A002` and one in `MAD_CHR_EN_Frame_007_U_A002_LODM`. No Skeleton of the six forges has a bone of those names
and no bone-name list of a skeleton holds them. Each sits where the record's class says the bone name goes, so they are the
data's own ids. :proven[every mesh bone record of the six forges]{games="riders-republic"}

The front forks' four ids are also in their [LODSelectors](/engines/anvil/world/lod-selector/): the selectors
`MAD_CHR_CR_FrontFork_002_U` and `MAD_CHR_CR_FrontFork_002_U_A001` list three BoneIDs on each of their first two levels,
`0xD14DB302` and then the two ids of the matching meshes, in `DataPC.forge` and its patch alike. The two frame ids are in no
LODSelector. The frame id of `MAD_CHR_CG_Frame_001_U_A002` has IsUsedBySubMeshes 0 and weights no vertex of its meshes;
the other five are used and weight some of their meshes' vertices (59 of the 639 of `MAD_CHR_CR_FrontFork_002_U_LOD2`, 3,049 of
the 11,644 of `MAD_CHR_EN_Frame_007_U_A002_LODM`). :observed[a byte search for the six ids over every entry up to 512 KiB
of the six forges, 1,296,141 entries]{games="riders-republic"} That the first BoneID, `0xD14DB302`, is the fork mesh's first
bone, the one a Skeleton names, fits the three-bone meshes but is not checked. :inferred{games="riders-republic"}

:::open[Which spherical vector reaches each pixel path?]
The two kind-11 vectors have an established vertex decode, but their downstream roles need a per-permutation trace. :unknown
:::

## Shaun White Skateboarding

:only[shaun-white-skateboarding]

A vertex has an explicit stride, 24 to 48 bytes, and the flags word of the compiled mesh data selects which optional elements it carries. The game's renderer binds each mesh's stored vertex stream unchanged with a Direct3D 9 vertex declaration; the elements below are those declarations' stream 0, as the game created them for the 119 distinct bindings of the mesh vertex buffers it drew from a new game to the start of the level-02 load (seven of the eleven flag and stride combinations). :observed{games="shaun-white-skateboarding"}[the game's own declarations on that route]

| Element | Declared as | Size | Present when | Confidence |
|---|---|---:|---|---|
| Position | `FLOAT3` `POSITION0` at 0 | 12 | always | :observed |
| Normal | `UBYTE4` `NORMAL0` at 12: four bytes read as integers 0 to 255, the fourth a pad | 4 | always | :observed |
| Tangent | `UBYTE4` `TANGENT0` at 16; `w` is only +1 or −1 | 4 | when the stride holds it (below) | :observed |
| Vertex colour | `D3DCOLOR` `COLOR0` (B, G, R, A in memory) | 4 | flag bit 64 | :observed |
| First UV | `FLOAT2` `TEXCOORD0`, or `FLOAT3` where the stride holds four bytes more | 8 or 12 | always | :observed |
| Second UV | `FLOAT2` `TEXCOORD1` | 8 | flag bit 4, on meshes without further streams | :observed |
| Bone indices | `UBYTE4` `BLENDINDICES0`, into the range's bone palette | 4 | flag bit 1 or bit 2 | :observed |
| Bone weights | `UBYTE4N` `BLENDWEIGHT0` | 4 | flag bit 1 or bit 2 | :observed |

The elements follow each other in the table's order with no gaps. The stride less the sizes of the elements the flags select is 0 (no tangent), 4 (a tangent) or 8 (a tangent and a three-float first UV), and this rule fits the stride of every one of the 16,149 compiled meshes of the install, the elements ending exactly at the stride. :proven{games="shaun-white-skateboarding"}[every mesh of the install] The 44-byte vertices of the skinned characters with flags 65 are the declared case of the three-float first UV; the 40-byte vertices of flags 1 and the 48-byte vertices of flags 6 follow the same rule but none was drawn on the traced route. :observed

Bits 1 and 2 occur only on meshes with bones: 2,355 meshes with bit 1 and 161 with bit 2, all with bones, and no mesh without bones has either. What distinguishes the two bits is not established. :proven[every mesh of the install]

| Flags | Stride | Morph streams | Meshes | Declared on the traced route |
|---:|---:|---:|---:|---|
| 0 | 24 | 1 or 2 | 67 | yes |
| 0 | 28 | 0 | 4,397 | yes |
| 1 | 36 | 0 | 267 | no |
| 1 | 40 | 0 | 153 | no |
| 4 | 24 | 1 or 2 | 49 | yes |
| 4 | 36 | 0 | 2,834 | yes |
| 6 | 44 | 0 | 40 | yes |
| 6 | 48 | 0 | 7 | no |
| 64 | 28 | 1 or 2 | 65 | no |
| 64 | 32 | 0 | 1,916 | yes |
| 65 | 40 | 0 | 145 | yes |
| 65 | 44 | 0 | 1,790 | yes |
| 68 | 28 | 1 to 3 | 14 | no |
| 68 | 40 | 0 | 4,291 | yes |
| 70 | 48 | 0 | 114 | no |

The counts are over all 16,149 meshes of the install. :proven[every mesh of the install]

The declarations of most world draws add a second vertex stream of four bytes per vertex, `D3DCOLOR` `TEXCOORD2`, which carries the baked vertex lighting and is not part of the mesh. :observed In level 01, the flags-68 mesh's 8-byte element holds two `f32` equal to the position's X and Y times 100 in the meshes examined. :observed[level 01]

The vertex colour is stored as a Direct3D colour (B, G, R, A in memory), not as RGBA. Swapping red and blue of the stored bytes makes the third-layer mural of the metro station appear, as it does in the game, and a raw RGBA reading does not. :observed{games="shaun-white-skateboarding"}[a rendering comparison]

The meshes with further vertex streams (morph targets) repeat the whole base layout in each stream, without a tangent, and in them flag bit 4 adds no second UV: the game declares their 24-byte vertices as position, normal and a two-float first UV at 16, with flags 0 and 4 alike. :observed[the traced route] Morph draws bind further streams with `POSITION1`, `NORMAL1` as `UBYTE4` and `COLOR1`. :observed Thirty-eight of the 502 vertices of one bump shape have NaN in both UV components, all with vertex alpha 0. :observed[level 01]
