---
title: Asset manifests (AssetManifest.xml)
description: The XML manifests that map Forza Horizon 6's hashed shader and material names back to their sources and list the Tokyo track's textures, models and instances, their four copies, attributes and the rules that tie them to bin.zip, the swatch path hash and the hand-placed instance file.
implementations:
  - name: forzatech-formats (asset_manifest module)
    url: https://github.com/Kalmarv/forzatech-formats
---

An `AssetManifest.xml` lists, for each shader and material, the name it is stored under and the source it was built from,
and in some manifests the textures and models too. The track's
`bin.zip` holds the shaders and materials under hashed names (`_0xNNNNNNNN`), and the manifest is what maps those names
back to source paths; the loose manifest beside the track's chunks lists the textures, models and instances that the
[hand-placed instance file](/engines/forzatech/world/pvs-ribbon/) refers to by number. :proven

This page describes Steam build 25588841. Each statement marked :proven held on every instance of the install: the four
manifests below, and every entry of the three `bin.zip` archives that carry one. :proven

## The four manifests

| Manifest | Shaders | Materials | Textures | Models | Instances |
|---|---|---|---|---|---|
| `Tracks\Brio\bin.zip` | 46 | 419 | 0 | 0 | 0 |
| `Tracks\homespace02\bin.zip` | 1 | 2 | 6 | 1 | 1 |
| `Stripped\gs\bin.zip` | 31 | 68 | 0 | 0 | 0 |
| `Tracks\Brio\AssetManifest.xml`, loose beside the GeoChunks | 48 | 0 | 48,733 | 134,330 | 593,706 |

All four read whole with a reader that refuses any element, attribute or text this page does not describe. :proven

The files are UTF-8 with a byte-order mark and the declaration `<?xml version="1.0" encoding="utf-8"?>`. :proven The
root element is `AssetManifest`. Its children are one container element per kind, in this order: `Shaders`, then
`Materials` (both present in every manifest), then `Textures` and `Models` in the manifests that have them. :proven

## Shaders and materials

A `Shader` or `Material` element has exactly two attributes, `Name` and `Source`. :proven `Name` is the name the shader
or material is stored under (below); `Source` is its source path, relative to the media folder, and a material's ends in
`.material` and a shader's in `.shader`. :observed

In the loose manifest the `Source` of a shader is an absolute path on the build machine instead. :proven

### Names are the zip entry names

In a `bin.zip` manifest, each `Name` is the name of a zip entry with backslashes for the slashes, except for ASCII case:
the `homespace02` archive writes its folder `Materials/` where its manifest writes `materials\`. Every
`materials/*.materialbin` entry and every `shaders/<folder>/*.shaderbin` entry of the archive is named by a
manifest `Name`, in all three `bin.zip` archives. :proven

A shader entry is `shaders\_0xNN\<family>.shaderbin`, stored beside the family's compiled permutation files (`.pcdxil`
with `.pso`, `.vso` and `.lso`); in `Stripped\gs` the families also have `<family>.shaderbin.xml` files, which are not
read. :observed The family container is on [Shader containers](/engines/forzatech/shaders/shaderbin/).

### Season folders

In each `bin.zip`, the `materials\spring\`, `materials\autumn\` and `materials\winter\` folders hold exactly the entry
names of the base `materials\` folder, no more and no fewer. :proven The manifest lists only the base folder; the three
season folders are not named in it. :proven How the season folders are selected is on [Seasons](/engines/forzatech/world/seasons/).

### Resolving a material chain

A model's material instance names its parent material by the source's game path,
`Game:\Media\<Source less .material>.materialbin`. To find the stored entry, look the `Source` up in the manifest and
take its `Name`. :observed[materials of one Shibuya area; not a census]

A material names its shader with the family once more as a folder: the shader whose `Source` is
`<folder>\<family>.shader` is named `Game:\Media\<folder>\<family>\<family>.shaderbin`. :proven[every shader path the
materials of the three `bin.zip` archives give, 1,956 references counting each season folder's copy] The paths that
match no manifest's shader are all under `_library\shaderspg` (28 of the 1,956), whose families are not in any
`bin.zip`. :proven The chain itself is on [Materials](/engines/forzatech/materials/materialbin/).

## Textures

A `Texture` element is one of two shapes, by manifest.

**The loose manifest** has three attributes: `Source` (the texture's source, ending `.swatch`), `SourceHash` and
`PVSTextureIndex`. `PVSTextureIndex` counts 0 to 48,732 in file order, and 48,733 is the number of texture descriptors of
the Tokyo instance file `brio_00.pvs`. :proven

**The `bin.zip` manifest** (`homespace02`, 6 textures) has these attributes: `Name`
(`<name>_<guid>_quality1.pb`), `Source`, `Limited`, `AtlasIndex`, `AtlasX`, `AtlasY`, `AtlasWidth`, `AtlasHeight`,
`QualityLevels`, `Width`, `Height`, `Depth`, `LightMapType`, `LargeTextureDim`, `MipReduce`, `OriginalWidth`,
`OriginalHeight`, `OriginalDepth`, `Compression` and `SourceHash`. :observed[the 6 textures of `homespace02`]
`Compression` is `Bc7`, `UnsignedBc5` or `R8G8B8A8` on those six. :observed Beyond their names, what the atlas, limited,
quality, light-map, large-texture and mip-reduction attributes mean is not established. :unknown

### SourceHash

`SourceHash` is the CRC-32 of the lower-case game path `game:\media\<Source less .swatch>.swatchbin`, the same path hash
that a material's texture parameter names a texture by
([Texture path hash](/engines/forzatech/materials/materialbin/#texture-path-hash),
[Swatch textures](/engines/forzatech/textures/pb-swatch/)). It holds on every texture of the install's manifests: the
48,733 loose and the 6 of `homespace02`. :proven

## Models and instances

The loose manifest has 134,330 `Model` elements. A `Model` is named `brioout.NNNNN.modelbin` and holds one `Mesh`
(attributes `Name` and `Source`, a `.max` scene) and zero or more `Instance` elements. :proven

- The numbers `NNNNN` of the names are the model numbers of `brio_00.pvs`, 0 to 134,329, each exactly once. The models
  are not in numeric order in the file; 85,324 stand at their own position. :proven
- An `Instance` has `Id`, `Ribbon`, `Index` and sometimes `IsLone`. `Id` is a GUID: the 593,706 instances carry 127,920
  distinct ones, so a GUID is shared by many instances. :proven
- `Index` is a LOD row of `brio_00.pvs` whose model is the number of the model holding the instance. Every one of the
  593,706 LOD rows of the file is named by exactly one `Instance`. :proven
- 4,090 models have no `Instance`. :proven
- `Ribbon` is 0 on every instance. `IsLone` is absent from the loose file; the one `Instance` of `homespace02` has
  `IsLone="0"`, and its model carries `MaterialKeys="Material__26, Material__28"`. :observed What `Ribbon` and `IsLone`
  select is not established. :unknown

:::open[What do the Ribbon and IsLone attributes of an Instance select?]
`Ribbon` is 0 on all 593,706 instances of the loose manifest and `IsLone` appears on one instance of `homespace02`
only; the manifests give no value to compare.
:::

## The names in `brio_00.pvs`

The hand-placed instance file names its 46 shaders and 419 materials as
`game:\media\tracks\brio\bin\<Name of the bin.zip manifest>`; `bin\` there stands for the `bin.zip` archive. This holds on
all 465 of 465 names. :proven The file's table is on [Hand-placed instances](/engines/forzatech/world/pvs-ribbon/#sections).
