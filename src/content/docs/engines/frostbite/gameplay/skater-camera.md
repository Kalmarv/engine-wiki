---
title: Skater camera
description: Where the third-person camera sits relative to the skater right after spawn, how reproducible its framing is, and where its framing height is stored.
games: [skate]
---

The third-person camera follows the skater from behind and above. Its pose right after spawn is measured by
fitting renders of a known level to two in-game screenshots taken at the spawn point. :observed

| Quantity | Value | Confidence |
|---|---|---|
| Position along the heading | About 0.3 m ahead of the skater's ground point | :observed |
| Height | 1.5 m above the ground | :observed |
| Vertical field of view | 55.3° at 16:9 | :observed |
| Pitch | +1.2° in one launch, −6.2° in the other | :observed |
| Yaw | −0.3° and +4.2° off the heading | :observed |

Position and field of view agree between the two launches; pitch and yaw do not, so the framing after spawn is
reproducible only to about 7°. :observed

:::open[What sets the camera's pitch and yaw after spawn?]
Two launches give different angles at the same spawn; whether they follow the spawn's own orientation, the
skater's settling or input is not established. :unknown
:::

## Framing height

The camera's framing height, High or Low, is a player-profile value, `UseHighCam`. A profile written with High
read Low again after ordinary play, the profile having advanced from revision 3,332 to 3,359, so the game itself
rewrites the value during play. :observed The game option "Camera height control" (Gameplay > Advanced Camera,
option asset `camera_enableheightinput`) lets the player change the height in play; with it off, the stored
height presumably stays as written. :inferred

:::open[What in play switches the framing height?]
The value changed during ordinary play; which input or event writes it, and whether turning camera height control
off holds it, have not been observed. :unknown
:::
