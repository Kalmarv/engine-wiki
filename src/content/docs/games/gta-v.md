---
title: Grand Theft Auto V Enhanced
description: The PC Enhanced edition's RAGE data, archive locations and edition-specific resource layouts.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: Community archive/resource reader and world viewer; some Gen9 exports convert data to Legacy forms.
  - title: Sollumz
    url: https://github.com/Sollumz/Sollumz
    note: Blender tooling for GTA V assets.
  - title: OpenIV
    url: https://openiv.com/
    note: Community GTA archive tooling; edition compatibility needs checking for the intended operation.
---

Grand Theft Auto V Enhanced is the PC Enhanced edition of GTA V, using Rockstar's RAGE engine.
:sourced[CodeWalker] The observations in this section concern a Steam PC Enhanced install inspected in October 2026;
the exact executable build number is not established by the retained format evidence. :unknown

## Data in the install

| Location relative to the game folder | Content | Confidence |
|---|---|---|
| `common.rpf`, `x64*.rpf` | Base archives, including nested archives | :observed |
| `update/update.rpf` | Title-update data and DLC patches | :observed |
| `update/update2.rpf` | Additional update data, including the inspected compiled shader database | :observed |
| `update/x64/dlcpacks/` | DLC-pack archives and their nested content | :observed |

The [RPF7 archive](/engines/rage/archives/rpf7/) carries directory, binary and resource entries. The
[mount rules](/engines/rage/archives/mounts/) select active replacements and distinguish Story from Online; reading
all copies at once does not reproduce either state. :observed

The retained [archive census](/engines/rage/archives/install-census/) contains 5,407 archive paths and 393,673 file
entries, counting nested archives and overridden copies. Those units are distinct from active world placements.
:proven[complete archive-listing recount]

## Enhanced-specific data

[RSC7](/engines/rage/data-model/rsc7/) remains the resource envelope, while Enhanced drawables use version 159,
fragments 171, texture dictionaries 5 and clip dictionaries 46. Other layout versions can coexist in physical
archives, so the edition name does not replace version inspection. :observed

[Enhanced drawables](/engines/rage/geometry/drawables/) have 52-slot declarations, and
[textures](/engines/rage/textures/ytd/) use SGA buffer-format codes. Some community exports rename material parameters,
reorder vertices and convert texture formats to Legacy representations. :sourced[CodeWalker]

[SGD2](/engines/rage/shaders/sgd2/) stores compiled DXIL programs with bindings, effect techniques and state tables.
[Materials](/engines/rage/materials/enhanced-parameters/) refer to effects and parameters by hash. :observed

## World and characters

[Maps and archetypes](/engines/rage/world/maps-and-archetypes/) describe authored placements and asset identities.
[World LOD and priority](/engines/rage/world/lod-and-priority/) add distance hierarchy and optional detail, while
[collision](/engines/rage/collision/bounds/) has its own bounds and map-state ownership. :observed

[Ped components](/engines/rage/geometry/skeletons-and-peds/) and
[animation dictionaries](/engines/rage/animation/ycd/) link through skeleton bone tags. The recounted animation
corpus contains 25,961 unique archived dictionary paths and 267,536 animations. :observed

Water uses [quad configuration](/engines/rage/water/quad-data/); local lights have authored
[records and hour masks](/engines/rage/lighting/lights/). :observed

:::open[Which exact executable build does the corpus represent?]
The edition, platform and inspection period are known, but a versioned executable identity is needed before these
observations can be assigned to a precise patch. :unknown
:::
