---
title: Resource identity and name hashes
description: The distinct identities used by manifests, mesh caches, texture streaming and material depots.
games: [skate]
implementations:
  - name: primase worlds/frostbite (bundle.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/frostbite/src/bundle.rs
---

Frostbite uses different keys for different registries. Equality in one registry does not imply equality in the
others: a mesh's manifest name, resource id and stored name hash are separate fields. :observed

| Registry | Identity and constraint | Confidence |
|---|---|---|
| Bundle resource entry | Name, 32-bit type id, 64-bit resource id | :observed |
| EBX external reference | File GUID plus instance GUID | :observed |
| EBX name resolution | One name must identify one partition in the measured level closure | :observed |
| Mesh resolution | One MeshSet name must identify one resource id across the loaded compartments | :observed |
| Renderer material-owner cache | Stored 32-bit mesh name hash; strings are not compared | :observed |
| Texture streamer | `h64`, one mip-chunk GUID per identity within a level | :observed |
| ShaderBlockDepot registry | One material key must identify one parameter block across loaded cells | :observed |

## Mesh name hashes

The mesh hash is djb2-XOR over the lowercase full resource path: start with `5381`, then
`h = (h * 33) XOR c` with 32-bit wrapping. MeshAsset stores it at `+0xc8`; MeshSet also stores a name hash at
`+0x78` and hashes for LOD names. Renaming only the manifest entry leaves these cached identities unchanged.
:observed

The material-owner cache (`Skate+0x3f56860`) and resource-name resolution (`+0x3db78d0`) compare hashes only,
never strings. The cache constructs its key from a mesh name hash in the upper 32 bits and a second 32-bit value
from the material entry. Its `0x58`-byte owner stores the slot table at `+0x20` and count at `+0x28`.
Two different paths with the same hash can therefore reuse a slot table of the wrong size. :observed

In a partial census of 241,857 names, seven hashes collide; the base-name subset has one collision among 101,590
names. Identical suffixes preserve a djb2-XOR collision, so adding `_lod0` to both colliding paths cannot separate
their hashes. :observed

For a level of about 50,000 generated mesh names, the chance of at least one 32-bit collision is about 25%, by the
birthday bound. :inferred

The same recurrence hashes lowercase resource **type names**, including MeshSet `0x49b156d4`, Texture `0x6bde20ba`
and ShaderBlockDepotResource `0x73312045`. These type ids are not resource-instance ids. :observed

## Textures and depots

A texture's `h64` appears at resource `+0x78` and in its bundle chunk-metadata row. Base-game per-cell copies of
the same streamed texture share a mip chunk; registering different chunks under one `h64` causes a seam stall
and failure. :observed

Base-game material keys can appear in several depots with identical blocks. A measurement of 9,306 repeated keys
finds no conflicting block hashes. Registering a key with different blocks can leave a freed parameter box in
the registry. :observed

The distinct mesh failures and their measured corrections are recorded in the
[crash catalogue](/engines/frostbite/runtime/crashes/).
