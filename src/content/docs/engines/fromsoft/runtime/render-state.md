---
title: Runtime render state
description: Direct3D capture observations and the limits of deriving runtime bindings from static files.
implementations:
  - name: primase runtime palette binding model
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/passes/layer_bake/resolve.rs
---

The examined Sekiro runtime uses Direct3D 11 and DXBC shader programs; Elden Ring uses Direct3D 12 and DXIL.
:observed Static shader declarations and model data do not fully describe a draw's bound buffers and dynamic
constants. :observed

## Sekiro deferred contexts

The observed Sekiro renderer submits draws on deferred D3D11 contexts. Capturing the immediate context alone misses
those draws. Constant-buffer observations must therefore follow the context and the bound constant range.
:observed{games="sekiro"}

The castle-interior capture records 222,552 draws using 180 pixel programs. :observed{games="sekiro"}

In a castle-interior capture of layered G-buffer draws, vertex slot 11 supplies a 64-byte `cbTexScroll`: four
`[1,1,0,0]` vectors. The sampled draws use identity texture scroll. This does not establish the scroll state of
animated objects or other scenes. :observed{games="sekiro"}

## Elden Ring skinning palettes

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

## Executables

:only[sekiro] Sekiro's 1.06 executable (file version 1.6.0.0) is SteamStub-wrapped, with its `.text` section
encrypted on disk. :observed{games="sekiro"} :only[elden-ring] Elden Ring's 1.17.2 executable has more than one executable
section named `.text`, so code can lie outside the first. :observed{games="elden-ring"}

## Material identity and dynamic constants

In examined Elden Ring draws, one pixel program with identical texture bindings appears with different texture-tiling
constant buffers. Program and texture identity alone therefore does not identify a draw's complete material state.
:observed{games="elden-ring"}

:::open[Which runtime overrides replace authored defaults?]
Captures establish the state bound at sampled draws. A match to a static material's default does not establish its
identity when multiple materials share those defaults, nor does it establish how character creation, events,
weather or per-instance overrides produced that state.
:::
