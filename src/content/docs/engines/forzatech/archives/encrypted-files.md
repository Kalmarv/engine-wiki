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

The measurements here come from a census of one install; a later fresh install of the same game carries the same
block counts and sizes (game database 16,123,860 bytes in 123 blocks, `sfsdata` 77,604,132 in 592,
`NerdData.json` 564 in one). :observed

## What is encrypted

| File | Block size | Notes | Confidence |
|---|---|---|---|
| `media\Stripped\gamedbRC.slt` | 0x20000 (123 blocks) | the game database: cars, parts, wheel and tyre sizes, prices. About 16 MB at 7.99999 bits per byte, no SQLite header; decrypted, an SQLite database of 207 tables that passes SQLite's integrity check | :observed |
| `media\sfsdata` | 0x20000 (592 blocks) | | :observed |
| `NerdData.json` | 0x200 | | :observed |
| Profile files (`<xuid>ProfileBackup`, `<xuid>Meta`, `CmsCache\**`) | 0x200 | the player's garage, tunes, paint and liveries; local copy of a cloud save | :observed |
| the 29,250 zip entries of method 22, in 1,085 archives under `media` (every entry of `Rendering.zip` and `GameTunableSettings.zip`, and most of `media\Audio\EngineSynth`) | 0x200 | raw DEFLATE inside the TFIT envelope; sizes are rounded up to whole blocks (64 bytes become 564); see [Zip archives](/engines/forzatech/archives/zip/) | :proven |

The render settings in these archives (the near-field megatexture parameters in `Megatexture.xml`, `Livery.xml`,
`DecalManager.xml`) are readable only with the `General` usage's keys. :proven

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
data and MAC key pair for each of seven usages — `GameDB`, `ProfileData`, `General` for settings files and archive
entries, `Engine`, `SFS` for `sfsdata`, and `ServiceA`, `ServiceB` for the per-player containers. The same library
holds a separate AES key for the `Motorsport` CMS entries, which are not FH6's.
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

A profile decrypts to a u32 compressed size, a u32 expanded size and a zlib stream. :observed A method-22 archive
entry decrypts to a raw DEFLATE stream. :observed

## Checked on files the game wrote

Every part of the description above has been confirmed against files the game wrote: each container's header
authenticates under its usage's MAC key, every one of its blocks' MACs matches, and the plaintext comes out as the
inner format promises.

| Files | Usage that authenticates them | What the plaintext is |
|---|---|---|
| profiles, 737 and 735 blocks (paddings 78, 306) | `ProfileData` | a u32 compressed size equal to the bytes after it, a u32 expanded size, then a zlib stream (header `78 9C`) inflating to that size, Adler-32 checked |
| an `Estate` and a `CustomFlyer` blob | `ServiceB` | that container kind's own records |
| `media\sfsdata`, 592 blocks | `SFS` | 77,522,352 bytes |
| `media\Stripped\gamedbRC.slt`, 123 blocks | `GameDB` | an SQLite image once the keystream is removed: its header string and a page size times page count that fits |
| every method-22 zip entry of the install, 29,250 in 1,085 archives | `General` | a raw DEFLATE stream inflating to exactly the zip's stated size and CRC-32 |
| `media\NerdData\NerdData.json`, one block | `General` | 78 bytes |

:observed The zip entries are every one there is (:proven). The `Engine` pair has not matched any file seen here.

That confirms the envelope, the HKDF IV chain, the block CMACs, the header MAC, the keystream, the profile's compressed
header and the settings entries' raw DEFLATE. :observed

## Not encrypted

- The saved designs and tunes the platform keeps for the player are plain; see [Saves and tunes](/engines/forzatech/gameplay/saves-and-tunes/). :observed
- `media\Stripped\StringTables\<LANG>.zip` are ordinary deflate zips ([String tables](/engines/forzatech/data-model/string-tables/)). :observed
- The car archives under `media\Cars` are ordinary zips ([Cars](/engines/forzatech/gameplay/carbin/)). :observed
