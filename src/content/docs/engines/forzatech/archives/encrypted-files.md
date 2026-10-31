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
  - title: FH6-Local-Crypto-Car-Editor-Tool (HTTPJXRDN)
    url: https://github.com/HTTPJXRDN/FH6-Local-Crypto-Car-Editor-Tool
    note: decrypts FH6 files offline; its source (ForzaZip.cs, GameDb.cs, Scramble.cs) describes the cipher, and its keys sit in a bundled, obfuscated .NET library
implementations:
  - name: "forzatech-formats (container.rs, gamedb.rs)"
    url: https://github.com/Kalmarv/forzatech-formats
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
Forza-Crypto-Tool decrypts the FH6 files only on its authors' server and ships no key. :sourced[Forza-Crypto-Tool]
Its authors publish decrypted data; in it `gamedbRC.slt` is an SQLite database of 205 tables listing 638 cars.
:sourced[Forza-Crypto-Tool data mirror] A second tool decrypts them offline with plain AES keys, already lifted out of
the white-box tables, that it ships inside an obfuscated library: two transport keys shared by every container and a
data and MAC key pair per kind of file (`GameDB`, `ProfileData`, `General` for settings files and archive entries).
:sourced[FH6-Local-Crypto-Car-Editor-Tool] No key is published in the open.

## The cipher

Each block is AES-256-CBC under the file kind's data key, with no padding mode (the header's padding field covers
the tail). :sourced[FH6-Local-Crypto-Car-Editor-Tool] Every block and every MAC has its own IV: the next IV is the
first 16 bytes of HKDF-SHA256 with the previous IV as input key material and the two transport keys as salt and info,
so the whole chain follows from the IV in the header. :sourced[FH6-Local-Crypto-Car-Editor-Tool] A block's MAC is the
AES-CMAC of its plaintext under the 16-byte MAC key, stored AES-CBC-encrypted under the data key with the IV after the
block's. :sourced[FH6-Local-Crypto-Car-Editor-Tool] The header's MAC is the AES-CMAC of the padded length (u32,
little-endian), the header's IV and its padding field, and the game rejects a container whose header MAC is stale.
:sourced[FH6-Local-Crypto-Car-Editor-Tool]

`gamedbRC.slt` has a second layer: its decrypted blocks are XORed with a keystream to give the SQLite image. Each
4-byte group `q` is XORed with the CRC-32 of the four little-endian bytes of `q + C × (q + 1)` (ASCII upper case folded
to lower case first), for a constant `C`; the game removes it in its in-memory SQLite file layer. The same tool calls
the 16 bytes after the padding field a nonce in this file and does not check them or the block MACs.
:sourced[FH6-Local-Crypto-Car-Editor-Tool]

A method-22 archive entry decrypts to a raw DEFLATE stream, and a profile to a u32 compressed size, a u32 expanded
size and a zlib stream. :sourced[FH6-Local-Crypto-Car-Editor-Tool]

:::open[Is the cipher description right on the game's files?]
The steps above come from one tool's source, not from the game's code or a decryption checked here. A real install's
files decrypting with every MAC matching would confirm them.
:::

## Not encrypted

- The saved designs and tunes the platform keeps for the player are plain; see [Saves and tunes](/engines/forzatech/gameplay/saves-and-tunes/). :observed
- `media\Stripped\StringTables\<LANG>.zip` are ordinary deflate zips ([String tables](/engines/forzatech/data-model/string-tables/)). :observed
- The car archives under `media\Cars` are ordinary zips ([Cars](/engines/forzatech/gameplay/carbin/)). :observed
