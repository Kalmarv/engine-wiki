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
  - {at: 0, size: 2, type: i16, name: action type, level: observed, note: "64 types in Sekiro's files, 71 in Elden Ring's, type 0 (an empty slot) among them; see FXR typed actions"}
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
The 72 types the installs hold, where each parameter sits, the layouts they store, the grammar of nodes, configs and slots, and the
enumerated parameters are on [FXR typed actions](/engines/fromsoft/effects/fxr-actions/).

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
Type word A holds the component count and the modifier's kind, and every modifier of both installs is one of five kinds. :proven
The kinds, their fields and their counts are in [FXR typed actions](/engines/fromsoft/effects/fxr-actions/#property-modifiers), and the
curve functions in [property curves](/engines/fromsoft/effects/fxr-actions/#property-curves).

```layout
title: FXR modifier
size: 32
fields:
  - {at: 0, size: 2, type: u16, name: type word A, level: sourced, note: "Bits 0-1 the component count minus one; the kind is (bits 12-13) << 4 | bits 4-7: 21, 24, 38, 39 or 53"}
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
A spot light under a node stored as rotation (-65, -75, -35) degrees and offset (0, 1, 0), with a child at (0, 0, -1), stands at
the node offset plus the child offset turned by the rotation, and shines along (-0.4082, -0.9063, 0.1094): the axis in the
lighting pass's spot buffer is the negated turned child offset. That axis is the image of +Z when Z turns first, then X, then Y,
with the Y angle in the usual right-handed sense and the X angle negated. Of the 48 readings (six orders of the three
rotations, each axis in either sense) exactly two reproduce the axis to 1e-3, the two that differ only in the sense of Z; the
nearest of the other 46 is 0.23 away (the unit-vector distance). :observed[one stored triple, Sekiro 1.06, the 18
spot records of each of four captures, all identical]
The sense of the Z angle does not move a light's axis when Z turns first, so it is not determined by a spot light whose child
offset lies on Z; a chain with the child on X or Y would show it. :unknown

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
full width and height of the base rather than as half-extents. :inferred[code read, not run; no effect spot light was in the captured frames]
The spot record the packer writes, the setter that turns two full angles into the cone's matrix and the shader were read back for
five bank spot lights ([BTL light banks](/engines/fromsoft/lighting/btl/#spot-lights)): the setter takes full angles per axis, so the
effect update's `2 * atan(radius / 2 / far)` is a half-angle of `atan(radius / 2 / far)`. :inferred[bank spot lights read back; the effect update's step read from code]

:only[elden-ring] An effect light's record is scaled by the exposure term of the light object
([BTL light banks](/engines/fromsoft/lighting/btl/#the-exposure-term)), which for these lights is not 0: over a read of Stormveil
Castle's gate (263 light records of the lighting stage's buffers, 41 distinct radius, fourth-value and colour groups) the records
that stand on a stored effect light (same radius, same `1 / unk_ds3_p2_0`, same colour direction) hold the stored brightness
(multiplier times alpha, times a flicker factor between the flicker brightness and 1) times a factor of 0.0353 to 0.0427; the nine groups
whose stored effect lights flicker give lower bounds of 0.0414 to 0.0432 for the factor, consistent with one factor for every effect.
:observed{games="elden-ring"}[9 groups] Effect 300's light, which does not flicker (multiplier 0.2, colour (245, 255, 250) / 255,
alpha 1, radius 2.5), reads 0.00705 to 0.00854 in its largest channel over six records found in 2.5 minutes in a steady scene,
so its factor is `2^(-X)` with `X` between 4.55 and 4.83 and changes between records (five of them lie within 0.2 % of one
another, one is 17 % lower); one reading of the exposure value that fits a record (-4.5516038 for the factor 0.0426413) is also stored in the
process's memory with the opposite sign. :observed{games="elden-ring"}[6 readings of 1 light] Bank lights of the same read have
weight 0 and the factor 1 ([BTL light banks](/engines/fromsoft/lighting/btl/#spot-lights)), so an effect light's brightness
is about 25 times a bank power of the same value in this scene, not equal to it as in Sekiro, where effect lights read back with
factor 1. :observed{games="elden-ring"} That the factor comes from a weight of 1 set on effect lights by the effect's light
update, rather than from a constant, is an inference from the shape of the factor (it moves with the scene). :inferred

## How the games name an effect

An effect runs because something names its id. The routes, with the share of ids in each that exist and reach a light (the
effect itself or an effect it spawns holds a light):

| Route | Elden Ring | Sekiro |
|---|---|---|
| param fields: 323 `ExtRefs` fields of 16 params (`AssetModelSfxParam` `sfxId_0` to `7`, `Bullet`, `Magic`, `SpEffectVfx`, `FootSfxParam`, `ThrowDirectionSfxParam`, ...) | 5,521 distinct ids, 5,139 exist, 2,858 reach a light | none (no definitions); the same kind of fields found by name and hit rate: 1,212 ids, 1,000 exist, 221 reach |
| map regions of type SFX (5): effect id in the first word of the type data, a start-disabled flag after it ([layout](/engines/fromsoft/world/msb/#effect-regions-type-5)) | 1,523 regions in 104 maps; 109 name an effect that reaches a light | 1,872 regions in 9 maps; 96 |
| WindSFX regions (6): effect id first | 72, none reach a light | 106, none |
| placed asset or object: ER asset part type data +0x1c (i16 relative id) selects [`AssetModelSfxParam`](/engines/fromsoft/data-model/params/#modelsfxparam-and-assetmodelsfxparam) row `(nnn x 1000 + mmm) x 1000 + relative id` for the model `AEGnnn_mmm`; Sekiro `ModelSfxParam` row `object model number x 1000` | 409,246 of 421,253 asset parts have -1; 9,396 parts on 352 models reach a light | 1,418 of 10,538 object parts on 80 models |
| TAE events 96 and 118 (and 120 in Elden Ring): the effect id is the first word (the other events the community templates give an effect field are below) | 2,788 ids; all that reach a light are in character animation binders | 762 ids; likewise |
| `HitEffectSfxParam`: 15 fields named by the kind of hit (`Slash_S` to `Thrust_Specific2` in Elden Ring, `Slash_S` to `Thrust_LLL` in Sekiro) | 193 rows, 585 distinct ids that exist | 69 rows, 101 ids |
| EMEVD instructions 2006[3] (effect id in argument 3) and 2006[4] (argument 2) | 35 and 78 ids | 10 and 11 ids |

:observed[hit-rate and reference census over both installs]
A scan of every field of every param, every payload word of every TAE event kind and every argument of every EMEVD instruction
in both installs (a location is a route when at least three distinct values of 1,000 or more in it are effect ids that exist
and they are at least half of its distinct values of 1,000 or more) finds, besides the routes above, only locations naming at
most 20 effects each, which read as numeric coincidences (for example `CharaInitParam` `equip_Helm` in Sekiro, `ObjActParam`
`actionFailedMsgId` in Elden Ring). With the two added rows, 1,991 of Sekiro's 2,669
effect files (74.6%) and 8,958 of Elden Ring's 11,912 (75.2%) are named by a route or spawned by an effect that is, against
1,869 (70.0%) and 8,298 (69.7%) by the routes before. :observed
That the EMEVD pair starts and stops a map effect is read from the instruction's neighbours and the counts of its two members, not
from the instruction's definition. :inferred
Of the animation events whose community template has an effect field, three types hold effect numbers in the stock files. Of the
events with a positive number in the first word, type 96 (a one-shot effect at a dummy polygon: the id, the dummy polygon's reference
id, a slot, and flags that include "follow dummy polygon") names an effect that exists in 7,583 of 7,586 in Sekiro and 16,885 of
20,078 in Elden Ring (the rest name numbers that no effect binder of the install holds), type 118 (a blade: the id, a dummy-polygon source of body, left
or right weapon, and the base and tip dummy polygons) in 182 of 182 and 2,692 of 2,723, and type 120 (one effect for each kind of
player: the first of twelve ids) in 1,472 of 1,473 in Elden Ring. :observed[every event of every character animation binder of both
installs, 336,787 events in Sekiro and 1,310,023 in Elden Ring] Type 112 (the effect determined by the floor) holds one of 6 (Sekiro,
2,941 events) or 15 (Elden Ring, 1,410) small numbers, type 110 one of 3 (8 events) or 5 (89), and type 119 (Elden Ring) an id that no
binder holds in 247 of its 249 events; types 95, 99 to 101, 104, 108, 109, 121, 122 and 961 hold no positive number in either game.
:observed[the same events] The first word of these is therefore not shown to be an effect number. :inferred The goods and magic
events (114, 115) name their effect through a param row by the template's "param type" and "SFX index" fields, and the throw
(117) and foot (792) events through an index. :sourced[community templates] Dummy polygon reference ids in type 96 are one of 166
(Sekiro) or 270 (Elden Ring) values; 6,907 of Sekiro's 7,589 and 18,448 of Elden Ring's 20,082 type 96 events set the follow flag.
:observed
Of the 7,764 Sekiro and 23,892 Elden Ring events of types 96, 118 and 120 with a positive first word and no weapon source (below),
the effect file is in the common binder for 6,533 and 17,127, only in `commoneffects_dlc02` for none and 1,322, in the
`sfxbnd_c<NNNN>` binder of the character whose animation binder holds the event for none and 1,727, in a map binder alone for
1,224 (Sekiro: `m10` to `m25`) and 7, in another character's binder for 515 (Elden Ring), and in no binder of
the install for 7 and 3,194. :observed[the inventory of every FXR member of every `sfxbnd` binder against every such event]
Of the 3,194 Elden Ring events that no binder holds, 2,916 are the player's (`c0000`) and 3,009 name one of ten numbers from 400 to
422 (400, 420, 410, 401, 421, 411, 412, 403, 422, 402, by count), which are not effect files in Elden Ring although all ten are
files of Sekiro's common binder (with 430 to 432; Elden Ring's holds 430 to 434 and 440 to 442 as files). :observed
All 3,009 are type 96 events: 2,891 in the player's animations (235 animation numbers from 30000 to 201400, among them the attack
animations; dummy polygon 80 in 2,878, 82 in 7 and 81 in 6; the follow and restrict flags set and no spawn condition or state in
all but one) and 118 in the animations of `c3510`, `c3060`, `c2270` and other characters. :observed[every such event of every
character animation binder] The commoneffects binders hold files numbered `number * 1000 + a variant` for most of these
numbers: `401000`, `401001`, `401002`, `401004` to `401007`, `401010` to `401012`, `401020`, `401021`, `401030`, `411000`,
`411001`, `411002`, `411007`, `412000` to `412002`, `412007`, `420000` to `420002`, `420007`, `421000` to `421002`, `421007`,
`422000` to `422002`, `422007` and `400001` to `400003`; none for 410 and 403 (`411000`, `420000` and `401000` are one effect
file of 12,208 bytes and 41 actions, `x001` a file of 1,312 bytes that spawns `x000`, `x002` and the later variants files of
12,240 to 13,104 bytes). :observed[the inventory of every FXR member]
The engine's handler of type 96 does not turn the event's number into one of these: it stores the first word of the event, with the
dummy polygon and the slot, in a slot of the character's effect module as it is, and the module hands that number to the
effect manager, whose create call looks up exactly that number in its table of loaded effects (numbers -2, 0 and 2000 to 2999
start nothing) and asks the file loader for the file of that number where the table has none. :observed[decompilation of the
executable's event dispatcher, effect module, instance and manager of one build] The handler reads no parameter and no state
of the character or the weapon. :observed[the same code] That the 3,009 events start nothing for lack of a file is therefore
what the code and the files show; what the loader does with a number that names no file is not decoded. :inferred
The family files are reached by type 118. A blade event (type 118) is 16 bytes: the effect number (32 bits), the dummy polygon
source (16 bits at byte 4), the base polygon (16 bits at byte 6), the tip polygon (byte 8) and the slot (byte 10).
:observed[the handler's reads and 2,723 events] Its handler adds to the effect number a number the character's data keeps for
the hand, at byte `0x1e8` of the data for the right hand and `0x1f0` for the left: the source 2 adds the right hand's, 1 the
left's, and 0 the one the character's hand state names (-1 right, -2 left, any other none). :observed[decompilation of the
handler] The number of a stock blade event is `401001` (1,289 events), `401002` (872), `401004` (29), `401005` (4), `401007` (19),
`405000` (2), `411002` (5), `412002` (1), `413002` (3), `416002` (5), `420002` (4), `421001` (11), `421002` (7) and the numbers
of other characters' own effects. :observed[the same events] Added to `401001` the offsets 1, 3 to 6, 9 to 11, 19 and 20 give
files (`401002`, `401004` to `401007`, `401010` to `401012`, `401020`, `401021`) and 2, 12, 14 to 18, 21 and 24 to 28 do not; added
to `401002` the offsets 2 to 5, 9, 10, 18, 19 and 28 do. :observed[the file inventory] The special-effect param's `traceSfxIdOffsetType` takes the values 1 to 6, 9
to 12, 14 to 21 and 24 to 28 in 119 rows and is described by the community param documentation as the offset applied to a
blade trail's effect number, used for enchantments and weapon trails. :sourced[community param definitions] The character's
two numbers are therefore the sums of that field over the special effects active on the hand, or something the field selects.
:inferred How the field becomes the number is not decoded; the plain sum does not give a file for `401001` plus 2, a value that 12
rows hold. :observed The weapons' own `traceSfxId0` to `traceSfxId3` hold `401000` or -1 in all 3,636 rows. :observed[every
row] The enchantment path, which does not go through events, adds the weapon's `enchantSfxSize` to the effect number of a
special-effect row that sets the offset flag (`midstSfxId`, the `303xxx` numbers): the weapon row's field is read in one place
of the executable, the effect module's update of the special effects. :observed[decompilation, a scan of the image for reads of
the field]
A blade event whose dummy-polygon source is not 0 is a blade on a weapon's polygons: 8 events in Sekiro (source 1, characters
`c1020` and `c9820`, base polygon 300, tip 301) and 382 in Elden Ring (source 2 on 357 and source 1 on 25, 376 of them in
`c0000`). :observed[the same events] The community template of the Elden Ring events names the source's values 0 body, 1 left
weapon and 2 right weapon, and the two polygons the blade's base and tip. :sourced[community animation-event template] For a
source of 1 or 2 the handler first maps the base and tip numbers through a table of the engine's by the weapon's hand: a
number `n` becomes `20000 + n % 1000` for source 1 (the left hand's first weapon; `21000`, `22000` and `23000` for the next
three) and `10000 + n % 1000` for source 2 (the right hand's first weapon; `11000`, `12000`, `13000`), and `1000`, `2000`,
`3000` and `4000` for four more kinds. :observed[decompilation of the mapping and the table's values in the image]
Source 0 events name the character's dummy polygons as they are numbered in its combined table, and the player's blades are
such events: of Elden Ring's 2,723 blade events 2,341 have source 0, of which 1,577 name a polygon from 10000 to 11999 (809 the
right hand's first weapon's 300, i.e. `10300`, and 300 the second's `11300`), 58 one from 20000 to 21999, and 706 a polygon below
1000. :observed[the same events] The player's model (`c0000`) has 513 dummy polygons with 288 reference ids, none above 999:
100, 101, 110, 111, 120 and 121 on the left side (attach bone 73, 0.6 m to the left) and 130 on the right (bone 45), the places
a held weapon's own `100`, `120` and `130` meet. :observed[the model's dummy table] The weapon models carry the blade's polygons:
of the 496 weapon models of the 507 the weapon param names that the install holds (their FLVER dummy tables), reference ids 100,
120 and 130 are on 471, 110 on 466, 122 on 341, 300 and 301 on 337, 400 on 325, 401 on 286, 302 on 145 and 303 on 94, and 310,
330 and 10300 on none. :observed In weapon model 0100 the blade's polygons 300 and 301 lie along the
model's -y axis at -0.08 and -0.40, the grip polygons 100 to 130 between -0.36 and 0.12. :observed The weapon param holds
the same pairs for each weapon: `traceDmyIdHead0` to `traceDmyIdHead7` with `traceDmyIdTail0` to `traceDmyIdTail7`, whose first pair
is (300, -1) in 1,888 of 3,636 rows, (300, 301) in 702, (-1, -1) in 584, (10300, -1) in 201, (300, 302) in 96 and (300, 303) in 61, and
whose second pair is (310, -1) or (310, 311) in most rows that have one. :observed[every row of the weapon param] It does not show which
weapon (the one in the hand, by hand and slot) the game takes. :inferred
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
