---
title: Console serialized pipeline state (D3D12.X)
description: "What a console title hands the Direct3D 12.X device when it restores its pipeline cache at launch: the 96-byte compute and 352-byte graphics entries of pointer-and-size pairs, and what the blobs they point to hold."
---

On the Xbox Series consoles a title can build its pipeline state objects offline and ship the result. At launch it
hands each saved entry back to the device through the extended (D3D12.X) device interface's deserialize calls,
`DeserializeGraphicsPipelineStateX` at vtable slot 57 and `DeserializeComputePipelineStateX` at slot 67, asking for an
`ID3D12PipelineState` (the IID with first word `0x765A30F3` in every call). :observed[one title, its first 120 seconds]
The entries hold console-native compiled code and register state, not the Direct3D shader containers of a PC build
(see [Direct3D shader containers](/concepts/d3d-shader-containers/)): no entry and no blob an entry points to starts
with `DXBC`. :observed[one title, 28,139 entries]

This page records the layout of those entries as one title presents them. The evidence is one title and one launch:
every statement is observed, none proven. The byte-level counts come from the 91 compute and 186 graphics entries that
lie in the 4 KiB after the first 50 entries of each kind.

## When and how many

The title restores its whole cache at once: 2,689 compute and 25,450 graphics entries arrive within six seconds of the
first call, and no further call follows in the next two minutes of loading and play. :observed[one launch]
The compute count equals the number of compute programs the title ships as Direct3D shader containers, so the compute
cache covers the title's compute pipelines completely. :observed[one title]

Each call's `state` pointer addresses one entry of a contiguous array: the bytes after an entry are the following
entries, at a stride of 96 bytes for compute and 352 bytes for graphics. :observed[91 compute and 186 graphics entries]

When the device answers `E_NOTIMPL` to every deserialize call, the title goes on and creates the same pipelines
through the ordinary `CreateComputePipelineState` and `CreateGraphicsPipelineState` calls as it needs them.
:observed[one launch]

## The compute entry

```layout
title: Compute pipeline cache entry
size: 96
note: Little-endian. Each pointer-and-size pair addresses a readable blob of exactly that many bytes.
fields:
  - {at: 0, size: 8, type: u64, name: unknown_0, level: unknown, note: "0 in 83 of 91 entries when first read; a pointer-sized value is written into it later (51 of 89 entries read again) and never changes after that"}
  - {at: 8, size: 8, type: ptr, name: header, level: observed, note: "a 28-byte blob, shared between entries (43 distinct blobs for 91 entries)"}
  - {at: 16, size: 8, type: u64, name: header_size, level: observed, value: "28"}
  - {at: 24, size: 8, type: ptr, name: id, level: observed, note: "a 20-byte blob, one per entry"}
  - {at: 32, size: 8, type: u64, name: id_size, level: observed, value: "20"}
  - {at: 40, size: 8, type: ptr, name: code, level: observed, note: "console-native shader code, in a different memory region from the other blobs"}
  - {at: 48, size: 8, type: u64, name: code_size, level: observed, note: "320 to 8,448; a multiple of 64 in every entry"}
  - {at: 56, size: 8, type: ptr, name: metadata, level: observed, note: "begins with the dword 0x00000403"}
  - {at: 64, size: 8, type: u64, name: metadata_size, level: observed, note: "120 to 1,560; a multiple of 8 in every entry"}
  - {at: 72, size: 8, type: ptr, name: unknown_72, level: unknown, note: "a pointer, one per entry"}
  - {at: 80, size: 8, type: ptr, name: unknown_80, level: unknown, note: "a pointer, one per entry, never equal to the one at 72"}
  - {at: 88, size: 8, type: u64, name: unknown_88, level: unknown, note: "a hash-like value, one per entry"}
```

The 28-byte header blob reads as seven dwords: `0x4005CF00`, `0x6C090102`, `0`, a dword of three values
(`0x00080008`, `0x00100010` or `0x00010040`), `1`, a dword in `0x4029B5C1` to `0x4029B5C5`, and a count-like dword
(`2446`, `2442`, `231820` and others). :observed[43 distinct header blobs] What it configures is not established.
:unknown

The 20-byte id blob is a dword that is different in every entry, the dword `3`, and twelve zero bytes.
:observed[92 distinct id blobs]

Every code blob begins with a dword of the form `0xD580xxxx`, and its words match the scalar and vector encodings of
AMD's GCN and RDNA instruction sets (`0xBE88xxxx`, `0xBFA0xxxx`, `0xF4xxxxxx`). :inferred

## The graphics entry

```layout
title: Graphics pipeline cache entry
size: 352
note: Little-endian. The same pointer-and-size pairs as the compute entry, one pair per blob; a stage that is absent is a zero pair.
fields:
  - {at: 0, size: 8, type: u64, name: unknown_0, level: unknown, note: "a pointer-sized value, one of six over 186 entries; rewritten later in 31 of the 103 entries read again"}
  - {at: 8, size: 8, type: ptr, name: state, level: observed, note: "a blob of 380, 388, 396, 464, 472 or 480 bytes (388 in 116 of 186 entries) that begins with 0x4005D808 or 0x4005D800, then the dword 4; shared between entries (135 distinct blobs for 186 entries)"}
  - {at: 16, size: 8, type: u64, name: state_size, level: observed}
  - {at: 24, size: 8, type: ptr, name: input_layout, level: observed, note: "a blob of 80, 120, 152, 156 or 188 bytes, one per entry; from byte 0x50 it holds the vertex input semantic names (POSITION, COLOR, TEXCOORD); the 80-byte form holds none"}
  - {at: 32, size: 8, type: u64, name: input_layout_size, level: observed}
  - {at: 40, size: 8, type: ptr, name: stage1_code, level: observed, note: "zero in 16 of 186 entries; a code blob is shared between pipelines (122 distinct for 170 entries)"}
  - {at: 48, size: 8, type: u64, name: stage1_code_size, level: observed, note: "up to 35,072"}
  - {at: 56, size: 8, type: ptr, name: stage1_metadata, level: observed, note: "begins with the dword 0x00000002"}
  - {at: 64, size: 8, type: u64, name: stage1_metadata_size, level: observed, note: "up to 3,536; a multiple of 8"}
  - {at: 72, size: 8, type: ptr, name: stage2_code, level: observed, note: "present in 156 of 186 entries"}
  - {at: 80, size: 8, type: u64, name: stage2_code_size, level: observed}
  - {at: 88, size: 8, type: ptr, name: stage2_metadata, level: observed}
  - {at: 96, size: 8, type: u64, name: stage2_metadata_size, level: observed}
  - {at: 104, size: 8, type: ptr, name: stage3_code, level: observed, note: "present in 30 of 186 entries"}
  - {at: 112, size: 8, type: u64, name: stage3_code_size, level: observed}
  - {at: 120, size: 8, type: ptr, name: stage3_metadata, level: observed}
  - {at: 128, size: 8, type: u64, name: stage3_metadata_size, level: observed}
  - {at: 136, size: 96, type: "u64[12]", name: unused_pairs, level: unknown, note: "zero in every entry read"}
  - {at: 232, size: 8, type: ptr, name: stage7_code, level: observed, note: "zero in all but one entry, where it addresses a 52-byte blob in the code region"}
  - {at: 240, size: 8, type: u64, name: stage7_code_size, level: observed}
  - {at: 248, size: 16, type: "u64[2]", name: stage7_metadata_pair, level: unknown, note: "zero in every entry read"}
  - {at: 264, size: 8, type: u64, name: unknown_264, level: unknown, note: "0 in 155 of 186 entries; packed 16-bit values in the rest"}
  - {at: 272, size: 8, type: ptr, name: unknown_272, level: unknown, note: "a pointer, one per entry"}
  - {at: 280, size: 4, type: u32, name: entry_size, level: observed, value: "352"}
  - {at: 284, size: 4, type: u32, name: unknown_284, level: unknown, note: "0x04010000 in 159 of 186 entries; 0x04010700, 0x040200FF and others in the rest"}
  - {at: 288, size: 8, type: ptr, name: unknown_288, level: unknown, note: "a pointer, one per entry"}
  - {at: 296, size: 8, type: ptr, name: unknown_296, level: unknown, note: "a pointer, one per entry, never equal to the one at 288"}
  - {at: 304, size: 48, type: "u64[6]", name: unknown_304, level: unknown, note: "hash-like words; the ones at 312 and 320 are one per entry, the others take 90, 22, 6 and 16 distinct values over 186 entries"}
```

The code and metadata pairs are filled from the first; which stage a pair belongs to is not written beside it.
:observed[186 entries] The pair slots run from byte 40 to byte 264, room for seven code-and-metadata pairs, which
matches one slot per graphics shader stage including mesh and amplification shaders; the one entry with a seventh
pair supports that reading. :inferred

The graphics code blobs begin with the same `0xD580xxxx` dword as the compute ones. :observed[every code blob of 50 calls]

## What the entries do not contain

No 8-byte word of an entry and no FNV-1a 64 hash of a blob an entry points to equals the FNV-1a 64 hash of any of the
title's PC Direct3D shader containers. :observed[one title, every entry of one launch] Mapping an entry to the PC
build's shaders therefore needs the console code or register state decoded, not a lookup.

:::open[What do the header, state and metadata blobs encode?]
The 28-byte compute header and the graphics state blob begin with `0x4005xxxx` dwords and are shared between entries,
which fits GPU register state; the metadata blobs hold what look like fixed-size binding records after a small header.
Neither has been decoded.
:::

:::open[What are the pointers and the tail words?]
The compute entry's pointers at 72 and 80 and the graphics entry's at 272, 288 and 296 are one per entry; the six
hash-like words at the end of a graphics entry take between 6 and 186 distinct values each. Their meaning is not
established.
:::
