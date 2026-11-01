---
title: Game objects (GameObjs.xml)
description: The named places Forza Horizon 6 gameplay refers to by id, kept in a small XML file per track and per open world, and what the file holds.
implementations:
  - name: forzatech-formats (gameobjs.rs)
    url: https://github.com/Kalmarv/forzatech-formats/blob/main/src/gameobjs.rs
---

Gameplay refers to places in the world by name: an estate entrance, a discount board, a speed camera, a barn find.
Their positions are not in the placement files but in `GameObjs.xml`, one per track at `Ribbon_00\GameObjs.xml` and one
for the open world at `Stripped\gs\<track>\gameobjs.xml`. The install holds three: the Tokyo track's, the open world's
and the home space's. :proven

## Layout

A UTF-8 file with a byte order mark and an XML declaration (`version="1.0" encoding="utf-8"`), with this structure in
all three files and no other element or attribute in any. :proven

```xml
<GameObjs>
  <GameObjectLocators />
  <Objs>
    <Obj GameplayID="ESTATE_ENTRANCE_13">
      <Pos value="-2015.0108642578125,113.67074584960938,2481.716552734375" />
      <Orientation>
        <XAxis value="0.16,0.026,0.987" />
        <YAxis value="-0.004,0.9997,-0.026" />
        <ZAxis value="-0.987,0,0.16" />
      </Orientation>
    </Obj>
  </Objs>
</GameObjs>
```

- `GameObjectLocators` is empty in all three files. :proven Whether it can hold anything is unknown.
- `Obj` has `GameplayID`; the open world's file also gives every object a `Guid` (a lower-case GUID), and the track's
  gives none. :proven
- `Pos`, `XAxis`, `YAxis` and `ZAxis` each have one `value` attribute: three decimal numbers separated by commas, with
  `E` exponents where small (`-8.742277657347586E-08`). :proven
- The numbers were written by more than one program: some are the shortest text of a single-precision float
  (`-1792.549`), others carry 15 digits of one (`101.982322692871`), others 17 (`113.67074584960938`, the double
  of a float). Read as the nearest float, they are the values the game holds. :observed
- The track's file has 793 objects with 793 distinct ids; the open world's has 59 objects with 45 distinct ids; the home
  space's has none. :proven

## What the objects are

By the first word of the id, the track's 793 objects are DISCOUNT 203 (boards: `DISCOUNT_BOARD_XP_A/B/C`, 100, 75 and
25, and 3 `TREASURE_CHEST`), MASCOTS 200 (`MASCOTS_REGION`), SPEEDCAMERAZONE 120, DRIFTZONEMARKER 80, SPEEDCAMERA 60,
TRAILBLAZER 48, ESTATE 37 (`ESTATE_ENTRANCE_N`), ANIM 26 (`ANIM_CM_E0001_Ambient_HighSpeedTrain_Carriage` and its kin),
BARN 17, STADIUM 1 and TAXIJOB 1. The open world's 59 are BARN 28 (`BARN_FIND_INTERIOR_<car>`, two each), DISCOUNT 16
(all `TREASURE_CHEST`), GarageInteriorWall 4, `3003`/`3013` 3 each, SPEEDCAMERA 2 and one each of GarageInteriorFloor,
Roof and Grid. :observed 27 of the track's objects stand at (0, 0, 0): all 26 ANIM objects and `STADIUM_FLOOR`. :observed

## Orientation

Each axis is a unit vector: over all 852 objects of the three files an axis is within 4.6e-6 of unit length and two
axes of one object are within 1.2e-7 of orthogonal. :proven Which of them are the rows and which the columns of the
object's rotation is not established. :unknown

:::open[What refers to a game object?]
The ids look like the gameplay tags of [`.pgeo` headers](/engines/forzatech/world/pgeo-placements/) and of the
[`.pvs` gameplay records](/engines/forzatech/world/pvs-ribbon/) (`BARN_FIND_...`, `TAXIJOB`), but no file read so far
links an object here to a placement by anything but the name.
:::
