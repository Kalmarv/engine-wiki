---
title: Runtime render state
description: Direct3D capture observations and the limits of deriving runtime bindings from static files.
sources:
  - title: DXVK
    url: https://github.com/doitsujin/dxvk
    note: Direct3D 9-11 on Vulkan; a replacement d3d11.dll and dxgi.dll
  - title: me3
    url: https://me3.help/en/latest/
    note: mod loader for FromSoftware games; its option that disables the Arxan protection
  - title: dearxan
    url: https://github.com/tremwil/dearxan
    note: the Arxan neutraliser me3 integrates
  - title: locum
    url: https://github.com/Kalmarv/locum
    note: a stand-in d3d11.dll and dxgi.dll that forward every call to the system runtime; per-draw capture
implementations:
  - name: primase runtime palette binding model
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/passes/layer_bake/resolve.rs
---

The examined Sekiro runtime uses Direct3D 11 and DXBC shader programs; Elden Ring uses Direct3D 12 and DXIL.
:observed Static shader declarations and model data do not fully describe a draw's bound buffers and dynamic
constants. :observed

## Executables

:only[sekiro] Sekiro's 1.06 executable (file version 1.6.0.0) is SteamStub-wrapped, with its `.text` section
encrypted on disk. :observed{games="sekiro"} :only[elden-ring] Elden Ring's 1.17.2 executable has more than one executable
section named `.text`, so code can lie outside the first. :observed{games="elden-ring"}

:only[elden-ring] With hardware execute breakpoints armed in the debug registers of its threads (no code patched), one launch of
2.7.2.0 crashed during the world load, before any breakpoint fired, on an execute fault at an address outside every loaded
module. The same recording started through me3 0.8.0 with its option that neutralises the executable's Arxan anti-tamper stubs
before the real entry point (1,597 stubs analysed, 3,078 patches) ran through the load and 1,500 cloth steps.
:observed[two launches]{games="elden-ring"} That the anti-tamper code reacts to the debug registers fits both launches but is not
isolated, since the loader also changes the start-up. :inferred{games="elden-ring"}

## Sekiro

### Deferred contexts

The observed Sekiro renderer submits draws on deferred D3D11 contexts. Capturing the immediate context alone misses
those draws. Constant-buffer observations must therefore follow the context and the bound constant range.
:observed{games="sekiro"}

Recorded at the runtime itself, every draw of 460 consecutive frames outdoors in Ashina (648,028 draws, 1,400 to
1,470 a frame) came from a deferred context, and none from the immediate one. :observed[one recording]{games="sekiro"}

Each deferred context has its own function table, so a capture layer has to hook every context the device creates,
not only the immediate one. :observed{games="sekiro"} The constants a deferred-context draw sees can be kept on the
CPU, from a copy of what each `Map`/`Unmap` and `UpdateSubresource` writes on that context, or on the GPU: a
`CopySubresourceRegion` of the bound buffer into a staging buffer, recorded on the same deferred context just before
the draw and read once its command list has run, holds the values that draw used. :observed[captures of single
frames]{games="sekiro"} In the world the game fills about 6,300 constant buffers of default usage a frame with
`UpdateSubresource`. :observed[one run at the Ashina gate]{games="sekiro"}

A context's function table is a copy inside the context object, one per context, and `d3d11.dll` rewrites its entries
while the game changes state. A `Draw` entry replaced once on the immediate context is put back to the runtime's own
function within a few frames, so immediate-context draws then go unseen while deferred-context draws are still caught.
A capture layer has to hook the state setters as well and, after each hooked call returns, restore any entry the
runtime rewrote, calling the runtime's new function from then on; a Sekiro run needs this about 159,000 times.
:observed[hooked runs of the game]{games="sekiro"}

Launched under RenderDoc, Sekiro 1.06 exits silently about five seconds after RenderDoc's library loads, so the
executable's protection stops a standard capture tool. :observed[launch attempts]{games="sekiro"} A proxy of
`dinput8.dll`, which the game loads before its code is unpacked, can wait for `d3d11.dll` and hook the device and its
contexts from there; that capture runs. :observed{games="sekiro"} The game also runs with `d3d11.dll` and
`dxgi.dll` beside the executable replaced by another Direct3D 11 implementation (DXVK 3.1.1, which reports an AMD
adapter on NVIDIA hardware by default): it stayed up past the first minute and played through world load and the
quit menu. :observed[five launches]{games="sekiro"} It also loads and plays with a `d3d11.dll` and `dxgi.dll` that
wrap the system's own runtime and forward every call to it (locum). :observed[three launches]{games="sekiro"}

Sekiro makes its swap chain from the factory it reaches through the device: it asks the device for `IDXGIDevice`,
takes its adapter (`GetAdapter`) and the adapter's parent factory (`GetParent`), and calls `CreateSwapChain` there.
The factories it makes itself with `CreateDXGIFactory` never create the swap chain. A wrapper that answers
`IDXGIDevice` with the runtime's own object sees no swap chain, no present and no shader creation; one that answers
it with its own object, whose adapter and factory are its own too, sees all three. :observed[one launch each
way]{games="sekiro"}

The castle-interior capture records 222,552 draws using 180 pixel programs. :observed{games="sekiro"}

In a castle-interior capture of layered G-buffer draws, vertex slot 11 supplies a 64-byte `cbTexScroll`: four
`[1,1,0,0]` vectors. The sampled draws use identity texture scroll. This does not establish the scroll state of
animated objects or other scenes. :observed{games="sekiro"} That capture logs at most 800 layered draws of a frame
(a frame at the Ashina gate has 822 to 863), so its 40,744 layered draws are a sample summed over frames, not a
per-frame figure. :observed{games="sekiro"}

Outdoors in Ashina, every layered draw of 460 consecutive frames (384,131 draws, 822 to 863 a frame, 42 vertex
programs) has `cbTexScroll` bound at its first constant with the same four `[1,1,0,0]` vectors. Each value was
written on the same deferred context that drew with it. :observed[one recording]{games="sekiro"} The same 42 programs
and value appear there on the native runtime. :observed[one recording]{games="sekiro"}

One frame at the Ashina gate Sculptor's Idol on the native runtime has 1,464 draws, all recorded on deferred
contexts in 84 command lists that the immediate context then executes. 868 of them are layered draws using 41 of
those 42 vertex programs, each with `cbTexScroll` at vertex slot 11 from its first constant holding the four `[1,1,0,0]`
vectors as the GPU read them. :observed[one captured frame]{games="sekiro"}

Raising that first vector to `[8,8,0,0]` for the draws of the most-used of those programs makes the textures on
their surfaces (the gate's walls and posts) repeat far more finely, so its first two components scale the texture
coordinates. :observed[one frame each way]{games="sekiro"}

### Compute programs whose output depends on thread order

Of the 9,680 shader programs the game creates in a run to the Ashina gate, 33 take an atomic operation's returned value:
all are compute programs and all use `imm_atomic_iadd` (one to four times each), the pattern of a thread reserving the
next free slots of an output list; none uses another returning atomic or `atomic_cmp_store`. :observed[the disassembly
of every program created in one run]{games="sekiro"} Where a record lands therefore depends on the order the GPU runs
the threads, which differs between two runs of the same frame. :inferred{games="sekiro"} Three of them run in a frame
at the Ashina gate Sculptor's Idol: one dispatch of 60 x 34 groups just before the lighting pass, and two consecutive
dispatches whose 176-byte records an indirect draw then draws. Re-run on the frame's recorded inputs, the first places
its output runs elsewhere and the last writes the same records in another order. :observed[one captured frame, three
re-runs]{games="sekiro"} By their buffers they are the lights' [tile lists](/engines/fromsoft/lighting/btl/#tile-lists)
and the [GPU particles](/engines/fromsoft/shaders/effects/#the-particles-on-the-gpu). :inferred{games="sekiro"}

A capture of that frame replayed offline matches the game on all 146 targets, bit for bit, on three replays, when those
dispatches' outputs are taken from what the game's GPU wrote instead of recomputed. :observed[one captured frame, three
replays]{games="sekiro"}

### G-buffer

In a frame at the same spot (1,500 draws), 601 consecutive draws write five 1920×1080 colour targets at once, with a
32-bit float depth and 8-bit stencil target, read back where that pass ends: :observed[one captured frame]{games="sekiro"}

| Target | Format | Contents at the end of the pass |
| --- | --- | --- |
| 0 | `R10G10B10A2_UNORM` | one colour per facing: floors green, walls blue or purple, with the textures' relief |
| 1 | `R8G8B8A8_UNORM` | alpha 0 everywhere, blue 1 over most of the image; not identified |
| 2 | `R8G8B8A8_UNORM_SRGB` | the scene's textures without light or shadow |
| 3 | `R8G8B8A8_UNORM` | one grey (44/255) on most surfaces, brighter on metal (blades, fittings); alpha 1/255 or 3/255 |
| 4 | `R16G16B16A16_FLOAT` | colour zero everywhere; alpha 0 or 1 |

That targets 0 and 2 hold normals and unlit colour is read from their images, and that target 3 carries a metal or
reflectance term from where it is bright. :inferred{games="sekiro"} Depth is larger for nearer surfaces (0.001 in
the distance to 0.024 on the character), so the depth range is reversed. :observed[one captured frame]{games="sekiro"}
The same frame's shadow depth targets are 16-bit, 4096×2048 and 4096×4096. :observed[one captured frame]{games="sekiro"}

## Elden Ring

### Direct3D 12 loading and interface identifiers

In the examined Elden Ring executable (file version `2.7.2.0`, SHA256
`f9118fea2cfd8fa3901e8060bfadb1552cb2471771ded8a5b662c4e298ffb328`), the PE import table
names `d3d12.dll` and `dxgi.dll` without paths as ordinary imports, not delay imports.
:observed[PE import and delay-import directories]{games="elden-ring"} The Direct3D imports are
`D3D12SerializeRootSignature`, ordinal 101 and ordinal 102; the DXGI imports are
`CreateDXGIFactory1` and `CreateDXGIFactory`. :observed[the same executable's import directory]{games="elden-ring"}
The executable exports neither `D3D12SDKVersion` nor `D3D12SDKPath`, and the examined game directory contains
no `D3D12Core.dll`. :observed[export directory and recursive installed-file inventory]{games="elden-ring"}

The executable contains GUID bytes for `ID3D12Device5`, `ID3D12GraphicsCommandList4`,
`ID3D12PipelineLibrary1`, `ID3D12StateObject` and `ID3D12StateObjectProperties`, as well as the base
device and graphics-command-list interfaces. :observed[whole-file GUID scan against Windows interface definitions]{games="elden-ring"}
GUID presence alone does not establish which interfaces a particular scene requests or whether ray tracing is enabled.
:inferred{games="elden-ring"}


### Skinning palettes

The skinned vertex program's declared six matrix rows do not limit the bound resource to two matrices. Captured
register-5 constant buffers include 12,288 bytes (256 matrices of 48 bytes) and 3,072 bytes (64 matrices), depending
on the draw. Readback contains nonzero matrices beyond the declared rows. :observed{games="elden-ring"} In the
256-matrix buffers 232 to 253 matrices are nonzero, the last at index 255; in the 64-matrix buffer 61 are, the last
at index 62. Non-skinned draws bind 512 bytes at that register. :observed{games="elden-ring"}

The examined `c3000` model has empty per-mesh bone-index tables and uses skeleton joint indices directly. Its
captured 256-matrix binding therefore does not imply a per-mesh table of 256 bones or a skeleton of that size.
:observed{games="elden-ring"}

:::open[What selects the palette allocation for every draw?]
The bound sizes vary. The observed maximum is not a proven global engine limit, and Sekiro's texture-scroll capture
does not measure its skinning-palette size.
:::

### Material identity and dynamic constants

In examined Elden Ring draws, one pixel program with identical texture bindings appears with different texture-tiling
constant buffers. Program and texture identity alone therefore does not identify a draw's complete material state.
:observed{games="elden-ring"}

:::open[Which runtime overrides replace authored defaults?]
Captures establish the state bound at sampled draws. A match to a static material's default does not establish its
identity when multiple materials share those defaults, nor does it establish how character creation, events,
weather or per-instance overrides produced that state.
:::
