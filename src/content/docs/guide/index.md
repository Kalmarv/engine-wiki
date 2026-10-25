---
title: How this wiki works
description: What the wiki is, how it is organised, and how to read a page.
sidebar:
  order: 1
---

This wiki describes how games store and process their data: archives and file formats, meshes, materials and shaders,
worlds and streaming, collision, animation, and the runtime that consumes all of it. It is written so that a person
can learn an engine from it and a program can rely on it.

## Organised by engine, then by system

Games that share an engine share most of their formats, and differ in places. So the wiki is organised the way an
engine team's own documentation would be: by **engine**, then by **system** (archives, geometry, materials, ...), with
the differences between games written where they occur instead of on separate per-game pages.

| Section | What it holds |
|---|---|
| **Engines** | One section per engine. Its overview says which games run on it and what differs between them; its systems hold the pages. |
| **Games** | One short hub per game: the build our observations come from, where its data lives, what is special about it, and links into its engine. |
| **Concepts** | Ideas that cut across engines (levels of detail, layered materials, tile grids), each linking to how every engine does it. |
| **Methods** | How things become known: the checks behind each confidence level. |
| **Coverage** | Computed from every page: what is known per engine, system and game, how surely, and what is open. |

The systems, in reading order, are fixed for every engine so that pages land in the same place everywhere:

| System | Covers |
|---|---|
| Archives and files | Containers, compression, encryption, file naming and hashing |
| Data model | Resource headers, type and class registries, references, entities and components |
| World and streaming | Placement, cells and tiles, streaming, world state and layers |
| Geometry | Meshes, vertex formats, levels of detail, skinning |
| Materials | Material definitions, templates, parameters and texture bindings |
| Shaders | Compiled shader containers, bindings and what the shaders compute |
| Textures | Texture containers, pixel formats, mip storage |
| Lighting and sky | Lights, global illumination, sky, atmosphere, time of day |
| Terrain | Height fields, terrain materials and their blending |
| Vegetation | Grass, trees, SpeedTree and wind |
| Water | Oceans, rivers, lakes and their surfaces |
| Effects and decals | Particles, decals and other effect entities |
| Collision and physics | Collision shapes, physics materials and surfaces |
| Animation | Skeletons, clips, tracks and timing |
| Gameplay data | Params, scripts, events and the game's own rules |
| Runtime and limits | What the running engine does with the data, its limits, and known crashes |
| Mod loading | How mods are loaded, merged and packaged |

## Reading a page

Under the title, a page shows its engine, its system and the games it applies to. Statements carry a badge saying how
surely they are known: :proven :observed :sourced :inferred :unknown. Hover a badge for its meaning, or read
[Confidence](/guide/confidence/). A badge can be limited to some games (:observed{games="sekiro"}) and a statement
can say which games it applies to: :only[elden-ring] :since[sekiro] :not[sekiro].

Byte layouts are drawn as a grid of 16 bytes a row, each field coloured by how surely its meaning is known, with a
table of the same fields below. Dotted bytes are inside the structure but not described at all.

Open questions are boxed; the [coverage page](/coverage/#open) lists them all.

## Writing for the wiki

Anyone adding to the wiki, person or agent, follows [Writing pages](/guide/writing/).
