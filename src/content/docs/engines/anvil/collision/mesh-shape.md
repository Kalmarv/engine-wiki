---
title: "MeshShape collision"
description: "Tagged geometry sections, adjacency, acceleration tree and materials."
games: ["riders-republic"]
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
  - {"at": 1, "size": 4, "type": "u32", "name": "UserCategory", "level": "observed", "note": "ObjectShape.UserCategory (registry enum `UserResourceCategory`, a u32, the base class's field, stored first): 0 (389), 63 (239), 33 (96) of 724 sampled; the same enum as the last u32 of a Mesh. Enumerators: 0 _Unknown, 33 ENV_Prop, 63…"}
  - {"at": 5, "size": 4, "type": "u32", "name": "E37A7DC2 length L", "level": "observed"}
  - {"at": 9, "size": "L", "type": "bytes", "name": "E37A7DC2 (the sections)", "level": "observed"}
  - {"at": "9+L", "size": "var", "type": "bytes", "name": "tail", "level": "observed", "note": "the Tail box"}
```

```layout
title: "Section"
size: "size bytes"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 2, "type": "u16", "name": "section type", "level": "observed"}
  - {"at": 2, "size": 2, "type": "u16", "name": "marker", "value": "0xECD7", "level": "observed"}
  - {"at": 4, "size": 4, "type": "i32", "name": "size", "level": "observed", "note": "its 8 header bytes included"}
  - {"at": 8, "size": "size-8", "type": "bytes", "name": "payload", "level": "observed"}
```

```layout
title: "Sections in order (payloads)"
size: "var"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": "var", "type": "char[n]", "name": "0x0201 descriptor", "level": "observed", "note": "NUL-terminated 'Name(0x<id>) MeshDescriptor'"}
  - {"at": "var", "size": 8, "type": "bytes", "name": "0x0301", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": "var", "size": 12, "type": "u32Â·3", "name": "0x1EEE counts", "level": "observed", "note": "V, F, X"}
  - {"at": "var", "size": "12Â·V", "type": "f32Â·3V", "name": "0x1EEF positions", "level": "observed"}
  - {"at": "var", "size": "6Â·F", "type": "u16Â·3F", "name": "0x1EF0 faces", "level": "observed", "note": "position indices"}
  - {"at": "var", "size": "2Â·F", "type": "u16Â·F", "name": "0x1EF1 per-face polygon ids", "level": "observed", "note": "u16 per face, from 2 up to F+1 (724 of 724 shapes). Faces that share an id are coplanar in all but 27 of 37,036 shared groups: the id numbers the planar polygon a face belongs to (a reading; behaves as face-group ids)"}
  - {"at": "var", "size": "12Â·F", "type": "u32Â·3F", "name": "0x1EF2 face edges", "level": "observed", "note": "edge ids"}
  - {"at": "var", "size": "4Â·X", "type": "u16Â·2X", "name": "0x1EF3 edge faces", "level": "observed", "note": "0xFFFF where an edge has one face"}
  - {"at": "var", "size": 28, "type": "f32Â·6 + u32", "name": "0x1EFA bounds and node count", "level": "observed", "note": "size (x, y, z), then minimum (x, y, z), then the node count F-1. The minimum equals the vertices' minimum, and the size is at least the vertices' extent (equal within 1e-3 relative), on 724 of 724 shapes; the u32 equals F-1 on all 724…"}
  - {"at": "var", "size": "11Â·(F-1)", "type": "bytes", "name": "0x1EF9 tree nodes", "level": "observed", "note": "Node 0 is the root; every node 1..F-2 is the child of exactly one node and every face 0..F-1 is a leaf of exactly one node, on all 724 shapes. The 6 quantised bytes are not decoded"}
```

```layout
title: "Tree node (11 bytes, \u00c3\u2014(F-1), section 0x1EF9)"
size: 11
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 6, "type": "u8Â·6", "name": "child insets", "level": "observed", "note": "byte k (k = 0..5: minimum x, y, z, maximum x, y, z) is the inset, in 255ths of the node's decoded extent on that axis, of the child named by flag bit 2+k; 0 at the root on the shapes read"}
  - {"at": 6, "size": 2, "type": "u16", "name": "child A", "level": "observed", "note": "a face id if flag bit 0 is set, else a node id"}
  - {"at": 8, "size": 2, "type": "u16", "name": "child B", "level": "observed", "note": "a face id if flag bit 1 is set, else a node id"}
  - {"at": 10, "size": 1, "type": "u8", "name": "flags", "level": "observed", "note": "bit 0: child A is a face (else a node); bit 1: child B is a face"}
```

```layout
title: "Tail"
size: "42 + m + 10n bytes"
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "OneCollisionMaterialOnly", "level": "observed", "note": "MeshShape.OneCollisionMaterialOnly (registry bool): 1 on 668 of 724 sampled (one material), 0 on 56 (a material per face)"}
  - {"at": 1, "size": 1, "type": "u8", "name": "MaterialUniqeIndex", "level": "observed", "note": "MeshShape.MaterialUniqeIndex (registry spelling, a byte): 0 on 724 of 724 sampled"}
  - {"at": 2, "size": 4, "type": "u32", "name": "IndicesMaterialData count m", "level": "observed", "note": "0 (kind 1) or F (kind 0) (MeshShape.IndicesMaterialData, an array of bytes)"}
  - {"at": 6, "size": "m", "type": "u8Â·m", "name": "IndicesMaterialData", "level": "observed", "note": "index into the references, covering 0..n-1"}
  - {"at": "6+m", "size": 4, "type": "u32", "name": "TriangleMaterialData count n", "level": "observed"}
  - {"at": "10+m", "size": "10Â·n", "type": "refÂ·n", "name": "TriangleMaterialData", "level": "observed", "note": "every one a CollisionMaterial 0x74F7311D (registry array of CollisionMaterial)"}
  - {"at": "10+m+10n", "size": 16, "type": "vec4", "name": "MinLocalAABBox", "level": "observed", "note": "the positions' box; w 1.0 (registry vec4)"}
  - {"at": "26+m+10n", "size": 16, "type": "vec4", "name": "MaxLocalAABBox", "level": "observed", "note": "w 1.0 (registry vec4)"}
```

Across the 724-shape tree sample, root node zero reaches every node and face exactly once; all non-root nodes have one parent. The six inset bytes describe child-box sides in 255ths of the parent's extent, and flag bits 2–7 select the inset child for each side. :observed

Shared ids in `0x1EF1` group coplanar triangles in all but 27 of 37,036 shared-id groups. Interpreting the ids as polygon ids is supported by that fit rather than a declaration. :inferred

OneCollisionMaterialOnly selects a single surface; otherwise IndicesMaterialData has one byte per face indexing TriangleMaterialData. The spelling MaterialUniqeIndex follows registry metadata. :observed

:::open[What explains the exceptional shared ids?]
Noncoplanar groups prevent a universal polygon-id invariant. The eight zero bytes of section `0x0301` also have no established meaning. :unknown
:::
