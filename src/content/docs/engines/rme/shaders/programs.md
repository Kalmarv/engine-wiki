---
title: Shader programs
description: "The compiled Cg programs of the SHADERS sections (.vsp, .psp, .shp), the RSX fragment microcode and how it decodes, the programs that only scale a texture (sky domes, icons), and the full-screen fog pass with its level parameters."
sources:
  - title: RPCS3 (Emu/RSX/Program/CgBinaryProgram.h, CgBinaryFragmentProgram.cpp)
    url: https://github.com/RPCS3/rpcs3
    note: the CgBinaryProgram container and a fragment-microcode disassembler (commit 979a524) used as the independent reading
implementations:
  - name: primase toolkit/rsx
    url: https://github.com/Kalmarv/primase/tree/main/toolkit/rsx
---

The game's shaders ship compiled for the PlayStation 3's RSX in the `SHADERS` sections of the [PAKs](/engines/rme/archives/pak/). A [material](/engines/rme/materials/material-banks/) names its vertex and pixel program by path (`shaders\pixel\environment\env_base`, without an extension), and the extension picks the entry: `.vsp` holds vertex programs, `.psp` pixel (fragment) programs and `.shp` the index of a shader's permutations. :observed

## Containers

A `.vsp` or `.psp` entry is not one program but several, each a `CgBinaryProgram` (revision 6) padded with zeros to a multiple of 64 bytes and written one after another. Reading every pixel program file of the disc this way, refusing any nonzero padding, leaves no bytes over. :proven[all 765 pixel program files]
The 765 `.psp` entries are in 274 of the 336 PAKs and hold 181,851 programs, of which 3,267 are distinct by their microcode and 20,391,890 instructions in all. :proven[all 336 PAKs]

The parameter tables of the programs carry no texture-unit records for the samplers, so a program does not say which material slot feeds which texture unit; see [the sampler slots](/engines/rme/materials/material-banks/#samplers-and-textures). The vertex programs' tables also have no names ([vertex formats](/engines/rme/geometry/vertex-formats/)). :observed

## Fragment microcode

The pixel programs are RSX fragment microcode: 16-byte instructions, an instruction that reads an inline constant followed by that constant's 16 bytes, and an end flag on the last instruction. :sourced[RPCS3]
An independent decoder and RPCS3's disassembler agree on every distinct program of the disc: the operands each prints, the texture units, the inline constants, the end flags and the `IF` boundaries, over 445,127 distinct instructions and 174,349 inline constants. :proven[all 3,267 distinct programs]

The disassembler leaves some operands out, so its text is not a complete reading. :proven[all 3,267 distinct programs]

| What RPCS3's disassembly omits | Count on the disc | Confidence |
|---|---|---|
| The second source of `TXL` and `TXB` (the level of detail or bias) and the third of `TXD` (the gradients) | 1,926 sampling operands | :proven[all 3,267 distinct programs] |
| An inline constant read as the level of detail of a `TXL`, printed as a `NOP` | one program | :proven[all 3,267 distinct programs] |
| ALU predicates, saturation and output scale | not counted | :sourced[RPCS3] |

## Programs that only scale a texture

Seven pixel program files contain only programs that sample one texture at the first texture coordinate and multiply the sample by named uniforms: one `TEX`, then `MOV` and `MUL` of registers and named constants, with no other interpolant and no flow control. They are `env_skydome` (all ten of its programs multiply by `GlobalBrightness`), `env_challenge`, `env_icon`, `confident_arrows`, `confident_line`, `base_textured_2d_simple` (texture unit 0) and `albedo_multiply` (texture unit 1). No other pixel program file has this form. :proven[all 765 pixel program files]
These programs take no light, normal or fog input, so the surfaces they draw (the sky domes, and the materials named for challenge icons and guide arrows) are unlit: their colour is the texture times a constant. :inferred
`env_texture`, the program of MIKE's distant panorama cards, is not of this form. :observed

The sky of CHARLIE is geometry: a dome drawn with an `env_skydome` material (material 510, 300 triangles) and two vista domes (material 4534, 30 and 22 triangles). All 352 triangles face the dome's centre, so the domes are seen from inside without drawing back faces. :observed[CHARLIE]
Its texture `sky_skatehangar01_c` is a 4096 × 1024 BC1 image of a sunset gradient. :observed

In one `env_base` permutation the material constant `ColorBias` is added to the colour, saturated, and the result fades toward `ColorConstant`; there `ColorConstant` is a target colour, not a multiplier of the texture. :inferred[read from one permutation]

## The fog pass

Fog is a full-screen pass after the scene, the program `rme\shaders\pixel\fsfx\fog.psp` in `RME.PAK`. It reads the depth buffer at texture unit 1 as eight-bit RGB and rebuilds the 24-bit depth from the three bytes, rebuilds a position from it through the uniform matrix `MainInv`, and blends the scene colour toward the fog colour by a distance factor times a height factor. :inferred[read from the decoded program, not executed]

With `u, v` the screen coordinates and `a1` to `a8` the fog parameters:

```
depth = r/2^8 + g/2^16 + b/2^24                        (r, g, b the depth bytes)
P     = MainInv[0]·(2u−1) + MainInv[1]·(1−2v) + MainInv[2]·depth + MainInv[3];   P.xyz /= P.w
S(t)  = t²(3 − 2t)                                     (smoothstep)
tD    = saturate((P.z − a1) / (a2 − a1))
tH1   = saturate((P.y − a3) / ((a4 − a3)/2))
tH2   = saturate((a4 − P.y) / ((a4 − a3)/2))
f     = S(tD) · S(tH1) · S(tH2)
out   = scene + f · a8 · ((a5, a6, a7) − scene)
```

So the fog grows smoothly from distance `a1` to `a2`, is strongest at the middle height of the band from `a3` to `a4` and falls to nothing at either edge, has the colour `(a5, a6, a7)` and never covers more than `a8` of the scene. :inferred[read from the decoded program, not executed]

The engine fills `MainInv` by inverting a camera matrix. That it is the inverse of the projection alone, which would make `P.z` the depth along the view, is concluded from the code's structure and not observed. :inferred

The parameters are the arguments of the level scripts' `change_fog` call, nine numbers of which the shader reads the first eight; what the ninth controls is not known. :observed The opacity `a8` is 0.4157 in CHARLIE, 0.0588 in DELTA and 0.5216 in MIKE, and none of the ten levels sets it to zero. :observed

:::open[What space is the fog's height band in?]
The band is tested on `P.y` of the rebuilt position. If `MainInv` inverts the projection alone, `P` is in view space and the band moves with the camera; a world-space band would need the view as well. A capture of `MainInv` from the running game would decide it.
:::

:::open[What does the ninth fog argument do?]
`change_fog` passes nine values and the fog program reads eight. The ninth may be a transition time or a blend control outside the shader.
:::
