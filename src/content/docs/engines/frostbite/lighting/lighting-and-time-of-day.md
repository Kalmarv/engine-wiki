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
Studio meshes carry Auto and EnlightenType `0`, as do inspected stock props. :observed

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

## Light retirement

An outgoing ToD subworld reports fully unloaded within one frame, but its light ids return to their allocator
130–550 ms later, together in one frame. Loading the next layer immediately after the subworld flag clears can
therefore overlap both layers' light allocations. :observed

ReSkate's unload-before-load barrier and per-class light guard address different parts of this pressure.
:sourced[ReSkate] See [limits](/engines/frostbite/runtime/limits/).

:::open[What emission strength remains visually stable across ToDs?]
The exposure intervals suggest a narrow common range, but no calibrated emission ramp across all ToDs
establishes a universal strength-to-appearance rule. :unknown
:::
