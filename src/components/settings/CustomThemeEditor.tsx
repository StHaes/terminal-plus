import { useState, useCallback } from "react";
import { useThemeStore } from "../../stores/themeStore";
import type { Theme, ThemeColors } from "../../types/theme";

interface CustomThemeEditorProps {
  theme: Theme;
  onBack: () => void;
}

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

/** Convert any CSS color string to a 6-digit hex for <input type="color">. */
function toHex6(color: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  if (/^#[0-9a-fA-F]{8}$/.test(color)) return color.slice(0, 7);
  if (/^#[0-9a-fA-F]{3}$/.test(color)) {
    const [, r, g, b] = color.split("");
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  // For rgba/rgb values, fall back to black rather than using canvas
  // (canvas getContext is not available in all environments)
  return "#000000";
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
  const hex6 = toHex6(value);

  return (
    <div className="color-field">
      <input
        type="color"
        className="color-field__picker"
        value={hex6}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        type="text"
        className="color-field__hex"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="color-field__label">{label}</span>
    </div>
  );
}

const essentialFields: { key: keyof ThemeColors; label: string }[] = [
  { key: "bgPrimary", label: "Background" },
  { key: "bgSecondary", label: "Secondary BG" },
  { key: "bgElevated", label: "Elevated BG" },
  { key: "bgSurface", label: "Surface BG" },
  { key: "bgPrimarySolid", label: "BG Solid" },
  { key: "fgPrimary", label: "Foreground" },
  { key: "fgSecondary", label: "Secondary FG" },
  { key: "fgMuted", label: "Muted FG" },
  { key: "accentBlue", label: "Blue" },
  { key: "accentGreen", label: "Green" },
  { key: "accentPurple", label: "Purple" },
  { key: "accentRed", label: "Red" },
  { key: "accentOrange", label: "Orange" },
  { key: "accentCyan", label: "Cyan" },
  { key: "borderColor", label: "Border" },
];

const terminalFields: { key: keyof ThemeColors; label: string }[] = [
  { key: "termForeground", label: "Foreground" },
  { key: "termCursor", label: "Cursor" },
  { key: "termBlack", label: "Black" },
  { key: "termRed", label: "Red" },
  { key: "termGreen", label: "Green" },
  { key: "termYellow", label: "Yellow" },
  { key: "termBlue", label: "Blue" },
  { key: "termMagenta", label: "Magenta" },
  { key: "termCyan", label: "Cyan" },
  { key: "termWhite", label: "White" },
  { key: "termBrightBlack", label: "Bright Black" },
  { key: "termBrightRed", label: "Bright Red" },
  { key: "termBrightGreen", label: "Bright Green" },
  { key: "termBrightYellow", label: "Bright Yellow" },
  { key: "termBrightBlue", label: "Bright Blue" },
  { key: "termBrightMagenta", label: "Bright Magenta" },
  { key: "termBrightCyan", label: "Bright Cyan" },
  { key: "termBrightWhite", label: "Bright White" },
];

export function CustomThemeEditor({ theme: initialTheme, onBack }: CustomThemeEditorProps) {
  const allThemes = useThemeStore((s) => s._allThemes);
  const addCustomTheme = useThemeStore((s) => s.addCustomTheme);
  const updateCustomTheme = useThemeStore((s) => s.updateCustomTheme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const isNew = !allThemes.some((t) => t.id === initialTheme.id);

  // Local draft state for editing — only persisted to store on Save
  const [draft, setDraft] = useState<Theme>(() => ({
    ...initialTheme,
    colors: { ...initialTheme.colors, gitLaneColors: [...initialTheme.colors.gitLaneColors] },
  }));

  const updateColor = useCallback(
    (key: keyof ThemeColors, value: string) => {
      setDraft((prev) => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
    },
    []
  );

  const handleSave = useCallback(() => {
    if (isNew) {
      addCustomTheme(draft);
    } else {
      updateCustomTheme(draft);
    }
    setTheme(draft.id);
    onBack();
  }, [draft, isNew, addCustomTheme, updateCustomTheme, setTheme, onBack]);

  return (
    <div className="theme-editor">
      <div className="theme-editor__top-bar">
        <button className="theme-editor__back" onClick={onBack}>Back</button>
        <input
          type="text"
          className="theme-editor__name-input"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
        <div className="theme-editor__mode-toggle">
          <button
            className={`theme-editor__mode-btn ${draft.mode === "dark" ? "theme-editor__mode-btn--active" : ""}`}
            onClick={() => setDraft({ ...draft, mode: "dark" })}
          >
            Dark
          </button>
          <button
            className={`theme-editor__mode-btn ${draft.mode === "light" ? "theme-editor__mode-btn--active" : ""}`}
            onClick={() => setDraft({ ...draft, mode: "light" })}
          >
            Light
          </button>
        </div>
        <button className="theme-editor__save" onClick={handleSave}>
          Save
        </button>
      </div>

      <div className="theme-editor__section">
        <div className="theme-editor__section-title">Essential Colors</div>
        <div className="theme-editor__color-grid">
          {essentialFields.map(({ key, label }) => (
            <ColorField
              key={key}
              label={label}
              value={draft.colors[key] as string}
              onChange={(v) => updateColor(key, v)}
            />
          ))}
        </div>
      </div>

      <div className="theme-editor__section">
        <div className="theme-editor__section-title">Terminal ANSI Colors</div>
        <div className="theme-editor__color-grid">
          {terminalFields.map(({ key, label }) => (
            <ColorField
              key={key}
              label={label}
              value={draft.colors[key] as string}
              onChange={(v) => updateColor(key, v)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
