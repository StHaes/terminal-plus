import { useCallback } from "react";
import { nanoid } from "nanoid";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useTileStore } from "../../stores/tileStore";
import { useTerminalStore } from "../../stores/terminalStore";
import { useGitStore } from "../../stores/gitStore";
import { collectLeaves } from "../../lib/tileTree";
import { shortcutLabel } from "../../lib/keybindings";

interface TabBarProps {
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  settingsOpen: boolean;
  shortcutsOpen: boolean;
}

export function TabBar({ onOpenSettings, onOpenShortcuts, settingsOpen, shortcutsOpen }: TabBarProps) {
  const root = useTileStore((s) => s.root);
  const focusedLeafId = useTileStore((s) => s.focusedLeafId);
  const setFocus = useTileStore((s) => s.setFocus);
  const split = useTileStore((s) => s.split);
  const sessions = useTerminalStore((s) => s.sessions);
  const gitToggle = useGitStore((s) => s.toggle);
  const gitIsOpen = useGitStore((s) => s.isOpen);

  const leaves = collectLeaves(root);

  const handleSplitH = useCallback(() => {
    split("horizontal", nanoid(8));
  }, [split]);

  const handleSplitV = useCallback(() => {
    split("vertical", nanoid(8));
  }, [split]);

  const handleWindowClose = useCallback(() => {
    getCurrentWindow().close();
  }, []);

  const handleWindowMinimize = useCallback(() => {
    getCurrentWindow().minimize();
  }, []);

  const handleWindowMaximize = useCallback(() => {
    getCurrentWindow().toggleMaximize();
  }, []);

  return (
    <div className="tab-bar" data-tauri-drag-region>
      {/* macOS-style window controls */}
      <div className="tab-bar__traffic-lights">
        <button
          className="tab-bar__traffic-btn tab-bar__traffic-btn--close"
          onClick={handleWindowClose}
          title="Close window"
        />
        <button
          className="tab-bar__traffic-btn tab-bar__traffic-btn--minimize"
          onClick={handleWindowMinimize}
          title="Minimize"
        />
        <button
          className="tab-bar__traffic-btn tab-bar__traffic-btn--maximize"
          onClick={handleWindowMaximize}
          title="Maximize"
        />
      </div>

      <div className="tab-bar__tabs">
        {leaves.map((leaf, i) => {
          const session = sessions[leaf.sessionId];
          const title = session?.title || `Terminal ${i + 1}`;
          const isFocused = leaf.id === focusedLeafId;
          return (
            <button
              key={leaf.id}
              className={`tab-bar__tab ${isFocused ? "tab-bar__tab--active" : ""}`}
              onClick={() => setFocus(leaf.id)}
            >
              {title}
            </button>
          );
        })}
      </div>
      <div className="tab-bar__actions">
        <button
          className="tab-bar__btn"
          onClick={handleSplitH}
          title={`Split Down (${shortcutLabel("split-horizontal")})`}
        >
          Split H
        </button>
        <button
          className="tab-bar__btn"
          onClick={handleSplitV}
          title={`Split Right (${shortcutLabel("split-vertical")})`}
        >
          Split V
        </button>
        <button
          className={`tab-bar__btn ${shortcutsOpen ? "tab-bar__btn--active" : ""}`}
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts"
        >
          ?
        </button>
        <span className="tab-bar__separator" />
        <button
          className={`tab-bar__btn ${gitIsOpen ? "tab-bar__btn--active" : ""}`}
          onClick={gitToggle}
          title={`Toggle Git Panel (${shortcutLabel("toggle-git-panel")})`}
        >
          Git
        </button>
        <button
          className={`tab-bar__btn ${settingsOpen ? "tab-bar__btn--active" : ""}`}
          onClick={onOpenSettings}
          title="Settings"
        >
          Theme
        </button>
      </div>
    </div>
  );
}
