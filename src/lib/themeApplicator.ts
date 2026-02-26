import type { Theme, ThemeColors } from "../types/theme";
import type { ITheme } from "@xterm/xterm";
import type { GitRefType } from "../types/git";
import { terminalInstances } from "./terminalRegistry";

/** Map from ThemeColors key to CSS variable name */
const cssVarMap: Record<string, string> = {
  bgPrimary: "--bg-primary",
  bgSecondary: "--bg-secondary",
  bgElevated: "--bg-elevated",
  bgSurface: "--bg-surface",
  bgPrimarySolid: "--bg-primary-solid",
  bgSecondarySolid: "--bg-secondary-solid",

  fgPrimary: "--fg-primary",
  fgSecondary: "--fg-secondary",
  fgMuted: "--fg-muted",
  fgDark: "--fg-dark",

  accentBlue: "--accent-blue",
  accentGreen: "--accent-green",
  accentPurple: "--accent-purple",
  accentRed: "--accent-red",
  accentOrange: "--accent-orange",
  accentCyan: "--accent-cyan",

  borderColor: "--border-color",
  borderFocus: "--border-focus",

  diffAddBg: "--diff-add-bg",
  diffRemoveBg: "--diff-remove-bg",
  diffAddFg: "--diff-add-fg",
  diffRemoveFg: "--diff-remove-fg",
  diffHunkBg: "--diff-hunk-bg",
  fileStatusAdd: "--file-status-add",
  fileStatusModify: "--file-status-modify",
  fileStatusDelete: "--file-status-delete",
  fileStatusRename: "--file-status-rename",
};

export function getXtermTheme(colors: ThemeColors): ITheme {
  return {
    background: colors.termBackground,
    foreground: colors.termForeground,
    cursor: colors.termCursor,
    cursorAccent: colors.termCursorAccent,
    selectionBackground: colors.termSelectionBg,
    selectionForeground: colors.termSelectionFg,
    black: colors.termBlack,
    red: colors.termRed,
    green: colors.termGreen,
    yellow: colors.termYellow,
    blue: colors.termBlue,
    magenta: colors.termMagenta,
    cyan: colors.termCyan,
    white: colors.termWhite,
    brightBlack: colors.termBrightBlack,
    brightRed: colors.termBrightRed,
    brightGreen: colors.termBrightGreen,
    brightYellow: colors.termBrightYellow,
    brightBlue: colors.termBrightBlue,
    brightMagenta: colors.termBrightMagenta,
    brightCyan: colors.termBrightCyan,
    brightWhite: colors.termBrightWhite,
  };
}

export function getGitLaneColor(colors: ThemeColors, lane: number): string {
  const arr = colors.gitLaneColors;
  return arr[lane % arr.length];
}

export function getGitBadgeColor(colors: ThemeColors, refType: GitRefType): string {
  switch (refType) {
    case "head": return colors.gitBadgeHead;
    case "localbranch": return colors.gitBadgeLocal;
    case "remotebranch": return colors.gitBadgeRemote;
    case "tag": return colors.gitBadgeTag;
  }
}

export function applyTheme(theme: Theme): void {
  const { colors } = theme;
  const style = document.documentElement.style;

  // Set CSS custom properties
  for (const [key, varName] of Object.entries(cssVarMap)) {
    const value = colors[key as keyof ThemeColors];
    if (typeof value === "string") {
      style.setProperty(varName, value);
    }
  }

  // Update all live xterm.js instances
  const xtermTheme = getXtermTheme(colors);
  for (const { term } of terminalInstances.values()) {
    term.options.theme = xtermTheme;
  }
}
