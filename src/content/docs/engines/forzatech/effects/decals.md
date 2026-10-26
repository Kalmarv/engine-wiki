---
title: Decals and road markings
description: How Forza Horizon 6 draws road paint and facade decals as lifted alpha-tested meshes, the projected box decals, and the depth and blend state the files do not hold.
---

FH6 has three kinds of decal: **road decal meshes** (paint, crossings, kerb grills, seams) that are geometry lying a few
millimetres above the road, **mesh decals** on facades drawn by the deferred-decal pass, and **projected decals**, unit boxes that
paint a texture onto whatever surface lies inside them. Decal meshes are identified by **shader family**, not by name: many are
called `Material__27`, `stripes_3` or `Top_2`, and the mesh bucket does not help (terrain decals carry bucket `0x38`, not the decal
bit `0x02`). :observed

Counts come from a recorded census of the Tokyo track `Brio`; the install is no longer available. :observed

## Road decal meshes

The shader families `uber_roaddecal` and `uber_roaddecalretro` draw hard cut-outs into the G-buffer (`_AM`: `DecalMaskATexture`
dithered and alpha-tested; the diffuse alpha is not opacity). Road markings are alpha-test decals, parent material
`Decal_D1n1p1_Retro_Alphatest`, with the paint shape in the alpha. :observed The shipped geometry already lifts them: measured on 1,042
road-decal meshes all sit 5 to 25 mm above the road, terrain or pavement, with patch stacks stepping about 1 mm per layer (7.8, 8.8,
9.9, 10.7 mm) and paint lines about 17.6 mm; 209 facade decal meshes sit a median 2.2 mm in front of the wall. Vertex positions are
quantised to 0.98 mm, so these offsets are deliberate. :observed Another description of the same data gives the decals a
constant 12 mm lift; no measurement behind it is recorded. :inferred

On top of that every non-instanced G-buffer vertex shader adds a per-draw depth offset:
`SV_Position.z = clip.z + clip.w · ((rc & 127)/127 · cb2[141].w + cb9[24].w)`, where `rc` is a per-draw root constant (possibly the
mesh `bucketOrder`; road decals use 128 to 255) and the other two are run-time constants, so its size in metres cannot be
recovered. :observed A 24-bit depth buffer with a 0.1 m near clip loses a 7.8 mm gap at about 114 m, which is why a viewer
without the engine's depth offset shows flicker. :inferred

In the Shibuya pilot area (1,200 m square) the decal-family meshes number 10,316 against 67,860 others. :observed

No shipped file holds the depth, raster or blend state: the `.pso` files are plain shader containers, and the executable has preset
names such as `DecalGreaterEqual` and `ZBiasDecalOpaque`, with values in encrypted settings. :unknown

## Mesh decals

`environmentdeferreddecal` mesh permutations (`_Standard_DR`, `_DR_NAO`, `_DR_ST`; 472 ordinary decal materials in a Shibuya area) use
a separate deferred-decal pass that blends into a decal buffer; their outputs are on [Other world families](/engines/forzatech/shaders/world-families/).
:observed

## Projected decals

The `environmentdeferreddecal` family has mesh permutations and **projected** ones (`_Projected_DR`, `_Projected_DR_NAO`), chosen by
the material switch `Projected` (type-4 parameter, merged through the parent chain). Projected materials sit on 20-vertex `dec_def_*`
meshes (`mural_a`, `spceprt_logo`, `rush_a`; 20 ribbon instances): a unit box (position scale 0.5, ±0.5) drawn as a volume. From
`environmentdeferreddecalDeferredDecalsLightScenario_I.pcdxil.pso`: :observed

```
inst  = PackedTrackInstance (StructuredBuffer, stride 64) = the .pgeo record layout: int3 pos (sign-magnitude 16.16; the shader divides
        the fraction by 65535), float3 A = row0, float3 B = row1, float3 scale
C     = cross(A, B)
P     = world position from the depth buffer: ndc = (2u − 1, 1 − 2v, depth), P = invViewProj · ndc / w (+ the camera origin offsets in
        cb2 registers 23 and 24)
d     = P − inst.pos
L     = (dot(d, A)/scale.x, dot(d, B)/scale.y, dot(d, C)/scale.z)          box space
discard if any |L| > 0.5                                                   outside the unit box
n     = normalize(cross(ddx(P), ddy(P)))                                   receiving surface normal
discard if dot(n, normalize(B/scale.y)) < 0.6                              faces within 53.13° of local +Y
uv    = (1 − saturate(L.x + 0.5), saturate(L.z + 0.5))
c     = DiffAlphaTex(uv · DiffAlphaUVTiling)                               (material r9.y, tiling r1.zw)
r     = RoughMetAOTex(uv · RMAOUVTiling).r                                 (material r9.w, tiling r2.xy)
alpha = c.a · DiffRoughIntensity · (VertexAlphaOnOff ? COLOR.a : 1);  discard alpha < 0.01
out   SV_Target0 = (c.rgb, alpha)   SV_Target1 = (0, 0, 0, 0)   SV_Target2 = (1 − r, 0, 0.5, alpha)
```

So the decal paints `DiffAlphaTex` over the box's local XZ square, projected along its local Y axis, onto whatever surface is already
drawn inside the box. The texture indices are in material register 9 (`y` DiffAlphaTex, `z` NormalTex, `w` RoughMetAOTex: `TXMP`
slot n at dword 20 + index); tilings and switches follow `CBMP` (`r1.zw` DiffAlphaUVTiling, `r2.xy` RMAOUVTiling, `r4.w`
DiffRoughIntensity, `r7.y` VertexAlphaOnOff). The same registers feed the `_Standard_DR` mesh permutation, whose roughness was
matched by interpreting its compiled shader on real materials (max error 1e-7). :observed The world is left-handed and screen y
points down, so `cross(ddx P, ddy P)` points out of the visible surface toward the camera. :observed On the four `dec_def_rush_a`
instances (game x ≈ 993, z ≈ −5868) the logos land on the dock plates and read the right way round in a top-down view. :observed

Not in any shipped file: how `alpha` composites into the decal buffer (the blend state is in encrypted settings), the decal's
roughness and `_NAO` normal outputs, and the in-game look. :unknown

:::open[Is there a constant 12 mm decal lift?]
The measurement over 1,042 road-decal meshes finds lifts from 5 to 25 mm in steps of about 1 mm, not one constant; a 12 mm
constant lift is stated elsewhere without a method. Whether 12 mm is the lift of one class of decal (patches, paint) or a
misreading is not established.
:::

:::open[How do decals composite into the G-buffer?]
The decal buffer's blend operation and its resolve into the G-buffer are in no readable file. The shader outputs are traced; the
composite is not.
:::
