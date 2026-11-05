---
title: "Start-up and the first frame"
description: "How the Shaun White Skateboarding executable starts: the single-instance check, the boot command line and settings, the engine window and the Direct3D 9 device, and where the first frame is drawn."
games: ["shaun-white-skateboarding"]
---

The executable starts the engine in a fixed order: the C runtime, a single-instance check, the engine's settings, the
data, then graphics as a task of its own. The thread that started the process never renders: once the engine is up, it
waits in a loop until the game ends. This page is read from the executable's code, not traced in the running game; where
a badge says so, the original code was run under emulation from a recorded state. Addresses are virtual addresses of the build recorded on the [game's page](/games/shaun-white-skateboarding/)
(image base `0x400000`). :observed[static reading of the executable]

## From the entry point to the engine

| Step | What it does | Confidence |
|---|---|---|
| Entry `0x141C5CF` | Sets up the security cookie and jumps to the C runtime's `WinMainCRTStartup` | :observed |
| `WinMain` `0x18314E0` | Creates the semaphore `scimitar_semaphore`, so a second copy of the game does not start, and calls the application's main function | :observed |
| Application main `0x18310E0` | Sets the working directory to the executable's folder, reads the registry key `SOFTWARE\Ubisoft\Scimitar`, and builds the default boot command line `/world:Main_Menu /fast` | :observed |
| | Initialises the engine (`::Engine::Init`), reads `gamesettings.ini` (section `[SETTINGS]`), opens the data (it exits with code 1 when the data check reports failure), initialises graphics (`::Init::Graphic`) and starts loading (`::Loading`) | :observed |
| | Then waits: `while (flag) Sleep(33)` until the game asks to quit, and tears down | :observed |

Two files the start-up asks for are optional. When the archive manager cannot open `DataPC_Common.forge`, it marks the common
pack's two resource indices −1 and carries on; the retail install has no such file, so that open always fails. A missing
`scimitar.ini` leaves the defaults. :observed[static reading of the failure branches, and a case-insensitive search of the whole
install]

The first world is therefore the menu world `Main_Menu`, the world of `DataPC_Main_Menu.forge`
([world roots](/engines/anvil/world/world-resource/)). :inferred[from the boot command line]

### Imports

The executable imports 368 Win32 functions from 18 DLLs, all `stdcall`, and its code sections call or jump through the import
table at 6,075 places (`call` or `jmp dword ptr` with the operand an import slot); every one of the 368 slots is used. `kernel32`
accounts for 211 imports and 5,291 of the places. The most called are `TlsGetValue` (2,186 places), `LeaveCriticalSection` (785),
`EnterCriticalSection` (567), `GetCurrentThreadId` (218) and `GetLastError` (109). :observed[a scan of the executable's code
sections for indirect calls through the import table]

`user32` provides 39 of the imports. Input comes through DirectInput 8 and XInput: the one `dinput8` import is
`DirectInput8Create`, the executable imports none of the `c_dfDIKeyboard`, `c_dfDIMouse` or `c_dfDIJoystick` data formats
(it passes formats of its own to `SetDataFormat`), and it imports XInput by ordinal only: 2 (`XInputGetState`), 3
(`XInputSetState`) and 4 (`XInputGetCapabilities`). :observed[the executable's import table]

### Static initialisers

Before `WinMain` the C runtime calls the initialisers listed in a table at `0x18C5818`: seven function pointers,
`0x141B25D`, `0x141C232`, `0x142D07B`, `0x1432F6C`, `0x1433B78`, `0x141A6A0` and `0x1431C0A`, each the start of a function.
Functions in the code sections are separated by runs of `int3` padding. :observed[static reading, confirmed by running the
start-up code]

The constructors of the engine's globals are a second, much longer table: `_initterm` at `0x141B711` walks `0x18C1670` to
`0x18C5810`, 4,200 entries, calling each that is not null. At load the table is byte for byte the file's; the only `.rdata` bytes
the loader rewrites are the 368 import slots at `0x18C1000` to `0x18C1600`. :observed[the file's sections against a memory image
of the started process] The first entry, `0x18A08D0`, is a function of 838 instructions ending with its `ret` at `0x18A2057`,
mostly stores of constants into globals at `0x1AD3xxx`; it returns `0xB1E0000`. :observed[the original code run under emulation from
the state at that call] Such constructors also store function pointers into globals (`push` of the address, a call of an identity
function at `0x614F00`, a store), such as `0x627550` at `0x18A08DD`; no call or jump names those functions. :observed[static reading]
Not every data word that points into the code is a function: two words of `.rdata` point inside instructions of that constructor
(`0x18A1594` and `0x18A1ADB`, operands of `mov`s). :observed[static reading]

During the runtime's own set-up, `0x142F9D8` (a wrapper with an exception-handler prologue) initialises 14 locks with
`InitializeCriticalSectionAndSpinCount`, the spin count `0xFA0`, and returns 1. :observed[the original code run under emulation]

The executable carries Microsoft C++ run-time type information: 700 `.?AV` and `.?AU` type names in `.data`, and 716 virtual tables
preceded by a complete object locator whose signature, type descriptor and class hierarchy check out (5,442 entries). Following the
code from the entry point, the thread-local-storage callbacks and the initialiser tables, through those tables, bounded jump tables
and the unwind and catch actions registered with `__CxxFrameHandler3`, reaches 670,465 instructions, none of them overlapping
another. :observed[static reading of the whole executable] That is the code reachable by those routes, not all the code that runs.
:inferred

An optional check at `0x9EF420` asks the version of `dbghelp.dll`: it reads only the root `VS_FIXEDFILEINFO`, refuses a version
block larger than `0x800` bytes and accepts version 5.1.2600.2181 or later; its caller (`0x9EF270`) frees the library when the check
fails. The install ships no `dbghelp.dll`. :observed[static reading, and a run of that path]

### Processors, fibers and exceptions

The engine probes each processor in turn. `0x9F2D80` calls `GetProcessAffinityMask` on the current process; when the process and
system masks differ it returns without probing, and when they are equal it walks the mask's bits, narrowing the process to one
processor at a time with `SetProcessAffinityMask`, probes it, and restores the mask. :observed[static reading, and a boot under
emulation with one processor]

The engine uses fibers. A wrapper's constructor (`0xA1D1B0`) converts the calling thread with `ConvertThreadToFiber`
(`0xA1D1D7`) when its first argument is 0 and otherwise creates a fiber with `CreateFiber` (`0xA1D1F1`); in both cases, and in a
second, inlined constructor at `0xA1D24D`, the fiber's data is the wrapper object itself, not null. `CreateFiber` is given the
start `0xA1C130` and a stack size read from the global `0x1B07838` (65,536 in the file; the code reads it in two places and
writes it nowhere). The start loads its parameter, the wrapper, into `ECX` and jumps to `0xA1BF60`, a loop that calls
`SwitchToFiber` through a cached pointer (`0xA1BFBB`). :observed[static reading of the executable and of its whole translated
code]

The executable imports all five fiber functions. `SwitchToFiber`'s import is referenced from eight places (`0x9F29E3`,
`0x9F3A45`, `0x9F3A98`, `0x9FBC83`, `0xA00D1F`, `0xA00E4B`, `0xA1D2BC` and `0x16B429C`), the last of them an import jump thunk
rather than a call. The boot reaches `ConvertThreadToFiber` right after the processor probe. :observed[static reading of the
import references, and one boot under emulation] No instruction of the code sections addresses `fs:[0x10]`, the thread's fiber
data, by a constant operand; an address computed at run time is not excluded. :observed[a byte-by-byte decode of every
executable section]

The executable's thread-local storage is small and has no callbacks: its TLS directory (RVA `0x161AD70`, 24 bytes) gives a
136-byte template at `0x1CD3000` to `0x1CD3088`, all zero, no zero-fill, the index variable at `0x1CC3CC8` and a callback list at
`0x18C583C` whose first entry is null. :observed[the executable's headers]

The boot raises a software exception on purpose: `RaiseException` is called at `0x9FC145` inside a frame of the C runtime's
`__except_handler3` (`0x1422D58`), whose scope table (`0x1A84558`) has a filter at `0x9FC14D` that returns −1
(`EXCEPTION_CONTINUE_EXECUTION`), so the call returns and the boot goes on. :observed[static reading, and the filter reached in a
boot under emulation]

The executable is a GUI program (PE subsystem 2) with no console: the C runtime's write routine (`0x143108C`) takes a failing
`GetConsoleMode` to mean no console and writes with `WriteFile`, and the runtime still installs its own console control handler
(`SetConsoleCtrlHandler(0x142F246, TRUE)` at `0x142F44E`). Its time-zone set-up (`0x1440864`) reads the `TZ` variable before
`GetTimeZoneInformation`, and its locale code takes the user's default LCID, enumerates the installed locales with
`EnumSystemLocalesA` and compares their English and abbreviated language and country names (`LOCALE_SENGLANGUAGE`,
`LOCALE_SENGCOUNTRY`, `LOCALE_SABBREVLANGNAME`, `LOCALE_SABBREVCTRYNAME`) with the one requested. :observed[static reading; these
sites were not run]

## Saves and background requests

Saves are read and written by six synchronous functions: list the saves `0x9166F0`, read a save `0x9167D0`, write one
`0x9168E0`, remove one `0x9169E0`, read the options `0x916AC0` and write them `0x916BC0`. Seven direct calls reach them, and
no stored pointer names them. :observed[static reading: every `call` of the code sections and every absolute reference of every
section]

Requests to them run on a worker thread. A constructor (`0x11CC370`) creates the thread at `0x11CC3E1`, its entry `0x11CBAD0`
and its parameter the request object. The worker (`0x11CAEB0`) carries out a request of type 4, the game options' listing of the
saves, through `0x11CA450`, and then writes the state 3 into the request at `0x11CAFCE`. The waiting side (`0x11B8A00`) reads
that state (the request's `+0x68`, at `0x11B8A12`) under the request's critical section (`+0x44`) and, once it is 3 and the
result is a success, calls its listener's second virtual function (`0x11B8A7C`). The start-up listener (`0x11AFEB0`) clears
its byte at `+0xC`. The start-up loop at `0x11CCADB` polls the byte at `+0x10` of an object whose `+4` it passes as that
listener, the same byte, so start-up waits until the saves are listed. :observed[static reading]

The listing goes `0x11CA450` → `0x9166F0` → `0x914CE0`, which queues it on a request manager read from the global `0x1C567CC`
(its `+0xA0`). That manager is not the launcher-services (Ubisoft Orbit) object; the constructor `0x919400` assigns it.
:observed[static reading] It is assigned in the launcher services' start-up, so a start-up without the launcher leaves the global
null and the listing has no manager to queue on. :inferred[static reading]
When the listing function returns false, its caller's list stays empty, the handler skips reading saves, sets the request's
flag at `+0x6D` and returns 1, which completes the request as an empty listing. :observed[static reading] The options'
listeners (`0x11B2A40`, `0x11B2A70`) report their own failures, `WriteOptionsFailed` (9) and `ReadOptionsFailed` (10), in place of
the general mapping. :observed[static reading] In that general mapping the save worker's result 8 is the reflected error
`NoSaveExists` (1); an options read that returns no bytes is therefore not the same as no save. :observed[static reading]

Whether the options are read depends on the current profile's name. For the profile `AUTOSAV` the game queues a separate options
read; for any other name, a new profile among them, it takes a branch that sets the default options and marks the request
complete. :observed[static reading] An empty save listing does not stop that read: in one start-up whose listing returned no
saves, the options read ran after the title screen was confirmed. :observed[one start-up]

A load request is checked in memory before anything is taken from it. The serialization thread (`SerializationThread::ThreadRun`)
calls the current profile's virtual load method and records the request as corrupt when that returns false and the request's
error is 2 (`SaveCorrupted`); `LoadRequest::DoObjectSerialization` returns false when the request has no data pointer or a data
length of 0, and its error getter returns 2. :observed[static reading, and hardware watchpoints on the request's fields in one
start-up] In that start-up an options request (action 14) completed with status 2 and error 0, and the serialization request
after it (action 8) failed with status 3, `SaveCorrupted` (2) and the back end's result `0x18`; the start-up had the options set to
their defaults by an intervention, so it does not show the path of an unmodified start-up. :observed[one start-up]

## Graphics

Graphics start from a registered boot task, not from the main function. The task checks for Shader Model 3, picks the
display mode, creates the window (class `ScimitarEngineWindowClass`), initialises the graphics hardware and creates
the engine's view surface. :observed

The renderer is Direct3D 9. The `IDirect3D9` object is made on first use (`Direct3DCreate9(0x20)`) and kept in a global
(`0x1C9B764`). `IDirect3D9::CreateDevice` is called from two sites: `0xBA90C8` makes a hardware (HAL) device with behaviour
flags `0x46`, and `0xBA902C` a reference-rasterizer (REF) device with `0x42`. :observed The device is not in one global: a
wrapper's constructor (`0xCAE9B0`) stores it at the wrapper's `+0`, the wrapper is at `+0` of a renderer, and the renderers are
held in arrays at `0x1C9B750` and `0x1C9B768`, so the device is `[[0x1C9B768]]`. A second global, `0x1C555F0`, also holds a
device, identified by how it is used. :observed The game calls Direct3D through the COM interface form (the interface pointer
pushed last, the callee cleaning the stack), not `thiscall`. :observed

Shader constants go through six uploaders, `0xC06CC0`, `0xC06D10`, `0xC06D60`, `0xC06DB0`, `0xC06E00` and `0xC06E50`, which are
`SetVertexShaderConstantF`, `I` and `B` and `SetPixelShaderConstantF`, `I` and `B`; each works on a constant bank holding the
device at `+0x10` and a cache flag at `+0xC`. :observed

The frame is drawn by a function the graphics manager reaches through its vtable (`0xBDB260`): it brackets the scene
with `BeginScene` and `EndScene`, presents through the device or a swap chain, and pumps the window messages
(`PeekMessageA`, `TranslateMessage`, `DispatchMessageA`) after each present. :observed

The title screen's background is a 1280 × 720 BC1 image drawn on a quad larger than the 1280 × 720 viewport, so the screen shows
it cropped and enlarged, not texel for texel; the image is stored with its V axis the other way up, which the sprite's vertex
program turns. :observed[the title screen's recorded draws] Drawn 1:1 with the same programs and identity constants, the image
gives at all 921,600 pixels the same RGB as an independent BC1 decoder. :proven[the title sprite's programs run on its texture]

Loading the world New Game opens (`DataPC_02.forge`) creates far more Direct3D resources than the title screen does. Once
the load settles, the game holds about 190.5 MB of resource bytes in 9,286 Direct3D objects:

- 1,108 textures, most of them `D3DPOOL_MANAGED` DXT1 or DXT5 with full mip chains (the largest group is 148 textures of
  512 × 512, DXT1, 10 levels);
- 1,561 vertex buffers and 675 index buffers;
- 538 vertex shaders, 3,273 pixel shaders and 2,048 occlusion queries.

On the title screen it is about 67 MB. :observed[a native run of the port through New Game, counting live resources]

On the same way in, from start-up through New Game into level 02, the game reads 334 forge entries. Decompressed, they
hold 50,949 top-level objects of 244 classes, 852,251,348 bytes in all. Animation and sound make up 40% of those bytes,
textures almost half:

| Class | Objects | Bytes | Share of the bytes | Confidence |
|---|---:|---:|---:|---|
| `TextureMap` | 4,936 | 404,211,895 | 47.4% | :observed |
| `Animation` | 14,363 | 240,262,349 | 28.2% | :observed |
| `SoundBao` | 8,670 | 105,803,074 | 12.4% | :observed |
| `Mesh` | 1,736 | 74,877,845 | 8.8% | :observed |
| `Entity` | 3,050 | 8,196,349 | 1.0% | :observed |
| `SKGenericMaterial` | 3,024 | 2,080,652 | 0.2% | :observed |
| `MeshShape` | 566 | 1,816,638 | 0.2% | :observed |
| 237 other classes | | 15,002,546 | 1.8% | :observed |

The counts come from mapping the game's file reads in one such run onto the entries of the forges, decompressing each entry
it read and counting the objects in it by class. :observed[one run into level 02] The largest of the other classes are
`FireData` (47 objects, 2.07 MB), `WorldLightingData` (2, 2.06 MB), `ActionBlock` (426, 1.91 MB) and `NavMeshManager` (68,
1.02 MB); `AnimSet` has 1,854 objects in 0.48 MB and `Skeleton` 106 in 0.39 MB. :observed[one run into level 02] Of the
`SoundBao` bytes, 85 MB are in `DataPC_02.forge`. :observed[one run into level 02]

In the world frames that follow, most draws go to two targets. A 1280 × 720 `A8R8G8B8` target, drawn with a second colour
target bound beside it and a depth surface of its own, takes 54 to 127 draws a frame; a 2048 × 1024 `R32F` target takes 34
to 44. The few remaining draws go to targets of 512 × 256, 1130 × 360 and 320 × 180 (`A8R8G8B8`) and to one 1280 × 720 `R32F`
target. :observed[seven world frames of level 02 in one run, by the render target bound at each draw] What the 2048 × 1024
target holds is not established; one float channel at that size fits a shadow map. :inferred

The game sets the 2048 × 1024 `R32F` target as render target 0 while the 1280 × 720 `D24S8` depth-stencil surface is still
set, so for a time the depth surface is smaller than the colour target it is bound with. :observed[the first world frames after New Game, in one run]
The texture loader does not check `CreateTexture`'s result. The call at `0xC9E205` that receives `D3DERR_OUTOFVIDEOMEMORY`
goes on with a NULL texture, and the game faults reading address 0 at `0xCA1440`. :observed[the port with a 192 MiB
resource budget]

:::open[What calls the frame function?]
The loop that calls the frame function dispatches through a vtable, so following the direct calls does not find it.
A breakpoint on the frame function in the running game would.
:::
