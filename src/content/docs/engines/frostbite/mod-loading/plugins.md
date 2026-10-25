---
title: Luau plugins and Throwdown modes
description: ReSkate 2.1.2 plugin manifests, VM lifetime, permissions, limits and mode state.
games: [skate]
sources:
  - title: ReSkate plugin documentation
    url: https://github.com/Dingo-Shenanigans/docs/tree/main/plugins
  - title: ReSkate plugin host
    url: https://github.com/Dingo-Shenanigans/ReSkate/tree/main/Extension/Plugins
---

ReSkate 2.1.2 prerelease introduces sandboxed Luau plugins. A plugin is an enabled mod folder with
`reskate-plugin.json` beside `manifest.json`, scripts and optional assets. Each plugin has its own VM, globals
and session-long lifetime, rather than a VM per level. :sourced[ReSkate]

## Manifest and discovery

| Field | Meaning | Confidence |
|---|---|---|
| `api` | API version, currently 1; newer versions are refused | :sourced[ReSkate] |
| `entry` | Relative printable-ASCII `.lua`/`.luau` path; module lookup starts in its folder | :sourced[ReSkate] |
| `side` | `client` by default, `server` or `both` | :sourced[ReSkate] |
| `permissions` | Named capabilities; unknown names are refused | :sourced[ReSkate] |
| `domains` | Allowed HTTP hosts | :sourced[ReSkate] |
| `content` | Other mod content made readable through declared access | :sourced[ReSkate] |
| `variants` | Folder/order/displacement metadata | :sourced[ReSkate] |
| `resident` | Bundle roots/shaders retained across replacement by map mods | :sourced[ReSkate] |

The manifest is at most 64 KB and eight levels deep; unknown fields are ignored. Discovery runs every two
seconds. Changed files cause unload/reload once the game window has focus; disabling the mod unloads it.
An unreadable mods.json loads no plugins. :sourced[ReSkate]

The scan refuses more than 20,000 files, executable/script-launcher extensions such as DLL, EXE, JS and PS1,
and files beginning `MZ`. The sandbox has no unrestricted `io`, `os.execute`, dynamic loader or bytecode loading;
module/package reads remain inside the package. :sourced[ReSkate]

`level_loaded`/`level_unloading` events describe transitions. A plugin loaded after a level is active does not
receive a retroactive level_loaded event; `level.current()` supplies the current name. Plugin-created entities
are removed at level change even though the VM survives. :sourced[ReSkate]

## Capabilities and budgets

The API exposes skater telemetry and controls, physics tuning, animation, camera, drawing, menus, package data,
storage, audio, session messaging and native Throwdown UI. `entities.set` places only already-loaded blueprints;
it is local to the client. Raycasts see streamed collision near the player. :sourced[ReSkate]

No API in the inspected 2.1.2 registration tables loads arbitrary meshes, textures, shaders or material parameters,
reads raw game memory, enumerates level objects, creates trigger volumes, reads ToD or directly sets lights.
`world.set_time` changes a supported preset; it does not expose a general environment-editing interface.
:sourced[ReSkate]

| Budget | Limit | Confidence |
|---|---|---|
| Heap | 64 MB per VM | :sourced[ReSkate] |
| Single call | 50 ms | :sourced[ReSkate] |
| Average work | 2 ms/tick, assessed over three one-second windows | :sourced[ReSkate] |
| Error stop | More than five uncaught errors in ten seconds | :sourced[ReSkate] |
| Logs | 50 lines/s | :sourced[ReSkate] |
| Timers | 1,024 | :sourced[ReSkate] |
| Package read | 16 MB/file | :sourced[ReSkate] |
| Writable files | 1 MB/file, 1,000 files | :sourced[ReSkate] |
| Storage | 1 MB | :sourced[ReSkate] |
| Session message | 4,082 bytes, 16 KB/s per plugin | :sourced[ReSkate] |

A stopped plugin loses its entities, modes, documents, flag and held controls. File change or `plugin on` can
restart it. Plugin-to-plugin exports/events copy JSON rather than sharing VM memory. :sourced[ReSkate]

## Throwdown lifecycle

All plugins share a maximum of 32 registered modes, ordered by the mode's `order`. Only one plugin HUD displays
at a time. UI events precede tick handlers in each tick. :sourced[ReSkate]

| Phase | Input and state | Confidence |
|---|---|---|
| Setup | Mode card emits `open`; plugin publishes setup rows | :sourced[ReSkate] |
| Placing | `setup_confirm` enters native flag placement | :sourced[ReSkate] |
| Waiting | `flag_placed`; waiting card or active HUD required within 15 s | :sourced[ReSkate] |
| Playing | `start`; plugin publishes match/HUD state | :sourced[ReSkate] |
| Results | Results document replaces the remaining HUD | :sourced[ReSkate] |
| Leave | Plugin stops publishing and calls `flag.leave()`; that call does not emit `flag_left` back to itself | :sourced[ReSkate] |

Countdown, clock, card, callout, banner and world markers use stock native widgets. Other themed slots resolve
native bundled assets named `UI/ReSkate/Throwdowns/HUD_<theme>_<part>_Widget`; missing widgets leave their slots
empty. An overlay draw handler can instead draw package images and world labels without those bundles.
:sourced[ReSkate]

A `both` plugin has separate client and authority VMs on a lobby host. Dedicated-server plugins live in
`Plugins` beside ReSkateServer.exe and have no local skater/draw API. Session messages identify senders; only
`from.server` identifies authority. The server receives reported trick scores through client messages rather
than independently observing skater tricks. :sourced[ReSkate]

During a Throwdown, wipeout, animation.play and tricks.record_as are refused; velocity/cruise controls require
stock competition physics. Native UI presence does not remove these control restrictions. :sourced[ReSkate]
