---
title: Nodes, references and collector idents
description: "How GBX nodes refer to one another: node indices, external files, nodes stored in place, the deprecated node lists, the classes that read no chunks, and the collector idents that name block models."
games: [tmnf]
sources:
  - title: GBX.NET
    url: https://github.com/BigBang1112/gbx-net
    note: version 2.5.0; class and chunk tables, its node-reference readers and its pack-file extraction
---

A GBX node points at other nodes by number. Most references are node indices into the file's own node table or into the
header's reference table, which lists other files; a few classes keep a child node in place instead, and a few lists carry a
version word in front. Block models are found by name, and that name is the collector ident of the model file, not the
file's name. :observed[the install's packs and maps, read with a strict reader and compared with GBX.NET]

## Node references

A node reference is an index. It names a node of the file's node table or an entry of the header's reference table, an
external file; a reference to an external file is resolved without reading a node there. :sourced[GBX.NET]

TMUnlimiter maps use this for files: the node indices named by their material-model references, replacement textures and
image bitmap pairs are external files, not nodes, and none is named twice in a map
([TMUnlimiter data](/engines/gamebox/world/tmunlimiter/)). :observed[the 61 TMUnlimiter maps of 100 downloaded maps]

### Nodes stored in place

Some classes keep a child node in place: the child has neither a class ID nor a node index in front of it, and is just
its chunks up to the end marker `0xFACADE01`. :observed[every pack file of the install that holds them, read to the end]

| Parent class and chunk | Child stored in place | Confidence |
|---|---|---|
| `CSceneMobil` `0x0A011005` | `CHmsItem` | :observed |
| `CMotionPlayer` `0x08034004` | `CMotionCmdBase` | :observed |
| `CSceneSoundSource` `0x0A00E000` | `CHmsSoundSource` | :observed |
| `CSceneLight` `0x0A00B000` | `CHmsLight` | :observed |
| `CPlugVisualIndexed` `0x0906A001` | `CPlugIndexBuffer` (after a boolean) | :observed |

GBX.NET calls these direct nodes and counts them among a file's nodes, though no node table lists them. :sourced[GBX.NET]

### Deprecated node lists

Some lists of node references begin with a version word: a `u32` that is 10, then the count and the references.
:observed[every pack file of the install, and the embedded trees of three TMUnlimiter maps]

| Class | Chunk | Confidence |
|---|---|---|
| `CGameCtnCollection` | `0x03033009`, `0x0303301D` | :observed |
| `CPlugDecoratorSolid` (`0x090A3000`) | `0x090A3000`: references to `CPlugDecoratorTree` (`0x090A2000`) nodes | :observed |
| `CPlugTree` | chunk `006`, its children | :observed |

## Classes without chunks

`CPlugFileGen` (`0x0902F000`), a procedural image, reads its own fields in place of a chunk list: there is no `0xFACADE01`
end marker after it. :sourced[GBX.NET] Its version 2 is the only one in the install's packs, where it is stored inline as the
image of a [bitmap](/engines/gamebox/materials/materials/#bitmaps). :observed[the Game/Stadium packs]

## Pack files

A pack file's contents are read through its cipher, and reading a node there also feeds the cipher a "dummy write" of the
node's class's parent ID. The direct nodes above make it too: in the packs, `CSceneMobil`'s `CHmsItem` writes `0x06003000`
28 bytes after the mobil's own `0x0A011000`, an inline `CPlugIndexBuffer` writes `0x0902B000`, and `CSceneLight`'s `CHmsLight`
writes `0x0600B000`. `CPlugFileGen` makes none. :observed[the dummy writes GBX.NET records over the install's packs]

:::open[What is the pack cipher?]
The pack container, its key and how the dummy writes enter the cipher are not described here. The facts above are of the
writes a pack reader must make to stay in step, recorded as GBX.NET makes them.
:::

## Collector idents

A model file's header chunk `0x0301A003` (the collector description) names the model with an ident, and a map names its
blocks by that ident, not by the file's name: `StadiumRoadMainStartLine` is the model in
`StadiumRoadMainStart.TMEDClassic.Gbx`. :observed[the 65 campaign maps] The headers of 2,360 pack files read, their 313
collector descriptions are all version 5, and every one of the 312 compared names the ident its body's model has.
:proven[every collector description of the install's packs] Indexing the models by ident finds a model for every block of the
65 campaign maps. :observed[the 65 campaign maps]

## Decoration audio

`CGameCtnDecorationAudio` chunk `0x03039000` is not empty, though GBX.NET's chunk list has it so. It holds a counted list of
(ident, node reference) sounds and then a counted list of musics, the references being entries of the header's reference
table. :observed[the 2 audio files of the install]

| List | Entries | Confidence |
|---|---|---|
| Sounds (11) | `Ambient`, `RaceVictoryNadeo`, `RaceVictoryGold`, `RaceVictorySilver`, `RaceVictoryBronze`, `RaceVictoryFinish`, `RaceVictoryNewRecord`, `RaceDefeat`, `ZoomEditorToRace`, `ZoomRaceToEditor`, `RaceFigure` | :observed |
| Musics (3) | `MusicRace`, `MusicEditor`, `MusicReplay` | :observed |
