---
title: Ocean and canal surfaces
description: San Van's water geometry, material sharing and physics surface identity.
games: [skate]
---

San Van's measured water consists of one static ocean plane, 19,084.8 m square at approximately y=0 in
`bam_waterterrain_sub`, plus four canal meshes. Two nine-parameter water materials share five textures.
The measured water physics material is `0xf007a0`. :observed

Studio exposes an `ocean` material domain and `collision_mode: water`; its compiled water section meshes can
remain resident in the level root. Visible water geometry and the water collision response are distinct data.
:observed

Studio places the ocean surface object (`t_0_0`) at the level root: in a map compiled in tiles with ocean water, the
level root bundle of every tile holds a ShaderBlockDepot with a single key, the water object's. :observed

:::open[What does the stock water shader compute?]
The surface and binding census does not establish wave evaluation, depth reconstruction, reflection or foam
equations. :unknown
:::
