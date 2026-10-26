---
title: The disc and its file names
description: "What a Tony Hawk: SHRED disc holds, how its files are named in the ISO 9660 primary tree and in the Joliet tree, and which of the two the game asks for."
---

Tony Hawk: SHRED ships on a PlayStation 3 Blu-ray, volume `HAWKPS3`, 2,871,328 sectors, with trophy set `NPWR01369_00`. The dump examined has 1,124 files, 5,875,743,333 bytes, in an ISO of 5,880,479,744 bytes. :observed
The disc is a **decrypted dump**: sector 0 holds the PS3 region table, but the ranges it marks as encrypted contain plaintext (`PAK\0`, `SCE\0`, `RIFF`), so no disc key is needed to read it. :observed
`PARAM.SFO` gives title `Tony Hawk: SHRED`, title ID `BLUS30542` and version `01.00`. :proven

## What is on it

All of it under `PS3_GAME`. :proven[all 1,124 files]

| Where | Files | What |
|---|---:|---|
| `USRDIR/EBOOT.BIN` | 1 | the executable, an SCE SELF of 24,250,576 bytes; decrypted it is a 64-bit big-endian PowerPC ELF |
| `USRDIR/SCRIPTS.SDAT` | 1 | the compiled Lua scripts, an NPD-wrapped [PAK](/engines/rme/archives/pak/) |
| the 336 PAKs | 336 | `levels`, `levels/layers`, `characters`, `anim`, `flash`, `database` and the root of `USRDIR` |
| `USRDIR/database` | 27 | SQLite 3 databases (`MAIN.DB` holds levels, sessions and surfaces) |
| `USRDIR/physics` | 8 | Havok `.HKX` files |
| `USRDIR/audio` | 288 | Wwise banks (70 `.BNK`), packages (70 `.PCK`) and 147 `.OGG` files, and others |
| `USRDIR/videos/bik` | 451 | Bink videos, 2.95 GB |
| `PS3_UPDATE/PS3UPDAT.PUP` | 1 | the console firmware update, 268 MB |

All counts are over the file listing of the disc. :proven[all 1,124 files] That the 8 `.HKX` are Havok packfiles and the 27 databases SQLite 3 was checked on each. :observed

The executable and the scripts are encrypted on the disc. RPCS3 decrypts both without any key of ours; the decrypted executable is an ELF with eight program headers whose entry point is a function descriptor. :observed

## Two name trees

The disc has two directory trees over the same sectors. The ISO 9660 **primary** tree holds upper-case names; the **Joliet** tree holds the names the game itself uses, with lower case and punctuation that ISO 9660 cannot hold. Each file has the same first sector and the same size in both trees. :proven[all 1,124 files]

| Names in the two trees | Files |
|---|---:|
| identical | 11 |
| differ only in letter case (primary upper case, Joliet lower case) | 1,112 |
| differ in case and in one character (`_` against `-`) | 1 |

The one file of the last kind is the video `187_FORWARDFLIP_IMPOSSIBLE.BIK` in the primary tree and `187_forwardflip-impossible.bik` in Joliet. :proven[all 1,124 files]
The directory names differ in the same way (`USRDIR/AUDIO` against `USRDIR/audio`). :observed

The game asks the file system for the Joliet spelling, for example `database/ui_frontend_en.db`, and a case-sensitive host (the RPCS3 emulator compares names exactly) finds nothing under the primary spelling. :observed
A reader that extracts the disc from its primary tree therefore has to rename every file to its Joliet name, matching files by first sector. :observed

Inside the PAKs the names are a separate scheme: lower-case paths with backslashes, hashed ([Names and hashes](/engines/rme/archives/pak/#names-and-hashes)).
