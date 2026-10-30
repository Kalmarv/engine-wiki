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

## Graphics

Graphics start from a registered boot task, not from the main function. The task checks for Shader Model 3, picks the
display mode, creates the window (class `ScimitarEngineWindowClass`), initialises the graphics hardware and creates
the engine's view surface. :observed

The renderer is Direct3D 9: the task calls `Direct3DCreate9`, then `IDirect3D9::CreateDevice` from one of two call
sites, one for a window and one for full screen, and keeps the device in a global (`0x1C555F0`). :observed

The frame is drawn by a function the graphics manager reaches through its vtable (`0xBDB260`): it brackets the scene
with `BeginScene` and `EndScene`, presents through the device or a swap chain, and pumps the window messages
(`PeekMessageA`, `TranslateMessage`, `DispatchMessageA`) after each present. :observed

:::open[What calls the frame function?]
The loop that calls the frame function dispatches through a vtable, so following the direct calls does not find it.
A breakpoint on the frame function in the running game would.
:::
