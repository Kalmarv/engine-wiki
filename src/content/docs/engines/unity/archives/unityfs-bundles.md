---
title: UnityFS bundles
description: "The UnityFS archive format (header, compressed block table, directory), and which games use it for AssetBundles, Addressables or the whole player."
games: [big-walk, peak, sledding, skatebird]
sources:
  - title: UnityPy (BundleFile.py)
    url: https://github.com/K0lb3/UnityPy
    note: reader and writer of the UnityFS header, flags, block table and directory
  - title: AssetRipper
    url: https://github.com/AssetRipper/AssetRipper
    note: documents the archive flags and their version-dependent meaning
implementations:
  - name: unity-formats (bundle.rs)
    url: https://github.com/Kalmarv/unity-formats/blob/main/src/bundle.rs
---

A **UnityFS** file is Unity's archive: a header, a compressed table of blocks and files, and the files' bytes in
compressed blocks. AssetBundles and Addressables content are UnityFS files, and so is a player's `data.unity3d` when a
build packs its data into one archive. Four ways occur among the games here. :observed

| Game | What is in UnityFS | Where | Confidence |
|---|---|---|---|
| SkateBIRD | nothing: no bundle, no Addressables, loose [serialized files](/engines/unity/archives/serialized-files/) only | `SkateBIRD_Data` | :observed{games="skatebird"} |
| Sledding Game | Addressables content (localization tables, one asset group, a scripts group); the scenes are loose files | `Sledding Game_Data/StreamingAssets/aa/` | :observed{games="sledding"} |
| PEAK 3.0.0 | 208 level scenes in seven AssetBundles; the rest is loose files | `PEAK_Data/StreamingAssets/maps/` | :observed{games="peak"} |
| PEAK 2.6.b | the player itself in one `data.unity3d` | `PEAK_Data/` | :observed{games="peak"} |
| Big Walk | the player itself in one `data.unity3d`; no Addressables | `Big Walk_Data/` | :observed{games="big-walk"} |

## Header

Every number in the header and the block table is big-endian. :proven{games="big-walk peak sledding"}

```layout
title: UnityFS header
size: variable
games: [big-walk, peak, sledding]
note: "Big-endian. After the header the reader aligns to 16 bytes when the format version is 7 or later."
fields:
  - {at: 0, size: 8, type: "char[]", name: signature, value: "UnityFS\\0", level: proven}
  - {at: 8, size: 4, type: u32, name: format version, value: "8", level: proven, note: "6 and 7 are also documented by UnityPy"}
  - {at: 12, size: "string", type: "char[]", name: player version, level: proven, note: "NUL-terminated; `5.x.x` in every bundle measured"}
  - {at: "after the player version", size: "string", type: "char[]", name: engine version, level: proven, note: "NUL-terminated; the Unity version of the build (`6000.3.17f1` in Big Walk's bundle)"}
  - {at: "after the engine version", size: 8, type: u64, name: bundle size, level: proven, note: "equals the file's length"}
  - {at: "+8", size: 4, type: u32, name: compressed block-table size, level: proven}
  - {at: "+12", size: 4, type: u32, name: uncompressed block-table size, level: proven}
  - {at: "+16", size: 4, type: u32, name: flags, level: proven, note: "0x243 in every bundle measured"}
```

The flags, as UnityPy documents them for the Unity versions that matter here: the low six bits name the compression of
the block table (0 none, 1 LZMA, 2 LZ4, 3 LZ4HC, 4 LZHAM); `0x40` says the directory is stored with the block table;
`0x80` puts the block table at the end of the file instead of after the header; `0x200` pads to 16 bytes before the
data. :sourced[UnityPy] `0x243` is LZ4HC with the directory combined and the data padded.
All 59 bundles of the three games carry exactly `0x243`: PEAK's seven level bundles and its `maps` manifest bundle, Sledding
Game's 50 Addressables bundles and Big Walk's `data.unity3d`. None sets `0x80`, none compresses its block table another way
than LZ4HC (the other compression ids, LZMA and LZHAM, do not occur), each states a size equal to its file's length, and each
has format version 8 and player version `5.x.x`. :proven{games="big-walk peak sledding"}

## Block table and directory

The block table is decompressed first. It holds the data's blocks and then the files in them. :sourced[UnityPy]

```layout
title: Block table (after decompression)
size: variable
games: [big-walk, peak, sledding]
note: Big-endian.
fields:
  - {at: 0, size: 16, type: "u8[16]", name: hash, level: unknown, note: "UnityPy reads and ignores it"}
  - {at: 16, size: 4, type: i32, name: block count, level: proven}
  - {at: 20, size: "10 per block", type: "block[]", name: blocks, level: proven, note: "u32 uncompressed size, u32 compressed size, u16 flags (low six bits: the block's compression)"}
  - {at: "after the blocks", size: 4, type: i32, name: file count, level: proven}
  - {at: "after the count", size: "variable", type: "file[]", name: files, level: proven, note: "i64 offset, i64 size, u32 flags, NUL-terminated path; offsets are into the decompressed data"}
```

The block table of every bundle measured is consumed exactly (no bytes left over), and its blocks decompress to as many
bytes as the files' sizes add up to. :proven[Big Walk's bundle, PEAK's eight bundles, Sledding's 50]{games="big-walk peak sledding"} The block sizes add up to the
end of the last file, and the file's length is the start of the data plus the blocks' compressed sizes, in all 59.
:proven{games="big-walk peak sledding"}

| Property | Value | Confidence |
|---|---|---|
| Block uncompressed size | at most 131,072 bytes (128 KiB) | :proven{games="big-walk peak sledding"} |
| Block compression | LZ4HC (flag `0x3`), or stored (flag `0x0`) | :proven{games="big-walk peak sledding"} |
| Blocks by compression | LZ4HC 328,093 and stored 13,934: PEAK 283,256 and 13,475, Sledding Game 1,698 and none, Big Walk 43,139 and 459 | :proven{games="big-walk peak sledding"} |
| Node flags 4 | a serialized file (PEAK 417, Sledding Game 50, Big Walk 12) | :proven{games="big-walk peak sledding"} |
| Node flags 0 | a stream file (`.resS`, `.resource`) (PEAK 24, Sledding Game 16, Big Walk 7) | :proven{games="big-walk peak sledding"} |

A block is an LZ4 block of plain literal runs and matches. A reader decompresses blocks in order and concatenates them,
so the file at an offset is found by walking the cumulative uncompressed sizes. :sourced[UnityPy] Two block readers written
from this description, one of them reading only the blocks a byte range needs, give the same SHA-256 for each of the 526
nodes of the 59 bundles (PEAK's 441, Sledding Game's 66, Big Walk's 19: 38.9 GB, 0.2 GB and 5.7 GB of decompressed bytes).
:proven{games="big-walk peak sledding"}

## Nodes and the files they point at

A node's path is the file's name inside the bundle. PEAK's level bundles name them `BuildPlayer-Level_<N>` (a scene),
`BuildPlayer-Level_<N>.sharedAssets` and, for 24 of them, `BuildPlayer-Level_<N>.resource` (a stream); its manifest bundle
`maps` and Sledding Game's Addressables bundles name a serialized file `CAB-<32 hex digits>` and a stream
`CAB-<32 hex digits>.resS`; Big Walk's bundle names the player's own files (`level2`, `sharedassets1.assets`,
`Resources/unity_builtin_extra`). :proven{games="peak sledding big-walk"} Node paths are unique within a bundle, and every
node lies inside the blocks' decompressed bytes. :proven{games="peak sledding big-walk"}

A serialized file in a bundle points at other files by their external paths
([SerializedFile externals](/engines/unity/archives/serialized-files/#references-between-objects)). Three forms occur:

| External path | Names | Where it occurs |
|---|---|---|
| `archive:/<root>/<node>` | the node `<node>`, in this bundle or another; `<root>` is the first node's path of the bundle that holds it, without its extension (`CAB-…` names are whole) | 1,392 externals of PEAK's and Sledding Game's serialized files: 1,311 name a node of their own bundle (PEAK), 81 a node of another bundle (Sledding Game); every one names a node of the installed bundles |
| `Library/unity default resources`, `Resources/unity_builtin_extra` | the engine's built-in resources, which are not nodes of PEAK's bundles | 416 and 208 externals of PEAK's files (every level file names the first, every shared-assets file the second; the files are the loose `PEAK_Data/Resources/unity default resources` and `unity_builtin_extra`); 11 and 5 of Big Walk's, whose bundle holds `Resources/unity_builtin_extra` as a node |
| `globalgamemanagers.assets`, `resources.assets`, `sharedassets<N>.assets` | the player's files by their plain names | 35 externals of Big Walk's twelve files, each naming a node of the same bundle |

:proven{games="peak sledding big-walk"}

PEAK shares assets across levels inside a bundle: every level bundle has one `sharedAssets` file of about a gigabyte
(1.04 to 1.11 GB) that 63 of the bundle's 64 serialized files point at (31 of 32 in the last bundle), and several smaller
shared-asset files that other levels point at. A level therefore needs, beside its own scene and shared assets, the shared
assets of other levels. :proven{games="peak"} Sledding Game's 50 bundles point at one another the same way: its 81
`archive:/` externals all name nodes of other bundles. :proven{games="sledding"}

A streamed resource (`StreamingInfo`: path, offset, size) in a bundled file names a stream node of the same bundle by the
last segment of its path; all 317 of Sledding Game's, 206,661,032 bytes in all, lie inside the stream node they name.
:proven{games="sledding"} No decoded object of PEAK's level files carries a `StreamingInfo`; the 24 `.resource` nodes are
named by fields of another shape. :proven{games="peak"}

## Type trees in bundles

A serialized file inside an AssetBundle or Addressables bundle **stores its type trees** (the has-type-tree byte is 1),
unlike the player's own loose files, which strip them: 466 of the 479 serialized files in the bundles of the three games
do (all 416 PEAK level files, which hold 83,643 types, and all 50 of Sledding Game's, 224 types), and each stores a tree
for every one of its types. :proven{games="peak sledding"} The 13 that store none are PEAK's `maps` manifest bundle and
the 12 files of Big Walk's `data.unity3d`, the player's own, which are stripped like loose player files.
:proven{games="peak big-walk"} A stored tree is read without an outside
[type tree package](/engines/unity/data-model/type-trees/) except for the engine's common strings, whose table the
package supplies per Unity version. :proven{games="peak sledding"}

Trees are stored per type, not per object: the 83,643 types of PEAK's 416 level files hold 586 different trees, 60 of them
for the 60 classes other than MonoBehaviour (a class has the same tree in every file) and 526 for MonoBehaviour (one per
script, so a file has one MonoBehaviour type per script it uses). :proven{games="peak"} Sledding Game's 224 types hold 17
different trees, 6 of them MonoBehaviour's. :proven{games="sledding"} A MonoBehaviour's tree holds the script's own fields
after the base fields, which a stripped player file does not.
:proven{games="peak sledding"}

The stored trees of the classes other than MonoBehaviour equal the type tree package's trees for the file's Unity version,
node for node (type, name, byte size, version, meta flags): all 8,367 such types of PEAK's level files and all 173 of Sledding
Game's. :proven{games="peak sledding"} The layout of a stored tree is in the
[SerializedFile type entry](/engines/unity/archives/serialized-files/#type-entry-with-a-stored-tree).

## Sledding Game's Addressables

Sledding Game's `StreamingAssets/aa/` is an Addressables 2.9.1 content folder: `catalog.bin` (146,902 bytes, a binary
content catalog), `catalog.hash`, `settings.json` and 50 bundles under `StandaloneWindows64/`. :observed{games="sledding"}
The 50 bundles are one `defaultlocalgroup_assets_all_*.bundle` (1,457,997 bytes; a 124,588-byte serialized file and a
22,369,728-byte stream), one `*_monoscripts_*.bundle` (2,051 bytes) and the Localization package's bundles: 16
`localization-string-tables-*`, 16 `localization-asset-tables-*`, 15 `localization-assets-*` (one of them `shared`) and
`localization-locales`. :observed{games="sledding"} Their serialized files are version 22,
Unity `6000.3.12f1`, with type trees. :observed{games="sledding"} The mountain scene is not among them; it is the loose
`level1`. :observed{games="sledding"}

## PEAK

PEAK 3.0.0 (Unity `6000.3.15f1`) ships its game levels as **seven AssetBundles** named `levels0-31`, `levels32-63`,
`levels64-95`, `levels96-127`, `levels128-159`, `levels160-191` and `levels192-207` (each `.assetbundle`, with a
`.manifest` text file beside it), plus a bundle `maps` that holds the `AssetBundleManifest`. :observed{games="peak"} They
hold 208 generated scenes, `Assets/8_SCENES/Generated/Level_0.unity` to `Level_207.unity` (32 per bundle, 16 in the
last), by the manifests' asset lists. :observed{games="peak"} The `maps` manifest lists no dependencies between the seven
bundles, and no file of one bundle points at a node of another. :proven{games="peak"}

A level bundle is 2.18 GB (1.41 GB for the last) and holds, per level, two serialized files, `BuildPlayer-Level_N` (the
scene) and `BuildPlayer-Level_N.sharedAssets` (the assets only that level uses), and some levels' `.resource` streams
(the first bundle: 68 files, 64 serialized and 4 streams). :observed{games="peak"} All 416 serialized files (208 scenes
and 208 shared-asset files) are version 22, Unity `6000.3.15f1`, with type trees. :proven{games="peak"} The scene files
are 111,465,236 to 180,596,228 bytes; the shared-asset files 303,653 bytes to 1.04 GB (`Level_22`).
:proven{games="peak"}

The player's loose files (`level0` to `level4`, `sharedassets0` to `sharedassets4`) hold the menus and the island scene
(`Airport`, `MainMenu`, `Pretitle`, `Title`, `WilIsland` in the build settings). :observed{games="peak"}

Build 2.6.b instead shipped `PEAK_Data/data.unity3d`, a 1,504,357,874-byte bundle read offline. :observed{games="peak"}
The community extractor AssetStudio does not open it: its decompression cache is written beside the input bundle, and a
copy then stops in the shader parser with `EndOfStreamException` errors. :observed{games="peak"}

:::open[Why PEAK changed from one data bundle to loose files plus level bundles]
The 2.6.b layout is known from a reconnaissance of that build; the 3.0.0 install has loose files and the level bundles
and no `data.unity3d`. What 2.6.b's `data.unity3d` held beside the same levels is not established.
:::

:::open[Which shader AssetStudio cannot parse]
The `EndOfStreamException` in AssetStudio's shader parser on PEAK 2.6.b is observed; which shader object or layout it
fails on is not established.
:::

## Big Walk's `data.unity3d`

Big Walk's single bundle is 2,451,391,952 bytes with 43,598 blocks (43,139 LZ4HC, 459 stored) that decompress to
5,714,422,612 bytes in 19 files. :proven{games="big-walk"} The files are the player's data folder:
`globalgamemanagers`, `Resources/unity_builtin_extra`, `globalgamemanagers.assets`, `sharedassets0` to `sharedassets3`
(`.assets` with `.resS` streams), `level0` to `level3` (`level2.resS` too), `resources.assets` and
`resources.assets.resS`. :proven{games="big-walk"} The twelve serialized files are all
[version 22](/engines/unity/archives/serialized-files/) containers of Unity `6000.3.17f1`, each with a stated size equal
to its directory entry. :proven{games="big-walk"} The largest member is `sharedassets1.assets.resS`
(4,162,131,536 bytes). :proven{games="big-walk"}

The scene files are `level0` (platform init), `level1` (menus), `level2` (the whole world, 91,750,964 bytes) and `level3`
(sky). :inferred Beside the bundle, `Big Walk_Data` holds `il2cpp_data/Metadata/global-metadata.dat`, `boot.config`,
`app.info` and three `sharedassets*.resource` audio streams. :observed{games="big-walk"}
