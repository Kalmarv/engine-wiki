---
title: World partitioning
description: Spatial cells, map files, scene boundaries and world-state layers across engines.
---

A world can divide its placements spatially while keeping separate rules for visibility, collision and event state.
Cell membership and active content are therefore separate questions in the systems below. Each row links to the page
that states it, with its confidence.

| Engine / game | Spatial organization | State and streaming qualifications | Detail |
|---|---|---|---|
| FromSoftware / Sekiro | Named map areas such as `m11_01` for Ashina Castle; MSB files place their resources | MSB has visibility-related arrays and independent shadow bytes; the exact visibility predicate is not established | [Areas](/engines/fromsoft/world/areas-and-tiles/), [MSB](/engines/fromsoft/world/msb/), [visibility](/engines/fromsoft/world/visibility/) |
| FromSoftware / Elden Ring | `m60` and `m61` have 256 m tiles with 512 m and 1,024 m parents | Parent layouts can own larger assets and need not contain collision; residency radii and hysteresis are not established | [Nested tile grid](/engines/fromsoft/world/areas-and-tiles/) |
| Anvil / Riders Republic | World resources reference GridLayouts and GridPartitions; occupied cells list resources through GridCellDataBlocks | USNAT's finest terrain/short-range cells are 128 m, long-range cells 512 m. DataLayers distinguish event and season states independently of grids | [Grids](/engines/anvil/world/grids/), [DataLayers](/engines/anvil/world/data-layers/) |
| RAGE / GTA V Enhanced | YMAP stores entities, parent-map linkage, streaming extents and entity extents; YTYP supplies archetypes | Story/Online mount state and script-driven groups select participating resources | [Maps and archetypes](/engines/rage/world/maps-and-archetypes/), [mount state](/engines/rage/archives/mounts/) |
| Frostbite / skate. | San Vansterdam's 9,600 m WorldPartition hierarchy has persistent, long, medium, short and detail nodes | Agent definitions and effective quality settings control simulation cells and vistas. Textures, depots and collision follow cells | [WorldPartition](/engines/frostbite/world/world-partition/) |
| ForzaTech / FH6 | Terrain uses 512 m cells; procedural placement grids use several cell sizes from 50 to 10,000 m | Placement reach can cross a cell boundary; companion streaming-assignment file contents are not established | [Cell coordinates and bounds](/engines/forzatech/world/coordinates-and-cells/), [streaming files](/engines/forzatech/archives/pgzp-minizip/) |
| Insomniac / Sunset Overdrive | One Sunset City level contains hexagonal tiles with main, ground, low, imposter, gameplay, lighting, audio and physics zone variants | Story/quest overlays occupy separate zone paths; a world-coordinate interpretation fits samples but the full hex tiling is not established | [Zones and hex tiles](/engines/insomniac/world/zone/) |
| Unity / SkateBIRD | Each playable scene is a self-contained level; Transforms link a flat object list into a hierarchy | Scenes refer to shared asset files instead of embedding their materials and textures | [Scenes](/engines/unity/data-model/scenes-and-hierarchy/), [file references](/engines/unity/archives/serialized-files/) |
| Unity / PEAK | Build 3.0.0 has 208 generated scenes in seven level bundles plus loose player scenes | Earlier 2.6.b instead ships a player-data bundle; its exact contents beside the levels are not established | [Level bundles](/engines/unity/archives/unityfs-bundles/) |
| SEGA Ninja / SA2B | A stage module can contain several landtables listing placed geometry; SET files supply stage-object placements | Stage code also draws sky and background models outside the landtable | [Landtables](/engines/ninja/geometry/landtables-and-models/), [SET placement](/engines/ninja/world/set-files/) |
| MonoGame / STUNTBOOST | Levels comprise XNB-wrapped glTF parts, with level, room and skybox roles; a JSON sidecar supplies the part count | Level and room are separate bake groups; the skybox scene supplies a cubemap. These are documented part roles, not an established streaming-cell hierarchy | [Levels and parts](/engines/monogame/world/levels/) |
| Unreal / MECCHA CHAMELEON custom maps | A content-only plugin contains one World Partition level | The map kit turns streaming off and uses stock StaticMeshActors and lights; shipped-game level internals are not described | [Custom-map level](/engines/unreal/mod-loading/custom-maps/), [asset-format scope](/engines/unreal/) |

## Membership is broader than an origin

Anvil resources can overlap cells without their origin lying inside, appear in multiple listings and occur in coarser
levels as ordinary objects. Finest cells alone do not describe every nearby resource. See [grid membership](/engines/anvil/world/grids/).
ForzaTech similarly measures objects reaching across cell edges; the model-oriented placement box provides a different
bound from the template library's box. See [object reach](/engines/forzatech/world/coordinates-and-cells/).

## Spatial state and world state

Anvil DataLayers distinguish alternative layouts on the same ground. Their action polarity is inferred from content,
and the active layer set and multiple-action combination rule are not established. RAGE's Story and Online mounts
also change which collision and placement files participate. See [DataLayers](/engines/anvil/world/data-layers/),
[mounts](/engines/rage/archives/mounts/) and [collision ownership](/engines/rage/collision/bounds/).

Frostbite's effective streaming radii can differ from the stored agent attributes under a quality tier. Visual
readiness also does not imply collision readiness after a teleport. See [effective WorldPartition settings](/engines/frostbite/world/world-partition/).

:::open[When does each partition become active?]
[Elden Ring tile residency](/engines/fromsoft/world/areas-and-tiles/), [Anvil active layers](/engines/anvil/world/data-layers/)
and [ForzaTech assignment files](/engines/forzatech/archives/pgzp-minizip/) remain unresolved in different ways; spatial
coordinates alone do not supply those missing rules.
:::
