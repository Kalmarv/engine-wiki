---
title: "Localization packages"
description: "How Shaun White Skateboarding stores its text: the LocalizationPackage with pair-compressed strings in a big-endian indexed block."
games: ["shaun-white-skateboarding"]
---

The game's text is in `LocalizationPackage` objects (`0x6E3C9C6F`, the CRC-32 of the class name). The English package is entry 10 of `DataPC.forge` in the base install and entry 26 holds the manual text; the Russian-language copy of the data examined carries its own language's package instead. :observed{games="shaun-white-skateboarding"}

The package follows the layout of the Assassin's Creed II generation. Unlike the rest of the game's data its indexed text block is big-endian, starting at body offset 73. :observed

```layout
title: "IndexedData (big-endian)"
size: variable
games: [shaun-white-skateboarding]
note: "Big-endian. Offsets inside the table entries are relative to the start of this block."
fields:
  - {"at": 0, "size": 2, "type": "u16", "name": "MaxIndexSize", "value": "254", "level": "observed"}
  - {"at": 2, "size": 2, "type": "u16", "name": "fragment count n", "value": "589", "level": "observed"}
  - {"at": 4, "size": "4n", "type": "u16[2][n]", "name": "fragments", "level": "observed", "note": "per fragment a right word then a left word"}
  - {"at": "4+4n", "size": 2, "type": "u16", "name": "table count t", "level": "observed"}
  - {"at": "6+4n", "size": "12t", "type": "u32[3][t]", "name": "tables", "level": "observed", "note": "per table: first string id, offset of its string data, offset of its end-offset list"}
```

A fragment whose left word is 0 is the UTF-16 character in its right word (or empty when both are 0); any other fragment is the text of fragment `left` followed by the text of fragment `right`, so the fragments form a pair-compression tree. A table's end-offset list is a `u16` count, the end of the first string, then `count` pairs of a `u16` id step and a `u16` end offset. A string is the concatenation of fragments coded in its data one to three bytes at a time: a byte below `MaxIndexSize` is fragment `b + 1`, the byte 255 is followed by a signed 16-bit index (fragment `k + 1`), and any other byte `b` with the next byte `c` is fragment `(b·256 + c) − 254·255 + 1`. :observed

Decoding the English package this way gives 1,040 strings, each with a numeric id, on the first attempt. :observed

The strings include the names of the city's districts and stations; see the [levels](/games/shaun-white-skateboarding/#levels) of the game for their ids. :observed
