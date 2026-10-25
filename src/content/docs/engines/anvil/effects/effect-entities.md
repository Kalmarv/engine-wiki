---
title: "Effect entities and sequencing"
description: "Splash particles, FX timelines and ambient and wildlife effect sources."
games: ["riders-republic"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "primase worlds/anvil (entity.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/entity.rs
---

World effects use two systems: SplashFX (`0x755ACE14`) supplies particle states/actions/displays, while FX (`0x824A23BA`) sequences entities, material properties and world/post effects. A placed Entity can reference SplashFX through a Visual or FX through FXComponent. Those chains are resolved against the checked resource index. :observed

| Effect owner | USNAT direct-Entity count | Scope / meaning | Confidence |
|---|---:|---|---|
| SplashFXInstanceData Visual | 831 | 528 waterfall impacts, 130 glows, smoke, flares and other systems | :observed |
| FXComponent | 554 | Plus 125 groups/procedural groups, counted separately | :observed |
| WildlifeSpawner | 837 | 771 FX spawners, 66 animal spawners | :observed |
| Ambient generator | 226,918 | Mostly sound; 465 ash-particle generators | :observed |

Counts describe the 422,503 distinct USNAT Entity ids with patch copies replacing base, not all stored copies or all spawned runtime particles. This selection policy is an offline namespace interpretation; live Riders Republic mount order is not established. :observed :inferred

FXCommand stores CommandType, SkipIntro, SkipOutro, FX reference, TimeScale and FXObjectParameters. FXComponent adds EnableDynamicActivation, StopWhenNotVisible, StopWhenMoved and squared start/stop distances. Its parameter grammar reaches every one of 1,089 measured bodies. :observed

FX elements include spawned entities, material overlays, post effects, world changes and target-entity properties. `MAD_FX_UFOBeam` references an ordinary beam-mesh Entity and a SplashFX Entity; effect sequencing itself is not the mesh. :observed

:::open[How is every wildlife feedback chain connected?]
WildlifeFxData → WildlifeFxPack → Feedback is resolved, but the final Feedback-to-Splash hop is not decoded for all profiles. Group positions and runtime spawning counts are outside the direct-Entity census. :unknown
:::
