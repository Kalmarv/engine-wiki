---
title: Robomodo RME
description: "Robomodo's in-house engine as Tony Hawk: SHRED ships it on PlayStation 3: PAK archives with sdbm-hashed names, CSTR compression, and the middleware it carries."
sources:
  - title: RPCS3
    url: https://github.com/RPCS3/rpcs3
    note: decrypts the game's executable and script archive; the emulator the data was checked against
  - title: Clienthax Ps3GhidraScripts
    url: https://github.com/Clienthax/Ps3GhidraScripts
    note: the function-descriptor and TOC approach used to analyse the PS3 executable
---

RME is the namespace Robomodo's code uses for its engine: the executable names `RME::Math::Vector4`, `RME::Gfx::FsFx::Silhouette` and `RME::Framework::Component`, a subsystem called `RME File I/O`, and ships
shader sources under `rme\shaders\...`. :observed[strings of the decrypted executable] The name comes from those strings, not from the developer's name. :inferred
A retained continuous-integration path of the Demonware library carries the label `rme-v2.0.0-ci`; that is a workspace name, not a proven shipped engine version. :observed

The wiki records one game on it, [Tony Hawk: SHRED](/games/shred/) (PlayStation 3, 2010). Nothing here is known about earlier or later Robomodo titles or about the engine's lineage. :unknown

Content is stored in big-endian **PAK** archives, 336 of them on the disc, each a flat table of entries whose names are hashed with [sdbm](/engines/rme/archives/pak/#names-and-hashes), many compressed in
[CSTR streams](/engines/rme/archives/cstr/). An asset is often a set of entries that share a name and differ in extension: a level resource is a quartet (`.scp`, `.mlp`, `.mmp`, `.mgp`) and a texture a header and pixels
(`.thp`, `.txp`), with the extension telling the loader which system reads it. :observed

## Middleware

The executable carries these libraries; versions are given where the executable states one. :observed

| Library | Version | How it is known | Confidence |
|---|---|---|---|
| Havok Physics | 7.1.0-r1 | version strings in the executable, and the same string in the header of a sample packfile | :observed |
| Scaleform GFx | 3.0.74 | version string next to `gfxVersion` | :observed |
| Lua | 5.1 | version string, and the chunk header of all 1,278 script files | :proven[all 1,278 script chunks] |
| Wwise | not recovered | `WWISE_ID` in the executable; `BKHD` banks and `AKPK` packages on the disc | :observed |
| Bink | not recovered | Bink strings in the executable; 451 `.bik` videos on the disc | :observed |
| Morpheme | not recovered | a reference to `morphemeSPU.elf`, Robomodo animation task names, and five big-endian rig bundles on the disc ([skinned streams](/engines/rme/geometry/skinned-streams/#binding-matrices-and-the-animation-rigs)) | :observed |
| Demonware | 2.3.2 | source paths retained in the executable | :observed |
| SQLite | 3 | 27 database files on the disc | :observed |

The executable also embeds a Havok physics identification string naming Robomodo and the title (`...Physics.Robomodo_PS3-Xbox360_TonyHawk12`) with the date 2011-10-29. The date is recorded as it is written; it is not shown to be the date of the build. :observed

## What is known and what is not

| Area | State | Confidence |
|---|---|---|
| [Archives](/engines/rme/archives/pak/): PAK v4, CSTR, disc names | complete for the one disc | :proven[all 336 PAKs] |
| [Geometry](/engines/rme/geometry/model-quartets/): rigid meshes, vertex formats, placements, winding, skinned streams | every layout accounted for; tangent frames, tree extras and the skeleton pose not understood | :proven[all 657 quartets] |
| [Materials](/engines/rme/materials/material-banks/) | records decoded; state words and the sampler order not understood | :proven[all 4,102 materials] |
| [Textures](/engines/rme/textures/gcm-textures/) | all formats and volumes decoded | :proven[all 27,446 headers] |
| [Collision](/engines/rme/collision/havok-packfiles/) | triangles, shapes, bodies and surface ids; flag bits not understood | :proven[all 490 files] |
| [World](/engines/rme/world/scp-tables/): nodes, spots, splines, lights, layers | decoded; rails, light meaning and several section types open | :observed |
| [Data model](/engines/rme/data-model/main-db/): MAIN.DB | all tables read; which the engine reads when is not traced | :proven[all 27 databases] |
| [Shaders](/engines/rme/shaders/programs/): Cg containers, fragment microcode, texture-only programs, the fog pass | microcode decoded and checked against an independent disassembler; the material-to-texture-unit binding not traced | :proven[all 765 pixel program files] |
| Animation, audio, scripts, UI | animation reference rigs read; the rest not covered | :unknown |

The figures come from one PlayStation 3 disc, so a count that is proven is proven for that disc. :observed

:::open[What is RME's own version, and where does it come from?]
The only version-like labels in the executable are a Demonware workspace name and a Havok identification string with a date. Nothing ties either to a release of the engine.
:::
