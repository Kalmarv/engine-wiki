---
title: "MeshShape collision"
description: "Tagged geometry sections, adjacency, acceleration tree and materials."
games: ["riders-republic", "shaun-white-skateboarding"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "primase worlds/anvil (mesh_shape.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/mesh_shape.rs
---

MeshShape (`0xB22B3E61`) stores triangle collision separately from render Mesh resources. A byte-counted section run contains geometry and adjacency, followed by materials and bounds. Evidence includes two different-size fixtures, a 15,222-body section census and a 724-shape tree analysis. :observed

```layout
title: "MeshShape body"
size: "9 + L + tail"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "ManagedObject byte", "value": "01", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": 1, "size": 4, "type": "u32", "name": "UserCategory", "level": "observed", "note": "ObjectShape.UserCategory (registry enum `UserResourceCategory`, a u32, the base class's field, stored first): 0 (389), 63 (239), 33 (96) of 724 sampled; the same enum as the last u32 of a Mesh. Enumerators: 0 _Unknown, 33 ENV_Prop, 63 ENV_Procedural."}
  - {"at": 5, "size": 4, "type": "u32", "name": "E37A7DC2 length L", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": 9, "size": "L", "type": "bytes", "name": "E37A7DC2 (the sections)", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": "9+L", "size": "var", "type": "bytes", "name": "tail", "level": "observed", "note": "the Tail box"}
```

```layout
title: "Section"
size: "size bytes"
games: [riders-republic]
note: "Little-endian. Section framing, face/material counts and tail buffers read across all 25,162 MeshShapes of the six installed forges with no refusals. Tree decoding semantics remain scoped to 724 sampled shapes."
fields:
  - {"at": 0, "size": 2, "type": "u16", "name": "section type", "level": "proven"}
  - {"at": 2, "size": 2, "type": "u16", "name": "marker", "value": "0xECD7", "level": "proven"}
  - {"at": 4, "size": 4, "type": "i32", "name": "size", "level": "proven", "note": "its 8 header bytes included"}
  - {"at": 8, "size": "size-8", "type": "bytes", "name": "payload", "level": "proven"}
```

```layout
title: "Sections in order (payloads)"
size: "var"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": "var", "type": "char[n]", "name": "0x0201 descriptor", "level": "observed", "note": "NUL-terminated 'Name(0x<id>) MeshDescriptor'"}
  - {"at": "var", "size": 8, "type": "bytes", "name": "0x0301", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": "var", "size": 12, "type": "u32·3", "name": "0x1EEE counts", "level": "observed", "note": "V, F, X"}
  - {"at": "var", "size": "12·V", "type": "f32·3V", "name": "0x1EEF positions", "level": "observed"}
  - {"at": "var", "size": "6·F", "type": "u16·3F", "name": "0x1EF0 faces", "level": "observed", "note": "position indices"}
  - {"at": "var", "size": "2·F", "type": "u16·F", "name": "0x1EF1 per-face polygon ids", "level": "inferred", "note": "u16 per face, from 2 up to F+1 (724 of 724 shapes). Faces that share an id are coplanar in all but 27 of 37,036 shared groups: the id numbers the planar polygon a face belongs to (a reading; behaves as face-group ids)"}
  - {"at": "var", "size": "12·F", "type": "u32·3F", "name": "0x1EF2 face edges", "level": "observed", "note": "edge ids"}
  - {"at": "var", "size": "4·X", "type": "u16·2X", "name": "0x1EF3 edge faces", "level": "observed", "note": "0xFFFF where an edge has one face"}
  - {"at": "var", "size": 28, "type": "f32·6 + u32", "name": "0x1EFA bounds and node count", "level": "observed", "note": "size (x, y, z), then minimum (x, y, z), then the node count F-1. The minimum equals the vertices' minimum, and the size is at least the vertices' extent (equal within 1e-3 relative), on 724 of 724 shapes; the u32 equals F-1 on all 724 and is the number of tree nodes in 0x1EF9"}
  - {"at": "var", "size": "11·(F-1)", "type": "bytes", "name": "0x1EF9 tree nodes", "level": "observed", "note": "Node 0 is the root; every node 1..F-2 is the child of exactly one node and every face 0..F-1 is a leaf of exactly one node, on all 724 shapes. The 6 quantised bytes are not decoded"}
```

```layout
title: "Tree node (11 bytes, \u00d7(F-1), section 0x1EF9)"
size: 11
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 6, "type": "u8·6", "name": "child insets", "level": "observed", "note": "byte k (k = 0..5: minimum x, y, z, maximum x, y, z) is the inset, in 255ths of the node's decoded extent on that axis, of the child named by flag bit 2+k; 0 at the root on the shapes read"}
  - {"at": 6, "size": 2, "type": "u16", "name": "child A", "level": "observed", "note": "a face id if flag bit 0 is set, else a node id"}
  - {"at": 8, "size": 2, "type": "u16", "name": "child B", "level": "observed", "note": "a face id if flag bit 1 is set, else a node id"}
  - {"at": 10, "size": 1, "type": "u8", "name": "flags", "level": "observed", "note": "bit 0: child A is a face (else a node); bit 1: child B is a face"}
```

```layout
title: "Tail"
size: "42 + m + 10n bytes"
games: [riders-republic]
note: "Little-endian. Section framing, face/material counts and tail buffers read across all 25,162 MeshShapes of the six installed forges with no refusals. Tree decoding semantics remain scoped to 724 sampled shapes."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "OneCollisionMaterialOnly", "level": "proven", "note": "MeshShape.OneCollisionMaterialOnly (registry bool): 1 on 668 of 724 sampled (one material), 0 on 56 (a material per face)"}
  - {"at": 1, "size": 1, "type": "u8", "name": "MaterialUniqeIndex", "level": "proven", "note": "MeshShape.MaterialUniqeIndex (registry spelling, a byte): 0 on 724 of 724 sampled"}
  - {"at": 2, "size": 4, "type": "u32", "name": "IndicesMaterialData count m", "level": "proven", "note": "0 (kind 1) or F (kind 0) (MeshShape.IndicesMaterialData, an array of bytes)"}
  - {"at": 6, "size": "m", "type": "u8·m", "name": "IndicesMaterialData", "level": "proven", "note": "index into the references, covering 0..n-1"}
  - {"at": "6+m", "size": 4, "type": "u32", "name": "TriangleMaterialData count n", "level": "proven"}
  - {"at": "10+m", "size": "10·n", "type": "ref·n", "name": "TriangleMaterialData", "level": "proven", "note": "every one a CollisionMaterial 0x74F7311D (registry array of CollisionMaterial)"}
  - {"at": "10+m+10n", "size": 16, "type": "vec4", "name": "MinLocalAABBox", "level": "proven", "note": "the positions' box; w 1.0 (registry vec4)"}
  - {"at": "26+m+10n", "size": 16, "type": "vec4", "name": "MaxLocalAABBox", "level": "proven", "note": "w 1.0 (registry vec4)"}
```

Across the 724-shape tree sample, root node zero reaches every node and face exactly once; all non-root nodes have one parent. The six inset bytes describe child-box sides in 255ths of the parent's extent, and flag bits 2–7 select the inset child for each side. :observed

Shared ids in `0x1EF1` group coplanar triangles in all but 27 of 37,036 shared-id groups. Interpreting the ids as polygon ids is supported by that fit rather than a declaration. :inferred

OneCollisionMaterialOnly selects a single surface; otherwise IndicesMaterialData has one byte per face indexing TriangleMaterialData. The spelling MaterialUniqeIndex follows registry metadata. :observed

:::open[What explains the exceptional shared ids?]
Noncoplanar groups prevent a universal polygon-id invariant. The eight zero bytes of section `0x0301` also have no established meaning. :unknown
:::

The complete six-archive section reader accepts all 25,162 MeshShape entries; the more detailed tree and polygon-id meanings above remain scoped to the 724-shape sample. Every section and tail is byte-accounted, without refusals. :proven[framing only]

## Shaun White Skateboarding

:only[shaun-white-skateboarding]

Collision geometry is a `MeshShape` object (`0xB22B3E61`) with explicit triangles, held apart from the render meshes. The vertices are stored as `float4` with a zero fourth component, the triangle indices as `u16` triples, one surface byte per triangle, and an opaque Havok MOPP acceleration blob that needs no Havok packfile to read the triangles. The shape is in its own local frame, Z up. :observed{games="shaun-white-skateboarding"}[level 01]

```layout
title: "MeshShape fields (Shaun White Skateboarding)"
size: "variable"
games: [shaun-white-skateboarding]
note: "Little-endian. Fields in stored order after the object prefix; exact on 1,561 of 1,561 shapes read."
fields:
  - {"at": 0, "size": "4 + 16n", "type": "u32 + f32[4][n]", "name": "Vertices", "level": "observed", "note": "w is 0"}
  - {"at": "var", "size": "4 + m", "type": "u32 + bytes", "name": "MoppCode", "level": "observed", "note": "the Havok MOPP blob, kept opaque"}
  - {"at": "var", "size": 16, "type": "f32[4]", "name": "MoppOffsetAndScale", "level": "observed"}
  - {"at": "var", "size": "4 + 6t", "type": "u32 + u16[3][t]", "name": "IndicesTriangles", "level": "observed"}
  - {"at": "var", "size": "4 + t", "type": "u32 + u8[t]", "name": "IndicesMaterial", "level": "observed", "note": "one index per triangle into Materials"}
  - {"at": "var", "size": "4 + 4s", "type": "u32 + u32[s]", "name": "Materials", "level": "observed", "note": "bare ids of collision surface objects"}
  - {"at": "var", "size": "var", "type": "CollisionFilterInfo", "name": "filter", "level": "observed", "note": "an inline box, class 0x43EF99C2"}
  - {"at": "var", "size": 4, "type": "u32", "name": "MoppCodeVersionNumber", "value": "5", "level": "observed"}
  - {"at": "var", "size": 32, "type": "f32[4][2]", "name": "local bounds", "level": "observed", "note": "minimum and maximum"}
```

The Havok SDK that produced the MOPP blob is unknown. The data is neither a packfile nor a tagfile. :observed

Other collision shapes occur in cells: capsule, sphere, box, a convex shape (`BarrelShape`), a list shape (`ListShape`, `0x86EBFD8D`, whose body ends with a flag byte) and a `MultiMeshShape` (`0x9A503477`). :observed

### Rigid bodies and placement

A prop's collision is an `InertComponent` (`0x0E5A450A`, 150 bytes in 1,561 cases) on its entity: the component base, a damage enum, an inline `RigidBody` (`0x228F402A`: a `CollisionFilterInfo` box with layer and part, the shape id, mass, linear and angular damping, four flag bytes and a 16-float local inertia tensor) and a walkability enum, then 12 bytes. The managed byte of the inline body can be 0. `RigidBody.Shape` is a bare id; level 01 reaches 1,152 shapes inside the cell and 409 in other entries. The inertia tensor is not the placement. :observed[level 01]

A `MultiInertComponent` (`0x8BBEEE57`) holds an inline `MultiMeshShape` of parallel arrays: five-byte entity handles (tag 0 and a `u32`) and bare shape ids. The container itself carries an identity matrix in the cell examined; each pair is placed at its contained entity's matrix. The pairing matched on a cell of ten children: the six shapes that resolve locally have exactly the names of their entity's Visual meshes. :observed[one cell of ten children]

Level 01's collision placements number 2,074, of 1,194 unique shape objects with 49 distinct surface ids, and every shape and entity reference resolves. :observed[level 01]
