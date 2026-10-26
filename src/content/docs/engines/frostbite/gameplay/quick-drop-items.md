---
title: Quick Drop items
description: The assets that make one placeable Quick Drop object, the superbundles they live in and how added items are registered.
games: [skate]
sources:
  - title: ReSkate
    url: https://github.com/Dingo-Shenanigans/ReSkate
    note: reskate-objects.json, the object titles and families the loader shows
---

Quick Drop objects are the rails, ledges, ramps and props a player places in the world. Each is an item: an item
asset names a runtime prefab, the prefab names its mesh and physics, and the item master collection lists the item
so the game offers it. The structure below is read from the stock item `own_bkrails_generic_flatrailroundlong_00001`
and from community packs whose added objects are clones of it, which the game loads and offers. :observed

## Parts of one item

| Part | Asset | Confidence |
|---|---|---|
| Item | DelMarBaseItemAsset, for example `items/bkrails/own_bkskate3_<name>_00001`, with Key, Name, HashedAssetKey, DisplayName, BuildKitPrefabName and BuildKitBundleName | :observed |
| Prefab | EcsRuntimePrefabAsset | :observed |
| Render mesh | RigidMeshAsset and its MeshSet, for example under `world/buildkit/quickdrop/rails/`, with MeshMaterials | :observed |
| Collision | Eight EcsPhysicsAsset slots, each naming a PhysicsResource and carrying VolumeMoments | :observed |
| Thumbnails | `thumbnail/tool`, a TextureAsset (authored at 512, cropped to 256), and `thumbnail/cdn`, a DingoCdnTexture | :observed |
| Registration | An entry in `items/itemmastercollection` | :observed |

The mesh of the stock rail item is placed in its four `flatrailroundlong` ECS bundles and in `cas_main_sharedbundle`.
An added item can keep its donor's BuildKitBundleName, so the donor's ECS bundle serves it, while its Key, Name,
HashedAssetKey, DisplayName and BuildKitPrefabName are its own. :observed

The items live in the `items` and `buildkititems` superbundles; a pack whose meshes use materials of their own also
replaces the globals shader database and streamable-texture-set lookup, as levels do with
[shader state](/engines/frostbite/shaders/shader-state/). :observed

A replaced stock Quick Drop mesh keeps its item: a pack that only swaps the MeshSets of existing objects (a
broomstick, a spider-web rail, medium stairs, a crypt pad) needs no new item assets. :observed

The game loads a Quick Drop MeshSet whose vertex buffer is 65,400 bytes, not a multiple of 16, although every
stock MeshSet pads its vertex buffer to 16 bytes. See [MeshSets](/engines/frostbite/geometry/meshsets/).
:observed

ReSkate names and groups added objects from a `reskate-objects.json` (schema 1). :sourced[ReSkate]

:::open[Which item fields does the game check when it registers an added object?]
The clones change the fields listed above and keep the rest of the donor's; which of them must be unique, and
whether the eight physics slots are all required, is not established. :unknown
:::
