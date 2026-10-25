---
title: Havok collision (zone_physics)
description: The Havok hknp packfiles that hold Sunset Overdrive's collision, their header variant, section layout, and a census of the shape classes; the shape data itself is not decoded.
sources:
  - title: ALERT (Tkachov)
    url: https://github.com/Tkachov/ALERT
    note: treats the zone_physics section as raw u32 values
  - title: Smithbox / DSMapStudio (HKLib)
    url: https://github.com/vawser/Smithbox
    note: hknpCompressedMeshShape decoders for FromSoftware's Havok versions; the likely reference for the Sunset layout
---

Collision is a Havok binary packfile in each `.zone_physics` asset, section `9629C287` of its [DAT1](/engines/insomniac/data-model/dat1-container/). Of the 1,112
`zone_physics` assets, all LZ4-compressed, 898 have exactly that one section; 214 have no section and are empty 83-byte DAT1 placeholders. :observed
The numbers are from a recorded census of the PC build 3373500; the install is no longer available. :observed

## Packfile

All 898 packfiles share one header variant: Havok **2013.2.0-r1**, file version 11, layout bytes `08 01 00 01` (8-byte pointers, little endian, no padding reuse, empty
base class optimisation), and three sections `__classnames__`, `__types__` and `__data__`, with the contents in section 2 at offset 0 and flags 0. :observed
`__types__` is empty, so no reflection data ships and class layouts must come from elsewhere. :observed

```layout
title: Packfile section header (version 11)
size: 64
games: [sunset-overdrive]
note: "Fixup tables are padded with 0xFF to 16 bytes, so a table of 12-byte entries need not be a multiple of 12."
fields:
  - {at: 0, size: 19, type: "char[19]", name: tag, level: observed, note: "__classnames__, __types__ or __data__"}
  - {at: 19, size: 1, type: u8, name: marker, value: "0xFF", level: observed}
  - {at: 20, size: 4, type: u32, name: absolute data start, level: observed}
  - {at: 24, size: 4, type: u32, name: local fixups, level: observed, note: "offset relative to the data start"}
  - {at: 28, size: 4, type: u32, name: global fixups, level: observed}
  - {at: 32, size: 4, type: u32, name: virtual fixups, level: observed}
  - {at: 36, size: 4, type: u32, name: exports, level: observed}
  - {at: 40, size: 4, type: u32, name: imports, level: observed}
  - {at: 44, size: 4, type: u32, name: end, level: observed}
  - {at: 48, size: 16, type: "u8[16]", name: padding, value: "0xFF", level: observed}
```

Class-name entries are `u32 signature, byte 0x09, NUL-terminated name`. A parser walks every table of all 898 files without error and every virtual fixup resolves to a class-name entry. :observed

## Shape census

Each virtual fixup is one object instance. Over the 898 files: :observed

| Class | Instances | Files |
|---|---|---|
| `hkRefCountedProperties` | 109,106 | 898 |
| `hknpShapeMassProperties` | 109,106 | 898 |
| `hknpCompressedMeshShape` | 107,622 | 896 |
| `hknpStaticCompoundShape` | 1,757 | 898 |
| `hknpConvexPolytopeShape` | 1,484 | 286 |
| `hkRootLevelContainer` | 898 | 898 |
| `hknpPhysicsSceneData` | 898 | 898 |
| `hknpPhysicsSystemData` | 898 | 898 |
| `hknpCapsuleShape` | 39 | 10 |
| `hknpSphereShape` | 5 | 5 |

This is Havok's "new physics" (**hknp**, 2013+), not hkp: there is no `hkpRigidBody`, `hkpBvCompressedMeshShape`, `hkpMoppBvTreeShape` or `hkpExtendedMeshShape` at all.
:observed 109,106 equals 107,622 + 1,484 exactly, so the compressed-mesh and convex-polytope shapes are the ones with mass properties (the attachment itself is inferred).
:observed The compressed mesh is about 98% of shape instances. :observed In `hex_212` the six files (main 713,663 B / 1.95 MB packfile, `_ground`, `_low`, `_gameplay`, two elevated-train
prefabs) hold 725 compressed meshes, 13 convex polytopes and 10 static compounds. :observed

## Structure

Each file probably nests as: `hkRootLevelContainer` → `hknpPhysicsSceneData` → `hknpPhysicsSystemData` (bodies with transforms and shape references) → `hknpStaticCompoundShape`
(instances: a transform and a child shape) → many `hknpCompressedMeshShape`, so a shape's world transform would come from its body and its compound instance. :inferred
The compressed mesh data is probably an `hkcdStaticMeshTree` with sections, codec parameters (offset and scale), quantised packed vertices (u32, 11/11/10 bits), shared vertices (u64,
21/21/22 bits over the tree box) and primitives (four u8 indices, quad or triangle) with per-primitive material data, as the same class is decoded in the Havok versions of the
FromSoftware games; Havok 2013 field offsets may differ from those. :inferred Every `hkArray` data pointer is a local fixup, which lets array starts and counts be found by inspection.
:inferred Per-triangle surface ids may map to Insomniac's own surface types; none has been seen. :unknown

:::open[How is an hknpCompressedMeshShape laid out in Havok 2013.2.0-r1?]
The packfile layer reads completely, but the shape data inside `hknpCompressedMeshShape` is not decoded; with `__types__` empty its field offsets have to be found by inspection.
:::

:::open[Do the shapes carry per-triangle surface ids?]
Whether the compressed mesh holds material ids that map to skatable surfaces is unknown.
:::
