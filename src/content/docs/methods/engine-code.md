---
title: Running the engine's own code
description: Proving what a material or vertex stage computes by running the game's compiled shaders unmodified.
---

Files say what is stored; the engine's code says what it means. For rendering data the decisive code is the game's own
shaders, which ship compiled inside its data (DXBC for Direct3D 11, DXIL for Direct3D 12), so their meaning can be
checked directly, without guessing from names.

## Reading a shader

1. Find the program the material uses: the material's template or shader name and permutation select one compiled
   program from the game's shader containers.
2. Disassemble it with an independent tool: `fxc /dumpbin` for DXBC, `dxc -dumpbin` for DXIL (both from Microsoft's SDKs).
3. Trace each output (each G-buffer render target component) back through the instructions to its inputs: which texture
   channel, which constant, which vertex attribute, through which arithmetic.

Tracing is careful reading, and reading can be wrong. A traced formula is :inferred until it is executed.

## Executing a shader

The program is run **unmodified** on Microsoft's WARP software rasterizer (Direct3D 11 at feature level 11_0, or Direct3D
12), with textures, constants and interpolants chosen to exercise each term, and its outputs are compared with the formula
written beforehand. A formula that matches on every lane of every case tried, including edge values, is :proven for that
program.

The same check works for vertex programs: running a mesh's own vertex program shows which stored member feeds the
position, the normal or a texture coordinate, and how it is scaled.

## What it proves and what it doesn't

- It proves what the program computes from its inputs, which is the meaning of the stored values it reads.
- It does not prove which program a given draw uses at run time if the selection logic is elsewhere; that comes from the
  material's own references, or from [runtime observation](/methods/runtime-observation/).
- It proves one program. A formula shared by a family of programs is proven for those executed and :inferred for the
  rest unless every member was run.
