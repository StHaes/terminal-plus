# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Terminal+ is a macOS terminal emulator built with Tauri 2 (Rust backend) + React/TypeScript frontend. It features tiling pane layout, xterm.js terminal emulation via PTY, and a built-in git panel with branch graph visualization and commit diff viewer.

## Development Commands

```bash
# Install dependencies
pnpm install

# Run in development (starts both Vite dev server and Tauri)
pnpm tauri dev

# Build for production
pnpm tauri build

# TypeScript check only (no emit)
tsc

# Frontend-only dev server (without Tauri, at localhost:1420)
pnpm dev
```

Rust code lives in `src-tauri/`. To work on just the Rust side:
```bash
cd src-tauri && cargo check
cd src-tauri && cargo build
```

## Architecture

**Two-process model:** React frontend communicates with Rust backend exclusively via Tauri IPC (`invoke` for commands, `listen` for events). All IPC wrappers are in `src/lib/ipc.ts` — frontend code should never call `invoke()` directly.

### Frontend (src/)

- **State management:** Three Zustand stores (with immer for immutable updates):
  - `tileStore` — binary tree of panes (split/close/resize/focus)
  - `terminalStore` — session registry mapping IDs to metadata
  - `gitStore` — git panel visibility, log data, selected commit

- **Tile system:** Pane layout is a recursive binary tree (`TileNode = TileLeaf | TileSplit`). Pure tree manipulation functions live in `src/lib/tileTree.ts`. `TileContainer` recursively renders the tree; `SplitHandle` handles drag-to-resize.

- **Terminal lifecycle:** `useTerminal` hook (in `components/terminal/useTerminal.ts`) bridges xterm.js with the Rust PTY. It waits for non-zero dimensions via ResizeObserver before creating the PTY. A module-level `activePtys` Set prevents duplicate creation across React remounts.

- **Git panel:** `GitPanel` fetches git log via IPC, runs the lane assignment algorithm (`src/lib/gitGraphLayout.ts`), and renders SVG branch graphs. `CommitOverlay` shows file tree + unified diff for a selected commit.

- **Keybindings:** Registered on `window` in capture phase (to intercept before xterm.js) in `src/lib/keybindings.ts`.

### Backend (src-tauri/src/)

- **PTY module** (`pty/`): `PtyManager` holds a `HashMap<String, PtySession>` behind `parking_lot::Mutex`. Each `PtySession` spawns a shell via `portable_pty`, runs a dedicated reader thread for blocking I/O, and emits base64-encoded output via Tauri events (`pty-output-{id}`, `pty-exit-{id}`).

- **Git module** (`git/`): Shells out to the `git` CLI, parses output. `log.rs` parses `git log --all --topo-order`, `diff.rs` parses `git diff-tree` and `git show`.

- **Shell integration:** Custom zsh/bash configs in `src-tauri/src/pty/shell_integration.{zsh,bash}` are injected via `ZDOTDIR`/`BASH_ENV`. They source the user's existing dotfiles, then add Terminal+'s prompt, colors, and plugin detection.

### Adding a New IPC Command

1. Add the Rust command function in the appropriate `commands.rs` (`pty/` or `git/`)
2. Register it in `src-tauri/src/lib.rs` in the `invoke_handler` macro
3. Add a typed TypeScript wrapper in `src/lib/ipc.ts`
4. Add any needed types to `src/types/`

### Window Configuration

The app uses a custom titlebar (`decorations: false`, `transparent: true`, `macOSPrivateApi: true`). Traffic light buttons are manually positioned in `TabBar`. The window has 20% transparency with the "Midnight Indigo" theme defined in `src/styles/variables.css`.

### Adding or Changing Keybindings

When adding or modifying a keyboard shortcut, you **must** also update `getAllShortcuts()` in `src/lib/keybindings.ts` so the Shortcuts overlay (accessible via the "?" button in the tab bar) stays in sync.

## Key Conventions

- Package manager is **pnpm** (workspace config in `pnpm-workspace.yaml`)
- Terminal data crosses the IPC boundary as **base64-encoded strings**
- Session IDs are **8-character nanoid** strings
- Tauri capabilities/permissions are declared in `src-tauri/capabilities/default.json`
- TypeScript strict mode is enabled; target is ES2021
