---
title: Running the engine's own code
description: Proving what a material or vertex stage computes by running the game's compiled shaders unmodified.
sources:
  - title: Microsoft's Shader Model 5 assembly reference
    url: https://learn.microsoft.com/en-us/windows/win32/direct3dhlsl/imm-atomic-iadd--sm5---asm-
    note: imm_atomic_iadd; an out-of-range atomic writes nothing and returns an undefined value
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

WARP is the reference a program is run on, but some of its results are not exact enough, not stable enough, or not
required by Direct3D, to settle a disagreement on their own.

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
hit in the first run missed, or hit another primitive. :observed[200 replays of one batch of 12 scenes, every instance's
flags valid] In another scene's first run, WARP did not offer seven procedural boxes as candidates that it offered on
every later run. :observed[one run in six]

The variation is not carried from one case to the next. Running every scene in a process of its own, with its own device
and resources, 200 times over (2,400 runs), three runs still differed from the rest: one ray in each of three scenes,
each once in its 200, with the same input bytes every time. The other nine scenes never varied. :observed[200 rounds of 12
scenes, one process per run] The three rays are not near a tie. Intersected in double precision against every
instance's triangles and masks, no mask-visible hit of the three lies within 0.0063 (in barycentric terms) of an edge
of its triangle, and no two hits of one ray lie within 0.00051 of each other along it; in each case the rare result was
a farther hit or a miss. :observed[the three rays] With the process restricted to one CPU (the affinity mask set to one processor and
checked before the device is created), the same three scenes gave the same result in all 600 runs, 200 each.
:observed[600 single-CPU runs] That fits a race between WARP's worker threads building or traversing the acceleration
structure. :inferred[from the single-CPU runs; WARP's code was not read] A ray-query comparison with WARP therefore either
runs WARP on one CPU, or runs each case at least twice and compares only results on which two of WARP's own runs agree.

**Out-of-range atomics.** Run under Direct3D 11 on a 2×2 `R32_UINT` texture, an atomic add (`InterlockedAdd`) at a
coordinate inside the texture returns the old value and stores the sum; at `(width, 0)`, `(0, height)` or `(-1, 0)` it
returns 0 and writes nothing, and an out-of-range compare-exchange also returns 0 and writes nothing. This holds with the
program compiled with and without optimisation. :observed[one probe program, WARP under Direct3D 11] Only the missing
write is required: the documentation of `imm_atomic_iadd` leaves the value an out-of-range atomic returns undefined, and
a structured view addressed past the end of its struct is left wholly undefined rather than unwritten.
:sourced[Microsoft's Shader Model 5 assembly reference] A 0 returned by WARP is therefore WARP's choice, not a rule other
drivers must keep. :inferred

The compiler can hide WARP's own behaviour. With optimisation on, `fxc` replaced an out-of-range load that follows an
out-of-range store in the same program by the stored value (99); compiled with `D3DCOMPILE_SKIP_OPTIMIZATION`, the load
reads 0 from WARP. :observed[one probe program] A probe of what WARP does out of range is compiled without optimisation.

## What it proves and what it doesn't

- It proves what the program computes from its inputs, which is the meaning of the stored values it reads.
- It does not prove which program a given draw uses at run time if the selection logic is elsewhere; that comes from the
  material's own references, or from [runtime observation](/methods/runtime-observation/).
- It proves one program. A formula shared by a family of programs is proven for those executed and :inferred for the
  rest unless every member was run.
