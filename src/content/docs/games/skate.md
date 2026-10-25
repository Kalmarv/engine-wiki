---
title: skate.
description: Full Circle's Frostbite game, the observed PC build, data layout and community mod-loading formats.
games: [skate]
sources:
  - title: ReSkate
    url: https://github.com/Dingo-Shenanigans/ReSkate
    note: Community loader, launcher, resource readers and runtime capacity patches.
  - title: ReSkate documentation
    url: https://github.com/Dingo-Shenanigans/docs
    note: Loader documentation and Luau plugin API.
  - title: ReSkate community packages
    url: https://thunderstore.io/c/reskate/
    note: Map, cosmetic and plugin distribution.
---

skate. is Full Circle's Frostbite skateboarding game. This reference covers **Skate.exe build 20260929**, Steam
app `3354750`, depot `3354751`, manifest `4621099302092747785`. Executable offsets on the engine pages refer
to this build; ReSkate and Studio versions are identified separately. :observed

The installed `Data` directory contains `layout.toc`, `initfs_Win32`, superbundle TOCs below `Win32`, and CAS
archives within install-chunk directories. Native DB describes the install manifest; EBX, resources and chunks
describe the loaded content. :observed See
[data folders](/engines/frostbite/archives/data-folders/), [bundles](/engines/frostbite/archives/bundles/) and
[EBX](/engines/frostbite/data-model/ebx/).

San Vansterdam uses hierarchical WorldPartition cells and vistas, per-cell texture/depot content and streamed
collision. Its render resources include MeshSets, material parameter depots and shader-state lookups that lead
to DXIL programs. :observed See [streaming](/engines/frostbite/world/world-partition/),
[MeshSets](/engines/frostbite/geometry/meshsets/) and [shader state](/engines/frostbite/shaders/shader-state/).

The game's identity constraints matter when content is combined: different mesh names can collide in a
32-bit renderer cache, while texture streaming and material registration use their own 64-bit keys.
:observed See [resource identity](/engines/frostbite/data-model/resource-identity/) and
[known crashes](/engines/frostbite/runtime/crashes/).

ReSkate loads community map/cosmetic packages, raises several runtime capacities and provides plugins from
2.1.2 prerelease. ReSkate Studio 20261012 compiles map inputs and costumes into native content, with compiler
behaviour distinct from stock-world data. :sourced[ReSkate] :observed See
[loading and profiles](/engines/frostbite/mod-loading/reskate/),
[Studio](/engines/frostbite/mod-loading/studio/), [costumes](/engines/frostbite/mod-loading/costumes/) and
[plugins](/engines/frostbite/mod-loading/plugins/).
