---
title: Lights
description: "The light records of the SCP blob: 80-byte records with a 64-byte matrix each, their colour, name, parameters and kind code, and what is not known about their meaning."
implementations:
  - name: primase worlds/shred (scp_lights.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/shred/src/read/scp_lights.rs
---

Light records are the type-4 sections of the [SCP blob](/engines/rme/world/scp-tables/). They are in the `lighting_*` layers ([layers](/engines/rme/world/layers/)), which hold a node and light or probe sections but no placements. The disc has 55 light sections and **9,778** records. :proven[all 547 SCPs]

What the records are made of is decoded; what they mean as a light (units, range, cone, which axis shines) is not.

All numbers are big-endian.

## Section and record

A section holds `count` records of 80 bytes from its data offset, then `count` matrices of 64 bytes; its size is `data_offset + count × 144`. This holds in all 55 sections. :proven[all 55 sections]

```layout
title: Light record
size: 80
games: [shred]
fields:
  - {at: 0, size: 16, type: "f32[4]", name: colour, level: observed, note: "red, green, blue, alpha; alpha is 1 in every record"}
  - {at: 16, size: 4, type: u32, name: name, level: observed, note: "sdbm of the light's name; `Sun` (0x2954240C) is the only one that resolves, once in 170 in CHARLIE"}
  - {at: 20, size: 12, type: "f32[3]", name: parameters, level: unknown, note: "kind 0: 0.2 to 11, 1 to 15 and 0.2 to 2.2; kinds 1 and 4: 1, 100 and 0.4 to 1"}
  - {at: 32, size: 4, type: u32, name: kind, level: observed, note: "0, 1, 3, 4, 7 or 8, see below"}
  - {at: 36, size: 16, type: "u32[4]", name: links, level: unknown, note: "-1, 0, 0, -1 or -2 in the lights seen"}
  - {at: 52, size: 4, type: u32, name: matrix_offset, level: proven, note: "from the section's start, into the matrix array that follows the records"}
  - {at: 56, size: 8, type: "u32[2]", name: tail, level: unknown, note: "0 except for one kind"}
  - {at: 64, size: 16, type: "u8[16]", name: name_buffer, level: observed, note: "leftover text and numbers of the authoring tool's name buffer (`I_Visibility`, texture names)"}
```

Every matrix is finite and affine. For the volume kinds (7 and 8) the matrix carries a large scale. :proven[all 55 sections]

### Kinds

The kind word, over the 9,778 records: :proven[all 55 sections]

| Kind | Records | Notes |
|---|---:|---|
| 0 | 5,251 | the commonest; parameters 0.2 to 11, 1 to 15 and 0.2 to 2.2 |
| 7 | 4,079 | point-like; positions near the origin, so the matrix holds a local offset |
| 8 | 398 | volumes with large matrix scale |
| 1 | 23 | named `Sun` where the name resolves |
| 4 | 23 | ambient |
| 3 | 4 | a texture name (`gobo_star`, `gobo_circle`) in the buffer |

The names for kinds 1 (sun) and 4 (ambient) come from the one resolvable name and a pattern in the parameters; the rest are only numbers. :inferred
A light's translation is not its position in the level: the matrix of kind 7 is near the origin and the sun's translation is not the sun's. How to place a light is not established. :unknown

Beside the light records the lighting layers hold specular cube-map locators (type `d`) and probe or ambient-volume records (type `f`, with `ambvol_*` volume textures; see [Textures](/engines/rme/textures/gcm-textures/)). The sky is an ordinary placed mesh with a `skydome` vertex program. :observed

:::open[What do the light parameters and kinds mean?]
Colour, name and matrix are plain. The three parameters (range, intensity or cone angle are the candidates), the kind codes and the four link words have no known use; the executable's light loader has not been traced.
:::
