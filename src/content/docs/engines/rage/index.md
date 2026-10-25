---
title: RAGE
description: Rockstar's archives, streamed resources and world data in Grand Theft Auto V Enhanced.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: Reference reader for GTA V resources and mount data.
---

Grand Theft Auto V Enhanced stores its world in RPF7 archives. The archives contain ordinary files and paged
resources: map placements, archetypes, drawables, textures, collision and animation dictionaries.
:sourced[CodeWalker]

An archive entry is not necessarily the file the game uses. Base archives, title updates and DLC packs can contain
copies of the same name; mount data determines which copy is live, and Story and Online have different map states.
:observed See [mounts and overlays](/engines/rage/archives/mounts/).

The Enhanced edition retains the RSC7 resource envelope but changes important payload layouts: drawable version 159,
fragment version 171 and texture-dictionary version 5. Enhanced vertex declarations and texture formats therefore
need their own interpretation even when a file has a familiar extension. :observed

Materials connect a drawable's hashed parameters to effects in a compiled DXIL database. The database stores
programs, binding tables, techniques and fixed-function state; an effect name alone does not specify every pass.
:observed See [SGD2](/engines/rage/shaders/sgd2/) and
[material parameters](/engines/rage/materials/enhanced-parameters/).

This section covers the PC Enhanced data described on the [game hub](/games/gta-v/). These layouts do not establish
the formats of other RAGE games or every Legacy resource present alongside Enhanced assets. :unknown
