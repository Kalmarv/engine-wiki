---
title: Shader programs
description: "The compiled Cg programs of the SHADERS sections (.vsp, .psp, .shp), the RSX fragment microcode and how it decodes, the programs that only scale a texture (sky domes, icons), and the full-screen fog pass with its level parameters."
sources:
  - title: RPCS3 (Emu/RSX/Program/CgBinaryProgram.h, CgBinaryFragmentProgram.cpp)
    url: https://github.com/RPCS3/rpcs3
    note: the CgBinaryProgram container and a fragment-microcode disassembler (commit 979a524) used as the independent reading
  - title: Mesa nouveau (src/gallium/drivers/nouveau/nv30, nvfx_shader.h and nvfx_fragprog.c)
    url: https://gitlab.freedesktop.org/mesa/mesa
    note: reverse-engineered NV30 and NV40 fragment program encoding; the opcodes it marks NV30-only
implementations:
  - name: dx (rsx-reader)
    url: https://github.com/Kalmarv/dx/tree/main/rsx-reader
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

## Instruction census

The 3,267 distinct pixel programs use 33 of the 62 fragment opcodes a decoder can name. The counts are over the 445,127
distinct instructions (the instructions of each distinct microcode once). :proven[all 3,267 distinct programs]

| Opcode | Instructions | Programs | | Opcode | Instructions | Programs |
|---|---|---|---|---|---|---|
| `ADD` | 100,811 | 3,246 | | `SGE` | 4,318 | 2,058 |
| `MOV` | 83,219 | 3,264 | | `FLR` | 3,647 | 468 |
| `MAD` | 76,315 | 3,248 | | `TXL` | 1,926 | 1,926 |
| `MUL` | 59,423 | 3,241 | | `SLT` | 1,916 | 1,724 |
| `TEX` | 20,446 | 3,249 | | `MAX` | 1,712 | 1,657 |
| `DP3` | 15,382 | 2,962 | | `KIL` | 1,564 | 1,564 |
| `DIV` | 14,908 | 3,208 | | `FENCB` | 1,133 | 1,000 |
| `NRM` | 14,533 | 3,006 | | `SEQ` | 1,126 | 1,126 |
| `FENCT` | 8,967 | 2,565 | | `FRC` | 1,060 | 355 |
| `DP2` | 6,966 | 3,146 | | `IFE` | 536 | 357 |
| `RCP` | 5,362 | 1,735 | | `SGT` | 355 | 355 |
| `DIVSQ` | 5,031 | 3,151 | | `SIN`, `COS` | 264 each | 264 |
| `EX2` | 4,761 | 2,580 | | `DP4` | 138 | 68 |
| `LG2` | 4,694 | 2,581 | | `SLE` | 10 | 2 |
| `RSQ` | 4,327 | 2,765 | | `SNE`, `MIN`, `RET` | 7, 3, 3 | 2, 2, 3 |

:proven[all 3,267 distinct programs]

The other 29 opcodes never occur: `NOP`, `DST`, `PK4`, `UP4`, `DDX`, `DDY`, `TXP`, `TXD`, `LIT`, `LRP`, `STR`, `SFL`, `PK2`,
`UP2`, `POW`, `PKB`, `UPB`, `PK16`, `UP16`, `PKG`, `UPG`, `DP2A`, `TXB`, `REFL`, opcode `0x3C`, `BRK`, `CAL`, `LOOP` and `REP`.
:proven[all 3,267 distinct programs] The only control flow is `IFE` (357 programs) and `RET` (3 programs): there are no loops,
calls or breaks. :proven[all 3,267 distinct programs] The `IFE` word that carries the else offset has the branch flag (bit 31 of
the third word) set in all 536 and the word that carries the end offset has bits 30 and 31 clear in all 536. :proven[all 3,267 distinct programs]

The nouveau driver's NV40 fragment encoder names `RSQ`, `LIT`, `LRP`, `POW` and `REFL` as NV30-only opcodes that it lowers
before encoding. :sourced[Mesa nouveau] `RSQ` (opcode `0x1B`) occurs 4,327 times in 2,765 of the programs, in 163,899 of the 181,851
program occurrences, so the RSX fragment unit executes it. The other four do not occur. :proven[all 3,267 distinct programs]

### Header flags and interpolants

The fragment descriptor of the program header agrees with the code. `pixel_kill` is set in the 1,564 programs that contain a `KIL`
and in no other. The depth-replace flag, the output-from-`H0` flag and the centroid mask are zero in all 3,267, the two-component
texture-coordinate mask is non-zero in all 3,267, and the two padding bytes are zero. Every program writes `R0`. :proven[all 3,267 distinct programs]
No program writes depth, so where depth would be written (`R1.z`) is not observed. :proven[all 3,267 distinct programs]

An instruction reads an interpolant through a four-bit source number in the first word (bits 13 to 16). Source `1` (colour 0) is
read by 9 programs, and source `4 + k` is texture coordinate `k` for `k` = 0 to 7 and 9. The texture-coordinate mask of the header has
bit `k` set exactly when a program reads source `4 + k` (texture coordinate 8 is never read), in each of the 3,267 programs; the
attribute-input mask has bit `14 + k` set for texture coordinates 0 to 7, bit 13 for texture coordinate 9, and bits 0 and 2 in
the 9 programs that read colour 0. Sources 0 (position), 2, 3, 12 and 14 are never read. :proven[all 3,267 distinct programs]
The parameter tables of the pixel programs list only uniforms (72,910 parameters, all uniform and all inputs), so no table names an
interpolant. :proven[all 3,267 distinct programs]

### Instruction words

Each 32-bit word of a 16-byte instruction is rotated by 16 bits before its fields are read. The words below are numbered 0 to 3
after that rotation (word 0 holds the opcode and destination, words 1 to 3 the three sources).

| Field | What the 444,588 instructions that are not control flow hold | Confidence |
|---|---|---|
| Word 3 bits 21 to 29 | All ones on the 33,733 instructions that read an interpolant, zero on the other 410,855; bits 19 and 20 are always zero | :proven[all 3,267 distinct programs] |
| Word 3 bit 30 | Zero in all 445,127 instructions | :proven[all 3,267 distinct programs] |
| Word 3 bit 31 | Set on 6,346 of the 33,733 instructions that read an interpolant, never on the others | :proven[all 3,267 distinct programs] |
| Word 1 bits 30 and 31 | Zero in all 445,127 instructions | :proven[all 3,267 distinct programs] |
| Word 2 bits 28 to 30 (result scale) | 0 in 428,298; 1 in 7,635; 2 in 384; 5 in 5,702; 6 in 1,127; 7 in 1,442; 3 and 4 never | :proven[all 3,267 distinct programs] |
| Word 2 bits 19 to 27 (three 3-bit fields) | Zero in 426,584; otherwise one of five patterns, only in `ADD`, `MAD`, `MUL`, `FLR` and `NRM`: first field 4 alone (2,905: 914 `ADD`, 816 `MAD`, 1,170 `MUL`, 5 `FLR`), second field 4 alone (514: 176 `MAD`, 338 `MUL`), second and third fields 4 (48 `MAD`), first and second fields 4 (4 `MUL`), and first field 5 on all 14,533 `NRM` | :proven[all 3,267 distinct programs] |

The one-bit flag in word 3 is a property of the interpolant, not of the instruction: in a program, all reads of one interpolant
carry the same bit 31 in 17,689 of the 17,691 (program, interpolant) pairs. It is clear in 5,300 of the 5,306 pairs for texture
coordinates 0 and 1 and set in 6,334 of 10,078 for texture coordinates 4 to 7; `NRM` accounts for 6,328 of the 6,346 instructions
that have it. :proven[all 3,267 distinct programs] The coordinates that the 10,409 `TEX` instructions reading an interpolant sample
with are texture coordinate 0 (4,774) or 1 (5,635), and the flag is clear on all of them. :proven[all 3,267 distinct programs]
Sampling coordinates are interpolated with perspective correction, so a set bit most likely turns the correction off for that interpolant. :inferred

:::open[What do the flag in word 3 bit 31 and the three 3-bit fields of word 2 mean?]
Bit 31 is a per-interpolant flag that is clear on the sampling coordinates and set on most of the texture coordinates 4 to 7; its
sense is inferred, not shown by a table or a header field. The fields of word 2 above bit 18 are non-zero in only five
patterns, one of them on `NRM` alone.
:::

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
