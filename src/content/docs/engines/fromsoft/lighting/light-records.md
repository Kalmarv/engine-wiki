---
title: Light records
description: "The per-frame PointLight and SpotLight records the light-organize, tiled and per-light programs read, the tiled pass's distance and translucency terms, the shadowed flag at +64 and +128, and where a shadowed local light's shadow is placed."
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
  - {at: 48, size: 4, type: float, name: "TransLightParam.x", level: inferred, note: "the translucency term's strength"}
  - {at: 52, size: 4, type: float, name: "TransLightParam.y", level: observed, note: "the translucency term's exponent, a 32nd of the power; at least 0.01 from Elden Ring's packer"}
  - {at: 56, size: 4, type: float, name: "TransLightParam.z", level: unknown, note: "not read by the unshadowed tiled pass"}
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

### How the tiled pass reads a point record

Elden Ring's unshadowed `GXRend_TileBasedLighting` reads, of each point record, the words at `+0` to `+40`, `+48` and `+52`:
not `SpecColor.w`, `TransLightParam.z`, the radius at `+60` or anything after it. :observed[the installed program's
DXIL]{games="elden-ring"} Its point loop scales distance by `DiffColor.w` (`k = distance × DiffColor.w`) and uses it twice:
an attenuation `1 / (1 + 0.7 k²)` and the wrap of the Lambert term, `(1.4 / (1.4 + k))²`; the specular lobe's width depends
on it too. :observed[the installed program's DXIL]{games="elden-ring"} `1 / DiffColor.w`, the bank word at `+164`, is thus a
distance the light's fall-off is normalised to, not shown to be the size of the emitter. :inferred The point packer
divides 1 by that word with no clamp (`divss` at `0x7ff7e1161309`); the 216 values of the word in Stormveil's bank
`m10_00_00_00_0000` are all finite and between 0.2 and 13, so a stored 0 is never met there. :observed[read from the code of
2.7.2.0; the installed bank]{games="elden-ring"} Over the 20 records of that bank's five lights read back at the Stormveil gate,
`DiffColor.w` is exactly 1 divided by the word: 0.125 on 8, 0.6666667 on 4 and 2 on 8. :observed[four dispatches of one
session]{games="elden-ring"}

The translucency term is `exp2(32 × TransLightParam.y × log2(saturate(L·V)))`, `saturate(L·V)` raised to the power
`32 y`. :observed[the installed program's DXIL]{games="elden-ring"} `TransLightParam.x` is its strength. :inferred The game
keeps both on the light object, where the shared light constructor writes 1.0 to each (`+0x98` and `+0x9C`), and the point
packer (`0x7ff7e1161260`) copies the strength as it is and the exponent as `max(exponent, 0.01)`; the spot packer does the
same. :observed[read from the code of 2.7.2.0]{games="elden-ring"} The floor matters: with an exponent of 0 the term is
`0 × log2(0)` where `L·V` is 0 or less, a NaN that a strength of 0 does not cancel. :proven[the installed program run with
these inputs]{games="elden-ring"} All 20 records above hold (1, 1), the constructor's values; whether any light sets others
is not established. :observed[four dispatches of one session]{games="elden-ring"}

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
  - {at: 64, size: 64, type: "float4x4", name: ViewToLightSpaceMatrix, level: observed, note: "rows that take a view-space position into the spot's space: its two cone axes, its near plane and its beam (below)"}
  - {at: 128, size: 4, type: float, name: LightType, level: observed, note: "as the point record's +64"}
  - {at: 132, size: 4, type: float, name: MinDist, level: observed, note: "the least view depth of the spot's apex and base corners"}
  - {at: 136, size: 4, type: float, name: MaxDist, level: observed, note: "the greatest view depth of the spot's apex and base corners"}
  - {at: 140, size: 4, type: float, name: Pad, level: unknown}
  - {at: 144, size: 16, type: "float4", name: CullPositionAndRange, level: observed, note: "the sphere the organize program culls with: the vertical cone's, plus 0.001 (below)"}
  - {at: 160, size: 16, type: "float4", name: ShadowParam, level: observed, note: "shadowed only: .x read by the shadowed tiled pass"}
  - {at: 176, size: 16, type: "float4", name: ViewportScaleOffset, level: observed, note: "shadowed only: the scale and offset of the spot's region in the atlas"}
```

The spot record's position, range, colours and cone matrix are Sekiro's read-back values (see
[spot lights](/engines/fromsoft/lighting/btl/#spot-lights)). :observed{games="sekiro"} Elden Ring's spot record is known from
the programs' declaration and code alone. :unknown[no read-back]{games="elden-ring"}

### The spot's shape

A spot light is a rectangular pyramid with a near plane: it opens by its own half-angle across each of its two axes, `h`
about the horizontal axis and `v` about the vertical one, and lights only past its near plane `n`, out to its range `L`. For
a BTL spot, `h` and `v` are half the stored full angles (the width at `+184` and the cone angle at `+44`), `n` is the word at
`+188` and `L` the radius (see [spot lights](/engines/fromsoft/lighting/btl/#spot-lights)). Below, `p` is the light's view
position and `right`, `up` and `beam` its horizontal axis, vertical axis and beam in view space. Three spot records of two
Ashina Castle bank spots (30 by 30 degrees with `n` 15, and 90 by 8 degrees with `n` 3, `L` 35) hold the following, to float
rounding (2.8e-6 relative). :observed[3 records, 2 lights]{games="sekiro"}

| Field | Value |
|---|---|
| `ViewToLightSpaceMatrix` row 0 | `right * cot h`, with `-right . p * cot h` in w |
| row 1 | `up * cot v`, with `-up . p * cot v` in w |
| row 2 | `beam * L / (L - n)`, with `-(beam . p + n) * L / (L - n)` in w: the near plane |
| row 3 | `beam`, with `-beam . p` in w |
| `MinDist`, `MaxDist` | the least and greatest of `p.z` and `base.z ∓ L * (tan h * abs(right.z) + tan v * abs(up.z))`, where `base = p + beam * L`: the view depths of the apex and the base's four corners |
| `CullPositionAndRange` | centre `p + beam * a` and radius `a + 0.001`, where `a = L / (2 cos^2 v)`: the sphere through the apex and the rim of the circular cone of the vertical half-angle, plus a margin |

`GXRend_TileBasedLighting` lights a pixel from a spot only where row 2 of its position is above 0, that is past the near
plane. It shades by `max(0, 1 - x^2 - y^2)`, where `x` and `y` are rows 0 and 1 over row 3. :observed[the program's code, read not run]{games="sekiro"}
`GXLightOrganize16` tests `CullPositionAndRange` against the four side planes of each tile and `MinDist` and `MaxDist`
against the tile's depth range. :observed[the program's code, read not run]{games="sekiro"} So the cull sphere and the
depth range choose tiles, and the matrix chooses pixels. :inferred[from the code]

The cull sphere need not contain the light. The 90 by 8 degree spot's base corners lie 35 m from its beam, but its sphere's
radius is 17.6 m. The game therefore lists that spot only in tiles its vertical cone's sphere reaches.
:observed[1 light]{games="sekiro"}

In the executable, the BTL loader passes four values to the spot's frustum setter: the near plane (`+188`), the radius as
the far plane, and the full cone angle (`+44`) and width (`+184`) in radians, each falling back to the other where it is
below 1.1920929e-7. The setter then raises the far plane to at least 1 and each full angle to at least 1 degree. Where the
near plane is not above 0, it takes `far * 0.01` instead. The drawn spot keeps the vertical angle, the aspect ratio
`tan(h) / tan(v)` and the near and far planes. :inferred[code read, Sekiro 1.06]{games="sekiro"}

:::open[Does the cull sphere take the vertical half-angle or the narrower one?]
The one recorded spot of unequal axes is narrower vertically (90 by 8 degrees), so its record cannot tell "the vertical
axis" from "the narrower axis". The code that writes `CullPositionAndRange` has not been located. A read-back of a spot that
is narrower across than up, such as the 10 by 50 degree spot among the five in
[spot lights](/engines/fromsoft/lighting/btl/#spot-lights), would settle it. The rule is also unsampled above a vertical
half-angle of 15 degrees.
:::

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

In Elden Ring no other program reads point `+64`: not the unshadowed `GXRend_TileBasedLighting` (it reads `+0` to `+40`,
`+48` and `+52`), not
the shadowed organize programs `GXLightOrganize8Sdw`, `16Sdw` and `8Sdw_noopt` (they read `+60` and mark every light in its
depth range for the tiled pass), and none of the effect, FLVER, forward or SpeedTree programs. :proven[dxc census of every
program]{games="elden-ring"} No forward material of either game reads `LightType` or any shadow field after it.
:proven[every program that declares the structure]{games="elden-ring"} :observed[the 852 forward materials of the
census]{games="sekiro"} The spot record's `+128` is compared in the same two places: `== 0.0` in `GXLightOrganize8` and
`> 0.0` in `GXRend_TileBasedLightingSdw`. :observed[code read]{games="elden-ring"}

The game writes 1.0 for a light it draws with a local shadow and 0 for every other. At the Stormveil gate four consecutive
dispatches of `GXLightOrganize8` held light 32 of `m10_00_00_00_0000`, the one light among the records whose bank sets its
cast-shadows byte, with 1.0 in all four, and 0 in every other record: four of a bank light that casts none (light 116) and 80 of
lights of no bank. :observed[one light, one session, four dispatches]{games="elden-ring"}
Of Sekiro's nine read-back frames, all 148 records (142 point,
6 spot) hold 0 at the flag: 54 of them (51 point, 3 spot) stand on lights of the area's bank `m11_01` whose cast-shadows byte
is 0, and 94 on no light of it. :observed[nine frames of three sessions]{games="sekiro"} No record of either game holds a value
other than 0 and 1. :observed[the read-back records]{games="sekiro elden-ring"} Sekiro's recorded bank, `m11_01`'s, holds no shadow-casting light, so its records add nothing on the shadowed side. :observed{games="sekiro"}
Sekiro's frame by the Ashina Castle idol lists 19 point lights and no spot lights, all with 0 at the flag.
:observed[one frame]{games="sekiro"}

### Which bank lights are listed

The list does not hold every bank light that reaches what is on screen, and a shadow-casting bank light left out of it is
drawn with no shadow: in the frames below every shadowed per-light pass draws a listed light and the atlas holds that light's
regions alone. :observed[4 frames, 4 sessions, one camera]{games="elden-ring"}

At the Stormveil gate, four frames from four sessions with one camera list 22 point lights (15 in one) and no spot lights.
Two records stand on lights of bank `m10_00_00_00_0000` in every frame: light 32, the only listed light whose bank sets its
cast-shadows byte, which holds 1.0, and light 116, which holds 0. :observed[4 frames, 4 sessions]{games="elden-ring"}
The bank's shadow-casting light 35, a point light of radius 6.5 that stands 6.6 m from light 32, is in none of them, though
its sphere lies inside the view frustum about 36 m from the camera and reaches visible surfaces. :observed[4 frames, 4
sessions]{games="elden-ring"} Reaching was measured against the depth buffer as one frame began (the previous frame's, the
camera unchanged): of 230,400 surface points sampled on a 4-pixel grid, 620 lie within light 35's radius, 237 within light
32's, 2,629 within light 116's and 38,389 within that of light 127, a light that casts no shadow and is not listed either; no
other point light of the bank reaches a sampled point. :observed[one frame's depth]{games="elden-ring"}

The four bank lights that reach the picture split on the byte at bank record `0xC0` (see
[BTL light banks](/engines/fromsoft/lighting/btl/)): the two listed lights have 0 there and the two omitted lights 1.
:observed[4 lights, one view]{games="elden-ring"} The five bank lights listed in another Stormveil session (13, 14, 115, 117
and 142) also have 0. :observed[one session]{games="elden-ring"} In the bank, 161 of the 216 lights have 1 at `0xC0`
(the four bytes from `0xC0` read `01 01 00 01` on 159 of them); among its nine shadow casters, lights 26, 28, 31 and 35 have
1, and 32, 97, 133, 136 and 137 have 0. :proven[every light of the bank]{games="elden-ring"} That the byte keeps a light out
of the list fits these lights but rests on four. :inferred

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
In five further frames at the Stormveil gate, each from its own session with the same camera, the pass runs once in every
frame, after 31 caster draws into the same five regions; in the four of them whose constants were kept, its `b1` holds light
32's record. :observed[5 frames, 5 sessions]{games="elden-ring"} Sekiro's frame by the Ashina Castle idol runs no shadowed per-light pass and draws nothing
into 64-texel regions. :observed[one frame]{games="sekiro"}

## Where a shadowed light's shadow is placed

The fields after `LightType` place the shadow; the shadowed tiled pass and the per-light pass read them only for a shadowed
light. :observed[code read]

- `ProjParam`: the tiled pass takes `.x` and `.y` as the face projection's depth terms and `.w` as the shadow's strength.
  :inferred[from the code's use] Light 32's holds (1.001, -0.008, 0, 1). :observed[1 light]{games="elden-ring"} Its `.x`
  and `.y` are `f / (f - n)` and `-n f / (f - n)` for the far plane `f` = the light's range (8) and the near plane `n` =
  0.008, a thousandth of it, computed in 32-bit floats: equal bit for bit. :observed[1 light, one frame]{games="elden-ring"}
  The per-light pass compares the atlas's depth with `1 - x - y / m`, `m` the distance along the face's axis: the
  reversed depth (1 at the near plane, 0 at the far) the face's camera writes. :observed[the program's DXIL]{games="elden-ring"}
  Whether the near plane is always a thousandth of the range or a fixed 0.008 is not separated by one light of range 8.
  :unknown
- `ShadowCenterPos`: the point the shadow is rendered from, in the frame `g_CameraMatrix` (`cbLightAccParam +128`) takes view
  positions to, with w 1. Light 32's is its stored position moved by the session's render-frame translation, (-34.254, 8.079,
  -0.55, 1). :observed[1 light]{games="elden-ring"} (On frames, see [coordinate frames](/engines/fromsoft/world/frames/#elden-ring).)
- `ViewportScaleOffset[6]`: one cube face each, as a scale (xy) and an offset (zw) of atlas coordinates. The tiled pass picks
  the face by the major axis of `ShadowCenterPos` minus the pixel and makes four depth-compare reads
  (`SampleCmpLevelZero`) of `t7`. :observed[the program's DXIL]{games="elden-ring"} Light 32's six faces have scales of
  ±0.0071 and offsets that put their centres, times 4096, at (32, 32), (160, 32), (32, 160), (160, 160), (288, 32) and (416,
  32): the centres of six 64-pixel squares of the atlas, five of which received the recorded frames' caster draws.
  :observed[1 light, a separate session from the frames]{games="elden-ring"} Every face's scale is (+29/4096, -29/4096) exactly,
  so the 58 central texels of a 64-texel region span the face's 90 degrees. :observed[1 light, one frame]{games="elden-ring"}
  The six faces, in the record's order, are chosen by the light-to-pixel vector `L` (the pixel's position less
  `ShadowCenterPos`), and each samples the atlas at `offset + scale * (u, v) / m`, `m` the largest of `|L.x|`, `|L.y|`,
  `|L.z|`: :observed[`GXLightAcc_DPointLightShadowed1`'s DXIL]{games="elden-ring"}

  | Face | Major axis | u | v |
  |---|---|---|---|
  | 0 | +x | -L.z | L.y |
  | 1 | -x | L.z | L.y |
  | 2 | +y | L.x | -L.z |
  | 3 | -y | L.x | L.z |
  | 4 | +z | L.x | L.y |
  | 5 | -z | -L.x | L.y |
- A spot light's `ShadowParam` and its one `ViewportScaleOffset` do the same for its single region.
  :observed[code read]{games="elden-ring"}

The record of an unshadowed light keeps what the buffer held there before: 80 of the 84 unshadowed records of the Stormveil
dispatches hold non-zero bytes unrelated to the light (`-inf`, 2250, matrix-like rows), and four hold zeros.
:observed[one session]{games="elden-ring"} Sekiro's read-back unshadowed records hold zeros there. :observed{games="sekiro"}
No program reads these bytes where the flag is 0. :observed[code read]

:::open[Does the game shadow every listed light whose bank casts shadows?]
Only one listed shadow-casting light has been read back, light 32, and it is shadowed in every frame that lists it. A
shadow caster can be left out of the list altogether (light 35, above), so the question is about the listed ones: whether a
listed caster can hold 0 (a budget or a distance rule). Bank `m10_00_00_00_0000` has nine shadow-casting point lights and the
area's effects five shadowing spot lights. A frame that lists two or more of them would settle it: the organize program's
buffers and every shadowed per-light pass's `b1`. Lights 97 and 133, 4.7 m apart with 0 at `0xC0`, are such a pair.
:::

:::open[What does the byte at bank record 0xC0 do?]
In the one view measured, it separates the bank lights the game lists from those it leaves out (above). Whether it is a
switch the game reads, which state sets it, and what the bytes at `0xC1` to `0xC3` do, is not established. A frame where a
light with 1 there reaches the picture and is listed would refute the rule.
:::

### How the atlas faces are drawn

The casters of face 0 (+x) of light 32 are drawn with a `cbSceneParam` whose camera sits at `ShadowCenterPos` and looks along
+x, its view's rows right (0, 0, -1), up (0, 1, 0) and forward (1, 0, 0): the face's (u, v) above are its view's x and y.
Its projection's `P00` and `P11` are 0.90625 (58/64: a 64-texel viewport spans 95.6 degrees, its 58 central texels 90), its
depth is reversed (`P22` -0.001001, `P23` 0.008008, `FC_FrustumNear` 0.008, `FC_FarClipInfo.x` 8.0000057), and the same
camera is bound in three consecutive frames. :observed[one session, 15 or 16 caster draws in each of three
frames]{games="elden-ring"} The cameras of the other five faces have not been read back; that each looks along its axis with
the (u, v) above as its x and y follows from how the per-light pass samples them. :inferred

The caster draws into the atlas test depth with `GREATER_EQUAL` and write it, after a clear of the atlas to 0, with a depth
bias of -2, a slope-scaled bias of -3 and no clamp; 15 of the 16 cull no faces and one culls back faces.
:observed[16 caster draws of one frame]{games="elden-ring"}

The per-light pass's `g_aShadowMapInfo[0]` holds the atlas's size and its texel's step, (4096, 4096, 1/4096, 1/4096), and it
uses `.zw` as its filter step. :observed[one frame; the program's DXIL]{games="elden-ring"}

:::open[Where does a second shadowed light go in the atlas?]
Light 32's six regions sit at (0, 0), (128, 0), (0, 128), (128, 128), (256, 0) and (384, 0): the first six cells of a grid of
128 texels in Morton order. :observed[1 light]{games="elden-ring"} The record holds the same six offsets in four frames of
four sessions; in the two of them whose atlas contents as the frame began were kept (what the frame before left there), the
atlas holds depth in five of those cells and nowhere else, so the frame before shadowed no second light either.
:observed[4 frames; 2 atlases]{games="elden-ring"} Whether
further lights take the next cells, and whether every light's region is 64 texels, needs a frame with two shadowed
lights. :inferred
:::
