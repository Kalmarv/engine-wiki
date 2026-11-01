---
title: Settings files (DatabaseFile)
description: The DatabaseFile XML that holds Forza Horizon 6's render and data-manager settings, its Data and Settings blocks, properties, lists and maps, and the tags that select per-platform and per-scenario values.
implementations:
  - name: "forzatech-formats (settings.rs)"
    url: https://github.com/Kalmarv/forzatech-formats/blob/main/src/settings.rs
---

The render settings of Forza Horizon 6 (`media\Rendering.zip`: `Megatexture.xml`, `Livery.xml`, `DecalManager.xml`,
`Shadows.xml` and 63 more) and the data-manager files of `media\GameTunableSettings.zip` are XML documents whose root
element is `DatabaseFile`. They are [method-22 zip entries](/engines/forzatech/archives/zip/), so they are readable only
decrypted. :proven

This page describes Steam build 25588841. Every XML entry of every zip under `media` (17,498 entries, the encrypted ones
decrypted) was checked for its root element: 72 are `DatabaseFile` (all in those two archives), and 7,992 are binary
(`BXML`), none of which holds the text `<DatabaseFile`. :proven Of the 72, 71 read with a reader that refuses any
element, attribute or content this page does not describe; the 72nd is not well-formed XML (below). The layout is
:proven on those 71.

## Layout

```text
DatabaseFile path=""
  Data path="<object path>" type="<type name>"        the defaults of one settings object
  Settings path="<object path>" [tags="<expression>"]  values that replace the defaults when the tags hold
    property id="<name>" [type=] [value=] [tags=]
      property ...                                     a nested object's fields
      element [type=] [value=]                         a list item; may hold properties and elements
        property ...
      map_element                                      a map entry: exactly one key, then one value
        key [id=] [type=] [value=]
        value [id=] [type=] [value=]                   may hold properties and map elements
```

- The root has a `path` attribute, empty in every file. Its children are only `Data` and `Settings` blocks. :proven
- A `Data` block always has `path` and `type`; a `Settings` block always has `path`, and `tags` on 331 of the 335.
  :proven
- Every `property` has an `id`. A property gives its value in a `value` attribute, or holds nested properties, list
  elements or map elements. A `type` attribute names a value's type where the file states one: `float`, `bool`,
  `vec3`, `string`, `int`, `uint`, `Color`, `float4` and a settings type (`RenderBufferFormatDescriptor`,
  `ShadowMaskPCSSParams`, ...). :proven
- There is no text between elements, no CDATA, no entity reference, no XML declaration and no byte order mark, and the
  files are UTF-8 with CRLF line ends. Comments occur throughout. :proven
- Values are stored as text: numbers in decimal (`0.75`, `240`), booleans as `true` and `false`, vectors as
  comma-separated components (`0.35,0.36,0.15`). :observed

A `Settings` block's `path` may name a nested object (`MegaTexture.Params.MegaTextureGPU`). Its `tags` attribute, and the
`tags` attribute of a single property, is an expression over names such as `Config.Scarlett60Hz`,
`Platform.PC AND Config.EnvStreamingTex.High`, `Seasons.Winter` and `Scenario.PhotoMode`, with `AND`, `OR` and a `-`
prefix for negation. :observed That a block applies over the `Data` defaults when its expression holds is inferred from
the names and the files' comments. :inferred

## Cubemap.xml

`Rendering.zip`'s `Cubemap.xml` closes its last block, `<Settings path="Cubemap.Params.EnvLookupSettings">`, with
`</property>`, so it is not well-formed XML. :proven What the game's own reader makes of that block is not known.
:unknown

## Values the old guesses stood for

| File | Object | What it holds | Confidence |
|---|---|---|---|
| `Megatexture.xml` | `MegaTexture.Params` | `HeightfieldBlendSharpnessPerMip` 240, 235, 230, 225, 220, 220, 220; `MinMip` 0; `DirectionBias` 0.75 (1 in photo mode); `MipBlendBias` 0.22 | :proven |
| `Megatexture.xml` | `MegaTexture.Params.MegaTextureGPU` | `ApplyModulatePerPixelLevel` 5, `ApplyModulateCornersPerPixelLevel` 3, `CheckDiffuseDiagonalsLevel` 5, `NumParallaxMips` 6, `SplatMapAtlasSizeX` 1024, `SplatMapAtlasSizeY` 256 (1024 on PC), `GrassColourTargetFallbackColour` 0.35, 0.36, 0.15 (0.24, 0.27, 0.11 in spring, summer and autumn; 0.47, 0.40, 0.27 in winter) | :proven |
| `Livery.xml` | `LiveryRendering.Params` | `PlayerCarLiveryResolution` 2048 (1024 at `Config.CarLOD.Low`, 4096 at `Extreme`), `OpponentCarLiveryResolution` 1024, `PlayerCarLiveryIntermediateSSAA` 2 and `...MSAA` 1 by default (MSAA 2 at `Medium`, 4 at `High`), `LiveryHighResolutionDecals` true | :proven |
| `DecalManager.xml` | `DecalManagerParams.Params` | only `Enabled` true | :proven |
| `MaterialSystemUtil.xml` | `PixelDepthSettings` | `ZBiasGlancingAngleScale` 5.6 for terrain and 3.5 for `RCSMSettings`, `ZBiasNearPlaneDistance` 1 | :proven |

The values are what the files store. What each name controls in the renderer is read from the name and the file's
comments, not traced. :inferred
