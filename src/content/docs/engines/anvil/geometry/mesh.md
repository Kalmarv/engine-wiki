---
title: Mesh and MeshData
description: Compiled mesh framing, vertex streams, primitive ranges and inline multi-mesh index origins.
games: [riders-republic, ghost-recon-breakpoint, "shaun-white-skateboarding"]
sources:
  - title: GRB modding reference
    url: https://github.com/dataterminals/grb-modding-knowledgebase/blob/main/docs/10-meshes-and-skeletons.md
implementations:
  - name: anvil-formats Anvil mesh reader
    url: https://github.com/Kalmarv/anvil-formats/blob/main/src/mesh.rs
  - name: anvil-formats Shaun White Skateboarding mesh reader
    url: https://github.com/Kalmarv/anvil-formats/blob/main/src/shaunwhite/mesh.rs
---

A **Mesh** holds compiled vertex streams, triangle indices, primitive partitions and material references. Riders Republic has ranged and inline compiled layouts; the latter can contain several objects sharing buffers. :observed{games="riders-republic"}
Breakpoint also stores primitives with material assignments and several packed vertex formats, including formats with up to five UV sets. The Riders Republic offsets below are not established for Breakpoint. :sourced[GRB modding reference]{games="ghost-recon-breakpoint"}

## Shaun White Skateboarding

:only[shaun-white-skateboarding]

A drawable mesh is a `Mesh` object that holds a `CompiledMesh` inline: the vertex and index buffers, the draw ranges, the bone palettes and the list of material ids are all in the mesh's own body. The 33 data forges of the PC build hold 16,149 Mesh objects. A strict reading reads 15,928 of them to their exact end with the layouts below; the other 221 keep raw `SubMesh` objects ahead of their bones and are not read here. :proven{games="shaun-white-skateboarding"}[15,928 of the install's 16,149 meshes; 221 refused]

```layout
title: "Mesh body (Shaun White Skateboarding)"
size: "variable"
games: [shaun-white-skateboarding]
note: "Little-endian. Body offsets; n is the bone count, L the compiled data's length, m the material count. Read to its exact end on the 15,928 meshes without raw sub-meshes."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "managed", "value": "1", "level": "proven", "note": "1 on every mesh"}
  - {"at": 1, "size": 4, "type": "u32", "name": "id", "level": "proven", "note": "the object's id in its entry's directory"}
  - {"at": 5, "size": 4, "type": "u32", "name": "class", "value": "0x415D9568", "level": "proven", "note": "CRC-32 of Mesh"}
  - {"at": 9, "size": 4, "type": "u32", "name": "Category", "level": "observed", "note": "enum"}
  - {"at": 13, "size": 1, "type": "u8", "name": "Generated", "level": "observed"}
  - {"at": 14, "size": 4, "type": "u32", "name": "SubMeshes count", "level": "proven", "note": "0 on 15,928 meshes; not 0 on 221 (1 to 5 in those examined), whose SubMesh objects (class 0x5755DE7F, CRC-32 of SubMesh) follow here and are not described"}
  - {"at": 18, "size": 4, "type": "u32", "name": "Bones count n", "level": "proven"}
  - {"at": 22, "size": "76n", "type": "MeshBone[n]", "name": "bones", "level": "proven", "note": "see the MeshBone layout"}
  - {"at": "22+76n", "size": 11, "type": "bytes", "name": "unknown", "level": "unknown", "note": "a byte 0 (13,978 meshes) or 1 (1,950), a byte 1, then nine zeros, on every mesh read"}
  - {"at": "33+76n", "size": 4, "type": "u32", "name": "CompiledMesh class", "value": "0xFC9E1595", "level": "proven", "note": "CRC-32 of CompiledMesh"}
  - {"at": "37+76n", "size": 4, "type": "u32", "name": "Data length L", "level": "proven"}
  - {"at": "41+76n", "size": "L", "type": "bytes", "name": "Data", "level": "proven", "note": "the compiled buffers, below"}
  - {"at": "41+76n+L", "size": 4, "type": "u32", "name": "PlatformVersion", "value": "16", "level": "proven", "note": "16 on every mesh"}
  - {"at": "45+76n+L", "size": 4, "type": "u32", "name": "SDKVersion", "value": "32", "level": "proven", "note": "32 on every mesh"}
  - {"at": "49+76n+L", "size": 4, "type": "u32", "name": "material count m", "level": "proven", "note": "equals the range count A on every mesh"}
  - {"at": "53+76n+L", "size": "4m", "type": "u32[m]", "name": "material ids", "level": "observed", "note": "bare ids of the material objects; material i is drawn by range i"}
```

```layout
title: "MeshBone (Shaun White Skateboarding)"
size: 76
games: [shaun-white-skateboarding]
note: "Little-endian, inline in the mesh body."
fields:
  - {"at": 0, "size": 4, "type": "u32", "name": "id", "level": "proven"}
  - {"at": 4, "size": 4, "type": "u32", "name": "class", "value": "0x9EF0E7A1", "level": "proven", "note": "CRC-32 of MeshBone, on every bone"}
  - {"at": 8, "size": 4, "type": "u32", "name": "bone name", "level": "inferred", "note": "a hash; consecutive bones of one mesh differ in it"}
  - {"at": 12, "size": 64, "type": "f32[16]", "name": "matrix", "level": "unknown", "note": "a 4 x 4 matrix; which space it maps is not established"}
```

```layout
title: "CompiledMesh data"
size: "L"
games: [shaun-white-skateboarding]
note: "Little-endian. Offsets relative to the start of Data. Every relation in the notes holds on all 15,928 meshes read."
fields:
  - {"at": 0, "size": 4, "type": "u32", "name": "version", "value": "16", "level": "proven", "note": "16 on every mesh"}
  - {"at": 4, "size": 4, "type": "u32", "name": "extra stream count s", "level": "proven", "note": "0 on every mesh read; 1 to 3 only on meshes with raw sub-meshes (morph targets)"}
  - {"at": 8, "size": 4, "type": "u32", "name": "stride", "level": "proven", "note": "bytes per vertex: the vertex stride the game binds"}
  - {"at": 12, "size": 4, "type": "u32", "name": "vertex bytes V", "level": "proven", "note": "the bytes of one stream: the size of the game's vertex buffer"}
  - {"at": 16, "size": 4, "type": "u32", "name": "stride x (s + 1)", "level": "proven"}
  - {"at": 20, "size": 4, "type": "u32", "name": "V x (s + 1)", "level": "proven"}
  - {"at": 24, "size": 4, "type": "u32", "name": "index bytes I", "level": "proven", "note": "the size of the game's index buffer"}
  - {"at": 28, "size": 4, "type": "u32", "name": "unknown", "value": "0", "level": "unknown", "note": "0 on every mesh"}
  - {"at": 32, "size": 4, "type": "u32", "name": "flags", "level": "proven", "note": "selects the vertex elements; see vertex formats"}
  - {"at": 36, "size": 4, "type": "u32", "name": "range count A", "level": "proven"}
  - {"at": 40, "size": 4, "type": "u32", "name": "range count B", "level": "proven"}
  - {"at": 44, "size": 4, "type": "u32", "name": "total", "level": "proven", "note": "V x (s + 1) + I + 24 x (A + B)"}
  - {"at": 48, "size": "V x (s + 1)", "type": "bytes", "name": "vertex streams", "level": "proven", "note": "stream 0 is the base mesh, uploaded unchanged as the vertex buffer; each further stream is a whole vertex array of the same layout"}
  - {"at": "48+V(s+1)", "size": "I", "type": "u16[]", "name": "indices", "level": "proven", "note": "uploaded unchanged as a 16-bit index buffer"}
  - {"at": "48+V(s+1)+I", "size": "24 x (A + B)", "type": "range[A + B]", "name": "ranges", "level": "proven", "note": "A first-partition ranges, then B second-partition ranges"}
  - {"at": "total+48", "size": "40A", "type": "bytes", "name": "palettes", "level": "proven", "note": "40 bytes per first-partition range, starting with one palette per range"}
```

The game uploads a mesh's data unchanged. Running the game's own loader and renderer from a new game to the start of the level-02 load, 605 vertex and index buffers created for 516 meshes held exactly the stored stream-0 vertex bytes and index bytes, and every indexed draw used 16-bit indices. :observed{games="shaun-white-skateboarding"}[every mesh the game loaded on that route]

```layout
title: "Range (Shaun White Skateboarding)"
size: 24
games: [shaun-white-skateboarding]
note: "Little-endian. One DrawIndexedPrimitive call."
fields:
  - {"at": 0, "size": 4, "type": "u32", "name": "primitive type", "value": "4", "level": "proven", "note": "a triangle list, on every range"}
  - {"at": 4, "size": 4, "type": "u32", "name": "first vertex", "level": "observed", "note": "the draw's MinIndex"}
  - {"at": 8, "size": 4, "type": "u32", "name": "vertex count", "level": "observed", "note": "the draw's NumVertices"}
  - {"at": 12, "size": 4, "type": "u32", "name": "first index", "level": "observed", "note": "the draw's StartIndex, in indices"}
  - {"at": 16, "size": 4, "type": "u32", "name": "triangle count", "level": "observed", "note": "the draw's PrimitiveCount"}
  - {"at": 20, "size": 4, "type": "u32", "name": "unknown", "level": "unknown", "note": "values vary without pattern; not passed to the draw"}
```

Each range is one draw. On the traced route every draw of a level-02 mesh is one of its first-partition ranges exactly, with `MinIndex` the first vertex, `NumVertices` the vertex count, `StartIndex` the first index, `PrimitiveCount` the triangle count and a base vertex of 0, drawn as a triangle list. No draw on that route used a second-partition range. :observed{games="shaun-white-skateboarding"}[every draw of a level-02 mesh on that route]

The first A ranges partition the index buffer one-to-one with the mesh's materials (range i uses material i), and the B ranges are a second partition of the same indices: in each, the triangles add up to the index count, and every range's vertices lie inside the vertex stream. :proven{games="shaun-white-skateboarding"}[every mesh of the install read] The second partition has as many ranges as the first on 10,203 meshes and fewer on 5,725 (often one range over all the indices). :proven[every mesh of the install read]

```layout
title: "Bone palette (Shaun White Skateboarding)"
size: "7 + n"
games: [shaun-white-skateboarding]
note: "One per first-partition range, back to back from the start of the palettes; the rest of the 40 bytes per range is left as stored."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "marker", "value": "3", "level": "proven", "note": "3 on all 34,168 palettes"}
  - {"at": 1, "size": 1, "type": "u8", "name": "version", "value": "1", "level": "proven", "note": "1 on all palettes"}
  - {"at": 2, "size": 1, "type": "u8", "name": "entry count n", "level": "proven", "note": "0 on meshes without bones; at most 32"}
  - {"at": 3, "size": 2, "type": "u16", "name": "unknown", "level": "unknown", "note": "the range's position on 25,302 of 34,168 palettes, another value on the rest"}
  - {"at": 5, "size": 2, "type": "u16", "name": "vertex count", "level": "proven", "note": "equal to the range's vertex count on every palette"}
  - {"at": 7, "size": "n", "type": "u8[n]", "name": "bones", "level": "inferred", "note": "indices into the mesh's bones, all below the bone count; the range's blend indices index this list"}
```

The bytes after the palettes, up to 40 per range, are stored but follow no layout that is established; in the meshes examined they look like left-over index and vertex values. :unknown

The 221 meshes with raw sub-meshes include every mesh with further vertex streams. They hold a CompiledMesh too, and the game draws from it: on the traced route it created buffers for 7 of them, each holding the stored stream-0 vertex and index bytes, and drew 5. :observed{games="shaun-white-skateboarding"}[the traced route]

The further vertex streams are shape morphs of the gameplay objects that grow or deform (the `InfGP` bump, vert and pool shapes). Of 26 morph meshes in level 01, 30 morph targets in all, eight further streams also change the UVs or colours. :observed[level 01]

:::open[What do the raw SubMesh objects hold?]
221 meshes store between one and five `SubMesh` objects after the sub-mesh count, each a run of 16-bit indices followed by further arrays, before their bones and their CompiledMesh. Their layout, and whether the game reads them, is not established. :unknown
:::

## Riders Republic

### Header and layout selection

Offsets are relative to the resource body, after its resource identity and type header. The compiled marker is at `M = 61 + 81 × boneCount`, where `boneCount` is the little-endian u32 at body offset 16. :proven[all mesh headers]{games="riders-republic"}

The 16 bytes before the bone count are, in the runtime class registry's order, the ManagedObject byte, DescriptorMask, Generated, VertexStride and MaxCullingDistance (f32), then eight bytes that are zero on every header and that the registry's list does not itemise. DescriptorMask takes the values 0, 1, 2, 8, 16, 17, 18, 32, 64 and 128; MaxCullingDistance values include 0, 100, 660, 820 and 2,580. :observed[85,577 Mesh headers]{games="riders-republic"}

Each 81-byte bone record before `M` is a MeshBone; see [vertex formats](/engines/anvil/geometry/vertex-formats/) for its fields. :observed{games="riders-republic"}

```layout
title: Compiled mesh prefix
games: [riders-republic]
size: variable
note: Little-endian; offsets from M, not the resource body.
fields:
  - {at: 0, size: 4, type: u32, name: CompiledMesh marker, value: "0xFC9E1595", level: observed}
  - {at: 4, size: 1, type: u8, name: layout selector, level: observed, note: "0 ranged; 3 inline"}
  - {at: 5, size: 8, type: bytes, name: stored prefix, level: unknown, note: "zero in the split and inline multi-mesh census"}
  - {at: 13, size: 4, type: u32, name: layout class, level: observed, note: "0xC351EE43 ranged; 0x0645ABB5 MeshData for inline"}
```

The ranged prefix continues with a u32 at `M+17`, vertex-format byte at `M+21`, three u32 stream strides at `M+22`, a u32 at `M+34`, centre and half-extent float3 values at `M+38` and `M+50`, a byte at `M+62`, range count at `M+63`, and eight bytes before the first range at `M+75`. :proven[29,174 split meshes]{games="riders-republic"}

```layout
title: Ranged compiled header after the layout class
games: [riders-republic]
size: 58
note: Offsets start at M+17; measured over all 29,174 split meshes.
fields:
  - {at: 0, size: 4, type: u32, name: stored word, level: unknown, note: "2 throughout the split census"}
  - {at: 4, size: 1, type: u8, name: vertex format, level: proven}
  - {at: 5, size: 12, type: "u32[3]", name: stream strides, level: proven}
  - {at: 17, size: 4, type: u32, name: stored word, level: unknown, note: "0 throughout the split census"}
  - {at: 21, size: 12, type: float3, name: centre, level: proven}
  - {at: 33, size: 12, type: float3, name: half extent, level: proven}
  - {at: 45, size: 1, type: u8, name: stored byte, level: unknown, note: "0 throughout the split census"}
  - {at: 46, size: 4, type: u32, name: range count, level: proven}
  - {at: 50, size: 8, type: bytes, name: stored words, level: unknown, note: "two zero u32 values throughout the split census"}
```

| Format | Kind | Stream strides in bytes | Confidence |
|---|---:|---|---|
| static16 | 11 | 16, 0, 0 | :observed{games="riders-republic"} |
| static24 | 2 | 24, 0, 0 | :observed{games="riders-republic"} |
| static28 | 3 | 28, 0, 0 | :observed{games="riders-republic"} |
| split12 | 0 | 12, 12, 8 | :proven[all split12 meshes]{games="riders-republic"} |
| split24 | 1 | 24, 12, 8 | :proven[all split24 meshes]{games="riders-republic"} |
| split12 with eight influences | 0 | 12, 12, 16 | :proven[all 58 meshes]{games="riders-republic"} |

### Ranged buffers

Each range starts with `0x07B19A87`, a byte 1, three bytes, first-index u32 and vertex-base u32. Every range except the last has another eight bytes. The first range begins at index and vertex zero; successive range boundaries partition the buffers. Indices are u16 and relative to each range's vertex base. :proven[29,174 split meshes]{games="riders-republic"}

```layout
title: Ranged range record
games: [riders-republic]
size: 16
note: Eight further bytes follow every record except the last.
fields:
  - {at: 0, size: 4, type: u32, name: range class, value: "0x07B19A87", level: proven}
  - {at: 4, size: 1, type: u8, name: stored byte, level: unknown, note: "1 in the split census"}
  - {at: 5, size: 3, type: bytes, name: stored bytes, level: unknown, note: "zero in the split census"}
  - {at: 8, size: 4, type: u32, name: first index, level: proven}
  - {at: 12, size: 4, type: u32, name: vertex base, level: proven}
```

After the ranges come four length-prefixed streams in order: primary attributes, positions, skin, indices. A static mesh's separate position and skin streams have zero lengths. Split position records are 12 bytes; skin records are 8 or 16 bytes. :proven[split census]{games="riders-republic"}

The index buffer is followed by a length-prefixed block of 32 bytes per range (PrimitiveDescData, below), two more length-prefixed streams, `MeshData`, the primitive records, four length-prefixed runs and the material list. All four final runs are empty in every split mesh; some static meshes carry copies of their vertex and index buffers there. :proven[29,174 split bodies; static copies observed]{games="riders-republic"}

```layout
title: PrimitiveDescData record
games: [riders-republic]
size: 32
note: "One per range, after the index buffer. Field names from the runtime class registry."
fields:
  - {at: 0, size: 12, type: float3, name: centre, level: observed, note: "equals the compiled header's centre on all 1,820 checked single-range meshes"}
  - {at: 12, size: 12, type: float3, name: half extent, level: observed, note: "equals the compiled header's half extent on the same 1,820"}
  - {at: 24, size: 1, type: u8, name: primitive type, level: observed, note: "1 in the checked records"}
  - {at: 25, size: 3, type: u24, name: index count, level: observed, note: "three times the range's triangle count on 5,205 of 5,205 checked"}
  - {at: 28, size: 4, type: u32, name: first index, level: observed, note: "equals the range's first index on 2,617 of 2,617 checked"}
```

```layout
title: MeshData declaration and count
games: [riders-republic]
size: 10
note: Starts immediately after the MeshData marker 0x0645ABB5.
fields:
  - {at: 0, size: 1, type: u8, name: index width selector, level: observed, note: "0 means u16; 1 means u32"}
  - {at: 1, size: 1, type: u8, name: vertex format, level: observed}
  - {at: 2, size: 3, type: "u8[3]", name: stream strides, level: observed}
  - {at: 5, size: 1, type: u8, name: NbBonesPerVertex, level: observed, note: "registry name; 4 in static24 and four-influence split meshes, 8 in eight-influence split meshes"}
  - {at: 6, size: 4, type: u32, name: object count, level: observed}
```

```layout
title: Inline object record
games: [riders-republic]
size: 36
fields:
  - {at: 0, size: 8, type: u64, name: stored identity, level: unknown, note: "zero in all 2,732 multi-mesh object records"}
  - {at: 8, size: 4, type: u32, name: MeshPrimitive marker, value: "0xA57387EF", level: proven}
  - {at: 12, size: 4, type: u32, name: vertex base, level: proven}
  - {at: 16, size: 4, type: u32, name: stored word, level: unknown, note: "zero in all 2,732 records"}
  - {at: 20, size: 4, type: u32, name: vertex count, level: proven}
  - {at: 24, size: 4, type: u32, name: first index, level: proven}
  - {at: 28, size: 4, type: u32, name: triangle count, level: proven}
  - {at: 32, size: 4, type: u32, name: stored word, level: unknown, note: "1 in all 2,732 records; material-slot interpretation not established"}
```

### Inline meshes and index origin

The inline form has `MeshData` directly at `M+13`. Its declaration, count and **all** object records precede the length-prefixed primary, position, skin and index blobs; the material list follows the indices. One object is a special case of this grammar. :proven[1,170 multi-mesh bodies]{games="riders-republic"}

Every one of the 1,170 multi-mesh entries contains two to four objects, uses 24-byte vertices and u16 indices, and has empty separate position and skin streams. Object vertex and index intervals tile their shared buffers in record order. Their indices are **absolute**, unlike the ranged form: adding the vertex base changes the result incorrectly. Independent decoding agrees on positions, indices and object partitions on all 1,170 entries, and each body is consumed exactly. :proven{games="riders-republic"}

### Material list

The common material list is a u32 count, eight bytes, one 28-byte descriptor per range, another u32 count, six bytes, one 31-byte group per range and a 20-byte trailer. Each descriptor starts with `0x0B1D34C1`, four bytes, zero byte, u16 vertex count, zero byte, u64 Material identity and eight bytes. The group's identity at offsets 8 and 17 repeats the descriptor's identity. :proven[split and inline multi-mesh censuses]{games="riders-republic"}

```layout
title: Mesh material descriptor
games: [riders-republic]
size: 28
fields:
  - {at: 0, size: 4, type: u32, name: descriptor marker, value: "0x0B1D34C1", level: proven}
  - {at: 4, size: 4, type: bytes, name: stored bytes, level: unknown, note: "not interpreted"}
  - {at: 8, size: 1, type: u8, name: stored byte, level: unknown, note: "0 in the measured layouts"}
  - {at: 9, size: 2, type: u16, name: vertex count modulo 65536, level: observed}
  - {at: 11, size: 1, type: u8, name: stored byte, level: unknown, note: "0 in the measured layouts"}
  - {at: 12, size: 8, type: u64, name: Material identity, level: proven}
  - {at: 20, size: 8, type: bytes, name: final bytes, level: observed, note: "last split descriptor has u32 31 then f32 position scale; others are zero"}
```

The descriptor vertex count is the range count modulo 65,536, rather than a limit on the mesh's number of vertices. Two sampled inline meshes contain 72,260 and 93,906 vertices. :observed{games="riders-republic"}

The count can also be stale. `GFX_WireFrame_Wall_01_LOD0` declares 8,845 vertices and 5,593 triangles in both its primitive record and its material descriptor, while its buffers hold 2,490 vertices and 1,992 triangles; the decoded positions agree with the stored bounds, and an independent reader decodes the same buffers. The buffers, not the declared count, describe that mesh. :observed{games="riders-republic"}

### Registry names

The runtime class registry names the compiled structures, and its field order agrees with the stored bytes. :observed[85,577 Mesh headers and 83,800 ranged bodies]{games="riders-republic"}

| Stored structure | Registry class or field | Confidence |
|---|---|---|
| Ranged layout class `0xC351EE43` | ClusteredMeshData, the compiled mesh's pointer; the inline form stores it null, so its selector byte is the pointer tag | :observed{games="riders-republic"} |
| Ranged header words | Version (2), VertexFormat, three strides, ClusterCount (0), Center, HalfExtend, IsFixedClusterSize (0), DrawPrims count | :observed{games="riders-republic"} |
| Range record `0x07B19A87` | ClusteredPrimitiveInfo: ClusterCount (1), IndexStart, VertexStart | :observed{games="riders-republic"} |
| Streams | VertexDataStatic, VertexDataDynamic (positions), VertexDataIndexWeight (skin), IndexData, PrimitiveDescData | :observed{games="riders-republic"} |
| Inline object record | MeshPrimitive: MinIndex, IsUsingDepthOnlyBuffers (0), NumVertices, StartIndex, PrimitiveCount, Type (1) | :observed{games="riders-republic"} |
| Final four runs | VertexBufferDataStatic, VertexBufferDataDynamic, VertexBufferDataIndexWeight, IndexBufferData; the middle two are empty on all 83,800 bodies, the first and last filled on 2,160 | :observed{games="riders-republic"} |
| Descriptor `0x0B1D34C1` | MeshInstancingData; the last descriptor's u32 31 is PlatformVersion (31 on all 83,800) and its f32 is QuantizationFactor, the position scale | :observed{games="riders-republic"} |
| 31-byte group | DynamicReference `0x9F1640AF`, whose ObjectReference and ObjectHandle both equal the descriptor's Material on all 127,219 groups; six bytes remain unattributed | :observed{games="riders-republic"} |
| 20-byte trailer | Sixteen Mesh bool bytes, then u32 UserCategory | :observed{games="riders-republic"} |

The first trailer bool is 1 on exactly the 2,160 meshes with filled CPU-side runs, which fits a flag such as Dynamic; the individual names of these 16 bytes are not established. :observed{games="riders-republic"} :inferred[flag name]{games="riders-republic"}

See [vertex formats](/engines/anvil/geometry/vertex-formats/) for stream decoding and [LOD levels](/engines/anvil/geometry/lod/) for geometry selection.

:::open[What do the remaining compiled fields control?]
The values retained around stream declarations, object records and the trailer do not all have established runtime meanings. A constant value alone does not establish a reserved field. :unknown{games="riders-republic"}
:::
