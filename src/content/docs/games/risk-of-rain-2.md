---
title: Risk of Rain 2
description: "Risk of Rain 2's Unity 2021.3.45f2 Mono build: version 22 SerializedFiles, Addressables bundles, crunched DXT textures, legacy clips and material-swap object curves."
games: [risk-of-rain-2]
---

Risk of Rain 2 (Hopoo Games) is a third-person roguelike shooter on [Unity](/engines/unity/) 2021.3.45f2 with the Mono
scripting backend. :observed{games="risk-of-rain-2"} The observations are of Steam app 632360, build 25921972.
:observed{games="risk-of-rain-2"}

## Data in the install

`Risk of Rain 2_Data` holds five [version 22 SerializedFiles](/engines/unity/archives/serialized-files/) with their type
trees stripped, and `StreamingAssets/aa/StandaloneWindows64` the Addressables bundles that hold most of the game.
:proven{games="risk-of-rain-2"} The game writes into its data folder: `Config` and `RunReports` change as it is played, so a
manifest of the install leaves them out. :observed{games="risk-of-rain-2"}

## What is special

- **Textures**: 10,816 Texture2Ds in 13 formats, 32 of them crunched DXT, the only BC5 texture of the installs read
  ([formats](/engines/unity/textures/textures/#risk-of-rain-2-and-schedule-i)). :proven{games="risk-of-rain-2"}
- **Object curves**: 5 of its 4,898 Mecanim clips swap a SkinnedMeshRenderer's materials with PPtr curves
  ([object curves](/engines/unity/animation/clips/#object-curves)). :proven{games="risk-of-rain-2"}
- **Legacy clips**: 25 legacy keyframe clips beside the Mecanim ones
  ([legacy clips](/engines/unity/animation/clips/#legacy-clips)). :proven{games="risk-of-rain-2"}
