---
title: Costume packages and registration
description: Native costume assets, build stamps, bundle registration, render skeleton and mesh constraints.
games: [skate]
sources:
  - title: ReSkate resource and mod loading code
    url: https://github.com/Dingo-Shenanigans/ReSkate
implementations:
  - name: primase worlds/reskate (costume)
    url: https://github.com/Kalmarv/primase/tree/main/worlds/reskate/src/costume
---

A native costume combines item/collection EBX assets, a morph preset, a skinned MeshAsset, a MeshSet resource,
textures and material depot content. Registration makes these resources selectable as an item rather than
merely present in a bundle. :observed

| Package member | Role | Confidence |
|---|---|---|
| `manifest.json`, `icon.png` | Package metadata and icon | :observed |
| `layout.toc`, `Win32/items.toc` | Install manifest and item superbundle index | :observed |
| `Win32/configurations/layout/initialinstallpackage/cas_01.cas` | Encoded asset bytes in measured packages | :observed |
| `reskate-build.json` | Build metadata | :observed |
| `.reskate-studio-patch` | Game executable SHA-256 stamp | :observed |

ReSkate rejects game-data packages lacking the Studio game-version stamp. The stamp identifies the executable,
not the ReSkate version. :sourced[ReSkate]

Costume EBX types include DelMarBaseItemAsset, DelMarItemCollectionAsset, DingoMorphPreset and SkinnedMeshAsset.
The customization bundle-reference table is
`characters/customization/configs/cas_main_bundlereftable`; observed presets have both full-path and leaf rows
hashed with FNV-1a-64 over lowercase paths. Item collection patches include `items/itemmastercollection` and
seasonal ownable-item collections. :observed

## Skeleton and geometry

Costume meshes use the stock 386-bone `animbase_default_renderskeleton`. Section palettes map vertex indices to
that skeleton; the mesh does not supply an independent character skeleton. Measured costume import supports
up to six LODs and eight bone influences per vertex, with byte weights summing to 255. :observed

The MeshSet still follows the [LOD pointer and section layouts](/engines/frostbite/geometry/meshsets/).
Morph chunks are mesh-specific; reusing another mesh's morph bytes is not an established valid combination.
:observed

## Compiler routes

`cosmetic-mesh-import` produces measured custom-mesh `.fbmod` content, including six LOD chunks and two morphs
for the inspected donor route. The `native-costume-build` portable modes fault in the inspected compiler;
nonportable custom-geometry modes require no private textures in the input package. :observed

An FBMOD is an intermediate container, distinct from the deployed folder's native TOCs/CAS. Successful FBMOD
creation alone does not establish successful native registry compilation or correct in-game costume display.
:observed

:::open[Which native-costume compiler routes work across Studio versions?]
Available reports include both a failed direct FBMOD-to-Mods route and a working compile-mod/deploy-mod route.
They do not establish matching inputs and compiler versions, so neither is a universal restriction. :unknown
:::
