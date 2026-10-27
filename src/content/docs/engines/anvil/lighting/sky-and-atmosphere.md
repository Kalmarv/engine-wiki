---
title: Sky, atmosphere and time of day
description: The season-to-sky chain, authored controllers, hourly scattering tables, clouds and stars.
games: [riders-republic, "shaun-white-skateboarding"]
implementations:
  - name: anvil-formats Anvil sky reader
    url: https://github.com/Kalmarv/anvil-formats/blob/main/src/sky.rs
  - name: anvil-formats Anvil controller reader
    url: https://github.com/Kalmarv/anvil-formats/blob/main/src/controller.rs
---

The visible sky is evaluated from precomputed scattering data and controller values, rather than being one stored sky image. Event presets choose a season/look, weather preset and hour; the season connects time-of-day and weather controllers to WorldAmbiance and LayeredSky. :observed[resource references and sky program]

## Resource chain

| Resource | Stored role | Confidence |
|---|---|---|
| AmbianceAndTimeOfDayPreset | 29-byte body: byte 1, nine-byte Season link, ten-byte Forecast reference, hour f32, angle f32 and one byte | :proven[all 290 preset bodies] |
| Season | Look name, controller references, WorldAmbiance and parent | :observed[references across 75 season entries] |
| ForecastPreset | Byte and twelve floats; named examples correlate with snow, wetness, dust, fog and cirrus | :observed[framing] :inferred[several float meanings] |
| WorldAmbiance | LayeredSky, overlay, flare images, environment cube and rain/snow/dust textures | :observed[reference positions across 110 resources] |
| LayeredSky | Sun/moon parameters, sky textures, cloud parameters and scattering keyframes | :proven[48 complete registry-ordered bodies] |

The preset's second float is an angle in degrees; its precise runtime meaning is unresolved. It must not be equated with the sun azimuth solely from its range. :observed[values] :unknown[angle role]

Property controllers address fields by paths of CRC-32 names and store float, float4 or byte tracks. Packed track headers include the first key's time in their upper half. The registry-ordered read covers every one of the 20,741 entries across all 140 time-of-day and 63 weather-controller bodies, leaving exactly each entry's 13-byte trailer, or five bytes on the last entry. :proven[all 203 controller bodies]

## LayeredSky profiles

Forty-seven LayeredSky bodies are 3,442,710 bytes with 24 hourly keyframes; WhiteRoom has a 143,994-byte single-keyframe profile and a shorter field prefix. Every body is consumed exactly by the registry-ordered structure. The normal profile's keyframes begin at 582; WhiteRoom's begin at 572. :proven[all 48 bodies]

```layout
title: Scattering keyframe prefix
size: 42
note: The registry-ordered read consumes all 48 LayeredSky bodies exactly.
fields:
  - {at: 0, size: 8, type: u64, name: object identity, level: proven}
  - {at: 8, size: 4, type: u32, name: keyframe class, value: "0x5CDF6DE9", level: proven}
  - {at: 12, size: 1, type: u8, name: managed byte, level: proven}
  - {at: 13, size: 4, type: f32, name: TimeOfDay, level: proven}
  - {at: 17, size: 4, type: u32, name: LUTCRC, level: proven}
  - {at: 21, size: 4, type: u32, name: TransmittanceWidth, value: 256, level: proven}
  - {at: 25, size: 4, type: u32, name: TransmittanceHeight, value: 64, level: proven}
  - {at: 29, size: 4, type: u32, name: InscatterWidth, value: 32, level: proven}
  - {at: 33, size: 4, type: u32, name: InscatterHeight, value: 32, level: proven}
  - {at: 37, size: 4, type: u32, name: InscatterDepth, value: 16, level: proven}
  - {at: 41, size: 1, type: u8, name: IsDataGenerated, value: 1, level: proven}
```

Each 143,422-byte keyframe then contains five counted buffers. Their dimensions and sizes account for its entire remaining body. :proven[all sky keyframes]

| Buffer | Elements and bytes | Confidence |
|---|---|---|
| SkyInscatterLUT | 65,536 half floats, 131,072 bytes; 32×32×16 RGBA16F | :proven[storage] |
| SkyOpticalDepthLUT | 1,024 half floats, 2,048 bytes | :proven[storage] |
| SkyIrradianceLUT | 768 f32, 3,072 bytes | :proven[storage] |
| SunOpticalDepth | 256 float3, 3,072 bytes | :proven[storage] |
| SunScatteringIrradiance | 256 float4, 4,096 bytes | :proven[storage] |

## Atmosphere program

Executing the unmodified plain SunSkyModel pixel program under WARP with a real hourly table establishes a single-scattering model: sampled RGBA is raised to the fourth power; RGB contributes Rayleigh scattering and alpha reconstructs a Mie component. Two Cornette–Shanks phase functions blend at MieG, MieGPeak and MieGPeakBlend. Sun and moon each contribute through their own direction and colour. :proven[plain sky program with Clear_Day table]

The lookup's x coordinate depends on sun elevation, y on the path to the atmosphere boundary and z on view/sun cosine. The program uses ground radius 6,360.19 km and atmosphere thickness 60 km. Sun elevations down to 20 degrees below the horizon fit its lookup. :observed[program constants and arithmetic]

The program adds an irradiance-like term and Milky Way sample, then multiplies radiance by the positive linear lighting scale `cb1[39].x`. That scale is not itself an EV or the grading controller's property also named Exposure. A world snapshot measures sun elevation 51.29 degrees at 08:42:30; it does not establish the full sun-by-hour curve. :observed[program and snapshot]

## Stars, moon and clouds

The Milky Way is a 4000×2000 BC1 equirectangular map, sampled as `u=.5-azimuth/(2*pi)`, `v=.5-elevation/pi` after a star-frame rotation. The moon has a sprite and contributes to atmospheric scattering as a second directional source. :observed[stored maps and shader]

The star vertex program reads a structured buffer with 16-byte entries and emits six vertices per star. Its multipliers fit right ascension in hours, declination in degrees and magnitude. The astronomical interpretation is inferred from those constants; the source of the star buffer is unresolved. The complete LayeredSky serialization contains no stored star-catalog field. :observed[program and complete serialization] :inferred[astronomical units]

Cloud fields include cover, altitude, thickness, movement and cirrus textures. Dedicated cloud evaluation, sky-mask, sun/moon-disc and sun-cloud-occlusion programs are identified by the engine shader table; their complete rendering response is not established by the plain-sky execution. :observed[registry and shader table]

:::open[How are sky tables and controllers evaluated together?]
The runtime interpolation between hourly tables, full sun trajectory and azimuth frame, cloud model, star-buffer source and full exposure-to-display pipeline remain unresolved. The WARP sky result is a program-level check with explicit inputs, not a matched game screenshot. :unknown
:::

## Shaun White Skateboarding

:only[shaun-white-skateboarding]

Each world's root entry holds one `SkyLight` object (`0x77EEEBB4`, named `01_SkyLight` in level 01, body 200 bytes): a 106-byte prefix and an inline `SunLight`. The sun colour, intensity and the ambient colour are fixed by the executable's property descriptors and its serialiser. :observed{games="shaun-white-skateboarding"}[level 01 and the executable]

| Body offset | Size | Value in level 01 | Meaning | Confidence |
|---:|---:|---|---|---|
| 9 | 12 | (0.46, 0.27, 0.85) | A direction vector; its sign convention is not established | :observed |
| 29 | 4 | `FFF9F1DE` | Sun colour, packed | :observed |
| 33 | 4 | 2.5 | `SunLightIntensity` | :observed |
| 62 | 12 | three small finite floats | A `Vec3` property; not references | :unknown |
| 74 | 16 | (70, 70, 70, 50) of 255 | `AmbientColor`, a `Vec4` | :observed |
| 90 | 16 | (120, 120, 120, 0) of 255 | A `Vec4` whose property hash is `0xEA0E031C`; unlabelled | :unknown |

The ambient colour of the six levels is grey, 70, 70, 70, 90, 70 and 50 of 255. The fog and the global ambient controls of the sky are not described. :observed[all six levels]
