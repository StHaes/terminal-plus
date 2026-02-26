import { useTerminalStore } from "../../stores/terminalStore";
import { shortcutLabel } from "../../lib/keybindings";

interface TerminalHeaderProps {
  sessionId: string;
  leafId: string;
  isFocused: boolean;
  onClose: () => void;
}

export function TerminalHeader({ sessionId, leafId, isFocused, onClose }: TerminalHeaderProps) {
  const session = useTerminalStore((s) => s.sessions[sessionId]);
  const title = session?.title || "Terminal";

  return (
    <div className={`terminal-header ${isFocused ? "terminal-header--focused" : ""}`}>
      <span className="terminal-header__title">{title}</span>
      <button
        className="terminal-header__close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        title={`Close pane (${shortcutLabel("close-pane")})`}
      >
        &times;
      </button>
    </div>
  );
}
