---
title: FXR effect files
description: Where the effects live, the version 5 file layout, the state machine and node tree, how properties store values, and the point and spot lights.
games: [sekiro, elden-ring]
sources:
  - title: fxr
    url: https://github.com/EvenTorset/fxr
    note: Unlicense. Reader, writer and editor for FXR; the names, types and defaults of the action parameters
  - title: SoulsFormatsNEXT FXR3
    url: https://github.com/soulsmods/SoulsFormatsNEXT/blob/master/SoulsFormats/Formats/FXR3.cs
    note: The record layouts (it calls nodes containers and configs effects)
  - title: Smithbox
    url: https://github.com/vawser/Smithbox
    note: Param Meta ExtRefs (which param fields name an FXR) and the TAE event templates
implementations:
  - name: fromsoft-formats (fxr.rs)
    url: https://github.com/Kalmarv/fromsoft-formats/blob/main/src/fxr.rs
---

An FXR file is one visual effect that the game spawns by its id: a small state machine, a tree of nodes, and in the nodes the
actions that emit particles, move them, draw them and light the scene. The lights an effect carries are point and spot light
actions (below); the lights of the map itself are the [BTL banks](/engines/fromsoft/lighting/btl/). :observed

## Where the files are

The effects are the members `f%09d.fxr` (the effect id, nine digits) of the BND4 binders `sfx/sfxbnd_*.ffxbnd.dcx`; the
other members are resource lists and animation binders. Every archive entry that holds an `.fxr` member is one of these
binders. :proven[every BND4 of both archives, named or not]

| | Sekiro | Elden Ring |
|---|---|---|
| binders with FXR members | 8: `commoneffects` and `m10 m11 m13 m15 m17 m20 m25` | 206 of the 220 `sfxbnd` binders: `commoneffects`, `commoneffects_dlc02`, 56 `c*` (characters), 24 `m*` (maps), 3 `m*_*_*_*`, 121 `mimic*` |
| `.fxr` files | 2,913 | 12,155 |
| distinct effect ids | 2,669 | 11,912 |
| `commoneffects` share | 1,856 files | 7,157 files, plus 1,482 in `commoneffects_dlc02` |

:proven{games="sekiro elden-ring"}

The id in a file's header is the number in its member name in all 15,068 files, and a file that appears in several binders is
byte-identical in each: 2,669 and 11,912 ids, each with one content. :proven
155 Sekiro ids occur in more than one binder (up to 5 copies) and 87 Elden Ring ids (up to 122), so either copy is the effect. :proven

## File layout (version 5)

Every file of both installs is version 5 with header minor 0, little-endian, 144 bytes of header, a 16-byte state map, and ten
sections of fixed-size records that follow one another, each starting at the 16-byte-aligned end of the one before and the last
ending at the end of the file; then the up to three id lists. :proven[a strict reader reads all 15,068 files and accounts for every byte; an independent walker agrees]
Version 4 is Dark Souls III's (its header lacks the three id lists) and header minor 1 Nightreign's; neither occurs in either
install. :sourced[fxr]

```layout
title: FXR header
size: 144
note: Little-endian. The state map (16 bytes) follows at 144, then the sections.
fields:
  - {at: 0, size: 4, type: "char[4]", name: magic, value: "FXR\0", level: proven}
  - {at: 4, size: 2, type: u16, name: header minor, level: proven, value: 0}
  - {at: 6, size: 2, type: u16, name: version, level: proven, value: 5}
  - {at: 8, size: 4, type: u32, name: constant, level: proven, value: 1}
  - {at: 12, size: 4, type: i32, name: effect id, level: proven, note: The number in the member name}
  - {at: 16, size: 4, type: u32, name: state map offset, level: proven, value: 144}
  - {at: 20, size: 4, type: u32, name: state machine count, level: proven, value: 1}
  - {at: 24, size: 8, type: "u32[2]", name: states section, level: proven, note: "offset and count"}
  - {at: 32, size: 8, type: "u32[2]", name: conditions section, level: proven}
  - {at: 40, size: 8, type: "u32[2]", name: nodes section, level: proven}
  - {at: 48, size: 8, type: "u32[2]", name: configs section, level: proven}
  - {at: 56, size: 8, type: "u32[2]", name: actions section, level: proven}
  - {at: 64, size: 8, type: "u32[2]", name: properties section, level: proven}
  - {at: 72, size: 8, type: "u32[2]", name: modifiers section, level: proven}
  - {at: 80, size: 8, type: "u32[2]", name: conditional properties section, level: proven}
  - {at: 88, size: 8, type: "u32[2]", name: field lists section, level: proven}
  - {at: 96, size: 8, type: "u32[2]", name: fields section, level: proven}
  - {at: 104, size: 4, type: u32, name: constant, level: proven, value: 1}
  - {at: 108, size: 4, type: u32, name: reserved, level: proven, value: 0}
  - {at: 112, size: 8, type: "u32[2]", name: "spawned effects (offset, count)", level: proven, note: "The ids an SFXReference action of the file names"}
  - {at: 120, size: 8, type: "u32[2]", name: "second id list (offset, count)", level: unknown, note: "i32 values: 0 alone in 2,816 Sekiro and 10,997 Elden Ring files, 0 and 10000 in 92 and 26, empty in 5 and 1,035"}
  - {at: 128, size: 8, type: "u32[2]", name: "third id list (offset, count)", level: unknown, note: "i32 values; empty in all but 37 Elden Ring files"}
  - {at: 136, size: 8, type: "u32[2]", name: fourth list, level: proven, value: 0, note: "Offset and count zero in every file"}
```

| Section | Record | Size |
|---|---|---|
| state map | 0, state count, states offset, 0 | 16 |
| states | 0, condition count, conditions offset, 0 | 16 |
| conditions | see below | 96 |
| nodes | see below | 48 |
| configs | see below | 32 |
| actions | see below | 64 |
| properties | see below | 40 |
| modifiers | type words, counts, offsets | 32 |
| conditional properties | the first 24 bytes of a property | 24 |
| field lists | offset (8), count, 0 | 16 |
| fields | one 32-bit word | 4 |

:proven

The parents name the records of each section exactly once and in order: the root node is the first node record, a node names
its child nodes, configs and actions as runs of records, a config names its actions, an action names its properties and
field lists, so the records of the states, conditions, nodes, configs, actions, properties, conditional properties and
field lists tile their sections with no gap. :proven[every file of both installs]
The field words and the modifier lists are not tiled: identical constants are stored once and named by more than one
property, a property of some files names a word inside the run of another record, and some words no record names.
:observed[a sample of 2,400 files]

```layout
title: FXR node
size: 48
note: Pointers are 8 bytes (an offset and a zero word).
fields:
  - {at: 0, size: 2, type: i16, name: node id, level: observed, note: "2000 for the root, 2200 for an ordinary node, 2001 and 2002 for others"}
  - {at: 2, size: 2, type: "u8[2]", name: constant, level: proven, value: "0, 1"}
  - {at: 4, size: 4, type: u32, name: reserved, level: proven, value: 0}
  - {at: 8, size: 4, type: u32, name: config count, level: proven}
  - {at: 12, size: 4, type: u32, name: action count, level: proven}
  - {at: 16, size: 4, type: u32, name: child node count, level: proven}
  - {at: 20, size: 4, type: u32, name: reserved, level: proven, value: 0}
  - {at: 24, size: 8, type: u64, name: configs offset, level: proven}
  - {at: 32, size: 8, type: u64, name: actions offset, level: proven}
  - {at: 40, size: 8, type: u64, name: children offset, level: proven}
```

```layout
title: FXR config
size: 32
fields:
  - {at: 0, size: 2, type: i16, name: config id, level: observed, note: "1004 for the usual one"}
  - {at: 2, size: 2, type: "u8[2]", name: constant, level: proven, value: "0, 1"}
  - {at: 4, size: 8, type: u64, name: reserved, level: proven, value: 0}
  - {at: 12, size: 4, type: u32, name: action count, level: proven}
  - {at: 16, size: 8, type: u64, name: reserved, level: proven, value: 0}
  - {at: 24, size: 8, type: u64, name: actions offset, level: proven}
```

```layout
title: FXR action
size: 64
fields:
  - {at: 0, size: 2, type: i16, name: action type, level: observed, note: "64 types in Sekiro's files, 71 in Elden Ring's"}
  - {at: 2, size: 1, type: u8, name: flag, level: unknown, note: "0 or 1; 1 only with the next byte 0 and the word after it 0"}
  - {at: 3, size: 1, type: u8, name: flag, level: unknown, note: 1 or 0}
  - {at: 4, size: 4, type: i32, name: unknown word, level: unknown, note: "0 to 11"}
  - {at: 8, size: 4, type: u32, name: first field list count, level: proven}
  - {at: 12, size: 4, type: u32, name: field list count, level: proven}
  - {at: 16, size: 4, type: u32, name: first property list count, level: proven}
  - {at: 20, size: 4, type: u32, name: second field list count, level: proven}
  - {at: 24, size: 4, type: u32, name: reserved, level: proven, value: 0}
  - {at: 28, size: 4, type: u32, name: second property list count, level: proven}
  - {at: 32, size: 8, type: u64, name: fields offset, level: proven, note: "The first list's words, then the second's"}
  - {at: 40, size: 8, type: u64, name: field lists offset, level: proven}
  - {at: 48, size: 8, type: u64, name: properties offset, level: proven, note: "The first list's properties, then the second's"}
  - {at: 56, size: 8, type: u64, name: reserved, level: proven, value: 0}
```

A config holds the actions that run while the node is in the state that chooses it. Actions of type 0 hold no field word,
property or field list in any file (111,431 of Sekiro's 354,778 actions, 480,016 of Elden Ring's 1,463,977). :proven
What an action does is its type: the parameters are the field words (integers, floats, booleans, indistinguishable without
the type's definition) and the properties. The [fxr project](https://github.com/EvenTorset/fxr) defines 80 types.
:sourced[fxr]

A node's own actions include the state-config map (type 199): its first field list holds, for each state, the index of the
config that state runs. :observed[read on the light-carrying nodes; see the lights]
An action of type 132 (SFXReference) spawns another effect, the id in its first field word; the header's first id list
is the set of these ids, in all 15,068 files, and every id exists in the same game's FXR set. :proven

## State machine

The light-carrying effects have one to three states (4,236 of Elden Ring's 4,345 have one, 108 two, 1 three; Sekiro's 633 of 635 have
one). :observed A state holds conditions: each compares two operands and moves the effect to another state when the comparison fails. :observed
The comparison and an operator modifier are in the first word (`!=` with modifier 2, `>=` with 2 and `>` with 2 are the
only ones in the installs), the else-state follows; the operand types are literal (-4, a float), external value (-3, an
integer index the game sets), time of day (-2) and state time (-1). :proven[all 15,835 conditions]

```layout
title: FXR condition
size: 96
fields:
  - {at: 0, size: 2, type: u16, name: operator, level: proven, note: "Bits 0-1 the comparison (0 !=, 1 ==, 2 >=, 3 >), bits 2-3 a modifier (2 in every condition)"}
  - {at: 2, size: 2, type: "u8[2]", name: constant, level: proven, value: "0, 1"}
  - {at: 4, size: 4, type: u32, name: reserved, level: proven, value: 0}
  - {at: 8, size: 4, type: i32, name: else state, level: proven}
  - {at: 12, size: 4, type: u32, name: reserved, level: proven, value: 0}
  - {at: 16, size: 2, type: i16, name: left operand type, level: proven}
  - {at: 18, size: 2, type: "u8[2]", name: constant, level: proven, value: "0, 1"}
  - {at: 20, size: 4, type: u32, name: reserved, level: proven, value: 0}
  - {at: 24, size: 4, type: u32, name: has field, level: proven, note: "1 for a literal or an external value, else 0"}
  - {at: 28, size: 4, type: u32, name: reserved, level: proven, value: 0}
  - {at: 32, size: 8, type: u64, name: field offset, level: proven}
  - {at: 40, size: 16, type: "u8[16]", name: reserved, level: proven, value: 0}
  - {at: 56, size: 40, type: "u8[40]", name: right operand, level: proven, note: "The left operand's layout"}
```

## Properties

A property is a value that is constant or a function of time, with one to four components. :proven[all 4,624,645 properties of both installs]

```layout
title: FXR property
size: 40
note: A conditional property (of a modifier) is the first 24 bytes.
fields:
  - {at: 0, size: 2, type: u16, name: type word, level: proven, note: "Bits 0-1 components minus one (scalar, vector 2, vector 3, vector 4 or colour), bits 4-7 the function, bit 12 loop; no other bit is set"}
  - {at: 2, size: 2, type: "u8[2]", name: constant, level: proven, value: "0, 1"}
  - {at: 4, size: 4, type: u32, name: second type word, level: observed, note: "components minus one | function << 2 | loop << 4 in all but 1,393 of Sekiro's and 5,208 of Elden Ring's properties"}
  - {at: 8, size: 4, type: u32, name: field word count, level: proven}
  - {at: 12, size: 4, type: u32, name: reserved, level: proven, value: 0}
  - {at: 16, size: 8, type: u64, name: fields offset, level: proven}
  - {at: 24, size: 8, type: u64, name: modifiers offset, level: proven}
  - {at: 32, size: 8, type: u64, name: modifier count, level: proven}
```

| Function | Value | Field words (c = components) |
|---|---|---|
| 0 zero | every component 0 | none |
| 1 one | every component 1 | none |
| 2 constant | the components | c floats |
| 3 stepped, 4 linear | keyframes held or joined by lines | n (an integer), c floats, c floats, n positions, n x c values: 1 + 2c + n + nc words |
| 5 Bezier, 6 Hermite | keyframes with tangents | the same, then two more blocks of n x c floats: 1 + 2c + n + 3nc words |

:proven[the field count of every property of both installs fits its function; functions 0 to 6 only]
Function 7, Armored Core 6's per-component Hermite, does not occur. :sourced[fxr]
The two blocks of c floats before the positions are the smallest and the largest value of each component over the keyframes
in all but 87 of Sekiro's 58,605 and 432 of Elden Ring's 236,122 keyframed properties; the positions ascend in all of them.
:proven[counted over every keyframed property]

A property's modifiers (random variation, dependence on an external value, ...) are 32-byte records with two type words,
their own field words and conditional properties. :observed

```layout
title: FXR modifier
size: 32
fields:
  - {at: 0, size: 2, type: u16, name: type word A, level: unknown}
  - {at: 2, size: 2, type: "u8[2]", name: constant, level: proven, value: "0, 1"}
  - {at: 4, size: 4, type: u32, name: type word B, level: unknown}
  - {at: 8, size: 4, type: u32, name: field word count, level: proven}
  - {at: 12, size: 4, type: u32, name: conditional property count, level: proven}
  - {at: 16, size: 8, type: u64, name: fields offset, level: proven}
  - {at: 24, size: 8, type: u64, name: conditional properties offset, level: proven}
```

## Lights

Two action types carry lights: PointLight (609) and SpotLight (11000). LightShaft (10003) is defined by the fxr project for
Dark Souls III and Sekiro; no file of either install holds one. :proven[0 of 354,778 and 1,463,977 actions]
The installed files hold 834 point lights in 714 Sekiro files and 4,999 in 4,369 Elden Ring files, and 13 spot lights in 11
and 17 in 15 files; counted once per effect id that is 757 and 4,974 lights in 635 and 4,345 effects. :proven
Every one sits in a config, never among a node's own actions. :proven[every file]
They lie 2 to 9 nodes below the root, mostly 3. :observed
A node with two configs holds 130 of the Elden Ring lights and 2 of Sekiro's; the node's state-config map chooses the light's
config in state 0 for all but 76 Elden Ring and 2 Sekiro lights. :proven

The lists of a light action differ in length by game and file; the stored counts of the properties and fields pick the layout
(properties 1, properties 2, fields 1, fields 2): :proven

| Light | Layout | Sekiro | Elden Ring |
|---|---|---|---|
| point | 10, 5, 2, 33 | | 4,486 |
| point | 10, 5, 2, 31 | | 513 |
| point | 10, 5, 2, 29 / 28 / 26 | 707 / 40 / 82 | |
| point | 10, 2, 2, 25 (Dark Souls III's layout) | 5 | |
| spot | 11, 0, 26 or 28 fields | | 5 and 12 |
| spot | 11, 0, 24 / 23 / 21 fields | 8 / 4 / 1 | |

The shorter lists are prefixes of the longer ones: the later fields were appended. The five Dark Souls III layout point lights
have no multiplier properties and one more field word at index 12 (everything after it is one index later than in the
other layouts). :observed

Point light (the layout of 29 or more fields 2; types are as the fxr project defines them, and every named field agrees with its
reading of the 4,999 Elden Ring and 831 Sekiro point lights it parses, the five Dark Souls III layout ones on the fields the
layouts share) :proven[against the fxr project]

| List and index | Name | Type |
|---|---|---|
| properties 1, 0 | diffuse colour | property, 4 components (unrestricted above 1) |
| properties 1, 1 | specular colour | property, 4 components (used when separate specular is set) |
| properties 1, 2 | radius | property, scalar (metres) |
| properties 2, 3 | diffuse multiplier | property, scalar; a linear fade-in in 4,181 of 4,957 Elden Ring lights |
| properties 2, 4 | specular multiplier | property, scalar |
| fields 2, 1 | jitter and flicker on | boolean |
| fields 2, 2 | jitter acceleration | float |
| fields 2, 4 to 6 | jitter X, Y, Z | float |
| fields 2, 7 and 8 | flicker interval, shortest and longest | float, seconds |
| fields 2, 9 | flicker brightness | float |
| fields 2, 10 | casts shadows | boolean |
| fields 2, 11 | separate specular | boolean |
| fields 2, 12 | fade-out time | integer, frames at 30 per second :sourced[fxr] |
| fields 2, 13 | shadow darkness | float |
| fields 2, 23 | maximum view distance | float (0: none) |
| fields 2, 24 | volume density | float (fake volumetric fog) |
| fields 2, 26 to 28 | fog phase function (boolean), asymmetry, adaptation exponent | boolean, float, float |
| properties 1, 3 to 9; properties 2, 0 to 2; fields 1, 0 and 1; fields 2, 0, 3, 14 to 22, 25, 29 to 32 | unnamed | :unknown |

Spot light (layout 11, 0, n): properties 1 are diffuse colour (0), specular colour (1), diffuse multiplier (2), specular
multiplier (3), near (4), far (5), X radius (6), Y radius (7), then three unnamed; fields 1 repeat the point light's flicker,
shadow and fog fields shifted: jitter flag 1, acceleration 2, jitter 4 to 6, interval 7 and 8, brightness 9, shadows 10,
separate specular 11, shadow darkness 12, fade-out frames 15, volume density 19, phase function 21, asymmetry 22,
adaptation exponent 23. :proven[against the fxr project, all 30 spot lights]
The fxr project presents a spot light's multipliers divided by ten; the stored values are ten times what it prints (8.0 where it
prints 0.8). :sourced[fxr] The executable's code for a spot light reads the stored multiplier into the light's intensity without
dividing it (below). :inferred[code read, not run]

A light's place in its effect is the chain of its nodes. The static node transform (action 35) is six float field words, a translation
and a rotation in degrees, and sits in a config, never in a node's own actions: 20,878 Sekiro configs and 81,215 Elden Ring
configs have one, none has two. :proven[every config of both installs]
Every node with several configs has a state-config map. :proven[every node of both installs]
Counted per light, 167 of Sekiro's 847 and 725 of Elden Ring's 5,016 have a rotation above them in the chain of the configs
that state 0 chooses; the rest sit under translations only. :proven
The rotation order and the translation's place relative to it are the fxr project's (rotations Z, X, Y, then the translation).
:sourced[fxr]

## How the renderer takes an effect light

A light action becomes a light object of the renderer through a per-frame update in the executable: it evaluates the action's
properties at the effect's time and writes the object's colour, intensity, radius and flicker state. :inferred[Sekiro 1.06 code read, not run]
The light object is the one a BTL light becomes, so both reach the lighting shader as the same record
(see [BTL light banks](/engines/fromsoft/lighting/btl/#how-the-renderer-takes-a-light)): the record's diffuse colour is
`colour^2 * intensity` per channel. :observed{games="sekiro"}

For a point light the code gives, per frame:

| Light object field | Value |
|---|---|
| colour | the diffuse colour's red, green and blue, times the effect instance's own colour scale (1 unless the effect is spawned with another) |
| intensity | diffuse multiplier times the diffuse colour's alpha times the instance's mean scale (the mean of its three scale values) times the instance's brightness factor |
| radius | the radius property times the instance's mean scale |
| fourth diffuse value | 1 divided by a property of the second list (`unk_ds3_p2_0` in the fxr project's naming) |

:inferred[code read, not run] The effect's light settings are applied only when the effect has a light-parameter record, which none
of the lights read back had. The fixed scale constants in that code are all 1.0. :inferred

Read back from a running Sekiro in Ashina Castle (four frames, 19 point records each):

- Effect 300's light (a steady light: no flicker, colour 200/230/255, alpha 1, multiplier 0.05, radius 1.5) is the record
  with diffuse colour 0.030757403, 0.040676665, 0.05, radius 1.5 and fourth value 5 = 1 / 0.2: `colour^2 * multiplier`
  exactly, to float rounding, and 1 / `unk_ds3_p2_0`. :observed{games="sekiro"}[1 light, 4 frames]
- Each of the other 14 non-BTL records of the first frame has the colour direction and radius of a stored effect light and a
  largest colour channel between the stored multiplier times alpha times flicker brightness and the stored multiplier times
  alpha (for example 4.80 to 6.40 for the 6.4 multiplier lights of flicker brightness 0.75; 9.0 to 9.8 for a multiplier
  of 10 and flicker 0.875). Over four frames the readings of one light vary within that band. :observed{games="sekiro"}[14 lights, 1 frame]

So an effect light's multiplier times its colour alpha is in the same unit as a BTL light's power, with no factor between them;
the data's earlier estimate (an effect's brightness about five times the nearest BTL light's power) is a difference in how
the lights were authored, not in the unit. :observed{games="sekiro"} No alpha other than 1 was among the lights read back, so
the product with alpha rests on the code. :inferred

A spot light's update is the point light's, with the multiplier at property 2 and the colour alpha taken the same way: no
divisor by ten appears in the update, the packing or the shaders, and the packing's scale factor for spot lights is 1.0 by default.
The cone is built from the near and far planes and two angles `2 * atan(radius / 2 / far)`, so the stored radii act as the
full width and height of the base rather than as half-extents. :inferred[code read, not run; no spot light was in the captured frames]

## How the games name an effect

An effect runs because something names its id. The routes, with the share of ids in each that exist and reach a light (the
effect itself or an effect it spawns holds a light):

| Route | Elden Ring | Sekiro |
|---|---|---|
| param fields: 323 `ExtRefs` fields of 16 params (`AssetModelSfxParam` `sfxId_0` to `7`, `Bullet`, `Magic`, `SpEffectVfx`, `FootSfxParam`, `ThrowDirectionSfxParam`, ...) | 5,521 distinct ids, 5,139 exist, 2,858 reach a light | none (no definitions); the same kind of fields found by name and hit rate: 1,212 ids, 1,000 exist, 221 reach |
| map regions of type SFX (5): effect id in the first word of the type data, a start-disabled flag after it ([layout](/engines/fromsoft/world/msb/#effect-regions-type-5)) | 1,523 regions in 104 maps; 109 name an effect that reaches a light | 1,872 regions in 9 maps; 96 |
| WindSFX regions (6): effect id first | 72, none reach a light | 106, none |
| placed asset or object: ER asset part type data +0x1c (i16 relative id) selects [`AssetModelSfxParam`](/engines/fromsoft/data-model/params/#modelsfxparam-and-assetmodelsfxparam) row `(nnn x 1000 + mmm) x 1000 + relative id` for the model `AEGnnn_mmm`; Sekiro `ModelSfxParam` row `object model number x 1000` | 409,246 of 421,253 asset parts have -1; 9,396 parts on 352 models reach a light | 1,418 of 10,538 object parts on 80 models |
| TAE events 96 and 118 (and 110, 112, 114 to 116, 119, 120 by the community templates): the effect id is the first word | 2,788 ids; all that reach a light are in character animation binders | 762 ids; likewise |

:observed[hit-rate and reference census over both installs]
Of the lights a placed object reaches, the effects named by the placed routes and the effects they spawn are 322 files holding
172 point and 4 spot lights in Elden Ring and 164 files holding 54 point and 5 spot lights in Sekiro. :observed
An asset's effect attaches to the dummy polygon the row names (`dmypolyId_n`, 200 in the light rows). :observed

## Placing the lights of an effect

A light has no place of its own: it stands where the effect stands, under the static node transforms of its chain
(above). Where an effect stands is decided by what spawns it.

- *Map regions.* An SFX region names an effect; the effect stands at the region's position and rotation. :inferred
- *Placed models.* A row of the model effect param names, for each of up to eight slots, an effect and the reference id of a
  dummy polygon of the model; the effect attaches to the dummy with that id (a model may carry several dummies with one id,
  and then the slot's lights stand at each). :inferred
- *Spawned effects.* Every `SFXReference` action of both installs is among a node's own actions, none in a config: 543 in
  Sekiro's 2,913 files and 5,228 in Elden Ring's 12,155. :proven[independent walker: the same counts]
  The effect it names stands in the frame of the node that holds the action. :inferred
- *Search order.* The effects regions and rows name are in the binder of the map's area (`sfxbnd_m11` for Ashina Castle), in
  `sfxbnd_commoneffects` or, in Elden Ring, `sfxbnd_commoneffects_dlc02`, except for a few: of the 1,872 Sekiro and 1,523
  Elden Ring regions, 1 and 9 name an effect held only by another map's or a character's binder. :observed

The stored colour of every light, at its first keyframe and where it settles, has components that are whole numbers of 255ths
(5,082 components of Sekiro's 847 lights and 30,075 of Elden Ring's 5,016, the 7 colours that loop having no settled value).
:proven[every light of both installs] That is the representation of a byte, as the colours of the
[BTL lights](/engines/fromsoft/lighting/btl/) are.

The light's brightness is its colour's alpha times its multiplier, both properties of time. Whether alpha is a factor is
:inferred from the files' use (the alpha settles at 1 in 731 of Sekiro's 757 and 4,933 of Elden Ring's 4,974 lights, and the
fxr project's Dark Souls III conversion makes the point light's alpha its brightness). A spot light's stored multiplier is ten
times the unit a point light's is in. :sourced[fxr]

Brightness has no common scale with the powers of the BTL lights. Taking, per area, the median of the settled alpha times
multiplier of the live point lights the area's effects place and the median power of the point lights of the area's BTL
bank, the ratio of the two medians is 1.6 to 320 over the 68 Elden Ring areas that have both (median 16, quartiles 8 and 33)
and 0.25 to 64 over Sekiro's 9 (median 4): BTL powers are authored per area and the effects' multipliers are not. :observed[the areas read with both kinds of light]
An effect light and a BTL light within 1.5 m of each other, which may be one fixture, have a median ratio of 5 (quartiles 3.2
and 10; 1,227 pairs in the Elden Ring areas and Sekiro's 35 pairs in its 9 areas, median 5, quartiles 2.5 and 6.4), where pairs 3 to 12 m apart have medians of 16: the effect
light's brightness is about five times the BTL light's power, to a factor of 2 to 3 either way. :inferred[from the pairs, assuming
near lights are one fixture]

## Elden Ring

`commoneffects_dlc02` holds 1,482 files, of which 717 carry a point light (799 point lights in all). :proven

## Sekiro

Five point lights of the common effects are in Dark Souls III's layout (above). :observed

:::open[What are the second and third id lists of the header?]
The second list holds 0 in nearly every file, sometimes with 1, 2 or 10000 (one file family holds only 2000); the third is
empty in all but 37 Elden Ring files. Their meaning, and whether the external-value operands of the conditions and modifiers
are the values listed, is not established.
:::

:::open[Which ModelSfxParam row does a Sekiro object use?]
The part's type data has no relative-id field as the Elden Ring asset part's; rows at offsets 1 to 4 above the model number
x 1000 exist for 335, 209, 66 and 51 placed objects, and what chooses them is not read.
:::

:::open[Which way does an effect's spot light shine?]
The spot light stores a near plane, a far plane and the extents of an elliptic base there, and no axis: the axis is the
effect's own local direction, which the file does not name. The light object takes a transform from the effect's node, but
which of its axes the renderer's cone follows was not read, and no effect spot light was captured. The code's cone angle
(`2 * atan(radius / 2 / far)`, above) and the absence of a tenth on a spot's multiplier need one captured frame with a spot
light to be proven.
:::

:::open[What do the action's flag bytes and unknown word mean?]
The first two bytes are (0, 1) or (1, 0) and the word after them 0 to 11 (always 0 with (1, 0)).
:::
