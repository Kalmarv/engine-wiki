---
title: "Influence and the restored world"
description: "How Shaun White Skateboarding switches between its grey and its coloured world: the influence texture, the material hide mode and the runtime display option."
games: ["shaun-white-skateboarding"]
---

Shaun White Skateboarding draws its city in two states, a grey Ministry state and a coloured restored one. A texture of the world, the influence texture, says per place how restored it is, and materials choose how to react. :observed

## The influence texture in the shaders

The shared shader source `ekinfluencecommon.hlsl` reads the alpha channel of an `InfluenceSampler`, maps the world X and Y position to texture coordinates through `g_InfluenceTextureOriginScale`, and blends the colour-control result of the uninfluenced state with that of the influenced state by the sampled value. The same source can discard pixels. With the define `KILL_UNINFLUENCED_PIXEL` alone a pixel is clipped when the influence minus 0.01 is negative, that is where the world is not restored. With `INVERSE_KILL_UNINFLUENCED_PIXEL` as well it is clipped when 1 minus (the influence plus 0.01) is negative, that is where the world is restored. With neither define nothing is clipped. :observed

## Material hide mode

The `SKGenericMaterial` field `InfluenceHidePixelMode` (a `u32` at body offset 525, property hash `0x7DACF81C`) is an enum whose names are `HideNone` 0, `HideBefore` 1 and `HideAfter` 2. The engine's key generation for a material sets the shader define `KILL_UNINFLUENCED_PIXEL` when the mode is not 0 and `INVERSE_KILL_UNINFLUENCED_PIXEL` when it is 2, so `HideNone` materials generate neither. :observed

Over the five materials of the metal trees and tree lights examined in level 01 the mode is 0. A decal of the Ministry logo tile floor stores 2: in the restored state the original discards every pixel of it. Seventy-seven of the 95 decal-named blended materials of the six levels store 1, as do water fountains, so the field is the restoration pixel kill, not a decal marker. :observed

## The display option

The renderer keeps a view object whose embedded `DisplayOptions` (type hash `0x1C0637AB`, 254 bytes, started at view offset `0x1C`) holds `InfluenceMode` at options offset `0x4C` (property hash `0xB70D77EF`, view offset `0x68`). The enum is `NormalInfluence` 0, `NoInfluence` 1 and `FullyInfluenced` 2. The neighbouring enums are the render mode at `0x44` and the fill mode at `0x50`. The view is the pointer at offset `0x88` of the renderer; in the recorded build the renderer's view is also reached as `[[0x1C9C7EC]+0x1F8]`. :observed

The influence pass caches its influence binding: it has an initialised byte at offset `0x14`, and the initialisation routine runs once per pass instance when that byte is 0. Changing the mode alone therefore does not change the picture; clearing the byte, as the engine's own reset does, makes the pass re-initialise on the next frame and bind the full-influence texture in mode 2. A pass instance is constructed on a stack in the renderer's caller, so the byte caches per instance, not proven per level. :observed

Mode 2 restores the colours and shading of the world but not the trees, which grow in response to a separate event. :observed
