---
title: Shader Model 6 parts and DXIL modules
description: "What the Shader Model 6 programs of skate. and Elden Ring hold: the pipeline-state record (PSV0), the feature mask (SFI0), the DXIL module's entry-point, signature, resource and attribute metadata, and how dxc lists a module."
games: [elden-ring, skate]
---

A Shader Model 6 program is a [DirectX container](/concepts/d3d-shader-containers/) whose `DXIL` part holds an LLVM 3.7
bitcode module. Beside it the container carries the pipeline-state record `PSV0` and the feature mask `SFI0`, which restate
parts of the module's metadata in fixed layouts. The counts below are
over the 19,445 containers of skate. and the 50,283 of Elden Ring that the [container page](/concepts/d3d-shader-containers/)
lists. :observed{games="skate elden-ring"}

## Pipeline-state record (`PSV0`)

Every program (not library) container of skate. and Elden Ring has a `PSV0` part: the runtime-info structure, the resource
bindings, a string table, a semantic-index table, the signature elements, and the dependency tables the runtime checks the program against.

```layout
title: PSV0 part
size: variable
games: [skate, elden-ring]
note: Little-endian. The sizes shown are those of validator 1.10 (skate.); validator 1.6 (Elden Ring) writes a 48-byte runtime info, validator 1.5 a 36-byte one and a 16-byte resource record, validator 1.0 a 24-byte one.
fields:
  - {at: 0, size: 4, type: u32, name: runtime info size, value: "52", level: observed, note: "24 (validator 1.0), 36 (1.1 to 1.5), 48 (1.6), 52 (1.10)"}
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
| 1.9 (dxc 1.9.2609) | 52 bytes | 24 bytes | 111 test compilations (15 without resources); the 18 libraries have no `PSV0` |
| 1.10 | 52 bytes | 24 bytes | 19,240 skate. (86 without resources) |

:observed{games="skate elden-ring"}

Compiled with `-validator-version 1.0`, dxc writes a 24-byte runtime info, and with validator versions 1.1 to 1.5 the
36-byte one. :observed[test compilations with dxc releases 1.4.1907 to 1.9.2609] The 24 bytes are the four stage-specific
words and the wave lane range, so a validator 1.0 record stops before the stage byte at 28; that is a fit of the sizes to
the layout above. :inferred

## Feature mask and metadata

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

In a library (`lib_6_x`), a buffer field of a matrix type is typed differently by compiler version: dxc 1.4.1907 and
1.5.2010 leave the front end's `class.matrix.*` structure in the buffer's type, and dxc 1.6.2112 and later write a
`hostlayout.*` type there. :observed[test compilations with four dxc releases]

A library's state-object subobjects (hit groups, configurations, root-signature associations) do not stay in the module as
`dx.subobjects` metadata: no dxc release from 1.4.1907 to 1.9.2609 leaves it in the container, compiled by default, with
`-Vd`, with `-Qstrip_reflect` or for validator 1.3 or 1.4. :observed[test compilations] The container's `RDAT` part is
where a library's subobjects are read from instead. :inferred

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

No load or store in either game's modules is volatile or atomic: a reader that refuses both reads all 69,728 modules (19,445
skate., 50,283 Elden Ring) with no refusal. :observed{games="skate elden-ring"}

## Listings

dxc's listing of a module (`dxc -dumpbin`) sizes and aligns types by dxc's own LLVM, not by stock LLVM: a vector is aligned as
its element and is as large as its element's allocation size times the element count, so `<3 x float>` takes 12 bytes at
alignment 4, where stock LLVM gives it 16. A block's predecessors are listed in the order of the block's use list, which is the
reverse of the order the branches to it were created in, and the listing ends with one newline more after the module.
:proven[a listing written by these rules is identical to dxc 1.9.2609's for all 50,283 programs and 129 test compilations]{games="elden-ring"}
