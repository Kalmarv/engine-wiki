---
title: Model libraries (MLP, MMP, MGP)
description: "How a level's meshes are stored: an MLP resource table and metadata, an MMP buffer of positions and indices, an MGP buffer of the other vertex attributes, and the scene file beside them."
implementations:
  - name: primase worlds/shred (scene.rs, convert.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/shred/src/read/scene.rs
---

A level's meshes are not stored one by one. A PAK holds a **quartet**: four entries with one base name and four extensions, `.scp` (the scene: placements and more, see [Placements](/engines/rme/geometry/placements/)), `.mlp` (the *model library*: a table of
meshes and their metadata), `.mmp` (the `MAIN` buffer) and `.mgp` (the `LOCAL` buffer). The names of the sections they sit in (`MAIN`, `LOCAL`) follow the PS3's main and video memory, and the split is real: the MMP holds
positions and indices and the MGP the other attributes of the same vertices. :observed
That the two buffers are literally loaded into main and video memory is inferred from the section names. :inferred

The disc has 657 quartets in 324 of the 336 PAKs, which together hold 21,309 mesh resources and 35,114 submeshes. :proven[all 657 quartets]
512 of the quartets hold only rigid meshes; the other 145 (103 character PAKs and 21 layer PAKs) hold meshes with an embedded skinning stream ([Skinned streams](/engines/rme/geometry/skinned-streams/)). :proven[all 657 quartets]
The 21,309 mesh resources are 17,897 rigid and 3,412 skinned; counts are of occurrences across PAKs, not of distinct meshes. :proven[all 657 quartets]

All integers and floats are big-endian. MMP and MGP are raw buffers with no header of their own.

## Offsets

Three bases are in use. :proven[all 657 quartets]

1. The tables of an SCP point at absolute offsets inside the decoded SCP.
2. A record of the MLP's resource table gives the offsets and sizes of one mesh's slices: its metadata is relative to the MLP's data base, its position and index bytes to the MMP's start, its attribute bytes to the MGP's start.
3. Offsets inside a mesh's metadata (its stream descriptors and submeshes) are relative to that metadata slice, and the descriptors' buffer offsets are relative to that mesh's own MMP or MGP slice.

No relocation table is needed for rigid meshes. The executable's loader turns the offsets of an SCP and of an MLP into pointers when it loads the file and records that in the `u16` at offset 10 (bit 4); a mesh's metadata carries that bit already set on disc, so it is used as stored. :observed[static reading of the executable]

## MLP

```layout
title: MLP header
size: 28
games: [shred]
note: Followed by `resource_count` records of 28 bytes from `table_offset`, then padding to `data_base`.
fields:
  - {at: 0, size: 4, type: u32, name: magic, value: "0xFAFA0003", level: proven}
  - {at: 4, size: 4, type: u32, name: unknown, level: unknown, note: "0 in the CHARLIE sample"}
  - {at: 8, size: 2, type: u16, name: header_size, value: "0x001C", level: observed, note: "equals the table offset"}
  - {at: 10, size: 2, type: u16, name: load_flags, level: observed, note: "0 on disc; the loader sets bit 1 for storage it only borrows and bit 4 once relocated"}
  - {at: 12, size: 4, type: u32, name: unknown, level: unknown}
  - {at: 16, size: 4, type: u32, name: resource_count, level: proven, note: "54 in CHARLIE, 750 in MIKE"}
  - {at: 20, size: 4, type: u32, name: data_base, level: proven, note: "where the metadata blob starts; 0x610 in CHARLIE"}
  - {at: 24, size: 4, type: u32, name: table_offset, value: "28", level: proven}
```

```layout
title: MLP resource record
size: 28
games: [shred]
note: One per mesh. The metadata of a mesh starts at `data_base + metadata_offset`.
fields:
  - {at: 0, size: 4, type: u32, name: mesh_id, level: proven, note: "equals the id in the mesh's own metadata at 0x80; placements refer to it"}
  - {at: 4, size: 4, type: u32, name: metadata_offset, level: proven}
  - {at: 8, size: 4, type: u32, name: mmp_offset, level: proven}
  - {at: 12, size: 4, type: u32, name: mgp_offset, level: proven}
  - {at: 16, size: 4, type: u32, name: metadata_size, level: proven}
  - {at: 20, size: 4, type: u32, name: mmp_size, level: proven}
  - {at: 24, size: 4, type: u32, name: mgp_size, level: proven, note: "0 when the mesh has no MGP data"}
```

The id in the record equals the id inside the mesh in all 21,309 resource occurrences. :proven[all 657 quartets]
The slices of the MMP and MGP follow one another with zero padding of at most 14 and 12 bytes between them, and in the 512 rigid-only quartets 131,907,800 of the 131,996,256 MMP bytes and 98,794,820 of the 98,833,888 MGP bytes are inside slices; every unconsumed byte is zero. :proven[512 rigid-only quartets]
The first CHARLIE record is `296f09da, 0, 0, 0, 0x180, 0x1208, 0x840`. :observed

## Mesh metadata (`BABA0031`)

```layout
title: Mesh metadata
size: 192
games: [shred]
note: Followed at 0xC0 by the submesh records. The descriptors it points at sit after them.
fields:
  - {at: 0, size: 4, type: u32, name: magic, value: "0xBABA0031", level: proven}
  - {at: 4, size: 4, type: u32, name: unknown, level: unknown, note: "sentinel"}
  - {at: 8, size: 2, type: u16, name: header_size, value: "0x00C0", level: observed}
  - {at: 10, size: 2, type: u16, name: load_flags, value: "0xFFFF", level: observed, note: "the loader relocates the offsets at 0x84 and 0x90 to 0xA0 only when bit 4 is clear"}
  - {at: 12, size: 4, type: u32, name: unknown, level: unknown, note: "sentinel"}
  - {at: 16, size: 64, type: "f32[16]", name: local_matrix, level: proven, note: "the identity in all 21,309 resources"}
  - {at: 80, size: 16, type: "f32[4]", name: bounding_sphere, level: inferred, note: "centre xyz and radius; not needed for decoding"}
  - {at: 96, size: 16, type: "f32[4]", name: aabb_min, level: proven, note: "local box minimum xyz; the fourth value is 1"}
  - {at: 112, size: 16, type: "f32[4]", name: aabb_max, level: proven, note: "local box maximum xyz; the fourth value is 1"}
  - {at: 128, size: 4, type: u32, name: mesh_id, level: proven}
  - {at: 132, size: 8, type: "u32[2]", name: unknown, level: unknown, note: "sentinels"}
  - {at: 140, size: 4, type: u32, name: vertex_format_mask, level: proven, note: "which attributes the vertices hold; see Vertex formats"}
  - {at: 144, size: 4, type: u32, name: primary_stream, level: proven, note: "offset of the primary stream descriptor"}
  - {at: 148, size: 4, type: u32, name: attribute_stream, level: proven, note: "offset of the MGP stream descriptor, or 0xFFFFFFFF"}
  - {at: 152, size: 4, type: u32, name: index_stream, level: proven, note: "offset of the index descriptor"}
  - {at: 156, size: 4, type: u32, name: embedded_stream, level: proven, note: "offset of the skinning stream, or 0xFFFFFFFF for rigid meshes"}
  - {at: 160, size: 4, type: u32, name: submesh_offset, value: "0xC0", level: proven}
  - {at: 164, size: 4, type: u32, name: submesh_count, level: proven}
  - {at: 168, size: 4, type: u32, name: secondary_count, level: unknown, note: "may differ from the submesh count"}
  - {at: 172, size: 8, type: "u32[2]", name: runtime_buffers, level: observed, note: "the loader writes the MMP and MGP base pointers here"}
  - {at: 180, size: 4, type: u32, name: flags, level: observed, note: "bit 0: the skinning stream is already processed (all 3,412 skinned meshes)"}
  - {at: 184, size: 8, type: "u8[8]", name: unknown, level: unknown}
```

Every position of every decoded rigid mesh is finite and inside the stored box (to 0.05 units). :proven[all 17,897 rigid meshes]

### Stream descriptors

The primary stream (positions and the packed normal, in the MMP) and the MGP stream share a 24-byte layout; the index descriptor has its own.

```layout
title: Stream descriptor
size: 24
games: [shred]
fields:
  - {at: 0, size: 4, type: u32, name: vertex_count, level: proven}
  - {at: 4, size: 4, type: u32, name: second_count, level: unknown, note: "equals vertex_count in every sample"}
  - {at: 8, size: 4, type: u32, name: stride, level: proven, note: "bytes per vertex"}
  - {at: 12, size: 4, type: u32, name: unknown, level: unknown, note: "address-like or small values; not an offset into the file"}
  - {at: 16, size: 4, type: u32, name: offset, level: proven, note: "into this resource's slice of the MMP or MGP"}
  - {at: 20, size: 4, type: u32, name: size, level: proven, note: "count × stride"}
```

```layout
title: Index descriptor
size: 24
games: [shred]
fields:
  - {at: 0, size: 4, type: u32, name: index_count, level: proven}
  - {at: 4, size: 4, type: u32, name: primitive, value: "5", level: proven, note: "a triangle list"}
  - {at: 8, size: 4, type: u32, name: offset, level: proven, note: "into this resource's MMP slice"}
  - {at: 12, size: 4, type: u32, name: size, level: proven, note: "index_count × 2"}
  - {at: 16, size: 4, type: u32, name: index_type, value: "1", level: proven, note: "big-endian u16"}
  - {at: 20, size: 4, type: u32, name: unknown, level: unknown, note: "0"}
```

For a rigid mesh the primary stream is 16 bytes a vertex: three big-endian `f32` (x, y, z) and one packed word, the normal ([Vertex formats](/engines/rme/geometry/vertex-formats/)). :proven[all 17,897 rigid meshes]
The MMP slice holds the vertices then the indices, and the two descriptors together consume it exactly; the MGP stream consumes the MGP slice exactly. :proven[all 17,897 rigid meshes]
In CHARLIE's first mesh 176 vertices × 16 = 0xB00 bytes precede 900 indices (0x708 bytes), 0xB00 + 0x708 = 0x1208 = the MMP size, and 300 triangles result. :observed

### Submeshes

```layout
title: Submesh record
size: 96
games: [shred]
note: "`submesh_count` records from `submesh_offset`; they partition the index buffer."
fields:
  - {at: 0, size: 16, type: "f32[4]", name: bounding_sphere, level: inferred}
  - {at: 16, size: 16, type: "u8[16]", name: unknown, level: unknown, note: "address-like values"}
  - {at: 32, size: 4, type: u32, name: first_index, level: proven, note: "in indices, not bytes; a multiple of 3"}
  - {at: 36, size: 4, type: u32, name: index_count, level: proven, note: "a multiple of 3"}
  - {at: 40, size: 4, type: u32, name: base_vertex, level: observed, note: "0 in every rigid mesh"}
  - {at: 44, size: 4, type: u32, name: unknown, level: unknown, note: "sentinel"}
  - {at: 48, size: 4, type: u32, name: unknown, level: unknown}
  - {at: 52, size: 4, type: u32, name: material_id, level: proven, note: "a global id looked up in the material banks"}
  - {at: 56, size: 4, type: "u8[4]", name: uv_selectors, level: proven, note: "which stored UV set feeds each logical UV; see Vertex formats"}
  - {at: 60, size: 36, type: "u8[36]", name: unknown, level: unknown, note: "padding and sentinels"}
```

The submeshes' index spans are an exact, disjoint partition of the mesh's index buffer and every index is below the vertex count. :proven[all 17,897 rigid meshes]
Every one of the 35,114 submesh occurrences, rigid or skinned, names a material id present in the material banks. :proven[all 657 quartets]

:::open[What are the unknown words of the metadata and the submesh?]
The words at metadata offsets 4, 12, 132, 136, 168 and 184 and submesh offsets 16 to 31, 44, 48 and 60 to 95 hold sentinels, address-like values or zero. Nothing was found that reads them during loading.
:::
