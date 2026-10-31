---
title: First-person player
description: "How the player model is posed for its own first-person view: the controller states, the base pose that turns the body with the view, where the arm poses put the arms, and the arm heights the engine sets."
sources:
  - title: Mojang bedrock-samples
    url: https://github.com/Mojang/bedrock-samples
    note: vanilla resource pack, v1.26.60.5 (animations/player_firstperson.animation.json, animation_controllers/player.animation_controllers.json)
  - title: Blockbench (Bedrock entity format)
    url: https://github.com/JannisX11/blockbench
    note: "reads Bedrock geometry with X mirrored, and negates animation position X and rotation X and Y to match"
  - title: La Nature (resource pack by Carrot)
    url: https://www.curseforge.com/minecraft-bedrock/texture-packs/la-nature-by-carrot
    note: a third-party pack that replaces the player's animations, first person included
---

The hands seen in first person are the player model itself, posed by a separate set of first-person animations and
drawn with only the arms and held items shown. :observed[the vanilla player of bedrock-samples v1.26.60.5] Resource
packs that replace the player's animations replace these too. :observed[the vanilla player and the La Nature resource pack]

## Controller states

The player's root animation controller picks its state from engine variables: `paperdoll` while `v.is_paperdoll`,
`first_person` while `v.is_first_person` (and not `v.is_paperdoll`), `map_player` while `v.map_face_icon`, and
`third_person` otherwise. :observed[the vanilla player of bedrock-samples v1.26.60.5] The render controllers are split
the same way: `controller.render.player.first_person` applies while `v.is_first_person && !q.is_spectator`, the
third-person one while none of `v.is_first_person`, `v.map_face_icon` and `q.is_spectator` holds.
:observed[the vanilla player of bedrock-samples v1.26.60.5] See [engine variables](/engines/bedrock/data-model/engine-variables/).

## The base pose

`animation.player.first_person.base_pose` turns the body bone by `(q.target_x_rotation, q.target_y_rotation, 0)`
and the head by `(q.target_x_rotation, q.target_y_rotation + 180, 0)`. :observed[the vanilla player of bedrock-samples v1.26.60.5]
In the player's geometry (`geometry.humanoid.custom`) the arms hang from the body, whose pivot is at the neck,
`[0, 24, 0]`. :observed[the player geometry of bedrock-samples v1.26.60.5] The two rotations are the view's pitch and its
yaw from the body, so the body and the arms on it turn with the view about that pivot. :inferred The arms then stand still in the view only when the view
turns about the same point, the eye at that pivot. :inferred The extra half turn of the head turns it away from the
eye. :inferred

## Where the arm poses put the arms

`animation.player.first_person.empty_hand` moves the right arm by `[13.5, -10.0, 12.0]` and turns it by
`[95, -45, 115]` (plus small terms for VR). :observed[the vanilla player of bedrock-samples v1.26.60.5] The other
first-person arm poses use positions of the same kind, an x of about ±13.5 to ±15.5 and a z of 8 to 12.
:observed[the vanilla player of bedrock-samples v1.26.60.5 and the La Nature resource pack]

Read with the axis convention Blockbench uses for Bedrock models, that position carries the right arm across to the
body's left side and 12 pixels behind it, so with the body facing the way the eye looks, the arms sit behind the eye.
:inferred For them to be seen in front and on their own side, the whole pose is drawn turned a half turn about the
view's vertical axis. :inferred A turn about the view's axis rather than the world's is what keeps the arms still as
the view pitches: about the world's vertical, the body's pitch would carry the arms the opposite way to the view, and
they would move across it by twice the pitch. :inferred Drawn this way, the vanilla empty-hand pose stays put in the
view for any pitch and any turn of the head from the body, and lands near where Java Edition draws its first-person
arm. :inferred

:::open[Is the first-person pose really drawn turned about the view's vertical?]
The half turn is the transform that makes the published poses stand still in view and appear in front; no capture of
the game's first-person transforms confirms it.
:::

## Arm heights

`animation.player.first_person.swap_item` lowers each arm while the held item changes: the right arm by
`-10 * (1 - v.player_arm_height)` pixels, the left by `-10 * (1 - c.player_offhand_arm_height)` unless the off hand
holds a filled map or a shield. :observed[the vanilla player of bedrock-samples v1.26.60.5] `shield_block` lowers them
the same way, the right arm only when the off hand holds no shield. :observed[the vanilla player of bedrock-samples v1.26.60.5] Neither value is assigned by any script.
:proven[every JSON file of the v1.26.60.5 resource pack] They are the hands' raise, 0 lowered to 1 raised, which the
engine moves as items are swapped; left at 0, the arms stay 10 pixels low. :inferred
