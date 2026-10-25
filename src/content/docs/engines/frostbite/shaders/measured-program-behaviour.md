---
title: Measured program behaviour
description: Scoped G-buffer encodings and the instance/matrix-table accesses of character hat vertex programs.
games: [skate]
implementations:
  - name: primase worlds/frostbite (passes/buffer_tables.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/frostbite/src/passes/buffer_tables.rs
---

The following observations describe specific stock compiled programs. Shared instructions or similar bindings
do not establish the same meaning for every shader family. :observed

## G-buffer channel pairing

Static producer/consumer pairing across globals and dingolevel_root finds `T0.xy = 0.4995*v + 0.4995` in
7,516 of 7,557 G-buffer pixel programs. A set of 195 screen-addressed consumer textures decodes these values
as `2*x-1`. The role of the pair is unresolved; the inspected model does not establish a normal unfolding or
normalization step. :observed

The sampled large lighting compute programs read their t4–t8 lanes directly. The hashed binding names do not
identify the semantic role of those textures. :observed

## Character hat vertex tables

Measured hat vertex programs read instance data at t0 and a headered float4 matrix table at t67. For an instance
header element `H`, bit zero enables an offset encoded in bits 1–16 of header word zero. Let that enabled offset
be `offset` (zero when disabled), and `X = H + 1 + offset`. The element at X
contains translation added after the weighted joint sum; its w component is unused in these measured outputs.
:observed

Joint j uses three rows starting at `X + 3 + bit18 + 3*j`. Header bit 18 shifts those rows by one element
without shifting X. The elements X+1 and X+2 are not read in the measured paths. Four of five distinct hat
vertex programs, covering twelve of thirteen stages, follow this arrangement. :observed

The fifth program also accesses a second block at the unshifted H+1 and H+4–6 offsets. Giving those inputs
distinct values does not move the three inspected outputs, but this does not prove the block dead for every
output or execution path. :observed

Thirty inspected hat input layouts store blend indices as four u16 integers and weights as four normalized
bytes. Their sections' 386-entry bone palettes are identity mappings. The animation rig and render skeleton
are documented separately under [rigs and ECLP](/engines/frostbite/animation/rigs-and-eclp/). :observed

:::open[What are the semantic roles of the paired G-buffer channels and second hat block?]
The measured encodings and accesses establish operations and dependencies, but not those inputs' complete
engine meaning. :unknown
:::
