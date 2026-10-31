---
title: Attachables
description: "How a held or worn item is drawn as a model of its own: the attachable file, the bone it binds to, the context it runs in, and how it reads its holder's variables."
sources:
  - title: Mojang bedrock-samples
    url: https://github.com/Mojang/bedrock-samples
    note: vanilla resource pack, v1.26.60.5 (attachables/, models/, animations/, entity/)
  - title: La Nature (resource pack by Carrot)
    url: https://www.curseforge.com/minecraft-bedrock/texture-packs/la-nature-by-carrot
    note: a third-party pack that replaces the player's animations and adds attachables for torches, lanterns and spears
---

An attachable gives an item a model of its own, drawn on whoever holds or wears it in place of the flat item. It has
the same parts as a client entity: geometry, textures, materials, animations, scripts and render controllers, keyed by
the item's identifier. :observed[the 55 attachables of bedrock-samples v1.26.60.5] Its animations and controllers run
like an entity's, once for each hand or slot that holds the item. :inferred

## The file

An attachable is a file under `attachables/` whose root object is `minecraft:attachable`, holding a `description`
with the item's `identifier`. :observed[the 55 attachables of bedrock-samples v1.26.60.5] All 55 vanilla attachables
have `materials`, `textures`, `geometry` and `render_controllers`; 54 have `scripts`, 30 `animations` and 25 `item`.
:proven[every attachable of the v1.26.60.5 resource pack] The vanilla ones are the bow, the crossbow, the elytra, the
shield, the trident, the turtle helmet and the armour pieces, each armour piece also as `<item>.player` for players.
:proven[every attachable of the v1.26.60.5 resource pack]

## Binding to the holder

The attachable's geometry has a root bone with a `binding`, a Molang expression naming the holder's bone it follows.
:observed[the geometries of bedrock-samples v1.26.60.5] Every vanilla binding is
`q.item_slot_to_bone_name(...)`: nine geometries (spear, shield, trident and six crossbow states) bind with
`q.item_slot_to_bone_name(c.item_slot)`, and the spyglass with
`q.item_slot_to_bone_name(q.main_hand_item_use_duration > 0.0f ? 'head' : 'main_hand')`.
:proven[every geometry of the v1.26.60.5 resource pack] The query maps a slot (`main_hand`, `off_hand`, `head`) to
the holder's bone for it, the player's `rightItem`, `leftItem` and `head`. :inferred The spyglass moves from the hand to
the head while it is used. :inferred

## Context

An attachable's scripts read context values the engine gives them:
:observed[the attachables and animations of bedrock-samples v1.26.60.5]

| Value | Taken to mean | Confidence |
|---|---|---|
| `c.item_slot` | the slot holding the item, `main_hand` or `off_hand` | :inferred |
| `c.is_first_person` | the attachable is drawn on the local player seen from its own eyes | :inferred |
| `c.owning_entity` | the holder, an entity reference for `->` | :inferred |

Queries in an attachable's scripts act on the holder: the vanilla bindings and animations read
`q.main_hand_item_use_duration` and similar holder state without an arrow. :inferred

## The holder's variables

An attachable reads its holder's variables through the holder reference:
`c.owning_entity->v.fp_melee_spear_use_attachable_rotation_z` in the vanilla spear animation, and
`c.owning_entity->v.attack_time` ten times in the attack controllers of a third-party pack's spear.
:observed[bedrock-samples v1.26.60.5 and the La Nature resource pack] No vanilla attachable reads a holder variable as a
plain `v.` name: every `v.` name an attachable's own files read, its own scripts assign. :proven[every attachable of the v1.26.60.5 resource pack with the animations and controllers it names]

A client entity declares the variables others may read in `scripts.variables`, each name mapped to `"public"`.
:observed[the client entities of bedrock-samples v1.26.60.5] Seven vanilla entities declare some: the player six
(`attack_time`, `item_use_normalized` and four spear melee values), and the zombie, husk, piglin, zombified piglin,
zombie villager and drowned their `item_use_normalized`, `tp_melee_spear_use_attachable_rotation_z` and
`use_dedicated_baby_armor`, or a subset. :proven[every client entity of the v1.26.60.5 resource pack] Every holder
variable a vanilla attachable reads through `c.owning_entity->` is one the player declares public.
:observed[bedrock-samples v1.26.60.5] The declaration is what lets another entity's scripts read the variable through
`->`; an undeclared one reads as nothing. :inferred

:::open[Can an attachable read an undeclared holder variable, or write one?]
The vanilla data reads only declared ones and never assigns through `->`, so neither case is shown.
:::
