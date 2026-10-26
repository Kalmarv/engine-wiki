---
title: ShaderBlockDepots and material parameters
description: Material-key lookup, relocatable depot containers, typed parameters and texture bindings.
games: [skate]
implementations:
  - name: primase worlds/frostbite (depot.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/frostbite/src/depot.rs
---

A MeshSet section's 64-bit material key resolves in ShaderBlockDepots (`0x73312045`) of loaded bundles.
The depot contains parameters, not executable shaders. A cell depot requires no explicit EBX reference to be
registered: membership in the loaded bundle is sufficient. This is verified by moving depots into cell bundles
and observing correct texture binding in game. :observed

## Depot container

The container is little-endian. Eight measured depots, including Studio, stock cell and terrain/compositor
examples, reproduce byte for byte after decoding and re-encoding. :observed

```layout
title: Depot resource metadata
size: 16
fields:
  - {at: 0, size: 4, type: u32, name: payload size before relocations, level: observed}
  - {at: 4, size: 4, type: u32, name: relocation byte count, level: observed}
  - {at: 8, size: 4, type: u32, name: unknown tag, level: unknown, note: "0x01190003 in all eight measured depots; interpreted as version by readers"}
  - {at: 12, size: 4, type: u32, name: key count, level: observed}
```

The payload begins with two `u64` words, `0x10` and zero, then a table of key/descriptor-pointer pairs. Parameter
blocks are packed in first-use order, followed by 16-byte alignment and their descriptors. After another
alignment, a zero-terminated list of `u32` offsets identifies pointer slots to relocate. Several keys can share
one descriptor; the key table is not necessarily sorted. :observed

```layout
title: Depot key entry
size: 16
fields:
  - {at: 0, size: 8, type: u64, name: material key, level: observed}
  - {at: 8, size: 8, type: u64, name: descriptor file offset, level: observed}
```

```layout
title: Depot block descriptor
size: 24
fields:
  - {at: 0, size: 8, type: u64, name: block data file offset, level: observed}
  - {at: 8, size: 8, type: u64, name: block hash, level: observed}
  - {at: 16, size: 8, type: u64, name: block byte count, level: observed}
```

## Parameter blocks

A block starts with `u32 parameter_count`. Every parameter begins with the record below. All blocks of the eight
measured depots parse with no bytes left over. :observed

```layout
title: Parameter prefix
size: 16
fields:
  - {at: 0, size: 8, type: u64, name: name hash, level: observed, note: Texture parameters carry a slot tag in the upper 16 bits.}
  - {at: 8, size: 4, type: u32, name: type hash, level: observed}
  - {at: 12, size: 2, type: u16, name: count, level: observed}
  - {at: 14, size: 2, type: u16, name: unknown, level: unknown, note: Varies between parameters.}
```

Texture type `0x14c5fc30` carries one flag byte, then the TextureAsset instance GUID and EBX file GUID, in that
order. All 2,038 measured texture flags equal one. Texture binding uses these GUIDs rather than the Texture
resource id or name; 402 of 402 sampled map bindings resolve in this order. :observed

Other types begin their value with another `u32` count, equal to the prefix count in the measured blocks, followed
by fixed-width elements. :observed

| Type hash | Element interpretation | Bytes | Confidence |
|---|---|---|---|
| `0x2bb65c2d` | float | 4 | :observed |
| `0x36ed3444`, `0x8e4a817e`, `0x7826e998` | Integer/boolean/enum representations | 4 | :observed |
| `0x57f970ca` | Packed colour | 4 | :observed |
| `0x2a36e9d5` | float2 | 8 | :observed |
| `0x885eff59` | float3 | 12 | :observed |
| `0x7f999829` | float4 | 16 | :observed |

## Material families

Measured stock world-object materials use a two-set template with a 70-parameter, 2,426-byte block. Primary
colour/mask/normal slot tags are `79a3/9695/af17`; secondary colour/normal/mask are `ba61/0795/0fd7`, alongside
grime and texel detail inputs. :observed

Mask channels are R metallic, G smoothness and A opacity. B is a per-material constant in the measured data,
but its meaning is unresolved. :observed

The `u51.x` vertex value selects the secondary set for value `1`; sampled values `0`, `2`, `3`, `4` use primary.
The selection is flat per triangle. Color0 does not interpolate between these texture sets; it only shades the
primary set slightly. This is measured in game on the two-set row (413, 2332, 2608, 3000), which has no per-vertex
blend between the sets. :observed

:::open[How are parameter names and block hashes generated?]
The parameter-name hash function is unresolved. FNV-1 and FNV-1a 64-bit (seed `0xcbf29ce484222325`), over UTF-8
and over UTF-16 with `0xff` framing, plain and lowercased, match none of the 1,876 distinct parameter-name hashes
in the binding sets of all 28,045 permutations of globals and dingolevel_root, tried against 128,552 candidate
strings from every EBX document of those two TOCs. Block hashes agree for equal measured blocks but do not match tested FNV, MD5 or SHA-1
representations. These are separate unresolved identities. :unknown
:::
