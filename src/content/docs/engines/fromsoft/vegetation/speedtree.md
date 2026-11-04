---
title: SpeedTree geometry and instances
description: Elden Ring's stored vegetation streams, runtime instance inputs, LOD blending and wind-off state.
games: [elden-ring]
implementations:
  - name: fromsoft-formats (flver/mod.rs)
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/flver/mod.rs
---

Elden Ring's SpeedTree models are FLVER files with header word `0x8000` at `0x6A`. Their layouts declare both
stored vertex members and a per-instance stream supplied at draw time. All 119 SpeedTree models in the asset and map binders declare those two stream classes.
The independent reader refuses all 119; their stored streams are read separately and their non-billboard
geometry is checked against the vertex programs. :proven[all 119 SpeedTree models]

The game's own G-buffer vertex program is executed for every non-billboard mesh vertex in the asset and map
population, with identity instance transforms, finest LOD and wind disabled. Position and UV agree exactly;
normalized normals and tangents agree within `1e-6`. This establishes the windless decoding under those inputs,
not animated wind behaviour. :proven[executed vertex programs]

Elden Ring places them 70,014 times in 1,349 layouts. :observed

## Stored and runtime streams

The first member word splits into a low 16-bit stream number and a high 16-bit modifier. Modifier `0x8000` marks
an unstored member; offsets advance independently within each declared stream. :proven[all 119 SpeedTree models]

| Input | Content | Confidence |
|---|---|---|
| Stored Half4 `TEXCOORD2.xyz` | Rest position in model coordinates | :proven[executed vertex programs] |
| Stored Half4 `TEXCOORD3.xy` | Texture coordinates | :proven[executed vertex programs] |
| Last two texture inputs read by the program | Normal and tangent, usually the two UByte4Norm members | :proven[executed vertex programs] |
| Runtime `POSITION.xyz`, `.w` | Instance translation and scale | :observed |
| Runtime `TEXCOORD1.xyz` | Instance X basis | :observed |
| Runtime `TEXCOORD0.xyz` | Instance Y basis; third basis is their cross product | :observed |
| Runtime `TEXCOORD0.w` | LOD interpolation, 1 for finest position | :observed |

The `TEXCOORD` numbers are the programs' input slots, not the model's UV sets: instance axes and rest positions take some of
them, and `TEXCOORD3.xy` reads the model's first texture-coordinate set. Counting `TEXCOORD` labels as UV sets names a set the
mesh does not have. :observed[the vertex programs' input bindings]

Three meshes of `AEG801_258` are exceptions to taking the two byte members as the frame: their programs read a
Half4 UV5 member as the normal input. The input selected by the program determines its role. :proven[executed vertex programs]

The stored frame unpacks as `x*2-1`. Its pixel program applies sampled normal X along the stored tangent `T` and
Y along `-w*(N×T)`; this differs from the ordinary layered-program convention. :observed

The stored rest positions are in the model file's frame and line up with the asset's collision. :observed
`AEG801_258`, with the three exceptional meshes, is placed 194 times. :observed A SpeedTree model's binder also
holds an ordinary FLVER, `<model>_1.flver`. :inferred

## Level selection in the running game

A draw of a SpeedTree model draws all its instances with one face set, so the instances of a model are split into one draw
per face set. In the main-view G-buffer of four frames, nine models are drawn with two face sets in one frame. For eight of
them no instance of the nearer set is farther from the eye than 76.0 m (the instance origin's distance, not the box's) and no instance
of the farther set is nearer than 77.1 m; the ninth uses its nearer set out to 80.9 m and its farther one from 111.3 m. :observed[nine models of four frames]{games="elden-ring"}
The instance stream's `TEXCOORD0.w` is 1 on every instance up to 54.6 m. It is below 1 on five instances of two models at 71.4 to
83.0 m (0.706 at 71.4 m, 0.506 at 77.4 m, 0.468 at 80.9 m, 0.346 at 82.2 m and 0.330 at 83.0 m), where those instances still draw the
nearer set; it falls with distance but not as one line for both models. :observed[two frames]{games="elden-ring"}

## Wind and billboard cards

The checked wind-off input sets row 3, Y of `VC_SpeedTreeWind` to 1. All-zero wind constants can produce NaN,
so a zero-filled constant buffer is not a neutral wind state. :proven[executed vertex programs] The switch is `m_fSkip`, a four-byte
scalar of the structure `u_sGlobal` nested in `VC_SpeedTreeWind`, at byte 52 of the buffer (row 3, y) in the reflection of every
G-buffer vertex program of the SpeedTree models; its offset is the sum of the enclosing members' offsets, so a walk of the top
level alone does not find it. :observed[the installed programs' reflection]

Each mesh has one face set, at LOD level 0, 1 or 2; billboard cards are level 3 and draw with the
`SpeedTree_billboard` programs. :observed Billboard layouts instead store Float4 UV2 and Float2 UV3. Their program turns the card toward the camera and
selects an atlas image by view angle; their stored members do not directly give a fixed rest-space surface.
:observed

## Leaf colour

The leaf pixel program `SpeedTree_50f1f_w346369a7_Gbuf_[A]` tints the diffuse texture twice. Its albedo is `t0.rgb ×
FC_DynamicDiffuseColor.rgb² × aColor[ColourSlotNo].rgb`: `FC_DynamicDiffuseColor` is `cbMatDynParam` byte `0x40` (row 4), squared
per channel, and `aColor` is a per-object palette of four colours in `cbInstanceData`, at byte 144 of each 208-byte instance
record (row `13 × object + 9 + slot`). The palette's alpha also enters the program's discard test. :observed[the program's DXIL
reflection and its translated data flow]

So a leaf's colour depends on two run-time inputs besides its texture; which code fills either is not traced. :unknown

### Wind state in the running game

`VC_SpeedTreeWind` is the constant buffer `cbSpeedTreeWind` of every SpeedTree vertex program: two records of the
272-byte structure `sSpeedTreeWind` (544 bytes declared; a draw's range is 768 bytes). The record holds the wind direction
and anchor, the global, two branch, two leaf and one frond sections, `u_fStrength`, an interaction direction at byte 256 and
the interaction flag at byte 268. Each section starts with a time (`m_fTime`, `m_fBranchTime`, `m_fRippleTime`,
`m_fFrondTime`; the leaf sections also carry a twitch time). :observed[the shader reflection; the records of nine frames at the Stormveil gate]{games="elden-ring"}

In every frame, the records of the SpeedTree draws take one of four unit directions in the horizontal plane, (0.902, 0.432),
(0.598, 0.801), (0.378, 0.926) and (0.133, 0.991); the same four occur in the nine frames, and in the last three
captured all but one record share (0.902, 0.432). :observed[132 records of nine frames]{games="elden-ring"}
Constant on every such record: height exponent 1.5, fudge grid size 8, branch twitch 0.75, twitch frequency scale 0.3, branch
turbulence 0.7, `m_fSkip` 0 and the interaction flag 0. The second branch's distance is 5/11 of the first's (0.4545 on all records), its whip
equals the first's, and the global direction adherence is exactly twice the first branch's direction adherence. :observed[132 records of nine frames]{games="elden-ring"}

The times are not independent clocks. In the four frames whose records all belong to one wind set, each section's time equals
`k × T + δ` for a frame value `T` that every record shares and a per-record offset `δ` between 0 and 0.96, with the same
factors `k` in all four frames: 2 for the first branch, 8/3 for the second, 5.87 for leaf 1's ripple (4.69 on some records
of one frame), 3.13 for leaf 1's twitch, 9.39 for leaf 2's ripple and 0.027 for leaf 2's twitch (agreeing to three digits
between frames). `T` is 91.43, 98.88, 99.72 and 99.99 in the four frames, and `δ`, which is `m_fTime − T`, differs between the
trees of one frame, so two trees of a frame are at different phases of one clock. :observed[four frames, 47 records]{games="elden-ring"} The grass force records ([grass](/engines/fromsoft/vegetation/grass/#how-grass-moves))
of the same frames carry a clock 1.696 to 1.698 times `T`. :observed[four frames]{games="elden-ring"}

Within a frame the amplitudes are shared by all records of a profile (a tree class: the records of one frame carry two to
five distinct distance values). Between frames they move together by a few percent: the first branch's distance of the
commonest profile is 0.450 to 0.469 over six frames, whip falls as direction adherence rises (0.339 at 0.068, 0.324 at 0.080),
and `u_fStrength` takes one or two values per frame between 0.32 and 0.55. The profiles are scaled copies of each other: the
ratio of the two commonest profiles' global distances is 1.1155 to 1.1160 in the eight frames that hold both. What sets the
frame's amplitude (time of day, weather or area) is not seen: all nine frames are at the Stormveil gate.
:observed[132 records of nine frames]{games="elden-ring"}

:::open[How does the full wind state evolve?]
The times follow one shared frame clock with fixed per-section rates and a per-tree phase offset, and the amplitudes are
constant within a frame (above). Not known: what drives the amplitude between frames, how the interaction direction and flag
(the flag is zero in every record seen) are filled, and the vertex program's use of each section; the frames are single captures, so the
change between two consecutive frames of one run has not been seen, and camera-dependent billboard reconstruction is untouched.
:::
