---
title: Archives and compression
description: A comparison of archive indexes, compression layers, encryption and replacement rules.
---

Finding a resource and decoding its bytes can involve several layers: an archive index, a compressed payload and a
container inside that payload. Patch selection adds a separate question: which copy is active? Each row links to the
page that states it, with its confidence.

| Engine / game | Container and index | Compression and encryption | Detail |
|---|---|---|---|
| FromSoftware / Sekiro and Elden Ring | BHD5 indexes address BDT ranges by path hash; BND4 groups nested files | RSA-wrapped indexes, selected AES-128-ECB data ranges, DCX `KRAK` (Oodle Kraken). Elden Ring's encrypted regulation uses DCX `ZSTD`; `DFLT` is documented as zlib but its presence in these installs is not established | [BHD5/BDT](/engines/fromsoft/archives/bhd5-bdt/), [BND4](/engines/fromsoft/archives/bnd4/), [DCX](/engines/fromsoft/archives/dcx/), [engine comparison](/engines/fromsoft/) |
| Anvil / Riders Republic | Forge indexes hold typed resources with 64-bit identities | Chunked data blocks use version 2 / algorithm 5, zstd; equal stored and decoded sizes denote raw chunks. Checksums are Adler-32 seeded with zero over stored bytes | [Forge](/engines/anvil/archives/forge/), [data blocks](/engines/anvil/archives/data-blocks/) |
| Anvil / Ghost Recon Breakpoint | Forge resources; lookup can be global or scoped | Community-described version 3 / algorithm 3 uses Oodle Mermaid, with checksummed chunks | [Data blocks](/engines/anvil/archives/data-blocks/), [lookup scope](/engines/anvil/runtime/archive-resolution/) |
| RAGE / GTA V Enhanced | RPF7 contains directories, binary files and resources; an uncompressed entry can be another RPF | Raw DEFLATE; NG and AES cipher paths, including encrypted script bodies | [RPF7](/engines/rage/archives/rpf7/) |
| Frostbite / skate. | TOCs locate bundle manifests and chunk ranges in base or patch CAS files | CAS ranges concatenate individually framed blocks; documented codecs include stored, zlib and Oodle variants | [Data folders](/engines/frostbite/archives/data-folders/), [bundles](/engines/frostbite/archives/bundles/), [CAS](/engines/frostbite/archives/cas/) |
| ForzaTech / FH6 | PGZP minizips use indexed entries without stored names; companion files supply names and types. Ordinary ZIPs hold other assets | GeoChunks use stored, raw DEFLATE and raw LZ4. Platform ZIP method 21 is described as XMemCompress LZX; method 22 wraps DEFLATE in TFIT encryption | [PGZP](/engines/forzatech/archives/pgzp-minizip/), [encryption](/engines/forzatech/archives/encrypted-files/) |
| Insomniac / Sunset Overdrive | A central `toc` maps 32-bit asset ids to copies in twenty archives; assets contain DAT1 containers | The toc uses zlib; archives are plain concatenations. All measured zones are individually LZ4-compressed | [Archive index](/engines/insomniac/archives/toc-and-archives/), [zones](/engines/insomniac/world/zone/) |
| SEGA Ninja / SA2B | Stage data lives in relocatable REL modules; Chao stages can add a PRS wrapper | SA Tools loads PRS where flagged, then SaCompGC, then applies REL fixups. PRS also wraps GVM textures | [Stage modules](/engines/ninja/archives/stage-modules/) |
| Unity / documented players | Serialized files hold object tables; UnityFS bundles hold files across compressed blocks. SkateBIRD uses loose files, Sledding adds Addressables, Big Walk packs its player data | Measured UnityFS blocks use LZ4HC or stored bytes; the documented flag table also names LZMA, LZ4 and LZHAM | [Serialized files](/engines/unity/archives/serialized-files/), [UnityFS](/engines/unity/archives/unityfs-bundles/) |

## Compression belongs to a layer

FromSoftware's [DCX envelope](/engines/fromsoft/archives/dcx/) wraps one file, which can itself be a binder.
Frostbite [CAS blocks](/engines/frostbite/archives/cas/) instead reconstruct an asset by concatenating decoded blocks.
UnityFS file offsets refer to the concatenated decoded data, independently of compressed block boundaries; see
[UnityFS directories](/engines/unity/archives/unityfs-bundles/).

ForzaTech's track geometry and textures are readable without the key needed for its TFIT-protected database and
settings. Its localized string tables are ordinary DEFLATE ZIPs. Encryption therefore does not characterize every
file of the install. See [encrypted and plain files](/engines/forzatech/archives/encrypted-files/).

## Patches and overlays

| Engine / game | How copies relate | Detail |
|---|---|---|
| Anvil / Breakpoint | Community-described global lookup favors higher numeric patch priority; scoped lookup can search attached patches and split siblings separately | [Archive resolution](/engines/anvil/runtime/archive-resolution/) |
| Anvil / Riders Republic | Base and patch contain both shared and exclusive ids; a patch-replacing union fits checked dependency closure, but live mounting priority is not established | [Archive resolution](/engines/anvil/runtime/archive-resolution/) |
| RAGE / GTA V Enhanced | DLC XML, startup and map groups select active resources. Overlay-first, then later-mount precedence is an inference from shipped data; script-driven edge cases are not established | [Mounts and overlays](/engines/rage/archives/mounts/) |
| Frostbite / skate. | File references distinguish base and patch data and record archive locations | [TOC references](/engines/frostbite/archives/data-folders/) |
| Insomniac / Sunset Overdrive | One asset id can have several archive copies; this is distinct from the world's story/quest zone overlays | [Archive copies](/engines/insomniac/archives/toc-and-archives/), [zone overlays](/engines/insomniac/world/zone/) |

:::open[Which replacement rules are runtime-established?]
Riders Republic's live forge priority and GTA V's complete overlay/on-demand behavior remain unresolved on their
[archive-resolution](/engines/anvil/runtime/archive-resolution/) and [mount](/engines/rage/archives/mounts/) pages.
Breakpoint's raw-chunk reader support also does not settle the reported cloth-loading failures; see
[compressed blocks](/engines/anvil/archives/data-blocks/).
:::
