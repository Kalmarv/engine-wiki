---
title: Schedule I
description: "Schedule I's Unity 2022.3.62f2 IL2CPP build: version 22 SerializedFiles, weighted keyframes and a ping-pong legacy clip."
games: [schedule-i]
---

Schedule I (TVGS) is a first-person simulation game on [Unity](/engines/unity/) 2022.3.62f2 with the IL2CPP scripting
backend. :observed{games="schedule-i"} The observations are of Steam app 3164500, build 25796331. :observed{games="schedule-i"}

## Data in the install

`Schedule I_Data` holds nine [version 22 SerializedFiles](/engines/unity/archives/serialized-files/) (three scenes,
`level0` to `level2`, and their shared and resource files) with their type trees stripped, the IL2CPP metadata in
`il2cpp_data`, and `.resS` and `.resource` streams beside them. :proven{games="schedule-i"}

## What is special

- **Legacy clips with weights**: 187 legacy keyframe clips, 24 of their curves with weighted keys, and one clip that wraps
  ping-pong ([tangents and weights](/engines/unity/animation/clips/#tangents-and-weights)). :proven{games="schedule-i"}
- **Textures**: 3,104 Texture2Ds in 12 formats, among them float formats and BC6H
  ([formats](/engines/unity/textures/textures/#risk-of-rain-2-and-schedule-i)). :proven{games="schedule-i"}
