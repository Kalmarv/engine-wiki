---
title: Running the engine's own code
description: Proving what a material or vertex stage computes by running the game's compiled shaders unmodified.
sources:
  - title: Microsoft's Shader Model 5 assembly reference
    url: https://learn.microsoft.com/en-us/windows/win32/direct3dhlsl/imm-atomic-iadd--sm5---asm-
    note: imm_atomic_iadd; an out-of-range atomic writes nothing and returns an undefined value
  - title: Microsoft's Shader Model 4 assembly reference
    url: https://learn.microsoft.com/en-us/windows/win32/direct3dhlsl/sincos--sm4---asm-
    note: sincos; maximum absolute error 0.0008 between -100π and 100π
  - title: Direct3D 11.3 functional specification
    url: https://microsoft.github.io/DirectX-Specs/d3d/archive/D3D11_3_FunctionalSpec.htm#inst_UTOF
    note: "22.13.6 utof: round-to-nearest-even recommended, not required; 22.10.20 sincos: absolute error at most 0.0008 inside ±100π"
  - title: WebGPU Shading Language specification
    url: https://www.w3.org/TR/WGSL/
    note: "15.7.2 finite-math assumption; pow undefined for a zero base with an exponent of zero or less"
  - title: Microsoft's Direct3D 9 shader reference
    url: https://learn.microsoft.com/en-us/windows/win32/direct3dhlsl/pow---ps
    note: pow; silent on a zero base
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

## Looking inside a program

When a program's output differs from what an accurate executor gives, the first operation where the two part is found by
capturing intermediate values: the bytecode is patched to copy chosen registers, as raw bits with no conversion, into an
unused tail of a buffer the program already writes, and the same captures are taken on both sides. A capture counts only
if every original output word of the patched program is byte-identical to the unpatched one's, because the added store
can change how the program around it is compiled. :inferred It does. In one Riders Republic compute program translated
to WGSL, a lane that gives an infinity on WARP gives NaN once every term of its `exp2` and product chain is stored as
well; storing only values the program computes anyway, and the argument of `exp2`, leaves every output byte as it was in
10 runs of 10 and shows that argument at 7.51e17, an overflow, behind all 64 differing words. :observed[one program, 10
runs] Once a value is not finite, WGSL lets a program's result be any value, so a change of compilation is free to move
it. :sourced[the WGSL specification, 15.7.2 and 8.2] Captures around the suspect operation are also checked against the
same operation recomputed on the CPU from its captured inputs.

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

WARP's error is absolute rather than relative, so it is large in ulp near zero as well. Over 16 arguments that one
Elden Ring program feeds to `sin`, the 12 inside ±100π were within 2.2e-6 of the correctly rounded value, the worst at
x = −0.00016117 (WARP −0.00016334653, correct −0.00016117096: 149,504 ulp); the four outside were off by 4.2e-6 at
−3,552, 7.3e-6 at 1,610, 5.8e-5 at −4,432 and 2.37e-3 at −33,728. :observed[16 arguments, run on WARP under Direct3D
12] Its `cos` was off by up to 8.7e-5 in the same kind of probe. :observed[one probe] That is within what Direct3D
promises: an absolute error of at most 0.0008 between −100π and 100π, and nothing outside.
:sourced[Microsoft's Shader Model 4 assembly reference, sincos; stated for the DXBC instruction] Elden Ring's SpeedTree
`*_Animation` compute programs hash with `frac(abs(sin(x) * 1e5))` on arguments read from half-precision values; the
factor 1e5 moves a hash value by up to 0.34, and 33 of them disagree with an accurate executor by more than 1e-3 for
this reason. :observed[1,731 Elden Ring compute programs run on WARP, the arguments of one probed] Three of Riders Republic's FFT compute programs take their twiddle factors from `sin` and `cos`;
with WARP's `sin` and `cos` replaced by accurate ones inside the same programs, none of their lanes differs from the
accurate executor by more than 1e-3 over 60 runs each. :observed[3 programs, 60 runs each] In two more Riders Republic
compute programs, run as the original DXBC on WARP under Direct3D 11, the values entering `sincos` are bit-identical to
an accurate executor's, and redoing the rest of the arithmetic in correctly rounded single precision with only WARP's
`sin` and `cos` results put in reproduces WARP's outputs bit for bit, for all 26 words that differ (24 in one program
over ten invocations, 2 in one invocation of the other). Every one of those WARP results is within the 0.0008 bound, with
the argument inside ±100π. :observed[the 26 differing words of two programs, intermediate values captured on WARP] The
difference there is WARP's `sin` and `cos`, legal and nothing else.

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
scenes, one process per run] The rare results are not near a tie either: intersected in double precision against every
instance's triangles and masks, no mask-visible hit of those three rays lies within 0.0063 (in barycentric terms) of an
edge of its triangle, and no two hits of one ray lie within 0.00051 of each other along it. :observed[the three rays]

The fault is in the acceleration structure WARP builds. In each batch that differs, exactly one triangle is wrong: every
ray whose true hit is that triangle gets another answer, and every other ray of the batch's 768 is bit-identical to the
usual result. Solving for the triangle from the differing hit points gives the same triangle with one of its nine vertex
coordinates replaced by exactly 0.0, a different coordinate each time (the y of one triangle's third vertex in one run,
the z of another's in the next, with two rays agreeing on it to 2e-6). :observed[two differing batches] Over 87
differing rays every answer is explained this way: 27 are hits on the triangle with one coordinate zeroed, 33 are hits on
an unchanged triangle farther along because the nearer one was lost, and 27 are misses the zeroed coordinate accounts
for; the zeroed coordinate is any of the nine. :observed[87 differing rays, recomputed in double precision] The
structure is wrong as built and tracing over it is repeatable: with each built structure traced six times on one device,
26 of 800 runs differed from the usual result, and in none of them did a later trace disagree with the first.
:observed[800 runs, six traces each] The input is not at fault: the Direct3D 12 debug layer with GPU-based validation
reports nothing, and waiting on a fence on the CPU after every bottom-level and top-level build leaves the rate where it
was (30 of 800 runs, against 22 of 600 without). :observed

Restricting WARP to one CPU makes the fault rarer but does not remove it. With the affinity mask set to one processor
and read back before the process's thread starts, and a fresh process and device for every run, 2 of 600 runs of the
batch still differed, each by one zeroed coordinate; an earlier series of the three varying scenes alone gave none in
600. :observed[1,200 single-CPU runs in two series] That fits a race or a read of not-yet-written memory inside WARP's
build, which one CPU makes rarer by removing parallel threads but not preemption. :inferred[WARP's code was not read]
Since a run's error is one triangle, two runs of WARP almost never share it, so a ray-query comparison with WARP runs
each case three times and compares with the result two of WARP's runs agree on; running on one CPU is not enough.
:inferred[from the rates above]

:::open[Why does WARP's acceleration-structure build sometimes write 0.0 for one vertex coordinate?]
The zero appears at build time, in any of a triangle's nine coordinates, in about one unrestricted run in 30 and about one in
300 on one CPU, with the host's uploads and fences checked. Whether it is a race between WARP's build threads or a
read of memory it has not yet written is not established.
:::

**Integer-to-float conversion.** WARP converts an unsigned integer that a float cannot hold exactly (one above 2^24)
to one of the two floats either side of it, but neither always the nearest nor always the one toward zero. In one lane of
an Elden Ring compute program, 3,267,677,828 converts to 3,267,677,696.0, toward zero, where nearest-even gives
3,267,677,952.0, and likewise for a second word. :observed[one program, values captured on both sides at the conversion]
Converted on its own, 3,256,159,079 (`0xC2150B67`) gives 3,256,159,232.0 (`0x4F42150C`), rounded up by 153/256 of a
unit in the last place, where nearest-even and toward-zero both give 3,256,158,976.0; it gives that value in 10 runs of
10, so the choice follows the input, not the run. :observed[a standalone probe, 10 runs, WARP under Direct3D 12] Over
the other conversions compared, WARP's result is sometimes the truncated value, sometimes the nearest-even one and
sometimes the one above. :observed Any of the two is legal: the Direct3D 11.3 functional specification (22.13.6,
`utof`) strongly recommends round-to-nearest-even but does not require it, though Microsoft's shorter instruction page
says nearest-even. :sourced[Direct3D 11.3 functional specification] The Elden Ring program (a SpeedTree `*_Animation`
program that calls no `sin`) reinterprets a float result as an integer, converts it back to float and saturates it to
an integer word, so a one-ulp difference becomes a different integer; its multiply-add chain before the conversion
already differs from an accurate executor by 1 to 3 ulp on WARP. :observed[the same lane] An integer word that differs
from WARP in such a program is WARP's rounding, not a wrong formula, and a comparison with WARP accepts either float
next to the exact value of a `utof`. :inferred

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

**Results that vary are not always WARP's.** A program run on WARP several times with the same inputs can give a word
a different value from run to run because the program itself leaves it undefined. With constants chosen at random, two
invocations of a program can compute the same output index and store different values there, and Direct3D does not say
which store lands last. In six of Riders Republic's FFT compute programs, one other Riders Republic program and Elden
Ring's `MatrixTranspose`, every word that varied over 30 replays of each case is a word two or more invocations store
with different values (16 of 16 in one program, 128 of 128 in another, 32 of 32 in `MatrixTranspose`), and none of the
eight uses group-shared memory or a barrier. :observed[30 replays of each case of 8 programs translated to WGSL, the
stores recounted by an executor] Whether the games' own constants ever make such indices collide is not established.
In 13 other programs (eleven of Riders Republic's and Elden Ring's `BitonicSortSinglePass256` and `512`), the words that
vary come from a group-shared word that is read and then written between the same two barriers. :observed[the programs' structure, and up
to 200 repeats each] Only a barrier that makes the invocations wait ends such a stretch: a fence that only orders memory
does not. :sourced[Direct3D 11.3 functional specification] A word that varies on WARP is therefore first checked for
these two shapes, and counts as WARP's only when neither explains it. :inferred

**A slow first dispatch is not a hang.** WARP spends a fixed 47 to 55 seconds on the first dispatch of some programs,
whatever the dispatch holds: for four Riders Republic compute programs translated to WGSL, one, two or four groups, 4
or 256 invocations a group, or the barrier removed all take about as long, while a dispatch of no groups after the
pipeline is made takes half a second; compiled through `fxc` instead, one of them is no faster. :observed[four programs,
timed one dispatch at a time] A cost that does not follow the work fits WARP compiling the program at its first real
dispatch. :inferred A harness that waits less than a minute for WARP reports these programs as hung.

**Translated and recompiled programs.** A program translated to another shading language and compiled again for WARP
meets the compiler's rules as well as WARP's. HLSL's `pow(x, y)` compiles to `exp2(y × log2(x))`, so a zero base with an
exponent of zero or less gives NaN or 0: `pow(0, -0.0)` is NaN on WARP, where the C library gives 1. :observed[47 Direct3D
9 programs, each of which agrees with an accurate executor on every lane once only pow's zero base is given the C
library's values] WGSL leaves that case undefined, and Microsoft's Direct3D 9 documentation of `pow` says nothing about
it. :sourced[the WGSL specification; Microsoft's Direct3D 9 documentation] Both `fxc` and `dxc` fold `x - x`, `-x + x`
and `x + -x` to 0 and `x / x` to 1 even when `x` is an infinity, which WGSL's finite-math assumption allows.
:observed[one probe program per compiler]

## What it proves and what it doesn't

- It proves what the program computes from its inputs, which is the meaning of the stored values it reads.
- It does not prove which program a given draw uses at run time if the selection logic is elsewhere; that comes from the
  material's own references, or from [runtime observation](/methods/runtime-observation/).
- It proves one program. A formula shared by a family of programs is proven for those executed and :inferred for the
  rest unless every member was run.
