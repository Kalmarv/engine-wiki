---
title: Shader bundles and permutations
description: Shaderbdle containers, program stages, DXBC and DXIL, and material permutation selection.
implementations:
  - name: primase worlds/fromsoft (read/shaders.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/sekiro/read/shaders.rs
---

Shader bundles group compiled programs and binding metadata for one shader family. A material's shader path names
the family; its switches select programs within that family. :observed

The main `/shader/shaderbdle.shaderbdlebnd.dcx` holds `<family>.shaderbdle` members. Each is itself a binder of
programs and a `.metaparam`. :observed Elden Ring also has DLC bundle binders named
`shaderbdle_dlc01.shaderbdlebnd.dcx`, `shaderbdle_dlc02.shaderbdlebnd.dcx`, and a separate
`speedtree.shaderbdlebnd.dcx`, all under `/shader/`. :observed{games="elden-ring"}

| Property | Sekiro | Elden Ring | Confidence |
|---|---|---|---|
| Compiled programs | Shader Model 5 DXBC | Shader Model 6 DXIL in DirectX containers | :observed |
| Material parameters | Named reflected fields | Commonly `SAT_MtdParam`, with metaparam word offsets | :observed |
| Geometry inputs | Ordinary and skinned variants | Ordinary, skinned and SpeedTree variants | :observed |

The parts of these containers, their digest and (for Elden Ring) the `PSV0` record and the feature mask are described on
[Direct3D shader containers](/concepts/d3d-shader-containers/).

Stage file extensions agree with the shader kind in their program containers in Sekiro's bundle census and in
the Elden Ring Academy material-bundle comparison. The Sekiro census checks all 16,428 programs in its 248
bundles without a stage mismatch; Elden Ring's cited check is limited to one area.
:proven[all 248 bundles]{games="sekiro"} :observed{games="elden-ring"}

| Extension | Stage | Confidence |
|---|---|---|
| `.vpo` | Vertex | :proven[all 248 bundles]{games="sekiro"} :observed{games="elden-ring"} |
| `.ppo` | Pixel | :proven[all 248 bundles]{games="sekiro"} :observed{games="elden-ring"} |
| `.hpo` | Hull | :proven[all 248 bundles]{games="sekiro"} :observed{games="elden-ring"} |
| `.dpo` | Domain | :proven[all 248 bundles]{games="sekiro"} :observed{games="elden-ring"} |

The binding metadata is described in [METAPARAM](/engines/fromsoft/materials/metaparam/); material upload rules in
[constant binding](/engines/fromsoft/materials/constant-binding/).

## Sekiro

### Passes and switches

Sekiro layered materials select `<family>_<switch>_Gbuf.ppo` using `GXFT_SATStaticSwitch`. The unskinned vertex
program is `<family>_Gbuf.vpo`, and the skinned variant is `<family>_Gbuf_Skin.vpo`. :observed{games="sekiro"}

Alpha-tested pixel permutations carry `_[A]` and discard against `FC_AlphaRef`. The same family can contain
forward programs with `_Fwd`, and shadowed forward variants `_FwdSdw` and `_FwdSSdw`.
:observed{games="sekiro"}

The forward pass's target 0 is finished colour, unlike the deferred pass's
[G-buffer targets](/engines/fromsoft/shaders/gbuffer/). Forward programs can read scene depth, SSAO, irradiance
volumes, IBL cubemaps and fog in addition to material textures. :observed{games="sekiro"}

Sekiro's `GXFlver_*` material programs instead live together in `/shader/gxflvershader.shaderbnd.dcx`.
Their instance-dependent effect variants include Bloody, Burn, Cm, Df, Cloth, Phantom, ZFeather and Decal;
a material definition alone does not identify which effect an instance uses. :observed{games="sekiro"}

In a castle-interior capture, Sekiro uses reversed depth with `GreaterEqual`, and disables depth writes on matched
materials carrying `g_GX_bDisableDepthWrite`. Matched `g_BlendMode = 2` forward draws use additive
`SrcAlpha / InvSrcAlpha` colour blending and `One / Zero` alpha blending; G-buffer draws do not blend.
The captured cull state follows the face set rather than a single material-wide value. :observed{games="sekiro"}

:::open[What selects every runtime permutation and render state?]
The material switch does not explain every instance-dependent pass choice. The cited capture does not establish
blend modes 3–5 or a material field predicting every depth-bias change. :unknown{games="sekiro"}
:::
