---
title: "Resource type inventory 1"
description: "Stored type hashes, independently graded names and per-forge counts."
games: ["riders-republic"]
sources:
  - title: RRAssetStudio v3
    url: https://www.nexusmods.com/ridersrepublic/mods/5
    note: Independent Riders Republic resource reader.
  - title: ReForger type dictionaries
    url: https://github.com/QuilLeeR/ReForger
  - title: ACExplorer type dictionaries
    url: https://github.com/gentlegiantJGC/ACExplorer
---

The table counts stored name-table entries across the six archives of build 25394987, including base and patch copies. Counts are not deduplicated resources. Type names have independent confidence: runtime registration, tool dictionary, or candidate CRC match. :observed

Columns PC/P, USNAT/P and WhiteRoom/P mean each base archive followed by its patch. A zero means no entry of that type occurs in that archive. :observed

| Type id | Name | PC / P | USNAT / P | WhiteRoom / P | Total | Confidence |
|---|---|---:|---:|---:|---:|---|
| `0x00000000` | — | 2 / 2 | 2 / 2 | 2 / 2 | 12 | :observed[count] :unknown[name] |
| `0x00599FCD` | DBWorldAmbianceEditingHudSettings | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x00A1DF6C` | DBInventoryItem | 6,096 / 221 | 0 / 0 | 0 / 0 | 6,317 | :observed[count] :observed[registration name] |
| `0x00AB9DBC` | GamepadVibrationOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x00CA354A` | DBUserInputActionKeyMapping | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :sourced[community type lists] |
| `0x00F566A9` | OverallQualityOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x0161F57A` | ContentExpositionOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x01620E54` | UGEventEntityTemplatesContainer | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x0165AE97` | XCurve | 51 / 39 | 7 / 7 | 0 / 0 | 104 | :observed[count] :sourced[community type lists] |
| `0x01724188` | TerrainMaterial | 0 / 0 | 105 / 90 | 0 / 0 | 195 | :observed[count] :inferred[name candidate] |
| `0x017C0A69` | RegionDependenciesNode | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :inferred[name candidate] |
| `0x0187C7B9` | WorldTransitionManager | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :sourced[community type lists] |
| `0x0196529F` | TagDictionnary | 420 / 0 | 0 / 0 | 0 / 0 | 420 | :observed[count] :sourced[community type lists] |
| `0x01A0D270` | CameraSelectorBlenderNode | 2,234 / 0 | 0 / 0 | 0 / 0 | 2,234 | :observed[count] :sourced[community type lists] |
| `0x02071BC3` | TagRules | 12 / 0 | 0 / 0 | 0 / 0 | 12 | :observed[count] :sourced[community type lists] |
| `0x02251ED8` | BodyPartTemplate | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :sourced[community type lists] |
| `0x022F146B` | AccomplishmentConfig | 8 / 0 | 0 / 0 | 0 / 0 | 8 | :observed[count] :sourced[community type lists] |
| `0x02CCEE4E` | DBNationalAnthems | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x02F99F40` | WildlifeRuleSpawnType | 0 / 0 | 1 / 1 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x03091E55` | WorldPortalManager | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :sourced[community type lists] |
| `0x03095210` | RagdollParamsDB | 48 / 46 | 0 / 0 | 0 / 0 | 94 | :observed[count] :observed[registration name] |
| `0x032F4C94` | ImpactData | 2 / 0 | 0 / 0 | 0 / 0 | 2 | :observed[count] :sourced[community type lists] |
| `0x03AE85A3` | WindowModeOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x03FB4768` | WildlifePropsData | 0 / 0 | 11 / 0 | 0 / 0 | 11 | :observed[count] :observed[registration name] |
| `0x045F78CC` | JuggernautSettings | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x04CAD836` | HUDSeamlessRewardModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x0549696C` | KinoBootStrapData | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :sourced[community type lists] |
| `0x0569FB9E` | TheaterCameraManager | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :sourced[community type lists] |
| `0x05B208FE` | HUDInteractionsModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x05DD6904` | StarsProgressionRewardsRepositoryDBEntry | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x05F4026C` | UGCEditorConfiguration | 0 / 0 | 1 / 1 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x06578C35` | UITextureRepository | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x067221B7` | SilexSoundAmbienceCellData | 0 / 0 | 7 / 0 | 0 / 0 | 7 | :observed[count] :sourced[community type lists] |
| `0x0688AD26` | PlayerPreset | 78 / 78 | 0 / 0 | 0 / 0 | 156 | :observed[count] :sourced[community type lists] |
| `0x0723E959` | CommonOpportunitiesDistrictSounds | 2 / 0 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x07472A4C` | EventSeedPack | 577 / 17 | 1,187 / 1,166 | 0 / 0 | 2,947 | :observed[count] :observed[registration name] |
| `0x0750F4EA` | SoundAmbiencePlayer | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :sourced[community type lists] |
| `0x07894C47` | MainBehaviorTargetTracker | 42 / 0 | 0 / 0 | 0 / 0 | 42 | :observed[count] :sourced[community type lists] |
| `0x079BCE4D` | DBInputFilterSettingNormalizer | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x086210AF` | RigidbodyOrientationSettings | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x0984415E` | Entity | 13,744 / 5,495 | 421,517 / 174,258 | 49 / 47 | 615,110 | :observed[count] :sourced[community type lists] |
| `0x09FF9D34` | OrderItemInfo | 11 / 11 | 0 / 0 | 0 / 0 | 22 | :observed[count] :observed[registration name] |
| `0x0A004FC4` | PageActiveGameplayContext | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x0A20BDB2` | — | 2 / 2 | 0 / 0 | 0 / 0 | 4 | :observed[count] :unknown[name] |
| `0x0A2C5042` | SeamlessRewardSoundRepositoryUnit | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x0A3E93E1` | SoundActionOnStateConfig | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :sourced[community type lists] |
| `0x0B257695` | NationalAnthem | 29 / 29 | 0 / 0 | 0 / 0 | 58 | :observed[count] :observed[registration name] |
| `0x0B3CD055` | OutOfBoundsRuleSoundRepositoryUnit | 0 / 0 | 1 / 1 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x0B61404D` | OptionItem | 102 / 101 | 0 / 0 | 0 / 0 | 203 | :observed[count] :inferred[name candidate] |
| `0x0C6211FC` | MADPathFindSettings | 4 / 0 | 0 / 0 | 0 / 0 | 4 | :observed[count] :observed[registration name] |
| `0x0D3937CB` | WildlifeEntityData | 0 / 0 | 26 / 18 | 0 / 0 | 44 | :observed[count] :observed[registration name] |
| `0x0D71752B` | ContentPlaylist | 44 / 0 | 0 / 0 | 0 / 0 | 44 | :observed[count] :observed[registration name] |
| `0x0D7E0D35` | PhotoModeOverlays | 2 / 2 | 0 / 0 | 0 / 0 | 4 | :observed[count] :observed[registration name] |
| `0x0E0DBB0F` | BulkSkeletalAnimation | 0 / 0 | 4 / 0 | 0 / 0 | 4 | :observed[count] :sourced[community type lists] |
| `0x0E2F4444` | GridPartition | 0 / 0 | 3 / 3 | 1 / 1 | 8 | :observed[count] :sourced[community type lists] |
| `0x0E4E4727` | FeedbackVFXCommand | 35 / 23 | 7 / 7 | 0 / 0 | 72 | :observed[count] :observed[registration name] |
| `0x0EADACD3` | HUDSideActionNotificationModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x0EE08D7E` | ColorblindTypeOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x0F976940` | TTSManager | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :sourced[community type lists] |
| `0x0FA3067F` | Animation | 5,769 / 0 | 3,160 / 134 | 24 / 24 | 9,111 | :observed[count] :sourced[community type lists] |
| `0x108252C9` | UGEditorObjectCustomColorSaturationOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x10CD4890` | OpportunitiesDistrictSounds | 8 / 0 | 0 / 0 | 0 / 0 | 8 | :observed[count] :observed[registration name] |
| `0x1107F1A3` | TrapDeployCharacterControllerSettings | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x116F4A3B` | BuilderVariationLoader | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :sourced[community type lists] |
| `0x1171397C` | UGCObjectOptionItem | 11 / 11 | 0 / 0 | 0 / 0 | 22 | :observed[count] :observed[registration name] |
| `0x11BF3F3A` | RiverWorldComponentData | 0 / 0 | 1 / 0 | 0 / 0 | 1 | :observed[count] :sourced[community type lists] |
| `0x123AC20C` | UICompassController | 0 / 0 | 1 / 1 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x12AB4C78` | SocialPresenceOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x1306C2C9` | LocalMPRuntimeSettings | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x131E7494` | LavaGroundSoundRepository | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x1358076B` | SubtitleBackgroundOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x13941F42` | PickUpControllerSettings | 1 / 1 | 1 / 1 | 0 / 0 | 4 | :observed[count] :observed[registration name] |
| `0x13EAB429` | SynchronizationPointData | 33 / 0 | 0 / 0 | 0 / 0 | 33 | :observed[count] :observed[registration name] |
| `0x13F40C45` | UGCEditor_GameplaySettings_LimitOptionAreaWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x1487752F` | UIInteractionDBEntry | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x149E0A31` | KinoRuntimeData | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :sourced[community type lists] |
| `0x14C91262` | UGCEditor_GameplaySettings_TimeLimitOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x14F81429` | SnowGroundIKRefHeightUpdaterSettings | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x15200FCE` | OlympicRider | 120 / 120 | 0 / 0 | 0 / 0 | 240 | :observed[count] :observed[registration name] |
| `0x15503843` | TrailRelatedCamDBEntry | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x156E4030` | CameramanDBEntry | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x15B3D91D` | PlayabilitySoundRepositoryUnit | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x1651A54D` | RagdollDefinition | 12 / 2 | 0 / 0 | 0 / 0 | 14 | :observed[count] :inferred[name candidate] |
| `0x16898661` | DebugReplaySettings | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :sourced[community type lists] |
| `0x16BE2E71` | ExperienceManager | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :inferred[name candidate] |
| `0x16D0F8D8` | DBGameplayOnlineSettings | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x1701EEA5` | DiscoveryStateHandler | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x171A2825` | HUDUGCEditorModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x174B8004` | AnimationSettings | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :inferred[name candidate] |
| `0x1756B2BA` | WhiteRoomTransitionProfile | 8 / 0 | 0 / 0 | 0 / 0 | 8 | :observed[count] :sourced[community type lists] |
| `0x177399F2` | HUDBenchmarkModule | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :sourced[community type lists] |
| `0x17F158DD` | UGCEditorActionInfoContainer | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x17FB5AA8` | RegionLayout | 0 / 0 | 5 / 0 | 0 / 0 | 5 | :observed[count] :sourced[community type lists] |
| `0x18409269` | FeedbackSFXCollisionReaction | 10 / 6 | 0 / 0 | 0 / 0 | 16 | :observed[count] :observed[registration name] |
| `0x185231C9` | TerrainBakingSettings | 0 / 0 | 1 / 0 | 0 / 0 | 1 | :observed[count] :sourced[community type lists] |
| `0x18A4E465` | DBAIEquipmentSet | 30 / 0 | 0 / 0 | 0 / 0 | 30 | :observed[count] :observed[registration name] |
| `0x18CAB137` | AwarenessPriority | 0 / 0 | 1 / 1 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x19320983` | TrickAssistOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x197D26F0` | UGEditorVisualHintsEntities | 0 / 0 | 1 / 1 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x19DF479C` | InGameUnitsOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x1B6269FB` | DialogLanguageOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x1BA677CE` | GameplayTheaterManager | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x1C58B04D` | WhiteroomMenuAvatarManager | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x1C898E8A` | AnimSoundSet | 2 / 2 | 0 / 0 | 0 / 0 | 4 | :observed[count] :inferred[name candidate] |
| `0x1C948994` | HUDQuestCancelledModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x1CE3CA0C` | LoadingZoneComponentSettings | 1 / 0 | 2 / 1 | 0 / 0 | 4 | :observed[count] :observed[registration name] |
| `0x1D4B87A3` | CompiledMip | 21,140 / 0 | 3,874 / 0 | 17 / 0 | 25,031 | :observed[count] :sourced[community type lists] |
| `0x1DD7537C` | WildlifeRuleAltitude | 0 / 0 | 1 / 1 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x1DE2EC80` | HUDRuleObjectiveFailedModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x1E2FC5BA` | SnowballLauncherSettings | 2 / 2 | 0 / 0 | 0 / 0 | 4 | :observed[count] :observed[registration name] |
| `0x1E5020CF` | BrightnessOptionWrapper | 2 / 2 | 0 / 0 | 0 / 0 | 4 | :observed[count] :observed[registration name] |
| `0x1E7EEF9F` | AntiAliasingOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x1E8AB02B` | HUDFogOfWarModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x1ED92311` | EdgesWorldRegionsDescriptor | 0 / 0 | 3 / 0 | 0 / 0 | 3 | :observed[count] :observed[registration name] |
| `0x1F24EB47` | NotificationMessageDepot | 9 / 9 | 0 / 0 | 0 / 0 | 18 | :observed[count] :observed[registration name] |
| `0x1F29E314` | UGCEditor_GameplaySettings_LimitOptionRaceWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x1F79D45E` | WildlifeFxData | 0 / 0 | 13 / 12 | 0 / 0 | 25 | :observed[count] :observed[registration name] |
| `0x1F8A75ED` | FaceTimeData | 26 / 0 | 0 / 0 | 0 / 0 | 26 | :observed[count] :observed[registration name] |
| `0x1F9A39F3` | VersusSquadGameModeData | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x1FD6321F` | FogOfWarSoundRepositoryUnit | 0 / 0 | 1 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x201429AB` | AnimatedTexture | 0 / 0 | 4 / 0 | 0 / 0 | 4 | :observed[count] :sourced[community type lists] |
| `0x202534BD` | EquipmentSetupDescriptor | 63 / 0 | 20 / 20 | 0 / 0 | 103 | :observed[count] :observed[registration name] |
| `0x203799C8` | UIStampInfoPanelModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x205FB70E` | SnowManualUpdaterSettings | 3 / 0 | 0 / 0 | 0 / 0 | 3 | :observed[count] :observed[registration name] |
| `0x207C7937` | ProceduralEntityGroup | 0 / 0 | 1,133 / 326 | 0 / 0 | 1,459 | :observed[count] :inferred[name candidate] |
| `0x207EE531` | QuestGameplayData | 434 / 8 | 370 / 233 | 0 / 0 | 1,045 | :observed[count] :sourced[community type lists] |
| `0x20D21B9C` | DBScoringStatTypeGroup | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x217A9F8D` | FeedbackSoundSetting | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x217F49A9` | DBUserInputAction | 305 / 18 | 0 / 0 | 0 / 0 | 323 | :observed[count] :sourced[community type lists] |
| `0x21BE3FF4` | EventSeedPackList | 4 / 0 | 2 / 2 | 0 / 0 | 8 | :observed[count] :observed[registration name] |
| `0x21C2D472` | WorldAmbiance | 2 / 2 | 52 / 52 | 1 / 1 | 110 | :observed[count] :sourced[community type lists] |
| `0x225C4723` | UILightingSetup | 0 / 0 | 1 / 0 | 0 / 0 | 1 | :observed[count] :sourced[community type lists] |
| `0x22A63987` | UGEventBrowserDisplayOrderItemInfo | 5 / 5 | 0 / 0 | 0 / 0 | 10 | :observed[count] :observed[registration name] |
| `0x22E11589` | DefaultGameplayCoordinatorManager | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :sourced[community type lists] |
| `0x22E4BF7B` | ResourceSettings | 3 / 0 | 0 / 0 | 0 / 0 | 3 | :observed[count] :inferred[name candidate] |
| `0x22ECBE63` | BuildTable | 10,240 / 459 | 10 / 7 | 14 / 11 | 10,741 | :observed[count] :sourced[community type lists] |
| `0x2328ADCD` | HUDVoiceChatModule | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x235C0560` | KinoReplaceSystemData | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :sourced[community type lists] |
| `0x238ECF93` | CursorPlatformImage | 7 / 7 | 0 / 0 | 0 / 0 | 14 | :observed[count] :sourced[community type lists] |
| `0x23B1489A` | FeedbackTokenInventoryUI | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x23C739DB` | UGCEditor_GameplaySettings_EventModeOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x24184C97` | DBInputActionMappingAnalog | 164 / 14 | 0 / 0 | 0 / 0 | 178 | :observed[count] :sourced[community type lists] |
| `0x24AECB7C` | Skeleton | 1,103 / 6 | 17 / 12 | 0 / 0 | 1,138 | :observed[count] :sourced[community type lists] |
| `0x24D32CF8` | LayeredSky | 2 / 0 | 45 / 0 | 1 / 0 | 48 | :observed[count] :sourced[community type lists] |
| `0x25115F32` | UIWorldContentSelectionTopViewPinModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x2511728A` | ColMatDataCollisionImpactSound | 12 / 12 | 0 / 0 | 0 / 0 | 24 | :observed[count] :observed[registration name] |
| `0x2554791E` | WildlifeFxPack | 0 / 0 | 10 / 8 | 0 / 0 | 18 | :observed[count] :observed[registration name] |
| `0x2577CC0D` | SpeakerCoordinator | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x258223E8` | TokenBankSoundRepositoryUnit | 0 / 0 | 1 / 1 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x25F7075F` | UILiveScreenController | 0 / 0 | 1 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x263E3E23` | FocusedRegionGameplayContext | 2 / 2 | 0 / 0 | 0 / 0 | 4 | :observed[count] :observed[registration name] |
| `0x265830C9` | HDRMaxLuminanceOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x265EBBA3` | ProximityScoringRules | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x26A4B608` | HUDHuntingBoardModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x26F4535D` | LandingTargetTracker | 15 / 0 | 0 / 0 | 0 / 0 | 15 | :observed[count] :observed[registration name] |
| `0x26F64625` | LineIdWithoutSubtitlePackage | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :sourced[community type lists] |
| `0x2750D511` | ColMatDataFootStepSound | 22 / 22 | 0 / 0 | 0 / 0 | 44 | :observed[count] :sourced[community type lists] |
| `0x278AE2E0` | DBSportDictionary | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x283FD2E6` | MassRaceSoundRepositoryUnit | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x28435F00` | TheaterCinematic | 0 / 0 | 246 / 191 | 8 / 8 | 453 | :observed[count] :sourced[community type lists] |
| `0x2857C44B` | QuestInstance | 434 / 8 | 370 / 233 | 0 / 0 | 1,045 | :observed[count] :inferred[name candidate] |
| `0x285C49F9` | PlatformSpecificVideoContainer | 2 / 1 | 0 / 0 | 0 / 0 | 3 | :observed[count] :observed[registration name] |
| `0x28941138` | KinoReplaceFamilyData | 4 / 0 | 0 / 0 | 0 / 0 | 4 | :observed[count] :sourced[community type lists] |
| `0x28B65E7C` | RewindGameplayContext | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x29066025` | NotificationGroupManagementRouter | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x29191D7B` | TerrainSediments | 0 / 0 | 5 / 0 | 0 / 0 | 5 | :observed[count] :observed[registration name] |
| `0x296057FE` | DBInputFilterSettingTrumpet | 2 / 0 | 0 / 0 | 0 / 0 | 2 | :observed[count] :sourced[community type lists] |
| `0x29BB35D1` | DBInputFilterSettingGroup | 44 / 6 | 0 / 0 | 0 / 0 | 50 | :observed[count] :sourced[community type lists] |
| `0x2A190ABF` | VoiceChatToSpeechOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x2A647ADF` | HUDPhotoDetailsPanelModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x2A6590B7` | UIManagerGame | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :inferred[name candidate] |
| `0x2B4C42D5` | HUDQuestTeleportOnFailModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x2B8D2C13` | PadPlatformImage | 42 / 42 | 0 / 0 | 0 / 0 | 84 | :observed[count] :sourced[community type lists] |
| `0x2B9B059F` | RideEvaluation | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x2C122F22` | AirSimulationSettings | 5 / 0 | 0 / 0 | 0 / 0 | 5 | :observed[count] :observed[registration name] |
| `0x2C1329D2` | KinoReplaceTreeData | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :sourced[community type lists] |
| `0x2C4FE0DB` | ReplayModeGameplayContext | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x2C79E12E` | SoundWorkspace | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x2CA30BD1` | UIGenericSounds | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :sourced[community type lists] |
| `0x2CBFE1EE` | GotoObjectiveSettings | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x2CC2169A` | UIMountainViewController | 0 / 0 | 1 / 1 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x2CC42429` | GameFix | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :sourced[community type lists] |
| `0x2D675BA2` | ReferenceListShape | 4 / 3 | 2,301 / 1,423 | 0 / 0 | 3,731 | :observed[count] :sourced[community type lists] |
| `0x2D7142A8` | QuestManager | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :inferred[name candidate] |
| `0x2DFB01B9` | DBInputFilterSettingInvertAxis | 8 / 0 | 0 / 0 | 0 / 0 | 8 | :observed[count] :sourced[community type lists] |
| `0x2E2BC54F` | HUDBoostOMeterModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x2E33F24F` | UGCItemUIDataContainer | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x2E5E3EFA` | UGCUIStringsRepositoryUnit | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x2E772CD8` | UIEnumBinding | 148 / 103 | 0 / 0 | 0 / 0 | 251 | :observed[count] :sourced[community type lists] |
| `0x2EE37113` | UGCEditor_GameplaySettings_TricksLimitOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x2F27973F` | JamSessionArenaRevealStrategy | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x2F45393E` | TerrainProceduralSet | 0 / 0 | 132 / 0 | 0 / 0 | 132 | :observed[count] :sourced[community type lists] |
| `0x2F552F88` | UGEditorEditMoveOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x2F821422` | DustPropertyControllerData | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x2F9EB59D` | HUDControlHintsModule | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x2FCA9C01` | UIWorldStampContentSelectionModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x2FDE0727` | UIRuleSoundRepository | 0 / 0 | 1 / 1 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x2FFCEA66` | DBInputContext | 97 / 5 | 0 / 0 | 0 / 0 | 102 | :observed[count] :inferred[name candidate] |
| `0x300A345E` | CapturableOpportunitySounds | 2 / 0 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x3030D4C0` | DBTerrainAnalyzer | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :sourced[community type lists] |
| `0x30782041` | ZoneStarterSettings | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :sourced[community type lists] |
| `0x312A2913` | QuestSettingsRepository | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :sourced[community type lists] |
| `0x31347F34` | SeasonProgressRouter | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x314C1786` | BenchmarkOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x31537F24` | BikeGeometryInfo | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x315F7CA1` | RestrictionSettings | 65 / 0 | 27 / 27 | 0 / 0 | 119 | :observed[count] :sourced[community type lists] |
| `0x3173ADEC` | UIRulesContainer | 0 / 0 | 40 / 38 | 0 / 0 | 78 | :observed[count] :observed[registration name] |
| `0x31B466A3` | HDROptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x31CA81B0` | InCinematicGameplayContext | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x3257BBEE` | DBQuestsAssociatedWeathers | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x326769FF` | GraphicsOptionsPageData | 2 / 2 | 0 / 0 | 0 / 0 | 4 | :observed[count] :observed[registration name] |
| `0x32D33EF0` | OwnedItemGameplayContext | 178 / 180 | 0 / 0 | 0 / 0 | 358 | :observed[count] :observed[registration name] |
| `0x338CDC20` | DataLayerManager | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :sourced[community type lists] |
| `0x33C23FE5` | MenuPageGameplayContext | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x33CA4276` | FeedbackVFXCollisionReaction | 42 / 18 | 0 / 0 | 0 / 0 | 60 | :observed[count] :observed[registration name] |
| `0x34605747` | MountainViewNavigationSensitivityOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x347296CD` | UGCArenaTemplate | 3 / 0 | 0 / 0 | 0 / 0 | 3 | :observed[count] :observed[registration name] |
| `0x34DE9EB0` | PlayerCameraTargetAimingSettings | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x3516A9DE` | DBPlayer | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :inferred[name candidate] |
| `0x3527D1AE` | KinoGraphData | 3 / 1 | 1 / 1 | 0 / 0 | 6 | :observed[count] :sourced[community type lists] |
| `0x35E0C991` | DBInputFilterSettingRemapSquareToCircle | 2 / 1 | 0 / 0 | 0 / 0 | 3 | :observed[count] :observed[registration name] |
| `0x35F3C473` | MouseAccelerationOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x363EA1D1` | UGC_GlobalAccess_OptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x36466FE1` | ParaglideSimulationSettings | 2 / 0 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |
| `0x365E2F0C` | AmbientFXGeneratorParams | 0 / 0 | 3 / 2 | 0 / 0 | 5 | :observed[count] :observed[registration name] |
| `0x36AA48C2` | SpeedControllerSettings | 8 / 0 | 0 / 0 | 0 / 0 | 8 | :observed[count] :observed[registration name] |
| `0x3700DF96` | SocialPresenceRegionPostcard | 0 / 0 | 25 / 0 | 0 / 0 | 25 | :observed[count] :observed[registration name] |
| `0x3706AAB3` | PedalBlendCorrectionSettings | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :observed[count] :observed[registration name] |
| `0x375AE000` | SkeletonStateModifier | 196 / 2 | 0 / 0 | 0 / 0 | 198 | :observed[count] :sourced[community type lists] |
| `0x378BCCDF` | CountdownGameplayContext | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :observed[count] :observed[registration name] |

A CRC match names a candidate class but does not define its serialized body. [Registry naming](/engines/anvil/data-model/class-registry/) distinguishes registration evidence from dictionary guesses.

:::open[Which remaining names are genuine engine classes?]
Ids `0x0A20BDB2` and `0x5E8F0E79` have no identifier match in the inspected menu/world images. ExperienceManager (`0x16BE2E71`) also matches an unrelated system string and remains a candidate. :unknown :inferred
:::
