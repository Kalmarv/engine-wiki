---
title: Particle appearances in the executable
description: "The classes of Sekiro's executable that draw an effect's particles, what its billboard appearance keeps for each particle (size multipliers, rotation, packed colour), the random numbers and constants it uses, and what is not yet read."
games: [sekiro]
---

An [FXR effect file](/engines/fromsoft/effects/fxr/) states what a particle looks like as properties of
[typed actions](/engines/fromsoft/effects/fxr-actions/); the executable turns them into drawn quads. This page records what
the code of Sekiro 1.06 does for one appearance, the billboard, as read from its decompiled functions. The result is the state
the appearance keeps per particle; the vertex data of a draw and the constants of the [effect programs](/engines/fromsoft/shaders/effects/)
are not read.

## The classes

The executable's run-time type information names these classes for effects (namespace `GXFFX`): the appearances
`GXFfxAppearanceBillboardEx`, `GXFfxAppearanceMultiTextureBillboardEx`, `GXFfxAppearanceTracer`, `GXFfxAppearanceModel`,
`GXFfxLensFlareAppearance`, `GXVfxStandardParticleAppearance`, `GXVfxSparkParticleAppearance`,
`GXVfxParticleAppearanceLightShaft`, the area appearances of the force fields (`GXForceField*AreaAppearance`,
`GXCollisionFieldAreaAppearance`) and of water interaction, and the draw classes `GXFfxDrawPass`, `GXFfxDrawContext`,
`GXFfxManager`, `GXFfxSceneCtrl` and `GXFfxGraphicsResourceManager`. :observed[the type descriptors of the image dumped from the
running game]{games="sekiro"} The names of the `Vfx` appearances agree with the GPU particle programs of the effect shader bundle. :inferred

The billboard appearance has a table of 12 virtual methods. :observed{games="sekiro"} Its fourth entry (index 3) builds the state
of the particles made in a call and its fifth (index 4) advances it by a time step. :observed[the functions' stores and loads]
The sixth (index 5) widens a box by the extent a particle can reach, from the offsets, the width and the height. :observed

## The state of a billboard particle

A billboard particle has a record of 24 bytes: two floats (a width multiplier and a height multiplier), three floats (the
rotation about x, y and z, in radians) and a 32-bit colour. :observed{games="sekiro"} The record is made when the particle is
made:

| Bytes | Value |
|---|---|
| 0, 4 | the two scale multipliers, each a property of another property block of the appearance times a random factor between 1 and the `scaleVariationX` or `scaleVariationY` field; with `uniformScale` set the second uses the first's factor, and with a further flag set the height's property is the width's |
| 8, 12, 16 | `rotationX`, `rotationY` and `rotationZ` in degrees times pi / 180; the x rotation is negated |
| 20 | the colour: the product of a vec4 property of the other block and `color2`, each channel clamped to 0 to 1, times 255, rounded, packed as red, green, blue, alpha from the lowest byte to the highest |

:observed[the method's stores, the constants read from the image: 0.0174533 for the degree factor, 255 for the packing, 1.0 for the
lower bound of the scale factor]{games="sekiro"} The property indices are those of the action's first list in the order
[the typed struct](/engines/fromsoft/effects/fxr-actions/) gives (rotations 11 to 13, colours from 7, angular speeds 14 to 19),
and the scale and colour properties of the other block are its indices 1, 2 and 4. :observed The other block is probably the
particle modifier's, whose scale and colour multiply the appearance's own. :inferred

Each step adds, to the three rotations, the angular speed of the axis times its multiplier times pi / 180 times the particle's
time step (`angularSpeedX` and `angularSpeedMultiplierX` and so on, indices 14 to 19); the x speed is negated like the x
rotation. :observed[the update method] A particle's colour above 1 is therefore lost in this record: light brighter than the
stored colour comes from somewhere else. :inferred

The random numbers of the particle are two draws of a shared xorshift generator with a four-word state (shifts 11, 8 and 19),
each turned into a float as the bits of 1.0 plus the draw modulo `0x800001`, minus 1: a number from 0 to 1 inclusive.
:observed[the generator's update steps and the mantissa construction in the method]{games="sekiro"}

:::open[What does the draw method put in the vertex buffer and constants?]
The two draw methods of the appearance (the seventh and eighth table entries) build the corners, texture coordinates and
colours of the quads and select the program. Their decompilation is large (the second is about 4,000 lines of vector
arithmetic); what they write, and what fills `PSCommonBuffer` and `VSCommonBuffer` of the effect programs, is not read.
:unknown{games="sekiro"}
:::
