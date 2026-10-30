---
title: Type trees
description: "How a Unity object's bytes are laid out: the type tree that describes each class, the rules for decoding by it, the packages that supply stripped trees, and version-dependent field names."
games: [skatebird, sledding, peak, big-walk]
sources:
  - title: AssetRipper TPK type tree package
    url: https://github.com/AssetRipper/Tpk
    note: class layouts for every Unity version; the source of stripped player trees
  - title: UnityPy
    url: https://github.com/K0lb3/UnityPy
    note: typetree decoding and the TPK reader it ships (resources/lzma.tpk)
implementations:
  - name: unity-formats (typetree.rs)
    url: https://github.com/Kalmarv/unity-formats/blob/main/src/typetree.rs
  - name: unity-formats (tpk.rs)
    url: https://github.com/Kalmarv/unity-formats/blob/main/src/tpk.rs
---

An object in a [serialized file](/engines/unity/archives/serialized-files/) is a run of bytes whose layout is given by its
class's **type tree**: a list of nodes, each with a type name, a field name, a byte size (or −1 when variable), a version
and meta flags. A reader that has the tree decodes the object into named fields. A Unity **player build strips the trees**
from its files (the has-type-tree byte is 0), so a reader needs the layouts from outside; bundles keep their trees.
:observed{games="skatebird sledding peak big-walk"}

## Where the trees come from

The layout of each built-in class changes between Unity versions, so a **type tree package** (TPK) lists the class layouts
for every Unity version and a reader looks the class up by the file's version string. AssetRipper publishes one. A package
stores its tree data uncompressed or LZ4-compressed (format versions 1 and 2); LZMA- and Brotli-compressed packages have to
be re-packed before a reader that only does LZ4 can use them. :observed

| Game | Unity version | Package coverage | Confidence |
|---|---|---|---|
| SkateBIRD | 2019.4.20f1 | AssetRipper's package covers this version exactly | :observed{games="skatebird"} |
| Sledding Game | 6000.3.12f1 | AssetRipper's package has a layout for the version; UnityPy 1.25.4's bundled `lzma.tpk` has no 6000.3.12f1 entry | :observed{games="sledding"} |

### A short layout

UnityPy 1.25.4's package gives the 6000.3.11f1 `PlayerSettings` layout 936 bytes. Sledding Game's
`globalgamemanagers` `PlayerSettings` object is 940 bytes, so the layout is 4 bytes short of the data, and UnityPy's own
read check reports the mismatch. :observed{games="sledding"} PEAK's 6000.3.15f1 `PlayerSettings` is 896 bytes against a layout of 892: the same 4-byte shortfall. :observed{games="peak"} Big Walk's 6000.3.17f1 `PlayerSettings` has it too. :observed{games="big-walk"} A decoder
that requires a tree to cover an object exactly refuses that one object and decodes the rest. :observed{games="sledding peak"}

## Common strings in embedded trees

An embedded tree stores each node's type name and field name as a 32-bit offset. With the top bit clear the offset is into
the tree's own string buffer; with it set, the low 31 bits are an offset into the engine's built-in **common string table**,
a run of NUL-terminated names (`AABB`, `Array`, `m_Name`, `Vector3f`, ...) that every tree of the Unity version shares.
:sourced[UnityPy] The table grows between versions, always by appending, so an offset keeps its meaning. The type tree
package lists it per version: 2019.4 has 107 strings (1,152 bytes), 2022.3 109 (1,169 bytes), 6000.0 110 (1,188 bytes) and
6000.3 112 (1,209 bytes), the last adding `fixed_array` at offset 1,188 and `EntityId` at offset 1,200. The package AssetRipper
publishes and the one UnityPy ships give the same table for each of those versions. :observed
The embedded trees of the games use it: the 50 Sledding Game bundles (6000.3.12f1) use 52 distinct offsets, at most 1,161,
and PEAK's bundles (6000.3.15f1; the 195 serialized files up to 40 MB of its seven level bundles, and its `maps` bundle)
use 65 distinct offsets, at most 1,200 (`EntityId`, six times). Every offset resolves against the 6000.3 table, and a reader
that carries only the 6000.0 table (110 strings) cannot resolve PEAK's offset 1,200. :observed{games="sledding peak"}
Across all 466 files that store trees (PEAK's 416 level files and Sledding Game's 50) every common-string offset of every
one of the 83,867 trees resolves against the package's table for the file's Unity version, and the resulting names equal
an independent reader's, node for node. :proven{games="peak sledding"}
No loose player file of SkateBIRD (31), PEAK (13) or Sledding Game (7) stores a tree, so none uses the table.
:proven{games="skatebird sledding peak"} Reading the seven serialized files of Big Walk's `data.unity3d` up to 40 MB looks
up no common string. :observed{games="big-walk"}

## Decoding rules

Decoding walks the tree against the object's bytes. A reader that applies these rules decodes the objects of Sledding Game's
serialized files to exactly their stored sizes, except the one object whose layout is short. :observed{games="sledding"}

| Node | Bytes | Confidence |
|---|---|---|
| a primitive | by its type name (`SInt32`, `float`, `bool`, ...) | :sourced[UnityPy] |
| `string` | a 32-bit length, the UTF-8 bytes, then padding to 4 bytes | :sourced[UnityPy] |
| `TypelessData` | a 32-bit length and the bytes | :sourced[UnityPy] |
| `pair` | its two children, first then second | :sourced[UnityPy] |
| a node whose first child is `Array` | a vector: a 32-bit count, then the elements, each described by the array's second child | :sourced[UnityPy] |
| any other node | a struct: its children in order | :sourced[UnityPy] |
| a node whose meta flag has the align bit (`0x4000`) | the position is aligned to 4 bytes after the node, counted from the object's start | :sourced[UnityPy] |

An `Array` child's own flag aligns its vector. :sourced[UnityPy] A decoder can bound a vector's count by the bytes left
(a count whose elements would not fit is an error, not an allocation) because each node type has a least size.
:inferred

## Stored trees and the package's

The tree a bundled file stores for a class other than MonoBehaviour equals the type tree package's release tree for the
file's Unity version, node for node, for every such type in PEAK's level bundles and Sledding Game's Addressables bundles
(8,367 and 173 types, none differs). :proven{games="peak sledding"} A tree stored for a
MonoBehaviour is that script's own, with its fields after the base fields; the package has only the base fields.
:proven{games="peak sledding"} Decoding every object of the 466 files by its stored tree consumes exactly the object's
bytes for 136,275,632 of PEAK's 136,474,698 objects (2 have no tree: the manifest bundle's) and 1,333 of Sledding Game's
1,427. :proven{games="peak sledding"} All the others, 199,064 and 94, are MonoBehaviours with a `[SerializeReference]` field
(a managed reference node in their tree), which a decoder that has only the tree cannot read: it needs the file's reference
types. :proven{games="peak sledding"}

## What a tree does not cover

A **MonoBehaviour**'s tree covers only its base fields (`m_GameObject`, `m_Enabled`, `m_Script`, `m_Name`); the script's own
fields follow in the object, and a stripped build has no tree for them. The bytes are kept raw and decoded by a layout
measured from the data, see [script fields](/engines/unity/data-model/script-fields/). :observed

A class declared with `[SerializeReference]` needs the file's reference type trees, which a stripped build does not have.
:sourced[UnityPy]

## Field names differ by version

The same field has different names in different Unity versions, so a layout is a family of names per version, not one
set. The physic material is an example. :observed

| Field | SkateBIRD (2019.4) | Sledding Game (6000.3) |
|---|---|---|
| dynamic friction | `dynamicFriction` | `m_DynamicFriction` |
| static friction | `staticFriction` | `m_StaticFriction` |
| bounciness | `bounciness` | `m_Bounciness` |
| friction combine | `frictionCombine` | `m_FrictionCombine` |
| bounce combine | `bounceCombine` | `m_BounceCombine` |

:observed{games="skatebird sledding"} A reader strict about one family of names rejects the other game's objects.
:observed{games="skatebird sledding"}

:::open[Do the layouts hold on other minor versions]
The 6000.3 layouts here are those of 6000.3.12f1 (Sledding), 6000.3.15f1 (PEAK) and 6000.3.17f1 (Big Walk). A package entry
exists for each as far as the readers used here decode their files, but a layout change between two 6000.3 patch versions is
not excluded.
:::
