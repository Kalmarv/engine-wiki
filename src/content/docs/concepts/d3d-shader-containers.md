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

`SFI0` is a 64-bit mask of the shader features the program needs. The 20 Sledding Game containers whose mask is `0x10` all have
bit 5 of `dcl_global_flags` set (minimum precision) and `ISG1`/`OSG1` parts. The one whose mask is `0x2` declares a raw or
structured resource in a Shader Model 4.0 pixel program, has global flags `0x9` (no forced early depth-stencil) and no other
feature, so bit 1 reads as raw and structured buffers in Shader Model 4.x. :observed{games="sledding"} One container is too few to rule out
the other reading of bit 1 (early depth-stencil); none of the 24 Riders Republic programs that force early depth-stencil carries an
`SFI0` part at all. :observed{games="riders-republic"}

## Shader Model 4 and 5 token streams

Over the 7,729 Shader Model 4 and 5 programs of Sekiro, Riders Republic and Sledding Game, every instruction and declaration
walks cleanly by its length field to the end of the program, and a strict decoder reads all of them with no refusal.
:observed[7,729 containers; Sekiro 54,945, Riders Republic 563,505, Sledding Game 2,796,869 instructions]
The longest instruction is 20 words (`bfi`, Riders Republic); 17 words in Sledding Game and 15 in Sekiro. Only `customdata` (the
immediate constant buffer, up to 258 words) is longer than 32 words. There is no `interface_call`, `dcl_interface`,
`dcl_function_body` or `dcl_function_table`, no 64-bit immediate, no register-space word (Shader Model 5.1) and no extended
operand other than the modifier kind. The `Input` operand has two index dimensions in the 47 uses in Riders Republic's hull
programs and the 43 in its geometry programs; the nine domain programs use no plain `Input` operand. :observed

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
| 1.10 | 52 bytes | 24 bytes | 19,240 skate. (86 without resources) |

:observed{games="skate elden-ring"}

## Shader Model 6 feature mask and metadata

`SFI0` appears in every DXIL container. Its bits equal what the module uses: bit 14 is set exactly when the module calls a wave
or quad operation (1,053 of 19,445 skate. modules, and 2 of 50,283 Elden Ring modules, none without); bit 3 exactly when the
module declares more than 8 UAV slots (17 skate. modules); bit 25 exactly when it creates a handle from the descriptor heap (8
skate. modules); and bit 20 is set in all 100 modules that use a ray query (16 more modules set it without one). The mask is `0`
in 18,114 skate. modules and 50,278 Elden Ring modules. :observed{games="skate elden-ring"}

The `dx.entryPoints` record's properties list pairs a tag with a value. The tags present are `0` (the shader flags), `1`
(geometry), `2` (domain), `3` (hull), `4` (compute thread group), `5`, `6`, `7` and `8` (library auto-binding space, ray payload
and attribute sizes, shader kind) and `9` (mesh); no module has tags `10` to `12` or `23`. Vertex and pixel programs
carry `[0]` (3,271 skate. pixel and 135 skate. vertex entry points have no properties record), compute programs `[0, 4]` or `[4]`,
geometry programs `[0, 1]` or `[1]`, domain programs `[0, 2]` or `[2]`, hull programs `[3]`, the mesh program `[9]`, and
libraries `[0]`, `[5, 8]`, `[5, 6, 8]` or `[5, 6, 7, 8]`. The flags value is `16` in
the great majority of programs (skate. 6,684 pixel, 3,206 vertex, 3,001 compute; Elden Ring 10,899 pixel, 18,642 vertex); other values
occur in compute programs and libraries. :observed{games="skate elden-ring"}

A signature element's metadata record has 11 operands; the last is a tail list of tag and value pairs, null in 7,418 of skate.'s
145,462 elements and 86,015 of Elden Ring's 545,303, and otherwise only tag `3` (a component mask). Tags `0` (stream) and
`2` (dynamic-index mask) never occur. The semantic-index list of an element runs `first`, `first + 1`, … and is as long as the
element's row count in every element. :observed{games="skate elden-ring"}

A resource record has 8 operands (constant buffer, sampler), 9 (SRV) or 11 (UAV) in every record; the trailing tag list holds
tag `0` (element type) or tag `1` (structure stride) only. :observed{games="skate elden-ring"}

No program has a string function attribute: the libraries of skate. have none, and those of Elden Ring only the standard attributes
(`disable-tail-calls`, `less-precise-fpmad`, `no-frame-pointer-elim`, `no-infs-fp-math`, `no-nans-fp-math`, `no-realign-stack`,
`stack-protector-buffer-size`, `unsafe-fp-math`, `use-soft-float`), so no module sets a float-denormal mode. :observed{games="skate elden-ring"}

Instruction attachments name `dx.controlflow.hints`, `tbaa`, `noalias`, `alias.scope`, `llvm.loop`, `range` and `dx.precise`.
`dx.precise` occurs only in skate.: 107,109 times in vertex programs and 360 in compute programs, never in pixel programs, and
never in Elden Ring (18.0 million floating-point add, subtract, multiply, divide and remainder instructions in its modules). `dx.nonuniform` does not occur in
either. :observed{games="skate elden-ring"}

The address spaces of the modules are `0` and `3` only: 431,441 skate. pointer types and 1,114,031 Elden Ring ones are in space
`0`, 6,587 and 66 in space `3` (group shared), and every global variable is in space `0` (34,764 in the two games, 32,461 of them constant) or `3` (8,516). A pointer type's
second operand is the address space, so 264 skate. modules (392 pointee types) have a pointee type
that appears under both spaces; no Elden Ring module does. :observed{games="skate elden-ring"}

:::open[Where do the 984 other skate. containers come from?]
The wiki's census of skate. counts 20,429 `CompiledBytecode` entries; the 19,445 containers read here are distinct resources.
Whether the difference is entries repeated across table-of-contents files is not established.
:::
