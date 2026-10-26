---
title: Skater camera
description: Where the third-person camera sits relative to the skater right after spawn, and how reproducible its framing is.
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
