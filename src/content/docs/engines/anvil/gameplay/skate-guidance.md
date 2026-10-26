---
title: "Skate guidance edges"
description: "How Shaun White Skateboarding stores grindable rails, ledges, copings and shaping edges on its entities."
games: ["shaun-white-skateboarding"]
---

Every grindable edge of Shaun White Skateboarding is data on an entity: a guidance component holds the edges, their surface type and the links that join them. Four component classes share one layout; they differ in what an edge is used for. :observed

| Class | Id | Role | Level 01 |
|---|---|---|---:|
| `SWSkateGuidanceSystem` | `0x5CDCA222` | Rails, ledges and copings | 6,118 edges on its components |
| `SWSkateFreeFormGuidanceSystem` | `0x359BE54E` | Free-form grind edges | 95 |
| `Scale` | `0x6A1CFF2F` | Shapeable props (kickers, benches, planters) | 25 |
| `Morph` | `0x081AF61A` | Props that change between stored states | 5 |

The class ids equal the CRC-32 of the class names. :proven[computed from the names]

## Guidance system component

```layout
title: "SWSkateGuidanceSystem component"
size: "variable"
games: [shaun-white-skateboarding]
note: "Little-endian. The 78-byte object records are exact and their lengths agree with the geometry on all 6,118 level-01 edges."
fields:
  - {"at": 0, "size": 4, "type": "u32", "name": "class", "value": "0x5CDCA222", "level": "proven"}
  - {"at": 4, "size": 4, "type": "u32", "name": "id", "level": "observed", "note": "the resource reference id"}
  - {"at": 8, "size": 4, "type": "u32", "name": "reference class", "level": "observed"}
  - {"at": 12, "size": 1, "type": "u8", "name": "kind", "level": "observed", "note": "0xFE on scale components; meaning unknown"}
  - {"at": 13, "size": 4, "type": "u32", "name": "object count n", "level": "observed"}
  - {"at": 17, "size": "78n", "type": "GuidanceObject[n]", "name": "objects", "level": "observed", "note": "78 bytes each, below"}
```

```layout
title: "Guidance object"
size: 78
games: [shaun-white-skateboarding]
note: "Little-endian."
fields:
  - {"at": 0, "size": 4, "type": "u32", "name": "zero", "value": "0", "level": "observed"}
  - {"at": 4, "size": 4, "type": "u32", "name": "class", "value": "0x344FA659", "level": "observed"}
  - {"at": 8, "size": 1, "type": "u8", "name": "Valid", "level": "observed"}
  - {"at": 9, "size": 4, "type": "u32", "name": "SubType", "level": "observed", "note": "0 none, 9 curved vert; the enum names stand last-first in the executable"}
  - {"at": 13, "size": 4, "type": "u32", "name": "Index0", "level": "observed", "note": "index of the edge's first point"}
  - {"at": 17, "size": 4, "type": "u32", "name": "Index1", "level": "observed", "note": "index of the edge's second point"}
  - {"at": 21, "size": 16, "type": "f32[4]", "name": "first face normal", "level": "observed", "note": "three floats and a zero word"}
  - {"at": 37, "size": 16, "type": "f32[4]", "name": "second face normal", "level": "observed", "note": "three floats and a zero word"}
  - {"at": 53, "size": 25, "type": "inline object", "name": "SWSkateGuidanceObjectData", "level": "observed", "note": "[00][id u32][class 0x98A53374][u32 0][end link u32][start link u32][length f32]"}
```

An edge joins the points `Index0` and `Index1` of the component's point list. The links name the neighbouring edges; the value `0x1FFF` means none. An end link joins an edge that holds `Index1`; in 8% of the links the connection runs the other way. :observed[level 01]

The points follow the objects as a `u32` count of `u16` values and then `u16` triples, each coordinate `(v − 32767) / 200` metres in the entity's local frame. Over all 6,118 edges of level 01 the world length of the decoded points equals the stored length to within 2 cm. :observed[level 01]

The two face normals give the kind of edge: a ledge has one normal up and one level; a rail has both tilted by 25 to 60 degrees (fences, stair rails, clothes lines); a curved vert, the lip of a vert wall or quarter pipe, has `SubType` 9. :observed[level 01]

## Shaping components

The four classes share the layout up to the partitioner: a resource reference, the guidance objects, a `u16` point list, an edge filter and a partitioner. The edge filter is an inline object (`[00][id][0xDF7FF220]`, 27 bytes: the floats 1/√2, π/8 and π/4, a zero `u16`, the words 46 and 60, the float 0.2 and a zero byte). The partitioner (`[00][id][0x4661AAEF]`) stores a root index, an array of leaf indices, a minimum and a maximum corner and an array of nodes (`[00 00 00 00][0x5374195C]`, a type `u32`, two `u16` and a float for the middle). For free-form and scale components its box equals the bounds of the points to within one `u16` step; for morph components it covers the morph states as well. :observed[level 01]

Of the class-hash hits in level 01, 95, 25 and 5 are real free-form, scale and morph components (the other hits are entries of an entity's component list). :observed

- A free-form component (named `00_ShP_FFGrind5m_NNN`) has one 5 m edge from (0, 0, 0) to (0, 5, 0), then a `u32` id of a shared object of class `0xB5403F20` (131 bytes with one edge of 0.25 m and two floats). Level 01 uses the object `0x901687FC` for all of them; levels 02 to 05 also use `0x766A4B87` and `0x7CD6EC02` with the same content. :observed
- A scale component stores nothing after the partitioner, and its reference kind is `0xFE`. :observed
- A morph component has a `u32` state count (2 in level 01, up to 7 in level 06) and per state an inline object (`0xCB13AC37`) with a guidance object array and a point list of the same length as the system's. State 0 is the system's own objects and points (largest point difference 0.0041 to 0.005, one `u16` step, on 5 of 5). On the wave prop `01_B_Inf_WaveFlat` all 220 points lie on vertices of the mesh within 8e-6, and state 1's points lie on the vertices of the mesh's second vertex stream within 8e-6 with the same 2 cm deltas on 220 of 220. The largest point movement of a state equals the morph target's (1.6 m for the wave, 3.2 m for the park shapes). :observed

Levels 02 to 06 contain 109, 106, 50, 62 and 11 free-form components, 32, 19, 19, 0 and 2 scale components and 1, 10, 11, 1 and 1 morph components. A plain guidance system in level 05 holds a link that names an edge which does not hold the point it should; it is read as no link. :observed
