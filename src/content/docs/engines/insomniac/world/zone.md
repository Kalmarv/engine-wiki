---
title: Zones and hex tiles
description: How Sunset City is cut into hexagonal zone assets, how a zone lists its placed models in section 06ABCAB2, the per-kind offset tables, and what is still undecoded.
sources:
  - title: ALERT wiki (.zone)
    url: https://github.com/Tkachov/ALERT/wiki
    note: lists the zone sections as raw u32 arrays; it has no placement decoder
---

The Sunset City open world is one level, `levels/sunset_city/sunset_city.level`, whose world is **hexagonal tiles**:
`levels/sunset_city/openarea/open_world/hex_NNN/`, each with `hex_NNN.zone` (main), `_ground`, `_low`, `_imposter` (far LOD), `_gameplay`, `_lgt` (lights), `_reflect_lgt`,
`_audio`, `prefabs/*.zone`, plus `hex_NNN.zone_static` (decals) and `*.zone_physics` (collision). Story and quest overlays are in `levels/sunset_city/overlay/...`;
`archive_input.json` lists install groups by zone. :observed Zones carry traversal metadata as strings: `Grind`, `LedgePath`, `Mountable`, `Vaultable`, `UnderGrind`,
`HorizontalPoleSwing`, `AllowHop`. :observed

A zone is a [DAT1 container](/engines/insomniac/data-model/dat1-container/). All 4,936 zones parse (all LZ4-compressed, no tail) with 263 distinct section sets; the numbers below are from
that recorded census of the PC build 3373500, no longer re-checkable. :observed

## Placed objects: section `06ABCAB2`

Section `06ABCAB2` (in 2,696 zones, 96 bytes to 3.3 MB) holds object records, each beginning with a 4 × 4 float matrix: three rows are the X, Y and Z axes with w = 0, the
fourth the translation with w = 1; the axis lengths are the per-axis scale. Then `u32 kind` and `u32 size`, then the payload. :observed

```layout
title: Zone object record (kind 0, placed model)
size: variable
games: [sunset-overdrive]
note: "Little-endian. Walk by the offset tables, not by size: decal records are 644 bytes apart with size 648; walking by size failed in 753 of 2,696 zones."
fields:
  - {at: 0, size: 64, type: "f32[16]", name: matrix, level: observed, note: "rows X, Y, Z axis (w = 0, length = scale) and translation (w = 1)"}
  - {at: 64, size: 4, type: u32, name: kind, level: observed, note: "0 = placed model"}
  - {at: 68, size: 4, type: u32, name: size, level: observed}
  - {at: 72, size: 8, type: u64, name: unique id, level: inferred, note: "id or hash"}
  - {at: 80, size: 8, type: "u32[2]", name: zero, level: unknown}
  - {at: 88, size: 4, type: u32, name: model path index, level: observed, note: "index into the string-offset table C6A5905E of model paths"}
  - {at: 92, size: 4, type: u32, name: flags, level: unknown, note: "00440000 seen"}
  - {at: 112, size: 8, type: "f32[2]", name: floats, level: unknown, note: "2.0, 8.0 (LOD or fade?)"}
  - {at: 140, size: 12, type: "f32[3]", name: floats, level: unknown, note: "1.0 × 3 (tint?)"}
  - {at: 152, size: 4, type: u32, name: word, level: unknown, note: "0x000000FF or 0x000001FF"}
```

Offsets in the layout are from the start of the record, so the model path index is at +0x58. Records longer than 176 bytes carry extra data (the `0x1FF` variant had a block with the value 0xB0 = 176, likely an offset to per-instance material overrides, not decoded). :observed

### Offset tables

The records are found through per-kind tables of `u32` offsets into the section, found by matching every `u32` of every section against matrix-headed record starts: :observed

| Table | Locates | Hits in the sample | Confidence |
|---|---|---|---|
| `6987F172` | kind 0, placed render model | 168,075 | :observed |
| `BCF43558` | kind 3, decal (material path inline at +0x48, e.g. `materials/gz_debris_papers_wide_01/...material`, then floats incl. size 25 and 15) | 8,529 | :observed |
| `927C4EC3` | kind 5, visual effect | 435 | :observed |
| `97FF6EB5` | kind 1 | 1,208 | :observed |
| `DC311FC3` | kind 6 | 239 | :observed |
| `BDAB2B0D` | kind 2 (reflect_lgt zones) | | :observed |
| `70682CB8` | 32-byte entries with the offset at +8; mixed kinds 2, 4, 0 | | :observed |

Kinds: 0 placed model, 3 decal, 5 visual effect are established; kind 2 is probably an actor (e.g. a `SoundEnvironment` in `aud_rverb_hex_111.zone`, whose matrix row lengths
4.511, 5.323, 2.084 are repeated as floats in its payload), kind 4 probably a light (304 + 108 n bytes, in `_lgt` zones), kinds 1 and 6 unknown (kind 6 in `_imposter` zones carries a texture path). :inferred

Other string-offset tables read in `hex_212.zone`: `78684035` actor paths, `DC625B3D` actor names, `3D5E2FEF` visual-effect paths, `30DADA09` soundbank and actor paths. :observed

## Census of placements

Over all 4,936 zones, 953,948 kind-0 records are listed by `6987F172` in 1,422 zones, with 0 failures: every listed offset holds kind 0 and every index is below the path-table count. :observed The test discriminates:
`hex_212` has 4,434 records but 369 paths, so a sequential counter would have failed. :observed There are 4,711 distinct model paths; 4,709 resolve to `model` assets and 2 are
`.prefab` paths (`prefabs/cameron/ml_air_conditioner_window.prefab`, `ml_traffic_stop_sign.prefab`) that are not in the archive. :observed

After removing the per-axis scale the matrix orthogonality error is p50 3e-13, p99 1.1e-6, p99.9 0.14; 7,616 records (0.8%) exceed 1e-3 (shear or a zero-scale axis; the maximum is infinity).
Scales: 584,732 unit, 118,696 uniform, 250,520 non-uniform. :observed

## Hex positions

In `hex_212` the translations cluster at x 237..338, z −210..−119, y about 0..5; the `hex_240_lgt` record sits at (88.8, 6.5, −345.5) and its light grid names `grid_X_Y_Z` span x 40..168, z −456..−328;
`hex_212_lgt` section `D6E15BC0` holds float3 points such as (296, 40, −200) in the same region. So hexes seem to use world coordinates, not a per-hex origin, with Y up. :inferred
This has not been checked by tiling hex centres over the plane or overlaying the minimap. :unknown

## Traversal data

Section `17AFFFCE` of `hex_212` (160 bytes) holds float3 points (312.8, −2.78, −209.3), ..., which may be the grind and ledge polylines. `50EDC53D` holds 16-byte records (string offset, hash, DAT1
offset into `81999057`, size) that link objects to serialized per-object component data; the `Grind`, `LedgePath` and `Mountable` strings live in the string table. :inferred

## The city plan

Placement was the open problem of the format: ALERT lists the zone sections as raw `u32` arrays and does not decode instance records. :sourced[ALERT wiki] The minimap
(`ui/textures/hud/map/minimap.texture`) is the independent top-down reference for the hex layout ([Textures](/engines/insomniac/textures/texture/)). :observed

:::open[What are the kind 1, 2, 4 and 6 records, the kind-0 extra block and the traversal sections?]
The kinds other than 0, 3 and 5 are guessed from sizes and strings; the material-override block of long kind-0 records and the link from objects to serialized components (`50EDC53D` →
`81999057`) are not decoded.
:::
