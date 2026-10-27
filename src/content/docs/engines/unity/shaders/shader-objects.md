---
title: Shader objects and compiled programs
description: "How a player stores a shader: the parsed form with its passes and render state, the per-platform compressed program blob, variants and keywords, constant buffers, and the 2021.2 parameter blobs."
games: [skatebird, sledding]
sources:
  - title: UnityPy (Shader and ShaderProgram readers)
    url: https://github.com/K0lb3/UnityPy
    note: the independent reader the layouts were compared with
  - title: AssetRipper
    url: https://github.com/AssetRipper/AssetRipper
    note: documents the serialized shader structures and the GPU program types
implementations:
  - name: unity-formats (program.rs)
    url: https://github.com/Kalmarv/unity-formats/blob/main/src/program.rs
  - name: unity-formats (shader.rs)
    url: https://github.com/Kalmarv/unity-formats/blob/main/src/shader.rs
---

A **Shader** (class 48) in a player holds the shader's render state and its compiled programs, in Direct3D 11 bytecode for
Windows. It does not hold the shader's source. Everything here is for the D3D11 platform blob. :observed

## The parsed form

`m_ParsedForm` is the structure of the ShaderLab shader: the name, the properties (with their declared defaults, `m_PropInfo`),
a list of subshaders with tags (`QUEUE`, `RenderType`, ... upper-cased by Unity), and per subshader a list of passes. A pass is
one of three kinds (`m_Type`): a normal pass with its own state and programs, a `UsePass` naming another shader's pass
(`m_UseName`; its state is not here), or a `GrabPass` copying the screen to a texture (it draws nothing). :observed

A normal pass stores its tags (`LightMode`), its render state (`m_State`: per-target blend and write mask, `zTest`, depth
write, culling, depth offset, stencil), and for each stage the compiled programs `progVertex`, `progFragment`, `progGeometry`,
`progHull` and `progDomain`, as many as the pass has. :observed Render-state values can be bound to material properties
(`Blend [_SrcBlend] [_DstBlend]`), see [materials](/engines/unity/materials/materials/). :observed

## Programs, variants and keywords

A stage's program is a list of **variants**: one per keyword set the build compiled (a `shader_feature` or `multi_compile`
combination). A variant has a hardware tier, its keywords, a GPU program type, a requirements mask and its parameters.
The GPU program types for Direct3D 11 are 15 and 16 (vertex, shader model 4.0 and 5.0), 17 and 18 (pixel), 19 and 20
(geometry), 21 (hull) and 22 (domain). :observed{games="skatebird sledding"}

Two layouts exist, told apart by their fields:

| Unity | Variant lists | Parameters | Confidence |
|---|---|---|---|
| before 2021.2 (SkateBIRD, 2019.4) | `m_SubPrograms`, one list; each variant has its tier, its keywords as global and local indices into the pass's name table, and its own parameters | per variant | :observed{games="skatebird"} |
| from 2021.2 (Sledding Game, 6000.3) | `m_PlayerSubPrograms`, lists of variants with keywords indexing the form's `m_KeywordNames` | `m_CommonParameters` shared by the variants, plus a blob entry per variant (`m_ParameterBlobIndices`) | :observed{games="sledding"} |

SkateBIRD's 2019.4 player keeps per-variant parameters in `progFragment.m_SubPrograms` and not in `m_PlayerSubPrograms`; a
reader has to read both. :observed{games="skatebird"}

## The program blob

Each platform has one compressed blob. The blob is split into segments (`offsets`, `compressedLengths` and
`decompressedLengths`, one entry per segment), each LZ4-compressed. Segment 0 begins with the entry table: a count, then per
entry its offset, its length and its segment. An entry of a program holds the program record: its version, the GPU program
type, (from 2016.2) a header, keyword strings (empty in current players: the parsed form names the keywords), and the code
as a byte array. The platform number of the D3D11 blob is 4. :observed{games="skatebird sledding"}

Against an independent reader, every shader's programs of Sledding Game's mountain scene agree: variants, keywords, GPU
program types, requirement masks, the constant buffers and the texture and sampler tables, and the sha256 of every
variant's code. :observed{games="sledding"}

The code is a DXBC container. Of the 4,854 programs read from Sledding Game's shader assets, 4,838 have **no resource
definition chunk** (RDEF), so their code names no resources; the names come from the parameter records. The other 16 are
Shader Model 4.0 programs that keep an RDEF without the `RD11` block of the Shader Model 5 layout. :observed{games="sledding"}
The container parts are described on [Direct3D shader containers](/concepts/d3d-shader-containers/).

## Constant buffers and bind slots

A variant's parameters list:

| Part | Content | Confidence |
|---|---|---|
| constant buffers | name, bind slot (`b<n>`), size in bytes, vector fields and matrix fields by offset, struct fields | :observed |
| field | name, byte offset, element type (Unity's `ShaderParamType`: 0 float, 1 int, 2 bool, 3 half, 4 short, 5 uint), a vector of 1 to 4 lanes or a matrix of some rows, array size (0 means not an array) | :observed |
| struct field | name, offset, array size, struct size, members (instancing's per-draw arrays) | :observed |
| textures | name, slot (`t<n>`), sampler slot (none when it has its own sampler state), dimension (2 a 2D texture, 3 3D, 4 a cube) | :observed |
| samplers | the packed sampler state and its slot (`s<n>`) | :observed |

Bytes of a buffer that no stored field covers are not necessarily unused: a row-level census found that 249 of 565 such gaps
in SkateBIRD's distinct programs and 309 of 523 in Sledding Game's overlap a row the program loads. Most are padding lanes
beside a named field (`_WorldSpaceCameraPos` at offset 64 with a gap at 76); some are reads of rows with no stored name
(rows 9 to 11 of a pixel program's fourth buffer). :inferred

### Built-in constants

Several built-in constants pack more than one meaning in a vector: `_ProjectionParams` holds the flip, the near plane, the far
plane and 1/far. For a directional light, `_WorldSpaceLightPos0` holds the direction **toward** the light, not the direction the light travels.
:sourced[Unity manual] Which lane layouts hold for each built-in constant in the
build's Unity version is not checked against the engine. :inferred

## Variant selection

Unity compiles each stage for the keyword sets that stage uses, so a keyword a stage never reads is not in its variants. A
draw's keyword set *S* picks, per stage, the variant whose keywords are exactly *S* restricted to the keywords some variant
of that stage uses. A fragment variant's keywords do not determine its vertex variant: a vertex stage that reads
`LOD_FADE_PERCENTAGE` is compiled with it though the fragment stage never is. For every pass of every shader of Sledding
Game and SkateBIRD, per hardware tier and shader model (vertex types 15 and 16 pair with pixel types 17 and 18), every
fragment variant *F* has a vertex variant *V* such that *S = F ∪ V* selects exactly those two, and every vertex variant has
such a fragment variant. :proven{games="skatebird sledding"}

Where a stage stores the same keywords and tier in two shader models, the fragment stage takes the first stored; the other
stages take the model matching it (a vertex program two types below the pixel program's). :observed{games="skatebird sledding"}

Which keyword set a draw has at run time is the renderer's choice, see [draw keywords](/engines/unity/shaders/draw-keywords/).

## What the player does not hold

The engine's own textures (shadow maps, reflection probes, camera depth) are bound by the renderer and have no object in
the player. For a material property left unset, the shader's declared default (`white`, `black`, `bump`, ...) is the
engine's own texture, see [textures](/engines/unity/textures/textures/#engine-default-textures). :observed{games="skatebird sledding"}

## Sledding Game

### 2021.2 parameter blobs

A 2021.2 or later player keeps a variant's own parameters (including its textures) in the blob entry named by
`m_ParameterBlobIndices`. Each entry:

| Part | Content | Confidence |
|---|---|---|
| magic | `u32` `0x0C0A75BA` | :observed{games="sledding"} |
| buffer count + 1 | `u32` | :observed{games="sledding"} |
| four words | all zero | :observed{games="sledding"} |
| each constant buffer | name (length, bytes, padding to 4), size, its fields (name, type, rows, columns, matrix flag, array size, byte offset, each a word), its structs (name, offset, array size, size, fields) | :observed{games="sledding"} |
| a list of entries | each a name, a kind and a slot: kind 0 a texture (the sampler slot, `0xFFFFFFFF` for none, and a dimension word), kind 1 a constant buffer's binding (a word, 0), kind 4 a sampler (its packed state; the name is empty) | :observed{games="sledding"} |

Over Sledding Game's `level1` shaders, 3,272 of 3,280 entries read to their last byte; the 8 that do not hold a kind 2, a
structured buffer of DOTS instancing, whose payload is not described. :observed{games="sledding"} Before the blobs were
read, the pass's common parameters named 1 of 1,375 texture slots; the pass's common parameters hold no texture and no
`UnityPerMaterial` buffer in these players. :observed{games="sledding"}
