---
title: Mounts, DLC packs and overlays
description: How base images, title updates and DLC content select the live Story and Online files.
games: [gta-v]
sources:
  - title: CodeWalker
    url: https://github.com/dexyfex/CodeWalker
    note: GameFileCache provides a reference mount implementation, including its patchday27ng exception.
implementations:
  - name: primase worlds/gta (archive_set.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/read/archive/archive_set.rs
  - name: primase worlds/gta (mount.rs)
    url: https://github.com/Kalmarv/primase/blob/main/worlds/gta/src/read/mount.rs
---

Mount data selects which copies of files participate in the world. Enumerating every physical archive includes
superseded resources and does not describe a single playable map state. :observed

| Data | Role | Confidence |
|---|---|---|
| `dlclist.xml` | Pack paths in list order | :observed |
| Each pack's `setup2.xml` | Device name, content filename, order, minor order and change-set groups | :observed |
| Pack content XML | Data files, enabled state, overlay flag, change sets and execution conditions | :observed |
| `extrafoldermount.xml` | Additional folder mounts | :observed |
| `extratitleupdatedata.meta` | Device/path title-update mounts | :observed |

PC platform substitutions use `x64`; records tagged for `ps5` or `xbsx` can name files absent from the PC install.
:observed

## Order and state

The mount reconstruction supported by the inspected data starts with `common.rpf`, the `x64*.rpf` base images and
`update/update.rpf`, then orders DLC packs by `order`, `minorOrder` and original list position. Enabled `RPF_FILE`
records and startup change sets determine the mounted archives. :observed

`GROUP_ON_DEMAND` content depends on script requests. `GROUP_MAP` changes describe the Online map transition:
all packs' startup groups precede the map groups, which then run in pack order. Level conditions such as
`$level=` restrict changes to the named level. :observed

This ordering matters for downtown: `mpheist` invalidates Story's `downtown_01_metadata.rpf` and enables `hei_` maps,
while `patchday27ng` carries a later Story overlay. Running each pack's map group immediately after its startup
can reintroduce the Story copy alongside the Online maps. :observed CodeWalker skips `patchday27ng` as an explicit
workaround, so agreement with its selected map is not by itself proof of the game's transition sequence.
:sourced[CodeWalker]

Title-update paths under `update:/dlc_patch/<pack>/` replace pack files. Some packs also have `dlc1.rpf` and other
subarchives containing files absent from the pack's main archive. :observed

## Overlay precedence

The data supports a name-based interpretation of `<overlay value="true"/>`: an overlay copy wins over a plain copy
of the same file name even when the overlay pack mounts earlier. Within the plain class or the overlay class, later
mounts win. This rule is inferred from shipped replacements and archive naming, rather than established by executing
the engine's mount code. :inferred

For example, `patchday21ng` has order 21 but replaces vehicles from `mpchristmas2018`; other overlay archives have
paths with no plain counterpart, so a same-archive-path interpretation alone cannot explain them. :observed

Map entries (`ymap`, `ybn`, `ynv`) participate in the map-archive namespace. Invalidating an archive also removes the
overlays associated with it in the reconstructed active set. :observed

:::open[Does every mount edge case follow the reconstructed precedence?]
The pack data constrains order and replacements, but script-driven on-demand activation and the engine's complete
overlay implementation are not established here. :unknown
:::
