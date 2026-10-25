---
title: Terrain materials and splatting
description: Material banks, procedural sets, raster-driven blending, detail normals, altitude ramps and steep surfaces.
games: [riders-republic]
implementations:
  - name: primase Anvil terrain material reader
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/terrain_material.rs
---

Terrain colour combines a material-ID raster with repeating detail images, altitude ramps, baked far colour and occlusion. TerrainMaterialBank supplies the ordered material list indexed by block 2 of each node. :observed[bank, node loader and shaders]

The USNAT bank has nine detail TextureSets, 106 material references representing 105 distinct identities, five region objects and one displacement TextureMap. Its entire body is byte 1 followed by three counted reference arrays and one final reference. :proven[complete bank body]

```layout
title: TerrainMaterial, selected established fields
size: 202
note: Body offsets, without resource identity/class prefix. Other fields are not fully described here.
fields:
  - {at: 0, size: 2, type: bytes, name: stored prefix, level: unknown, note: "retained"}
  - {at: 2, size: 4, type: f32, name: detail UV scale, level: observed, note: "matches runtime material record +44"}
  - {at: 6, size: 4, type: f32, name: stored scale-like value, level: unknown, note: "1 to 200; not the detail repeat read by the pixel shader"}
  - {at: 10, size: 7, type: bytes, name: intervening fields, level: unknown, note: "includes stored flags; bytes 15 and 16 are zero in the reader profile"}
  - {at: 17, size: 8, type: u64, name: detail TextureSet identity, level: observed}
  - {at: 162, size: 4, type: f32, name: Roughness, level: observed}
  - {at: 166, size: 4, type: f32, name: SpecularOcclusion, level: observed}
  - {at: 180, size: 10, type: reference, name: CollisionMaterial, level: observed}
  - {at: 198, size: 4, type: u32, name: bank position, level: observed}
```

The pixel shader's per-material buffer has 68-byte records; flags at +40, detail scale at +44, inverse scale at +48, slope-normal strength at +52 and slope-normal slice at +56 match the corresponding source material fields. Detail repetition is `globalFactor × materialScale`; the source f32 at body +6 is not read as a repeat distance in this record. :observed[104 runtime/source record matches]

TerrainProceduralSetBank references 132 procedural sets. TerrainProceduralMaterial contains three TerrainMaterial references and no vegetation reference in the 479 examined bodies; procedural terrain recipes therefore are not stored tree or grass position lists. :observed[complete procedural-material body survey]

## Near colour and normal

The live splat path jitters the material lookup by noise, selects four neighbouring material texels and blends with a per-axis sigmoid `1/(1+exp(k*(.5-abs(f))))`. Detail textures come from each material's TextureSet slots 0, 1 and 7: diffuse, packed normal and mask. The same weights blend diffuse and packed normal XY. :observed[terrain pixel program and interpreted ablations]

Height differences supply the geometric normal: `normalize(((hLeft-hRight)*5000, (hDown-hUp)*5000, 1))` for neighbours .5 metres away. Reconstructed detail normals enter its frame; flat ground maps normal texture green toward world −y. Near-flat parts can flatten toward world up through material and mask controls. :observed[shader arithmetic and ablations]

Material rotation flags alter both detail UVs and normal XY. Flag bit 2 introduces a 4-metre checkerboard and 8-metre bands from integer tile-cell bits; the same transform must act on the normal frame to describe the program's result. :observed[executed terrain program]

The node loader builds t18.R/G from material Roughness/SpecularOcclusion times 255, t18.B from **block 7**, and t18.A as zero. Block 5 is grass-group data, not t18.B. :observed[loader and all 105 material bodies]

## Region ramps and distance

The five region objects each contain a TextureSet reference and two altitude endpoints. Their TextureSet slot 0 supplies a 1×2048 colour/alpha ramp. The runtime region buffer holds `(low,1/(high-low))`. :observed[stored objects and runtime record match]

| Region | Altitude interval, metres | Confidence |
|---|---|---|
| BryceCanyon | 1500–3000 | :observed |
| CanyonLand | 500–1500 | :observed |
| Rampage | 1000–2000 | :observed |
| TheWave | 1000–1500 | :observed |
| Zion | 1000–2500 | :observed |

Block-3's low nibble chooses region 1–5; zero disables the ramp. Ramp coordinate is `sat((height-low)/(high-low))`, and ramp alpha controls colour interpolation, sometimes weighted by mask blue. The final occlusion factor includes `0.5+block8`. Far colour comes from block 1 rather than reevaluating all near detail. :observed[program and material records]

## Virtual texturing and steep surfaces

The flat VT producer writes detail colour, packed detail normal, displacement and masks. Drawing shaders apply region ramps, occlusion and distance behaviour afterward. A world-memory sample has VT render-graph objects and all 125 examined per-node constant blocks carry VT fields, supporting a running VT path; exact draw selection is not captured. :observed[snapshot and program comparisons]

Flat, mixed and unclassified non-VT programs give identical outputs on three sampled crops at three distance states. Vertical programs instead sample two vertical world-space planes with azimuth-dependent weights and transform detail normals in the plane frame. Vertical triangles retain live splatting even in the VT family. :observed[interpreted comparisons and VT disassembly]

The CPU's geometric split into flat/mixed/vertical triangle lists is unresolved. The vertex varying sometimes called flatness instead blends material flag bit 4, and is not a slope measurement. :observed[vertex arithmetic] :unknown[triangle classifier]

:::open[Which constants and thresholds complete terrain rendering?]
The global detail scale, sigmoid sharpness, VT texel density, final triangle-class rule, tessellation selection and full displacement response are not all established from runtime state. A numerically executed shader with selected constants does not establish those constants as the game's settings. :unknown
:::
