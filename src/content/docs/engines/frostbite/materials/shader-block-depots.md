---
title: ShaderBlockDepots and material parameters
description: Material-key lookup, relocatable depot containers, typed parameters and texture bindings.
games: [skate]
sources:
  - title: FrostyToolsuite (Skate2025 branch)
    url: https://github.com/CadeEvs/FrostyToolsuite
    note: ShaderBlockDepot reader of a community fork's skate. profile; GPL-3.0
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
  - {at: 0, size: 8, type: u64, name: key hash, level: observed, note: "The top 16 bits are the low half of the 32-bit name hash; the 48 bits below are not explained (see Parameter keys)."}
  - {at: 8, size: 4, type: u32, name: type hash, level: observed}
  - {at: 12, size: 2, type: u16, name: count, level: proven, note: "Equal to the u32 at +16 in every record that has one"}
  - {at: 14, size: 2, type: u16, name: identity, level: observed, note: "The high half of the 32-bit name hash; checked on the 207 keys whose parameter asset is known"}
```

The 2,473 distinct stock depots hold 192,642 material entries; entries of one depot that share a descriptor share a
block, so they point at 64,105 parameter blocks (1,762,286 parameter records; 5,451,023 counted once per entry).
Counted once per entry, the `u16` at +12 equals the `u32` at +16 in all 4,527,851 non-texture records, 633,249 of which
hold more than one element, and each record's length is 20 plus that count times the element size; texture records have
count 1 (923,172). The count of a value is therefore an element count, not a byte size. :proven[every stock block]
732 entries, which use 95 blocks, hold a parameter of a type that is not in the table below (`0x566e2dd0`, one byte an
element; 95 records); with that size every one of the 64,105 blocks parses to its last byte. :proven[every stock block]

The 1,636 distinct 64-bit key hashes of the stock depots, none of them used under two parameter types, have 1,636
distinct low 48 bits and 1,609 distinct top 16 bits, and the `u16` at +14 is the same for every record with the same key
hash. :proven[every stock block]
The top 16 bits of the key hash and the `u16` at +14 are the two halves of one 32-bit name hash (see
[Parameter keys](#parameter-keys)). The `u16` takes 1,337 distinct values over the 1,636 key hashes, where independent
16-bit values would give about 1,616; 1,010 pairs of key hashes share a value against about 20 expected, one value is
shared by 16 key hashes, and the 334 texture parameters have only 239 distinct values. :proven[every stock block] The
excess is the hash's: it is a djb2-style hash, whose high half does not change with the last one or two bytes of a name,
so parameters whose names differ only there (`param_region_color_0a` and `param_region_color_0b`, `param_basecharacter_isk`
and `param_basecharacter_utk`) share the `u16`. Of the 182 values the 207 known keys take, 21 are shared, each by names that
differ only in their last characters. :observed[207 keys with a known parameter asset]
The value is not a function of the type, of the top 16 bits of the key hash (the 27 pairs of hashes with equal top 16 bits
have different values), or of any 16-bit slice of the 64-bit hash or the xor or sum of the four slices.
:observed[every stock block]
Seeded with 5381 (the game's asset-name hash), the djb2-XOR hash of none of the 303,105 distinct strings found in the stock
EBX documents forms the top 16 bits together with the `u16` at +14, and neither is any reflection name key (21,561 distinct
keys); the seed is `0x6875ca4d`. :observed[303,105 strings; 1,636 key hashes]
None of the 1,636 key hashes occurs as a constant in `Skate.exe`. :proven[every 8-byte window of the executable image]

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

## Parameter keys

A shader parameter's identity is a 16-byte key: the prefix of every depot parameter record is a key, and EBX documents
carry the same 16 bytes as the `Data` GUID of the `ParamDbKeySerialized` structure. A material's parameter node in the
running game holds it with the identity word first: `u16 identity, u16 size, u16 type index, u16 count, u64 hash`.
:sourced[ReSkate]

**The name hash.** The 32-bit name hash of a parameter is a lower-cased djb2-XOR hash of the document name of its
`ShaderExpressionParameter` asset, started from `0x6875ca4d`:

```text
h = 0x6875ca4d
for c in lower(name): h = (h * 33) ^ c        (32-bit arithmetic)
key hash bits 48..63 = h & 0xffff             identity (bytes 14..15) = h >> 16
```

All 207 distinct keys that the stock EBX documents tie to a parameter asset satisfy it, with the asset's document name as the
bundle manifests state it (lower case; the asset's own `Name` field holds the same path in its original case).
:proven[all 207 keys tied to an asset in the 328,015 stock payloads]
Names that differ only in their last byte have name hashes that differ by the XOR of the two bytes (20 pairs, for example
`param_region_color_2a` and `param_region_color_2b`: 3). :observed[20 pairs of known names]
The 207 keys are 40,262 uses by `AppearanceExpressionParamInfo` values, whose `Value.Parameter` pointer names the asset;
each key has one asset and each asset one key. 195 of the 207 keys equal a depot parameter prefix in hash, type and
identity. :proven[every stock payload and depot]
Of all 330,760 document and resource names of the install, exactly those 195 hash to the name hash of a depot parameter, and
of the 1,216,438 distinct strings of the stock documents only one other does, by coincidence (`riff 1`): the names of the
other 1,441 depot key hashes are stored nowhere as a document name or a string value. :proven[every manifest name and EBX string]
The seed is a measured constant; how the game arrives at it is not known. :unknown
FrostyToolsuite's profile describes the top 16 bits as the low half of this hash of the lower-cased name :sourced[FrostyToolsuite];
for skate. the census confirms it, with the identity word as the high half and this seed.

**The assets.** The 212 documents under `common/shadercomponents` (202 under `parameters`, 10 under `configuration`) are 203
`ShaderExpressionParameter` assets, each a single `Name` field holding the document's path, and nine enumeration type assets.
All 203 parameter assets have a key; the enumerations have none. Four more keys belong to assets in `shaders/character/body/_sg`
(`param_coloroffset_mult2x`, `param_coloroffset_saturation`, `param_skinindexasfloat`,
`sg_body_applyskindetail/detailnormalintensity`). :proven[all 328,015 stock payloads]

**Where documents carry keys.** 381 distinct non-zero keys occur in 9 structure types of the stock documents; 357 of them are
depot parameter hashes and 207 are tied to an asset. :proven[all 328,015 stock payloads]

| Structure | Uses | Documents | Beside the key |
|---|---|---|---|
| `AppearanceExpressionParamInfo.ParamKey` | 40,262 | 1,679 | `Value.Parameter`, a pointer to the parameter asset |
| `TextureCompositorSerializedParameterValue.Parameter` | 1,110 | 579 | nothing (8 keys) |
| `ShaderParameterBlockEntryData.Key` | 525 | 76 | nothing (124 keys) |
| `DingoCustomizationItemColorShiftRuntimeColor.Key` | 228 | 39 | colour positions (16 keys) |
| `EffectParameter.ShaderParamKey` | 191 | 4 | `Name`; one use has a key, the other 190 are zero |
| `LuaShaderParamBindingRuntimeEntry.Key` | 34 | 5 | `Name`, the alias a Lua script uses (30 keys) |
| `DingoAdTechComponentData.ParamKey` | 20 | 7 | `ParamName`, a display name such as `[C] (Mutable)` (1 key) |
| `AppearanceExpressionShaderParameterPipelineData.Key` | 16 | 3 | nothing (12 keys) |
| `ShaderParamsComponentData.ParameterKey` | 57 | 55 | `ParameterName` (`NightAmount`); the key is zero |

The `Name` beside a key is not always the asset's name: the Lua bindings map aliases to keys (`Base_C_C` and
`Param_Composite_C` name one key; `BodyNormalMap` names the key of `param_basecharacter_ny` and `HeadNormalMap` that of
`param_facebase_ny`), and a display name need not hash to its key. :observed[the 34 Lua entries]
A key with a zero value and a name beside it (all but one `EffectParameter`, and `NightAmount` in the visual environment's
`ShaderParamsComponentData`) is one the game fills in when the document loads, from the name. :inferred
The name hash of `Param_Composite_*` Lua names back-solves to the directory `common/shadercomponents/parameters/composite/`
(`param_composite_c`, `_ny`, `_ogk`, `_osk`, `_vibrancy`, `param_composite_boardwear_intensity_{body,nose,tail}_h`): no document
has these names, yet their keys carry the name hashes of those paths; the three `_w` variants do not back-solve to it.
:observed[11 names]

**Parameter collections.** Nine resources of type `0xf434940d` (three in the globals TOC, six in the `dingolevel_root` TOC; for
example `common/shadercomponents/configuration/collections/characterglobal_collection` and `worldsurfacing_collection`) list
the keys of a parameter group, 16 bytes each in the layout of the prefix above, followed by pairs of (byte width, offset) that
place the values. :observed[2 of the 9]

## Material families

Measured stock world-object materials use a two-set template with a 70-parameter, 2,426-byte block. The top 16 bits of
the primary colour, mask and normal texture parameters' key hashes are `79a3`, `9695` and `af17`, the name-hash halves of
`param_base_c`, `param_base_msk` and `param_base_ny`; those of the secondary colour, normal and mask parameters are
`ba61`, `0795` and `0fd7` (their names are not known), alongside grime and texel detail inputs. :observed

Mask channels are R metallic, G smoothness and A opacity. B is a per-material constant in the measured data,
but its meaning is unresolved. :observed

The `u51.x` vertex value selects the secondary set for value `1`; sampled values `0`, `2`, `3`, `4` use primary.
The selection is flat per triangle. Color0 does not interpolate between these texture sets; it only shades the
primary set slightly. This is measured in game on the two-set row (413, 2332, 2608, 3000), which has no per-vertex
blend between the sets. :observed

:::open[What are the other 48 bits of a parameter key, and the block hashes?]
The 48 bits of a key hash below the name hash's low half are not the CityHash64, FarmHash, xxHash, Murmur3 or FNV hash
(64-bit and 128-bit forms, several seeds) of a parameter asset's name, its lower-cased, upper-cased or UTF-16 form, its last
path component, or any of several million buffers that join the name with its type id, name hash, length (1, 2, 4 or 8
bytes), a NUL, or the layout FrostyToolsuite's profile describes (a 1, three lengths, name, type, module) with any of 21,621
reflection names as the type and 4,080 directory strings as the module. The engine holds a CityHash64 equal to the
reference implementation on inputs of 0 to 1,000 bytes, and none of its 264,603 functions of up to 2,560 bytes returns the
key hash, its low 48 bits or its high 48 bits from a parameter asset's name (exact case, lower case or last component) in
nine argument layouts under emulation; the same sweep finds the engine's CityHash64 when asked for CityHash64 of the name.
:observed[the 203 parameter assets of known name; the executable image]
Block hashes agree for equal measured blocks but do not match tested FNV, MD5 or SHA-1 representations; they are a separate
identity. :unknown
:::
