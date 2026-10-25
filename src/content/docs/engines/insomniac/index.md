---
title: Insomniac engine
description: "Insomniac Games' in-house engine as Sunset Overdrive ships it: the toc and archives, the DAT1 asset container, and how models, textures, zones and Havok collision are stored."
sources:
  - title: ALERT (Tkachov)
    url: https://github.com/Tkachov/ALERT
    note: Python reader and asset browser for Insomniac archives (Sunset Overdrive, Spider-Man, Ratchet & Clank, Wolverine); GPL-3
  - title: ALERT wiki
    url: https://github.com/Tkachov/ALERT/wiki
    note: documents toc, DAT1, asset types and per-section formats; its codenames name the engine generations
---

Insomniac's engine is carried from game to game; ALERT's research names its generations by codename: **i16** Sunset Overdrive (2014, PC 2018), **i20** Marvel's Spider-Man
Remastered, **i31** Miles Morales, **i29** Ratchet & Clank: Rift Apart, **i30** Spider-Man 2, **i33** Wolverine. :sourced[ALERT wiki] The wiki records Sunset Overdrive, the i16 generation,
and nothing of the later ones. :observed

Everything in the game is an **asset** with a 32-bit id, stored in a few large [archives](/engines/insomniac/archives/toc-and-archives/) that a compressed `toc` indexes. Almost every
asset is a [DAT1 container](/engines/insomniac/data-model/dat1-container/): a header of tagged sections, each section one fixed binary structure. A model is geometry in
[`.model`](/engines/insomniac/geometry/model/) sections, a texture a header plus DDS-ordered [pixel chains](/engines/insomniac/textures/texture/), and the city a field of hexagonal
[zones](/engines/insomniac/world/zone/) that list placed models and carry [Havok collision](/engines/insomniac/collision/havok-hknp/). :observed

## How sure the pages are

The decoding of Sunset Overdrive was a one-day census of the PC build 3373500, and that install is no longer present, so the figures cannot be re-checked today. The counts are measurements
over every asset of the stated kind and are marked :observed with their scope; nothing here is marked as proven. Layout names that come from ALERT are :sourced. :observed

## What is known and what is not

| Area | State | Confidence |
|---|---|---|
| toc, archives, naming through `layout.csv`, DAT1 and LZ4 wrapper | complete | :observed |
| Zone placement (kind 0 placed models, decals, effects) | all 4,936 zones read; other kinds and traversal data not decoded | :observed |
| Models | quantisation, vertices, indices, meshes, LODs, UV0; materials, skinning, vertex colour, second UV not decoded | :observed |
| Textures | header, mip-chain sizes, formats; slice order and sRGB bit not established | :observed |
| Collision | Havok packfile and class census; shape data not decoded | :observed |
| Materials, actors, configs, cinematics, animation | not read here | :unknown |

The first of Insomniac's formats to be decoded here, the placement section, was the one ALERT left open. :sourced[ALERT wiki] Games: [Sunset Overdrive](/games/sunset-overdrive/).

:::open[What do the later Insomniac generations change?]
ALERT documents 64-bit asset ids, 256 spans, DSAR archive compression and GDeflate textures from Spider-Man and Rift Apart on. None of it was measured here, and Sunset Overdrive's own
section formats are only compared with those games' by ALERT, not by this wiki.
:::
