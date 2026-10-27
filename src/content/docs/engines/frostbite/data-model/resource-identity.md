---
title: Resource identity and name hashes
description: The distinct identities used by manifests, mesh caches, texture streaming and material depots.
games: [skate]
implementations:
  - name: frostbite-formats (bundle.rs)
    url: https://github.com/Kalmarv/frostbite-formats/blob/main/src/bundle.rs
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

## Resource types in stock

The 6,056 stock manifests list 428,211 resource entries of 47 distinct type ids. 26 of the ids are the djb2-XOR hash of a
lowercase type name, found by hashing the type names, field names and strings of the stock EBX documents and a list of
candidate class names (the same recurrence as the mesh hash above); the other 21 ids have no name yet. :observed[hashes of 303,105 distinct strings against the 47 ids]

| Type id | Name | Resources | Top path directories |
|---|---|---|---|
| `0x7dd4cc89` |  | 116,213 | `gameplay/`, `ui/` |
| `0x6bde20ba` | Texture | 78,566 | `world/`, `characters/` |
| `0x49b156d4` | MeshSet | 49,414 | `world/`, `levels/` |
| `0xb2c465f6` |  | 34,982 | `audio/` |
| `0x4088bf7e` |  | 34,088 | `animation/` |
| `0x41759364` | PhysicsResource | 33,277 | `world/`, `levels/` |
| `0xd489facb` | ExpressionShaderRasterPermutation | 28,151 | `expressionshader/` |
| `0x0e2b02f7` | CompiledBytecode | 20,429 | `shaders/` |
| `0x93afacc3` |  | 7,654 | `ui/`, `thumbnail/` |
| `0x5297a88f` |  | 6,784 | `audio/`, `frsr/` |
| `0x250047b2` | ExpressionShaderRasterPermutationSharedData | 4,533 | `expressionshader/` |
| `0xed27dbda` |  | 3,026 | `characters/` |
| `0x2fec6526` | ShaderStateAssetId | 2,598 | `levels/`, `items/` |
| `0x73312045` | ShaderBlockDepotResource | 2,490 | `levels/`, `items/` |
| `0xa19b025d` | ExpressionShaderBindingSet | 1,198 | `expressionshader/` |
| `0x78791c75` |  | 900 | `effects/` |
| `0xf17ddabd` |  | 804 | `e23f05da-92dc-74dd-fe26-b1912244b73e_scalphair_wraplist_deformsettinge23f05da-92dc-74dd-fe26-b1912244b73e_scalphair_wraplist_deformsetting_wrap[4][4][0]/`, `e23f05da-92dc-74dd-fe26-b1912244b73e_scalphair_wraplist_deformsettinge23f05da-92dc-74dd-fe26-b1912244b73e_scalphair_wraplist_deformsetting_wrap[1][1][1]/` |
| `0x7a630735` | ExpressionShaderStreamableTextureSet | 477 | `expressionshader/` |
| `0x7d98f632` | ExpressionShaderInputLayout | 476 | `expressionshader/` |
| `0xaa8c66b5` |  | 471 | `audio/` |
| `0x30b4a553` | OccluderMesh | 442 | `world/` |
| `0xa8957ed6` | ExpressionShaderRootSlotInitData | 381 | `expressionshader/` |
| `0x95ce62dd` | ExpressionShaderComputePermutation | 242 | `expressionshader/` |
| `0x879ba711` | ExpressionShaderPermutationSharedData | 102 | `expressionshader/` |
| `0x063994c5` |  | 82 | `ui/` |
| `0xe2e6955b` | ExpressionShaderDatabase | 72 | `effects/`, `levels/` |
| `0x2d254a89` | ExpressionShaderStreamableTextureSetLookupTable | 72 | `effects/`, `levels/` |
| `0x85ea8656` |  | 60 | `characters/` |
| `0x85ac783d` |  | 60 | `characters/` |
| `0x8ef3938d` |  | 42 | `characters/` |
| `0xec383b87` |  | 30 | `characters/` |
| `0xde540c59` | LayerGraphs | 22 | `gameplay/`, `items/` |
| `0xf434940d` | ShaderParameterCollectionTable | 9 | `common/`, `effects/` |
| `0x70c5cb3e` |  | 9 | `levels/`, `lighting/` |
| `0x428ec9d4` | BundleRefTableResource | 8 | `common/`, `audio/` |
| `0x589bb36e` | ExpressionShaderPassBinding | 7 | `expressionshader/` |
| `0xc631492b` |  | 7 | `characters/` |
| `0x41d57e10` |  | 7 | `ui/` |
| `0x6a5be5db` | ExpressionShaderBindingSignature | 5 | `expressionshader/` |
| `0x22fe8ac8` | TerrainStreamingTree | 4 | `levels/` |
| `0x1ca38e06` | VisualTerrain | 4 | `levels/` |
| `0x15e1f32e` | TerrainDecals | 4 | `levels/` |
| `0x957c32b1` | AtlasTexture | 3 | `lighting/` |
| `0x89983f10` |  | 2 | `ui/` |
| `0xc189b12b` |  | 2 | `effects/` |
| `0xf04f0c81` |  | 1 | `systems/` |
| `0xb15ad3fd` |  | 1 | `levels/` |

A texture resource's 64-bit streaming identity also carries this hash: its low 32 bits are the djb2-XOR hash of the
texture's lowercase resource name in all 61,618 distinct stock texture headers (see
[texture resources](/engines/frostbite/textures/texture-resources/)). :proven[all stock texture resources]

## Textures and depots

A texture's `h64` appears at resource `+0x78` and in its bundle chunk-metadata row. Base-game per-cell copies of
the same streamed texture share a mip chunk; registering different chunks under one `h64` causes a seam stall
and failure. :observed

Base-game material keys can appear in several depots with identical blocks. A measurement of 9,306 repeated keys
finds no conflicting block hashes. Registering a key with different blocks can leave a freed parameter box in
the registry. :observed

The distinct mesh failures and their measured corrections are recorded in the
[crash catalogue](/engines/frostbite/runtime/crashes/).
