---
title: Known crash signatures and causes
description: Build-specific failure addresses, triggers, causal evidence and validated data corrections.
games: [skate]
---

All addresses below are RVAs in Skate.exe build 20260929. The trigger, cause and correction belong to the
described reproduction; an address alone does not establish the same cause in another artifact. :observed

## Mesh names and hashes

| Address | Trigger and cause | Correction and evidence | Confidence |
|---|---|---|---|
| `+0x3f3b73e` (in `+0x3f3b180`); related `+0x3cbbb9b` | Wrong material or out-of-range slot after teleport in Los Santos 0.3.0. A tyre mesh with one material and a terrain mesh with two share hash `0x38e09783`; the second reuses the first's owner table. | Rename paths and rewrite stored hashes so they differ. Corrected routes have zero out-of-table slots in 189,796 and 431,850 calls. Clamping the slot survives but draws the wrong material. | :observed |
| `+0x3f59860` | Null read about 0.7 s after teleport. Seam copies in different cell bundles share one MeshSet name but have two resource ids; the compartment lookup `+0x41b5800(compartment id, MeshSet name)` returns null. Skipping the element moves the fault to `+0x3fe426b`. | Distinct seam-copy names. The corrected route has zero nulls in 30,008 lookups and no crash dumps. | :observed |

These enforce separate constraints: one name to one resource and distinct stored hashes for distinct cached
meshes. See [resource identity](/engines/frostbite/data-model/resource-identity/).

## Streaming and registration

| Address or symptom | Trigger and cause | Correction and evidence | Confidence |
|---|---|---|---|
| `+0x71e2e7`, value `0xbad57411` | Roughly 60-second seam stall; workers spin at `+0x41d3a50`. Different mip chunks share one `h64`. | One mip-chunk GUID per `h64` within the level; shared pixels can share a chunk, distinct pixels need distinct identities. | :observed |
| `+0x3f3b423`, null `+0x20` | About one second after content load, a root-resident mesh has no root MeshVariationDatabase entry. | Include all root meshes, merging entries by mesh, variation and sub-variation. | :observed |
| `+0x3cbba4f`, `+0x3cbb13b` | Different blocks register under one depot key. Unregistration frees a box still held by the registry; a measured free precedes use by 609 ms. | Canonical block per key, with its bound textures available. Corrected content has 0/15 first-load failures versus 4/13 for baseline/sham content. This is lifetime evidence; the measured lock has zero contention in 531,374 reads. | :observed |
| Black surfaces, washed sky, glowing skater | Studio default flat-normal/mask textures are streamed in every cell; damage persists during the session. | One root-resident copy per default texture in the measured corrected level. | :observed |
| Load hang followed by access violation | Streamed texture handle capacity exceeded; root-resident textures consume the budget. | Stream textures and matching depots per cell, within the version's capacity; ReSkate 2.0.7 raises the pool. | :observed |
| `+0x1918602`, read `0xffffffffffffffff` | Pause-map donor swap imports the asset root instead of the coremap view-model instance. | Import the corresponding MegaPark_CoreMapViewModel instance. | :observed |

In the depot-key failure (`+0x3cbba4f` above), the faulting site varies from load to load. Over 27 recorded
access violations, 8 at six sites (`+0x27bd244`, `+0x3d9ee43`, `+0x40a149e`, `+0x4206613`, `+0x46685e5` three times, `+0x50d9f9`) dereference a
pointer of the form `0x30000001xxxxxxxx`: high tag bits over a plausible heap address. :observed That pattern fits a
tagged value written into freed memory that is still read as a pointer, so the site names whichever reader comes
next rather than the cause. :inferred

Keeping the registry's own boxes alive (pinning a key's box while it has further registrations, and releasing
finished keys only outside the registry lock) does not prevent it: with zero unbalanced releases recorded, 4 of
7 counted first loads still crash, at `+0x46685e5`, `+0x27bd244`, `+0x50d9f9` and `+0x3d9ee43`. The canonical-block
data correction is the change with a measured effect. :observed

At `+0x3cbba4f` the binding-table page index in R8 is 0 and the directory pointer read from the table is not a
valid address. RAX `0x0000ffffffffffff` at that fault is the pointer mask loaded at `+0x3cbba42`, not a stored
all-ones pointer. :observed

## Level-root EBX

| Address | Trigger and cause | Correction and evidence | Confidence |
|---|---|---|---|
| `ucrtbase!strlen` < `+0x3daa8a0` < `+0x46570bf` < `+0x46554f3` | About 3–6 s into the load of a ReSkate Studio level. The level-root DetachedSubWorldData carries an InterfaceDescriptorData DataField (Id `0x7a5f4ec0`, a CString, encoded type `0x800000e0`) whose boxed value keeps the self-relative string offset `0x5a2` of the stock `bam_levelroot` template, where it names 'Gameflow test running' after a `0x59a`-byte names list. The string itself is absent, so the offset lands 1,074–1,184 bytes past the end of the document's payload. | Give the field a string inside the document. The property copy (`+0x4657040`) places the string's pointer one page past its heap block; `strlen` faults only when that page is unmapped, when the object ends a 2-MB heap chunk, so the failure depends on layout (two of three measured launches). | :observed |

## Capacity and GPU failures

| Address or symptom | Trigger and cause | Correction | Confidence |
|---|---|---|---|
| `+0x489cfe9` | Empty cull free list, head `0xffffffff`; large object count or a spawn-creation loop can exhaust it. | Reduce simultaneous objects or use the raised cull allocation; ground the spawn when creations repeat. | :observed |
| `+0x3cbb13b`, `+0x489cfe9`; skater frozen at spawn height | The level's DefaultStartPoint has no collision under it. The game re-creates the skater about eight times a second from load to quit (over 1,200 creations per session against about 17 normally), and teleports cannot move it. Two of four measured sessions crash within three minutes: a render-handle reference count on a null pointer, or the exhausted cull free list. | Place the start point on ground that has collision. | :observed |
| `+0x4ea4094` | Light id 8,320; the 8,192-entry class table already overflowed. A ToD transition can overlap outgoing and incoming lights. | Bound simultaneous per-class lights; unload-before-load and factory guards address overlap and exhaustion. | :observed |
| `DXGI_ERROR_DEVICE_HUNG`, GBuffer breadcrumbs | All Studio vista proxies remain active; a measured 661-proxy level carries 1.94 GB of far geometry. | Remove those proxies or use a bounded hierarchical vista representation. | :observed |

## Studio private shader programs

`vertex_blend` in Studio 20261012 adds program 3619 after the stock 3,619 records. A worker boot fault at
`+0x3db8d40` occurs with older ReSkate runtimes and some replaced 2.1.0-pre release assets. An earlier 2.1.0-pre
DLL boots the same content in six of six measured launches. Release labels alone do not distinguish these
binaries. :observed

The separate `+0x3f7ceed` null read occurs about six seconds after starting a vertex-blend level: one of three
launches fails, versus zero of eight valid launches without vertex blend. The per-view preparation chain reaches
an unchecked `record+0x40` read after indexing records at stride `0x70`. :observed

A decal row pointing one past the merged program table is a candidate cause for the latter fault, not a proven
one. ReSkate 2.1.0 has registry and out-of-range-row guards, but the available reproduction is not rerun against
that final release. :inferred

:::open[Does the final 2.1.0 runtime eliminate the vertex-blend preparation fault?]
The stock-program-only merge also leaves private-program overlays invisible on measured builds that boot.
Boot success, crash prevention and visible blending remain separate outcomes. :observed
:::
