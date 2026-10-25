---
title: Mesh LOD levels
description: Five-level selectors, dependency-backed mesh references and multiple LOD ranges inside a mesh.
games: [riders-republic]
implementations:
  - name: primase Anvil LOD reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/lod.rs
---

A **LODSelector** holds five descriptors selecting meshes as viewing distance changes. Grass can instead store three LOD ranges inside one mesh, so a primitive range is not always a different surface material. :observed

Every one of the 48,862 stored selector entries parses to the body's exact end with variable-length descriptors. Counts include base and patch copies. :proven

```layout
title: LODDescriptor
size: variable
note: Little-endian; 48 + 4n bytes, including object identity and class.
fields:
  - {at: 0, size: 8, type: u64, name: object identity, level: observed}
  - {at: 8, size: 4, type: u32, name: LODDescriptor class, value: "0xA360319A", level: proven}
  - {at: 12, size: 10, type: reference, name: mesh reference, level: proven}
  - {at: 22, size: 4, type: f32, name: SwitchDistance, level: observed}
  - {at: 26, size: 4, type: f32, name: TransitionZoneSize, level: observed}
  - {at: 30, size: 4, type: f32, name: FadeTimeMultiplier, level: observed}
  - {at: 34, size: 5, type: bytes, name: stored flags, level: unknown, note: "retained; meanings not established here"}
  - {at: 39, size: 4, type: u32, name: stored word, level: unknown, note: "retained without a runtime interpretation"}
  - {at: 43, size: 4, type: u32, name: list count n, level: proven}
  - {at: 47, size: "4n", type: "u32[]", name: stored list, level: unknown, note: "length established; element meaning unresolved"}
  - {at: "47 + 4n", size: 1, type: u8, name: final byte, level: unknown, note: "retained without interpretation"}
```

The body starts with byte 1, a u32 and seven bytes, then the five descriptors. It ends with a dependency count d, d pairs of zero byte and u64 identity, d again, d u32 values and six bytes. :proven[all stored selectors]

For 24,430 selectors resolved by identity with patch copies replacing base copies, the dependency count equals the number of leading descriptors without a direct mesh reference. Each of the 19,623 dependencies resolves to a mesh ending `_LODi` for its level i. A null direct reference therefore does not establish an absent LOD. :proven[identity-resolved selector census]

All 46 grass models associate three mesh ranges with the same material and carry a separate model LOD table. Typical stored switch-distance triples are 5/10/20, 10/20/40 and 20/40/80; interpreting these as metres follows their field names and values. :observed[46 models] :inferred[distance units]

:::open[How do intra-mesh ranges and selector descriptors interact?]
The stored partitions and grass distance tables are readable; a universal runtime rule for selecting ranges within every mesh family is not established. :unknown
:::
