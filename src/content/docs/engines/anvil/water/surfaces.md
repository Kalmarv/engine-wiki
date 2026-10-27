---
title: Water surfaces, rivers and lakes
description: FakeWater stand-ins, river meshes, lake patches, atlas channels and depth-dependent water shading.
games: [riders-republic, "shaun-white-skateboarding"]
implementations:
  - name: anvil-formats Anvil lake reader
    url: https://github.com/Kalmarv/anvil-formats/blob/main/src/water.rs
---

Riders Republic uses three distinct water geometries: distant FakeWater boxes or half-float meshes, ordinary river/waterfall meshes, and lake surfaces generated from stored quadtree patches. Their data is not interchangeable with one generic water Material. :observed[component, mesh and shader joins]

## FakeWater

FakeWaterMeshComponent (`0x961F3B5D`) is the only component of 512 stored `WaterVisualEntity_Fake_*` entities, representing 256 base/patch tile identities. Each references a FakeWaterComponentChunk (a forge resource of type `0x4CB7E94B`, which community word lists name FakeWaterMesh) and embeds a FakeWaterMeshInstance (`0xC3457872`), bounds, a Visual tail and three vec4 values describing centre/minimum/maximum. Its instance-matrix count is zero on all 512 bodies. Seventy bodies also hold a small half-float triangle mesh. :proven[all 512 component bodies]

The boxes form 1024-metre world tiles in a 16×16 grid. Every Entity rotation is identity, and Entity x/y translation agrees with the box centre to one metre; the half-float vertices lie within their world boxes. These are world positions, so applying the Entity translation again double-translates them. Half precision reaches four-metre steps at coordinate magnitudes 4096–8192. :proven[all 512 transform/box checks] :proven[all 70 stored FakeWater mesh bounds]

## Rivers and cascades

River_Mesh_generation entities use Visual → LODSelector → Mesh plus a rigid-body mesh shape. The stored set includes 10,667 named river LOD meshes, with waterfall and skirt variants among the related entities. :observed[resource and entity joins]

There are 2,905 `River_Mesh_generation_[x,y]_PACK_*` Entities in the base forge and 2,885 in the patch, counting the waterfall and skirt variants, and all parse with the ordinary Entity grammar. Grids list them at several levels: TerrainWorldSmall level 0 lists 2,995, level 1 1,346 and level 2 230, and LongRange level 0 lists 106, so the finest cells alone do not reach every river. :observed[complete entity and listing census]

All 10,667 river LOD meshes use one Material, `WaterMaterial_USNAT`, of the FlowingWater_River template; it has no TextureSet and carries two foam texture records, and the patch forge stores it again. :observed[every river LOD mesh]

FlowingWater_River writes a five-target water G-buffer. Its mesh UV supplies a flow vector `2*uv-1`, while texture samples use world XY. The sampled river Material repeats at .128 per metre, about 7.8 metres per tile; normal waves combine animated wave frames and noise. :observed[river vertex/pixel programs and constants]

The river's encoded water type is `sqrt(sat(p/(40,100,40)))`, with placed type `p=(0,5.15,0)`. Its transmittance is `max_c exp(-sigma_c*depth)`, and the executed river program yields sigma approximately (1.052,.833,.923) per metre. At depths .5, 1 and 2 metres this gives opacity about .34, .57 and .81. :proven[executed river permutation]

Waterfalls use MAD_Waterfall's unlit tinted-alpha cascade, with a sampled tint (.204,.302,.322). Skirts use an alpha foam strip, scaling sampled foam alpha by Contrast Vertex, 3 on the examined material. They do not use the same depth response as the river water body. :observed[programs and material constants]

## Lake patch storage

Lakes are the 36 `WaterVisualEntity_###_###` Entities of the base forge, each a WaterComponent (`0x996DF94F`) and a RigidBodyComponent on its own `_ColMesh` MeshShape. Only TerrainWorldSmall levels 2–4 list them, never level 0. :observed[all 36 Entities]

Thirty-six WaterComponent bodies parse completely; 35 have atlases. Their WaterMesh resource has a 12-byte body rather than stored surface vertices. The component embeds a RiverQuadTree, WaterPatchDesc records and three references in Flow, Params, LocalProfile order. :proven[36 component envelopes] :observed[referenced resources]

```layout
title: WaterPatchDesc
size: 49
note: All 2,062 patches of the 36 stored WaterComponents are consumed exactly.
fields:
  - {at: 0, size: 1, type: u8, name: pointer byte, value: 0, level: proven}
  - {at: 1, size: 8, type: u64, name: object identity, level: proven}
  - {at: 9, size: 4, type: u32, name: WaterPatchDesc class, value: "0x6FBE4670", level: proven}
  - {at: 13, size: 12, type: float3, name: world minimum corner and water level, level: proven}
  - {at: 25, size: 4, type: bytes, name: stored bytes, level: unknown, note: "00 00 01 02 in the examined patch profile"}
  - {at: 29, size: 16, type: float4, name: atlas rectangle, level: proven, note: "u0 v0 u1 v1"}
  - {at: 45, size: 4, type: u32, name: level, level: proven, note: "square side = 512 >> level metres"}
```

All 2,062 patches match a quadtree-node minimum corner and `512>>level` side. Levels 3/4/5/6 have 485/635/625/317 patches, with sides 64/32/16/8 metres. Position z is the water level. :proven[all patches]

| Atlas | Channels | Confidence |
|---|---|---|
| Flow | RG signed flow direction around byte 127; B speed code; A coverage | :observed[atlas content and shader] |
| Params | RGB encoded water type `sqrt(p/(40,100,40))`; A coverage | :proven[executed real-patch shader] |
| LocalProfile | RG ripple/shore direction, B magnitude, A shading class | :observed[atlas joins] :proven[class passthrough execution] |

LocalProfile alpha stores byte 48, class 6, on 20 lakes and byte 80, class 10, on thirteen lakes without flow data. Two atlas sets have no water pixels. Atlas colours require the established BGRA byte order of format 0. :proven[all 35 atlas sets]

## Lake shader and lighting

Executing the Low-quality lake G-buffer program with one real patch and real atlases establishes that Params R/B pass through, G can increase with a noise/flow turbidity term, and LocalProfile A passes to the class byte. Surrogate wave/noise inputs establish their influence, not the full game's animated wave state. :proven[real-patch execution] :unknown[complete wave state]

Lake absorption differs from the river template: its pure-water term is approximately (.3265,.1019,.1025) per metre before the water-type contribution. The default lake type `(4,.5,5)` gives sigma (.668,.604,2.776); SwampMud `(20,4,4)` gives (1.825,1.639,11.05). Nine depth sample points match `max_c exp(-sigma_c*d)` within `1e-5`. :proven[executed lake program]

The water G-buffer stores encoded type and foam in o0, normal/class in o1, transmittance in o3.x and velocity in o4.xy. These are inputs to a later water-lighting branch, not the final visible RGB water colour. The inspected deferred water-lighting program combines depth-dependent absorption, backscatter and sky/sun terms; a computed reflectance ratio is overwritten in that variant and must not be treated as its final output. :observed[water writer and lighting consumer]

:::open[What produces the complete animated water response?]
Real wave/noise bindings, quality variants beyond the executed Low path, near-field ripple constants, complete deferred body colour and FakeWater chunk internals remain unresolved. River and lake absorption maps must remain distinct. :unknown
:::

## Shaun White Skateboarding

:only[shaun-white-skateboarding]

Water in Shaun White Skateboarding is a flag on the material, not a separate resource: the bool at byte 91 of the `SKGenericMaterial` body is set on exactly six distinct materials of the six levels (see [the material body](/engines/anvil/materials/material/)), each with a normal map, a specular map and a cube reflection and no diffuse map. :observed{games="shaun-white-skateboarding"}[all six levels]

The collision side is separate: a collision surface named `Water` exists (see [surfaces](/engines/anvil/collision/materials/)), and the fountain materials carry its id in the collision-surface field of the material. No shader-template id, wave animation or reflection parameter is stored with the flag. :observed

The harbour water of level 01 (`WaterPort`) has the tint (41, 60, 71) of 255 with alpha 1; its entity is placed in the global cell `Cell05460` at the source position (−296.95, 2.44, −11.0). :observed
