---
title: Light records
description: "The per-frame PointLight and SpotLight records the light-organize, tiled and per-light programs read, the shadowed flag at +64 and +128, and where a shadowed local light's shadow is placed."
implementations:
  - name: primase light records (light_records.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/light_records.rs
---

Each frame the renderer packs every local light it draws into one record of a structured buffer: a 208-byte `PointLight` in
`g_LightBuffer` and a 192-byte `SpotLight` in `g_SpotLightBuffer`. A light-organize compute program sorts the records into
per-tile lists, a tiled pass and the forward materials shade with them, and a light drawn with a shadow of its own is drawn
again by a per-light pass that reads its shadow from a local-light shadow atlas. How a bank light's stored values become its
record's colour, range and position is on [BTL light banks](/engines/fromsoft/lighting/btl/#how-the-renderer-takes-a-light);
the tile lists' layouts are under [Tile lists](/engines/fromsoft/lighting/btl/#tile-lists). :observed

Both games declare the two structures with the same fields at the same offsets. :observed[the declarations in fxc and dxc
disassembly] dxc's disassembly of all 50,283 Elden Ring programs finds 10,985 that declare `PointLight`: 65 effect, 30 FLVER
and 24 renderer programs, 7,842 forward materials of the base bundles, 1,368 and 990 of the two DLC bundles and 666 SpeedTree
programs. :proven[every program of the install]{games="elden-ring"} Its 5,847 ray-tracing libraries name the structures only in
their reflection data and bind none of `g_LightBuffer`, `g_SpotLightBuffer` or `cbLightAccLightParam`.
:proven[every ray-tracing library of the install]{games="elden-ring"}

## The point record

```layout
title: PointLight (g_LightBuffer, t19 of the organize program, t61 of the tiled pass)
size: 208
note: Floats. The names are the programs' own. A view-space position is in the frame of g_ViewMatrix (cbLightAccParam +64).
fields:
  - {at: 0, size: 12, type: "float3", name: "PositionAndRadius.xyz", level: observed, note: "the light's position in view space"}
  - {at: 12, size: 4, type: float, name: "PositionAndRadius.w", level: observed, note: "1 / radius^2"}
  - {at: 16, size: 12, type: "float3", name: "DiffColor.rgb", level: observed, note: "the diffuse colour"}
  - {at: 28, size: 4, type: float, name: "DiffColor.w", level: observed, note: "1 / the bank light's word at +164: scales distance in the wrapped Lambert term"}
  - {at: 32, size: 12, type: "float3", name: "SpecColor.rgb", level: observed, note: "the specular colour"}
  - {at: 44, size: 4, type: float, name: "SpecColor.w", level: observed, note: "the specular colour's Rec. 601 luma; no Elden Ring program reads it"}
  - {at: 48, size: 12, type: "float3", name: "TransLightParam.xyz", level: observed, note: "translucency parameters"}
  - {at: 60, size: 4, type: float, name: "TransLightParam.w", level: observed, note: "the radius"}
  - {at: 64, size: 4, type: float, name: LightType, level: observed, note: "0: unshadowed; above 0: drawn with a local shadow this frame (below)"}
  - {at: 68, size: 12, type: "float3", name: Pad, level: observed, note: "read by no Elden Ring program"}
  - {at: 80, size: 16, type: "float4", name: ProjParam, level: observed, note: "shadowed only: .x and .y the shadow depth terms, .w the shadow's strength"}
  - {at: 96, size: 16, type: "float4", name: ShadowCenterPos, level: observed, note: "shadowed only: the point the shadow is rendered from, w 1"}
  - {at: 112, size: 96, type: "float4[6]", name: ViewportScaleOffset, level: observed, note: "shadowed only: the scale (xy) and offset (zw) of six cube faces in the atlas"}
```

The fields up to the radius are read as on [BTL light banks](/engines/fromsoft/lighting/btl/#how-the-renderer-takes-a-light),
matched against the banks' stored values. :observed[the read-back records of Ashina Castle and the Stormveil gate] No program of
Elden Ring reads `Pad`, and its 80-byte variant (below) declares none of the shadow fields.
:proven[dxc disassembly of every program]{games="elden-ring"}

## The spot record

```layout
title: SpotLight (g_SpotLightBuffer, t20 of the organize program, t62 of the tiled pass)
size: 192
note: Floats. The names are the programs' own. No Elden Ring spot record has been read back.
fields:
  - {at: 0, size: 12, type: "float3", name: "PositionAndRange.xyz", level: observed, note: "the light's position in view space"}
  - {at: 12, size: 4, type: float, name: "PositionAndRange.w", level: observed, note: "the range (the bank light's radius); the shader squares it"}
  - {at: 16, size: 16, type: "float4", name: DiffColor, level: observed, note: "as a point light's"}
  - {at: 32, size: 16, type: "float4", name: SpecColor, level: observed, note: "as a point light's"}
  - {at: 48, size: 12, type: "float3", name: TransLightParam, level: observed, note: "translucency parameters"}
  - {at: 60, size: 4, type: float, name: unused_ShadingMode, level: unknown, note: "named unused by the declaration"}
  - {at: 64, size: 64, type: "float4x4", name: ViewToLightSpaceMatrix, level: observed, note: "rows that take a view-space position into the cone's space"}
  - {at: 128, size: 4, type: float, name: LightType, level: observed, note: "as the point record's +64"}
  - {at: 132, size: 4, type: float, name: MinDist, level: inferred, note: "by its name, a view depth bound"}
  - {at: 136, size: 4, type: float, name: MaxDist, level: inferred, note: "by its name, a view depth bound"}
  - {at: 140, size: 4, type: float, name: Pad, level: unknown}
  - {at: 144, size: 16, type: "float4", name: CullPositionAndRange, level: inferred, note: "by its name, the sphere the organize program culls with"}
  - {at: 160, size: 16, type: "float4", name: ShadowParam, level: observed, note: "shadowed only: .x read by the shadowed tiled pass"}
  - {at: 176, size: 16, type: "float4", name: ViewportScaleOffset, level: observed, note: "shadowed only: the scale and offset of the spot's region in the atlas"}
```

The spot record's position, range, colours and cone matrix are Sekiro's read-back values (see
[spot lights](/engines/fromsoft/lighting/btl/#spot-lights)). :observed{games="sekiro"} Elden Ring's spot record is known from
the programs' declaration and code alone. :unknown[no read-back]{games="elden-ring"}

## The shadowed flag

`LightType` (`+64` of a point record, `+128` of a spot's) says whether the light is drawn with a local shadow this frame. Only
two kinds of program read it, and both compare it as a float. The organize programs list a light for the unshadowed tiled
pass only where it equals 0.0; the shadowed (`Sdw`) tiled and compute passes sample the light's shadow only where it is above
0.0. :observed[code read]

| Game | Programs that read point `+64` | The comparison | Confidence |
|---|---|---|---|
| Elden Ring | `GXLightOrganize8`, `GXLightOrganize16`, `GXLightOrganize8_noopt` | `fcmp oeq LightType, 0.0`, which gates the entry's tiled-pass bit | :proven[dxc census of every program]{games="elden-ring"} |
| Elden Ring | `GXRend_TileBasedLightingSdw` | `fcmp ogt LightType, 0.0`, which gates the cube-shadow lookup | :proven[dxc census of every program]{games="elden-ring"} |
| Sekiro | `GXLightOrganize`, `8` and `16`; `GXLightCompute`, `8` and `16` | `eq LightType, 0.0` | :observed[fxc census of the 931 programs that declare it]{games="sekiro"} |
| Sekiro | `GXLight8Sdw`, `GXLightCompute8Sdw`, the other `GXLight*Sdw` and `GXLightCompute*Sdw`, `GXRend_TileBasedLightingSdw` | `lt 0.0, LightType` | :observed[fxc census of the 931 programs that declare it]{games="sekiro"} |

In Elden Ring no other program reads point `+64`: not the unshadowed `GXRend_TileBasedLighting` (it reads `+0` to `+63`), not
the shadowed organize programs `GXLightOrganize8Sdw`, `16Sdw` and `8Sdw_noopt` (they read `+60` and mark every light in its
depth range for the tiled pass), and none of the effect, FLVER, forward or SpeedTree programs. :proven[dxc census of every
program]{games="elden-ring"} No forward material of either game reads `LightType` or any shadow field after it.
:proven[every program that declares the structure]{games="elden-ring"} :observed[the 852 forward materials of the
census]{games="sekiro"} The spot record's `+128` is compared in the same two places: `== 0.0` in `GXLightOrganize8` and
`> 0.0` in `GXRend_TileBasedLightingSdw`. :observed[code read]{games="elden-ring"}

The game writes 1.0 for a light it draws with a local shadow and 0 for every other. At the Stormveil gate four consecutive
dispatches of `GXLightOrganize8` held light 32 of `m10_00_00_00_0000`, the one light among the records whose bank sets its
cast-shadows byte, with 1.0 in all four, and 0 in every other record: four of a bank light that casts none (light 116) and 80 of
lights of no bank. :observed[one light, one session, four dispatches]{games="elden-ring"} Over every read-back record of both
games, 80 of 80 records of bank lights that cast no shadow (28 lights) and 229 of 229 records of lights of no bank hold 0; no
record holds a value other than 0 and 1. :observed[three sessions]{games="sekiro elden-ring"} Sekiro's recorded bank,
`m11_01`'s, holds no shadow-casting light, so its records add nothing on the shadowed side. :observed{games="sekiro"}

### Effects on the tile lists

`GXLightOrganize8` builds each light's per-tile mask from its depth-slice bits and sets bit 15 of the mask (bit 31 of the
stored entry) only where `LightType` is 0.0 and the light reaches the tile's opaque depth range. It stores an entry whenever
the mask is non-zero, so a shadowed light stays in the tile's list with its slice bits and the forward materials still light
with it. The tile's lookup word 2 counts the entries with bit 31 set. :observed[the program's DXIL, read not run]{games="elden-ring"}
The unshadowed tiled pass visits only entries with bit 31 set and discards a tile whose word 2 is 0, so a shadowed light is
left to its per-light pass. :observed[the programs' DXIL]{games="elden-ring"}

## The shadowed per-light pass

Elden Ring draws a shadowed point light with `GXLightAcc_DPointLightShadowed1`, a full-screen pass that takes the light's whole 208-byte record in the constant buffer `cbLightAccLightParam` (`b1`) and its
shadow from `g_LightShadowTexture` (`t7`). It reads every row of the record but `LightType`: its shadow is unconditional.
:observed[the program's DXIL]{games="elden-ring"} Its `cbLightAccShadowInfo` (`b2`) holds one `float4`
`g_aShadowMapInfo[1]`. :observed[the declaration]{games="elden-ring"} By their names, `GXLightAcc_DPointLightShadowed2` to
`4` draw two to four shadowed lights at once. :inferred The 80-byte `PointLight` of the unshadowed per-light
passes `GXLightAcc_DPointLight1` to `12` (`g_aPointLight[N]` in `b1`) ends with `LightType` and `Pad` and holds no shadow
fields. :observed[the declarations]{games="elden-ring"}

In the recorded frames the pass follows a depth-only render into a 4096x4096 R16 target, the local-light shadow atlas, with
the shadow casters drawn into 64x64 regions; it runs once in 2 of 7 frames, after 31 caster draws in five regions, and not at
all in the other five. No frame runs a shadowed organize or shadowed tiled program. :observed[7 frames]{games="elden-ring"} See also [the rendered frame](/engines/fromsoft/lighting/frame/).

## Where a shadowed light's shadow is placed

The fields after `LightType` place the shadow; the shadowed tiled pass and the per-light pass read them only for a shadowed
light. :observed[code read]

- `ProjParam`: the tiled pass takes `.x` and `.y` as the face projection's depth terms and `.w` as the shadow's strength.
  :inferred[from the code's use] Light 32's holds (1.001, -0.008, 0, 1). :observed[1 light]{games="elden-ring"}
- `ShadowCenterPos`: the point the shadow is rendered from, in the frame `g_CameraMatrix` (`cbLightAccParam +128`) takes view
  positions to, with w 1. Light 32's is its stored position moved by the session's render-frame translation, (-34.254, 8.079,
  -0.55, 1). :observed[1 light]{games="elden-ring"} (On frames, see [coordinate frames](/engines/fromsoft/world/frames/#elden-ring).)
- `ViewportScaleOffset[6]`: one cube face each, as a scale (xy) and an offset (zw) of atlas coordinates. The tiled pass picks
  the face by the major axis of `ShadowCenterPos` minus the pixel and makes four depth-compare reads
  (`SampleCmpLevelZero`) of `t7`. :observed[the program's DXIL]{games="elden-ring"} Light 32's six faces have scales of
  ±0.0071 and offsets that put their centres, times 4096, at (32, 32), (160, 32), (32, 160), (160, 160), (288, 32) and (416,
  32): the centres of six 64-pixel squares of the atlas, five of which received the recorded frames' caster draws.
  :observed[1 light, a separate session from the frames]{games="elden-ring"}
- A spot light's `ShadowParam` and its one `ViewportScaleOffset` do the same for its single region.
  :observed[code read]{games="elden-ring"}

The record of an unshadowed light keeps what the buffer held there before: 80 of the 84 unshadowed records of the Stormveil
dispatches hold non-zero bytes unrelated to the light (`-inf`, 2250, matrix-like rows), and four hold zeros.
:observed[one session]{games="elden-ring"} Sekiro's read-back unshadowed records hold zeros there. :observed{games="sekiro"}
No program reads these bytes where the flag is 0. :observed[code read]

:::open[Does the game shadow every listed light whose bank casts shadows?]
Only one shadow-casting light has been read back. Bank `m10_00_00_00_0000` has nine shadow-casting point lights and the area's
effects five shadowing lights; none of the others appears in a read-back record. A read-back of the organize program's buffers
and of every shadowed per-light pass's `b1` in one frame, with two or more of them in view, would show whether a listed
shadow-casting light can hold 0 (a budget or a distance rule).
:::

:::open[How are the atlas faces rendered?]
The camera and projection of each caster face, and what `g_aShadowMapInfo` holds, have not been read back. The per-light pass
uses `g_aShadowMapInfo[0].zw` as its filter step. :observed[the program's DXIL]{games="elden-ring"}
:::
