export interface ThemeColors {
  // Backgrounds
  bgPrimary: string;
  bgSecondary: string;
  bgElevated: string;
  bgSurface: string;
  bgPrimarySolid: string;
  bgSecondarySolid: string;

  // Foreground
  fgPrimary: string;
  fgSecondary: string;
  fgMuted: string;
  fgDark: string;

  // Accents
  accentBlue: string;
  accentGreen: string;
  accentPurple: string;
  accentRed: string;
  accentOrange: string;
  accentCyan: string;

  // Borders
  borderColor: string;
  borderFocus: string;

  // Terminal ANSI colors
  termBackground: string;
  termForeground: string;
  termCursor: string;
  termCursorAccent: string;
  termSelectionBg: string;
  termSelectionFg: string;
  termBlack: string;
  termRed: string;
  termGreen: string;
  termYellow: string;
  termBlue: string;
  termMagenta: string;
  termCyan: string;
  termWhite: string;
  termBrightBlack: string;
  termBrightRed: string;
  termBrightGreen: string;
  termBrightYellow: string;
  termBrightBlue: string;
  termBrightMagenta: string;
  termBrightCyan: string;
  termBrightWhite: string;

  // Git graph
  gitLaneColors: string[];
  gitGraphFill: string;

  // Git badges
  gitBadgeHead: string;
  gitBadgeLocal: string;
  gitBadgeRemote: string;
  gitBadgeTag: string;

  // Diff / file status
  diffAddBg: string;
  diffRemoveBg: string;
  diffAddFg: string;
  diffRemoveFg: string;
  diffHunkBg: string;
  fileStatusAdd: string;
  fileStatusModify: string;
  fileStatusDelete: string;
  fileStatusRename: string;
}

export interface Theme {
  id: string;
  name: string;
  mode: "light" | "dark";
  colors: ThemeColors;
  isBuiltIn: boolean;
}
