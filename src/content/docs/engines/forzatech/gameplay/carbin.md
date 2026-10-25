---
title: Cars and the .carbin scene
description: Where Forza Horizon 6 keeps its 682 cars, the car archive layout, the version-7 carbin scene with its part groups and instances, and how a configuration of parts is assembled.
---

Each car is one ordinary zip, `media\Cars\<CAR>.zip` (deflate or store; 682 cars), plus shared libraries. The car's scene is a
`.carbin` listing every part instance with its transform and which upgrades it belongs to. :observed

Everything on the car pages comes from a recorded census of the install's `media\Cars` (682 cars) and the shared car libraries;
the install is no longer available. Claims were checked on all cars unless a smaller sample is named. :observed

## Where the data lives

```
media\Cars\<CAR>.zip                      one standard zip per car, e.g. NIS_240SX_94.zip
    <CAR>.carbin                          the car scene: every part instance, its transform, upgrade membership
    <CAR>.carbin_debug                    build-time names of sub-parts merged into the shipped models
    Manifest.xml                          streaming manifest: per NonUpgradeablePart / UpgradeablePart (PartEnum, PartId)
                                          the models, materials and swatches it needs
    ManufacturerColors.bin                a Grub bundle with one 'LCNM' blob: the factory paint list
    Scene\...\*.modelbin                  part models (Grub, Mesh v1.12), Scene\<CAR>_skeleton.modelbin
    Scene\_library\Scene\{Brakes,Wheels,Undercarriage}\...   car-specific copies of library parts
    Textures\...\*.swatchbin              AO bakes, symbols, gauges
    LiveryMasks\{front,back,left,right,top,glass_*,Wing}.swatchbin + Masks.xml   livery projection masks
    Locators.xml, Lights.bin, LightPresets.bin, physicsdefinition.bin (collision hull points), IKAnchorBones.xml, ...
media\Cars\_library\
    Materials.zip                         1,859 car .materialbin (game path cars\_library\materials\...)
    Textures.zip                          18,377 .swatchbin   (game path cars\_library\textures\...)
    shaders\<family>.zip                  one per car shader family: <family>.shaderbin (+ .shaderbin.xml) and DXIL permutations
    scene\wheels\*.zip (527), scene\tires\*.zip   aftermarket wheels and tyres
    *.avpins                              body-type animation pins
media\brakes\*.zip                        aftermarket calipers and rotors
media\Livery\{Decals,DecalsHiRes,Vinyls,EntitlementLiveries}.zip   livery shapes and one shipped livery
media\Stripped\gamedbRC.slt               the game database (car → make / year, part → upgrade name, wheel/tyre sizes, prices): encrypted
media\Stripped\StringTables\<LANG>.zip    the localised strings (plain)
media\UI\Textures\OfflineThumbnails.zip   car pictures by car id
```

All :observed. Material, texture and model references are game paths, looked up case-insensitively:
`game:\media\cars\_library\materials\X` is `Cars\_library\Materials.zip` entry `X`, `…\_library\textures\X` is `Textures.zip`,
`…\_library\shaders\F\F.shaderbin` is `shaders\F.zip`, and `game:\media\cars\<car>\X` is the car's own zip. :observed The
database, `Rules.zip`, `GameTunableSettings.zip` and the profile are [encrypted](/engines/forzatech/archives/encrypted-files/).

## The .carbin (version 7)

Little-endian; `str` is a `u32` length plus ASCII with no terminator. Walking the layout ends exactly 2 bytes before the end of
the file on 682 of 682 cars; the 2 tail bytes are `01 01` (681) or `00 01` (1). :observed

```layout
title: .carbin
size: variable
games: [fh6]
fields:
  - {at: 0, size: 2, type: u16, name: version, value: 7, level: observed}
  - {at: 2, size: 16, type: "u8[16]", name: guid, level: observed}
  - {at: 18, size: 1, type: u8, name: zero, value: 0, level: observed}
  - {at: 19, size: 4, type: u32, name: car id, level: observed, note: "= PartId / 1000 on 6,653 of 6,654 upgrades"}
  - {at: 23, size: "4 + n", type: str, name: name, level: observed, note: "lowercase car name, e.g. nis_240sx_94"}
  - {at: "next", size: "4 + n", type: str, name: skeleton path, level: observed, note: "game:\\media\\cars\\<car>\\scene\\<car>_skeleton.modelbin"}
  - {at: "next", size: 2, type: u16, name: LOD mask, level: observed, note: "0x7F (one car 0x7E)"}
  - {at: "next", size: variable, type: "fixed group[]", name: fixed groups, level: observed, note: "u32 count (Manifest NonUpgradeablePart); each { u8 partEnum, u16 2, u32 partEnum, u32 n, n × fixed instance, f32 bounds[8] (min xyzw, max xyzw) }"}
  - {at: "next", size: variable, type: "upgrade group[]", name: upgrade groups, level: observed, note: "u32 count (Manifest UpgradeablePart; PartEnum unique per car); each { u16 3, u32 partEnum, u32 nUpgrades, nUpgrades × { u16 3, u8 level, u8 isDefault, u32 partId, i32 parentPartId, u8 flag, f32 bounds[8] }, u32 n, n × upgradeable instance }"}
  - {at: "end - 2", size: 2, type: "u8[2]", name: tail, level: observed}
```

Part enum values seen (names from `Manifest.xml`): 2 CarBody, 4 Brakes, 9 RearWing, 34 FrontBumper, 35 RearBumper, 36 Hood, 37
SideSkirts, 40 WeightReduction (one car), 41 ChassisStiffness (holds the roll cage), 43 WheelStyle. :observed A carbin upgrade
group links to its manifest `UpgradeablePart` name through the model files: the name whose listed model paths contain every model
of the group's instances. Over all 682 cars this resolves 2,339 of 2,352 groups, none ambiguous; the other 13 groups have one model
the manifest does not list. Part-id sets cannot decide it, because different groups of a car often carry the same part ids.
:observed

```layout
title: Car instance
size: variable
games: [fh6]
note: "Little-endian. Upgradeable instances start with u32 nParts and the part ids; fixed instances start at the u16 0x15."
fields:
  - {at: 0, size: "4 + 4n", type: "u32, u32[]", name: part ids, level: observed, note: "upgradeable only: the upgrades this instance belongs to"}
  - {at: "next", size: 2, type: u16, name: marker, value: "0x15", level: observed}
  - {at: "next", size: "4 + n", type: str, name: model path, level: observed}
  - {at: "next", size: 64, type: "f32[16]", name: matrix, level: observed, note: "row-vector 4×4, translation in the last row; car space"}
  - {at: "next", size: 2, type: u16, name: LOD mask, level: observed, note: "bit k: drawn at LOD k (bit 0 = S, bit 1 = LOD0, ... bit 6 = LOD5)"}
  - {at: "next", size: "4 + n + 2", type: "str, u16", name: bone and bone index, level: observed, note: "the skeleton bone the instance follows at run time (hubLF, spindleRF, <root>, ...)"}
  - {at: "next", size: 1, type: u8, name: zero, value: 0, level: observed}
  - {at: "next", size: 4, type: u32, name: flags, level: unknown, note: "5, 39, 47, 13, 55, 1, 7, 23, ..."}
  - {at: "next", size: variable, type: "override[]", name: material overrides, level: observed, note: "u32 count; each { str materialName, u32 size, u8 bundle[size] }, a Grub bundle with one MatI like a model's (402 bundles, 18 empty)"}
  - {at: "next", size: variable, type: "slot[]", name: material slots, level: observed, note: "u32 count; each { str materialName, u64 slot }, slot = customisation slot hash (0 = none)"}
  - {at: "next", size: variable, type: "u8, { f32, u32 }[]", name: unknown pairs, level: unknown}
  - {at: "next", size: 4, type: f32, name: unknown float, level: unknown, note: "−1 (46,762) / 0.5 (19,764) / 0.1 / 0.2 / 0.25 / 0.01"}
  - {at: "next", size: variable, type: "swatch[]", name: instance swatches, level: observed, note: "u32 count; each { u16 3, str path, u8 ff[8], u8 0[16], u8 kind, if kind = 0: u8 a, u8 b }; the instance's AO bake; the 85 kind-0 entries are LOD bakes (*_lods_ao) with (a, b) = (2, 255), (1, 0), (1, 255), (0, 31)"}
  - {at: "next", size: variable, type: bytes, name: flags block, level: unknown, note: "u8 0; u16 0x1F or 0x11F; u8 flags[18]"}
  - {at: "next", size: "4 + n", type: str, name: group name, level: observed, note: "the source folder: Doors, Brakes, PrimaryLights, ..."}
  - {at: "next", size: 36, type: bytes, name: guid and zeros, level: unknown, note: "u8 guid[16]; u8 zero[20]"}
  - {at: "next", size: variable, type: "u32, u32, guid[]", name: lights, level: observed, note: "u32 flag; u32 nLights; nLights × guid[16]: light emitters on this part (lamps carry 2 to 6)"}
  - {at: "next", size: 4, type: u32, name: instance index, level: observed}
  - {at: "next", size: 5, type: "u8[5]", name: tail, level: unknown}
  - {at: "next", size: "4 + n", type: str, name: detail swatch, level: observed, note: "usually empty (caliper detail maps etc.)"}
```

## Assembling a car

A **configuration** picks one part id per upgrade group. A car draws every fixed-group instance plus every upgradeable instance
whose part ids contain its group's chosen id. :observed

**Bodies and default parts.** An upgrade's `parentPartId` names its car body as `carId × 1000 + the body's index in the CarBody
upgrade list`, not the body's part id: `HON_Acty_94` lists bodies 3865000, 3865100, 3865200 and their parts carry parents 3865000,
3865001, 3865002; `BMW_E46M3_05` bodies 383000, 383001, 383200, 383300 → 383000 to 383003. A car without a CarBody group (572 cars)
has one implicit body with key `carId × 1000`; on 466 of them 1,185 groups have their default part under that parent, the rest under
−1. A body's default parts: CarBody is the body, every other group is the upgrade with `isDefault = 1` whose parent is −1 or the
body's key. **Stock** is the default parts of the CarBody upgrade with `isDefault = 1` and parent −1, or of the implicit body.
Every group of every body of all 682 cars (the 110 CarBody cars' 234 bodies and the 572 implicit bodies) has exactly one default;
with the body part id as parent 437 non-stock body and group pairs have none. :observed Every body-dependent part of 140 saved tunes
carries the key of the tune's own body (398 of 398). :observed

`partIds` sometimes name ids that no upgrade of the carbin offers (187 of 32,161). The saved tunes show the game does select such ids
(16 of 444 upgrade slots), so the carbin's upgrade lists are not the full lists, which come from the encrypted database. :observed

**Transforms.** A mesh's vertices are stored relative to its `RigidBoneIndex` bone in the model's own `Skel` blob (every car modelbin
carries the whole car skeleton; 240SX doors use `boneDoorLF` and `boneDoorRF`, wipers `boneWiperL` and `boneWiperR`, the steering
wheel `boneSteeringWheelSpindle`). Car space is `p_car = p_mesh · W(bone) · instance.matrix` (row vectors) with
`W(i) = local_i · W(parent_i)` from the rest transforms. Without `W` both 240SX doors sit on the car's centre line; with it they close
into the door openings. Brake instances carry rotation and non-uniform scale (calipers 1.02 × 0.53 × 0.53 after rotation); right-hand
wheels reuse the left model rotated 180° about Y (determinant +1); no instance mirrors. :observed Car space follows the world frame
(Y up, left-handed, metres, +Z forward; the 240SX's left wheels sit at x = −0.83). :observed

**LOD.** Instance and mesh share bit k (instance `lodMask`, `Mesh.LODFlags`). Bit 0 ("S": meshes named `*_LODS0`, models named
`*__slod`) is the most detailed set; LOD0 meshes usually carry bits 0 and 1. :observed Meshes named `Shadow` (no material, POSITION
only, bucket 0x09) are shadow casters. :observed

## Car pictures

`media\UI\Textures\OfflineThumbnails.zip` holds 154 lossless WebP pictures (670 × 376) named `<carId, 4 digits>_<16 hex>bm<N>_Big.webp`;
the leading number is the carbin car id, and all 129 distinct ids are cars. `bm<N>` fits a factory colour index in 179 of 180
pictures (the exception, `0357_...bm5` on `MIT_GTO_97`, has only 5 colours). 176 of the 682 cars have a shipped or cached picture
(129 shipped). No other car pictures ship; the other UI archives hold menu art. :observed The camera for the thumbnails is in
`media\ThumbnailCamSettings.xml` (`<Thumb size="big">`: position, facing vector and a **vertical** field of view; ordinal = a car id
with its own entry, −2 the default). :observed What the 16 hex digits mean is not established (shipped values 0x1388 to 0x1F89; cache
values are 64-bit; one value is shared by two cars). :unknown

:::open[What are the flags 5, 39, 47, 13, 55, 1, 7, 23 on a car instance?]
They are read as a `u32` per instance; their meaning is not decoded, nor are the unknown float, the (f32, u32) pairs and the 18
flag bytes.
:::
