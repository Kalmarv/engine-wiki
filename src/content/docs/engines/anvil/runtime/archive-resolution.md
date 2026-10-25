---
title: "Archive mounting and resolution"
description: "Patch priority, global and scoped lookups and Riders Republic evidence limits."
games: ["riders-republic", "ghost-recon-breakpoint"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
  - title: Breakpoint format reference
    url: https://github.com/dataterminals/grb-modding-knowledgebase
    note: Community documentation and readers.
implementations:
  - name: "primase worlds/anvil (archive.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/archive.rs
---

Resource references cross forge boundaries by 64-bit identity. Breakpoint's community analysis describes global, set-scoped and index-scoped lookup paths; therefore a single global priority model does not automatically describe every engine read. :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"}

| Mechanism | Breakpoint behavior described for ChangeList 7793716 | Confidence |
|---|---|---|
| Base archive discovery | Composed exact names, including platform, world and graphics variants | :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |
| Patch discovery | Wildcard `*<name>_patch_*.forge`, then parse numeric suffix N | :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |
| Priority | Base zero, patch `1 + N`; highest first | :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |
| Global lookup | First mounted forge holding the id | :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |
| Equal-priority tie | Stable sorting after front insertion favors most recently opened forge | :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |
| Scoped lookup | A forge, attached patches and split siblings can be searched without global priority | :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"} |

These are attributed static-code conclusions. The same source leaves opening order among tied forge families unresolved and distinguishes the code's scan mechanism from validation that every proposed filename loads in game. :sourced[Breakpoint format reference]{games="ghost-recon-breakpoint"}

Riders Republic's USNAT base and patch share 319,678 ids; 447,785 are base-only and 1,099 patch-only. Neither file alone contains the full listed world. The four-file union with patch copies replacing base is consistent with checked dependency closure, but its live priority rule remains inferred. :observed{games="riders-republic"} :inferred{games="riders-republic"}

In 4,109 sampled duplicated ids, equal name-table hashes accompany identical bodies and differing hashes accompany different bodies. That sample supports a content fingerprint, not a proven collision-free equality test. :observed{games="riders-republic"}

:::open[Which lookup path resolves each runtime reference?]
Breakpoint's scoped lookups qualify the global-priority rule. Riders Republic live mounting and patch priority are not independently established. :unknown
:::
