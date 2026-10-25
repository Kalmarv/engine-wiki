---
title: Material and TextureSet
description: Material property envelopes, texture selectors, template descriptors and binding records.
games: [riders-republic]
implementations:
  - name: primase Anvil material reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/material.rs
  - name: primase Anvil template reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/template.rs
---

A **Material** links a shader template to a TextureSet and overrides typed properties. A **TextureSet** supplies an ordered table of 19 texture references. The binding index in a shader is different from the TextureSet slot used to resolve its image. :proven[13,579 Materials and 10,027 TextureSets, including patch copies]

## Material body

```layout
title: Material body prefix
size: variable
note: Little-endian; after the resource identity and class header.
fields:
  - {at: 0, size: 1, type: u8, name: managed byte, value: 1, level: observed}
  - {at: 1, size: 10, type: reference, name: MaterialTemplate, level: observed}
  - {at: 11, size: 10, type: reference, name: TextureSet, level: observed}
  - {at: 21, size: 102, type: bytes, name: material prelude, level: observed, note: "includes render flags; individual fields below"}
  - {at: 123, size: 4, type: u32, name: property count, level: proven}
  - {at: 127, size: variable, type: "Property[]", name: properties, level: proven, note: "the last property ends the body on all 13,579 entries"}
```

```layout
title: Property header
size: 16
fields:
  - {at: 0, size: 4, type: u32, name: key, level: proven, note: "CRC-32 of the exact property label for all texture properties"}
  - {at: 4, size: 4, type: u32, name: payload class, level: proven}
  - {at: 8, size: 2, type: u16, name: stored zero, level: unknown, note: "zero on the material census"}
  - {at: 10, size: 4, type: u32, name: type selector, level: proven}
  - {at: 14, size: 2, type: u16, name: stored zero, level: unknown, note: "zero on the material census"}
```

| Class / selector | Payload | Confidence |
|---|---|---|
| 0 / 7 | i32, 4 bytes | :proven |
| 0 / 10 | f32, 4 bytes | :proven |
| 0 / 13 | float4, 16 bytes | :proven |
| `0x7D08460D` / 19 | 45 bytes: object identity, repeated class, TextureParameter fields | :proven |
| `0xC52E2125` / 19 | 47 bytes: identity, repeated class, eight floats, three bytes | :proven |
| `0xECE5D96C` / 19 | 36 bytes: identity, repeated class, six floats | :proven |
| `0xBC0F16F5` / 19 | 45 bytes: identity, repeated class, 33 uninterpreted bytes | :proven[framing] |

The property framing accounts for every byte of all 13,579 stored Materials and agrees with an independent reader. A typed payload's framing does not establish the meaning of every value in it. :proven

## Texture selectors and defaults

```layout
title: TextureParameter
size: 37
note: Starts at the inner repeated class marker; the Material payload also has an eight-byte object identity before it.
fields:
  - {at: 0, size: 4, type: u32, name: TextureParameter class, value: "0x7D08460D", level: observed}
  - {at: 4, size: 1, type: u8, name: stored byte, level: unknown, note: "0 in the measured records"}
  - {at: 5, size: 4, type: u32, name: TextureSpecificationMethod, level: observed, note: "channel; distinct from the shader texture register"}
  - {at: 9, size: 4, type: u32, name: MapType, level: observed, note: "TextureSet slot"}
  - {at: 13, size: 4, type: u32, name: stored word, level: unknown, note: "0 in the measured records"}
  - {at: 17, size: 10, type: reference, name: set reference, level: observed}
  - {at: 27, size: 10, type: reference, name: texture reference, level: observed}
```

Template binding records link graph operators. TextureObject operators contain a TextureSelector and SamplerMode; constant operators contain default scalar, integer or vector values; UVTransformOperator contains the default transform. Reading every binding's operator across all templates establishes the stored defaults, independently of whether a Material supplies an override. :proven[all template operators]

The custom texture operator `0x1181BD58` also carries a selector. All 36 such operator objects across 14 template names identify their custom definition as `TextureObject`. Waterfall's height-map selector and the cactus normal-map selector agree with the corresponding TextureSet entries. Treating it as a texture fetch is supported by these joins; the engine's complete resolution routine is not established. :observed[all 36 objects and two content controls] :inferred[custom resolution]

A data-based resolution model uses a Material property first, the Material's set slot for channel 0 next, then the template's default image for channels 1 or 2. Generic `Texture` labels require the selector's slot/channel as well as the label hash. Null overrides and the engine's final substitute for an unfilled mask remain unresolved; a white mask is consistent with authored tints and AO settings but is not an observed runtime binding. :inferred

## Template descriptors and labels

A property descriptor consists of eight zero bytes, class `0xD933DB50`, a link tag, u64 linked identity, u32 discriminator, three strings, then two counted string lists. Strings are a u32 byte length followed by those bytes and one zero terminator only when nonempty. Descriptor runs have a preceding count. :proven[6,762 descriptors in 416 nonempty template entries]

The second string is the exact property label. Every one of the 35,918 Material texture records matches its key to the CRC-32 of that string in its referenced template; there are 125 distinct matched labels and no unresolved keys or distinct-byte collisions among those matches. CRC-32 covers the exact ASCII bytes, excluding length and NUL, with reflected polynomial `0xEDB88320` and all-ones initial/final XOR. :proven[all stored texture properties]

| Exact label | Key | Confidence |
|---|---|---|
| `1 - Diffuse Alpha` | `0xE4B6CC48` | :proven |
| `1 - Diffuse Alpha `, with a trailing space | `0x918FB02B` | :proven |
| `2 - Normal Map` | `0x443BF980` | :proven |
| `1 - Albedo (RGB) + Opacity (A)` | `0x463E0755` | :proven |
| `Texture` | `0x4DDB34EE` | :observed |

Sixteen template entries have an empty descriptor run rather than a nonempty marker run. They include default/error templates, video, snow-trail, vertex-colour display and FakeForest families. Descriptor counts do not bound binding-record counts. :observed

```layout
title: Template binding record
size: 42
note: Local record layout; records are not guaranteed to form a fixed-stride array.
fields:
  - {at: 0, size: 4, type: u32, name: ShaderParameter marker, value: "0x92D220DD", level: observed}
  - {at: 4, size: 4, type: u32, name: property key, level: observed}
  - {at: 8, size: 4, type: u32, name: f1, level: observed}
  - {at: 12, size: 4, type: u32, name: f2, level: observed}
  - {at: 16, size: 4, type: u32, name: f3, level: observed}
  - {at: 20, size: 4, type: u32, name: f4, level: observed}
  - {at: 24, size: 10, type: reference, name: operator link, level: observed, note: "also has a tag-0 stored form"}
  - {at: 34, size: 8, type: bytes, name: following bytes, level: unknown, note: "zero in the initially measured records; one measured inter-record gap is longer"}
```

| `(f3,f4)` | Binding | Confidence |
|---|---|---|
| `(0,3)` | Texture register `t(75+f1)` | :proven[shader execution in covered families] |
| `(1,0)` | Scalar at `cb3[f2].x` | :proven[shader execution in covered families] |
| `(1,2)` | Vector at `cb3[f2]` | :proven[shader execution in covered families] |
| `(3,6)` | UV matrix starting at `cb3[f2]`; shaders use the first two rows on `(u,v,1)` | :proven[shader execution in covered families] |

See [surface formulas](/engines/anvil/materials/surface-formulas/) for what the texture channels and constants compute.

:::open[What is the exact runtime texture fallback order?]
The stored selector and defaults are established. The complete runtime precedence, null-override treatment and unfilled-slot substitute have not been established from the engine's binding code. :unknown
:::
