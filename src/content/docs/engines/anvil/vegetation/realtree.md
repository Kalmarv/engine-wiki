---
title: "RealTree meshes"
description: "The procedural trees of Shaun White Skateboarding: the mesh blob, its nodes, branches and leaves, and the growth event."
games: ["shaun-white-skateboarding"]
---

The trees of Shaun White Skateboarding are not ordinary meshes. A `RealTreeMesh` object (`0xCD0D35E6`, the CRC-32 of its name) holds a skeleton of nodes, branches and leaf records that the vertex shader expands into trunk, branches and leaf cards. The game's executable embeds the RealTreeLib code of Ubisoft's technology group, whose source file names (`RTRenderDataNode.cpp`, `RTSimulation.cpp`, `RTSkeletal.cpp`, `RTRegenSimple.h`, `RTDestruction.cpp`) and an `ActivateRealTreeGrowthEvent` appear in its strings. :observed{games="shaun-white-skateboarding"}

Level 01 places 30 tree meshes through Visual components, and 29 `RealTreeComponent` objects are alive in the running level. In the grey Ministry state 36 entities carry both a tree mesh and a sibling ordinary mesh, a metal pole with a bare crown. :observed[level 01]

## The blob

The body of a tree mesh begins with the marker bytes `30 7E 5E 5E`, a size, the words 154 and 12345, and the blob is the last `size` bytes of the body. Pointers inside the blob are stored as `0x72300000` plus an offset and are relocated in place by the loader (`0xA38870` of the recorded build, which takes a header of 0x45 integers, an auxiliary block and the blob). :observed

The tree structure is at blob offset `0xF4`. :observed

```layout
title: "Tree structure (at blob offset 0xF4)"
size: variable
games: [shaun-white-skateboarding]
note: "Little-endian. Offsets relative to the tree structure; counts N, M and L are the node, branch and leaf counts."
fields:
  - {"at": 16, "size": 4, "type": "u32", "name": "node count N", "level": "observed"}
  - {"at": 20, "size": 4, "type": "pointer", "name": "nodes A", "level": "observed", "note": "N records of 0x50 bytes"}
  - {"at": 24, "size": 4, "type": "pointer", "name": "backup table", "level": "observed"}
  - {"at": 28, "size": 4, "type": "u32", "name": "branch count M", "level": "observed", "note": "the trunk is the first branch"}
  - {"at": 32, "size": 4, "type": "pointer", "name": "branches", "level": "observed", "note": "M records of 0x2C bytes"}
  - {"at": 36, "size": 4, "type": "pointer", "name": "backup table", "level": "observed"}
  - {"at": 40, "size": 4, "type": "u32", "name": "leaf count L", "level": "observed"}
  - {"at": 44, "size": 4, "type": "pointer", "name": "leaves C", "level": "observed", "note": "L records of 0x5C bytes"}
```

The blob header from offset `0x350` holds the pointers of four tables (F, G, R and E). A node's radius is the entry `R[k − 1]`; the last node of a branch is a sentinel and is dropped. The branch and trunk vertex builders are at `0xA621B0` (vertices) and `0xA63790` (indices) and the vertex declarations at `0xA38EE0`. :observed

The last node record (branch 65535, a dummy) of the thin and the urban tree trunks holds `(−0.004, 0.004, 0.23 or 0.41, the first node's z)`; its meaning is not established. The trunks of the thin and urban trees start at z 2.6 and 3.5 m above the entity origin, so the trunk begins above the ground (the rule that joins it to the ground is not established), and the small urban tree has a three-node root stub below the ground as branch 0. :observed[level 01]

## Leaves

```layout
title: "Leaf record"
size: 92
games: [shaun-white-skateboarding]
note: "Little-endian. The 418 leaves of level 01 give 394 cards; 24 are sentinel or clamped records and are dropped."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "kind", "level": "observed", "note": "selects an entry of the kind table: runs of three words 0x3F008081 at blob offsets 0x300 to 0x4A0"}
  - {"at": 3, "size": 3, "type": "u8[3]", "name": "UV corner permutation", "level": "observed"}
  - {"at": 32, "size": 4, "type": "f32", "name": "size", "level": "observed"}
  - {"at": 40, "size": 4, "type": "f32", "name": "scale", "level": "observed"}
  - {"at": 44, "size": 48, "type": "f32[3][4]", "name": "vertex vectors", "level": "observed", "note": "vertex = leaf centre + size × vector"}
```

A leaf with code 100 or more has three UV corners and a parallelogram; a lower code has four. The four points of a card are coplanar (median volume 0.001 to 0.003). In the small urban tree 91% of the cards are thin (minor over major axis under 0.15) against 15% for the thin tree and 2% for the urban tree. :observed[level 01]

The leaf shading normal is the normalised direction from a density sphere's centre to the leaf, with z raised to at least 0.6 and renormalised, the same on both faces; the colour is the diffuse colour times a light attenuation and the composite lighting. The blob header word at `0x1D4` holds a centre and radius that matches the leaf centroid to within 0.07 to 0.55 m on three level-01 trees and one palm, and 1.5 m on a cherry tree; it is read as the density sphere. :inferred[from the fit to leaf centroids]

:::open[How is the far crown generated?]
The vertex shader scales a leaf by `LeavesEquations[scaleOut]` (ring distances of 4, 8, 15, 20, 25 and 100 m at blob `0x314` to `0x328`) and blends toward camera-facing cards except for scale codes above 99. 149 of 150 leaves of one tree carry code 100 and 141 have ring byte 4, so by this rule they would shrink to zero by 25 m, yet the game shows a dense crown at 37 m. The far-view leaf generation is not in the blob and is not decoded. :unknown
:::

## Growth

The grey and the restored state use the same tree, and the crowns appear when the game raises an `ActivateRealTreeGrowthEvent` (`0xCB394D43`, factory at `0x10DBC50`, vtable `0x196ED44`, 16 bytes). The `RealTreeComponent` (`0x7338CDF5`, runtime vtable `0x1964690`) installs a listener at offset `0x3C` (vtable `0x19647D8`, owner pointer at `0x40`, callback at `0x44`, the receiver `0xFDE7B0`). If the component's loaded-tree pointer at `0x4C` is non-null the receiver sets the byte at `0x6D` to 1 and the float at `0x1C` to 1.0 and does nothing else. The component's update (`0xFE7958`) tests the byte, calls the tree manager (global at `0x1C71AB8`, function `0xA3D1C0`) with the tree and 1.0, and clears the byte. :observed

Setting those two fields on all 29 components of level 01 by hand, which has the receiver's effect, made all 29 read 1.0 afterwards, the game consumed every request, and grown branch and leaf canopies appeared at the same camera position where the bare trees had been. :observed[29 loaded components]

The tree materials store the influence hide mode `HideNone`, so neither the sibling metal mesh nor the tree is discarded by the influence kill; see [influence](/engines/anvil/materials/influence/). :observed
