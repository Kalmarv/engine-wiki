---
title: Zip archives
description: The PKWARE zip archives Forza Horizon 6 keeps its settings, cars, shaders, audio and libraries in, the three compression methods they use, and the encrypted method 22.
sources:
  - title: ForzaTechStudio (create-zip.md)
    url: https://github.com/D3FEKT/ForzaTechStudio
    note: zip method 21 (XMemCompress LZX) and method 22 (deflate plus TFIT)
  - title: PKWARE APPNOTE.TXT 6.3.10
    url: https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
    note: the zip and ZIP64 record layouts
implementations:
  - name: forzatech-formats (zip.rs)
    url: https://github.com/Kalmarv/forzatech-formats/blob/main/src/zip.rs
---

Outside the track worlds (which are in [PGZP archives](/engines/forzatech/archives/pgzp-minizip/)), Forza Horizon 6
keeps its files in ordinary PKWARE zip archives under `media`: the render and game settings (`Rendering.zip`,
`GameTunableSettings.zip` and the other zips directly in `media`), the cars (`media\Cars`), the string tables, the
shaders, the engine-sound data (`media\Audio\EngineSynth`) and the shared libraries under `media\Stripped`. :observed

This page describes Steam build 25588841. Each statement marked :proven held on every one of the install's 9,076
`.zip` files under `media` (402,283 entries). The check read every end record, every central directory record and
every local header with a reader that refuses any layout this page does not describe, and decoded every encrypted
entry. :proven

## Layout

The archives follow APPNOTE 6.3 without extensions of their own. :proven

- The entries are stored back to back from offset 0: each local header, then its name, then its data, with no gap and
  no data descriptor. The last entry's data ends where the central directory starts, and the central directory ends
  where the end records start. :proven
- Every local header carries the same flags, method, CRC-32, sizes and name as its central directory record. :proven
- The general-purpose flags are 0 on every entry. :proven
- No archive has a comment, and the end of central directory record is the last 22 bytes of the file. :proven
- Every name is ASCII, and no two entries of an archive share a name. Eight entries are folder entries (names ending
  in `/`). :proven
- One archive, `media\Stripped\gs\swatchbins.zip`, needs ZIP64 records: its end of central directory record defers to a
  ZIP64 end record and locator, and its central records give sizes and offsets in a ZIP64 extra field (header ID
  `0x0001`, values in the order size, compressed size, local header offset). :proven

## Compression methods

| Method | Meaning | Entries | Confidence |
|---|---|---|---|
| 0 | stored | 1,517 | :proven |
| 8 | raw DEFLATE | 371,516 | :proven |
| 22 | encrypted: a TFIT container whose plaintext is raw DEFLATE | 29,250, in 1,085 archives | :proven |

No entry uses method 21, which ForzaTechStudio describes as XMemCompress LZX. :proven Its description of the method
itself is :sourced[ForzaTechStudio (create-zip.md)].

## Method 22

A method-22 entry's stored bytes are exactly one [TFIT container](/engines/forzatech/archives/encrypted-files/) with
0x200-byte blocks: its compressed size is 36 + 528 × N for N blocks on every such entry. :proven The container's
plaintext is a raw DEFLATE stream that inflates to the entry's stated size, and the CRC-32 the zip records is that of
the inflated bytes, never 0. :proven

Every method-22 entry of the install authenticates under the `General` usage's MAC key, every block's MAC matches, and
its plaintext inflates to exactly the entry's size with the stated CRC-32. :proven

| Where | Encrypted entries |
|---|---|
| `media\Audio\EngineSynth` | 27,603 |
| the zips directly in `media` (`Rendering.zip` holds 67, all XML) | 1,052 |
| `media\Stripped` | 595 |

:proven
