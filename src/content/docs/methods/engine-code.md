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

## Comparing a whole draw with WARP

When a reimplemented rasterizer is compared with WARP word for word, WARP's clipping and snapping decide the edge
pixels. Drawing under Direct3D 12, WARP clips x and y at the viewport (`-w ≤ x, y ≤ w`) with no guard band, and snaps the vertices a clip
creates to 16.8 fixed point, rounding ties to even. At such a vertex, `noperspective` outputs are blended by the
screen-space parameter (each endpoint weighted by `c·w`, normalised), perspective-corrected outputs by the clip-space
parameter `t`. :observed[a double-precision model fitted to WARP's raw output words to about 1.7e-7, on near-plane
and tie cases] A model with a guard band of even 16.25 pixels already disagrees with it. :observed

## Where WARP is not an exact reference

WARP is the reference a program is run on, but two of its results are not exact enough, or not stable enough, to settle
a disagreement on their own.

**Sine and cosine at large arguments.** WARP's `sin` is coarse once the argument is large. At 64 arguments from 269 to
55,424 radians, none of its results was the correctly rounded single-precision value: the median error was 9,103 ulp
and the largest 296,737 ulp, about 1e-4 in absolute terms, and none had the wrong sign. :observed[64 arguments, run on
WARP under Direct3D 12] Shaders that hash with `frac(sin(dot(p, k)) * 43758.5453)` multiply that error by more than
40,000 before taking the fraction, so all 64 hash values differed from the correctly rounded ones by more than 1e-3.
:observed Of 1,490 Sledding Game programs run on WARP, 15 hash this way, some of them with the Voronoi constants
`k = (127.1, 311.7)` and `(269.5, 183.3)`, and those 15 are the only ones whose results disagreed with an accurate
executor by more than 1e-3. :observed[1,490 programs, with the disassembly of the 15] Running one of them as DXBC on WARP and
translated on WARP gives the same values, since both use WARP's `sin`; an executor with an accurate `sin` gives
different ones. :observed[one program] A disagreement on such a lane is WARP's rounding amplified, not a wrong formula.
The same happens with any small rounding difference multiplied by a large constant before `frac`: Elden Ring's
ambient-occlusion programs (`ScreenSpaceAO2` and its variants, `CopyExternalAOTexture`) compute
`frac(saturate(a / b) * 65025)`, where one rounding step of the division moves the result by 1/256. :observed[6
programs, 26 lanes]

**Ray queries are not repeatable.** Run under Direct3D 12, WARP's inline ray queries (`RayQuery`, with triangle and
procedural-box instances) sometimes give a different result for the same input. A fixed batch of twelve generated scenes
replayed 200 times in one process differed from its first run in 4 of the 200 batches: in three of the scenes a ray that
hit in the first run missed, or hit another primitive. Two of the scenes replayed alone, 200 times each, never varied.
:observed[200 replays of one batch of 12 scenes, every instance's flags valid] In another scene's first run, WARP did not
offer seven procedural boxes as candidates that it offered on every later run. :observed[one run in six] A ray-query
comparison with WARP therefore runs each case at least twice and compares only results on which two of WARP's own runs
agree.

:::open[Why do WARP's ray-query results vary?]
The variation has been seen only in batches of scenes run one after another in one process, never in a scene replayed
alone. Whether it comes from WARP's traversal or from state carried from one case to the next inside the process is not
established; running each case in a fresh process would separate the two.
:::

## What it proves and what it doesn't

- It proves what the program computes from its inputs, which is the meaning of the stored values it reads.
- It does not prove which program a given draw uses at run time if the selection logic is elsewhere; that comes from the
  material's own references, or from [runtime observation](/methods/runtime-observation/).
- It proves one program. A formula shared by a family of programs is proven for those executed and :inferred for the
  rest unless every member was run.
