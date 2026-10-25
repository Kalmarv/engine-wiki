---
title: Frostbite in skate.
description: The containers, resource identities, rendering data and streaming rules of skate.'s Frostbite build.
games: [skate]
sources:
  - title: ReSkate
    url: https://github.com/Dingo-Shenanigans/ReSkate
  - title: ReSkate documentation
    url: https://github.com/Dingo-Shenanigans/docs
---

skate. stores its world in Frostbite superbundles: TOCs locate bundles, bundle manifests describe EBX documents,
typed resources and chunks, and CAS archives hold their compressed bytes. EBX supplies the object graph; resources
hold such data as MeshSets, textures and shader state; chunks hold bulk geometry and pixels. :observed

The scope here is the PC executable build **20260929**, with separately identified ReSkate and ReSkate Studio
versions. These rules are not established for other Frostbite games. :observed

A resource has several identities, used by different systems. A distinct manifest name or resource id does not
prevent two meshes from colliding in the renderer's 32-bit name-hash cache. Texture streaming instead deduplicates
by a 64-bit identity, and materials resolve through 64-bit keys across loaded shader depots.
:observed See [resource identity](/engines/frostbite/data-model/resource-identity/).

San Vansterdam streams a hierarchy of cells and distant vista geometry. The compiler used by community maps
produces a related hierarchy but differs in collision residency, placement representation and vista construction.
:observed See [WorldPartition](/engines/frostbite/world/world-partition/) and
[Studio compilation](/engines/frostbite/mod-loading/studio/).

Hard capacities include texture handles, spatial cull ids and ids for each class of light. ReSkate raises some
capacities and guards others; its version is therefore part of the content's runtime requirements.
:sourced[ReSkate] See [limits](/engines/frostbite/runtime/limits/) and the
[crash catalogue](/engines/frostbite/runtime/crashes/).
