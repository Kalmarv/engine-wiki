---
title: Name hashing
description: How engines replace paths, class names and property labels with numeric keys, and where collisions matter.
---

A stored hash can stand in for a file path, a class name or a material property. These are different lookup domains:
the spelling rules and the owner of the lookup matter as much as the numeric value. Each row links to the page that
states it, with its confidence.

| Engine / game | Names and lookup domains | Detail |
|---|---|---|
| FromSoftware / Sekiro | Archive paths use base 37 with 32-bit wrapping arithmetic | [BHD5 path hashes](/engines/fromsoft/archives/bhd5-bdt/) |
| FromSoftware / Elden Ring | Archive paths use base 133 with 64-bit wrapping arithmetic | [BHD5 path hashes](/engines/fromsoft/archives/bhd5-bdt/) |
| Anvil / Riders Republic | CRC-32 type ids identify classes; 64-bit ClassIDs identify resources. Texture-property keys hash exact ASCII labels, including trailing spaces | [Resource identities](/engines/anvil/data-model/resources/), [material labels](/engines/anvil/materials/material/) |
| RAGE / GTA V Enhanced | Asset names normally use lowercase joaat; META schema names use case-sensitive Jenkins hashes. NG encryption has a separate table-based name hash | [Hash domains](/engines/rage/data-model/meta/) |
| Frostbite / skate. | Mesh paths and resource type names use lowercase djb2-XOR, starting at 5381. Texture streaming uses a separate `h64`; depot parameter-name and block-hash generation are not established | [Resource identity](/engines/frostbite/data-model/resource-identity/), [depot hashes](/engines/frostbite/materials/shader-block-depots/) |
| Frostbite / skate. TOCs | Bundle names use an FNV-1 variant with lowercase keys, sign-extended bytes and a final reduction modulo `0x01000193`; buckets can use stored seeds | [TOC indexes](/engines/frostbite/archives/data-folders/) |
| ForzaTech / FH6 | Texture references use CRC-32 of the lowercase full game path with backslashes; parameters carry CRC-32 keys. String-table keys instead XOR each UTF-8 byte then rotate left seven bits, starting at `0xFFFFFFFF` | [Material hashes](/engines/forzatech/materials/materialbin/), [string-table hashes](/engines/forzatech/data-model/string-tables/) |
| Unity / SkateBIRD and Sledding Game | Animation paths use CRC-32 of GameObject names below the Animator; the empty path hashes to zero. Compiled controllers retain hashed names with an `m_TOS` name table | [Clip bindings](/engines/unity/animation/clips/), [controller names](/engines/unity/animation/animator-controllers/) |
| Insomniac / Sunset Overdrive | DAT1 section tags are described as CRC-32 hashes of section names; the archive separately addresses assets by 32-bit ids | [DAT1 tags](/engines/insomniac/data-model/dat1-container/), [asset addressing](/engines/insomniac/archives/toc-and-archives/) |

## Spelling is part of the key

FromSoftware normalizes paths to lowercase with forward slashes and a leading slash, then hashes UTF-16 code units.
ForzaTech's texture-path domain instead uses the full game path with backslashes. Anvil's texture labels preserve a
trailing space: `1 - Diffuse Alpha` and `1 - Diffuse Alpha ` have different keys.
See [FromSoftware paths](/engines/fromsoft/archives/bhd5-bdt/), [ForzaTech paths](/engines/forzatech/materials/materialbin/)
and [Anvil labels](/engines/anvil/materials/texture-labels/).

A matching Anvil class-name CRC from a wordlist is only a candidate name; a matching runtime registration string is
stronger evidence. The [class-registry page](/engines/anvil/data-model/class-registry/) distinguishes those cases.
ForzaTech also has a template-table hash whose generation is not established; tested common name hashes do not
explain it. See [placement templates](/engines/forzatech/world/pgeo-placements/).

## Collisions and duplicate names

In skate., two distinct mesh paths with hash `0x38e09783` reuse a renderer material-owner table even though their
material counts differ, producing wrong materials or out-of-range slots after a teleport. A separate failure occurs
when one MeshSet name maps to two resource ids. Distinct texture mip chunks sharing one `h64` cause a seam stall and
failure. These are separate identity constraints, documented in the [crash catalogue](/engines/frostbite/runtime/crashes/).

The [mesh hash recurrence](/engines/frostbite/data-model/resource-identity/) preserves a collision when the same suffix
is appended to both names. Renaming a manifest entry alone also leaves stored mesh hashes unchanged.

FromSoftware's examined indexes contain no duplicate hashes within an index; ambiguity between candidate dictionary
paths is still possible. Anvil's complete texture-label join has no distinct-byte collisions among its matched labels.
Those scopes do not establish a universal absence of collisions. See [BHD5](/engines/fromsoft/archives/bhd5-bdt/) and
[Anvil material keys](/engines/anvil/materials/material/).

:::open[How are the remaining numeric identities generated?]
Frostbite's `h64` role is established independently of a name-hash formula; its depot parameter and block hashes remain
unresolved. ForzaTech's placement-template hash also remains unresolved. See [resource identity](/engines/frostbite/data-model/resource-identity/),
[depot hashes](/engines/frostbite/materials/shader-block-depots/) and [placement templates](/engines/forzatech/world/pgeo-placements/).
:::
