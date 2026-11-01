---
title: Render controllers
description: "What an entity's render controllers choose each frame: geometry, textures, bone materials and visibility, and the overlay, change colour and texture offset its materials read."
sources:
  - title: Mojang bedrock-samples
    url: https://github.com/Mojang/bedrock-samples
    note: vanilla resource pack, v1.26.60.5 (render_controllers/, entity/)
---

A client entity lists render controllers (each optionally under a Molang condition), and each controller that applies
draws the entity once more: it picks a geometry, a texture and a material per bone, all by Molang over the entity's
`geometry.`, `texture.` and `material.` names and the controller's own `array.` lists. :observed[the vanilla render controllers of bedrock-samples v1.26.60.5]
An entity with several controllers is drawn in layers, as the creaking's emissive eyes and the warden's glowing spots
are separate controllers over the same geometry. :observed[the vanilla render controllers of bedrock-samples v1.26.60.5]
Each later controller draws over the ones before. :inferred

## Bone rules

`materials` and `part_visibility` are lists of objects whose keys are bone names with `*` wildcards. :observed[the vanilla render controllers of bedrock-samples v1.26.60.5]
The rules apply in order, a later rule overriding an earlier one for the bones it matches. :inferred The vanilla data
relies on this: the creaking's eyes controller has `[{"*": false}, {"head": "variable.has_emissive_eyes"}]`, which
shows only the head, and the NPC's has `{"*": false, "head": true, ...}`, which hides every bone but those named.
:observed[the vanilla render controllers of bedrock-samples v1.26.60.5]

## Colours and texture offset

| Field | Value | What reads it | Confidence |
|---|---|---|---|
| `overlay_color` | `r`, `g`, `b`, `a` | `OVERLAY_COLOR` of `USE_OVERLAY` materials: the texel is mixed toward it by `a` | :inferred |
| `color` | `r`, `g`, `b`, `a`; `this` is the entity's own colour | `CHANGE_COLOR` of `USE_COLOR_MASK` and similar materials | :inferred |
| `uv_anim` | `offset` (u, v) and `scale` (u, v) | `UV_ANIM` of `USE_UV_ANIM` materials: `uv = offset + uv * scale` | :inferred |
| `ignore_lighting` | boolean | the entity is drawn at full light | :inferred |

What each stage does with these colours is on [entity materials](/engines/bedrock/materials/entity-materials/).

Examples in the vanilla data :observed[the vanilla render controllers of bedrock-samples v1.26.60.5]:

- The experience orb's controller pulses `overlay_color` (`r = (sin(life_time * 500) + 1) / 2`, `g = 1`,
  `b = (sin(life_time * 500 + 240) + 1) / 10`, `a = 0.5`) and picks its frame of the 4 × 4 orb atlas with `uv_anim`
  offsets the client entity computes: `u = (texture_frame_index mod 4) * 16 / 64`,
  `v = round(texture_frame_index / 4) * 16 / 64`.
- The warden's glowing layers set `color` with `r`, `g`, `b` at 1 and `a` from its scripts: `0.7` for the
  bioluminescent layer, `0.25 * cos(life_time * 20 * 2.578)` and its opposite phase for the two spot layers, the
  tendril animation for the tendrils, `0.8 * (1 - heartbeat_phase)` (0.2 while hurt) for the heart.
- The horse's controller sets `color` to the armour's dye (`query.armor_color_slot(4, n)`) when it wears dyed armour,
  `this` otherwise.
- The armor stand's controllers set `overlay_color` with `a` at 0.
- The splash and lingering potions' controllers take their texture from a 31-entry `array.skins` by `query.variant`,
  one entry per effect in the order `moveSlowdown`, `moveSpeed`, `digSlowdown`, `digSpeed`, `damageBoost`, `heal`, `harm`,
  `jump`, `confusion`, `regeneration`, `resistance`, `fireResistance`, `waterBreathing`, `invisibility`, `blindness`,
  `nightVision`, `hunger`, `weakness`, `poison`, `wither`, `healthBoost`, `absorption`, `saturation`, `levitation`,
  `turtleMaster`, `slowFall`, `windCharged`, `weaving`, `oozing`, `infested`, with `default` last (index 30), and give
  `texture.enchanted` as their second texture.

The orb's `texture_frame_index` is its size class, 0 to 10 by the experience it carries, as Java Edition picks an orb's
icon. :inferred A thrown potion's `query.variant` is the index of its first effect in that list, and 30 for a potion
with no effect. :inferred

:::open[Which orb frame does a texture frame index above 1 pick?]
The orb's `v` offset rounds `texture_frame_index / 4`, so if Molang's `math.round` rounds halves up, indices 2 and 3
pick the atlas's second row and index 10 its fourth. Whether that is the intended frame, and what the atlas's last
five cells (plain discs) are for, is not established.
:::
