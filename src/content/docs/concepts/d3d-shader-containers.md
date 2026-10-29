---
title: Direct3D shader containers (DXBC and DXIL)
description: "How five games wrap compiled Direct3D shaders: the container digest and part sets, the signature, reflection and feature parts, and the pipeline-state record of Shader Model 6 programs, measured over the extracted programs."
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

`STAT` in a Shader Model 4 or 5 container is an array of 32-bit counters: 37 words (148 bytes) in the Shader Model 5.0 containers
of Sekiro and 29 words (116 bytes) in the 16 Shader Model 4.0 containers of Sledding Game. Word 0 is the number of instructions
(declarations not counted) and word 1 the register count of `dcl_temps`, in all 448 containers; word 20 equals the number of
`movc` instructions (0 to 7 per program) and word 18 the number of `sample_d` instructions (0 to 2) in all 448; words 14 and 15 equal
the number of `sample`, `sample_l`, `sample_d`, `sample_b` and `gather4` instructions and the number of load instructions in
444 and 446 of the 448. Words 2 (definitions), 10, 16 and 17 are `0` in all 448. :observed{games="sekiro sledding"} (In a Shader Model 6 container `STAT` is a second bitcode module instead; see below.)

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

## Shader Model 4 and 5 token streams

Over the 7,729 Shader Model 4 and 5 programs of Sekiro, Riders Republic and Sledding Game, every instruction and declaration
walks cleanly by its length field to the end of the program, and a strict decoder reads all of them with no refusal.
:observed[7,729 containers; Sekiro 54,945, Riders Republic 563,505, Sledding Game 2,796,869 instructions]
The longest instruction is 20 words (`bfi`, Riders Republic); 17 words in Sledding Game and 15 in Sekiro. Only `customdata` (the
immediate constant buffer, up to 258 words) is longer than 32 words. There is no `interface_call`, `dcl_interface`,
`dcl_function_body` or `dcl_function_table`, no 64-bit immediate, no register-space word (Shader Model 5.1) and no extended
operand other than the modifier kind. The `Input` operand has two index dimensions in the 47 uses in Riders Republic's hull
programs and the 43 in its geometry programs; the nine domain programs use no plain `Input` operand. :observed

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

## Shader Model 6: pipeline-state record (`PSV0`)

Every program (not library) container of skate. and Elden Ring has a `PSV0` part: the runtime-info structure, the resource
bindings, a string table, a semantic-index table, the signature elements, and the dependency tables the runtime checks the program against.

```layout
title: PSV0 part
size: variable
games: [skate, elden-ring]
note: Little-endian. The sizes shown are those of validator 1.10 (skate.); validator 1.6 (Elden Ring) writes a 48-byte runtime info, validator 1.5 a 36-byte one and a 16-byte resource record.
fields:
  - {at: 0, size: 4, type: u32, name: runtime info size, value: "52", level: observed, note: "36 (validator 1.5), 48 (1.6), 52 (1.10)"}
  - {at: 4, size: 16, type: "u32[4]", name: stage-specific words, level: observed, note: "vertex: output position present; pixel: byte 0 depth output present, byte 1 per-sample frequency (set exactly when the program reads the sample index); hull: input control points, output control points, tessellator domain, output primitive; geometry: input primitive, output topology, stream mask, position present; domain: input control points"}
  - {at: 20, size: 8, type: "u32[2]", name: wave lane range, level: unknown, note: "0 and 0xffffffff in every container"}
  - {at: 28, size: 1, type: u8, name: shader stage, level: observed, note: "equals the program kind in the DXIL header (0 pixel ... 5 compute, 13 mesh)"}
  - {at: 29, size: 1, type: u8, name: uses view id, level: observed, note: "0 in every container"}
  - {at: 30, size: 2, type: u16, name: stage word, level: observed, note: "geometry: maximum vertex count; hull and domain: low byte is the patch-constant vector count"}
  - {at: 32, size: 4, type: "u8[4]", name: signature element counts, level: observed, note: "inputs, outputs, patch constants, then the input vector count"}
  - {at: 36, size: 4, type: "u8[4]", name: output vector counts, level: observed, note: "one per stream; stream 0 first"}
  - {at: 40, size: 12, type: "u32[3]", name: thread group size, level: observed, note: "compute only, 0 elsewhere; present in the 48- and 52-byte runtime info"}
  - {at: 52, size: 4, type: u32, name: entry name, level: observed, note: "byte offset in the string table; present in the 52-byte runtime info"}
```

After the runtime info come a resource count and, when it is not zero, a record size and the records; then a string-table size and
the table; a semantic-index count and the 32-bit indices; the signature element size and the input, output and patch-constant
elements; and last the dependency tables. :observed

Resource record: resource type, register space, lower bound, upper bound, then (24-byte record) the resource kind and flags.
Types are `1` sampler, `2` constant buffer, `3` typed SRV, `4` raw SRV, `5` structured SRV, `6` typed UAV, `7` raw UAV, `8`
structured UAV and `9` structured UAV with a counter (142 in skate.); the kind equals the metadata kind for every SRV and UAV
(typed kinds 1 to 10, raw `11`, structured `12`), and is `13` for every constant buffer and `14` for every sampler (the 41 records of the 16-byte form, in 10 Elden Ring
containers, have no kind or flags). Records are
ordered constant buffers, then samplers, SRVs and UAVs. The flags word is `0` in every record. :observed

Signature element, 16 bytes: name offset, semantic-index offset, rows, start row, a byte of columns (bits 0 to 3), start
column (bits 4 and 5) and an "allocated" bit (bit 6), the semantic kind, the component type, the interpolation mode, a byte
that is `0` in every element (read as a dynamic-index mask in bits 0 to 3 and a stream in bits 4 and 5), and a reserved byte,
also `0`. The semantic kinds and interpolation modes use the numbers of the `dx.entryPoints` metadata. The component types do
not: PSV `1`, `2`, `3` are DXIL `5` (u32), `4` (i32), `9` (f32). A system-value element stores an empty name (57,897 of 57,897
in skate.); an arbitrary semantic stores the name the metadata has (87,565 of 87,565). :observed

The dependency tables that follow (no program uses view ids) are `input vectors × 4` rows of `ceil(output vectors × 4 / 32)`
words for stream 0 (the geometry programs write one stream). A hull program adds `input vectors × 4` rows of
`ceil(patch-constant vectors × 4 / 32)` words, and a domain program adds `patch-constant vectors × 4` rows of
`ceil(output vectors × 4 / 32)` words. The remainder of the part has exactly this size in every container. :observed

| Check against the metadata | skate. | Elden Ring |
|---|---|---|
| Containers with a `PSV0` | 19,240 of 19,445 (the 205 without are libraries) | 46,002 of 50,283 (the 4,281 without are libraries) |
| Resource count, class, space and bounds equal the `dx.resources` records | 19,240 | 46,002 |
| Resource kind equals the SRV or UAV kind in the record; constant buffers `13`, samplers `14` | all | all |
| Input, output and patch-constant elements equal the entry point's signature (name, index, rows, columns, kind, interpolation, placement) | 19,240 | 46,002 |
| Stage equals the program kind; thread group equals `numthreads` | 19,240; 5,780 | 46,002; 1,731 |
| Input and output vector counts equal the highest placed register plus rows | 19,240 | 46,002 |
| Hull, domain and geometry words equal the entry point's state | none present | 136 hull, 150 domain, 33 geometry |
| Dependency-table size equals the formula above | 19,240 | 46,002 |

:observed{games="skate elden-ring"}

| Validator (`dx.valver`) | Runtime info | Resource record | Containers |
|---|---|---|---|
| 1.5 | 36 bytes | 16 bytes | 10 Elden Ring |
| 1.6 | 48 bytes | 24 bytes | 45,992 Elden Ring (67 without resources, which have no record size) |
| 1.7 (dxc 1.7.2308) | 48 bytes | 24 bytes | 96 test compilations (7 without resources) |
| 1.10 | 52 bytes | 24 bytes | 19,240 skate. (86 without resources) |

:observed{games="skate elden-ring"}

## Shader Model 6 feature mask and metadata

`SFI0` appears in every DXIL container. Its bits equal what the module uses: bit 14 is set exactly when the module calls a wave
or quad operation (1,053 of 19,445 skate. modules, and 2 of 50,283 Elden Ring modules, none without); bit 3 exactly when the
module declares more than 8 UAV slots (17 skate. modules); bit 25 exactly when it creates a handle from the descriptor heap (8
skate. modules); and bit 20 is set in all 100 modules that use a ray query (16 more modules set it without one). The mask is `0`
in 18,114 skate. modules and 50,278 Elden Ring modules. :observed{games="skate elden-ring"} The bits set in the stock modules are
2, 3, 4, 11, 14, 15, 20 and 25, in 12 distinct non-zero masks of skate. and 2 of Elden Ring, and no stock mask sets a bit that the table below leaves unnamed.
:observed{games="skate elden-ring"}

dxc 1.7.2308 (Shader Model 6.0 to 6.7), run on one small program per feature, sets the bits below, and each container's `SFI0`
equals the compiler's own listing of what the program requires. Bit 0 is double-precision floating point, 2 UAVs at every
shader stage, 3 more than 8 UAV slots, 4 minimum-precision data types, 5 and 6 the 11.1 double and shader extensions, 8 tiled
resources, 9 a pixel shader's stencil reference output, 10 inner coverage, 11 typed UAV loads of additional formats, 12
raster-ordered views, 13 a render-target or viewport array index from any shader feeding the rasterizer (bits 0 to 13 are fxc's
too), 14 wave operations, 15 64-bit integers, 16 view instancing, 17 barycentrics, 18 native low precision, 19 shading rate,
20 ray queries (raytracing tier 1.1), 22 64-bit atomics on typed resources, 23 on group-shared memory, 24 derivatives in mesh and
amplification shaders, 25 resource descriptor heap indexing, 26 sampler descriptor heap indexing, 28 64-bit atomics on heap
resources, 29 advanced texture operations and 30 writeable MSAA textures. :observed[test compilations of one program per feature]
None of the test programs set bit 21 (sampler feedback; a sampler-feedback write compiled to a mask of 0), 27 or 31 and up, and bits 1 and 7 are known from fxc alone.

The `dx.entryPoints` record's properties list pairs a tag with a value. The tags present are `0` (the shader flags), `1`
(geometry), `2` (domain), `3` (hull), `4` (compute thread group), `5`, `6`, `7` and `8` (library auto-binding space, ray payload
and attribute sizes, shader kind) and `9` (mesh); no module has tags `10` to `12` or `23`. Vertex and pixel programs
carry `[0]` (3,271 skate. pixel and 135 skate. vertex entry points have no properties record), compute programs `[0, 4]` or `[4]`,
geometry programs `[0, 1]` or `[1]`, domain programs `[0, 2]` or `[2]`, hull programs `[3]`, the mesh program `[9]`, and
libraries `[0]`, `[5, 8]`, `[5, 6, 8]` or `[5, 6, 7, 8]`. The flags value is `16` in
the great majority of programs (skate. 6,684 pixel, 3,206 vertex, 3,001 compute; Elden Ring 10,899 pixel, 18,642 vertex); other values
occur in compute programs and libraries. :observed{games="skate elden-ring"}

The properties `5` to `8` of the libraries hold these. Tag `5` is a node with one integer, the register space that automatic
bindings take: `0` on the function entry of all 205 skate. and 4,281 Elden Ring libraries; compiled with `-auto-binding-space 3`
the library's own record, the one with no function, states `3` and the function's stays `0`. :observed[all libraries; a test compilation] Tag `6` is the ray payload size in bytes and tag `7` the hit-attribute size, both plain
integers (payloads of 4, 20 or 32 bytes in skate. and 4 or 12 in Elden Ring; attributes of 4 or 8 bytes in skate. and 8 in Elden
Ring), and tag `8` the shader kind: 7 ray generation, 8 intersection, 9 any hit, 10 closest hit, 11 miss, 12 callable. Of skate.'s
205 libraries 172 are ray generation, 6 intersection, 3 any hit, 16 closest hit and 8 miss. :observed{games="skate elden-ring"}
Two tags come from test compilations only: tag `10`, an amplification shader's state, is a node of the thread group and the
payload size in bytes (`[[8, 1, 1], 20]`), and tag `11`, a required wave size, a node with one integer (`[WaveSize(32)]` states
`[32]`). :observed[dxc 1.7.2308, one program each, equal to the `PSV0` part]

A signature element's metadata record has 11 operands; the last is a tail list of tag and value pairs, null in 7,418 of skate.'s
145,462 elements and 86,015 of Elden Ring's 545,303, and otherwise only tag `3`, the usage mask. Tags `0` (stream) and
`2` (dynamic-index mask) never occur in the programs. Test compilations show what they hold: tag `0` the stream number of a
geometry shader's output element written to a stream other than 0 (`[0, 1, 3, 15]` for stream 1), tag `2` the components of an
input array element indexed with a run-time value (`float4 a[3]` states `[2, 15, 3, 15]`: dynamic-index mask 15 beside usage mask
15). :observed[dxc 1.7.2308, one program each] The usage mask counts from the element's first component: dxc prints the signature table's
"Used" column in absolute components, and a scalar packed into component `w` states `1` in the mask where the column
shows `w`, a `float3` of which the program reads `y` states `2`. :observed[test compilations against the listing] The semantic-index list of an element runs `first`, `first + 1`, … and is as long as the
element's row count in every element. :observed{games="skate elden-ring"}

A resource record has 8 operands (constant buffer, sampler), 9 (SRV) or 11 (UAV) in every record; the trailing tag list holds
tag `0` (element type) or tag `1` (structure stride) only. :observed{games="skate elden-ring"}

After the shape, an SRV's operand 7 is its sample count (a `Texture2DMS<float4, 4>` states 4, any other view 0), and a UAV's operand 7
is the globally-coherent flag, operand 8 the flag for a hidden counter (an append, consume or `IncrementCounter` buffer) and operand 9
the rasterizer-ordered flag; a tag list that holds tag `3` marks a view that is the target of a 64-bit atomic. :observed[dxc 1.7.2308, one
program with each kind of view] In the programs one skate. SRV states a sample count of 2, three Elden Ring SRVs state 2 and four state 4, 147
skate. UAVs have a counter and none of Elden Ring's, and no record is globally coherent, rasterizer ordered or a 64-bit atomic target.
:observed{games="skate elden-ring"}

The module's attribute groups (the `PARAMATTR_GROUP` block) number 60,793 in skate. and 160,520 in Elden Ring. A group is a slot
(`0xFFFFFFFF` for the function itself, `0` for its result, `1` and up for its parameters) and attributes of three forms: a flag
(an LLVM kind number), an integer (a kind number and a value) and a string (a key and a value, or a key alone). The programs use
flags (101,896 and 268,620), strings in Elden Ring only (38,529) and no integer attribute. A function names its attribute list,
a list of group ids, by a 1-based index in operand 4 of its record. LLVM 3.7's kind numbers 9 `noalias`, 11 `nocapture`,
12 `noduplicate`, 17 `noreturn`, 18 `nounwind`, 20 `readnone`, 21 `readonly` and 39 `nonnull` are the ones dxc's listings
print for these groups. :observed{games="skate elden-ring"}

No program has a string function attribute: the libraries of skate. have none, and those of Elden Ring only the standard attributes
(`disable-tail-calls`, `less-precise-fpmad`, `no-frame-pointer-elim`, `no-infs-fp-math`, `no-nans-fp-math`, `no-realign-stack`,
`stack-protector-buffer-size`, `unsafe-fp-math`, `use-soft-float`), so no module sets a float-denormal mode. :observed{games="skate elden-ring"} The compiler writes the one string attribute
`"fp32-denorm-mode"` on the entry function when it is given `-denorm any`, `preserve` or `ftz`, with the option's word as the value;
compiled without the option the function has no attribute list. :observed[dxc 1.7.2308 on one pixel program with each option and without]

Instruction attachments name `dx.controlflow.hints`, `tbaa`, `noalias`, `alias.scope`, `llvm.loop`, `range` and `dx.precise`.
`dx.precise` occurs only in skate.: 107,109 times in 3,185 of 3,341 vertex programs and 360 times in 12 of 5,780 compute programs, never in pixel programs, and
never in Elden Ring (18.0 million floating-point add, subtract, multiply, divide and remainder instructions in its modules). `dx.nonuniform` does not occur in
either. :observed{games="skate elden-ring"} The attachment sits on `dx.op` calls: 88,541 `tertiary` (mad), 13,005 `loadInput`,
3,546 `unary`, 1,421 `dot3`, 331 `legacyF16ToF32`, 307 `binary`, 213 `dot4` and 105 `dot2`, and on no plain floating-point
instruction. :observed{games="skate"} The attachments of all instructions by kind: skate. `dx.controlflow.hints` 121,111, `dx.precise`
107,469, `tbaa` 42,568, `noalias` 13,060, `alias.scope` 3,683, `llvm.loop` 1,651 and `range` 7; Elden Ring `dx.controlflow.hints` 88,988,
`noalias` 15,817, `tbaa` 4,449, `range` 2,137 and `llvm.loop` 48. They are the 274,642 and 105,029 records of the function bodies'
attachment blocks, each an instruction index within the body and then pairs of a kind and a metadata node (a record with an even
count would attach to the function itself, and none does); every index lies inside its body and every node inside the module's
metadata. :observed{games="skate elden-ring"} dxc 1.7.2308 puts it on the `loadInput` calls that feed a `precise` value and not on the
arithmetic, in a test program. :observed[one test compilation]

The address spaces of the modules are `0` and `3` only: 431,441 skate. pointer types and 1,114,031 Elden Ring ones are in space
`0`, 6,587 and 66 in space `3` (group shared), and every global variable is in space `0` (34,764 in the two games, 32,461 of them constant) or `3` (8,516). A pointer type's
second operand is the address space, so 264 skate. modules (392 pointee types) have a pointee type
that appears under both spaces; no Elden Ring module does. :observed{games="skate elden-ring"}

:::open[Where do the 984 other skate. containers come from?]
The wiki's census of skate. counts 20,429 `CompiledBytecode` entries; the 19,445 containers counted above are distinct resources.
Whether the difference is entries repeated across table-of-contents files is not established.
:::
