---
title: Saves, tunes and the thumbnail cache
description: Where Forza Horizon 6 keeps the player's saved designs, tunes and profile, which containers are plain and which protected, and the layout of a saved tune.
---

The player's data is split between a protected local profile, a cloud save and a set of plain **game-save containers** that the platform's
save service keeps on disk. The platform adds no encryption and no per-account key to them: the blobs are the game's own bytes.
:observed

Counts come from a recorded census of one player's save folder (242 containers); the install and save are no longer available. :observed

## Profile and cloud save

The local profile lives in `%LOCALAPPDATA%\ForzaHorizon6\LocalStorage_Shared\User_<id>\` as `<xuid>ProfileBackup` (2.2 MB) and
`<xuid>Meta`, plus `CmsCache\**`, all in the [TFIT envelope](/engines/forzatech/archives/encrypted-files/) (16 bytes + u32 + 16 bytes + k ×
528-byte chunks, content at 7.9999 bits per byte): the same envelope as `gamedbRC.slt`, `media\sfsdata` and `NerdData.json`. :observed The
master copy is a PlayFab cloud save (strings `PlayFabGameSaves/*`, `ForzaProfileBackupRestoreOffered`); liveries and tunes are
user-generated content (`LiveryUGCSaveState`, `TuningUGCSaveState`); there is no Steam Cloud folder. :observed

## Game-save containers

`<drive>:\XboxGames\GameSave\pgs\u_<xuid>_<suffix>\current\ContainersRoot\<ContainerName>\<blob files>`: one directory per container, one
file per blob; beside `current` the folder holds a numbered snapshot and JSON manifests. :observed

| Container | Count | Blobs | Holds | Confidence |
|---|---|---|---|---|
| `Livery_<carId>_<yyyyMMddHHmmss>` | 69 | `C_livery`, `header`, `bigThumb.webp` | a design ([Liveries](/engines/forzatech/gameplay/liveries/)); zlib at offset 8 | :observed |
| `LayerGroup_0000_<time>` | 7 | `C_group`, `header`, `thumb.webp` | a saved vinyl group | :observed |
| `BaseLivery_<carId>_m0_<time>` | 4 | `C_livery`, `header` | | :observed |
| `Tuning_<carId>_<time>` | 140 | `Data` (598 bytes), `header`, `Thumb.png` | a saved tune; plaintext | :observed |
| `InputTranslationManager_<hex>` | 1 | `Profiles` (text) | controller mappings | :observed |
| `User_*`, `PropPrefab_*`, `CustomFlyer_*`, `CustomRoute_*`, `Estate_*`, `SoulBoundLivery_*`, `SaveVersion` | | | protected (TFIT blobs); `User_*` holds the garage | :observed |

The car id in a container name is the carbin car id, zero-padded to 4 digits; the time is when the container was written (a downloaded
design keeps its author's own save time in its header). :observed

## Saved tune

`Data` is 598 bytes in all 140 containers, little-endian: :observed

```layout
title: Tuning Data
size: 598
games: [fh6]
fields:
  - {at: 0, size: 2, type: u16, name: version, level: observed, note: "3 (4 containers) or 259 = 0x103 (136)"}
  - {at: 2, size: 4, type: u32, name: car id, level: observed}
  - {at: 6, size: 8, type: "u32[2]", name: ones, value: "1, 1", level: observed, note: "constant in all 140"}
  - {at: 14, size: 400, type: "i32[100]", name: part, level: observed, note: "index = part enum, value = part id, −1 = no part in that slot"}
  - {at: 414, size: 184, type: "f32[46]", name: value, level: unknown, note: "tuning values: slider positions, gear ratios ending in −1 for absent gears; not decoded"}
```

`part[e]` for every upgrade group *e* of the car's carbin is the part id fitted in that group; CarBody is always one of the listed bodies
(30 of 30 tunes of cars with a CarBody group). Of the other 414 such slots, 398 hold an upgrade the group offers with the parent key of the
tune's own body ([Cars](/engines/forzatech/gameplay/carbin/)), and 16 hold ids only instance part ids name. The remaining slots hold ids of
non-visual upgrades: slots 0 to 11, 34 to 41 and 45 to 48 ids of the car itself, 42 (2 tunes) ids of other cars, 12 to 29 ids of an engine
(e.g. 2154xxx, 4008xxx) and 30 to 33 of a drivetrain (3942xxx); slots 43 and 49 hold small ids (371, 680, 706, 13616, 99103 ...; equal in
121 of 140) that are not part ids of the car: 43 is the WheelStyle part enum, i.e. an aftermarket wheel, and which wheel archive an id names
is not in the car files. :observed The executable's upgrade-list strings (`List_UpgradeEngine`, `List_UpgradeDrivetrain`,
`List_UpgradeCarBody`, ..., `WheelStyleRear`) follow the same order as the part enums at 2, 4, 9, 34 to 37 and 41. :observed

`header`: `u32 7; str16 title; str16 description; SYSTEMTIME (8 × u16: year, month, day of week, day, hour, minute, second, ms); u32 1; u64
author xuid; str16 author name;` then undecoded fields (`str16` = u32 count + UTF-16LE). `Thumb.png` is a Grub texture bundle (BC7, 670 × 376)
or, in older containers, a WebP, and it is not a picture of the tune: all five Acty tunes saved from 2026-05-20, with three different bodies
and wheels, carry the byte-identical thumbnail (a picture of the car itself). A tune holds no paint and no livery (those belong to the garage
car, `User_*`). :observed

## Thumbnail cache

`%LOCALAPPDATA%\ForzaHorizon6\LocalStorage_Cache\CacheThumbnails\.manifest`: `u32 version = 2`, `u32 count`, then count × `{ u32 length, ASCII
name, guid[16] }` (each guid names `<guid>.webp`, 670 × 376 renders), then a second list. Names are
`<carId>_<16 hex>{bm0 | bu1c<16 hex> | u<26 base32> | l<22 base32>}_bigThumb.webp`, and all 66 distinct car ids of the cache resolve to a car
archive (2140 = SUB_BRAT_81, 3865 = HON_Acty_94, 269 = POR_959_87). :observed The 16 hex digits probably identify the parts configuration; `bm0` is
factory colour 0, `bu1c...` a custom colour (two RGBA hex words), `u...` a shared design id (server) and `l...` a local design id. :inferred The cache
holds pictures only: no parts lists, colours or layers. :observed

:::open[What are the 46 tuning values of a saved tune?]
Slider positions and gear ratios; the order and units are not decoded.
:::
