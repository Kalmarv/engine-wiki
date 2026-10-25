---
title: Coordinate frames and map offsets
description: Placement transforms, map-local collision and the distinction between angular units.
sources:
  - title: Smithbox
    url: https://github.com/vawser/Smithbox
  - title: Soulstruct Blender
    url: https://github.com/Grimrukh/soulstruct-blender
implementations:
  - name: primase pose arithmetic
    url: https://github.com/Kalmarv/primase/blob/main/worlds/fromsoft/src/pose.rs
---

The source coordinate frame is left-handed, with +Y up and distances in metres. Reflecting Z, `(x,y,z) → (x,y,-z)`,
changes it into a right-handed frame. :sourced[Soulstruct Blender] Sekiro model comparisons preserve positions,
normals and tangent directions under that reflection, including both tangent handedness signs. :observed{games="sekiro"}

## Placements

MSB rotations are degrees. A part applies scale, then rotations about X, Z and Y, then translation; with column
vectors this is `T × Ry × Rz × Rx × S`. :sourced[Smithbox] On rotated Ashina Castle pieces, collision alignment
discriminates this order from the alternative Euler orders. :observed{games="sekiro"}

FLVER bone rotations are radians; their local transform follows the same X-Z-Y axis order. Parent transforms
compose above the local transform to give model space. :sourced[SoulsFormatsNEXT]

## MapOffset

:only[sekiro] MSB parts already occupy the shared world frame. MapOffset instead places map-local collision using
`world = Ry(yaw) × local + translation`; applying it again to part positions translates them twice.
:observed{games="sekiro"}

```layout
title: MapOffset event type data
size: 16
games: [sekiro]
note: The event record points here; yaw is in degrees.
fields:
  - {at: 0, size: 12, type: "f32[3]", name: translation, level: observed}
  - {at: 12, size: 4, type: f32, name: yaw, level: observed}
```

:::open[Do all auxiliary map files share collision's local frame?]
Collision placement has a measured render-alignment comparison. Applying MapOffset to BTL, EDGE and navigation
data is an inference until each family has an equivalent comparison.
:::
