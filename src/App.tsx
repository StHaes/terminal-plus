import { useState, useEffect, useCallback } from "react";
import { nanoid } from "nanoid";
import { useTileStore } from "./stores/tileStore";
import { useTerminalStore } from "./stores/terminalStore";
import { useGitStore } from "./stores/gitStore";
import { useThemeStore } from "./stores/themeStore";
import { TileContainer } from "./components/layout/TileContainer";
import { TabBar } from "./components/layout/TabBar";
import { GitPanel } from "./components/git/GitPanel";
import { CommitOverlay } from "./components/git/CommitOverlay";
import { LocalChangesOverlay } from "./components/git/LocalChangesOverlay";
import { MarkdownPreview } from "./components/markdown/MarkdownPreview";
import { SettingsOverlay } from "./components/settings/SettingsOverlay";
import { ShortcutsOverlay } from "./components/shortcuts/ShortcutsOverlay";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { registerKeybindings, type KeyAction } from "./lib/keybindings";
import { findLeafById } from "./lib/tileTree";
import { destroyPtySession } from "./components/terminal/useTerminal";
import { applyTheme } from "./lib/themeApplicator";

import "./styles/variables.css";
import "./styles/terminal.css";
import "./styles/tiling.css";
import "./styles/git-panel.css";
import "./styles/settings.css";
import "./styles/search.css";
import "./styles/highlight.css";
import "./styles/markdown.css";
import "./App.css";

function App() {
  const root = useTileStore((s) => s.root);
  const split = useTileStore((s) => s.split);
  const closePane = useTileStore((s) => s.closePane);
  const focusNext = useTileStore((s) => s.focusNext);
  const focusPrev = useTileStore((s) => s.focusPrev);
  const focusedLeafId = useTileStore((s) => s.focusedLeafId);
  const gitToggle = useGitStore((s) => s.toggle);
  const gitIsOpen = useGitStore((s) => s.isOpen);
  const toggleSearch = useTerminalStore((s) => s.toggleSearch);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const handleAction = useCallback(
    (action: KeyAction) => {
      switch (action) {
        case "split-horizontal": {
          const newSessionId = nanoid(8);
          split("horizontal", newSessionId);
          break;
        }
        case "split-vertical": {
          const newSessionId = nanoid(8);
          split("vertical", newSessionId);
          break;
        }
        case "close-pane": {
          const destroyedSessionId = closePane(focusedLeafId);
          if (destroyedSessionId) {
            destroyPtySession(destroyedSessionId).catch(() => {});
          }
          break;
        }
        case "focus-next":
          focusNext();
          break;
        case "focus-prev":
          focusPrev();
          break;
        case "toggle-git-panel":
          gitToggle();
          break;
        case "search-terminal": {
          const { root } = useTileStore.getState();
          const leaf = findLeafById(root, focusedLeafId);
          if (leaf) toggleSearch(leaf.sessionId);
          break;
        }
      }
    },
    [split, closePane, focusNext, focusPrev, focusedLeafId, gitToggle, toggleSearch]
  );

  useEffect(() => {
    return registerKeybindings(handleAction);
  }, [handleAction]);

  // Restore persisted theme on first mount
  useEffect(() => {
    applyTheme(useThemeStore.getState()._currentTheme);
  }, []);

  return (
    <div className="app">
      <TabBar
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        settingsOpen={settingsOpen}
        shortcutsOpen={shortcutsOpen}
      />
      <div className="app__content">
        <div className={`app__terminals ${gitIsOpen ? "app__terminals--with-git" : ""}`}>
          <TileContainer node={root} />
        </div>
        <GitPanel />
      </div>
      <CommitOverlay />
      <LocalChangesOverlay />
      <MarkdownPreview />
      {settingsOpen && (
        <SettingsOverlay onClose={() => setSettingsOpen(false)} />
      )}
      {shortcutsOpen && (
        <ShortcutsOverlay onClose={() => setShortcutsOpen(false)} />
      )}
      <WelcomeScreen />
    </div>
  );
}

export default App;
