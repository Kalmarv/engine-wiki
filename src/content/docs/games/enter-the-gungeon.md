---
title: Enter the Gungeon
description: "Enter the Gungeon's Unity 2017.4.27f1 Mono build: five version 17 SerializedFiles, 30 UnityFS bundles of format 6 with their type trees, and legacy animation clips."
games: [enter-the-gungeon]
---

Enter the Gungeon (Dodge Roll) is a top-down shooter on [Unity](/engines/unity/) 2017.4.27f1 with the Mono scripting
backend. :observed{games="enter-the-gungeon"} The observations are of Steam app 311690, build 3829397.
:observed{games="enter-the-gungeon"}

## Data in the install

`EtG_Data` holds five [version 17 SerializedFiles](/engines/unity/archives/serialized-files/) (4,285 objects), their type
trees stripped. :proven{games="enter-the-gungeon"} `EtG_Data/StreamingAssets/Assets` and its `dungeons` folder hold 30
[UnityFS bundles](/engines/unity/archives/unityfs-bundles/) of format 6 (header flags `0x43`) with 49 nodes, 34 of them
SerializedFiles that store every type's tree; all 93,034 of their objects decode by those trees.
:proven{games="enter-the-gungeon"}

## What is special

- **The oldest container read here**: version 17, the one before reference type hashes, reference types and type
  dependencies ([container versions](/engines/unity/archives/serialized-files/#container-versions-and-unity-versions)).
  :proven{games="enter-the-gungeon"}
- **Legacy clips**: its 27 AnimationClips are legacy keyframe clips, keyframes without weights
  ([legacy clips](/engines/unity/animation/clips/#legacy-clips)). :proven{games="enter-the-gungeon"}
- **A binary TextAsset**: one TextAsset's `m_Script` is not UTF-8 text, so a reader that takes every string as text refuses
  it. :proven{games="enter-the-gungeon"}
