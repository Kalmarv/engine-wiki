---
title: XNB containers
description: "The XNA 4.0 content file as MonoGame games ship it: the header, the type-reader table, the primary object, the built-in readers, and the readers STUNTBOOST adds."
games: [stuntboost]
sources:
  - title: MonoGame content pipeline
    url: https://github.com/MonoGame/MonoGame
    note: ContentReader, ContentTypeReaderManager, Texture2DReader, EffectReader
  - title: MonoGame ContentManager
    url: https://github.com/MonoGame/MonoGame/blob/develop/MonoGame.Framework/Content/ContentManager.cs
    note: the header and the compression flags
implementations:
  - name: monogame-formats (xnb.rs)
    url: https://github.com/Kalmarv/monogame-formats/blob/main/src/xnb.rs
---

An **XNB** is the compiled form of one content asset in games built on XNA 4.0, MonoGame or FNA. The file names the readers
that deserialize it and then holds one object (the *primary object*) written by the first of them. STUNTBOOST (a .NET 8 game on
BytingGames' fork of MonoGame 3.8.1, DesktopGL) ships all its content this way. :observed{games="stuntboost"}

## Header and reader table

```layout
title: XNB header
size: 10
games: [stuntboost]
note: "Little-endian. After the 10-byte header come the type-reader table, the shared-resource count and the primary object."
fields:
  - {at: 0, size: 3, type: "char[3]", name: magic, value: "XNB", level: proven}
  - {at: 3, size: 1, type: u8, name: target platform, level: proven, note: "`d` (DesktopGL) in 1,872 files; `w` (Windows) in one font"}
  - {at: 4, size: 1, type: u8, name: version, value: "5", level: proven, note: "XNA 4.0; MonoGame writes the same"}
  - {at: 5, size: 1, type: u8, name: flags, level: proven, note: "0x01 HiDef profile (the `w` font only); 0x40 LZ4-compressed and 0x80 LZX-compressed are documented by MonoGame and occur in no file"}
  - {at: 6, size: 4, type: u32, name: file size, level: proven, note: "the length of the whole file"}
```

After the header:

| Part | Content | Confidence |
|---|---|---|
| reader count | 7-bit encoded integer | :proven{games="stuntboost"} |
| per reader | a 7-bit length-prefixed UTF-8 type name (assembly-qualified, `Microsoft.Xna.Framework.Content.StringReader, MonoGame.Framework`) and an `i32` reader version | :proven{games="stuntboost"} |
| shared resource count | 7-bit encoded integer | :proven{games="stuntboost"} |
| primary object | a 7-bit type id (0 null, otherwise 1 + the index of its reader) and the bytes that reader wrote | :proven{games="stuntboost"} |

A 7-bit encoded integer is the .NET `BinaryWriter` form: seven bits per byte, low group first, the high bit set while more
follow. A 7-bit length-prefixed string is that length then the UTF-8 bytes. :sourced[MonoGame content pipeline] A compressed file
(flags 0x40 or 0x80) carries a decompressed size and a compressed body; none of the 1,873 files of STUNTBOOST's `Content` is
compressed. :proven{games="stuntboost"}

STUNTBOOST's `Content` holds 1,873 `.xnb` files, 4,953,823,117 bytes. All have version 5 and a stated size equal to the file's;
1,872 are for platform `d` and flags 0, one (`Fonts/Tiny.xnb`) for platform `w` with the HiDef flag. :proven{games="stuntboost"}

## Readers

A reader is a .NET type. The primary object's bytes are whatever its reader wrote, so reading a file means knowing its reader.

| Reader (first reader of the file) | Files | Object | Confidence |
|---|---|---|---|
| `BytingPipeline.QoiReader` | 576 | an image: an `i32` byte count and a QOI file | :proven{games="stuntboost"} |
| `Microsoft.Xna.Framework.Content.Texture2DReader` | 401 | a texture, see [XNB textures](/engines/monogame/textures/xnb-textures/) | :proven{games="stuntboost"} |
| `Microsoft.Xna.Framework.Content.ArrayReader<System.Byte>` | 245 | `i32` count and the bytes | :proven{games="stuntboost"} |
| `BytingPipeline.GLTFReader` | 189 | a glTF 2.0 JSON document: a 7-bit length-prefixed UTF-8 string | :proven{games="stuntboost"} |
| `SE.Pipeline.CollisionModelReader` | 159 | a level part's collision, see [collision](/engines/monogame/collision/collision-model/) | :proven{games="stuntboost"} |
| `Microsoft.Xna.Framework.Content.ReflectiveReader<SE.Pipeline.ShortcutContent>` | 159 | a level part's shortcuts | :proven{games="stuntboost"} |
| `Microsoft.Xna.Framework.Content.StringReader` | 94 | a 7-bit length-prefixed UTF-8 string | :proven{games="stuntboost"} |
| `Microsoft.Xna.Framework.Content.SpriteFontReader` | 25 | a sprite font | :proven{games="stuntboost"} |
| `Microsoft.Xna.Framework.Content.EffectReader` | 18 | a compiled effect, see [MGFX](/engines/monogame/shaders/mgfx-effects/) | :proven{games="stuntboost"} |
| `BytingPipeline.AnimationReader` | 7 | an animation | :proven{games="stuntboost"} |

The counts add up to 1,873. :proven{games="stuntboost"} `QoiReader`, `GLTFReader`, `AnimationReader`,
`SE.Pipeline.CollisionModelReader` and `ShortcutContent` belong to the game's own libraries (`BytingPipeline`, `SE.Pipeline`,
BytingGames' MonoGame fork); their layouts are described where their data is used. :observed{games="stuntboost"}

A glTF is split across three kinds of file: the document (`GLTFReader`), its buffer (`<name>.bin.xnb`, an `ArrayReader<Byte>`
with the glTF buffer's bytes) and each image (`QoiReader`, or `Texture2DReader` for textures the game draws itself). Images
named `.png` in the glTF are the `.xnb` file of the same name. :observed{games="stuntboost"}

## Content folders

`Content/Models/Export` (751 files) and `Content/Models/Resources` (509) hold models, levels and their bakes; `Content/Textures`
holds backgrounds (185), achievements (142), UI (131), controls (53), buttons (14), world textures (13), playtesting (11) and HUD
(9) textures; `Content/Effects/D3` has 10 effects and `D2` 8; `Content/Fonts` has sprite fonts, `Content/Audio` the sounds, and
`Content/Loca.loca` the localization. :observed{games="stuntboost"}

:::open[The fork's reader versions]
The version numbers the type-reader table stores for the game's own readers are as written by the fork's pipeline; whether
upstream MonoGame 3.8.1 reads these files unchanged is not established.
:::
