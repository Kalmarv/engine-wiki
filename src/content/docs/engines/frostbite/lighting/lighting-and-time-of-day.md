---
title: Lighting, GI and time of day
description: Visual environments, local lights, emission, GI modes, exposure and delayed light retirement.
games: [skate]
sources:
  - title: ReSkate world layers
    url: https://github.com/Dingo-Shenanigans/ReSkate/tree/main/Extension/World
---

San Van's time-of-day lighting combines VisualEnvironment bundles with local lights authored in lots. The
21 quality/ToD bundles (three tiers × seven ToDs) contain sun, sky, exposure and GI configuration, but no local
lights. Local lights are overridden in place. :observed

## GI and exposure

`gibs_on` selects `GiRuntimeConfiguration.FallbackGi=1`, ray-traced surfel GI; `gibs_off` selects `3`, GPU probes.
The fallback enum is None/Gibs/CpuProbes/GpuProbes/Null. `Enlighten.Enable` remains true in both tier settings.
San Van uses Enlighten probes and a GI grid; the inspected meshes have no lightmap binding. :observed

Per-object `GibsModeOverride` values None `0` and Auto `1` do not provide an object-level RT-GI disable.
Studio meshes carry Auto and EnlightenType `0`, as do inspected stock props. Ray-traced GI is switched off
globally instead, through `Render.RaytraceEnable`, `GiRuntimeConfiguration.FallbackGi` or the tier subsystem
`DingoTierManager.Subsystem gibs_off`. :observed

| High-tier environment | Minimum EV | Maximum EV | Confidence |
|---|---|---|---|
| Night | 5.7 | 7.4 | :observed |
| Morning | 6.5 | 10.0 | :observed |
| Noon | 7.0 | 11.3 | :observed |
| Afternoon | 7.0 | 11.4 | :observed |
| Evening | 7.0 | 10.0 | :observed |
| Level default | 7.5 | 11.5 | :observed |

These VisualEnvironments enable automatic exposure and store nominal EV 12; the five ToD clamp intervals
overlap only at EV 7.0–7.4. Every inspected ToD VisualEnvironment has ShaderParams NightAmount `0`.
:observed

Exposure and emission have console settings: `PostProcess.ForceEVEnable`, `PostProcess.ForceEV`,
`ForceEVCompensation` and its enable, `EVClampEnable`, `DrawExposureDebugInfo`, and
`DingoShaderSettings.EmissiveMult` and `NightTodActive`. `PostProcess.ForceEVEnable 1` with `PostProcess.ForceEV 9`
locks exposure for measurement. Forcing an extreme EV (±1,000,000) turns the screen black for the rest of the
session: neither disabling the force nor setting an ordinary value restores the picture. :observed

## Emission and shader availability

Studio 20261012's `emission_texture`, `emission_color`, `emission_strength` and `emission_srgb` fields clone
the stock LED donor, program 1138. The compiled material writes
`RadiosityMaterial.EmissiveIntensity = 683 * emission_strength`, and LED section vertices have Color0 zero.
There is no ToD condition on those emission fields. :observed

Studio's available map domains are surface, decal, foliage, ocean and glass_opaque. No unlit world program is
identified in the inspected stock material/program set, and ReSkate's merge retains base programs. Black base
colour plus emission is an available material arrangement; a general unlit map-shader route is not established.
:observed

Studio's GI-grid bake is forcibly disabled inside `compile-map` in build 20261012: the compiler clears the
GI option before baking, even when requested. `--no-gi` only changes the notice. Its separate `--enlighten`
option does produce EnlightenDataAsset/DynamicEnlightenEntityData and a database; a measured Warehouse map's
database is 31.6 MB. Presence of a database alone does not establish useful interior illumination. :observed

Every inspected Studio map patches `bam_levelroot/lighting_global` without its DynamicEnlightenEntityData.
Whether that removes useful stock-city Enlighten lighting while the mod is installed is not measured.
:observed :inferred

## Local lights

Only three light classes are used anywhere in the measured data: PbrSpot, PbrSphere and PbrRectangular. No
PbrTube or Old* light is placed. :observed

| San Van | Count | Measured values | Confidence |
|---|---|---|---|
| PbrSpot | 20,686 | OuterAngle in full degrees, median 125 (p10 90, p90 140); InnerAngle median 35; median 85,000 lm; attenuation radius median 13 m (p90 27); ReflectorEnable on 98% | :observed |
| PbrSphere | 4,175 | | :observed |
| PbrRectangular | 43 | OuterAngle 40 | :observed |

The skate-park lots use spots of 85°/45° at 225,000 lm and 27 m, and of 135°/50° at 200,000 lm and 18 m, with
spheres of 75,000 lm; the `cmn_lgt_floodlight_*` fixtures are 95–125°/20–45°, 80,000–130,000 lm and 10–16 m.
San Van ties a fixture's glow to its light through DingoLightComponentData (NightEnabled, Profile, MaterialData).
:observed

A light entity's fields include Intensity in lumens, AttenuationRadius, DiscRadius or SphereRadius, OuterAngle,
InnerAngle and ReflectorEnable. :observed A spot with ReflectorEnable concentrates its lumens into its cone:
with equal 162,813-lm spots 6 m up and inner angle 0, at locked exposure, the floor beside the pool centre is more
than 15.6 times brighter under a 40° cone than under a 180° one, and about 3.9 times under a 120° one. The cone is
therefore not a mask over a fixed distribution. :observed

## Light retirement

An outgoing ToD subworld reports fully unloaded within one frame: its SubWorldReference handle at `+0x80` is
zero, the loaded bit `+0x148 & 1` is clear and the instance at `+0xb0` is zero. Its light ids return to their
allocator 130–550 ms (8–32 frames) later, together in one frame, through the renderer's per-frame pending-removal
list (`Skate+0x4ec3800` to `+0x4ecdda0`). Loading the next layer immediately after the subworld flag clears can
therefore overlap both layers' light allocations. :observed On a city of about 7,500 spot lights per ToD, a
Noon-to-Afternoon switch at level load lost over 7,000 of the incoming layer's spots in 3 of 5 loads. :observed

ReSkate's unload-before-load barrier and per-class light guard address different parts of this pressure.
:sourced[ReSkate] See [limits](/engines/frostbite/runtime/limits/).

:::open[What emission strength remains visually stable across ToDs?]
The exposure intervals suggest a narrow common range, but no calibrated emission ramp across all ToDs
establishes a universal strength-to-appearance rule. :unknown
:::
