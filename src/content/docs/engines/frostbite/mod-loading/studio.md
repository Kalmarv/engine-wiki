---
title: ReSkate Studio compilation
description: Map inputs, generated bundles, compiler-specific representation and known content traps.
games: [skate]
sources:
  - title: ReSkate documentation
    url: https://github.com/Dingo-Shenanigans/docs
---

ReSkate Studio's `compile-map` consumes `map.json` and geometry in GLB files, producing Frostbite level content.
The measured compiler versions are the older 2026-10-06 build and **20261012**; their texture placement differs.
:observed

## Generated world and residency

Studio automatically streams render cells when a map spans more than 600 m or contains more than three million
triangles; `--stream` and `--no-stream` override that decision. Its cells are at most 200 m wide, and geometry
crossing cell lines is cut. A measured 703-object input becomes 23,419 pieces. :observed

The older compiler places all textures and one depot in the resident root: one measured map has 3,786 root
textures and none in its 149 cell bundles. Studio 20261012 writes per-cell depots, with no own root depot when
all its materials belong to cells. :observed

Each compile numbers texture names independently and generates new GUIDs. Two independent compiles can therefore
reuse names for different partitions or assign different identities to semantically equal data. :observed

The generated world root is 9.6 km. Studio copies a 38-bundle BAM environment closure, including San Van's sky,
sun, fog, exposure, 23 reflection probes and 787 reflection volumes at stock coordinates. It copies BAM agent
definitions and places content in referenced LayerData using content bounds rather than directly in quadrant
Objects with exact quadrant bounds. :observed

## Geometry and input semantics

Studio 20261012 can merge render pieces with identical twelve-number transforms into one prototype named after
one input. It emits ObjectReferenceObjectData and a blueprint per placement, rather than StaticModelGroups.
Every root-resident mesh needs a root MeshVariationDatabase entry; water section meshes are root-resident.
:observed

The GLB importer reads POSITION, NORMAL, TEXCOORD_0/1 and `_RESKATE_BLEND`, derives tangents from UVs and ignores
glTF TANGENT and COLOR_0. Ordinary generated vertices use Float3 position, Half2 UV0 and packed tangent space.
Input materials cannot directly select an arbitrary stock material key. :observed

LOD options include `--no-lods`, `--lod-ratios`, `--lod-distances` and `--lod-min-triangles`. In the measured
Numbani map, 299 of 552 MeshSets have three LODs under defaults. There is no corresponding map.json input for
supplying a source game's separate low/medium models as authored LODs. :observed

## Material traps

`vertex_blend: true` on decal materials uses scalar `_RESKATE_BLEND` values and writes Half4 UV0 with weight
in z. Studio patches a decal program to multiply opacity by that weight, appends a private program, and lifts
decal layers by `0.008 * (i+1)` metres. The resulting shader-state database has 3,620 records versus stock 3,619.
:observed

ReSkate's stock-program-only merge can remove that private program. Measured outcomes include boot faults,
invisible overlays on builds that boot, and a separate unresolved preparation fault. See the
[crash catalogue](/engines/frostbite/runtime/crashes/).

In SkateBIRD level12, alpha-blend materials compile to rows 1444/3612 and disappear as world geometry, while
alpha-tested materials using 825/1891/3096 render. This observation does not establish that every stock blend
program is unusable. :observed

Default flat-normal and mask textures repeated across streamed cells cause a session-persistent glow failure.
Their working residency is one root copy. Splitting transparent layers at cell boundaries also changes their
bounds, which can change [overlay draw order](/engines/frostbite/effects/decals-and-order/). :observed

## Other compiler boundaries

| Feature | Measured behaviour | Confidence |
|---|---|---|
| Travel points | At most 25 per compile | :observed |
| Pause map | `--pause-map 2d` uses `ui/map_image.png`, bounds in `map_image.json`, and `map_clouds.png` | :observed |
| `initfs_win32` | Output copy equals stock `Data/initfs_Win32`; inspected ReSkate versions do not read the mod copy | :observed |
| GI-grid bake | Hard-disabled in 20261012, independently of `--no-gi` | :observed |
| Enlighten bake | `--enlighten` can emit a real database | :observed |
| Custom colour shaders | Cosmetic-only function of UV, base colour, clock and four channels; no world-position, normal or vertex-offset input | :observed |

The emission path and GI limits are detailed under [lighting](/engines/frostbite/lighting/lighting-and-time-of-day/);
collision grouping has separate [thresholds](/engines/frostbite/collision/physics-and-grinds/).

Measured compiler memory grows at about 0.263 GB per million compiled triangles: 54.1 million uses 14.1 GB,
and 73.0 million uses 19.2 GB. These are observations of that input family, not a hard triangle-format limit.
One measured tile spends about half its 142-second compile in packaging. :observed

Two compiles of one export differ in 201,352 of 506,104 manifest rows because identities are regenerated.
Raw binary differences between such compiles therefore do not independently demonstrate changed source content.
:observed
