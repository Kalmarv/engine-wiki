---
title: "SplashFX particles"
description: "States, birth actions, display classes and particle resources."
games: ["riders-republic"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "primase worlds/anvil (entity.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/entity.rs
---

SplashFX stores states and actions, with Display2D, DisplayMesh and DisplayTrail rendering forms. Its checked registry fields include States, AllActions, UpdateEvenWhenNotVisible, MinimumFPS, MaximumDT, SoundEmitterCount, GlobalEmitters, BirthRateFactor, AlphaFactor, DataDrivenSeed, ResetWhenUnshare, AbsoluteMaxViewableSquareDistance and Preroll. :observed

| Structure | Fields / measured behavior | Confidence |
|---|---|---|
| SplashState | Actions, NumParticlesMax, StateIndex, duration-like float, MaxSoundEmitterCount | :observed |
| SplashBirth | FlowMode, BirthParam, Delay, RateOfEmissionPerMeter and spawn flags | :observed |
| FlowMode | Once 0, AllAtOnce 1, Loop 2, Animated 3 | :observed |
| Display2D | Material and billboard orientation | :observed |
| DisplayMesh | Mesh and material, e.g. butterfly geometry | :observed |
| DisplayTrail | Trail rendering data | :observed |

In the 256-resource effective SplashFX population (four archives, patch copies replacing base), 500 material-reference occurrences reach particle-template materials: 279 alpha-blended, 90 opaque, 76 additive and 55 alpha-additive. Textures include flipbooks and gradients; one display-material reference is not necessarily a unique Material. :observed

The measured birth-action population contains 366 Loop, 112 AllAtOnce and 49 Once actions. Glows and spotlight flares can use single-particle camera-facing sprites, whereas waterfall spray, falling leaves, smoke and trails require their animated state. A static sprite or mesh alone does not establish particle simulation. :observed

SplashFXInstanceData starts with instance count and matrices, BoundingVolume, optional shader constants and a resource link. Some UI reticles include a present SplashFX pointer, unlike the common null form, so one fixed 179-byte rule does not cover every Visual instance: the two `SplashFX_ReticuleCenter` Visuals are 256 bytes with the pointer present, against 206 bytes for the 22 null ones of the same family. :observed

:::open[What is the complete particle simulation algorithm?]
State/action metadata and sampled values do not establish all emission, lifetime, random-seed, collision-test or billboard-selection behavior. :unknown
:::

SplashEmitterShape has 23 bytes beyond its listed registry fields in inspected bodies. Emitter-shape parameters, SplashColorGradient keys and sampled-curve values are not fully decoded, so exact particle rates, colors and sizes are not established by the registry alone. :observed
