---
title: "Patch forges and resource identity"
description: "Breakpoint data-mod packaging and the boundary with engine mounting."
games: ["riders-republic", "ghost-recon-breakpoint"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
  - title: Breakpoint format reference
    url: https://github.com/dataterminals/grb-modding-knowledgebase
    note: Community documentation and readers.
---

Breakpoint data mods replace or add resource ClassIDs in patch forges read by the normal archive loader. The three common targets are DataPC patch data, DataPC_Resources patch data and DataPC_extra patch data, but the resource id, not that organizational split, supplies identity. :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"}

The community describes no official SDK and relies on AnvilToolkit unpacking and repacking. Extracted filenames use positional numbers; changing such a number does not change embedded ClassID. Replacements preserve an existing ClassID, whereas new resources require distinct identities and references reaching them. :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"}

| Filename behavior | Evidence scope | Confidence |
|---|---|---|
| Arbitrary new base name | No general `*.forge` scan in the analyzed executable | :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |
| Numeric patch suffix | Patch scanner parses suffix number, including numbers above one | :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |
| Backup copies matching the wildcard | Can enter the live patch list | :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |
| Parenthesis in name | Opener truncates at the first `(` in the analyzed code | :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |

The [archive-resolution page](/engines/anvil/runtime/archive-resolution/) distinguishes global from scoped lookup; higher patch priority is not established as a universal rule for all paths. :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"}

:::open[Does Riders Republic expose the same mod-loading route?]
Its base/patch data pairing is observed, but custom forge mounting and live replacement behavior are not established by the offline archive reader. :unknown{games="riders-republic"}
:::
