---
title: Material and TextureSet
description: Material property envelopes, texture selectors, template descriptors and binding records.
games: [riders-republic, "shaun-white-skateboarding"]
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
  - {at: 0, size: 1, type: u8, name: managed byte, value: 1, level: proven}
  - {at: 1, size: 10, type: reference, name: MaterialTemplate, level: proven}
  - {at: 11, size: 10, type: reference, name: TextureSet, level: proven}
  - {at: 21, size: 102, type: bytes, name: material prelude, level: proven, note: "includes render flags; individual fields below"}
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
  - {at: 0, size: 4, type: u32, name: TextureParameter class, value: "0x7D08460D", level: proven}
  - {at: 4, size: 1, type: u8, name: stored byte, level: unknown, note: "0 in the measured records"}
  - {at: 5, size: 4, type: u32, name: TextureSpecificationMethod, level: observed, note: "channel; distinct from the shader texture register"}
  - {at: 9, size: 4, type: u32, name: MapType, level: observed, note: "TextureSet slot"}
  - {at: 13, size: 4, type: u32, name: stored word, level: unknown, note: "0 in the measured records"}
  - {at: 17, size: 10, type: reference, name: set reference, level: proven}
  - {at: 27, size: 10, type: reference, name: texture reference, level: proven}
```

Template binding records link graph operators. TextureObject operators contain a TextureSelector and SamplerMode; constant operators contain default scalar, integer or vector values; UVTransformOperator contains the default transform. Reading every binding's operator across all templates establishes the stored defaults, independently of whether a Material supplies an override. :proven[all template operators]

The custom texture operator `0x1181BD58` also carries a selector. All 36 such operator objects across 14 template names identify their custom definition as `TextureObject`. Waterfall's height-map selector and the cactus normal-map selector agree with the corresponding TextureSet entries. Treating it as a texture fetch is supported by these joins; the engine's complete resolution routine is not established. :proven[all 36 stored custom operators] :observed[two selector/content controls] :inferred[custom resolution]

A data-based resolution model uses a Material property first, the Material's set slot for channel 0 next, then the template's default image for channels 1 or 2. Generic `Texture` labels require the selector's slot/channel as well as the label hash. Null overrides and the engine's final substitute for an unfilled mask remain unresolved; a white mask is consistent with authored tints and AO settings but is not an observed runtime binding. :inferred

## Template descriptors and labels

A property descriptor consists of eight zero bytes, class `0xD933DB50`, a link tag, u64 linked identity, u32 discriminator, three strings, then two counted string lists. Strings are a u32 byte length followed by those bytes and one zero terminator only when nonempty. Descriptor runs have a preceding count. :proven[6,762 descriptors in 416 nonempty template entries]

The second string is the exact property label. Every one of the 35,918 Material texture records matches its key to the CRC-32 of that string in its referenced template; there are 125 distinct matched labels and no unresolved keys or distinct-byte collisions among those matches. CRC-32 covers the exact ASCII bytes, excluding length and NUL, with reflected polynomial `0xEDB88320` and all-ones initial/final XOR. :proven[all stored texture properties]

The [complete texture-label vocabulary](/engines/anvil/materials/texture-labels/) lists every matched label, key and stored occurrence count.

| Exact label | Key | Confidence |
|---|---|---|
| `1 - Diffuse Alpha` | `0xE4B6CC48` | :proven |
| `1 - Diffuse Alpha `, with a trailing space | `0x918FB02B` | :proven |
| `2 - Normal Map` | `0x443BF980` | :proven |
| `1 - Albedo (RGB) + Opacity (A)` | `0x463E0755` | :proven |
| `Texture` | `0x4DDB34EE` | :proven[complete label join] |

Of all 432 stored template entries, sixteen have an empty descriptor run rather than a nonempty marker run. They include default/error templates, video, snow-trail, vertex-colour display and FakeForest families. Descriptor counts do not bound binding-record counts. :proven[all 432 template entries]

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
The [render-state page](/engines/anvil/materials/render-state/) describes the prelude flags; [UV transforms](/engines/anvil/materials/uv-transforms/) distinguishes measured matrix forms from unresolved composition and animation rules.

:::open[What is the exact runtime texture fallback order?]
The stored selector and defaults are established. The complete runtime precedence, null-override treatment and unfilled-slot substitute have not been established from the engine's binding code. :unknown
:::

## Shaun White Skateboarding

:only[shaun-white-skateboarding]

Every drawn surface of Shaun White Skateboarding uses the material class `SKGenericMaterial` (`0xB71F6261`). It holds its texture references and colour controls inline in one fixed-size body: 647 bytes in each of the 3,843 material objects of level 01. Textures are reached through `TextureMapSpec` objects, whose last `u32` (offset 28 of its 32-byte body) is the id of a `TextureMap` in the same cell. :observed{games="shaun-white-skateboarding"}[level 01]

A material class has no shader-template id and no template descriptor: which program draws a surface follows from the combination of stored slots and switches, resolved by the [SDB2 shader bundles](/engines/anvil/shaders/sdb2/) the game ships. :observed

```layout
title: "SKGenericMaterial body (selected fields)"
size: 647
games: [shaun-white-skateboarding]
note: "Little-endian. Offsets are body offsets; the fields not listed are stored bytes without an established meaning. Slot blocks are described separately below."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "managed", "level": "observed"}
  - {"at": 1, "size": 4, "type": "u32", "name": "id", "level": "observed"}
  - {"at": 5, "size": 4, "type": "u32", "name": "class", "value": "0xB71F6261", "level": "proven"}
  - {"at": 21, "size": 4, "type": "u32", "name": "blend", "level": "observed", "note": "enum; 4 on alpha-blended decals (source alpha, inverse source alpha, no depth write); 6 on glow effects, probably AdditiveAlpha"}
  - {"at": 25, "size": 1, "type": "bool", "name": "blended", "level": "inferred", "note": "1 on blended surfaces"}
  - {"at": 26, "size": 1, "type": "bool", "name": "alpha test", "level": "inferred", "note": "1 on cut-out surfaces"}
  - {"at": 27, "size": 1, "type": "u8", "name": "alpha test reference", "level": "inferred", "note": "119 on the Ministry metro tile decal"}
  - {"at": 28, "size": 4, "type": "u32", "name": "display", "level": "unknown", "note": "0 on the materials examined"}
  - {"at": 36, "size": 1, "type": "bool", "name": "TwoSided", "level": "observed", "note": "property hash 0x403525B2 = CRC-32 of the name"}
  - {"at": 37, "size": 1, "type": "bool", "name": "InvertCulling", "level": "observed", "note": "property hash 0x4F892276 = CRC-32 of the name"}
  - {"at": 71, "size": 4, "type": "u32", "name": "collision surface id", "level": "observed", "note": "when nonzero, the id of a collision-surface object (water fountains: Water; debug grids: Concrete, Dirt, ConcreteStairs)"}
  - {"at": 79, "size": 1, "type": "u8", "name": "unknown", "level": "unknown", "note": "1 on 406 distinct materials (characters, vehicles, metro cars, helicopters), 2 on 37 (light paint, smoke scrolls, beams); not read by the sidedness code"}
  - {"at": 91, "size": 1, "type": "bool", "name": "water", "level": "observed", "note": "see water below"}
  - {"at": 118, "size": 4, "type": "u32", "name": "detail slot", "level": "observed", "note": "a tiled detail map: the fake-reflection ramp, the character skin wrap"}
  - {"at": 132, "size": 4, "type": "u32", "name": "mask slot", "level": "observed", "note": "Gen_Mask_* textures: a grime or tint mask; the slot carries an RGBA tint"}
  - {"at": 168, "size": 16, "type": "f32[4]", "name": "layer 1 tint", "level": "observed", "note": "RGBA"}
  - {"at": 192, "size": 33, "type": "slot block", "name": "diffuse 1", "level": "observed"}
  - {"at": 233, "size": 4, "type": "u32", "name": "normal map", "level": "observed", "note": "TextureMapSpec id"}
  - {"at": 265, "size": 4, "type": "f32", "name": "HeightScale", "level": "observed", "note": "property hash 0xD963A8E7 = CRC-32 of the name; 1.0 on 788 of 798 materials with a normal map"}
  - {"at": 277, "size": 4, "type": "u32", "name": "specular map", "level": "observed", "note": "TextureMapSpec id"}
  - {"at": 332, "size": 16, "type": "f32[4]", "name": "Layer2_ModulationColor", "level": "observed", "note": "property hash 0xC865F2A3 = CRC-32 of the name"}
  - {"at": 348, "size": 4, "type": "u32", "name": "Layer2_UVChannel", "level": "observed"}
  - {"at": 360, "size": 33, "type": "slot block", "name": "diffuse 2", "level": "observed"}
  - {"at": 401, "size": 4, "type": "u32", "name": "second specular map", "level": "observed", "note": "TextureMapSpec id"}
  - {"at": 434, "size": 16, "type": "f32[4]", "name": "layer 3 tint", "level": "observed", "note": "RGBA"}
  - {"at": 450, "size": 4, "type": "u32", "name": "Layer3_UVChannel", "level": "observed"}
  - {"at": 462, "size": 33, "type": "slot block", "name": "diffuse 3", "level": "observed"}
  - {"at": 521, "size": 4, "type": "u32", "name": "Diffuse2", "level": "observed", "note": "TextureMapSpec id"}
  - {"at": 525, "size": 4, "type": "u32", "name": "InfluenceHidePixelMode", "level": "observed", "note": "property hash 0x7DACF81C; see influence"}
  - {"at": 537, "size": 4, "type": "u32", "name": "generic map", "level": "observed", "note": "TextureMapSpec id; valid only when the word is an object id"}
```

```layout
title: "Diffuse slot block"
size: 33
games: [shaun-white-skateboarding]
note: "Little-endian. Offsets are relative to the block; the block starts at body offset 192, 360 or 462."
fields:
  - {"at": 0, "size": 4, "type": "u32", "name": "TextureMapSpec id", "level": "observed"}
  - {"at": 4, "size": 8, "type": "f32[2]", "name": "scale", "level": "inferred", "note": "tiling; position inferred from the rotation's position after scale and offset"}
  - {"at": 12, "size": 8, "type": "f32[2]", "name": "offset", "level": "inferred"}
  - {"at": 20, "size": 4, "type": "f32", "name": "rotation", "level": "proven", "note": "degrees"}
  - {"at": 24, "size": 4, "type": "u32", "name": "TexMapMode U", "level": "observed", "note": "enum, wrap or clamp style"}
  - {"at": 28, "size": 4, "type": "u32", "name": "TexMapMode V", "level": "observed", "note": "enum"}
  - {"at": 32, "size": 1, "type": "bool", "name": "UseTextureAlpha", "level": "observed", "note": "property hash 0xA94D8B5D; the layer's sampled alpha weights its blend"}
```

The second diffuse layer's UseTextureAlpha flag lies at body offset 392 and the third's at 494, the same 32 bytes after the start of their blocks. :observed

The meaning of the TexMapMode enum values, of the display word at 28 and of the bytes between the listed fields is not established. :unknown

### Water

Byte 91 is a strict boolean. Over the 1,971 distinct fixed-size materials of the six levels it is set on exactly six: `WaterPort`, `WaterPool` and `WaterToxic01` of level 01, the ocean and pirate-ship water of level 03 and `ReservoireWater01` of level 04. The other 1,965 store 0, including water-named tanks, foam, fountains and effect sheets. All six set materials have a normal map, a specular map and a cube reflection and no diffuse map. No shader-template id and no water animation semantic is stored. :observed{games="shaun-white-skateboarding"}[all six levels]

The tint of the harbour water at offset 168 is (41, 60, 71) of 255 with alpha 1. :observed

### Materials that hide pixels

See [influence](/engines/anvil/materials/influence/) for the material setting that discards a surface in one of the game's two colour states.
