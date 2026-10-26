---
title: WorldPartition, cells and vistas
description: San Vansterdam's streaming hierarchy, static groups, distant geometry and pause-map references.
games: [skate]
---

San Vansterdam's WorldPartition is a 9,600-metre hierarchy of quadrant subworlds. Agent definitions control which
simulation cells and vistas are active around the player; the level's quadrant data supplies radii when
`WorldPartition.StreamingRadius*` is `-1`. :observed

| Node kind | Count | Nominal cell width | Confidence |
|---|---|---|---|
| Root and persistent | 2 | Whole level | :observed |
| Long | 42 | 200 m | :observed |
| Medium | 136 | 100 m | :observed |
| Short | 459 | 50 m | :observed |
| Detail | 414 | 50 m | :observed |
| Total | 1,053 | Mixed hierarchy | :observed |

The eight measured agent definitions are `fullagent`, `minimalagent`, `novistas`, `onlyvistas`, `nullagent`,
`infinitevistas`, `marketingagent` and `infinitelong`. Stored fullagent simulation radii are 210/105/60/30 m for
long/medium/short/detail. A live Ultra configuration instead reads 230/130/80/60 m: the tier overrides attributes
through `WorldPartition.AgentFloatAttributeNN` paths. Stored data and effective settings are distinct. :observed

San Van's level, counted as unique manifest rows, has 1,838 bundles, 113,435 EBX documents and 62,149 resources,
among them 9,974 Textures, 9,588 MeshSets, 10,107 PhysicsResources and 1,271 ShaderBlockDepots. :observed

Stock textures and depots follow cells: a San Van measurement finds depots in 983 of 1,052 non-root cell entries,
covering 26,132 texture entries. Collision also streams, so a visually present destination can still lack
collision during a teleport. :observed

## StaticModelGroups

Measured cell sublevels use one `StaticModelGroupEntityData`, with a 176-byte group, 224-byte members and
64-byte transforms. A member names one distinct MeshAsset; measured maxima are 512 members and 2,798 instances.
One PhysicsAsset can serve the group at `<cell>_sublevel/staticmodelgroup.physics`, while render-only groups and
members are valid. :observed

A StaticModelGroup consumes at most one spatial cull id per member mesh, rather than one per instance. Instance
buffer population does not allocate from the cull-id pool. :observed

## Placements

An `ObjectReferenceObjectData` places a blueprint with `BlueprintTransform {right, up, forward, trans}`, applied
as a row vector: `world = x*right + y*up + z*forward + trans`. The blueprint import leads to an ObjectBlueprint
whose `StaticModelEntityData.Mesh` imports a RigidMeshAsset; the RigidMeshAsset's name equals its MeshSet's name.
:observed

## Vistas

Vistas represent distant geometry; the fullagent long-vista radius is 10,000 m and vista meshes draw their last
LOD. Stock `DingoVistaLodGroup` has Lod1 at 10,000 m and zero screen-area cull threshold. A measured whole-city
vista has about 915,000 triangles. :observed

The stock hierarchy has vista data in 35 of 42 long and 119 of 136 medium cells, about 127 MB in total.
Studio-created meshes instead use `WorldObject_MediumVista_2Lod`, with Lod1 90 m, Lod2 1,000 m,
CullScreenArea `0.005` and WpsDistance `4`, including its vista proxies. :observed

WorldPartition masks the vista corresponding to each loaded HD cell using `1 << AlternateObjectLayer`. The
resolve's mask call is slot `+0x80` of the WorldPartition system vtable at `Skate+0x65f03d0`, and it writes
`+0x5e`/`+0x60` of the cell's top vista entity. An in-game intervention across three positions observes 33 masks;
clearing them restores distant slabs above the detailed scene. A far mesh spanning several cells can remain visible over another loaded cell. :observed

Studio's one-proxy-per-200-m-cell construction can make every proxy resident under the inherited agent rules.
A 661-proxy city example occupies 1.94 GB and hangs in G-buffer/decal GPU work. This is distinct from the stock
hierarchical vista arrangement. :observed

## Pause map and loading screen

A community level's 2D pause-map assets use `ui/reskate/<level>/map/*` and `ui/reskate/coremap/*` in
`bam_coregameassets`. The ECS core prefab imports a `MegaPark_CoreMapViewModel` **instance**. Importing the
asset root instead faults at `Skate+0x1918602`. :observed

The coremap framing value is a boxed Vec3: `(centre_x, H * 1.1 / (2 * 0.043661), centre_z)`, where `H` is map
height. :observed

A community level's loading screen lives in globals bundle
`win32/ui/foundations/loading/loadscreen/loadscreen_megapark_widget_bundle` as
`ui/reskate/<level>/loadscreen/img_loadscreen` (a RimeTextureAsset), the TextureAssets `img_loadscreen_2560_1440`
and `img_loadscreen_1280_720` (format `0x3d`, BC3, one mip) and `loadscreen_widget`; `win32/default_settings`
carries the patched `dingoloadscreen_configuration` (RimeLoadScreenConfig). A level without its own picture shows
a pink and black checkerboard. :observed
