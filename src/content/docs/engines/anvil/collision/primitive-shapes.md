---
title: "Primitive and compound shapes"
description: "Sphere, capsule, box and transformed compound collision."
games: ["riders-republic"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "primase worlds/anvil (shape.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/shape.rs
---

Primitive shapes provide collision without a triangle mesh. SphereShape, CapsuleShape, BoxShape and ReferenceListShape grammars consume every enumerated entry of their types exactly. Local-frame interpretation is checked against compound and owner bounds. :proven[grammar coverage] :observed[local frame]

```layout
title: "SphereShape body"
size: 35
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "tag", "value": "01", "level": "observed"}
  - {"at": 1, "size": 4, "type": "u32", "name": "zero", "value": "0", "level": "observed"}
  - {"at": 5, "size": 16, "type": "vec4", "name": "centre", "level": "observed"}
  - {"at": 21, "size": 4, "type": "f32", "name": "radius", "level": "observed"}
  - {"at": 25, "size": 10, "type": "ref", "name": "CollisionMaterial", "level": "observed", "note": "or none (1 of 241)"}
```

```layout
title: "CapsuleShape body"
size: 51
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "tag", "value": "01", "level": "observed"}
  - {"at": 1, "size": 4, "type": "u32", "name": "zero", "value": "0", "level": "observed"}
  - {"at": 5, "size": 16, "type": "vec4", "name": "end A", "level": "observed"}
  - {"at": 21, "size": 16, "type": "vec4", "name": "end B", "level": "observed"}
  - {"at": 37, "size": 4, "type": "f32", "name": "radius", "level": "observed"}
  - {"at": 41, "size": 10, "type": "ref", "name": "CollisionMaterial", "level": "observed"}
```

```layout
title: "BoxShape body"
size: 95
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "ManagedObject byte", "value": "01", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": 1, "size": 4, "type": "u32", "name": "UserCategory", "level": "observed", "note": "ObjectShape.UserCategory (enum `UserResourceCategory`, u32): 0 on 24, 0x21 = 33 (ENV_Prop) on 5"}
  - {"at": 5, "size": 16, "type": "vec4", "name": "HalfExtents", "level": "observed"}
  - {"at": 21, "size": 64, "type": "matrix4", "name": "Matrix", "level": "observed", "note": "column-major 4x4"}
  - {"at": 85, "size": 10, "type": "ref", "name": "Material", "level": "observed", "note": "(registry field `Material`, a CollisionMaterial reference)"}
```

```layout
title: "ReferenceListShape body"
size: "49 + 90\u00c2\u00b7n bytes"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "tag", "value": "01", "level": "observed"}
  - {"at": 1, "size": 4, "type": "u32", "name": "zero", "value": "0", "level": "observed"}
  - {"at": 5, "size": 4, "type": "u32", "name": "child count n", "level": "observed"}
  - {"at": 9, "size": "10Â·n", "type": "refÂ·n", "name": "children", "level": "observed", "note": "MeshShape, BoxShape, CapsuleShape or SphereShape"}
  - {"at": "9+10n", "size": 4, "type": "u32", "name": "n again", "level": "observed"}
  - {"at": "13+10n", "size": "64Â·n", "type": "matrix4Â·n", "name": "child transforms", "level": "observed", "note": "column-major, as ACExplorer reads them (equal on all 3,731)"}
  - {"at": "13+74n", "size": 4, "type": "u32", "name": "n again", "level": "observed"}
  - {"at": "17+74n", "size": "16Â·n", "type": "vec4Â·n", "name": "Scales", "level": "observed", "note": "registry Scales (an array of vec4, kind 0x069D): one scale per list entry, (1, 1, 1, 1) on all but one"}
  - {"at": "17+90n", "size": 16, "type": "vec4", "name": "minimum", "level": "observed", "note": "the children's box, as stored"}
  - {"at": "33+90n", "size": 16, "type": "vec4", "name": "maximum", "level": "observed"}
```

A sphere stores center and radius, a capsule sweeps radius along endpoints A–B, and a box stores half-extents plus a local 4 × 4 transform. ReferenceListShape stores child references, matrices, a vec4 array and final bounds. All 3,731 checked list matrices agree with ACExplorer's column-major interpretation. :observed

:::open[What does the compound shape's vec4 array mean?]
It is `(1, 1, 1, 1)` except in one checked entry. Its count matches the children, but that does not establish scale semantics. :unknown
:::
