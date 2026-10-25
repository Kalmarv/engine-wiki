---
title: Wheels and tyres
description: How Forza Horizon 6 sizes its normalised wheel and tyre models with morph targets, which slots do what, and which values only the encrypted database holds.
---

A car's wheel model, `Scene\_library\Scene\Wheels\<CAR>_WheelLF.modelbin` (one instance per corner), is stored at a **normalised
size**: rim lip radius 0.1397 m and the barrel 0 to 1 m deep in x (group bounds (−0.0135, ±0.1397) to (1.0, ±0.1397)), too small to clear the
240SX's own 0.128 m brake rotors. Its meshes carry morph targets that size it ([morph data](/engines/forzatech/geometry/modelbin/)). The
morph layout was read in `car_standardCarLightScenario.vso` and checked on the 240SX wheel and body. :observed

Counts come from a recorded census of the install's `media\Cars` (682 cars, 197 tyre archives); the install is no longer available. :observed

## Wheel morphs

| Slot | Effect | Confidence |
|---|---|---|
| `weight[0]` | radius: radial delta 0.1842 m at the rim lip, proportional to the radius | :observed |
| `weight[1]` | width: x delta −0.8999 on the inner barrel, so the barrel depth is 1.0 − 0.9 w1 | :observed |

The single-target meshes of the wheel (the blur disc) carry the radius target on slot 0. Body panels carry one target on slot 0 (damage).
:observed The weights the game uses come from the rim size and width of the fitted wheel, which are in the encrypted database. :unknown

## Tyres

No car file names a tyre: the carbin has no tyre group, `Manifest.xml` lists none, and `Cars\_library\scene\tires\*.zip` (197
archives, each `tireL_<name>.modelbin` and `tireR_<name>.modelbin`) carry no car id. The game adds the tyre at run time from its
database. :observed

- **Frame.** All 197 tyre models are authored on the wheel's normalised frame: bead radius 0.140 (the wheel's rim lip 0.1397), tread radius
  ≈ 0.225, axle coordinate x from 0 to 1 (the wheel barrel's depth at weight 0). The models differ in tread and sidewall detail, not in
  size. :observed
- **Morph slots** (5; `Mrph` names only `weight[0..4]`): slot 1 moves the bead radially by 0.184 (tapering to 0 at the tread), the same
  delta as the wheel's `weight[0]`, so slot 1 is the rim radius weight; slot 0 moves the tread radially by ≈ 0.27 (0 at the bead): the
  outer radius (sidewall height); slot 2 (−0.07 radial, ±0.2 axial at the sidewalls) and slots 3 and 4 (one-sided axial) deform the
  sidewall. :observed
- **Slots above 1 are contact-patch deformation.** The vertex shader multiplies a slot index above 1 by a per-vertex factor
  `f = sat((0.225 − max(0, a·y − b·z + 0.225)) / 0.225)` built from the per-wheel rows `cb4[36]` and `cb4[37]` (wheel index clamped
  0 to 3; `f = 1` when the per-draw switch row 0 `.w` is 0): it localises slots 2 to 4 at the contact patch. Their weights are run
  time (load). :observed
- **Width.** The tyre has no width morph, and its vertex shader reads only the object matrices (cb9 rows 0 to 2 and 12 to 14; rows 4 to 6
  are read by the pixel shader only, for the sidewall projection), so nothing traced scales it. :observed

Of the 197 tyre archives (407 models), 195 have every material taken by a traced `car_tires_pg` recipe; `tire_Spare_offRoad` (black,
sidewall02, sidewallLOD2, tiretread, treadLOD2) and `tire_PG_Full` (scaling_text) have materials whose chain does not reach a shader.
:observed

## What no readable file holds

Nothing readable pins the wheel and tyre size: the morph weights come from the encrypted `gamedbRC.slt`; the car archives,
`Locators.xml` (camera and IK locators), the skeleton (no tyre bones), `physicsdefinition.bin` (hull points), the tyre and rim archives,
the `Performance.zip` benchmarks (body keyframes only) and the method-22 `Physics`, `GameTunableSettings` and `ProfileSchema` archives
hold no size. :observed There are 646 distinct wheel geometries over the 682 cars (34 shared groups, 70 cars). :observed

:::open[Where do the wheel and tyre sizes of a car come from?]
The size weights and the tyre model per car and upgrade are in the encrypted game database, and the tyre contact-patch weights are
computed at run time from load.
:::
