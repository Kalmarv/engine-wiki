---
title: Environment textures
description: "How the end portal colour table and the weather sheet in textures/environment are read: which texel each end portal layer takes, and which cells rain and snow draw."
sources:
  - title: Mojang bedrock-samples
    url: https://github.com/Mojang/bedrock-samples
    note: vanilla resource pack, v1.26.60.5 (textures/environment/)
  - title: MCPE 1.0.0 Restored
    url: https://github.com/theaperturecat/MCPE-1.0.0-Restored
    note: "a community reconstruction of the 1.0 client's source: the end portal planes and their colour UVs (BlockTessellator.cpp)"
  - title: Legacy vanilla shaders (end_portal.vertex, end_portal.fragment, portal.material)
    url: https://github.com/M2noa/MCLCE-Archive
    note: an archive of a pre-RenderDragon build's vanilla shaders and materials
  - title: cinnabar
    url: https://github.com/cinnabar-mc/cinnabar
    note: "a from-scratch Bedrock client; its weather model reads the sheet's rain and snow cells (crates/render-model/src/weather.rs)"
  - title: La Nature (resource pack by Carrot)
    url: https://www.curseforge.com/minecraft-bedrock/texture-packs/la-nature-by-carrot
    note: a third-party pack that redraws both
---

## End portal colours

`end_portal_colors` is a 4×4 table of colours in the vanilla pack, 16 distinct ones.
:proven[every pixel of the v1.26.60.5 file] Each is in the range of the random colours the early end portal drew
from: red 0.1 to 0.6, green 0.4 to 0.9, blue 0.5 to 1. :observed[the 16 colours of the v1.26.60.5 file]

The portal is drawn as 17 planes, a clearing plane and then 16 star planes from the deepest up, added together
(`blendSrc` `One`, `blendDst` `SourceAlpha` with an alpha of 1). :sourced[MCPE 1.0.0 Restored, legacy vanilla shaders]
Star plane `L` (1 to 16) takes the colour at the centre of cell `L - 1` of a 4×4 grid, row by row: UV `0.125`,
`0.375`, `0.625` or `0.875` across and down, point-sampled. :sourced[MCPE 1.0.0 Restored, legacy portal.material]
A plane's star texel is multiplied by that colour and by `1 - depth`, its depth being `(16 - L) / 16`, so plane `L`
shows at `L / 16` of its colour. :sourced[legacy vanilla shaders, MCPE 1.0.0 Restored] The UVs do not depend on
the texture's size, so a larger table is read at the same fractions: an 8×8 one at its odd texels. :inferred

:::open[Do the current renderer's end portal planes read the table the same way?]
The plane layout and UVs are those of the 1.0 client and the published pre-RenderDragon shaders; the current
renderer's are not published. A pocket build drew 8 planes, every second UV.
:::

A third-party pack ships an 8×8 table with 12 colours in its lower right quarter and black elsewhere, beside a 4×4
original with the same 12 colours; read as above, only planes 11, 12 and 15 take a colour.
:observed[the La Nature resource pack]

## Weather sheet

`weather` is a square sheet, 32 pixels in the vanilla pack. :proven[the v1.26.60.5 file] Snow particles draw one of
eight cells along its top eighth, each an eighth of the sheet square; rain particles one of eight cells below them,
each an eighth wide and half the sheet tall, starting an eighth down (`v` 0.125 to 0.625). :sourced[cinnabar]
In the vanilla sheet the snow cells hold flakes and the rain cells streaks of one pixel's width.
:observed[the v1.26.60.5 file] Each drawn particle is a quad stretched along its fall, half a block long for rain and
a fifth of a block for snow at their usual speeds. :sourced[cinnabar] Below the rain cells the vanilla sheet has four
flat colour swatches, which no model above reads. :observed[the v1.26.60.5 file]
