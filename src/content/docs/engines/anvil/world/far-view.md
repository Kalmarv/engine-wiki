---
title: "LongRange and FarFake cells"
description: "Distant object proxies, Morton cell names and far ground."
games: ["riders-republic"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "primase worlds/anvil (placements.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/placements.rs
---

LongRange lists distant proxies and ordinary objects; its name does not classify every Entity as a far stand-in. FarFake cells contain merged object proxies layered over terrain. Distant ground instead uses coarser terrain nodes. :observed

All 1,024 FarFake cell numbers use Morton order on a 32 × 32 grid of 512 m cells: x occupies even interleaved bits, y odd bits. Centers are `(-8192 + 512x + 256, -8192 + 512y + 256)`, checked against every stored translation. This differs from streaming-grid row-major record order. :proven

The second number in FarFake names (`Cell_<m>`) is a running identifier rather than that spatial code. :observed

| Layer | Storage / evidence | Confidence |
|---|---|---|
| FarFake | Proxy Mesh, ObjectAtlas material; campus-cell geometry has buildings and bare gaps | :observed |
| NearFake | Stub-like cells; complete runtime role unresolved | :unknown |
| Far trees | Instanced low-detail meshes and Impostor resources | :observed |
| FakeForest | Merged forest layer distinct from terrain and individual tree instances | :observed |
| Far ground | Coarser terrain-node height rasters | :observed |
| Far water | Fake-water components with world-space half-float positions | :observed |

AutoFakeOrchestratorComponent (`0xD4B44556`) stores index spans related to the following Visual. Its span grammar reaches the next component on 4,052 measured bodies. MeshInstanceData's IsFake and FakeMeshIndex correlate with cell proxies. :observed

The interpretation that a loaded near object hides its own spans in the merged cell fits these fields, but target-to-span mapping and live behavior are not established. :inferred

Projected triangle area averages only 8.3% of cell area in 23 campus-neighborhood cells and 6.8% in 29 Area 52-neighborhood cells, contradicting continuous-ground interpretation. :observed

:::open[When do FarFake spans draw or disappear?]
Draw distance, near-object mapping and suppression against terrain remain unresolved. Morton numbering is established independently. :unknown
:::
