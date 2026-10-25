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

The binding table grows on demand with a bounds check. The owner frees synchronously at reference count zero.
GlobalSBA's free path writes the previous free block into the freed allocation's first qword as a per-thread
LIFO link. Consequently a stale reference can appear as a plausible allocator pointer. :observed

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
