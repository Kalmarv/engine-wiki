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

:::open[Which spherical vector reaches each pixel path?]
The two kind-11 vectors have an established vertex decode, but their downstream roles need a per-permutation trace. :unknown
:::

## Shaun White Skateboarding

:only[shaun-white-skateboarding]

A vertex has an explicit stride, 24 to 48 bytes, and a flags word in the compiled mesh data selects which optional elements it carries. The position is three `f32` at offset 0 in every mesh. The elements follow in this order: position, normal, tangent (if any), colour (if any), first UV, then the further 8-byte elements. :observed{games="shaun-white-skateboarding"}[level 01]

| Element | Size | Present when | Confidence |
|---|---:|---|---|
| Position | 12 | always (`f32` × 3) | :observed |
| Normal | 4 | always (`u8` × 3 and a pad byte); the median dot product with the face normals is 1.0 and fronts are counter-clockwise | :observed |
| Tangent | 4 | when the stride leaves room for it; absent on 24-byte vertices (`u8` × 4, orthogonal to the normal; `w` is only +1 or −1) | :observed |
| Vertex colour | 4 | flag bit 64 (a Direct3D colour, byte order B, G, R, A) | :observed |
| First UV | 8 | always (`f32` × 2) | :observed |
| Further 8-byte elements | 8 each | flag bits 4, 2 and 1 | :inferred |
| Four unexplained bytes | 4 | 111 meshes, before the skinning indices | :unknown |

The flags 68 give the 40-byte vertex: position at 0, normal at 12, tangent at 16, vertex colour at 20, first UV at 24 and an 8-byte element at 32. In level 01 that element holds two `f32` equal to the position's X and Y times 100 in the meshes examined. The stride minus the sizes of position, normal, first UV, the vertex colour and the flagged 8-byte elements is 4 where a tangent follows the normal, 8 on the 111 meshes that also carry the four unexplained bytes, and 0 on meshes without a tangent. :observed[level 01]

The vertex colour is stored as a Direct3D colour (B, G, R, A in memory), not as RGBA. A runtime capture of the vertex declarations the game creates while level 01 loads shows all 23 distinct declarations use the colour format for `COLOR0`, and the same capture shows the second vertex stream of instanced draws and the morph colour use it as well. Swapping red and blue of the stored bytes makes the third-layer mural of the metro station appear, as it does in the game, and a raw RGBA reading does not. :observed{games="shaun-white-skateboarding"}[a runtime trace of level 01 and a rendering comparison]

The runtime declarations also include a second vertex stream with a Direct3D colour as `TEXCOORD2`, taken per instance, which carries the baked vertex lighting, and morph streams with `POSITION1`, `NORMAL1` as `UBYTE4` and `COLOR1`. :observed

Morph streams repeat the whole base vertex layout (position, normal, optional colour, first UV); in them flag bit 4 adds no second UV. Thirty-eight of the 502 vertices of one bump shape have NaN in both UV components, all with vertex alpha 0. :observed[level 01]

:::open[Which vertex formats remain unread?]
Two vertex formats of level 01 do not fit the table above, and the stride of the skinned meshes carries four bytes whose use is unknown. :unknown
:::
