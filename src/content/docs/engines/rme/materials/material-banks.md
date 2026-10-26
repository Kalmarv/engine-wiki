---
title: Material banks (MBP and MDP)
description: "How a submesh's material id becomes shader paths, parameters and texture paths: the three bank files, the MBP index, the MDP record, and which bank an id belongs to."
implementations:
  - name: primase worlds/shred (material.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/shred/src/read/material.rs
---

A [submesh](/engines/rme/geometry/model-quartets/) carries a **material id**, a number that is looked up in a material bank. A bank is a pair of files: an `.mbp` index and an `.mdp` of material records. A material names its vertex and pixel shader and its textures **by path
string**, holds the shader's parameters as float4 values, and lists its texture slots. There are three banks, all in the archive `MATERIALS.PAK` (in `database`). :observed

| Bank | Files | Materials |
|---|---|---:|
| environments | `environments\env_materials.mbp`, `.mdp` | 3,020 |
| characters | `characters\char_materials.mbp`, `.mdp` | 1,065 |
| actors | `actors\actor_materials.mbp`, `.mdp` | 17 |

All 4,102 records of the three banks were read to their last byte with no byte left over. :proven[all 4,102 materials]

All numbers are big-endian.

## MBP index

```layout
title: MBP header
size: 24
games: [shred]
note: Followed by `count` entries of 12 bytes, which end exactly at the end of the file.
fields:
  - {at: 0, size: 4, type: u32, name: magic, value: "0xFADD0001", level: proven}
  - {at: 4, size: 4, type: u32, name: file_size, level: proven}
  - {at: 8, size: 4, type: u32, name: header_words, value: "0x00180000", level: observed, note: "a u16 24 (the table offset) and a zero u16"}
  - {at: 12, size: 4, type: u32, name: sentinel, value: "0xBEEFFACE", level: proven}
  - {at: 16, size: 4, type: u32, name: count, level: proven}
  - {at: 20, size: 4, type: u32, name: table_offset, value: "24", level: proven}
```

```layout
title: MBP entry
size: 12
games: [shred]
fields:
  - {at: 0, size: 4, type: u32, name: material_id, level: proven, note: "unique within a bank; 0 occurs in all three banks"}
  - {at: 4, size: 4, type: u32, name: mdp_offset, level: proven}
  - {at: 8, size: 4, type: u32, name: packed_size, level: proven, note: "the byte length in the low 22 bits; the upper 10 bits are 0x004 in every entry"}
```

The records start at offset 0 of the MDP, follow one another without gap or overlap and end at its last byte; the id in each record (at `0x10`) equals the id of its index entry. :proven[all 4,102 materials]

## MDP record

The record starts with a fixed header; every pointer in it is an offset **from record + 0x40**. After the header come the two shader paths, the parameter descriptors, the parameter values, the sampler descriptors, one texture-path pointer per sampler and the texture paths, padded to 16 bytes with zeros (0 to 15 of them). :proven[all 4,102 materials]

```layout
title: MDP record header
size: 96
games: [shred]
fields:
  - {at: 0, size: 4, type: u32, name: magic, value: "0xAAAA0003", level: proven}
  - {at: 4, size: 4, type: u32, name: header_size, value: "0x40", level: proven}
  - {at: 8, size: 4, type: u32, name: unknown, value: "0x00400000", level: unknown}
  - {at: 12, size: 4, type: u32, name: sentinel, value: "0xBEEFFACE", level: proven}
  - {at: 16, size: 4, type: u32, name: material_id, level: proven}
  - {at: 20, size: 4, type: u32, name: unknown, value: "0xFFFF000E", level: unknown}
  - {at: 24, size: 4, type: u32, name: unknown, value: "0xFFFFFFFF", level: unknown}
  - {at: 28, size: 4, type: u32, name: identifier, level: unknown, note: "3,578 distinct values over 4,102 records"}
  - {at: 32, size: 8, type: "u32[2]", name: unknown, value: "0xFFFFFFFF", level: unknown}
  - {at: 40, size: 4, type: u32, name: unknown, level: unknown, note: "110 distinct values, 0 to 0x25"}
  - {at: 44, size: 4, type: u32, name: unknown, level: unknown, note: "45 distinct values"}
  - {at: 48, size: 8, type: "u32[2]", name: unknown, value: "0xFFFFFFFF", level: unknown}
  - {at: 56, size: 4, type: u32, name: zero, level: unknown}
  - {at: 60, size: 4, type: u32, name: state_flags, level: unknown, note: "34 distinct values; 0x200 in 3,255 records, 0 in 491"}
  - {at: 64, size: 4, type: u32, name: unknown, value: "0xFFFFFFFF", level: unknown}
  - {at: 68, size: 4, type: u32, name: vertex_shader_offset, value: "0x20", level: proven, note: "the path starts at 0x60"}
  - {at: 72, size: 4, type: u32, name: pixel_shader_offset, level: proven, note: "points just past the vertex shader's NUL; not a length"}
  - {at: 76, size: 4, type: u32, name: parameter_count, level: proven}
  - {at: 80, size: 4, type: u32, name: parameter_offset, level: proven, note: "just past the pixel shader's NUL"}
  - {at: 84, size: 4, type: u32, name: sampler_count, level: proven, note: "0 to 10"}
  - {at: 88, size: 4, type: u32, name: sampler_offset, level: proven, note: "just past the last parameter value"}
  - {at: 92, size: 4, type: u32, name: texture_pointer_offset, level: proven, note: "just past the sampler descriptors"}
```

The shader paths are ASCII strings without an extension, the stem of the `.shp`, `.vsp` and `.psp` entries of the `SHADERS` sections. One material names a pixel program that does not exist on the disc, `shaders\pixel\environment\env_challenge_outline`. :observed

### Parameters

```layout
title: Parameter descriptor
size: 16
games: [shred]
note: "`parameter_count` descriptors, then one float4 value for each, in the same order."
fields:
  - {at: 0, size: 4, type: u32, name: name_hash, level: proven, note: "sdbm of the shader uniform's name"}
  - {at: 4, size: 4, type: u32, name: encoding, level: unknown, note: "0x000100AD in 72,115 descriptors, 0x020100AD in 121"}
  - {at: 8, size: 4, type: u32, name: sentinel, value: "0xFFFFFFFF", level: observed}
  - {at: 12, size: 4, type: u32, name: value_offset, level: proven, note: "of a float4 (four f32), right after the descriptors"}
```

The materials hold 72,236 parameter descriptors with a float4 each (all finite, inactive lanes included). A hash is matched to a name by taking the sdbm of the uniform names in the material's own pixel program: 28,121 descriptors match and 44,115 do not. :proven[all 4,102 materials]
A hash in the same material may repeat; the order is meaningful and is kept. :observed
The vertex programs' own parameters have no names, so a vertex-stage uniform cannot be matched. :observed

### Samplers and textures

```layout
title: Sampler descriptor
size: 28
games: [shred]
note: "`sampler_count` descriptors, then one u32 offset per sampler to its texture path."
fields:
  - {at: 0, size: 4, type: u32, name: state, level: unknown, note: "0 in 30,413 descriptors, 0x01010100 in one, 0x02020200 in seven"}
  - {at: 4, size: 4, type: u32, name: state, level: unknown, note: "2 in 30,416 descriptors, 1 in four, 3 in one"}
  - {at: 8, size: 4, type: u32, name: packed_state, level: unknown, note: "0x00020C02 in 30,416 descriptors"}
  - {at: 12, size: 4, type: u32, name: zero, level: observed}
  - {at: 16, size: 4, type: u32, name: binding_hash, level: observed, note: "21 distinct values; four are named, see below"}
  - {at: 20, size: 4, type: u32, name: state, level: unknown, note: "0x200 in 30,408 descriptors; 0, 0x201, 0x202 and 0x300 in the rest"}
  - {at: 24, size: 4, type: u32, name: sentinel, value: "0xFFFF000E", level: observed}
```

The texture path of a sampler is the name of a `.thp` entry without its extension. Of the 30,421 sampler slots, 15,319 have an empty path, 14,117 name a texture that exists on the disc (case-insensitively) and 985 name one that does not (91 in the character bank, 894 in the environment bank). :proven[all 4,102 materials]
A material's textures are therefore not all present: a reader has to keep an unresolved path as it is. :observed

The binding hash is an sdbm. Four of the 21 values equal the sdbm of a string in the executable: `95591c40` is `Color_Map` (3,995 slots), `d79d6be4` `Normal_Map` (3,948), `ffc34d98` `Spec_Map` (2,998) and `2538db2e` `Effect_Map` (2,816), 13,757 slots in all. The other 17 values (16,664 slots) match no string in the executable, the scripts or the shader files. :proven[2,661,053 candidate strings]
That a slot is named `Color_Map` shows the identity of the slot, not what the pixel program does with it. The shaders' parameter tables list no samplers, so which texture unit a slot feeds is not established, and "slot i feeds unit i" is not assumed. :unknown

## Which bank

A submesh's id is looked up in the bank of its own **quartet's namespace**: the path of the quartet decides. Every nonzero id under `levels\` is found in the environment bank, under `characters\` in the character bank and under `actors\` in the actor bank, and none is missing. The 34,469 nonzero references (2,885 distinct ids) are 26,669 environment, 1,521 character and 6,279 actor. :proven[all 35,114 submeshes]
A PAK's directory does not decide: level PAKs hold both environment and actor materials. :proven[all 35,114 submeshes]

Material id 0 occurs in all three banks, and 645 submeshes use it (514 in levels, 5 in characters, 126 in actors). The namespace rule picks the bank for it as well, which is reasoning, not something the loader was seen to do. :inferred
With that rule the 35,114 submeshes use 27,183 environment, 1,526 character and 6,405 actor materials. :inferred

:::open[How does the engine choose between the banks?]
The loader's lookup (the function at `0x00415b84` that the model finalizer calls with the submesh's id) was not traced to a bank choice.
:::

:::open[What do the state words mean?]
The header words at 28, 40, 44 and 60 and the sampler state words are kept as integers; their values (blend, depth and sampler state are the obvious candidates) are not tied to anything in the engine.
:::
