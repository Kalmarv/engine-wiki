---
title: ShaderBlockDepots and material parameters
description: Material-key lookup, relocatable depot containers, typed parameters and texture bindings.
games: [skate]
implementations:
  - name: frostbite-formats (depot.rs)
    url: https://github.com/Kalmarv/frostbite-formats/blob/main/src/depot.rs
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
  - {at: 12, size: 2, type: u16, name: count, level: proven, note: "Equal to the u32 at +16 in every record that has one"}
  - {at: 14, size: 2, type: u16, name: per-hash value, level: unknown, note: "One value per distinct 64-bit name hash, but not a hash of independent bits: 1,337 values over 1,636 hashes, up to 16 hashes sharing one"}
```

The 2,473 distinct stock depots hold 192,642 material entries; entries of one depot that share a descriptor share a
block, so they point at 64,105 parameter blocks (1,762,286 parameter records; 5,451,023 counted once per entry).
Counted once per entry, the `u16` at +12 equals the `u32` at +16 in all 4,527,851 non-texture records, 633,249 of which
hold more than one element, and each record's length is 20 plus that count times the element size; texture records have
count 1 (923,172). The count of a value is therefore an element count, not a byte size. :proven[every stock block]
732 entries, which use 95 blocks, hold a parameter of a type that is not in the table below (`0x566e2dd0`, one byte an
element; 95 records); with that size every one of the 64,105 blocks parses to its last byte. :proven[every stock block]

The 1,636 distinct 64-bit name hashes of the stock depots, none of them used under two parameter types, have 1,636
distinct low 48 bits and 1,609 distinct top 16 bits, and the `u16` at +14 is the same for every record with the same name
hash. :proven[every stock block]
That `u16` is not the missing half of a 32-bit name hash. It takes 1,337 distinct values over the 1,636 name hashes, where
1,636 independent 16-bit values would give about 1,616; 1,010 pairs of name hashes share a value against about 20
expected, one value is shared by 16 name hashes, and the 334 texture parameters have only 239 distinct values.
:proven[every stock block] The value is not a function of the type, of the top 16 bits of the name hash (the 27 pairs of
hashes with equal top 16 bits have different values), of any 16-bit slice of the 64-bit hash or of the xor or sum of the
four slices, and of the 140 values that several name hashes share only 22 are shared by records whose remaining bytes are
identical. :observed[every stock block; 140 shared values]
The 32-bit value formed by the `u16` at +14 and the top 16 bits of the name hash, in either order, is neither the
djb2-XOR hash (case-exact or lowercased) of any of the 303,105 distinct strings found in the stock EBX documents, nor
a reflection name key (21,561 distinct keys), and neither is the low or high half of the 64-bit hash.
:observed[303,105 strings; 1,636 name hashes]
None of the 1,636 name hashes occurs as a constant in `Skate.exe`. :proven[every 8-byte window of the executable image]

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
| `0x566e2dd0` | One-byte value (boolean) | 1 | :observed |
| `0x14c5fc30` | Texture reference (49-byte record) | | :observed |

Two of these type ids are the reflection name keys of types in the stock EBX documents: `0x2a36e9d5` is the key of the
type name `Vec2` and `0x7826e998` the key of `WpsDistance`; the other eight ids are the key of no name in those documents.
The parameter type id therefore comes from the same case-insensitive name hash as the
[reflection name keys](/engines/frostbite/data-model/ebx/#stock-documents). :observed[21,561 keys against 10 type ids]

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
