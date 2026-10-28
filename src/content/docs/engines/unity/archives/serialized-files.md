---
title: SerializedFile containers
description: "The container behind globalgamemanagers, levelN and *.assets files: header versions 21 and 22, the type table, the object table, script references and external files."
games: [skatebird, sledding, peak, big-walk]
sources:
  - title: UnityPy
    url: https://github.com/K0lb3/UnityPy
    note: SerializedFile reader; the field order of the metadata
  - title: AssetRipper
    url: https://github.com/AssetRipper/AssetRipper
    note: documents the container versions and publishes the type tree package (TPK)
implementations:
  - name: unity-formats (serialized.rs)
    url: https://github.com/Kalmarv/unity-formats/blob/main/src/serialized.rs
---

A Unity player keeps its scenes and assets in **SerializedFiles**: one container format for `globalgamemanagers`,
`globalgamemanagers.assets`, `resources.assets`, every `levelN` (a scene) and every `sharedassetsN.assets` (the assets
scenes share). A file is a header, a block of metadata (which types occur, where each object's bytes are, which other
files it points into) and the objects' bytes. Bulk data (texture pixels, vertex streams, audio) is not inside: objects
name a range of a [`.resS` or `.resource` file](/engines/unity/archives/player-data-folder/) beside it. :proven{games="skatebird"}

Two container versions occur in the games here. SkateBIRD (Unity 2019.4) writes version 21; Sledding Game, PEAK and Big
Walk (Unity 6000.3) write version 22. :proven[every serialized file of each install]
The same containers sit inside a [UnityFS bundle](/engines/unity/archives/unityfs-bundles/) when a build packs its data
into one; Big Walk does.

## Builds measured

| Game | Container | Unity version in the file | Files | Embedded type trees | Confidence |
|---|---|---|---|---|---|
| SkateBIRD | 21 | `2019.4.20f1` | 31 | none | :proven |
| Sledding Game | 22 | `6000.3.12f1` | 7 | none | :proven |
| PEAK 3.0.0 | 22 | `6000.3.15f1` | 13 | none | :proven |
| Big Walk | 22 | `6000.3.17f1` | 12 (inside `data.unity3d`) | none | :proven |
| Sledding Game's Addressables | 22 | `6000.3.12f1` | 50 (inside 50 bundles) | every type | :proven |
| PEAK 3.0.0's level bundles | 22 | `6000.3.15f1` | 417 (inside 8 bundles) | every type of 416 files, none in the manifest bundle `maps` | :proven |

"Proven" here is a census of every serialized file of the install: each header parses, the stated file size equals
the file's size, the data offset is a multiple of 16 and lies after the metadata, the target platform is 19
(Windows x64), and the has-type-tree byte is 0. Player builds strip type trees from their files; the layout of each
class is supplied from outside ([type trees](/engines/unity/data-model/type-trees/)). The files in
[bundles](/engines/unity/archives/unityfs-bundles/) are the other case: the same census of the 479 serialized files of the
three games' bundles (a second reader agrees on every header, type, object table and external) finds the has-type-tree byte 1
in 466 of them, where each type is followed by its tree.

## Header

The header's first fields are big-endian whatever the file's endianness byte says; the metadata after it is read in the
file's own endianness (little in every file measured). :proven

```layout
title: SerializedFile header, version 21
size: 20
games: [skatebird]
note: "All fields big-endian. The metadata starts at byte 20 and ends metadata size bytes later; object bytes start at the data offset."
fields:
  - {at: 0, size: 4, type: u32, name: metadata size, level: proven, note: "bytes of metadata after the header; 1,340 in SkateBIRD's globalgamemanagers"}
  - {at: 4, size: 4, type: u32, name: file size, level: proven, note: "equals the file's length in every file"}
  - {at: 8, size: 4, type: u32, name: version, value: "21", level: proven}
  - {at: 12, size: 4, type: u32, name: data offset, level: proven, note: "where the objects' bytes begin; a multiple of 16 in every file (4,096 in globalgamemanagers)"}
  - {at: 16, size: 1, type: u8, name: endianness, level: proven, note: "0 little-endian in every file"}
  - {at: 17, size: 3, type: "u8[3]", name: reserved, level: proven, note: "zero"}
```

Version 22 keeps the version-21 field positions for the version but zeroes the old size fields and repeats them wider
after the endianness bytes: sizes and the data offset become 32-, 64- and 64-bit numbers.
:proven{games="sledding peak big-walk"}

```layout
title: SerializedFile header, version 22
size: 48
games: [sledding, peak, big-walk]
note: "All fields big-endian. The metadata starts at byte 48."
fields:
  - {at: 0, size: 4, type: u32, name: legacy metadata size, value: "0", level: proven, note: "unused in version 22"}
  - {at: 4, size: 4, type: u32, name: legacy file size, value: "0", level: proven, note: "unused in version 22"}
  - {at: 8, size: 4, type: u32, name: version, value: "22", level: proven}
  - {at: 12, size: 4, type: u32, name: legacy data offset, value: "0", level: proven, note: "unused in version 22"}
  - {at: 16, size: 1, type: u8, name: endianness, level: proven, note: "0 little-endian in every file"}
  - {at: 17, size: 3, type: "u8[3]", name: reserved, level: proven, note: "zero"}
  - {at: 20, size: 4, type: u32, name: metadata size, level: proven}
  - {at: 24, size: 8, type: u64, name: file size, level: proven, note: "equals the file's length in every file"}
  - {at: 32, size: 8, type: u64, name: data offset, level: proven, note: "a multiple of 16 in every file"}
  - {at: 40, size: 8, type: u64, name: reserved, value: "0", level: proven, note: "zero in every file"}
```

## Metadata

The metadata follows the header in this order. Counts are `i32`. :proven{games="skatebird"} The reader that parses this
order consumes the metadata of every SkateBIRD file to its stated end, and its object tables match an independent reader's
on all 503,045 objects of the 31 files (path ids, class ids, byte offsets and sizes). :proven{games="skatebird"}

| Part | Content | Confidence |
|---|---|---|
| Unity version | NUL-terminated string (`2019.4.20f1`) | :proven |
| Target platform | `i32`; 19 in every file | :proven |
| Has type trees | `u8`; 0 in every file (stripped) | :proven |
| Types | count, then one [type entry](#type-entry) each | :proven |
| Objects | count, then one [object entry](#object-entry) each | :proven |
| Script types | count, then per entry a file index (`i32`), 4-byte alignment, a path id (`i64`) | :proven{games="skatebird"} |
| External files | count, then per entry an empty string, a 16-byte GUID, a kind (`i32`) and a path string | :proven{games="skatebird"} |
| Reference types | count, then type entries with a script id when the script index is not negative; with stored trees each is followed by its tree and three strings | :proven{games="peak sledding big-walk"} |
| User information | NUL-terminated string | :proven{games="skatebird"} |

### Type entry

```layout
title: Type entry
size: variable
note: "23 bytes for a class other than MonoBehaviour (114), 39 for MonoBehaviour. In the metadata endianness (little)."
fields:
  - {at: 0, size: 4, type: i32, name: class id, level: proven, note: "Unity's class id (1 GameObject, 4 Transform, 21 Material, 28 Texture2D, 43 Mesh, 114 MonoBehaviour, ...)"}
  - {at: 4, size: 1, type: u8, name: stripped, level: proven}
  - {at: 5, size: 2, type: i16, name: script type index, level: proven, note: "-1 for a class other than MonoBehaviour"}
  - {at: 7, size: 16, type: "u8[16]", name: script id, level: proven, note: "only present when the class id is 114 (MonoBehaviour): the hash of the script's identity"}
  - {at: "7, or 23 with a script id", size: 16, type: "u8[16]", name: old type hash, level: sourced, note: "UnityPy's name; the hash of the class's layout"}
```

### Type entry with a stored tree

When the has-type-tree byte is 1, each type entry (and each reference type entry) continues after its old type hash with
the type's tree, then, for an ordinary type, a list of type indices, and for a reference type three strings.
:proven{games="peak sledding"} The metadata of all 466 files that store trees is consumed exactly to its stated end by this
layout, and an independent reader gives the same tree for every one of the 83,867 types. :proven{games="peak sledding"}

```layout
title: Stored type tree (after the old type hash)
size: variable
games: [peak, sledding]
note: "In the metadata endianness (little). Nodes are in depth-first order; a node's parent is the nearest earlier node whose level is one less."
fields:
  - {at: 0, size: 4, type: i32, name: node count, level: proven, note: "at least 1"}
  - {at: 4, size: 4, type: i32, name: string buffer size, level: proven}
  - {at: 8, size: "32 per node", type: "node[]", name: nodes, level: proven, note: "see the node layout"}
  - {at: "after the nodes", size: "string buffer size", type: "char[]", name: string buffer, level: proven, note: "NUL-terminated strings"}
  - {at: "after the buffer", size: variable, type: "i32 count + i32[]", name: type dependencies, level: proven, note: "ordinary types: indices into the type table (empty for most)"}
  - {at: "after the buffer", size: variable, type: "char[] x3", name: "class, namespace and assembly", level: proven, note: "reference types instead of the dependency list: three NUL-terminated strings"}
```

```layout
title: Stored type tree node
size: 32
games: [peak, sledding]
note: "In the metadata endianness (little)."
fields:
  - {at: 0, size: 2, type: i16, name: version, level: proven, note: "the node's version, as in a package's tree"}
  - {at: 2, size: 1, type: u8, name: level, level: proven, note: "0 for the root, a child's level is its parent's plus one"}
  - {at: 3, size: 1, type: u8, name: type flags, level: observed, note: "0, or 1 on Array and TypelessData nodes, 2 on managedReference nodes, 4 on ManagedReferencesRegistry, 8 on the element type of an array of managed references: values 0, 1, 2, 4 and 8 in 180,511 nodes of 13 files"}
  - {at: 4, size: 4, type: u32, name: type string offset, level: proven, note: "top bit clear: offset into the string buffer; top bit set: the low 31 bits are an offset into the engine's common string table"}
  - {at: 8, size: 4, type: u32, name: name string offset, level: proven, note: "as the type string offset"}
  - {at: 12, size: 4, type: i32, name: byte size, level: proven, note: "-1 where the size varies"}
  - {at: 16, size: 4, type: i32, name: index, level: observed, note: "the node's position in the list, in all 180,511 nodes of 13 files"}
  - {at: 20, size: 4, type: u32, name: meta flags, level: proven, note: "0x4000 aligns the position to 4 bytes after the node"}
  - {at: 24, size: 8, type: u64, name: reference type hash, level: observed, note: "0 in all 180,511 nodes of 13 files"}
```

### Object entry

Each entry starts on a 4-byte boundary of the file. The object's bytes are `size` bytes at `data offset + start`; its class
is that of its type entry. Path ids are unique within a file. :proven

```layout
title: Object entry, version 21
size: 20
games: [skatebird]
fields:
  - {at: 0, size: 8, type: i64, name: path id, level: proven, note: "the object's identity within this file"}
  - {at: 8, size: 4, type: u32, name: start, level: proven, note: "offset from the data offset"}
  - {at: 12, size: 4, type: u32, name: size, level: proven}
  - {at: 16, size: 4, type: u32, name: type index, level: proven, note: "index into the type table"}
```

```layout
title: Object entry, version 22
size: 24
games: [sledding, peak, big-walk]
note: "As version 21 but the start is 64 bits wide."
fields:
  - {at: 0, size: 8, type: i64, name: path id, level: proven}
  - {at: 8, size: 8, type: i64, name: start, level: proven}
  - {at: 16, size: 4, type: u32, name: size, level: proven}
  - {at: 20, size: 4, type: u32, name: type index, level: proven}
```

## References between objects

An object points at another with a **PPtr**: a file id and a path id. File id 0 is the same file; file id *n* is external
file *n* − 1 of the metadata. :sourced[UnityPy] A script field that stores an object reference writes it as 12 bytes: an `i32` file id and
an `i64` path id, a path id of 0 meaning null. :observed{games="skatebird sledding"}

Scenes link the shared libraries through their externals. SkateBIRD's `level12` lists `globalgamemanagers.assets`,
`sharedassets0` to `sharedassets5`, `sharedassets7`, `sharedassets12`, `resources.assets` and `Library/unity default
resources`; `level13` adds `sharedassets13`. :observed{games="skatebird"} A scene file holds no `Texture2D`, `Material`,
`Shader` or `AudioClip` object in any of SkateBIRD's 14 scenes; its renderers reference the `sharedassets` files.
:observed{games="skatebird"}

## Container versions and Unity versions

A reader accepts a container version it was checked against and refuses others: versions 21 and 22 are the ones verified
against real data here. :observed A version 21 file is not a version 22 file read with other widths; field offsets and
the object table differ, so one reader needs both layouts. :proven

:::open[Containers older or newer than 21 and 22]
Unity's serialized container has other versions (older players, and newer editors may raise it). None of the games
documented here uses one, so their layouts are not described.
:::
