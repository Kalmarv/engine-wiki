---
title: Engine variables
description: "The variables entity scripts read but no script assigns, which the engine fills in, and what each is taken to mean from how the vanilla packs use it."
sources:
  - title: Mojang bedrock-samples
    url: https://github.com/Mojang/bedrock-samples
    note: vanilla resource pack, v1.26.60.5
---

Entity scripts keep their state in `variable.` (`v.`) names, which a client entity's `initialize` and `pre_animation`
scripts and its animations assign. :observed[the vanilla resource pack of bedrock-samples v1.26.60.5] Some names are
read and never assigned by any script: the engine sets them. :inferred No published list names them, and what each
holds is known only from how the vanilla scripts use it. :observed[the vanilla resource pack of bedrock-samples v1.26.60.5]

## Census

Over the 4,961 JSON files of the vanilla resource pack, 579 variable names are read and 436 are assigned somewhere
(`v.name =`, not `==`); 151 are read and never assigned. :proven[every JSON file of the v1.26.60.5 resource pack, the 182 files that are not strict JSON scanned as text]
Of the 151, the particle ones (`particle_age`, `particle_lifetime`, `particle_random_1` to `4`, `emitter_age`,
`emitter_random_1` to `3` and similar) are set by the particle system for each particle and emitter. :inferred The rest
are the entity variables below, and a few that are a single entity's alone (`historical_frame_0` to `23` of the ender
dragon, the minecart's `rail_offset` and `rail_rotation`). :observed[the vanilla resource pack of bedrock-samples v1.26.60.5]

`variable.is_holding_right` is assigned only by the player's `initialize` (`variable.is_holding_right = 0.0;`), and
read by the same animations as `is_holding_left`, which nothing assigns. :observed[the vanilla resource pack of bedrock-samples v1.26.60.5]
The engine sets it like the left-hand one, the initial value being a default. :inferred

## The entity variables

Each meaning below is taken from how the vanilla scripts use the variable; the usage column quotes the vanilla data.
:observed[the vanilla resource pack of bedrock-samples v1.26.60.5]

| Variable | Vanilla usage | Taken to mean | Confidence |
|---|---|---|---|
| `gliding_speed_value` | walk cycles divide by it: `cos(q.modified_distance_moved * 38.17) * q.modified_move_speed / v.gliding_speed_value` | 1, larger while gliding, slowing the limb swing; a script that reads it with nothing set divides by zero | :inferred |
| `attack_time` | attack animations and controllers: `v.attack_time >= 0.0`, `sin((1 - v.attack_time) * 180)` | the swing's progress, 0 to 1 | :inferred |
| `is_first_person` | selects the player's `first_person` controller states and render controllers | the player is seen from its own eyes | :inferred |
| `is_paperdoll` | selects the player's `paperdoll` state; the cape shows when `!v.is_first_person \|\| v.is_paperdoll` | the entity is drawn as the inventory screen's figure | :inferred |
| `map_face_icon` | hides the player's third-person render controller, selects its `map_player` state | the entity is drawn as a map's face icon | :inferred |
| `is_holding_left`, `is_holding_right` | arm poses: `v.is_holding_left ? (-this * 0.5 - 18.0) : 0.0` | the hand holds an item | :inferred |
| `is_brandishing_spear` | the drowned's and player's `brandish_spear` states | a trident is raised to throw | :inferred |
| `is_holding_spyglass`, `is_tooting_goat_horn`, `is_using_brush` | each stops the player's arm bob and turns an arm pose | the item of that name is in use | :inferred |
| `damage_nearby_mobs` | the drowned's and player's `damage_nearby_mobs` states | a riptide spin attack | :inferred |
| `is_sneaking` | `q.target_x_rotation - 105 - (v.is_sneaking ? 15 : 0)` in humanoid arm poses | the entity sneaks | :inferred |
| `swim_amount` | the drowned's `swimming` state: `v.swim_amount > 0.0` | how far into the swimming pose, 0 to 1 | :inferred |
| `player_x_rotation` | read in the player's scripts | the player's view pitch | :inferred |
| `use_item_interval_progress`, `use_item_startup_progress` | the drowned's `use_item_progress` state when either is above 0 | the progress of an item being used, by phase | :inferred |
| `player_arm_height` | first-person swap animations: arm position `y = -10 * (1 - v.player_arm_height)` | how far the main hand is raised as an item is swapped, 0 lowered to 1 raised | :inferred |
| `bob_animation` | gates the player's `first_person_walk` state, which moves the held item by `v.bob_animation * sin(q.life_time * 45) * 0.5` | whether the held item bobs | :unknown |
| `first_person_item_rotation_factor` | first-person attack swings, where the third-person ones use `first_person_rotation_factor` (which the player computes as `sin((1 - v.attack_time) * 180)`) | a scale on the first-person swing | :unknown |
| `short_arm_offset_left`, `short_arm_offset_right` | added to first-person arm positions | an offset for the arm's length | :unknown |
| `is_using_vr`, `is_horizontal_splitscreen`, `is_vertical_splitscreen` | small corrections to first-person arm poses (`95.0 + v.is_using_vr * 7.5`) | the display mode | :inferred |
| `fp_melee_spear_*`, `tp_melee_spear_*` | the player's and the spear's melee animations; the player declares four of them public | the spear's melee motion, first and third person | :unknown |
| `liedownamount`, `liedownamounttail`, `lieonplayer` | the cat's lying-down animations | the cat's lie-down progress, and whether it lies on a sleeping player | :inferred |
| `animationamount`, `animationamountprev` | the fishes' swim animations, blended by `q.frame_alpha` | the swim cycle this tick and last | :inferred |

The local player's first-person animations also read one context value, `c.player_offhand_arm_height`, in the off
hand's swap animation where the main hand's reads `v.player_arm_height`. :observed[the vanilla resource pack of bedrock-samples v1.26.60.5]
It is the off hand's raise, 0 to 1. :inferred See [first-person player](/engines/bedrock/animation/first-person/).

:::open[What do bob_animation, short_arm_offset_* and first_person_item_rotation_factor hold?]
Their usage does not pin them down: `bob_animation` could be the view-bobbing setting or whether the player walks,
and the arm offsets could depend on the skin's arm width.
:::
