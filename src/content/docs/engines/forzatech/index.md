---
title: ForzaTech
description: Turn 10 and Playground Games' engine as Forza Horizon 6 ships it, its Tokyo track, and how world, models, materials, shaders and cars are stored.
sources:
  - title: ForzaTools (Nenkai)
    url: https://github.com/Nenkai/ForzaTools
    note: Grub bundle and PlaygroundMiniZip readers for Forza Horizon 5
  - title: ForzaTech-extraction-tools (Doliman100)
    url: https://github.com/Doliman100/ForzaTech-extraction-tools
    note: modelbin extraction and the FH5 material parameter hashes
  - title: ForzaTechStudio (D3FEKT)
    url: https://github.com/D3FEKT/ForzaTechStudio
    note: documents the platform zip methods 21 and 22
  - title: ForzaDesigner6
    url: https://github.com/tokyubevoxelverse/ForzaDesigner6
    note: livery layer semantics for Forza Horizon 6
---

ForzaTech is the engine of the Forza Motorsport and Forza Horizon games. Forza Horizon 6 (2026, Playground Games) is the only game of it
this wiki records, and its Tokyo track `Brio` the only world. :observed

Nearly everything in the world is data in a few shared containers. The track's geometry and textures are four streaming
[PGZP archives](/engines/forzatech/archives/pgzp-minizip/) that name nothing themselves; the typed container inside is the
[Grub bundle](/engines/forzatech/data-model/grub-bundle/). Models are [`.modelbin`](/engines/forzatech/geometry/modelbin/) files with FH6's own
mesh record, split into [LOD files](/engines/forzatech/geometry/lods-and-clusters/). The world is placed by rule in
[`.pgeo` files](/engines/forzatech/world/pgeo-placements/) through [template libraries](/engines/forzatech/world/plib-templates/), and by
hand in one [`.pvs` file](/engines/forzatech/world/pvs-ribbon/). :observed

Materials are a chain of parameter lists ending at a [shader family](/engines/forzatech/shaders/shaderbin/), and the compiled DXIL of the
family decides the look, which is why most of the knowledge on the shader pages was read from the shaders themselves. :observed

## How sure the pages are

The numbers on these pages come from a recorded census of the Tokyo track in a build that is no longer installed, so they cannot be
re-checked today. The counts are real measurements over every file of the stated kind, and they are marked :observed with their scope;
nothing for FH6 is marked as proven. Third-party tool knowledge (the FH5 readers) is :sourced; reasoning from the compiled shaders where no
readable value exists is :inferred. :observed

## What is known and what is not

| Area | State | Confidence |
|---|---|---|
| Archive container and file typing | complete for the GeoChunks | :observed |
| Models, placements, hand-placed instances, template libraries | every file of `GeoChunk0` read to its end; later `.plib` and `.pvs` sections not decoded | :observed |
| Materials and the major shader families | parameters and formulas read from the compiled shaders; run-time constants unknown | :observed |
| Terrain colour (far and near field), water, decals | formulas known; ring sizes, blend states and settings are in encrypted files | :observed |
| Cars, liveries, saves | formats decoded; make, year, wheel size and default colours are in the encrypted database | :observed |
| Encrypted files (database, settings, profile) | white-box AES; no key | :unknown |

The encrypted files and the values only the running game holds are on [Encrypted files](/engines/forzatech/archives/encrypted-files/) and
[Values only the running game holds](/engines/forzatech/runtime/runtime-only-values/). Games: [Forza Horizon 6](/games/fh6/).

:::open[What is in the encrypted settings archives?]
`Rendering.zip`, `Rules.zip`, `GameTunableSettings.zip`, `Camera.zip`, `RenderScenarios.zip` and `stateflow.zip` store their entries with zip
method 22 (TFIT). They hold the render, physics and gameplay settings the shaders and the game depend on.
:::
