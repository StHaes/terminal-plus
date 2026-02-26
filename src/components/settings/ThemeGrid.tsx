import { useCallback } from "react";
import { nanoid } from "nanoid";
import { useThemeStore } from "../../stores/themeStore";
import type { Theme } from "../../types/theme";

interface ThemeGridProps {
  onEditTheme: (theme: Theme) => void;
}

function swatchColors(theme: Theme): string[] {
  const c = theme.colors;
  return [c.bgPrimarySolid, c.fgPrimary, c.accentBlue, c.accentGreen];
}

export function ThemeGrid({ onEditTheme }: ThemeGridProps) {
  const currentThemeId = useThemeStore((s) => s.currentThemeId);
  const allThemes = useThemeStore((s) => s._allThemes);
  const currentTheme = useThemeStore((s) => s._currentTheme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const deleteCustomTheme = useThemeStore((s) => s.deleteCustomTheme);

  const handleCreate = useCallback(() => {
    const newTheme: Theme = {
      id: nanoid(8),
      name: "Custom Theme",
      mode: currentTheme.mode,
      isBuiltIn: false,
      colors: { ...currentTheme.colors, gitLaneColors: [...currentTheme.colors.gitLaneColors] },
    };
    onEditTheme(newTheme);
  }, [currentTheme, onEditTheme]);

  return (
    <div className="theme-grid">
      {allThemes.map((theme) => (
        <div
          key={theme.id}
          className={`theme-card ${theme.id === currentThemeId ? "theme-card--active" : ""}`}
          onClick={() => setTheme(theme.id)}
        >
          <div className="theme-card__swatches">
            {swatchColors(theme).map((color, i) => (
              <div
                key={i}
                className="theme-card__swatch"
                style={{ background: color }}
              />
            ))}
          </div>
          <div className="theme-card__name">{theme.name}</div>
          <div className="theme-card__mode">{theme.mode}</div>
          {!theme.isBuiltIn && (
            <div className="theme-card__actions">
              <button
                className="theme-card__action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditTheme(theme);
                }}
                title="Edit"
              >
                E
              </button>
              <button
                className="theme-card__action-btn theme-card__action-btn--delete"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteCustomTheme(theme.id);
                }}
                title="Delete"
              >
                &times;
              </button>
            </div>
          )}
        </div>
      ))}
      <div className="theme-card theme-card--create" onClick={handleCreate}>
        <span className="theme-card__create-icon">+</span>
        <span>Create Custom</span>
      </div>
    </div>
  );
}
