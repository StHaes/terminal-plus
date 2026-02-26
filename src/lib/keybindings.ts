export type KeyAction =
  | "split-horizontal"
  | "split-vertical"
  | "close-pane"
  | "focus-next"
  | "focus-prev"
  | "toggle-git-panel"
  | "search-terminal";

const isMac = navigator.platform.toUpperCase().includes("MAC");

interface Keybinding {
  // key is matched case-insensitively against e.key
  key: string;
  mod?: boolean;   // Cmd on Mac, Ctrl elsewhere
  shift?: boolean;
  alt?: boolean;
  action: KeyAction;
}

const bindings: Keybinding[] = [
  { key: "d",   mod: true, shift: true, action: "split-vertical" },
  { key: "d",   mod: true,              action: "split-horizontal" },
  { key: "w",   mod: true, shift: true, action: "close-pane" },
  { key: "]",   mod: true, shift: true, action: "focus-next" },
  { key: "[",   mod: true, shift: true, action: "focus-prev" },
  { key: "g",   mod: true, shift: true, action: "toggle-git-panel" },
  { key: "f",   mod: true,              action: "search-terminal" },
];

function matchKeybinding(e: KeyboardEvent): KeyAction | null {
  const modPressed = isMac ? e.metaKey : e.ctrlKey;

  for (const b of bindings) {
    const wantMod = !!b.mod;
    const wantShift = !!b.shift;
    const wantAlt = !!b.alt;

    if (
      e.key.toLowerCase() === b.key.toLowerCase() &&
      modPressed === wantMod &&
      e.shiftKey === wantShift &&
      e.altKey === wantAlt
    ) {
      return b.action;
    }
  }
  return null;
}

export function registerKeybindings(handler: (action: KeyAction) => void): () => void {
  const listener = (e: KeyboardEvent) => {
    const action = matchKeybinding(e);
    if (action) {
      e.preventDefault();
      e.stopPropagation();
      handler(action);
    }
  };

  // Capture phase to intercept before xterm.js
  window.addEventListener("keydown", listener, true);
  return () => window.removeEventListener("keydown", listener, true);
}

/** Human-readable shortcut label for tooltips */
export function shortcutLabel(action: KeyAction): string {
  const mod = isMac ? "Cmd" : "Ctrl";
  switch (action) {
    case "split-horizontal": return `${mod}+D`;
    case "split-vertical":   return `${mod}+Shift+D`;
    case "close-pane":       return `${mod}+Shift+W`;
    case "focus-next":       return `${mod}+Shift+]`;
    case "focus-prev":       return `${mod}+Shift+[`;
    case "toggle-git-panel": return `${mod}+Shift+G`;
    case "search-terminal":  return `${mod}+F`;
  }
}

/** All shortcuts with descriptions, for the shortcuts overlay */
export function getAllShortcuts(): { label: string; shortcut: string }[] {
  return [
    { label: "Split Horizontal", shortcut: shortcutLabel("split-horizontal") },
    { label: "Split Vertical", shortcut: shortcutLabel("split-vertical") },
    { label: "Close Pane", shortcut: shortcutLabel("close-pane") },
    { label: "Focus Next Pane", shortcut: shortcutLabel("focus-next") },
    { label: "Focus Previous Pane", shortcut: shortcutLabel("focus-prev") },
    { label: "Toggle Git Panel", shortcut: shortcutLabel("toggle-git-panel") },
    { label: "Search Terminal", shortcut: shortcutLabel("search-terminal") },
  ];
}
