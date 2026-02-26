import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ThemeGrid } from "./ThemeGrid";
import { CustomThemeEditor } from "./CustomThemeEditor";
import type { Theme } from "../../types/theme";

interface SettingsOverlayProps {
  onClose: () => void;
}

export function SettingsOverlay({ onClose }: SettingsOverlayProps) {
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editingTheme) {
          setEditingTheme(null);
        } else {
          onClose();
        }
      }
    },
    [onClose, editingTheme]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [handleKeyDown]);

  return createPortal(
    <div className="settings-overlay" onMouseDown={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="settings-overlay__panel">
        <div className="settings-overlay__header">
          <span className="settings-overlay__title">
            {editingTheme ? "Edit Theme" : "Themes"}
          </span>
          <button className="settings-overlay__close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="settings-overlay__body">
          {editingTheme ? (
            <CustomThemeEditor
              theme={editingTheme}
              onBack={() => setEditingTheme(null)}
            />
          ) : (
            <ThemeGrid
              onEditTheme={(theme) => setEditingTheme(theme)}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
