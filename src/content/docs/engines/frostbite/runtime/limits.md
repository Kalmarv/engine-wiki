---
title: Runtime capacities and allocator layouts
description: Stock and ReSkate capacities, spatial and light allocators, memory pools and diagnostics.
games: [skate]
sources:
  - title: ReSkate runtime and capacity patches
    url: https://github.com/Dingo-Shenanigans/ReSkate
---

The capacities below apply to Skate.exe build 20260929. ReSkate changes selected allocations and guards;
content counts alone do not describe pressure when stock resident content and outgoing layers still occupy
the same pool. :observed

| Pool or extent | Stock | ReSkate behaviour | Confidence |
|---|---|---|---|
| Streamed texture handles | 20,480 | 32,764 from 2.0.7 | :observed |
| Cull ids per spatial queue (`SpatialQueryManager.InitialCullIdListSize`) | 40,000, allocated once and never grown | 262,144 in 2.1.0 | :sourced[ReSkate] |
| Light ids per class | 8,192 in each of six classes | Guard refuses new light entities near capacity | :observed |
| Physics geometries/bodies | 5,000 / 8,200 | 40,000 / 65,000 from 1.1.7 | :sourced[ReSkate] |
| Render-resource ids | 8,192 | 65,536 from 1.1.7 | :sourced[ReSkate] |
| Entity slots | Not established here | 262,144 in 2.0.7; an older 524,288 log label is stale | :sourced[ReSkate] |
| Renderer descriptor heap | 131,072 per frame | Raised by 2.1.0 | :sourced[ReSkate] |
| Mesh streaming pool | 532,960 KB | Version-dependent sizing | :sourced[ReSkate] |
| Spatial root | ±10,000 m (`Core.WorldSize`) | Landings checked at x +8,000 and z −8,000 m | :observed |

The stock handle count is an immediate, `mov r12d,0x5000` at `Skate+0x3e72bd6`; exceeding it logs
"Exceeded max streaming texture handle count". :observed

The texture handle index has fifteen bits. The 32,764 allocation remains below the 32,767 numerical ceiling;
raising texture resolution and raising handle count are different operations. No 256-pixel texture-side limit
is established for skate. :observed

On a measured Studio-level load under the stock handle limit, roughly 10,400 handles remain for map textures,
or around 9,000 with the inspected cosmetic mods. ReSkate's texture-use counter is a session high-water mark,
so it cannot measure current live residency after unloading a map. :observed

## Cull-id free list

One pool owner exists per level or world context; its constructor is `Skate+0x489b9a0`. The owner holds
`0x800` records of `0x90` bytes at `+0x70`, a free list of `u32` next links at `+0x80` and a `u32` head at `+0xc0`.
Empty head is `0xffffffff`. :observed

Exactly three functions pop the list (`+0x489cf90`, `+0x489db30`, `+0x489d400`): they are every read of a head
at displacement `0xc0` in the module. The failing pop at `Skate+0x489cfe9` indexes with the sentinel, reading
`[array+0x3fffffffc]`, instead of rejecting exhaustion. If that read succeeds, the pop writes `-1` to wild
addresses and hands out garbage ids, so corruption can precede any fault. :observed

The game's `GameView.cfg` sets 80,000, but it is read only in GameView mode; ordinary play keeps 40,000.
:observed

One spatial/render object holds its id at `+0x3c`. Grouped instances are counted by member mesh, not instance.
Repeated skater creation due to missing spawn ground can exhaust ids independently of the map's steady count.
:observed

## Light tables

The six managers are OldPoint, OldSpot, PbrSphere, PbrSpot, PbrTube and PbrRectangular. Each has four selector
tables sharing its class allocator. Each selector has 64 page pointers, with 128 eight-byte entries per page.
The insert uses `page=id>>7`, `entry=id&127` without a capacity check. :observed

The static constructor `Skate+0x4eab1a0` builds the managers and stores each one's name at manager `+0x410`;
the dispatcher `+0x4ec5ee0` switches on light descriptor `+8`. :observed

| Descriptor type | Manager | Offset in the owner | Creator | Entity factory | Confidence |
|---|---|---|---|---|---|
| 0 | OldPoint | `+0x60` | `+0x4f1b560` | `+0x52d3f50` | :observed |
| 1 | OldSpot | `+0x570` | `+0x4f1b600` | `+0x52d4480` | :observed |
| 2 | PbrSphere | `+0xa80` | `+0x4f1b740` | `+0x52d0e00` | :observed |
| 3 | PbrSpot | `+0xf90` | `+0x4f1b7e0` | `+0x52d1740` | :observed |
| 4 | PbrTube | `+0x14a0` | `+0x4f1b880` | `+0x52d1d40` | :observed |
| 5 | PbrRectangular | `+0x19b0` | `+0x4f1b6a0` | `+0x52d2680` | :observed |

A selector table is built by `+0x304a490`; `+0x304c2d0` always allocates exactly 64 pages of `0x400` bytes.
The class allocator `+0x3e844f0` pops its free list at `+0xe8` or atomically increments the issue counter at
`+0xf0`; the four selectors of a class share it. The insert is `+0x4ea3ff0`. :observed

```layout
title: Light selector table known fields
size: 592
note: Runtime memory; offsets are relative to one selector table.
fields:
  - {at: 0, size: 512, type: "pointer[64]", name: page pointers, level: observed}
  - {at: 512, size: 8, type: pointer, name: snapshot pointer, level: observed}
  - {at: 520, size: 72, type: bytes, name: unknown, level: unknown}
```

Ids 8,192–8,319 can overwrite through the snapshot pointer before id 8,320 faults at `Skate+0x4ea4094`
(unwind `+0x4ea4094` < `+0x4f1b844` < `+0x4ec5fbd` < `+0x1959d92` < `+0x5304a7a`).
Refusing a light in its per-kind entity factory avoids later unchecked renderer setters; returning handle zero
after insertion has failed does not. :observed

Allocator records are `0x60` bytes. For id `i`, page is `bsr(i+16)-4`, its pointer at allocator `+8+8*page`,
and index is `(i+16)-2^bsr(i+16)`; the record lookup is `Skate+0x604af0`. The next free id is at `+0x50`. Live
count is issued count at allocator `+0xf0` minus free-list length. :observed

A light's creation information carries no owner that would attribute it to a layer: `+0x140` is the per-light
transform, `+0x158` the creation batch, and `+0x10`/`+0x90` are pooled. :observed

## ParamDb lifetime

```layout
title: ParamDb owner known fields
size: 112
note: Runtime memory; remaining ranges are not interpreted here.
fields:
  - {at: 0, size: 8, type: u64, name: reference count region, level: observed}
  - {at: 8, size: 8, type: pointer, name: allocator, level: observed}
  - {at: 24, size: 8, type: pointer, name: binding table, level: observed}
  - {at: 72, size: 4, type: u32, name: type region, level: observed}
  - {at: 78, size: 2, type: u16, name: member count, level: observed}
  - {at: 88, size: variable, type: pointers, name: payload pointers, level: observed}
```

The owner's 40-byte payload block begins with the word `(8 << 48) | owner`. :observed

The binding table at owner `+0x18` reaches its records through a page-pointer directory. The 64-bit word at
table `+8` packs the directory pointer in its low 48 bits, the directory length in the next 15 bits and a growth
lock in the top bit. `+0x3cbb6c0` grows the directory on demand, checking the page index against the packed
length at `+0x3cbb6ef`. :inferred

Page `j` holds `2^(j+1)` records of `0x30` bytes, so record `n` lives in page `floor(log2(n+2)) - 1` at index
`n + 2 - 2^(j+1)`; callers derive `n` from per-owner 32-bit counters. These pages grow without a fixed capacity,
unlike the 64 × 128 light tables. :inferred

`+0x3cb5a30` creates an owner through the constructor `+0x3cb5dc0`, which always makes a new owner rather
than reusing one. :observed

The owner and its payload are freed synchronously the moment the reference count reaches zero. About 680
open-coded call sites decrement and free in place (251 through `+0x3cba570`, 419 through the value-box thunk
`+0x3cba640`, others through `+0x3cba7a0` and `+0x3cb4d00`), with no lock and no deferred phase. :observed

GlobalSBA's free path (`+0x15a5c20`) writes the previous free block into the freed allocation's first qword as a
per-thread LIFO link. Consequently a stale reference can appear as a plausible allocator pointer: a block whose
first qword points at another free block of the same size has itself been freed. :observed

### ParamDb queue phases

Each ParamDb manager has a job queue. `+0x3cbcfe0` reserves it, enqueuing a marker only when the queue is
empty; `+0x3cbea30` releases and drains it; the enqueue `+0x18b6180` returns true only for an empty queue.
:observed

| Job descriptor | Job | Function | Confidence |
|---|---|---|---|
| `+0x7181208` | Walker | `+0x3cbcd30` | :observed |
| `+0x7181280` | Batch walk | `+0x3cbabd0` | :observed |
| `+0x7181230` | Destroy | `+0x3cb37a0` | :observed |
| `+0x7181258` | Marker | Not named | :observed |

The walker holds no references to the owners it visits, and the creator `+0x3cb9d00` publishes an owner before
taking references to it; both are safe only inside a queue phase. :observed The scoped arenas `+0x4898f70`,
`+0x4899ae0` and `+0x48994c0` are per-call scratch. Old binding-table page directories retire through a
four-slot epoch ring at `+0x771f470`, drained by `+0x3f7bf10`. :observed

## Depot key registry

Loaded ShaderBlockDepots register each material key in a hash table of ParamDb value boxes. The depot holds the
bucket array pointer at `+0x1d0` and the bucket count at `+0x1d8`; `buckets[count]` is a sentinel. The insert
helper `+0xfa55d0`, called at `+0x46a00b4`, returns the node, its bucket, and an inserted flag at result `+16`.
:observed

```layout
title: Depot key registry node
size: 32
note: Runtime memory.
fields:
  - {at: 0, size: 8, type: u64, name: material key, level: observed}
  - {at: 8, size: 8, type: pointer, name: value box handle, level: observed, note: "Points at the box's 64-bit reference count"}
  - {at: 16, size: 4, type: u32, name: registration count, level: observed}
  - {at: 20, size: 4, type: bytes, name: unknown, level: unknown}
  - {at: 24, size: 8, type: pointer, name: next node, level: observed}
```

The handle points at the reference count, eight bytes into the box; the release thunk `+0x3cba640` subtracts
eight and continues at `+0x3cba7a0`. During one measured load of a level whose depots register different blocks
under one key, a key was registered twice with a box other than the node's. :observed

## General free dispatch

`+0x1581010` frees with an explicit arena, pointer and size; `+0x157dae0` frees by pointer alone. Its type-7 case
(jump table at `+0x15812a4`) calls `+0x159c970`, which resolves the actual arena and re-enters `+0x1581010` with
the same pointer and size at `+0x159c9ab`. A hook on that function therefore records two frees for one logical
free; the nested one is not a second allocation. :observed

The arena object at `+0x7319ad0` is GlobalSBA, initialised by `+0x1599220`. :observed

## GPU and settings diagnostics

The DX12 backend is linked into Skate.exe; D3D12CreateDevice is imported through `sl.interposer.dll`, and the
game loads the Agility runtime from `x64/D3D12Core.dll`. Missing that runtime produces error `0x887e0003`.
:observed

GPU-hang reports include an RC2 breadcrumb tree, the game's own DRED dump, camera and memory information. They
are plain protobuf files named `eadp.errorsdata.<UTC>_gpu.st.dat` in `eadp-sdk/persistence/PROD` of the game's
Electronic Arts application-data folder, and the same text is emitted through OutputDebugString. In eight of nine
recorded hangs the breadcrumb sits in `GBuffer_HighEnd > mainGBufferEs`. Code resides
in executable `.xtls`/`.tls$` sections as well as ordinary PE structures, so scanning only `.text` misses relevant
functions. :observed

Loose `config/Game.cfg` is read at startup; a line `applySettings [=[ Name value ]=]` appended to it sets an
engine setting for the run. The settings catalogue (6,602 settings) can expose values that exist but have no
visible effect: PerfOverlay enable/FPS settings read back as one without drawing in this build, and
`FovMultiplier` changes nothing in the frame. `Mesh.ForceLod 1` or `2` does force mesh LODs. :observed

An unfocused game window presents at about 23 frames per second wherever the camera is, so frame-rate
measurements need a focused window. :observed

## Settings values

Live values read at the main menu at the Ultra quality tier:

| Setting | Value | Confidence |
|---|---|---|
| `WorldPartition.AgentFloatAttribute00`–`03` (fullagent long/medium/short/detail simulation radius) | 230 / 130 / 80 / 60 m | :observed |
| `WorldPartition.AgentFloatAttribute04`, `05` (long/medium vista radius) | 10,000 / 10,000 m | :observed |
| `WorldRender.DetailCullDistance`, `MediumCullDistance`, `LongCullDistance`, `ExtraLongCullDistance` | 60 / 130 / 230 / 400 m | :observed |
| `WorldRender.CullScreenAreaScale` | 1.75 | :observed |
| `WorldRender.ShadowmapViewDistance` | 250 | :observed |
| `Render.ViewDistance` | 20,000 | :observed |
| `Mesh.GlobalLodScale`, `Mesh.ForceLod`, `Mesh.RuntimeLodQualityLevel` | 1, −1, 3; no `LodScale` setting exists | :observed |
| `MeshStreaming.PoolMaxAllocCount`, `MaxPendingLoadCount` | 2,048, 4 | :observed |
| `MeshStreaming.ReservedPositionedInstanceCount` | 50,000; a written 200,000 is applied | :observed |
| `MeshStreaming.ReservedDistancedInstanceCount` | 128 | :observed |
| `GpuRp.MaxVisibleMeshlets` | 1,048,576 | :observed |
| `TextureStreaming.PoolSize` | 1,441,040 | :observed |

Placed-object cull defaults are Near 70 m, Far 200 m, FarSp 350 m and AreaFactor 0.038; values written to them
take effect and survive a level load. :observed `MeshStreamingSettings` also carries debug switches
(`DumpInstanceList`, `TraceMeshInstanceCounts`, `DumpPoolAllocations`) and `Sweepable*` pool settings, whose
effect is not measured. :observed
