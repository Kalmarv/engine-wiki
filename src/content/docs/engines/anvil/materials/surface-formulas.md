---
title: Surface formulas and texture roles
description: Shader-verified colour, roughness, metalness, normal, AO and opacity formulas for material families.
games: [riders-republic]
---

Material templates define the meaning of texture channels. A texture labelled Normal can pack metalness and roughness, and a diffuse alpha can mean height rather than opacity. Executing the original pixel programs under Direct3D 11 WARP verifies the formulas below for the stated permutations. :proven[executed families]

Let `sat(x)=clamp(x,0,1)` and `S(x)=x*x*(3-2*x)`. Material textures arrive in the shader's sampling colour space; constants and mask channels follow the particular program's arithmetic. :proven[executed programs]

## Normal frame

For the Fake, Tex1 and Tex2 families, decode `x=2R-1`, `y=2G-1`, `z=sqrt(max(0,1-x*x-y*y))`. The world normal is `normalize(x*T + y*cross(N,T)*w + z*N)`. Blue is not reconstructed Z: it supplies metalness in these packed maps. Random-frame execution agrees within `1-cos(angle) = 1e-5`. :proven[Fake, Tex1 and Tex2]

## Fake and Tex1

| Input | `MAD_Fake` | `MAD_Tex1` | Confidence |
|---|---|---|---|
| Texture bindings | t75 albedo, t76 normal/surface | t75 normal, t76 diffuse, t77 mask | :proven |
| Base colour | albedo RGB | HSV-tinted diffuse, tint weight mask R; multiplied by `1+VCIntensity*(COLOR0.rgb-1)` | :proven |
| Roughness | normal A | `S(sat(normal.A+RoughnessOffset))` | :proven |
| Metalness | normal B | `normal.B*Metalness` | :proven |
| AO | 1 | `1+OnOffAO*(mask.B-1)` | :proven |
| Alpha test | albedo A below `cb2[18].y` discards | diffuse A below `cb2[18].y` discards in the G-buffer path | :proven |

The Tex1 formula matches 40 random colour/surface cases to at most `5.1e-7`; Fake's channel assignment and seven alpha-test cases match exactly. The Fake program negates the geometric normal on back faces and consequently the bitangent, without flipping w. :proven[executed cases]

HSV tint adds Hue, Saturation and Luminosity to HSV coordinates, saturating saturation and value. The hue fraction retains a negative sign: `h' = sign(h+H)*frac(abs(h+H))`, rather than wrapping negative results into `[0,1)`. Ordinary wrapped HSV differs by up to 0.06 in the random checks. :proven[Tex1 execution]

Tex1_Wind and Decals1 use different binding tables from Tex1. Tex1_Wind binds normal t75, diffuse t76 and mask t77, with Hue/Saturation/Luminosity in cb3[14–16], AO at 17, translucency at 18 and UV rows at 19–20. Its roughness and metalness are raw Normal.A/B, with no Tex1 offset curve, metalness scalar or vertex-colour multiplier. Forty WARP cases with random decoy values in wind constants cb3[1–13] match colour and surface formulas within `5.8e-7`; those earlier constants do not affect the pixel outputs. :proven[executed Tex1_Wind]

Decals1 binds normal t75 and diffuse t76 at the mesh UV directly. It applies HSV tint without a mask, uses `S(sat(Normal.A+RoughnessOffset))` and `Normal.B*Metalness`, and AO 1. Its largest material buffer ends at cb3[5]: it has no Tex1 UV rows, AO switch or vertex-colour factor. Forty WARP cases match within `5.2e-7`. :proven[executed Decals1]

Tex1_Emissive uses an emissive mask and scale, and an Alpha scalar. The traced emissive output is mask red times scale divided by t23. :observed[template bindings and pixel data flow]

## Tex2 height blending

`MAD_Tex2` binds A as diffuse t78, normal t75, mask t80, and B as diffuse t76, normal t77, mask t79. Each layer has its own UV transform and HSV tint. :proven[executed opaque permutation]

The blend is defined by the following equations. Diffuse alpha is **height**, not opacity. Fifty random cases match colour, roughness, metalness and AO within `5.5e-7`, and the decoded normal within `1-cos(angle)=6.6e-6`. :proven

```text
w  = sat((COLOR0.a-.5)*AlphaContrast + .5 + AlphaContrast*AlphaOffset)
m  = max(w*heightB, (1-w)*heightA)
wB = max(w*heightB - (m-(1-HeightContrast)), 0)
wA = max((1-w)*heightA - (m-(1-HeightContrast)), 0)
qA = wA/(wA+wB); qB = wB/(wA+wB)
albedo = qA*tintedA + qB*tintedB
albedo *= 1+VCIntensity*(COLOR0.rgb-1)
roughness = qA*S(sat((normalA.a+offsetA-.1)*1.25))
          + qB*S(sat((normalB.a+offsetB-.1)*1.25))
metalness = qA*normalA.b + qB*normalB.b
normal = normalize(qA*decode(normalA) + qB*decode(normalB))
AO = qA*(1+OnOffAO*(maskA.b-1)) + qB*(1+OnOffAO*(maskB.b-1))
```

`MAD_Tex2_Graffiti_Mode` differs: roughness is the weighted raw normal-map alpha, there is no RGB vertex-colour multiplier, and a runtime state selects palette replacements through mask A's red channel. Execution covers states 0–7 and 9 over 2,304 pixels. `MAD_Tex2_TintBFromShaderConstants` uses runtime Neutral constants for B's tint. :proven[executed placed permutations]

## Character surfaces

| Family | Established channel or formula | Confidence |
|---|---|---|
| Classic | BaseColor RGB → colour; Normal RG → frame, B → metalness, A → roughness; Mask B → emission; decal alpha blends a second colour layer | :observed[96 traced four-output permutations] |
| Classic VWIND Details | Detail and decal composition is executed with the template's own constants and maps | :proven[executed permutation] |
| 5Zones | Mask1 R chooses zones at .25/.75; G overrides to zones 4/5 at .25/.75; zone constants supply colour and metalness; Mask1 A controls variance; Mask2 RG gives normals and A roughness | :proven[executed zone families] |
| 5Zones Motifs / Details | Motifs and details add layers to zone colours; detail variants include the mud layer | :proven[executed permutations] |
| Classic SkiSnowboard / Skateboard | Colour and normal layers, roughness, metalness and emission follow their own binding tables | :proven[executed permutations] |
| Skin / Skin_CIN / Skin_LOD | Skin-specific colour and surface paths are traced; a complete execution-backed formula is not established here | :observed[shader trace] |
| Glass_Dirt | Dirt/glass channel paths are traced; full lighting and transmission are not executed | :observed[shader trace] |
| Hair_Anisotropic | Channel dependencies are traced; the complete anisotropic lighting response remains unresolved | :observed[shader trace] |

## Emission and colour space

The material G-buffer's emissive scalar is divided by the exposure texture t23 in the executed emissive families. The ambient lighting path multiplies it by albedo, so a scalar alone is not an absolute radiance or a directly portable luminous intensity. :proven[executed emissive paths] :observed[lighting consumer disassembly]

TextureMap's transfer flag, not a role guessed from its label, selects colour-space treatment. Some normal-labelled BC7 maps carry flag 1 and some albedo-labelled maps carry flag 0. Their exceptions are stored data, not evidence that every normal is linear or every diffuse is sRGB. :observed[all 35,918 texture-property joins]

See [specialized materials](/engines/anvil/materials/specialized-surfaces/) for world-space, ice, screen and procedural families, and [G-buffer classes](/engines/anvil/shaders/gbuffer/) for the different meanings of the output channels.

:::open[Which runtime values complete the material response?]
Exposure, team values, camera-dependent ice colour, null texture fallback and the runtime vertex inputs cannot all be recovered from a Material body alone. The formulas above establish program behaviour for explicit inputs, not a capture of a complete game draw. :unknown
:::
