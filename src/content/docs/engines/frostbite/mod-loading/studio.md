---
title: ReSkate Studio compilation
description: Map inputs, generated bundles, compiler-specific representation and known content traps.
games: [skate]
sources:
  - title: ReSkate documentation
    url: https://github.com/Dingo-Shenanigans/docs
  - title: ReSkate Map Creator
    url: https://github.com/jonigiuro/ReSkate-Map-Creator
    note: "A third-party map editor whose Blender export (scripts/export_blend.py) writes Studio's Blender input; its stated authoring conventions"
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

### Blender authoring conventions

Studio also takes maps authored in Blender through its add-on. A third-party editor that writes such files states
the conventions below in its exporter's source; they are its author's statements, not measurements on the game.
:sourced[ReSkate Map Creator]

| Input | Stated convention | Confidence |
|---|---|---|
| Collections | `Map`, `Markers`, `Grind curves`, `NPC routes`, `Lights` | :sourced[ReSkate Map Creator] |
| Per-object properties | `sk8_collision_mode` and `sk8_hide_from_pause_map` on meshes; curves flagged `sk8_grind_curve` with a radius and a surface | :sourced[ReSkate Map Creator] |
| Spawn | One empty named `spawn` with the property `xl_marker = "spawn"`; the skater faces the empty's local −Z | :sourced[ReSkate Map Creator] |
| Travel points | Empties whose names start with `TravelPoint` | :sourced[ReSkate Map Creator] |
| Lights | A seven-bit `sk8_light_tod` mask: morning 1, noon 2, afternoon 4, evening 8, night 16, weatherday 32, weathernight 64 | :sourced[ReSkate Map Creator] |
| UVs | The game reads the mesh's first UV layer | :sourced[ReSkate Map Creator] |
| Rotation | Rotation belongs on the mesh objects; a rotation on a parent empty is applied about a different axis in the game (yaw becomes pitch or roll) | :sourced[ReSkate Map Creator] |
| Height | The exporter lifts every position by 200 m, stating that the game collides badly with a map at the world origin | :sourced[ReSkate Map Creator] |

How Studio turns grind curves into collision is under
[physics and grinds](/engines/frostbite/collision/physics-and-grinds/).

:::open[Does collision misbehave for a map at the world origin?]
The 200 m lift rests only on the editor author's statement; no measurement of collision near the origin is
recorded. :unknown
:::

## Material traps

`vertex_blend: true` on decal materials uses scalar `_RESKATE_BLEND` values and writes Half4 UV0 with weight
in z. Studio patches a decal program to multiply opacity by that weight and appends a private program. The
resulting shader-state database has 3,620 records versus stock 3,619. :observed

Studio's executable describes lifting decal layers by `0.008 * (i+1)` metres. :observed A census of compiled
map.json levels instead finds decal positions stored verbatim as float32, with no lift, bias or order added; the
8-mm lift appears only in Studio's Blender importer, for Mix-node decal layers. :observed

:::open[Does compile-map lift decal layers for map.json input?]
The lift is described from the executable's strings, while compiled map.json output shows none. Whether the lift
applies only to Blender-imported layers, or only with `vertex_blend`, is not established. :unknown
:::

`domain=decal` and any `alpha=blend` material compile to row 1444/3612, and `alpha=mask` to the cutout row
825/1891/3096; Studio's opaque row is (682, 819, 1474, 2756), whose depth and shadow copy section carries the
prepass 3560 and shadow program 1262. The stock properties of these programs are listed under
[decals](/engines/frostbite/effects/decals-and-order/#stock-program-properties). :observed

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
