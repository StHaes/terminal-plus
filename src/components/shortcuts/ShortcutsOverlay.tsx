import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { getAllShortcuts } from "../../lib/keybindings";

interface ShortcutsOverlayProps {
  onClose: () => void;
}

export function ShortcutsOverlay({ onClose }: ShortcutsOverlayProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [handleKeyDown]);

  const shortcuts = getAllShortcuts();

  return createPortal(
    <div className="shortcuts-overlay" onClick={onClose}>
      <div className="shortcuts-overlay__panel" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-overlay__header">
          <span className="shortcuts-overlay__title">Keyboard Shortcuts</span>
          <button className="shortcuts-overlay__close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="shortcuts-overlay__body">
          {shortcuts.map((s) => (
            <div key={s.label} className="shortcuts-overlay__row">
              <span className="shortcuts-overlay__label">{s.label}</span>
              <kbd className="shortcuts-overlay__kbd">{s.shortcut}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
