---
title: Particle instances (.particlebin)
description: The particle effects Forza Horizon 6 places in a track and along its routes, the Grub bundle that holds them and the 129-byte instance records.
implementations:
  - name: forzatech-formats (particles.rs)
    url: https://github.com/Kalmarv/forzatech-formats/blob/main/src/particles.rs
---

Ambient effects (falling leaves and cherry blossom, bird flocks, koi, fireflies, mist, kites, streamers, light shafts)
are placed as particle instances: an effect name, a place, a size and a few strings that gate the instance. A track's
are in `Ribbon_00\ParticleInstances.particlebin`; each route has its own in
`Stripped\gs\<track>\routedefinitions\route<id>_<track>.particlebin`, beside its sound scape. The install holds 170
such files: the Tokyo track's, the home space's and 168 route definitions. :proven

## Container

A `.particlebin` is a [Grub bundle](/engines/forzatech/data-model/grub-bundle/) with one blob, tag `PCLB`, no metadata
records. :proven The blob is version 7.0 in 169 files and 6.0 in the home space's, which holds no instance; the layout of
a version 6.0 file that has instances is unknown. :observed The blob's data is a memory image: every offset in it is
measured from the start of the data. :proven

```layout
title: .particlebin blob data
size: variable
games: [fh6]
note: "Little-endian. The 16-byte header, then the instances, then the strings to the end of the data."
fields:
  - {at: 0, size: 4, type: u32, name: eight, value: 8, level: proven, note: "all 170 files"}
  - {at: 4, size: 4, type: u32, name: instance count, level: proven, note: "0 in 92 files, 1 to 87 in 77 route definitions (508 in all), 3,959 in the track's"}
  - {at: 8, size: 4, type: u32, name: sixteen, value: 16, level: proven, note: "the offset of the first instance"}
  - {at: 12, size: 4, type: u32, name: first instance, level: proven, note: "16, or 0xFFFFFFFF when the count is 0"}
  - {at: 16, size: "129 n", type: "instance[]", name: instances, level: proven}
  - {at: "next", size: variable, type: "cstring[]", name: strings, level: proven, note: "printable ASCII, each zero-terminated; each is named by some instance; empty when the count is 0"}
```

```layout
title: particle instance
size: 129
games: [fh6]
note: "Little-endian, unaligned (the byte at 120 shifts what follows). R is the offset of the instance in the blob data. A string field is the offset of the first byte of a string of the strings section; a link is the offset of another slot."
fields:
  - {at: 0, size: 4, type: u32, name: name, level: proven, note: "string; 986 distinct in the track's file, like falling_leaves_customizable_Instance12"}
  - {at: 4, size: 4, type: u32, name: link, value: "R + 8", level: proven}
  - {at: 8, size: 4, type: u32, name: effect, level: proven, note: "string; 50 distinct in the track's file, like falling_leaves_customizable"}
  - {at: 12, size: 4, type: u32, name: link, value: "R + 112", level: proven}
  - {at: 16, size: 16, type: "u32[4]", name: constants, value: "1, 0, 0, 0", level: proven}
  - {at: 32, size: 4, type: f32, name: one, value: 1.0, level: proven}
  - {at: 36, size: 12, type: "f32[3]", name: position, level: observed, note: "world frame; x −17,103 to 6,743, y 93 to 856, z −9,899 to 8,500 in the track's file"}
  - {at: 48, size: 16, type: "f32[4]", name: rotation, level: observed, note: "a unit quaternion x, y, z, w (length within 1.4e-7 of 1 on all 3,959 of the track's file)"}
  - {at: 64, size: 12, type: "f32[3]", name: extent, level: unknown, note: "whole metres up to float rounding: 2, 8, 2 for 681 instances, 5, 9, 4 for about 600"}
  - {at: 76, size: 4, type: u32, name: null, value: "0xFFFFFFFF", level: proven}
  - {at: 80, size: 4, type: f32, name: distance, level: unknown, note: "0 for 86 instances, otherwise 50 to 6,000; 65 for 1,914 of the track's"}
  - {at: 84, size: 4, type: u32, name: zero, value: 0, level: proven}
  - {at: 88, size: 4, type: u32, name: null, value: "0xFFFFFFFF", level: proven}
  - {at: 92, size: 4, type: u32, name: link, value: "R + 96", level: proven}
  - {at: 96, size: 4, type: u32, name: null, value: "0xFFFFFFFF", level: proven}
  - {at: 100, size: 4, type: u32, name: next, level: proven, note: "R + 129, or 0xFFFFFFFF on the last instance"}
  - {at: 104, size: 4, type: u32, name: tag, level: observed, note: "string; empty for 3,956 of the track's file, [TIME_ATTACK_DRIFT_CIRCUIT_HORIZON] for one, 0 for two"}
  - {at: 108, size: 4, type: u32, name: link, value: "R + 121", level: proven}
  - {at: 112, size: 4, type: u32, name: route, level: observed, note: "string in the form of a .pgeo header's route string: empty, 0, ~1281, ~351;~8008, ..."}
  - {at: 116, size: 4, type: u32, name: link, value: "R + 104", level: proven}
  - {at: 120, size: 1, type: u8, name: flag, level: unknown, note: "0 or 1; 1 for 248 of the track's"}
  - {at: 121, size: 4, type: u32, name: group, level: observed, note: "string; empty for 478 of the track's, otherwise 25 names such as leaves_ginkgo_falling, seagulls_audio, koi_carps"}
  - {at: 125, size: 4, type: u32, name: link, value: "R + 88", level: proven}
```

The links make one singly linked chain through an instance's seven slots (the five string fields and the two null
slots): 0, 8, 112, 104, 121, 88, 96, then the next instance's 0. :proven Every one of the 4,467 instances holds the
values above. :proven

## What is known about the fields

- The track's file names 986 instances, 50 effects and 26 groups; the commonest effects are
  `falling_leaves_customizable` (1,911 instances), `cherry_blossom_falling_customizable` (960),
  `wild_birds_flock_customizable` (237), `wild_koicarp_customizable` (168) and `Light_Skyscrapper` (134). :observed
- The `route` string uses the same grammar as the route of a [`.pgeo` header](/engines/forzatech/world/pgeo-placements/)
  (`~` before an id, ids joined by `;`); that it gates the instance the same way is not established. :unknown
- The meaning of `extent`, `distance`, the byte at 120 and the `group` string is not established; `distance` takes the
  values of a draw distance (50 m to 6 km) but nothing was run to show it. :unknown

:::open[How does the game use a particle instance?]
The strings suggest a gating by route and gameplay tag, and an audio group; none of it was tested against the running
game.
:::
