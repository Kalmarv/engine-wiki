---
title: Direct3D shader containers (DXBC and DXIL)
description: "How five games wrap compiled Direct3D shaders: the container digest and part sets, the signature, reflection, statistics, feature, level 9, class linkage and debug parts and the Shader Model 4 and 5 token streams, measured over the extracted programs."
games: [sekiro, elden-ring, riders-republic, skate, sledding]
sources:
  - title: Microsoft fxc (Effect-Compiler Tool), Windows SDK 10.0.26100
    url: https://learn.microsoft.com/en-us/windows/win32/direct3dtools/fxc
    note: the compiler that produced the minimum-precision test containers below
---

Sekiro, Elden Ring, Riders Republic, skate. and the Unity player of Sledding Game ship their Direct3D shaders in the
DirectX container: the bytes `DXBC`, a 16-byte digest, a version word, the total size, a part count, then one offset per
part, and each part is a four-character kind, a size and its bytes. Shader Model 4 and 5 programs (made by `fxc`) keep their
token stream in a `SHDR` or `SHEX` part; Shader Model 6 programs (made by `dxc`) keep LLVM bitcode in a `DXIL` part.
This page records what the containers of the five games hold, beside the per-engine pages that say which program is
which: [FromSoftware bundles](/engines/fromsoft/shaders/bundles/), [Anvil packs](/engines/anvil/shaders/containers-and-permutations/),
[skate. shader state](/engines/frostbite/shaders/shader-state/) and [Unity shader objects](/engines/unity/shaders/shader-objects/).
The parts only Shader Model 6 programs have, and what their DXIL modules hold, are on
[Shader Model 6 parts and DXIL modules](/concepts/dxil-modules/).

What was read, by game (the programs extracted from each install; the counts below are over these):

| Game | Programs read | Container kind | Confidence |
|---|---|---|---|
| Sekiro | 432: 390 pixel (`.ppo`), 42 vertex (`.vpo`) | Shader Model 5.0 DXBC | :observed{games="sekiro"} |
| Riders Republic | 2,443 containers of the shader pack (1,517 distinct): 1,156 pixel, 736 compute, 526 vertex, 7 geometry, 9 hull, 9 domain | Shader Model 5.0 DXBC | :observed{games="riders-republic"} |
| Sledding Game | 4,854 pixel programs read from the player's shader assets | Shader Model 4.0 (3,316) and 5.0 (1,538) DXBC | :observed{games="sledding"} |
| skate. | 19,445 `CompiledBytecode` containers: 10,118 pixel, 3,341 vertex, 5,780 compute, 1 mesh, 205 libraries | Shader Model 6.0 to 6.6 DXIL | :observed{games="skate"} |
| Elden Ring | 50,283 containers of its shader bundles: 25,183 pixel, 18,769 vertex, 1,731 compute, 150 domain, 136 hull, 33 geometry, 4,281 libraries | Shader Model 6.0 (programs) and 6.3 (libraries) DXIL | :observed{games="elden-ring"} |

Elden Ring's 4,281 library containers hold DirectX Raytracing shaders. Classed by the kind of their entry function, there are 3
ray-generation, 2,138 any-hit, 2,138 closest-hit and 2 miss shaders, which together make up all 4,281.
:observed[every library container of the bundles]{games="elden-ring"} Shaders of these kinds run only through a ray-tracing
dispatch, so they belong to the game's optional ray-traced effects and not to its ordinary G-buffer, shadow and lighting passes.
:inferred{games="elden-ring"}

## Container

The container header is the same in every program: version word `1`, the stored total size equal to the file size, parts
back to back with no gap and no bytes after the last, and no part kind twice. :observed[all 77,457 containers]
Part sizes need not be multiples of four: 42,877 of Elden Ring's containers have a part whose size is not, and the next part
starts immediately after it. :observed{games="elden-ring"}

The digest at bytes 4 to 20 is MD5's block function over the bytes from offset 20 to the end, with the last block padded as
the compiler does: the bit count first, then the remaining bytes, `0x80`, zeros, and at byte 60 the bit count divided by four
with bit 0 set; a remainder of 56 bytes or more is padded in a block of its own first. It equals the stored digest in all
77,457 containers, DXIL as well as DXBC, and none stores a zero digest, so every shipped DXIL container is signed.
:observed[Sekiro 432, Riders Republic 2,443, Sledding Game 4,854, skate. 19,445, Elden Ring 50,283 containers]

A container is fixed by its parts and their bytes. Writing the parts back in the directory's order, each exactly as stored (a part keeps the padding its
producer wrote, or none), behind a header whose size, part count, directory and digest follow from them, reproduces every one of the 77,457 containers byte for byte.
:proven[Sekiro 432, Riders Republic 2,443, Sledding Game 4,854, skate. 19,445, Elden Ring 50,283 containers] The digest and the sizes are the only fields derived from the rest,
so a part can be replaced or added and the container written again with a correct digest.

Three outside readers agree with this. vkd3d's container reader lists the same kinds, sizes and part offsets as a plain reading of the directory in all 77,457 containers (599,974 parts), and
accepts the stored digest of every one (it checks the digest unless told not to). :proven[all 77,457 containers] Microsoft's `d3dcompiler_47` refuses a Shader Model 4 or 5
container whose digest is stale or zero (`D3DDisassemble` and `D3DStripShader` return `E_FAIL`) and takes the stock one. :observed[the committed fixtures and 180 sampled containers of three games]
Microsoft's DXIL validator, given a container with a zero or arbitrary digest and asked to edit it in place, returns the stock container of Elden Ring byte for byte, so the digest it signs with
is the one above. :observed[120 sampled containers]{games="elden-ring"} It rejects skate.'s stock containers (status `0x80AA0009`), so it cannot arbitrate those. :observed[20 sampled containers]{games="skate"}
A container with a part replaced (the debug-name part) and its digest recomputed is accepted by all three, and the validator's signature of it equals the digest recomputed. :observed[60 sampled Elden Ring containers]

| Part set (in file order) | Containers | Games |
|---|---|---|
| `RDEF ISGN OSGN SHEX STAT` | 432 | :in[sekiro] |
| `ISGN OSGN SHEX` | 2,418 | :in[riders-republic] |
| `ISGN PCSG OSGN SHEX` | 9 (domain) | :in[riders-republic] |
| `ISGN OSGN PCSG SHEX` | 9 (hull) | :in[riders-republic] |
| `ISGN OSG5 SHEX` | 7 (geometry) | :in[riders-republic] |
| `ISGN OSGN SHDR` | 3,279 | :in[sledding] |
| `ISGN OSGN SHEX` | 1,538 | :in[sledding] |
| `ISG1 OSG1 SHEX SFI0` | 20 | :in[sledding] |
| `ISGN OSGN SHEX SFI0` | 1 | :in[sledding] |
| `RDEF ISGN OSGN SHDR STAT SPDB` | 16 | :in[sledding] |
| `SFI0 ISG1 OSG1 PSV0 ILDN HASH DXIL` | 19,240 | :in[skate] |
| `SFI0 VERS RDAT ILDN HASH DXIL` | 205 (libraries) | :in[skate] |
| `SFI0 ISG1 OSG1 PSV0 RTS0 STAT ILDN HASH DXIL` | 45,652 | :in[elden-ring] |
| `SFI0 ISG1 OSG1 PSG1 PSV0 RTS0 STAT ILDN HASH DXIL` | 286 (hull, domain) | :in[elden-ring] |
| `SFI0 RDAT STAT ILDN HASH DXIL` | 4,281 (libraries) | :in[elden-ring] |
| `SFI0 ISG1 OSG1 PSV0 STAT ILDN HASH DXIL` | 54 | :in[elden-ring] |
| `SFI0 ISG1 OSG1 PSV0 RTS0 STAT HASH DXIL` | 10 | :in[elden-ring] |

:observed[every container read]

Riders Republic's pack carries no `RDEF`, `STAT` or `SFI0`: the programs are stripped to signatures and code.
:observed{games="riders-republic"} The Unity programs use `SHDR` for Shader Model 4.0 (3,295) and `SHEX` for the 21
Shader Model 4.0 programs that carry an `SFI0` part and for every Shader Model 5.0 program. :observed{games="sledding"}

## Signature parts

A signature part is a count, the byte offset of the first record (always `8`), the records and then the semantic-name strings.
The record is 24 bytes in `ISGN`, `OSGN` and `PCSG` (name offset, semantic index, system value, component type, register,
component mask, read/write mask), 28 bytes in `OSG5` (a stream number first) and 32 bytes in `ISG1`, `OSG1` and `PSG1` (the
stream number first and a minimum-precision code last). In every non-empty signature of every container the first name
starts directly after the last record, which fixes the record size independently of the part's name. The directory word is `8`
in every signature part (all 77,457 containers). :observed[every container read]

The stream and minimum-precision columns are `0` in every record read: Sekiro 5,527, Riders Republic 8,774, Sledding Game
36,344, skate. 145,474 and Elden Ring 545,994 records. :observed[every record of every container read] The 20 Sledding Game
programs with `ISG1` and `OSG1` are exactly the 20 whose `SFI0` is the minimum-precision flag. :observed{games="sledding"}

Minimum precision does write the column. A hull shader and a domain shader whose patch-constant structure holds a `min16float4`,
compiled with fxc 10.0.26100.0 as `hs_5_0` and `ds_5_0`, carry `ISG1`, `OSG1` and **`PSG1`** parts (and no `PCSG`) with the
code `1` (16-bit float) in the minimum-precision column of the input `COLOR` and patch-constant `PCDATA` elements and of the
hull's output `COLOR`, `0` on the other elements (the domain's `min16float4` output among them), and `SFI0` equal to `0x10`.
The same shaders written with `float` carry `PCSG` and no `PSG1`. :observed[two test compilations and their plain-float twins]
None of the 7,729 Shader Model 4 and 5 programs read is a hull or domain program with `PSG1`. All 286 hull and domain programs of
Elden Ring are Shader Model 6 and carry `PSG1`, never `PCSG`. :observed{games="elden-ring"}

## Reflection and statistics in Shader Model 4 and 5

`RDEF` holds the resource definitions. In Sekiro it is Shader Model 5.0 in all 432 containers: the target word is `0xffff0500`
(pixel, 390) or `0xfffe0500` (vertex, 42), the tag `RD11` sits at byte 28, and the seven words after it are 60, 24, 32, 40, 36, 12 and 0
in every one (the record sizes of the Shader Model 5.0 layout). :observed{games="sekiro"} In Sledding Game 16 programs carry an `RDEF`, all of Shader Model 4.0 (target `0xffff0400`, creator string
"Microsoft (R) HLSL Shader Compiler 10.1"): there is no `RD11` block at byte 28, and every record reads with the Shader Model 4
sizes, a 28-byte header, 32-byte bindings, 24-byte buffers and variables and 16-byte types, with every name inside the part
and every variable inside its buffer. The other 4,838 programs have no `RDEF`. :observed{games="sledding"}

A Shader Model 5.1 target writes another tag and a longer binding record. fxc 10.0.26100.0, compiling one pixel program
for `ps_5_0` and for `ps_5_1`, writes `RD11` and the sizes 60, 24, 32, 40, 36, 12 for 5.0, and for 5.1 the bytes
`13 13 44 25` (the word `0x25441313`) at byte 28 and the sizes 60, 24, 40, 40, 36, 12: the binding record grows from 32 to
40 bytes, and the two words it gains are the register space and the resource's id, the number the 5.1 token stream names
the resource by. The ids count from 0 within each register class (`b`, `t`, `s`, `u`). A texture array of four takes one
5.1 record with a register count of 4, and an array with no stated size a count of 0; the 5.0 build of the same source,
which indexes the array with a constant, has one record for the element it reads (`detail[2]` at t6). Bit 0 of the
binding flags (`D3D_SIF_USERPACKED`) is set on all four bindings of the 5.0 build, each of which has an explicit register;
in the 5.1 build it stays set on the constant buffer and is clear on the sampler and the two textures. In both layouts the fourth word of a variable record is the variable's flags,
and bit 1 (`D3D_SVF_USED`) is set on exactly the variables the pixel program reads. :observed[test compilations: a pixel
program for both targets and a compute program with every kind of binding for 5.1]

`STAT` in a Shader Model 4 or 5 container is an array of 32-bit counters: 37 words (148 bytes) in the Shader Model 5.0 containers
of Sekiro and 29 words (116 bytes) in the 16 Shader Model 4.0 containers of Sledding Game. Word 0 is the number of instructions
(declarations not counted) and word 1 the register count of `dcl_temps`, in all 448 containers; word 20 equals the number of
`movc` instructions (0 to 7 per program) and word 18 the number of `sample_d` instructions (0 to 2) in all 448; words 14 and 15 equal
the number of `sample`, `sample_l`, `sample_d`, `sample_b` and `gather4` instructions and the number of load instructions in
444 and 446 of the 448. Words 2 (definitions), 10, 16 and 17 are `0` in all 448. :observed{games="sekiro sledding"} (In a Shader Model 6 container `STAT` is a second bitcode module instead.)

Microsoft's own reflection names the words. `D3DReflect` (`d3dcompiler_47`) returns a `D3D11_SHADER_DESC` for every container that
has the part, and word 0 equals its `InstructionCount`, word 1 `TempRegisterCount`, word 3 `DclCount`, word 4
`FloatInstructionCount`, word 5 `IntInstructionCount`, word 6 `UintInstructionCount`, word 7 `StaticFlowControlCount`, word 8
`DynamicFlowControlCount`, word 14 `TextureNormalInstructions`, word 15 `TextureLoadInstructions`, word 16
`TextureCompInstructions` and word 18 `TextureGradientInstructions`, in all 469 containers that have it: the 432 of Sekiro, the 16
of Sledding Game and 21 compiled with fxc 10.0.26100.0 from small sources (a word counts only where it is not zero in every
container). :observed[469 containers] Words 2, 9 to 13, 17 and 22 to 36 are `0` in all 448 game containers; word 19 and word 21 are
not zero and equal no count of the decoded instructions that was tried (all `mov`, the conversions); word 20 is not a field of that structure and equals the `movc` count
in the 466 of the 469 containers the decoder reads. :observed Shader Model 4.0 and 4.1 targets (including the level 9
targets) write 29 words (22 containers) and Shader Model 5.0 targets 37 (447). :observed[469 containers] In a hull program word 1 is the largest
`dcl_temps` of its phases, not their sum. :observed[the hull fixtures of two compilations]

Five more words describe how the program runs. Word 28 is 1 in a pixel program that runs once per sample (one that
interpolates an input per sample or reads the sample index) and 0 otherwise. Word 30 is a hull program's output control
points and a domain program's input control points. Word 31 is a hull program's tessellator output primitive
(`D3D_TESSELLATOR_OUTPUT_PRIMITIVE`: 1 point, 2 line, 3 clockwise triangles, 4 counter-clockwise triangles). Word 32 is its
partitioning (`D3D_TESSELLATOR_PARTITIONING`: 1 integer, 2 power of two, 3 odd fractional, 4 even fractional). Word 33 is the
tessellator domain of a hull or domain program (`D3D_TESSELLATOR_DOMAIN`: 1 isoline, 2 triangle, 3 quad). `D3DDisassemble`
(`d3dcompiler_47` 10.0.26100.4654) prints its tessellation tables and its "Pixel Shader runs at sample frequency" note from
these words. A listing written from them is identical to Microsoft's for every test compilation: hull and domain programs
over the isoline, triangle and quad domains, every partitioning and every output primitive, and pixel programs with and
without per-sample inputs. :observed[test compilations]

## Feature level 9 part (`Aon9`)

A program compiled for a Direct3D 9 feature level (`ps_4_0_level_9_1`, `vs_4_0_level_9_3` and the like) carries an `Aon9`
part. It holds a Shader Model 2 program, which the runtime runs on level 9 hardware in place of the Shader Model 4 token
stream, and tables that map the Shader Model 4 program's constant buffers, samplers and resources onto Direct3D 9
registers. :observed[test compilations] All offsets below are bytes from the start of the part, and every count and
offset is a `u16` pair: the count, then the offset of the table.

| Word | Field | Confidence |
|---|---|---|
| 0 | The part's size in bytes | :observed[test compilations] |
| 1 | A Direct3D 9 version token: the program's version at the feature level's minimum (`vs_2_0` for a `vs_2_x` program) | :observed[test compilations] |
| 2 | The Direct3D 9 program's size in bytes | :observed[test compilations] |
| 3 | The program's offset in the part | :observed[test compilations] |
| 4 | Constant buffer ranges copied into float constants: 12-byte rows | :observed[test compilations] |
| 5 | Constant buffer components copied into int constants (`i#`): 8-byte rows | :observed[test compilations] |
| 6 | Constant buffer components copied into bool constants (`b#`): 8-byte rows | :observed[test compilations] |
| 7 | Sampler mappings: 4-byte rows | :observed[test compilations] |
| 8 | Constants the runtime fills: 4-byte rows | :observed[test compilations] |

The rows of the tables:

- A constant buffer range is four `u16`s: the buffer (`cb#`), its first register, the register count and the first
  float constant (`c#`) it goes to. Then come four bytes, one per component x to w, that say how the component
  converts: 0 float, 1 bool, 2 int, 3 uint. :observed[test compilations]
- An int or bool row is four `u16`s: the buffer, its register, the component (0 to 3 for x to w) and the `i#` or `b#`
  register it goes to. :observed[test compilations]
- A sampler row is four bytes: the Shader Model 4 resource (`t#`), the Shader Model 4 sampler (`s#`), the Direct3D 9
  sampler register, and a byte that is 0 in every row. :observed[test compilations]
- A runtime row is two `u16`s: the kind and the float constant it fills. Kind 0, the only kind seen, is what
  `D3DDisassemble` calls the "Vertex Shader position offset". :observed[test compilations]

The layout was read from fxc 10.0.26100.4654 builds that cover every combination the tables have:
- no constants;
- float, int, uint and bool constants from several buffers;
- loops over int constants and branches on bool constants;
- several texture and sampler pairs;
- vertex and pixel programs at levels 9_1 and 9_3.

For every build, the tables and the program written from this layout are identical to `D3DDisassemble`'s listing.
:observed[test compilations]

`SFI0` is a 64-bit mask of the shader features the program needs. The 20 Sledding Game containers whose mask is `0x10` all have
bit 5 of `dcl_global_flags` set (minimum precision) and `ISG1`/`OSG1` parts. The one whose mask is `0x2` declares a raw or
structured resource in a Shader Model 4.0 pixel program, has global flags `0x9` (no forced early depth-stencil) and no other
feature, so bit 1 reads as raw and structured buffers in Shader Model 4.x. :observed{games="sledding"} Compiling with fxc
10.0.26100.0 settles the other reading of bit 1 (early depth-stencil): a `ps_4_0` program that reads a `ByteAddressBuffer`
gets `SFI0` equal to `0x2` and the global flag `enableRawAndStructuredBuffers`, while a `ps_5_0` program with `[earlydepthstencil]`
(`forceEarlyDepthStencil`) gets no `SFI0` part and fxc lists "Early depth-stencil" separately. :observed[test compilations] So no
SFI0 bit is early depth-stencil, which fits the 24 Riders Republic programs that force it and carry no `SFI0` part.
:observed{games="riders-republic"}

Programs compiled to need one feature each give the bit names. fxc 10.0.26100.0 (targets `4_0` to `5_0`) sets bit 0 for
double-precision floating point, 1 raw and structured buffers (Shader Model 4.x), 2 UAVs at every shader stage, 3 more than 8
UAV slots, 4 minimum-precision data types, 5 the 11.1 double-precision extensions, 6 the 11.1 shader extensions, 7 comparison
filtering at feature level 9 (a `ps_4_0_level_9_1` target), 8 tiled resources, 9 a pixel shader's stencil reference output, 10
inner coverage, 11 typed UAV loads of additional formats, 12 raster-ordered views and 13 a render-target or viewport array index
from any shader that feeds the rasterizer; each compiled container's `SFI0` equals the compiler's own listing of what the program
requires. :observed[test compilations of one program per feature] The bits 14 and up are not produced by fxc.

## Class linkage part (`IFCE`)

A Shader Model 5 program that uses class linkage (dynamic shader linkage: interfaces whose implementation is chosen when
the program is bound) carries an `IFCE` part. It lists the classes that implement the interfaces, the class instances
the constant buffers hold, and which function tables each interface slot can be bound to. :observed[test compilations]
None of the games' Shader Model 4 and 5 programs uses class linkage (none declares an interface or a function table),
and none carries the part. :observed{games="sekiro riders-republic sledding"} Offsets are bytes from the start of the part; names are
zero-terminated strings after the tables.

```layout
title: IFCE header
size: 36
fields:
  - {at: 0, size: 4, type: u32, name: instance count, level: observed}
  - {at: 4, size: 4, type: u32, name: class type count, level: observed}
  - {at: 8, size: 4, type: u32, name: slot record count, level: observed}
  - {at: 12, size: 4, type: u32, name: interface slot count, level: observed, note: "all the slots, an interface array taking one per element"}
  - {at: 16, size: 4, type: u32, name: instance table offset, level: observed, note: "16-byte records"}
  - {at: 20, size: 4, type: u32, name: class type table offset, level: observed, note: "12-byte records"}
  - {at: 24, size: 4, type: u32, name: slot record table offset, level: observed, note: "16-byte records"}
  - {at: 28, size: 8, type: "u32[2]", name: reserved, level: unknown, note: "0 in every container seen"}
```

```layout
title: IFCE class type record
size: 12
fields:
  - {at: 0, size: 4, type: u32, name: name offset, level: observed}
  - {at: 4, size: 2, type: u16, name: reserved, level: unknown, note: "0 in every container seen"}
  - {at: 6, size: 2, type: u16, name: constant buffer stride, level: observed, note: "the registers one instance's data takes"}
  - {at: 8, size: 2, type: u16, name: texture count, level: observed}
  - {at: 10, size: 2, type: u16, name: sampler count, level: observed}
```

```layout
title: IFCE class instance record
size: 16
fields:
  - {at: 0, size: 4, type: u32, name: name offset, level: observed}
  - {at: 4, size: 2, type: u16, name: class type, level: observed, note: "its place in the class type table"}
  - {at: 6, size: 2, type: u16, name: count, level: observed, note: "more than 1 for an instance array"}
  - {at: 8, size: 2, type: u16, name: constant buffer, level: observed, note: "0xffff for a class without data"}
  - {at: 10, size: 2, type: u16, name: buffer register, level: observed, note: "where its data starts; 0xffff without data"}
  - {at: 12, size: 2, type: u16, name: first texture, level: observed, note: "0xffff where it holds none"}
  - {at: 14, size: 2, type: u16, name: first sampler, level: observed, note: "0xffff where it holds none"}
```

```layout
title: IFCE slot record
size: 16
fields:
  - {at: 0, size: 4, type: u32, name: slot span, level: observed, note: "the slots of one interface pointer or array"}
  - {at: 4, size: 4, type: u32, name: entry count, level: observed}
  - {at: 8, size: 4, type: u32, name: class type list offset, level: observed, note: "a u16 class type per entry"}
  - {at: 12, size: 4, type: u32, name: function table list offset, level: observed, note: "a u32 function table per entry, at the same place as its class type"}
```

The layout was read from fxc 10.0.26100.4654 builds with one to thirty classes per interface, interface arrays, several
interfaces, classes with data, textures and samplers, instance arrays, and pixel and hull programs. For each build,
tables written from this layout are identical to the ones `D3DDisassemble` prints. :observed[test compilations]

## Debug information of a Direct3D 9 program (`DBUG`)

`fxc /Zi` stores debug information in a Direct3D 9 program as a comment whose first word is the FourCC `DBUG`. A
Direct3D 9 program compiled on its own carries it, and so does the Direct3D 9 program in the `Aon9` part of a level 9
container (the Shader Model 4 program beside it has its debug information in an `SPDB` part). It records the source
files, the source line of each declaration, definition and instruction, and which components of which variables each
instruction writes. :observed[test compilations] Offsets are bytes from the word after the FourCC; strings are
zero-terminated.

```layout
title: DBUG header
size: 40
fields:
  - {at: 0, size: 4, type: u32, name: main source path offset, level: observed}
  - {at: 4, size: 4, type: u32, name: compiler name offset, level: observed, note: "Microsoft (R) HLSL Shader Compiler 10.1"}
  - {at: 8, size: 4, type: u32, name: reserved, level: unknown, note: "0 in every program seen"}
  - {at: 12, size: 4, type: u32, name: source file count, level: observed}
  - {at: 16, size: 4, type: u32, name: source file table offset, level: observed, note: "a u32 path offset per file; an included file is one more"}
  - {at: 20, size: 4, type: u32, name: line record count, level: observed, note: "one per declaration, definition and instruction"}
  - {at: 24, size: 4, type: u32, name: line record table offset, level: observed, note: "8-byte records"}
  - {at: 28, size: 4, type: u32, name: variable count, level: observed}
  - {at: 32, size: 4, type: u32, name: variable table offset, level: observed, note: "20-byte records, in name order"}
  - {at: 36, size: 4, type: u32, name: entry point name offset, level: observed}
```

```layout
title: DBUG line record
size: 8
fields:
  - {at: 0, size: 2, type: u16, name: line, level: observed, note: "0 where the file is 0xffff"}
  - {at: 2, size: 2, type: u16, name: source file, level: observed, note: "its place in the file table; 0xffff for a record with no line, as a declaration has"}
  - {at: 4, size: 4, type: u32, name: byte offset, level: observed, note: "of the record's token, from the program's version token"}
```

```layout
title: DBUG variable record
size: 20
fields:
  - {at: 0, size: 4, type: u32, name: scope name offset, level: observed, note: "the function or constant buffer it is in; 0 for a local and for a function's return value"}
  - {at: 4, size: 4, type: u32, name: name offset, level: observed, note: "a function's return value is named by the function"}
  - {at: 8, size: 4, type: u32, name: type offset, level: observed, note: "a 16-byte type record laid out as the constant table's (class, type, rows, columns, elements, member count, member offset)"}
  - {at: 12, size: 4, type: u32, name: location count, level: observed}
  - {at: 16, size: 4, type: u32, name: location table offset, level: observed, note: "12-byte records"}
```

```layout
title: DBUG location record
size: 12
fields:
  - {at: 0, size: 4, type: u32, name: instruction, level: observed, note: "its place in the line record table"}
  - {at: 4, size: 8, type: "u16[4]", name: components, level: observed, note: "the variable's component in destination lanes x, y, z and w; 0xffff for a lane that holds none of it"}
```

A variable's components are counted over the whole variable: a struct's members follow one another in member order (a
struct of a `float4`, a `float2` and a `float` has components 0 to 6), a matrix's and an array's elements likewise.
:observed[test compilations] The line records follow the program's records in stream order, and the location of a
variable names its instruction by that order. :observed[test compilations]

`D3DDisassemble` prints this information. Before a record whose file differs from the last record that had a line, it
prints a blank line and `#line N "path"`. Where the file is the same and the line moves by more than 2 either way, it
prints a blank line and `#line N`; a move of 1 or 2 prints nothing. After the record, it prints the variables written,
`  // name<components>`, separated by `, ` in variable table order, with the components of the lanes that hold one in
lane order. A parameter of the entry point is printed by its bare name (`p<0,1,2,3>`), a variable of another function
or of a constant buffer as `scope::name` (`twist::v`, `C::k`), and a local or a return value as `::name`. Flag `0x10`
(`D3D_DISASM_DISABLE_DEBUG_INFO`) leaves all of it out. Listings written by these rules are identical to Microsoft's.
:observed[test compilations: 10 vs_2_0 to ps_3_0 programs and the Direct3D 9 programs of 16 level 9 containers, with
and without /Od, under every flag word]

## Debug information in Shader Model 4 and 5 (`SPDB`)

`fxc /Zi` stores a program database in an `SPDB` part: a PDB in Microsoft's multi-stream file format (MSF 7.00),
the same container a C++ compiler's PDB uses. It says the source line of each instruction, the inlined calls, and
which register component holds which part of each variable over which instructions. :observed[test compilations and
the 16 Sledding Game containers] In every one the blocks are 512 bytes, the file has 16 streams and the DBI stream
lists one module. :observed[92 test compilations and the 16 Sledding Game containers] Sixteen of Sledding Game's 4,854
programs carry the part (see the part sets above); they hold no inlined calls. :observed{games="sledding"}

The streams that carry the program's information:

| Stream | What it holds | Confidence |
|---|---|---|
| 1, PDB info | the named stream map, which names the string table `/names` | :observed[test compilations and the 16 Sledding Game containers] |
| 2, TPI | the variables' types | :observed[test compilations and the 16 Sledding Game containers] |
| 3, DBI | the module list; the module's record names its stream and the sizes of its symbols and C13 line information | :observed[test compilations and the 16 Sledding Game containers] |
| the module's stream | the symbols, then the C13 subsections: file checksums (`0xf4`, each naming a source path in `/names`), lines (`0xf2`, the line of each instruction's byte offset in the token stream) and inlinee lines (`0xf6`, the first line of each inlined function) | :observed[test compilations and the 16 Sledding Game containers] |

The symbols are a function (`S_GPROC32`), its inlined calls (`S_INLINESITE` and `S_INLINESITE_END`, whose binary
annotations give the lines of the inlined instructions), its variables (`S_LOCAL`) and, after each variable, the
ranges in which a register holds part of it (`S_DEFRANGE_HLSL`, `0x1150`). :observed[test compilations and the 16
Sledding Game containers] The types the variables use include the HLSL leaves `LF_HLSL` (`0x1517`, an HLSL object type;
kind `0x200` is an interface pointer of four words), `LF_VECTOR` (`0x151b`: element type, count, size), `LF_MATRIX`
(`0x151c`: element type, rows, columns, major stride, bit 0 of the next byte row-major) and `LF_STRIDED_ARRAY`
(`0x1516`: element type, index type, stride). :observed[test compilations]

```layout
title: S_DEFRANGE_HLSL data (after the record's length and kind)
size: variable
fields:
  - {at: 0, size: 2, type: u16, name: register type, level: observed, note: "the operand type of the token stream (0 r#, 1 v#, 2 o#, 3 x#, 16 m#, 25 vicp, ...)"}
  - {at: 2, size: 2, type: u16, name: flags, level: observed, note: "bits 0 and 1: the number of register indices at the end (0 to 2)"}
  - {at: 4, size: 2, type: u16, name: offset in the variable, level: observed, note: "the byte of the variable the register component holds"}
  - {at: 6, size: 2, type: u16, name: size, level: observed}
  - {at: 8, size: 4, type: u32, name: range start, level: observed, note: "the byte offset in the token stream of the first instruction the location holds for"}
  - {at: 12, size: 2, type: u16, name: section, level: observed}
  - {at: 14, size: 2, type: u16, name: range length, level: observed}
  - {at: 16, size: "4 per gap", type: "(u16, u16)[]", name: gaps, level: observed, note: "start from the range start and length of each stretch where the register holds something else"}
  - {at: "end - 4 per index", size: "4 per index", type: "u32[]", name: register indices, level: observed, note: "the first is the register times 16 plus the component times 4; for x# and m# the register alone; a second is the outer index (an indexable temp's array, a control point)"}
```

`D3DDisassemble` prints the part in the listing, and these rules give Microsoft's text byte for byte:
- Before the first record whose byte offset has a line, `#line N "path"` with no blank line before it. After that,
  where the line or the file changes, a blank line and `#line N`, with the path where the file changes or the
  instruction is a `label`. An instruction inside an inlined call takes the line of the innermost call's annotation
  row that covers it, not the line table's. Unlike the Direct3D 9 comment, every change of line is printed.
- Before that first instruction, the variables held in a register from the start: `// Initial variable locations:`,
  then a line for each run of locations in the same register, `//   r0.x <- c.x; r0.y <- c.y; `, the runs joined by
  `; `.
- After an instruction (not a declaration), the locations whose range or a gap's end is at the next instruction's
  offset, `  // r1.x <- uv.x; r1.y <- uv.y`, after `else` as `  // Prior locations: ...`. Each names the register
  and the variable with the member path its offset falls in, from the types: `.member`, `[n]`, `._mRC` for a matrix
  element, `.x` to `.w` for a vector component. An indexable temp's array is named whole (`x0 <- arr`).
- Flag `0x10` leaves all of it out.

:observed[the listings of 92 test compilations with and without /Od under 23 flag words, and of the 16 Sledding
Game containers]

## Shader Model 4 and 5 token streams

Over the 7,729 Shader Model 4 and 5 programs of Sekiro, Riders Republic and Sledding Game, every instruction and declaration
walks cleanly by its length field to the end of the program, and a strict decoder reads all of them with no refusal.
:observed[7,729 containers; Sekiro 54,945, Riders Republic 563,505, Sledding Game 2,796,869 instructions]
The longest instruction is 20 words (`bfi`, Riders Republic); 17 words in Sledding Game and 15 in Sekiro. Only `customdata` (the
immediate constant buffer, up to 258 words) is longer than 32 words. There is no `interface_call`, `dcl_interface`,
`dcl_function_body` or `dcl_function_table`, no 64-bit immediate, no register-space word (Shader Model 5.1) and no extended
operand other than the modifier kind. The `Input` operand has two index dimensions in the 47 uses in Riders Republic's hull
programs and the 43 in its geometry programs; the nine domain programs use no plain `Input` operand. :observed

Shader Model 5.1 adds an index to the operands of resources. A texture, sampler or unordered-access view operand has two
indices, the declaration's id and the register (`T1[r1.x + 4]` reads register 4 plus `r1.x` of the range declared with
id 1), and a constant buffer operand three: the id, the register and the row (`CB1[r0.w + 0][0]`). A binding
declaration's operand has three indices, the id and the first and last register of its range, the last `0xffffffff` for
an array with no stated size (`T0[0:*]`), and the declaration ends in one more word, the register space. A constant
buffer declaration states its row count in a word of its own before the space, where 5.0 states it as the operand's
second index. `NonUniformResourceIndex` marks the texture operand with an extended operand token of the modifier kind
whose bit 17 is set. :observed[test compilations of a pixel and a compute program, read against fxc's disassembly of
them]

Every instruction has the operand count its opcode's format gives it. The formats are the table of destination and source operands that vkd3d's reader and DXVK's decoder both publish, whose
counts agree for each of the 166 opcodes both list; the 3,415,319 instructions of the 7,729 programs have the stated count, with none left over.
:proven[7,729 containers; Sekiro 54,945, Riders Republic 563,505, Sledding Game 2,796,869 instructions] The operand that the format marks as a register with no data of its own (a resource, sampler,
unordered-access view, thread-group memory or output stream) is exactly the operand that holds such a register, in every instruction. :proven[7,729 containers]
A destination is chosen by a write mask, except the depth output, a one-lane register (8 times in Riders Republic and 16 in Sledding Game). :proven[7,729 containers]
A negate or absolute-value modifier is a property of the operand and is written on integer operands as well (`iadd` with a negated source occurs in Sledding Game). :observed
Of the 180 opcodes with a format, 109 occur in these programs (53 in Sekiro, 105 in Riders Republic, 82 in Sledding Game); the other 71 rest on the public tables alone, `uaddc` and `usubb` on
Microsoft's reference, which gives them two destinations and two sources. :observed
vkd3d's disassembler, run as a program over 600 sampled containers of the three games, prints the same instruction sequence as a decode of the token stream (182,560 instructions), the same
signature elements (4,730) and the same part directory. :observed
Microsoft's `D3DDisassemble` (`d3dcompiler_47`) agrees with this reading on every program of two of the games. A listing written from the
container as this page reads it (signatures, `RDEF`, the `STAT` words and the token stream) is byte for byte the listing Microsoft prints
with flag word `0`, for all 2,443 containers of Riders Republic's pack (1,156 pixel, 736 compute, 526 vertex, 9 hull, 9 domain, 7 geometry)
and all 432 of Sekiro's programs. :proven[every container of both games]{games="sekiro riders-republic"} For Sekiro it is also the same
under each of the flags `0x04` (instruction numbering), `0x20` (instruction offsets), `0x40` (instructions only) and `0x80` (hexadecimal
literals), each set alone. :proven[Sekiro's 432 programs, d3dcompiler_47 10.0.26100.4654]{games="sekiro"}

The version tokens of the 7,729 programs are pixel 4.0 (3,316) and 5.0 (3,084), vertex 5.0 (568), compute 5.0 (736),
domain 5.0 (9), geometry 5.0 (7) and hull 5.0 (9). :proven[7,729 containers]

The opcode token's bits 11 to 23 are control bits whose meaning depends on the opcode. These are the ones with a meaning that
the programs use beyond the saturate bit, a conditional's test and a declaration's dimension, interpolation or sampler mode:

| Opcode | Token bits | Meaning | In the programs | Confidence |
|---|---|---|---|---|
| an arithmetic instruction | 19 to 22 | the `precise` mask: bit 0 for x to bit 3 for w, the lanes the instruction is marked `precise` for | 4,960 instructions of Riders Republic's programs; none in Sekiro or Sledding Game | :proven[7,729 containers] |
| `sync` | 11 to 14 | what it waits for: threads in the group (`_t`), group shared memory (`_g`), unordered-access views within the group (`_ugroup`), across all groups (`_uglobal`) | 27 `sync_g` and 218 `sync_g_t`, all in Riders Republic's compute programs | :proven[7,729 containers] |
| `resinfo`, `sample_info` | 11 and 12 | the return type: 0 float, 1 reciprocal float (`resinfo`), 2 unsigned integer (`resinfo`); 1 is unsigned integer for `sample_info` | `resinfo_uint` 14 times in Riders Republic and once in Sledding Game, `sampleinfo_uint` once in Sledding Game; never the reciprocal | :proven[7,729 containers] |
| `dcl_globalFlags` | 11 to 16 | bit 0 `refactoringAllowed`, 1 `enableDoublePrecisionFloatOps`, 2 `forceEarlyDepthStencil`, 3 `enableRawAndStructuredBuffers`, 4 `skipOptimization`, 5 `enableMinimumPrecision` | Sekiro: `refactoringAllowed` alone in all 432. Riders Republic: alone in 2,419, with `forceEarlyDepthStencil` in 24. Sledding Game: alone in 1,538, with raw and structured buffers in 1 and with minimum precision in 20 (1,559 of its programs state flags) | :proven[7,729 containers] |

The geometry and tessellation declarations keep their value in the control bits or in the word after the token. Riders Republic's
7 geometry programs declare a triangle input (`dcl_inputprimitive` bits 11 to 16, the value 3), a triangle-strip output
(`dcl_outputtopology`, 5) and a vertex count in the word after `dcl_maxout`, 3 in six programs and 12 in one. Its 9 hull and 9
domain programs declare 4 input control points (bits 11 to 16 of `dcl_input_control_point_count`, in both stages) and the hull
programs 4 output control points, the quad domain (bits 11 to 13, the value 3), fractional-odd partitioning (3) and clockwise
triangle output (3), a largest tessellation factor in a float word after `dcl_hs_max_tessfactor` (15.0 in eight programs,
64.0 in one) and a fork phase with an instance count of 2 in one program and 4 in another. No program declares a join phase
instance count. :proven[the 7 geometry, 9 hull and 9 domain programs]{games="riders-republic"} The values are Direct3D's own
numbers as the token stores them: `D3D_PRIMITIVE` (1 point, 2 line, 3 triangle), `D3D_PRIMITIVE_TOPOLOGY` (1 point list, 3 line
strip, 5 triangle strip), `D3D11_TESSELLATOR_DOMAIN` (1 isoline, 2 triangle, 3 quad), `D3D11_TESSELLATOR_PARTITIONING` (1
integer, 2 power of two, 3 fractional odd, 4 fractional even) and `D3D11_TESSELLATOR_OUTPUT_PRIMITIVE` (1 point, 2 line, 3
triangle clockwise, 4 triangle counter-clockwise). :observed[test compilations and the names fxc's disassembler prints for the values]

:::open[Where do the 984 other skate. containers come from?]
The wiki's census of skate. counts 20,429 `CompiledBytecode` entries; the 19,445 containers counted above are distinct resources.
Whether the difference is entries repeated across table-of-contents files is not established.
:::
