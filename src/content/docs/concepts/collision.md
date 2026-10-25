---
title: Collision
description: Collision meshes, primitive shapes, acceleration structures and surface assignments across engines.
---

Collision data can have different geometry, materials and streaming ownership from the visible surface. A decoded
mesh also leaves separate questions about contact filtering and surface behavior. Each row links to the page that
states it, with its confidence.

| Engine / game | Geometry and container | Surfaces and limits | Detail |
|---|---|---|---|
| FromSoftware / Sekiro | Havok 2016.2 tagfiles, compressed meshes and object-local primitive/convex bodies | `fsnp` tables associate shape keys with HitMtrlParam ids; unkeyed triangle rows leave some assignments ambiguous | [Havok](/engines/fromsoft/collision/havok/), [materials and bodies](/engines/fromsoft/collision/materials-and-bodies/) |
| FromSoftware / Elden Ring | Havok 2018.1 tagfiles with compressed meshes, including transformed extern shapes referenced by custom primitives | The `0x52` custom payload has no established geometry interpretation; hit-class numbering differs from Sekiro | [Havok](/engines/fromsoft/collision/havok/), [surface classes](/engines/fromsoft/collision/materials-and-bodies/) |
| Anvil / Riders Republic | MeshShape stores float positions, indexed triangles, adjacency and a quantized acceleration tree; sphere, capsule, box and compound resources provide alternatives | One material can cover the shape, or one byte per face indexes CollisionMaterial references. Compound scale application is not established | [MeshShape](/engines/anvil/collision/mesh-shape/), [primitives](/engines/anvil/collision/primitive-shapes/) |
| RAGE / GTA V Enhanced | `phBound` trees in YBN, drawables and fragments; primitive, quantized geometry and composite forms | Polygon bytes index material records; ordered `materials.dat` entries name material types. Complete BVH and flag semantics are not established | [Bounds](/engines/rage/collision/bounds/) |
| Frostbite / skate. | Stock physics streams with world cells; a StaticModelGroup can share one PhysicsAsset | Cooked PhysicsResource shapes, contact materials and grind-edge analysis lack a byte-complete established layout | [Physics and grinds](/engines/frostbite/collision/physics-and-grinds/) |
| Insomniac / Sunset Overdrive | `.zone_physics` embeds Havok 2013.2.0-r1 version-11 packfiles in DAT1; compressed mesh, static compound and convex classes occur | Packfile tables and class names are read, but compressed-mesh shape fields and per-triangle surface ids are not established | [Havok packfiles](/engines/insomniac/collision/havok-hknp/) |
| Unity / SkateBIRD, Sledding Game and PEAK | GameObject collider components store box, sphere, capsule, mesh or terrain shapes under PhysX | PhysicMaterial supplies friction, bounce and combine modes. Trigger and active/enabled state are separate from stored shape | [Colliders and materials](/engines/unity/collision/colliders/) |
| SEGA Ninja / SA2B | Landtables contain separate invisible Solid COL meshes, mostly Basic attaches; visible meshes never carry Solid in the measured disc | Invisible barriers and some walkable surfaces have no corresponding landtable render geometry | [COL geometry](/engines/ninja/geometry/landtables-and-models/) |
| ForzaTech / FH6 | GeoChunk companion type codes identify `.phys` and Havok `.hkx` entries | Their presence is listed; a collision shape layout is not established on the archive page | [Resource types](/engines/forzatech/archives/pgzp-minizip/) |
| MonoGame / STUNTBOOST | Each shipped level part has derived collision in XNB: solid/trigger triangles, lookup grids and a grind-ledge graph | Solid triangles store grippable-edge bits and ramp ids; triggers omit those fields. `C_` material names describe collision behavior separately from visual materials | [Collision models and ledges](/engines/monogame/collision/collision-model/) |
| Unreal / MECCHA CHAMELEON custom maps | The documented import route recognizes `UBX_`, `UCP_`, `USP_` and `UCX_` mesh prefixes for box, capsule, sphere and convex collision | The map kit uses the `CameraBlockWall` profile and enables UV lookup from hit results. A cooked collision byte layout is not established | [Custom-map collision](/engines/unreal/mod-loading/custom-maps/), [asset-format scope](/engines/unreal/) |

## Havok generations share names, not established offsets

FromSoftware's tagfiles carry their types inline or reference a shared compendium. Sunset Overdrive instead uses
binary packfiles with an empty `__types__` section. Its `hknpCompressedMeshShape` name does not establish the field
offsets of the later FromSoftware SDKs. See [tagfile types](/engines/fromsoft/collision/havok/) and
[Sunset packfiles](/engines/insomniac/collision/havok-hknp/).

FromSoftware's decoded compressed meshes use section-local 11/11/10-bit and shared 21/21/22-bit vertices. Sunset's
similar compressed-tree interpretation remains inferred rather than a decoded shape layout. Both scopes remain
visible on the [FromSoftware](/engines/fromsoft/collision/havok/) and [Insomniac](/engines/insomniac/collision/havok-hknp/)
pages.

## Coordinates and activation

RAGE static map YBN vertices are world-space, while embedded bounds inherit an asset transform. Story/Online ownership
still controls which intersecting bounds are active. FromSoftware MSB occurrences can share a collision file but carry
different hit filters or event conditions. See [RAGE bounds](/engines/rage/collision/bounds/) and
[FromSoftware collision parts](/engines/fromsoft/collision/materials-and-bodies/).

Unity sphere and capsule scaling preserves round cross-sections under non-uniform scale; a box instead uses its world
matrix. Anvil's compound shapes store child transforms and a separately named Scales array whose runtime application
is unresolved. See [Unity transforms](/engines/unity/collision/colliders/) and
[Anvil compounds](/engines/anvil/collision/primitive-shapes/).

STUNTBOOST stores a grind-ledge graph with corner links and edge/rail types. Frostbite's documented Studio grind
curves instead become invisible eight-sided collision prisms; those are geometry rather than runtime grind splines.
See [ledge records](/engines/monogame/collision/collision-model/) and [grind geometry](/engines/frostbite/collision/physics-and-grinds/).

:::open[Which surface does a contact actually use?]
FromSoftware's unkeyed `fsnp` rows can leave competing material assignments. Sunset's per-triangle surface ids and
Frostbite's cooked contact-material layout are not established. These are distinct unresolved links between shape and
behavior: [FromSoftware materials](/engines/fromsoft/collision/materials-and-bodies/),
[Sunset surfaces](/engines/insomniac/collision/havok-hknp/) and [Frostbite physics](/engines/frostbite/collision/physics-and-grinds/).
:::
