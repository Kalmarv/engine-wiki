---
title: Materials
description: "The Material object: shader reference, saved properties (textures with tiling, floats, colours), keywords, tags and render queue, and how the draw pass is chosen."
games: [skatebird, sledding, peak, big-walk]
sources:
  - title: Unity manual, Materials and ShaderLab
    url: https://docs.unity3d.com/Manual/materials-introduction.html
    note: property types, render queue and tags
  - title: Unity built-in shaders (builtin_shaders-2019.4.20f1)
    url: https://unity.com/releases/editor/archive
    note: the downloadable built-in shader source for 2019.4.20f1
implementations:
  - name: unity-formats (material.rs)
    url: https://github.com/Kalmarv/unity-formats/blob/main/src/material.rs
---

A **Material** (class 21) names a [shader](/engines/unity/shaders/shader-objects/) and stores the values of its properties.
What the values mean depends on the shader: the same property name is a colour in one shader and a factor in another, see
[built-in shaders](/engines/unity/materials/builtin-shaders/). :sourced[Unity manual]

## Stored fields

| Field | Content | Confidence |
|---|---|---|
| `m_Shader` | reference to the Shader object (null for a missing shader) | :observed |
| `m_SavedProperties.m_TexEnvs` | pairs of property name and `{m_Texture, m_Scale, m_Offset}` | :observed |
| `m_SavedProperties.m_Floats` | pairs of name and `f32` | :observed |
| `m_SavedProperties.m_Ints` | pairs of name and integer (newer Unity versions) | :observed{games="sledding"} |
| `m_SavedProperties.m_Colors` | pairs of name and RGBA, gamma-encoded as stored | :observed |
| `m_ValidKeywords`, `m_InvalidKeywords` | enabled keywords, and keywords the shader does not declare (Unity 2021.2 on) | :observed{games="sledding"} |
| `m_ShaderKeywords` | one string of keywords separated by spaces (before 2021.2) | :observed{games="skatebird"} |
| `stringTagMap` | tag name and value, e.g. `RenderType` | :observed |
| `m_CustomRenderQueue` | −1 means the shader's queue | :observed |

**Tiling.** A texture property's `m_Scale` and `m_Offset` are the shader's `<property>_ST` constant; they use Unity's
bottom-left origin for v, so a consumer with a top-left origin flips the v offset. :observed

**Colours.** A colour property is gamma-encoded as stored; the linear value is the sRGB decode per channel. :observed
Floats and colours can hold non-finite numbers used as sentinels: SkateBIRD's materials can carry `_CameraFadeParams` with an
infinite component. :observed{games="skatebird"}

## Render queue

A material's queue is its own `m_CustomRenderQueue` when it is not −1, else the `Queue` tag of its shader's subshader, else
Geometry (2000). A tag value is a name with an optional offset (`Transparent+10`) or a number. :sourced[Unity manual]

| Queue name | Value |
|---|---|
| Background | 1000 |
| Geometry | 2000 |
| AlphaTest | 2450 |
| GeometryLast | 2500 |
| Transparent | 3000 |
| Overlay | 4000 |

All :sourced[Unity manual]

## Which subshader and which pass draw the surface

A shader holds subshaders, each a list of passes. Unity takes the first subshader the render pipeline supports: under the
Universal Render Pipeline, the first that carries the `UniversalPipeline` render pipeline tag or none; under the built-in
pipeline, the first without a render pipeline tag. :observed{games="skatebird sledding"}

Within the subshader the surface is drawn by one pass, chosen by its `LightMode` tag (compared ignoring case; Unity stores
some upper-cased, `FORWARDBASE`):

| Pipeline | Pass that draws the surface | Confidence |
|---|---|---|
| URP | the first pass with `LightMode` absent, `SRPDefaultUnlit`, `UniversalForward` or `UniversalForwardOnly` | :observed{games="sledding"} |
| built-in forward | `ForwardBase` (the main-light pass); `ForwardAdd` passes only add lights over it. Without one, the first unlit pass (`LightMode` absent or `Always`), else the first vertex-lit pass (`Vertex`, `VertexLMRGBM`, `VertexLM`) | :observed{games="skatebird"} |

A pass that is a `UsePass` of another shader's pass or a `GrabPass` (a screen copy) has no state of its own and is not the
surface pass. :observed

## Blending, cutout and culling

The pass's render state gives the blend factors (Unity's `BlendMode`: 0 Zero, 1 One, 5 SrcAlpha, 10 OneMinusSrcAlpha, ...),
whether it writes depth and what it culls (0 off, 1 front, 2 back). A factor can be bound to a material property
(`Blend [_SrcBlend] [_DstBlend]`), in which case the property's value gives it. :observed{games="sledding"} A pass that
blends `One Zero` is opaque; any other blend is a blended draw. :observed

Cut-out is decided by the `_ALPHATEST_ON` keyword, URP's `_AlphaClip`, or the render type `TransparentCutout` (the
material's tag, else its subshader's; the legacy cut-out shaders clip in their programs), at the threshold `_Cutoff`.
:observed{games="skatebird sledding"} A pass with `Cull Off`, or one bound to a property such as URP Lit's `_Cull`, is
double-sided. :observed{games="sledding"}

A pass can blend while writing depth inside the opaque queue range (up to 2500). :observed{games="sledding"}

## Shader state

A shader's compiled render state (`m_ParsedForm`) stores, per pass, every render target's blend and write mask, the depth
test (`zTest`, a `CompareFunction`: 0 disabled, 1 never, 2 less, 3 equal, 4 less or equal, 5 greater, 6 not equal, 7 greater or
equal, 8 always), the depth offset, and the stencil reference, masks and operations for front and back faces. :observed
Unity's defaults are every target blending One Zero with all channels written, a less-or-equal depth test, no offset and a
stencil that always passes and keeps. :sourced[Unity manual]

## Procedural shaders

A shader can build its geometry in the vertex shader from component data and draw a placeholder mesh. Sledding Game's
terrain-park decals use the Shapes package's line, disc, triangle and sphere shaders this way: the mesh in the file is a
placeholder and the GameObject's MonoBehaviours hold the shape, in a layout with no type tree. :inferred{games="sledding"}
