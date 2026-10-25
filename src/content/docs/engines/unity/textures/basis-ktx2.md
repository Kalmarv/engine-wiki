---
title: Basis Universal and KTX2 traps
description: "What goes wrong when Unity textures are transcoded to Basis Universal in a KTX2 container for glTF: colour primaries in the data format descriptor, and normal maps."
games: [sledding]
sources:
  - title: KHR_texture_basisu
    url: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_texture_basisu
    note: the glTF extension that carries Basis Universal textures in KTX2
  - title: KTX 2.0 specification
    url: https://registry.khronos.org/KTX/specs/2.0/ktxspec.v2.html
    note: the data format descriptor (DFD) and its colour primaries
  - title: Basis Universal
    url: https://github.com/BinomialLLC/basis_universal
    note: the encoder and the UASTC and ETC1S modes
---

Textures read from a [Unity player](/engines/unity/textures/textures/) are block-compressed (BC1 to BC7) or raw. A glTF
that carries them for the web can store them as **Basis Universal** data in a **KTX2** file (extension `KHR_texture_basisu`),
which a client transcodes to whatever its GPU takes. Two traps apply to every texture set, whichever game it comes from;
they were met on Sledding Game's textures.

## Colour primaries in the data format descriptor

A KTX2 file describes its data in a data format descriptor (DFD) that includes the colour primaries. The Basis encoder
writes **BT.709** primaries into the DFD whatever the texture holds, including normal maps and masks. :observed{games="sledding"}
`KHR_texture_basisu` requires the primaries of a texture that is not colour (a normal map, a roughness or mask texture) to be
**unspecified**. :sourced[KHR_texture_basisu] A file written as the encoder produces it therefore breaks the extension's rule
for every non-colour texture; the descriptor has to be rewritten per texture role after encoding, not once for the set.
:observed{games="sledding"}

## UASTC normal maps

UASTC 4×4 is Basis Universal's high-quality mode. Normal maps encoded with it exceeded the error target set for web delivery
at all four quality settings tried, on the worst case of the set (a tree-bark normal map).
:observed{games="sledding"}

:::open[Whether another mode or a different error metric makes normal maps viable]
Only UASTC 4×4 at four settings and one error target were tried on normal maps; ETC1S, XUASTC and angular-error targets were
not measured.
:::
