---
title: Item queries
description: "How entity scripts read the items an entity holds and wears: names, item tags, a spear's kinetic timings and cooldowns, and the item components behind them."
sources:
  - title: Mojang bedrock-samples
    url: https://github.com/Mojang/bedrock-samples
    note: vanilla resource pack, v1.26.60.5
  - title: GeyserMC mappings
    url: https://github.com/GeyserMC/mappings
    note: item_components.nbt, the client's item components as Geyser records them
  - title: bedrock.dev Molang documentation
    url: https://bedrock.dev/docs/stable/Molang
    note: query descriptions
---

Client entity scripts, animations and render controllers read an entity's items through queries on the entity. Over
the vanilla resource pack they name the item in a slot (`query.get_equipped_item_name`, `query.is_item_name_any`), test
its item tags (`query.equipped_item_any_tag`, and `query.equipped_item_all_tags` in third-party packs), and read a held
spear's timings (`query.kinetic_weapon_delay` and three durations). :observed[the vanilla resource pack of bedrock-samples v1.26.60.5]

## Names

`is_item_name_any` and the tag queries name a slot (`slot.weapon.mainhand`, `slot.weapon.offhand`, `slot.armor.body`);
`get_equipped_item_name` takes a hand, as `'off_hand'`, as `0, 1`, or nothing for the main hand (34, 29 and 11 uses).
:observed[the vanilla resource pack of bedrock-samples v1.26.60.5] Item names are
compared without the `minecraft:` namespace in `get_equipped_item_name` (`'filled_map'`, `'crossbow'`) and with it in
`is_item_name_any`. :observed[the vanilla resource pack of bedrock-samples v1.26.60.5]

The player's render controllers show its arms when `query.get_equipped_item_name(0, 1) == ''`, eight times in all, so an
empty slot's name is the empty string. :observed[the vanilla player render controllers of bedrock-samples v1.26.60.5]
Third-party packs test an empty hand the same way with `query.is_item_name_any('slot.weapon.mainhand', '')`; that this
holds for an empty slot is :inferred from the same convention.

## Item tags

The zombie, husk, zombie villager, piglin and zombified piglin test for a spear with
`query.equipped_item_any_tag('slot.weapon.mainhand', 'minecraft:is_spear')`, and the nautilus tests its armour with
`'slot.armor.body', 'minecraft:nautilus_armor'`. :observed[the vanilla resource pack of bedrock-samples v1.26.60.5]
An item's tags are the `item_tags` of its client item components. Those components are recorded for items the game
defines by components: nine of them carry tags, the seven spears `minecraft:is_spear` and a tier tag
(`minecraft:wooden_tier` to `minecraft:netherite_tier`), the diamond spear also `minecraft:transformable_items`, the
apple `minecraft:is_food` and the shelf mushroom `minecraft:mushrooms_for_stew`. :sourced[GeyserMC mappings, item_components.nbt]
Older items' tags are not in that data. :sourced[GeyserMC mappings, item_components.nbt]

## Spear timings and cooldowns

Each spear's `minecraft:kinetic_weapon` component has a `delay` and three conditions, each with a `max_duration`, and
its `minecraft:cooldown` is an `attack` cooldown of category `spear`:
:sourced[GeyserMC mappings, item_components.nbt]

| Spear | `delay` | dismount `max_duration` | knockback `max_duration` | damage `max_duration` | Cooldown (s) |
|---|---|---|---|---|---|
| wooden | 15 | 100 | 200 | 300 | 0.65 |
| stone | 14 | 90 | 180 | 275 | 0.75 |
| copper | 13 | 80 | 165 | 250 | 0.85 |
| iron | 12 | 50 | 135 | 225 | 0.95 |
| golden | 14 | 70 | 170 | 275 | 0.95 |
| diamond | 10 | 60 | 130 | 200 | 1.05 |
| netherite | 8 | 50 | 110 | 175 | 1.15 |

The wind charge has a `use` cooldown of 0.5 s, the only other cooldown in the data. :sourced[GeyserMC mappings, item_components.nbt]

The five spear-holding mobs count how long the item has been used in their `pre_animation`
(`v.item_use_duration = query.is_using_item ? ((v.item_use_duration ?? 0.0) + query.delta_time * 20.0) : 0.0`, in
ticks) and time the spear's raise, sway, lower and raise-back against `query.kinetic_weapon_delay` and the delay plus
`query.kinetic_weapon_dismount_duration`, `_knockback_duration` and `_damage_duration`. :observed[the zombie, husk, zombie villager, piglin and zombified piglin client entities of bedrock-samples v1.26.60.5]
The queries return the main hand's component values in ticks. :inferred That the scripts add them to a tick count is
the evidence.

## Use durations

`query.item_remaining_use_duration` returns the time an item has left to use, for the hand its first argument names
(`'main_hand'` or `'off_hand'`), in seconds, or normalized by a second argument when one is given.
:sourced[bedrock.dev Molang documentation] Vanilla's player crossbow controller enters its `charge` state while the
query, with no arguments, is above 0, and leaves it for `hold` once `query.item_is_charged`; the first-person crossbow
scales the bow by `1.15 - query.item_remaining_use_duration('main_hand', 1.0) * 0.15` and moves it by
`2.5 - query.item_remaining_use_duration('main_hand', 1.0) * 1.5`. :observed[the vanilla resource pack of bedrock-samples v1.26.60.5]
The normalized form is the fraction of the item's full use duration still left, times the argument, running from the
argument down to 0 over the use. :inferred That the first-person crossbow's scale and offset only make sense over that
range is the evidence.

:::open[What does query.cooldown_time_remaining count for an attack cooldown?]
Third-party packs start a spear's charge animations only when `query.cooldown_time_remaining` is 0. Whether the attack
cooldown runs from the last attack or from the spear's equipping is not established.
:::
