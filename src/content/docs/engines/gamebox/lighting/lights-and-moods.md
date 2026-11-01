---
title: Lights, decorations and moods
description: "The Gx light classes and the chunks each reads, the spot lights Stadium blocks carry with their stored values, and how a map's decoration leads to a mood with its latitude, day times, directional light and light-map settings."
games: [tmnf]
sources:
  - title: GBX.NET
    url: https://github.com/BigBang1112/gbx-net
    note: version 2.5.0; the Gx light classes, CGameCtnDecorationMood and its day-time property
---

A block's lights are part of its solid: a `CPlugTreeLight` names a `CPlugLight`, which holds a Gx light. The sun is not stored
as a light: a map's decoration leads to a mood file with a latitude and the day's times, and only two of the four Stadium moods
add a directional light. :observed[the install and the 65 campaign maps]

## Light classes

The Gx light classes form two chains, and each class reads its bases' chunks first. :observed[every Light and SceneLight file
of the Game/Stadium packs (26 and 3), compared with GBX.NET]

| Class | Derives from | Chunks of its own | Confidence |
|---|---|---|---|
| `GxLight` (`0x04001000`) | | `0x04001009` | :observed |
| `GxLightNotAmbient` (`0x04006000`) | `GxLight` | | :observed |
| `GxLightPoint` (`0x04003000`) | `GxLight` | `0x04003004` | :observed |
| `GxLightBall` (`0x04002000`) | `GxLightPoint` | `0x04002006` | :observed |
| `GxLightSpot` (`0x0400B000`) | `GxLightBall` | `0x0400B001`, `0x0400B002` | :observed |
| `GxLightFrustum` (`0x0400A000`) | `GxLightBall` | `0x0400A006` | :observed |
| `GxLightDirectional` (`0x04007000`) | `GxLightNotAmbient` | `0x04007002` to `0x04007005` | :observed |

A directional light reads no point or ball chunk. :observed The files
store legacy angles, attenuations and flags, which GBX.NET upgrades on reading; the values on this page are as stored.
:sourced[GBX.NET]

`CPlugLight` has the chunk `0x0901D002`, `CHmsLight` `0x0600C003`, and `CSceneLight` the chunks `0x0A005001`, `003`,
`0x0A009000` and `0x0A00B000`, the last holding its `CHmsLight` [in place](/engines/gamebox/data-model/nodes/#nodes-stored-in-place).
:observed[the install's packs]

## Block lights

Every light the blocks of three maps place (156 in A01-Race, 417 and 92 in two downloaded maps) is a `GxLightSpot` with ball
chunk `0x04002006` and spot chunk `0x0400B002`. :observed[three maps]

A spot shines along its light tree's local +Z. In A01-Race and one downloaded map all 82 `StadiumWarpSpotsGlow` sprite quads
near a light face +Z, and the back faces `StadiumWarpSpotsGlowBack` −Z, as do 68 of 86 lamp-lens patches (the `*Spots`
materials; the other 18 lie within 0.8 m of a neighbouring lamp). :observed[two maps]

| Stored value | Over the lights of the three maps | Confidence |
|---|---|---|
| Attenuation 1 | 0 on every light | :observed |
| Attenuation 2 | 8.12 / radius² on every light, the radius being 24, 32, 40, 48 or 50 | :observed |
| Intensity | 0.12 to 1.0 | :observed |
| Colour | n / 255 as floats | :observed |
| Spot inner, outer | 60/75, 80/100, 90/120, 100/120 | :observed |
| Falloff exponent | 1 or 0.1 | :observed |
| `GxLight` flags | 121 or 105 | :unknown |

With a falloff of 1 / (1 + a₂d²) the light reaches about 0.11 at its radius. :inferred[from the stored attenuation] The spot
angles are full apex angles in degrees, since 120 cannot be a half-angle. :inferred

## Decorations and moods

A map's decoration ID (Day, Sunrise, Sunset or Night) is a collector ident of collection Stadium, the decoration
`Stadium\ConstructionDecoration\StadiumBase32x32<Mood>.TMDecoration.Gbx`, whose mood is
`Stadium\ConstructionDecorationMood\<Mood>.TMDecorationMood.Gbx`. :observed[the install and the 65 campaign maps]

| Mood | Latitude | Longitude | ΔGMT | Sunrise | Sunset | Day time (`0x0303A001`) | Confidence |
|---|---|---|---|---|---|---|---|
| Day | 48 | 0 | 0 | 6 h | 18 h | 0.65 | :observed |
| Sunrise | 65 | 0 | 0 | 10 h | 14 h | 0.53 | :observed |
| Sunset | 50 | 0 | 0 | 10 h | 14 h | 0.75 | :observed |
| Night | 48 | 0 | 0 | 6 h | 18 h | 0.15 | :observed |

Chunk `0x0303A000` holds the latitude, longitude, the offset from GMT and the sunrise and sunset in milliseconds; chunk
`0x0303A001` the day time (GBX.NET's `RemappedStartDayTime`), the skin `Stadium\GameSkin\DayTime.GameSkin.gbx`, which is in no
pack and not among the game's data files, and the folder `Stadium\Media\Moods\<Mood>\`. :observed[the four Stadium moods]
Chunk `0x0303A006`, the sun and moon intensity, is in none of the four. :observed[the four Stadium moods]

The Sunrise and Sunset folders hold `Directional.SceneLight.Gbx`: a `CSceneLight` with a `CHmsLight` and a `GxLightDirectional`
of colour (1, 1, 1), intensity 1, shadow intensity 0.4, reverse intensity 0.3, an emitting angular size of 10 and a flare of 18,
and no direction. The Day and Night folders have none. :observed[the install]

The light map is `LightMap\HmsPackLightMap\TmNations.PackLightMap.Gbx`; its `CHmsLightMapMood` has an ambient range of 0.5 to
1.1 and a directional scale of 1.2. The Sunrise folder also holds a `LightMapSettings.PackLightMapMood.Gbx`.
:observed[the install] The light-map classes read `CHmsLightMap` chunks `0x06021001` to `0x06021004` and `CHmsLightMapMood`
`0x06023000`. :observed[the install's packs]

:::open[What does the day time mean, and where is the sun?]
GBX.NET treats a day time between 0.25 and 0.75 as night, which Nations Forever's values contradict (Day 0.65, Night 0.15), so
the convention is not established. No stored field found gives the sun's direction; the game computes it at run time from
something not yet identified.
:::

:::open[What do the light flags 121 and 105 mean?]
They are the only two values on the block lights measured; their bits are not read.
:::
