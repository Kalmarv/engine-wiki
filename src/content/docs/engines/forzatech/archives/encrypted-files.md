---
title: Encrypted files and keys
description: Which Forza Horizon 6 files are encrypted with Arxan TransformIT, the envelope they share, and what is known about the key.
sources:
  - title: ForzaTechStudio (create-zip.md)
    url: https://github.com/D3FEKT/ForzaTechStudio
    note: zip method 21 (XMemCompress LZX) and method 22 (deflate plus TFIT)
  - title: Forza-Crypto-Tool (DVS-code)
    url: https://github.com/DVS-code
    note: decrypts FH6 data server-side; no key is published
  - title: Forza-Crypto-Tool data mirror
    url: https://gist.github.com/DVS-code/b66d155ae0cb76072c7f71868538355d
    note: decrypted FH6 data from the tool's authors, including the game database as SQLite
---

Forza Horizon 6 encrypts its game database, its string-and-settings archives and the player's profile with **Arxan
TransformIT** (TFIT), a white-box AES. The geometry, placements, materials and textures of a track are not encrypted
(see [PGZP archives](/engines/forzatech/archives/pgzp-minizip/)), so everything on the World pages can be read without a
key. :observed

The measurements here come from a recorded census of the install; the game is no longer installed, so they cannot be
re-checked. :observed

## What is encrypted

| File | Block size | Notes | Confidence |
|---|---|---|---|
| `media\Stripped\gamedbRC.slt` | 0x20000 (123 blocks) | the game database: cars, parts, wheel and tyre sizes, prices. About 16 MB at 7.99999 bits per byte, no SQLite header | :observed |
| `media\sfsdata` | 0x20000 (592 blocks) | | :observed |
| `NerdData.json` | 0x200 | | :observed |
| Profile files (`<xuid>ProfileBackup`, `<xuid>Meta`, `CmsCache\**`) | 0x200 | the player's garage, tunes, paint and liveries; local copy of a cloud save | :observed |
| 67 zip entries of method 22 (`Rendering.zip`, `Rules.zip`, `GameTunableSettings.zip`, `Camera.zip`, `RenderScenarios.zip`, `stateflow.zip`, `Physics`, `ProfileSchema`, ...) | 0x200 | raw DEFLATE inside the TFIT envelope; sizes are rounded up to whole blocks (64 bytes become 564) | :observed |

The render settings in these archives (the near-field megatexture parameters in `Megatexture.xml`, `Livery.xml`, the
decal blend state) are therefore not readable from the install. :observed

## Envelope

Every TFIT file starts with a 36-byte header, then carries blocks each followed by a 16-byte MAC. The plaintext is
`N × block size − padding`. All checked files divide exactly. :observed

```layout
title: TFIT envelope
size: variable
games: [fh6]
note: "Little-endian. N blocks, each block followed by its MAC."
fields:
  - {at: 0, size: 16, type: "u8[16]", name: IV, level: observed}
  - {at: 16, size: 4, type: u32, name: padding size, level: observed, note: "bytes of padding at the end of the plaintext"}
  - {at: 20, size: 16, type: "u8[16]", name: MAC, level: observed, note: "of the header"}
  - {at: 36, size: "N × (block size + 16)", type: "block[]", name: blocks, level: observed, note: "ciphertext block, then a 16-byte MAC; block size 0x20000 or 0x200"}
```

## The key

The executable statically links Botan; its CNG AES-GCM strings have no references, so they belong to another
subsystem, not to these files. :observed A static analysis of `forzahorizon6.exe` found no key. :observed The
executable is not packed and its entry point is the ordinary compiler start-up code; `.text` is 104 MB of which some
64 KB windows are near random (above 7.9 bits per byte) yet hold real function boundaries, and some individual
functions (two that register the instancing data) are stored encrypted and decrypted in memory at run time. :observed
No public key for the FH6 files exists; a community tool decrypts them server-side only. :sourced[Forza-Crypto-Tool]
Its authors publish decrypted data; in it `gamedbRC.slt` is an SQLite database of 205 tables listing 638 cars.
:sourced[Forza-Crypto-Tool data mirror]

:::open[Where does the key live?]
White-box AES hides the key inside the transform tables; static analysis of the executable did not recover it, and
protected functions cannot be read from the file.
:::

## Not encrypted

- The saved designs and tunes the platform keeps for the player are plain; see [Saves and tunes](/engines/forzatech/gameplay/saves-and-tunes/). :observed
- `media\Stripped\StringTables\<LANG>.zip` are ordinary deflate zips ([String tables](/engines/forzatech/data-model/string-tables/)). :observed
- The car archives under `media\Cars` are ordinary zips ([Cars](/engines/forzatech/gameplay/carbin/)). :observed
