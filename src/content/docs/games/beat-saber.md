---
title: Beat Saber
description: "Beat Saber's map files (v2, v3 and v4), its player replays as the BeatLeader mod records them (BSOR), and the energy bar they let one reconstruct."
games: [beat-saber]
---

Beat Saber (Beat Games, 2019) is a VR rhythm game on [Unity](/engines/unity/): the player cuts coloured notes with two sabers
in a set direction while dodging walls and bombs. :sourced[the game's own description] The observations here are of Steam game
version 1.40.8_7379 with the BeatLeader mod 0.9.33, and of the BOXRR-23 replay dataset (game 1.24 to 1.28). :observed{games="beat-saber"}

- [Replays (BSOR) and the energy bar](/engines/unity/gameplay/beat-saber-replays/): the open replay format, how note events
  line up with the map's notes, what a failed run records, and the energy rules a replay reproduces.
- [Beatmap files](/engines/unity/gameplay/beat-saber-beatmaps/): Info.dat and the difficulty files, their three versions, the
  zero-valued fields newer files leave out, lighting events, and what mod-requiring maps add.
