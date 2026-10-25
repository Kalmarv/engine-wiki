---
title: Unity
description: "Unity players as SkateBIRD (2019.4), Sledding Game, PEAK and Big Walk (6000.3) ship them: serialized files and bundles, objects and type trees, and what each game builds on them."
sources:
  - title: UnityPy
    url: https://github.com/K0lb3/UnityPy
    note: serialized file and bundle reader, the independent decoder for much of this section
  - title: AssetRipper
    url: https://github.com/AssetRipper/AssetRipper
    note: documents the formats and publishes the type tree packages
  - title: AssetStudio
    url: https://github.com/Perfare/AssetStudio
    note: extractor and clip decoder
  - title: Unity manual and scripting reference
    url: https://docs.unity3d.com/
---

Unity is a general engine, so a game's files look alike and its content differs. A player is a set of **serialized files**
(scenes, shared assets, global settings) holding objects of Unity's built-in classes, plus streamed bulk data and the game's
code; some builds also pack data into **UnityFS bundles**. The games here span two eras of the engine:
SkateBIRD (2019.4.20f1, Mono, built-in pipeline, container version 21) and Sledding Game (6000.3.12f1), PEAK (6000.3.15f1)
and Big Walk (6000.3.17f1), which use container version 22 and the Universal Render Pipeline. :proven[every serialized file of each install]

## What the games share and where they differ

| Area | SkateBIRD | Sledding Game | PEAK | Big Walk | Confidence |
|---|---|---|---|---|---|
| Unity version | 2019.4.20f1 | 6000.3.12f1 | 6000.3.15f1 | 6000.3.17f1 | :proven |
| Container version | 21 | 22 | 22 | 22 | :proven |
| Scripting | Mono | IL2CPP | Mono | IL2CPP | :observed |
| Data layout | loose files | loose files, Addressables for localization | loose files, 208 level scenes in AssetBundles | one `data.unity3d` bundle | :observed |
| Type trees in files | stripped | stripped (kept in bundles) | stripped (kept in bundles) | stripped | :observed |
| Render pipeline | built-in | URP | URP assemblies present | URP | :observed{games="skatebird sledding peak"} :inferred{games="big-walk"} |
| Colour space | linear | not read | not read | not read | :proven{games="skatebird"} |
| Networking | none | FishNet | Photon | Mirror | :observed |
| Physics gravity (m/s²) | −9.81 | −9.81 | −19.62 | not read | :proven{games="skatebird sledding peak"} |
| Terrain | none | nine terrains, 12,321 trees | not read | four terrains | :proven{games="sledding"} :inferred{games="big-walk"} |

Each row is described on the page it belongs to: [serialized files](/engines/unity/archives/serialized-files/),
[bundles](/engines/unity/archives/unityfs-bundles/) and [the data folder](/engines/unity/archives/player-data-folder/) for the
containers; [type trees](/engines/unity/data-model/type-trees/) for the layouts a player strips;
[scripting backends](/engines/unity/runtime/scripting-backends/) and [networking](/engines/unity/runtime/networking/) for the
code. The frame Unity uses (left-handed, +Y up, +Z forward, metres) is on [scenes](/engines/unity/data-model/scenes-and-hierarchy/#the-frame).
:proven

## How the pieces fit

A scene (`levelN`) holds GameObjects, Transforms and components; renderers, colliders and lights name meshes, materials and
textures in the `sharedassets` files. A mesh's vertices and a texture's pixels are often not in the object but in a stream
file beside it. Materials name a shader and store property values; the shader holds its render state and compiled Direct3D 11
programs, from which draw keywords select a variant. :observed

- Geometry: [meshes](/engines/unity/geometry/meshes/), [skinning and blend shapes](/engines/unity/geometry/skinning-and-blend-shapes/).
- Appearance: [textures](/engines/unity/textures/textures/), [materials](/engines/unity/materials/materials/),
  [built-in and URP shaders](/engines/unity/materials/builtin-shaders/), [shader objects](/engines/unity/shaders/shader-objects/),
  [draw keywords](/engines/unity/shaders/draw-keywords/).
- Light: [ambient light and probes](/engines/unity/lighting/ambient-and-probes/), [lights](/engines/unity/lighting/lights/).
- World: [layers, cameras and culling masks](/engines/unity/world/layers-and-cameras/), [terrain](/engines/unity/terrain/terrain-data/),
  [colliders and physics](/engines/unity/collision/colliders/).
- Animation: [clips](/engines/unity/animation/clips/), [controllers](/engines/unity/animation/animator-controllers/),
  [humanoid muscles](/engines/unity/animation/humanoid-muscles/).
- Games' own rules: [SkateBIRD](/engines/unity/gameplay/skatebird-scripts/), [Sledding Game](/engines/unity/gameplay/sledding-scripts/),
  [Big Walk](/engines/unity/gameplay/big-walk-systems/).

## Traps that cut across games

- A reader accepts the container versions it was checked against and refuses others; versions 21 and 22 differ in header and
  object table widths. :proven
- Layouts depend on the Unity version: field names change (`dynamicFriction` against `m_DynamicFriction`), the shader program
  storage changes at 2021.2, and a layout package can lack the exact patch version of a build. :observed
- A player strips type trees; a script's fields have no description at all and must be measured or recovered from code. :observed
- State is data: an inactive GameObject or a disabled component is stored, not omitted, and what a camera draws depends on
  culling masks. :observed
- Linear and sRGB are per texture and per property; colour properties are stored gamma-encoded. :observed
