---
title: Networking stacks
description: "The networking libraries the multiplayer Unity games are built on: Mirror with KCP and Epic Online Services in Big Walk, FishNet in Sledding Game, Photon in PEAK, and what a mod has to match."
games: [big-walk, sledding, peak]
sources:
  - title: Mirror
    url: https://github.com/MirrorNetworking/Mirror
    note: NetworkManager, NetworkIdentity, KCP transport
  - title: FishNet
    url: https://github.com/FirstGearGames/FishNet
    note: the networking library with generated serializers
---

Three of the games here are multiplayer, each on a different library. The library decides how scene objects are identified
across peers, which classes carry synchronized state, and whether a client can run content the host lacks.

| Game | Library | Evidence | Confidence |
|---|---|---|---|
| Big Walk | Mirror, KCP transport on port 7777 and Epic Online Services (EOS) through a multiplex transport; Dissonance voice over Mirror | metadata contains `Mirror.*` (67 names), `KcpTransport`, `Epic.OnlineServices.*`, `Dissonance.*`; `StreamingAssets/EOS` configuration files | :observed{games="big-walk"} |
| Sledding Game | FishNet, with Epic Online Services and Dissonance's FishNet integration | `FishNet.SDK.Id` beside the executable, 490 names with `FishNet`, `StreamingAssets/EOS`, `Dissonance.Integrations.FishNet` | :observed{games="sledding"} |
| PEAK | Photon (PUN with Photon Voice) and Epic Online Services | `Photon3Unity3D.dll`, `PhotonUnityNetworking.dll`, `PhotonRealtime.dll`, `PhotonVoice*.dll`, `Zorro.PhotonUtility.dll`, `EpicOnlineService.dll` in `Managed/` | :observed{games="peak"} |

## Sledding Game

FishNet's code generator writes serializers for every networked class: `GRead___<Type>FishNet.Serializing.Generateds` and
`GWrite___<Type>…`, and per behaviour the `NetworkInitialize___Early<Type>Assembly` and `___Late` methods. Sledding's networked
classes include `PlayerSledController`, `SkiLift`, `SkiLiftChair`, `SnowmanBall` and `SnowmanState`.
:observed{games="sledding"}

## PEAK

PEAK's `Managed/` holds the whole Photon stack (PUN, Realtime, Voice, Chat) beside `Zorro.PhotonUtility.dll`. :observed{games="peak"}
The game stores its Steam and Epic platform code in `SteamCommon.dll`, `SteamManagerAssembly.dll` and `PlatformProviders.dll`.
:observed{games="peak"}

## Big Walk

The network manager is `HouseNetworkManager`, a Mirror `NetworkManager`, with `NetworkMinder` to start, join and set the transport
and password. :observed{games="big-walk"} The manager allows at most 12 players. :inferred{games="big-walk"} The world is one
scene, `WorldScene` (`level2`, 624,585 objects), and the 1,088 `NetworkIdentity` objects in it are scene objects addressed by
scene id; the only registered spawn prefab is the corpse and the player prefab is `PlayerCharacter`. :inferred{games="big-walk"}

Switches, sockets and poses that are not networked are addressed through a **ticket**: an `ITicketed.ticket`, looked up by
`TicketOffice`, giving a `ShellReference` of (ticket, network id, index). A new object of that kind needs a unique, deterministic
ticket on every peer. :inferred{games="big-walk"}

The only custom Mirror messages are in `HouseAuthenticator`: an initial authentication request with a player identifier and a
version number, a password response, an authentication response and a welcome message with the player count and whether
skip-aids are active. Every peer must run the same content, because the version number gates the join.
:inferred{games="big-walk"}

Save games are JSON in the user's `LocalLow` data under `House House/Big Walk/user_data/save_games` (`save_<slot>_<uid>.sav`
and a `.bak`), with slot name, password, integer entries, string entries and an inventory of item GUIDs; the host owns the
save. :inferred{games="big-walk"}
