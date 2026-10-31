---
title: "Start-up and the first frame"
description: "How the Shaun White Skateboarding executable starts: the single-instance check, the boot command line and settings, the engine window and the Direct3D 9 device, and where the first frame is drawn."
games: ["shaun-white-skateboarding"]
---

The executable starts the engine in a fixed order: the C runtime, a single-instance check, the engine's settings, the
data, then graphics as a task of its own. The thread that started the process never renders: once the engine is up, it
waits in a loop until the game ends. Everything on this page is read from the executable's code, not traced in the
running game; addresses are virtual addresses of the build recorded on the [game's page](/games/shaun-white-skateboarding/)
(image base `0x400000`). :observed[static reading of the executable]

## From the entry point to the engine

| Step | What it does | Confidence |
|---|---|---|
| Entry `0x141C5CF` | Sets up the security cookie and jumps to the C runtime's `WinMainCRTStartup` | :observed |
| `WinMain` `0x18314E0` | Creates the semaphore `scimitar_semaphore`, so a second copy of the game does not start, and calls the application's main function | :observed |
| Application main `0x18310E0` | Sets the working directory to the executable's folder, reads the registry key `SOFTWARE\Ubisoft\Scimitar`, and builds the default boot command line `/world:Main_Menu /fast` | :observed |
| | Initialises the engine (`::Engine::Init`), reads `gamesettings.ini` (section `[SETTINGS]`), opens the data (it exits with code 1 when the data check reports failure), initialises graphics (`::Init::Graphic`) and starts loading (`::Loading`) | :observed |
| | Then waits: `while (flag) Sleep(33)` until the game asks to quit, and tears down | :observed |

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

:::open[What calls the frame function?]
The loop that calls the frame function dispatches through a vtable, so following the direct calls does not find it.
A breakpoint on the frame function in the running game would.
:::
