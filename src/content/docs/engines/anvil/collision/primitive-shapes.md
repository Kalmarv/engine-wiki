---
title: "Primitive and compound shapes"
description: "Sphere, capsule, box and transformed compound collision."
games: ["riders-republic"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
  - title: ACExplorer
    url: https://github.com/gentlegiantJGC/ACExplorer
  - title: ReForger
    url: https://github.com/QuilLeeR/ReForger
  - title: Blacksmith
    url: https://github.com/theawesomecoder61/Blacksmith
implementations:
  - name: "anvil-formats (shape.rs)"
    url: https://github.com/Kalmarv/anvil-formats/blob/main/src/shape.rs
---

Primitive shapes provide collision without a triangle mesh. SphereShape, CapsuleShape, BoxShape and ReferenceListShape grammars consume every enumerated entry of their types exactly. Local-frame interpretation is checked against compound and owner bounds. :proven[grammar coverage] :observed[local frame]

```layout
title: "SphereShape body"
size: 35
games: [riders-republic]
note: "Little-endian. All 241 SphereShapes, 290 CapsuleShapes, 29 BoxShapes and 3,731 ReferenceListShapes across the six installed forges consume exactly with no refusals. This covers serialized fields; runtime scale application remains separate."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "tag", "value": "01", "level": "proven"}
  - {"at": 1, "size": 4, "type": "u32", "name": "zero", "value": "0", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": 5, "size": 16, "type": "vec4", "name": "centre", "level": "proven"}
  - {"at": 21, "size": 4, "type": "f32", "name": "radius", "level": "proven"}
  - {"at": 25, "size": 10, "type": "ref", "name": "CollisionMaterial", "level": "proven", "note": "or none (1 of 241)"}
```

```layout
title: "CapsuleShape body"
size: 51
games: [riders-republic]
note: "Little-endian. All 241 SphereShapes, 290 CapsuleShapes, 29 BoxShapes and 3,731 ReferenceListShapes across the six installed forges consume exactly with no refusals. This covers serialized fields; runtime scale application remains separate."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "tag", "value": "01", "level": "proven"}
  - {"at": 1, "size": 4, "type": "u32", "name": "zero", "value": "0", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": 5, "size": 16, "type": "vec4", "name": "end A", "level": "proven"}
  - {"at": 21, "size": 16, "type": "vec4", "name": "end B", "level": "proven"}
  - {"at": 37, "size": 4, "type": "f32", "name": "radius", "level": "proven"}
  - {"at": 41, "size": 10, "type": "ref", "name": "CollisionMaterial", "level": "proven"}
```

```layout
title: "BoxShape body"
size: 95
games: [riders-republic]
note: "Little-endian. All 241 SphereShapes, 290 CapsuleShapes, 29 BoxShapes and 3,731 ReferenceListShapes across the six installed forges consume exactly with no refusals. This covers serialized fields; runtime scale application remains separate."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "ManagedObject byte", "value": "01", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": 1, "size": 4, "type": "u32", "name": "UserCategory", "level": "proven", "note": "ObjectShape.UserCategory (enum `UserResourceCategory`, u32): 0 on 24, 0x21 = 33 (ENV_Prop) on 5"}
  - {"at": 5, "size": 16, "type": "vec4", "name": "HalfExtents", "level": "proven"}
  - {"at": 21, "size": 64, "type": "matrix4", "name": "Matrix", "level": "proven", "note": "column-major 4x4"}
  - {"at": 85, "size": 10, "type": "ref", "name": "Material", "level": "proven", "note": "(registry field `Material`, a CollisionMaterial reference)"}
```

```layout
title: "ReferenceListShape body"
size: "49 + 90\u00b7n bytes"
games: [riders-republic]
note: "Little-endian. All 241 SphereShapes, 290 CapsuleShapes, 29 BoxShapes and 3,731 ReferenceListShapes across the six installed forges consume exactly with no refusals. This covers serialized fields; runtime scale application remains separate."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "tag", "value": "01", "level": "proven"}
  - {"at": 1, "size": 4, "type": "u32", "name": "zero", "value": "0", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": 5, "size": 4, "type": "u32", "name": "child count n", "level": "proven"}
  - {"at": 9, "size": "10·n", "type": "ref·n", "name": "children", "level": "proven", "note": "MeshShape, BoxShape, CapsuleShape or SphereShape"}
  - {"at": "9+10n", "size": 4, "type": "u32", "name": "n again", "level": "proven"}
  - {"at": "13+10n", "size": "64·n", "type": "matrix4·n", "name": "child transforms", "level": "proven", "note": "column-major, as ACExplorer reads them (equal on all 3,731)"}
  - {"at": "13+74n", "size": 4, "type": "u32", "name": "n again", "level": "proven"}
  - {"at": "17+74n", "size": "16·n", "type": "vec4·n", "name": "Scales", "level": "proven", "note": "Registry name Scales; one vec4 per child, (1, 1, 1, 1) except in one checked entry."}
  - {"at": "17+90n", "size": 16, "type": "vec4", "name": "minimum", "level": "proven", "note": "the children's box, as stored"}
  - {"at": "33+90n", "size": 16, "type": "vec4", "name": "maximum", "level": "proven"}
```

A sphere stores center and radius, a capsule sweeps radius along endpoints A–B, and a box stores half-extents plus a local 4 × 4 transform. ReferenceListShape stores child references, matrices, a vec4 array and final bounds. Every installed shape of these types reads without refusals: 241 spheres, 290 capsules, 29 boxes and 3,731 compound lists. The matrices of all 3,731 lists agree with ACExplorer's column-major interpretation. :proven

:::open[What does the compound shape's vec4 array mean?]
The registry names it Scales, and values are `(1, 1, 1, 1)` except in one checked entry. The exact runtime application of its fourth lane and exceptional value is not established. :observed :unknown
:::
