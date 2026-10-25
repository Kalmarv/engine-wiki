---
title: "CollisionMaterial and surfaces"
description: "Contact types, reaction references and query and collision filters."
games: ["riders-republic"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
implementations:
  - name: "primase worlds/anvil (shape.rs)"
    url: https://github.com/Kalmarv/primase/blob/main/worlds/anvil/src/read/shape.rs
---

CollisionMaterial (`0x74F7311D`) identifies a physical surface, separately from render Material. Its 778-byte profile contains a debug color, ContactType, reaction and fluid references and collision filters. The profile and registry names are checked on 263 resources. :observed

```layout
title: "CollisionMaterial body"
size: 778
games: [riders-republic]
note: "Little-endian. Offsets are relative to this structure."
fields:
  - {"at": 0, "size": 1, "type": "u8", "name": "ManagedObject byte", "value": "01", "level": "unknown", "note": "Stored bytes; meaning is not established."}
  - {"at": 1, "size": 1, "type": "u8", "name": "NoWeatherExposed", "level": "observed", "note": "registry bool: 1 on 249 of 263, 0 on 14"}
  - {"at": 2, "size": 8, "type": "u64", "name": "DebugColor: object id", "level": "observed"}
  - {"at": 10, "size": 4, "type": "u32", "name": "DebugColor: class id", "value": "0xA79767ED", "level": "observed", "note": "= 0xA79767ED, the class `Color`"}
  - {"at": 14, "size": 16, "type": "vec4", "name": "DebugColor: R G B A", "level": "observed", "note": "registry DebugColor (Color.R, G, B, A; alpha 1.0 on all)"}
  - {"at": 30, "size": 4, "type": "u32", "name": "ContactType", "level": "observed", "note": "ContactMaterial enum; confirmed and candidate names are distinguished in the surface table."}
  - {"at": 34, "size": 10, "type": "ref", "name": "surface material (AC9E437F)", "level": "observed", "note": "registry AC9E437F, a CollisionReactionEntryBase reference: 253 bodies point to a 0xEDFC54A6 entry (Syn_Plastic_GEN, Grounds_Dirt_GEN, Wood_Hard_GEN ...), 10 are null"}
  - {"at": 44, "size": 10, "type": "ref", "name": "fluid characteristics (C8DB4746)", "level": "observed", "note": "registry C8DB4746, a MoldedFluidCharacteristics reference: 247 point to a 0xC13A9A56 entry, 16 are null"}
  - {"at": 54, "size": 1, "type": "u8", "name": "DEC061D8", "level": "unknown", "note": "registry bool (name not found), the first of the two bit fields: 1 on 21 of 263"}
  - {"at": 55, "size": 1, "type": "u8", "name": "5107A4E0", "level": "unknown", "note": "registry bool (name not found): 1 on 2 of 263"}
  - {"at": 56, "size": 8, "type": "u64", "name": "CollisionFilterInfo: object id", "level": "observed", "note": "0"}
  - {"at": 64, "size": 4, "type": "u32", "name": "CollisionFilterInfo: class id", "value": "0x43EF99C2", "level": "observed", "note": "= 0x43EF99C2"}
  - {"at": 68, "size": 1, "type": "u8", "name": "642F141F", "level": "unknown", "note": "CollisionFilterInfo bool (name not found): 1 on all 263"}
  - {"at": 69, "size": 1, "type": "u8", "name": "4A4D57A9", "level": "unknown", "note": "CollisionFilterInfo bool (name not found): 1 on 259 of 263"}
  - {"at": 70, "size": 8, "type": "u64", "name": "QueryFlags: object id", "level": "observed", "note": "0"}
  - {"at": 78, "size": 4, "type": "u32", "name": "QueryFlags: class id", "value": "0xA2FFD626", "level": "observed", "note": "= 0xA2FFD626, the class `QueryLayerBits` (the field is named QueryFlags)"}
  - {"at": 82, "size": 8, "type": "u64", "name": "QueryFlags.Static", "level": "observed", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 241 of 263"}
  - {"at": 90, "size": 8, "type": "u64", "name": "QueryFlags.89CA5860", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 242 of 263 (name not found)"}
  - {"at": 98, "size": 8, "type": "u64", "name": "QueryFlags.Dynamic", "level": "observed", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263"}
  - {"at": 106, "size": 8, "type": "u64", "name": "QueryFlags.CameraCollision", "level": "observed", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 249 of 263"}
  - {"at": 114, "size": 8, "type": "u64", "name": "QueryFlags.4ADD89EC", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263 (name not found)"}
  - {"at": 122, "size": 8, "type": "u64", "name": "QueryFlags.CameraOcclusion", "level": "observed", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 247 of 263"}
  - {"at": 130, "size": 8, "type": "u64", "name": "QueryFlags.18E32EB8", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 247 of 263 (name not found)"}
  - {"at": 138, "size": 8, "type": "u64", "name": "QueryFlags.742A8CFD", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263 (name not found)"}
  - {"at": 146, "size": 8, "type": "u64", "name": "QueryFlags.33242F07", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 2 of 263 (name not found)"}
  - {"at": 154, "size": 8, "type": "u64", "name": "QueryFlags.Character", "level": "observed", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 1 of 263"}
  - {"at": 162, "size": 8, "type": "u64", "name": "QueryFlags.WaterLevel", "level": "observed", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 2 of 263"}
  - {"at": 170, "size": 8, "type": "u64", "name": "QueryFlags.Particle", "level": "observed", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263"}
  - {"at": 178, "size": 8, "type": "u64", "name": "QueryFlags.409BC772", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 1 of 263 (name not found)"}
  - {"at": 186, "size": 8, "type": "u64", "name": "QueryFlags.5A43CF09", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263 (name not found)"}
  - {"at": 194, "size": 8, "type": "u64", "name": "QueryFlags.1B600894", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 2 of 263 (name not found)"}
  - {"at": 202, "size": 8, "type": "u64", "name": "QueryFlags.BFA8CC30", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 21 of 263 (name not found)"}
  - {"at": 210, "size": 8, "type": "u64", "name": "QueryFlags.CD19DFD6", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 3 of 263 (name not found)"}
  - {"at": 218, "size": 8, "type": "u64", "name": "QueryFlags.27A1301D", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 3 of 263 (name not found)"}
  - {"at": 226, "size": 8, "type": "u64", "name": "QueryFlags.A34FF649", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 3 of 263 (name not found)"}
  - {"at": 234, "size": 8, "type": "u64", "name": "QueryFlags.Raycast", "level": "observed", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 263 of 263"}
  - {"at": 242, "size": 8, "type": "u64", "name": "QueryFlags.OcclusionHeightTest", "level": "observed", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263"}
  - {"at": 250, "size": 8, "type": "u64", "name": "QueryFlags.Targeting", "level": "observed", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263"}
  - {"at": 258, "size": 8, "type": "u64", "name": "QueryFlags.92EF3F19", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 1 of 263 (name not found)"}
  - {"at": 266, "size": 8, "type": "u64", "name": "QueryFlags.D527A7C3", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263 (name not found)"}
  - {"at": 274, "size": 8, "type": "u64", "name": "QueryFlags.901DDA28", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 213 of 263 (name not found)"}
  - {"at": 282, "size": 8, "type": "u64", "name": "QueryFlags.TerrainLod0", "level": "observed", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 213 of 263"}
  - {"at": 290, "size": 8, "type": "u64", "name": "QueryFlags.TerrainLod1", "level": "observed", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 213 of 263"}
  - {"at": 298, "size": 8, "type": "u64", "name": "QueryFlags.TerrainLod2", "level": "observed", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 213 of 263"}
  - {"at": 306, "size": 8, "type": "u64", "name": "QueryFlags.TerrainLod3", "level": "observed", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 213 of 263"}
  - {"at": 314, "size": 8, "type": "u64", "name": "QueryFlags.TerrainLod4", "level": "observed", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 213 of 263"}
  - {"at": 322, "size": 8, "type": "u64", "name": "QueryFlags.D45E6F42", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 2 of 263 (name not found)"}
  - {"at": 330, "size": 8, "type": "u64", "name": "QueryFlags.1F1A0AB5", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 3 of 263 (name not found)"}
  - {"at": 338, "size": 8, "type": "u64", "name": "QueryFlags.E2332913", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263 (name not found)"}
  - {"at": 346, "size": 8, "type": "u64", "name": "QueryFlags.50FF8AA5", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263 (name not found)"}
  - {"at": 354, "size": 8, "type": "u64", "name": "DAE8214F: object id", "level": "unknown", "note": "0"}
  - {"at": 362, "size": 4, "type": "u32", "name": "DAE8214F: class id", "value": "0xF5EBC0BE", "level": "unknown", "note": "= 0xF5EBC0BE, the class `CollisionLayerBits` (the field DAE8214F)"}
  - {"at": 366, "size": 8, "type": "u64", "name": "DAE8214F.Static", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 241 of 263"}
  - {"at": 374, "size": 8, "type": "u64", "name": "DAE8214F.89CA5860", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 243 of 263 (name not found)"}
  - {"at": 382, "size": 8, "type": "u64", "name": "DAE8214F.Dynamic", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263"}
  - {"at": 390, "size": 8, "type": "u64", "name": "DAE8214F.Debris", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 1 of 263"}
  - {"at": 398, "size": 8, "type": "u64", "name": "DAE8214F.DetectionZone", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263"}
  - {"at": 406, "size": 8, "type": "u64", "name": "DAE8214F.MainCharacter", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 3 of 263"}
  - {"at": 414, "size": 8, "type": "u64", "name": "DAE8214F.Character", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 2 of 263"}
  - {"at": 422, "size": 8, "type": "u64", "name": "DAE8214F.CharacterNoInteractive", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263"}
  - {"at": 430, "size": 8, "type": "u64", "name": "DAE8214F.909F75B2", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 2 of 263 (name not found)"}
  - {"at": 438, "size": 8, "type": "u64", "name": "DAE8214F.42C286DC", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 2 of 263 (name not found)"}
  - {"at": 446, "size": 8, "type": "u64", "name": "DAE8214F.D0D6077F", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 2 of 263 (name not found)"}
  - {"at": 454, "size": 8, "type": "u64", "name": "DAE8214F.8025B1D3", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263 (name not found)"}
  - {"at": 462, "size": 8, "type": "u64", "name": "DAE8214F.33242F07", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 2 of 263 (name not found)"}
  - {"at": 470, "size": 8, "type": "u64", "name": "DAE8214F.WaterLevel", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263"}
  - {"at": 478, "size": 8, "type": "u64", "name": "DAE8214F.Targetable", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263"}
  - {"at": 486, "size": 8, "type": "u64", "name": "DAE8214F.901DDA28", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 212 of 263 (name not found)"}
  - {"at": 494, "size": 8, "type": "u64", "name": "DAE8214F.TerrainLod0", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 212 of 263"}
  - {"at": 502, "size": 8, "type": "u64", "name": "DAE8214F.TerrainLod1", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 212 of 263"}
  - {"at": 510, "size": 8, "type": "u64", "name": "DAE8214F.TerrainLod2", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 212 of 263"}
  - {"at": 518, "size": 8, "type": "u64", "name": "DAE8214F.TerrainLod3", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 212 of 263"}
  - {"at": 526, "size": 8, "type": "u64", "name": "DAE8214F.TerrainLod4", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 212 of 263"}
  - {"at": 534, "size": 8, "type": "u64", "name": "DAE8214F.1F1A0AB5", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 3 of 263 (name not found)"}
  - {"at": 542, "size": 8, "type": "u64", "name": "DAE8214F.DF5300A3", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263 (name not found)"}
  - {"at": 550, "size": 8, "type": "u64", "name": "DAE8214F.50FF8AA5", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263 (name not found)"}
  - {"at": 558, "size": 8, "type": "u64", "name": "883E5FCA: object id", "level": "unknown", "note": "0"}
  - {"at": 566, "size": 4, "type": "u32", "name": "883E5FCA: class id", "value": "0xF5EBC0BE", "level": "unknown", "note": "= 0xF5EBC0BE (the field 883E5FCA)"}
  - {"at": 570, "size": 8, "type": "u64", "name": "883E5FCA.Static", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 3 of 263"}
  - {"at": 578, "size": 8, "type": "u64", "name": "883E5FCA.89CA5860", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 3 of 263 (name not found)"}
  - {"at": 586, "size": 8, "type": "u64", "name": "883E5FCA.Dynamic", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 3 of 263"}
  - {"at": 594, "size": 8, "type": "u64", "name": "883E5FCA.Debris", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 7 of 263"}
  - {"at": 602, "size": 8, "type": "u64", "name": "883E5FCA.DetectionZone", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 7 of 263"}
  - {"at": 610, "size": 8, "type": "u64", "name": "883E5FCA.MainCharacter", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 1 of 263"}
  - {"at": 618, "size": 8, "type": "u64", "name": "883E5FCA.Character", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263"}
  - {"at": 626, "size": 8, "type": "u64", "name": "883E5FCA.CharacterNoInteractive", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263"}
  - {"at": 634, "size": 8, "type": "u64", "name": "883E5FCA.909F75B2", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 4 of 263 (name not found)"}
  - {"at": 642, "size": 8, "type": "u64", "name": "883E5FCA.42C286DC", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263 (name not found)"}
  - {"at": 650, "size": 8, "type": "u64", "name": "883E5FCA.D0D6077F", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 5 of 263 (name not found)"}
  - {"at": 658, "size": 8, "type": "u64", "name": "883E5FCA.8025B1D3", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 4 of 263 (name not found)"}
  - {"at": 666, "size": 8, "type": "u64", "name": "883E5FCA.33242F07", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263 (name not found)"}
  - {"at": 674, "size": 8, "type": "u64", "name": "883E5FCA.WaterLevel", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 2 of 263"}
  - {"at": 682, "size": 8, "type": "u64", "name": "883E5FCA.Targetable", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263"}
  - {"at": 690, "size": 8, "type": "u64", "name": "883E5FCA.901DDA28", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 2 of 263 (name not found)"}
  - {"at": 698, "size": 8, "type": "u64", "name": "883E5FCA.TerrainLod0", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 3 of 263"}
  - {"at": 706, "size": 8, "type": "u64", "name": "883E5FCA.TerrainLod1", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263"}
  - {"at": 714, "size": 8, "type": "u64", "name": "883E5FCA.TerrainLod2", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263"}
  - {"at": 722, "size": 8, "type": "u64", "name": "883E5FCA.TerrainLod3", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263"}
  - {"at": 730, "size": 8, "type": "u64", "name": "883E5FCA.TerrainLod4", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 21 of 263"}
  - {"at": 738, "size": 8, "type": "u64", "name": "883E5FCA.1F1A0AB5", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263 (name not found)"}
  - {"at": 746, "size": 8, "type": "u64", "name": "883E5FCA.DF5300A3", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263 (name not found)"}
  - {"at": 754, "size": 8, "type": "u64", "name": "883E5FCA.50FF8AA5", "level": "unknown", "note": "bit field of the embedded object, stored as a u64 (kind 0x09): 1 on 0 of 263 (name not found)"}
  - {"at": 762, "size": 4, "type": "f32", "name": "Friction", "level": "observed", "note": "registry Friction: 10.0 (203), 2.5 (15), 5.0 (10), 0.0 (5)"}
  - {"at": 766, "size": 4, "type": "f32", "name": "Restitution", "level": "observed", "note": "registry Restitution: 0.05 (249), 0.1, 0.01, 0.001"}
  - {"at": 770, "size": 8, "type": "bytes", "name": "unaccounted", "level": "unknown", "note": "8 bytes: 0x5368D4A5 then a zero u32, on all 263. The class lists Stiffness and Damping after Restitution (their values in the live objects are 1e12 and 0, the class defaults); these 8 bytes are not them, and 0x5368D4A5 is a CRC-32 with no known name"}
```

| ContactType | Runtime enumerator | Confidence |
|---:|---|---|
| 0 | Dirt | :observed |
| 1 | Mud | :observed |
| 2 | Grass | :observed |
| 3 | Forest (CRC candidate) | :inferred |
| 4 | Stone | :observed |
| 5 | Asphalt | :observed |
| 6 | Metal_Hard | :observed |
| 7 | Metal_Thin | :observed |
| 25 | Snow_Deep | :observed |
| 27 | Ice | :observed |
| 31 | Snow_Groomed (CRC candidate) | :inferred |
| 54 | Stairs | :observed |

The numeric values and name hashes come from the inspected ContactMaterial enum table. Forest and Snow_Groomed are candidate spellings recovered by CRC matching; the other listed names are resolved from identifier strings. This is not a friction model. QueryLayerBits stores 34 u64 slots and CollisionLayerBits 24 u64 slots in this profile. Static rocks also set Dynamic, so that filter name does not imply moving geometry. :observed

:::open[What do the remaining hashed flags control?]
Stored values are readable but lack semantic names. Reaction and fluid references alone do not establish runtime response. :unknown
:::
