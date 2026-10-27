---
title: Lights and emissive fixtures
description: WhiteRoom spotlights, managed light references, open-world emissive geometry and intensity limits.
games: [riders-republic, "shaun-white-skateboarding"]
implementations:
  - name: anvil-formats Anvil light reader
    url: https://github.com/Kalmarv/anvil-formats/blob/main/src/light.rs
---

Riders Republic separates punctual light objects from emissive surfaces. The six installed forges contain 32 SpotLight resources and 32 corresponding LightInstance entities, all in WhiteRoom, counting base and patch copies. Open-world lamp fixtures instead use emissive materials; the examined open-world resource and entity scans find no punctual-light objects of the known light classes. :proven[all six forge indexes and all Entity/EntityGroup class scans]

## SpotLight storage

```layout
title: SpotLight body, selected fields
size: 328
note: Body offsets; fields checked on all 16 base resources and their 16 equal patch copies. Intervening bytes are not fully interpreted.
fields:
  - {at: 34, size: 4, type: u32, name: LightColor class, value: "0xA79767ED", level: proven}
  - {at: 38, size: 16, type: float4, name: colour RGBA, level: proven}
  - {at: 54, size: 4, type: f32, name: intensity-like value, level: inferred, note: "schema label Intensity; stored values reach 3e10"}
  - {at: 58, size: 4, type: f32, name: luminance-like value, level: inferred, note: "schema label Luminance; physical units not established"}
  - {at: 308, size: 4, type: f32, name: inner cone angle, level: proven, note: "radians"}
  - {at: 312, size: 4, type: f32, name: outer cone angle, level: proven, note: "radians"}
  - {at: 320, size: 4, type: f32, name: range, level: proven, note: "2 to 30 metres in the WhiteRoom set"}
  - {at: 324, size: 4, type: f32, name: near distance, level: inferred, note: "0.1 or 0.001; ShadowNear in related schemas"}
```

The placed light's position and direction come from its Entity transform, while the referenced SpotLight supplies colour and cone values. The 311-byte LightInstance has a managed reference at offset 44 with prefix **`03 01`**, then u64 identity. It is not the null form of a generic Material reference. All 32 identities resolve to SpotLight resources. :proven[all 32 installed LightInstance bodies and reference targets]

The fill light's colour is (1,.891,.560), its two intensity-like values are `5.3e9` and `3.4e7`, cone angles 12 degrees and range 20 metres. Those values do not establish a conversion to lumens, candela or lux. :observed[WhiteRoom fill] :unknown[physical calibration]

## Open-world fixtures

In The Deck's examined 2,284 placed owners, 4,556 Visual instances are LODSelectorInstance and none is LightInstance. Emissive glass, bulbs, signs and lanterns are geometry using emissive material channels, not a hidden punctual light at every visible bulb. :observed[area component census]

Three emissive material families occur on 22 distinct meshes and 604 placements in that area. Splitting their emissive triangles by position-connected components within 1 mm produces 4,083 pieces: 3,406 up to .6 metres, 498 up to 2.5 metres and 179 longer pieces. These are geometric components, not a count of engine light objects. :observed[area geometry analysis]

Some owners use time-of-day FX that modify material properties. Sampled GalleryLightPole fixtures have no such FX, while other park props do; a night appearance cannot be inferred from the mesh's name alone. :observed[owner components]

Emission in the traced materials is exposure-referenced and passes through the material/lighting combination described in [surface formulas](/engines/anvil/materials/surface-formulas/). :observed[shader writers and lighting consumer]

:::open[What are the punctual lights' physical units?]
The stored intensity-like fields and cone/range values are readable, but their physical calibration and all shadow flag meanings are not established. :unknown
:::

## Shaun White Skateboarding

:only[shaun-white-skateboarding]

Level 01 places 110 `OmniLight` and 79 `SpotLight` objects through Visual components (one Visual per light, at the owning entity's matrix), and its root entry holds one `SkyLight`. The light layouts are those of the Assassin's Creed II schema with changes: a graphic-object category and generated flag (5 bytes), five bools before the intensity and a `u32` shadow-map resolution. :observed{games="shaun-white-skateboarding"}[level 01]

| Class | Body size | Fields in order | Confidence |
|---|---:|---|---|
| `OmniLight` | 102 | Dynamic, CastShadows, AffectCharacters, AffectEnvironment, DirtyFlag, Intensity, Flare, a `u32` (1 to 3), Near, Far | :observed |
| `SpotLight` | 118 | the same, then LittleAlpha, BigAlpha, Cookie id, one more `u32`, Near, Far | :observed |
| `SunLight` | 94 | the sun fields inside the sky light | :observed |
| `LightFlare` | 43 | non-managed inline object | :observed |

All 110 omni and all 79 spot lights of level 01 decode exactly. :observed[level 01]

On street-light placements the spot light's local +Y axis points down. :inferred[from the placements' orientation]

The photometric units, the colour encoding of the light colour and the intensity scale are not calibrated against rendered output. :unknown
