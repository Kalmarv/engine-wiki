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
| Cull ids per spatial queue | 40,000, allocated once | 262,144 in 2.1.0 | :sourced[ReSkate] |
| Light ids per class | 8,192 in each of six classes | Guard refuses new light entities near capacity | :observed |
| Physics geometries/bodies | 5,000 / 8,200 | 40,000 / 65,000 from 1.1.7 | :sourced[ReSkate] |
| Render-resource ids | 8,192 | 65,536 from 1.1.7 | :sourced[ReSkate] |
| Entity slots | Not established here | 262,144 in 2.0.7; an older 524,288 log label is stale | :sourced[ReSkate] |
| Renderer descriptor heap | 131,072 per frame | Raised by 2.1.0 | :sourced[ReSkate] |
| Mesh streaming pool | 532,960 KB | Version-dependent sizing | :sourced[ReSkate] |
| Spatial root | ±10,000 m (`Core.WorldSize`) | Landings checked at x +8,000 and z −8,000 m | :observed |

The texture handle index has fifteen bits. The 32,764 allocation remains below the 32,767 numerical ceiling;
raising texture resolution and raising handle count are different operations. No 256-pixel texture-side limit
is established for skate. :observed

On a measured Studio-level load under the stock handle limit, roughly 10,400 handles remain for map textures,
or around 9,000 with the inspected cosmetic mods. ReSkate's texture-use counter is a session high-water mark,
so it cannot measure current live residency after unloading a map. :observed

## Cull-id free list

The queue owner stores a free-list array at `+0x80` and a `u32` head at `+0xc0`. Empty head is `0xffffffff`.
The executable has three identified pop paths; the failing pop at `Skate+0x489cfe9` indexes with the sentinel
instead of rejecting exhaustion. A successful wild read can be followed by corrupt writes before any fault.
:observed

One spatial/render object holds its id at `+0x3c`. Grouped instances are counted by member mesh, not instance.
Repeated skater creation due to missing spawn ground can exhaust ids independently of the map's steady count.
:observed

## Light tables

The six managers are OldPoint, OldSpot, PbrSphere, PbrSpot, PbrTube and PbrRectangular. Each has four selector
tables sharing its class allocator. Each selector has 64 page pointers, with 128 eight-byte entries per page.
The insert uses `page=id>>7`, `entry=id&127` without a capacity check. :observed

```layout
title: Light selector table known fields
size: 592
note: Runtime memory; offsets are relative to one selector table.
fields:
  - {at: 0, size: 512, type: "pointer[64]", name: page pointers, level: observed}
  - {at: 512, size: 8, type: pointer, name: snapshot pointer, level: observed}
  - {at: 520, size: 72, type: bytes, name: unknown, level: unknown}
```

Ids 8,192–8,319 can overwrite through the snapshot pointer before id 8,320 faults at `Skate+0x4ea4094`.
Refusing a light in its per-kind entity factory avoids later unchecked renderer setters; returning handle zero
after insertion has failed does not. :observed

Allocator records are `0x60` bytes. For id `i`, page is `bsr(i+16)-4`, and index is
`(i+16)-2^bsr(i+16)`. Live count is issued count at allocator `+0xf0` minus free-list length. :observed

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

The owner and its payload are freed synchronously the moment the reference count reaches zero. About 680
open-coded call sites decrement and free in place (251 through `+0x3cba570`, 419 through the value-box thunk
`+0x3cba640`, others through `+0x3cba7a0` and `+0x3cb4d00`), with no lock and no deferred phase. :observed

GlobalSBA's free path (`+0x15a5c20`) writes the previous free block into the freed allocation's first qword as a
per-thread LIFO link. Consequently a stale reference can appear as a plausible allocator pointer: a block whose
first qword points at another free block of the same size has itself been freed. :observed

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

GPU-hang reports include an RC2 breadcrumb tree, DRED, camera and memory information. They are plain protobuf
files under the user's EA persistence directory and are also emitted through OutputDebugString. Code resides
in executable `.xtls`/`.tls$` sections as well as ordinary PE structures, so scanning only `.text` misses relevant
functions. :observed

Loose `config/Game.cfg` is read at startup. The settings catalogue can expose values that exist but have no
visible effect: PerfOverlay enable/FPS settings read back as one without drawing in this build. :observed
