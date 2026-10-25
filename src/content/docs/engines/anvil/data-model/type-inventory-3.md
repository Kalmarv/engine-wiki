---
title: "Resource type inventory 3"
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

The table counts stored name-table entries across the six archives of build 25394987, including base and patch copies. Counts are not deduplicated resources. Type names have independent confidence: runtime registration, tool dictionary, or candidate CRC match. The count includes every name-table row of all six installed forges, with no index-reader refusals. :proven

Columns PC/P, USNAT/P and WhiteRoom/P mean each base archive followed by its patch. A zero means no entry of that type occurs in that archive; every entry in all six tables is included. :proven

| Type id | Name | PC / P | USNAT / P | WhiteRoom / P | Total | Confidence |
|---|---|---:|---:|---:|---:|---|
| `0x775F70D7` | HUDModulesLayout | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x77737DF4` | EquippedItemGameplayContext | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x78B0A1F2` | BulkActionType | 0 / 0 | 5 / 0 | 0 / 0 | 5 | :proven[count] :sourced[community type lists] |
| `0x79151B91` | UIScoringModeSettings | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x791B7711` | DBFailConditionsSettings | 2 / 2 | 0 / 0 | 0 / 0 | 4 | :proven[count] :observed[registration name] |
| `0x79210545` | AccomplishmentManager | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :sourced[community type lists] |
| `0x794BF669` | WaterReflectionEnableOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x79B0E782` | ForecastPreset | 144 / 1 | 51 / 52 | 0 / 0 | 248 | :proven[count] :observed[registration name] |
| `0x7A3E83FD` | ConvertTextToSpeechOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x7A4DCDCF` | DominoStructInstance | 104 / 0 | 75 / 0 | 0 / 0 | 179 | :proven[count] :observed[registration name] |
| `0x7AAB07A6` | CameraManager | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x7AF75808` | UIDisplayableContentDescriptor | 1 / 1 | 15 / 9 | 0 / 0 | 26 | :proven[count] :observed[registration name] |
| `0x7B24A500` | GraffitiSoundRepositoryUnit | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x7B30D8AE` | CareerInfo | 9 / 9 | 0 / 0 | 0 / 0 | 18 | :proven[count] :observed[registration name] |
| `0x7B3F8FA4` | SoundRadioProgram | 16 / 9 | 3 / 3 | 0 / 0 | 31 | :proven[count] :sourced[community type lists] |
| `0x7B4AB94F` | VFXParameterBinding | 19 / 7 | 0 / 0 | 0 / 0 | 26 | :proven[count] :observed[registration name] |
| `0x7B579B97` | WalkNavigationSettings | 4 / 0 | 0 / 0 | 0 / 0 | 4 | :proven[count] :inferred[name candidate] |
| `0x7BCE13C9` | NotificationClanRouter | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x7C00F6AF` | WorldTransitionPortal | 0 / 0 | 10 / 10 | 0 / 0 | 20 | :proven[count] :sourced[community type lists] |
| `0x7C29F3E6` | DBCollisionMaterial | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :inferred[name candidate] |
| `0x7D9A2863` | DBDefaultPresetForGamepadOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x7DE8C134` | SoundRadioShow | 15 / 9 | 3 / 3 | 0 / 0 | 30 | :proven[count] :sourced[community type lists] |
| `0x7E366B32` | ContentSelectionInfoPool | 0 / 0 | 1 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x7E8FF8CB` | ConstraintContainerAsset | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x7EA1F383` | mManagerFactory | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :sourced[community type lists] |
| `0x7EEEDFE3` | AirSportsInvertXAxisOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x7F6FD9D7` | TrailBehaviorSettings | 0 / 0 | 1 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x7FA8C3FC` | DBSnowboardConfig | 5 / 5 | 0 / 0 | 0 / 0 | 10 | :proven[count] :observed[registration name] |
| `0x7FAB89A6` | HUDCheckpointMissedModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x7FF5075B` | BinocularDBEntry | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x7FFF7B50` | WildlifeDistribution | 0 / 0 | 1 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x8013D354` | GroundSportScoringNameLibrary | 4 / 0 | 0 / 0 | 0 / 0 | 4 | :proven[count] :observed[registration name] |
| `0x80320FB8` | SpotLight | 0 / 0 | 0 / 0 | 16 / 16 | 32 | :proven[count] :sourced[community type lists] |
| `0x80AD86CE` | CameraReferenceTargetTracker | 11 / 0 | 0 / 0 | 0 / 0 | 11 | :proven[count] :sourced[community type lists] |
| `0x813B8444` | DBInputActionMappingMouseMove | 12 / 2 | 0 / 0 | 0 / 0 | 14 | :proven[count] :sourced[community type lists] |
| `0x815C176F` | AirShiftySettings | 2 / 0 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x818547B1` | DBGenericBillboardConfig | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :sourced[community type lists] |
| `0x81A46671` | RainPropertyControllerData | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x81C45BF9` | HUDVisibilityOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x8221EF8F` | DBCollisionReactionGameplay | 77 / 22 | 0 / 0 | 0 / 0 | 99 | :proven[count] :observed[registration name] |
| `0x824A23BA` | FX | 442 / 184 | 90 / 74 | 5 / 5 | 800 | :proven[count] :sourced[community type lists] |
| `0x8280104F` | DBAliasID | 3 / 3 | 0 / 0 | 0 / 0 | 6 | :proven[count] :sourced[community type lists] |
| `0x82C8C68B` | SoundOcclusionPortalExteriorLinksTable | 0 / 0 | 1 / 1 | 1 / 0 | 3 | :proven[count] :sourced[community type lists] |
| `0x830A0CA7` | SubtitlesManager | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :sourced[community type lists] |
| `0x832A1D30` | HUDReplayCoordDisplayModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x83551910` | HUDQuestAlertMessageModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x836F82BD` | ParkSettings | 3 / 0 | 0 / 0 | 0 / 0 | 3 | :proven[count] :observed[registration name] |
| `0x83C8D5C8` | SoundWindContextSoundSet | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :sourced[community type lists] |
| `0x83CD4AF5` | AmbientOcclusionModeOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x83E7AB2C` | UIStampRepository | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x8421C3D2` | NotificationSystemManager | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x84687445` | HUDLimitedTimeModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x846B9953` | DBHumanFoleyPartSound | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :sourced[community type lists] |
| `0x84EC653F` | TheaterData | 0 / 0 | 4,242 / 2,409 | 158 / 158 | 6,967 | :proven[count] :sourced[community type lists] |
| `0x84FBE9C2` | PlayCopyrightMusicOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x85486C49` | SoundSpellaSettings | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x8595D719` | LogicTemplateBundle | 20 / 17 | 0 / 0 | 0 / 0 | 37 | :proven[count] :observed[registration name] |
| `0x85C817C3` | Material | 7,910 / 407 | 2,746 / 2,494 | 11 / 11 | 13,579 | :proven[count] :sourced[community type lists] |
| `0x8623C3EB` | MultiplayerErrorUIStringsRepositoryUnit | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x86E52141` | RPG_PatchBuilderAddon | 189 / 55 | 0 / 0 | 0 / 0 | 244 | :proven[count] :observed[registration name] |
| `0x872B6B72` | NavigationSettingsPackContainer | 0 / 0 | 2 / 2 | 0 / 0 | 4 | :proven[count] :observed[registration name] |
| `0x8746BBAF` | ScoringSoundRepositoryUnit | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x87AB1329` | HUDKnockOutModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x88223C9A` | UIMountainViewCursorSubController | 0 / 0 | 1 / 1 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x887004DC` | WeatherPropertyControllerData | 2 / 0 | 49 / 11 | 1 / 0 | 63 | :proven[count] :sourced[community type lists] |
| `0x889D447C` | MusicVolumeOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x88AEAEB2` | CreditsData | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x88B4EB64` | FramerateLimitOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x88B977F4` | UIWorldRideViewPinModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x89BABEEE` | UGCEditor_GameplaySettings_TricksNumberOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x89DD100C` | SignAndFeedbackPack | 119 / 60 | 9 / 9 | 0 / 0 | 197 | :proven[count] :observed[registration name] |
| `0x8A06E551` | UGEditorObjectColorPresetsOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x8A865BA2` | StarsProgressionReward | 17 / 17 | 0 / 0 | 0 / 0 | 34 | :proven[count] :observed[registration name] |
| `0x8ACBD756` | UGCEditor_GameplaySettings_WalkOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x8B097F96` | VariableKeyRepository | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x8B2CA602` | WaterQuality | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :sourced[community type lists] |
| `0x8BAD589E` | MenuPageState | 5 / 5 | 0 / 0 | 0 / 0 | 10 | :proven[count] :sourced[community type lists] |
| `0x8BE4740F` | AirGrabSettings | 33 / 1 | 0 / 0 | 0 / 0 | 34 | :proven[count] :observed[registration name] |
| `0x8C1C341E` | UIFinalLocalizationRepository | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x8C205F38` | GameLanguageSliderChoice | 12 / 12 | 0 / 0 | 0 / 0 | 24 | :proven[count] :observed[registration name] |
| `0x8C3C11AB` | SocialPresenceSettingsSelector | 0 / 0 | 5 / 0 | 0 / 0 | 5 | :proven[count] :observed[registration name] |
| `0x8C5644D6` | DBInputFilterSettingDeadZone | 6 / 0 | 0 / 0 | 0 / 0 | 6 | :proven[count] :sourced[community type lists] |
| `0x8C6065A2` | HUDSatelliteGuidanceModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x8C9567AD` | HUDTokenInventoryModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x8C96F57F` | GambitGameModeData | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x8CF82B08` | PlaySpeechAction | 2,637 / 48 | 0 / 0 | 0 / 0 | 2,685 | :proven[count] :observed[registration name] |
| `0x8D32C10B` | CameraNavigationSensitivityOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x8DDA228D` | SoundInitSettings | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :sourced[community type lists] |
| `0x8DEEB8AD` | ProxyTextures | 0 / 0 | 1 / 1 | 1 / 0 | 3 | :proven[count] :sourced[community type lists] |
| `0x8EE6502C` | UIMountainViewWorldEntitiesSubController | 0 / 0 | 1 / 1 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x8F3980B1` | SubQuestFlowDefinition | 164 / 2 | 0 / 0 | 0 / 0 | 166 | :proven[count] :sourced[community type lists] |
| `0x8F3D5BB6` | WorldParticlesDescriptor | 0 / 0 | 7 / 7 | 0 / 0 | 14 | :proven[count] :sourced[community type lists] |
| `0x8F3E12D0` | UGEventRestrictionSettings | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x8F811D45` | UIServicesManager | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x8F882E9A` | ColMatDataCollisionFX | 2 / 2 | 0 / 0 | 0 / 0 | 4 | :proven[count] :observed[registration name] |
| `0x9024FEF0` | MenuVolumeOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x907FC839` | IKControllerSettings | 12 / 0 | 0 / 0 | 0 / 0 | 12 | :proven[count] :observed[registration name] |
| `0x90BF4AA4` | ResolutionOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x913DF9C5` | MountainViewConfig | 2 / 0 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x91BC6902` | AirSportsInvertYAxisOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x9220CBE4` | HUDSubtitleModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :sourced[community type lists] |
| `0x92789749` | WalkAnimationSettings | 10 / 0 | 0 / 0 | 0 / 0 | 10 | :proven[count] :observed[registration name] |
| `0x927EE10C` | DBSoundManagerDebugOptions | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :sourced[community type lists] |
| `0x92ADA771` | FloorHeightData | 0 / 0 | 1 / 0 | 1 / 0 | 2 | :proven[count] :sourced[community type lists] |
| `0x92C33D66` | SoundRadioMusicTrack | 187 / 116 | 1 / 1 | 0 / 0 | 305 | :proven[count] :sourced[community type lists] |
| `0x92F31FA2` | KinoTagSystemData | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :sourced[community type lists] |
| `0x936615C1` | SocialPresenceSettingsContainer | 0 / 0 | 1 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x93853353` | TrailRecordRepository | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x9401D9DC` | NoveltyStateHandler | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x947A4C63` | TutorDescriptor | 156 / 0 | 218 / 74 | 0 / 0 | 448 | :proven[count] :observed[registration name] |
| `0x94C6BEF8` | UGEditorObjectPlayerSpeedOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x94EC829C` | UGEventEntityTemplate | 178 / 175 | 0 / 0 | 0 / 0 | 353 | :proven[count] :observed[registration name] |
| `0x9527F48D` | UIWorldSatelliteGuidanceContentSelectionModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x9543E286` | TheaterScriptDefinition | 34 / 6 | 43 / 43 | 0 / 0 | 126 | :proven[count] :sourced[community type lists] |
| `0x96116A15` | UGEditorObjectEffectMetalnessOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x96DC379B` | WildlifeRulesSet | 0 / 0 | 17 / 16 | 0 / 0 | 33 | :proven[count] :observed[registration name] |
| `0x971A842E` | EntityBuilder | 5 / 2 | 32 / 17 | 2 / 2 | 60 | :proven[count] :sourced[community type lists] |
| `0x97C084C7` | RPG_PatchBuilder | 153 / 48 | 0 / 0 | 0 / 0 | 201 | :proven[count] :observed[registration name] |
| `0x982C3716` | HUDConnectionBoxModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x983005C6` | DBInputActionMappingCompound | 159 / 29 | 0 / 0 | 0 / 0 | 188 | :proven[count] :sourced[community type lists] |
| `0x98435A63` | Universe | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :sourced[community type lists] |
| `0x9895A445` | UIDiscoveryController | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x989DC6B2` | TextureMapSpec | 10,604 / 10,604 | 118 / 118 | 1 / 1 | 21,446 | :proven[count] :sourced[community type lists] |
| `0x98DBCD56` | LobbyObjectiveGameInfo | 9 / 0 | 1 / 1 | 0 / 0 | 11 | :proven[count] :observed[registration name] |
| `0x98F63D26` | HUDQuestObjectiveStartMessageModule | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x9948A545` | MultiplayerModeGameplayContext | 7 / 7 | 0 / 0 | 0 / 0 | 14 | :proven[count] :observed[registration name] |
| `0x999812DF` | UGEventEntityMetadataOptionModifiers | 4 / 4 | 0 / 0 | 0 / 0 | 8 | :proven[count] :observed[registration name] |
| `0x999D0BD7` | PlayabilityGameplayContext | 13 / 13 | 0 / 0 | 0 / 0 | 26 | :proven[count] :observed[registration name] |
| `0x99F94C77` | FBMSettings | 0 / 0 | 1 / 0 | 0 / 0 | 1 | :proven[count] :sourced[community type lists] |
| `0x99FF820F` | SFXVolumeOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x9A0F8E53` | VersusGameModeData | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x9A65E1CF` | SoundRadioTrackRandom | 12 / 12 | 3 / 3 | 0 / 0 | 30 | :proven[count] :sourced[community type lists] |
| `0x9A93A2BB` | BulkBaseActionData | 0 / 0 | 5 / 5 | 0 / 0 | 10 | :proven[count] :sourced[community type lists] |
| `0x9ABBA524` | ActiveQuestGameplayContext | 92 / 92 | 0 / 0 | 0 / 0 | 184 | :proven[count] :observed[registration name] |
| `0x9ABF7C2D` | OfflineGameplayGameplayContext | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x9B6962C3` | HUDSpeedOMeterModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x9BD29F36` | GrindSettings | 5 / 1 | 0 / 0 | 0 / 0 | 6 | :proven[count] :observed[registration name] |
| `0x9D17627A` | GameplayRulesPack | 48 / 1 | 45 / 45 | 0 / 0 | 139 | :proven[count] :observed[registration name] |
| `0x9D3D8F3F` | FaceTimeGameplayContext | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x9D6A8089` | MultiplayerModeFlowGameplayContext | 4 / 4 | 0 / 0 | 0 / 0 | 8 | :proven[count] :observed[registration name] |
| `0x9D975ED1` | OnlineRewardManager | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x9E8CAA75` | DiscoverySoundRepositoryUnit | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x9E9FAFC7` | DBPhotoModeContexts | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0x9F6B73D7` | RiderAbilitySet | 4 / 1 | 3 / 2 | 0 / 0 | 10 | :proven[count] :observed[registration name] |
| `0x9F6F380E` | HUDLoadingTooltipsModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0x9F851080` | LobbyGameConstraintsInfo | 4 / 0 | 0 / 0 | 0 / 0 | 4 | :proven[count] :observed[registration name] |
| `0x9FFFD382` | GrindAssistModeOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xA0176936` | WaterSettingsBlendState | 0 / 0 | 10 / 10 | 0 / 0 | 20 | :proven[count] :sourced[community type lists] |
| `0xA01BF44A` | AwarenessCondition | 0 / 0 | 1 / 1 | 0 / 0 | 2 | :proven[count] :sourced[community type lists] |
| `0xA0F55E65` | BenchmarkGameplayContext | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xA231C43E` | TrapJumpCharacterControllerSettings | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0xA23D9570` | GearFilterCategory | 3 / 3 | 0 / 0 | 0 / 0 | 6 | :proven[count] :observed[registration name] |
| `0xA2ADDA3B` | TeleportOnFailRuleSoundRepositoryUnit | 0 / 0 | 1 / 1 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xA2B7E917` | TextureMap | 28,538 / 10,509 | 5,998 / 1,291 | 21 / 8 | 46,365 | :proven[count] :sourced[community type lists] |
| `0xA385248B` | UGEditorObjectEffectAlphaOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xA410882D` | DBPlayerBaseJump | 5 / 1 | 0 / 0 | 0 / 0 | 6 | :proven[count] :sourced[community type lists] |
| `0xA4408184` | DBCollisionReaction | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xA49E6993` | GameplayContextRepositoryDBEntry | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xA4C73EA0` | DBSaveGameData | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xA54C64F0` | UGCEditor_GameplaySettings_LimitOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xA551BD07` | NotificationsRewardsRouter | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0xA6894656` | HUDGroupManagementNotificationModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0xA6B50B87` | HUDMultiplayerSoundRepositoryUnit | 2 / 0 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xA705E964` | PlayerPresetRepository | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xA74097C1` | HUDCentralNotificationPanelModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0xA7552E7D` | HUDDistrictInfoModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0xA786B6BA` | MenusSoundRepositoryUnit | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xA78D3954` | ClanNotificationsOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xA7DCD1E0` | ShadowQualityOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xA8D0C5B3` | CameraInvertXAxisOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xA913B431` | DBFailConditions | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xA994A91C` | VoiceChatSpeakerVolumeOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xAA1AFC43` | SeasonArrayWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xAA8AEA45` | OnlineSaveRepository | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xABD50170` | KinoMarkupSystemData | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :sourced[community type lists] |
| `0xABE17B4C` | MicrophoneVolumeOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xAC16F9CB` | DBInputContextDebug | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :sourced[community type lists] |
| `0xAC2BBF68` | GridCellDataBlock | 0 / 0 | 44,315 / 22,031 | 8 / 5 | 66,359 | :proven[count] :sourced[community type lists] |
| `0xAC8AF394` | SpawnEntityBuilderDescriptor | 59 / 2 | 136 / 119 | 7 / 6 | 329 | :proven[count] :observed[registration name] |
| `0xACE286C7` | GraphicResourceStreamer | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :sourced[community type lists] |
| `0xAD1353A8` | WildlifeRuleSlopeDegrees | 0 / 0 | 1 / 1 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xAD6A3205` | DAGSpawnHandlerUserBudget | 0 / 0 | 3 / 2 | 0 / 0 | 5 | :proven[count] :observed[registration name] |
| `0xAD7B8F1F` | PenaltySetting | 18 / 2 | 0 / 0 | 0 / 0 | 20 | :proven[count] :observed[registration name] |
| `0xAD7C6D6E` | AutoFilledOptionItem | 6 / 6 | 0 / 0 | 0 / 0 | 12 | :proven[count] :observed[registration name] |
| `0xADB5C567` | OwnedCollectableGameplayContext | 117 / 117 | 0 / 0 | 0 / 0 | 234 | :proven[count] :observed[registration name] |
| `0xAE00BCDA` | DataDrivenEnumDefinition | 98 / 58 | 20 / 20 | 0 / 0 | 196 | :proven[count] :sourced[community type lists] |
| `0xAE34FA63` | DLCUniverseComponent | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :sourced[community type lists] |
| `0xAE543638` | MountainViewShowcaseStateGameplayContext | 2 / 2 | 0 / 0 | 0 / 0 | 4 | :proven[count] :observed[registration name] |
| `0xAE67D217` | SnowPropertyControllerData | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0xAE849E18` | CSSManager | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :sourced[community type lists] |
| `0xAEA53BF1` | BehaviorPausedGameplayContext | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xAF07146B` | HUDMountainViewCursorModule | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xAF30D8A6` | HUDGroupSessionModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0xB1145C11` | UGCPathPointIconModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0xB1420AD1` | GraphicsConfig | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :sourced[community type lists] |
| `0xB152DBD0` | InGameSubtitlesOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xB1916C8F` | DBInputFilterSettingRemapCircleToSquare | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0xB19D4FCD` | KinoExternalStateData | 614 / 5 | 0 / 0 | 0 / 0 | 619 | :proven[count] :sourced[community type lists] |
| `0xB1C77829` | SatelliteGuidanceSoundRepositoryUnit | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xB1C9FB06` | SocialPresenceTrailDataPack | 0 / 0 | 1 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0xB2071B39` | VoiceChatInputDeviceOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xB20FEB47` | UGEditorEnableObjectSightAlignOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xB22B3E61` | MeshShape | 124 / 118 | 13,565 / 11,355 | 0 / 0 | 25,162 | :proven[count] :sourced[community type lists] |
| `0xB25B947C` | TheaterCameraSelectorNode | 2 / 0 | 0 / 0 | 0 / 0 | 2 | :proven[count] :sourced[community type lists] |
| `0xB2C9437E` | FeedbackVFXExclusiveSynchronizer | 3 / 0 | 0 / 0 | 0 / 0 | 3 | :proven[count] :observed[registration name] |
| `0xB37C1E71` | UniverseTagRules | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :sourced[community type lists] |
| `0xB3A2F075` | UGCEventSaveRepository | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0xB3ADF542` | BodyPartMapping | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :sourced[community type lists] |
| `0xB4AC790D` | TrailRecord | 0 / 0 | 38,529 / 1,224 | 0 / 0 | 39,753 | :proven[count] :observed[registration name] |
| `0xB4DE4F92` | SocialPresenceTrailLoader | 0 / 0 | 1 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0xB4E69FA1` | EngineOptions | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :sourced[community type lists] |
| `0xB4ED6C9F` | HUDPhotoEditingModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0xB530375D` | CoopFXOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xB57E7317` | AwarenessBudgeterSettings | 0 / 0 | 1 / 1 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xB596CA90` | MassRaceGameModeData | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0xB67EA14B` | UIMenuControllerSoundRepository | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xB687410F` | DBPlayerBike | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0xB6ADC2C0` | GroundSportsInvertXAxisOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xB8278D3A` | HUDLandmarkOverlayModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0xB8599052` | CapsuleShape | 6 / 0 | 243 / 41 | 0 / 0 | 290 | :proven[count] :sourced[community type lists] |
| `0xB91411ED` | OptionsPageData | 9 / 9 | 0 / 0 | 0 / 0 | 18 | :proven[count] :observed[registration name] |
| `0xB992756B` | DBInputActionMappingButton | 503 / 29 | 0 / 0 | 0 / 0 | 532 | :proven[count] :sourced[community type lists] |
| `0xB9C83091` | UIWorldBuddyAwarenessModule | 1 / 0 | 0 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0xB9EA48BC` | UIWorldShortcutDestinationRidePinModule | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xBA0BBAB8` | UGCSystemUIStringRepositoryUnit | 0 / 0 | 1 / 0 | 0 / 0 | 1 | :proven[count] :observed[registration name] |
| `0xBA2F3C0C` | PlaySoundInBackgroundOptionWrapper | 1 / 1 | 0 / 0 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xBA3C4ADC` | MultiplayerCompetitionFlowData | 5 / 0 | 0 / 0 | 0 / 0 | 5 | :proven[count] :observed[registration name] |
| `0xBAE310D0` | UGEventManagerConfiguration | 0 / 0 | 1 / 1 | 0 / 0 | 2 | :proven[count] :observed[registration name] |
| `0xBAE98B30` | GIDynResource | 0 / 0 | 16,384 / 564 | 4 / 4 | 16,956 | :proven[count] :sourced[community type lists] |
| `0xBB072BE8` | UIQuestObjectiveGameInfo | 9 / 1 | 0 / 0 | 0 / 0 | 10 | :proven[count] :observed[registration name] |

A CRC match names a candidate class but does not define its serialized body. [Registry naming](/engines/anvil/data-model/class-registry/) distinguishes registration evidence from dictionary guesses.
