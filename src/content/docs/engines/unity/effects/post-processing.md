---
title: Post-processing
description: "The post-processing stack SkateBIRD uses and the gameplay profile it applies: depth of field on the bird, lens distortion, chromatic aberration and vignette."
games: [skatebird]
sources:
  - title: Unity Post Processing Stack (v1 and v2)
    url: https://github.com/Unity-Technologies/PostProcessing
    note: the package that ships as Unity.Postprocessing.Runtime.dll
---

SkateBIRD (Unity 2019.4, built-in pipeline) draws its screen effects with the Post Processing Stack: its shaders ship in
`sharedassets0.assets` as `Hidden/PostProcessing/*` and its managed side as `Unity.Postprocessing.Runtime.dll`.
:observed{games="skatebird"} The playground scene has a `Skatebirb Default Postprocessing` root, and the project names a
post-processing layer (layer 31, see [layers](/engines/unity/world/layers-and-cameras/)). :observed{games="skatebird"}

## The gameplay profile

The profile the game applies while skating (`ReactiveGameplayPostProcessing`) has depth of field focused on the bird, about 3 m
from the camera, plus lens distortion, chromatic aberration and a vignette. :observed{games="skatebird"} A camera moved away from
the bird therefore renders a fully blurred, warped frame. :observed{games="skatebird"}

The game's options `DisableDoF` and `DisableVignette` turn depth of field and the vignette off for the player, and they persist to
the save file. :observed{games="skatebird"} A runtime plugin can turn the effects off on the profile's runtime copy without
touching the saved option, for as long as it controls the camera. :observed{games="skatebird"}

## Camera control

SkateBIRD's third-person camera is a Cinemachine rig (`Cinemachine SkateCam 2.0`). Setting `Camera.main`'s rotation takes effect
only when the rotation is re-asserted every frame, because Cinemachine overwrites it otherwise. With the camera yaw equal to the
pose yaw, the measured camera bearing equals the pose yaw to 0.00° on all 8 playable scenes. :observed{games="skatebird"}

After a teleport the game's camera keeps its own orientation. :observed{games="skatebird"}
