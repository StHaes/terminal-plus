import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Theme } from "../types/theme";
import { builtInThemes, defaultThemeId } from "../lib/themes";
import { applyTheme } from "../lib/themeApplicator";

interface ThemeState {
  currentThemeId: string;
  customThemes: Theme[];

  // Cached derived values — updated by _recompute() after every mutation
  _currentTheme: Theme;
  _allThemes: Theme[];

  setTheme: (id: string) => void;
  addCustomTheme: (theme: Theme) => void;
  updateCustomTheme: (theme: Theme) => void;
  deleteCustomTheme: (id: string) => void;
}

function resolveCurrentTheme(currentThemeId: string, customThemes: Theme[]): Theme {
  return (
    builtInThemes.find((t) => t.id === currentThemeId) ??
    customThemes.find((t) => t.id === currentThemeId) ??
    builtInThemes[0]
  );
}

function resolveAllThemes(customThemes: Theme[]): Theme[] {
  return [...builtInThemes, ...customThemes];
}

export const useThemeStore = create<ThemeState>()(
  persist(
    immer((set, get) => ({
      currentThemeId: defaultThemeId,
      customThemes: [],
      _currentTheme: builtInThemes[0],
      _allThemes: [...builtInThemes],

      setTheme: (id) => {
        set((s) => {
          s.currentThemeId = id;
          s._currentTheme = resolveCurrentTheme(id, s.customThemes);
          s._allThemes = resolveAllThemes(s.customThemes);
        });
        applyTheme(get()._currentTheme);
      },

      addCustomTheme: (theme) => {
        set((s) => {
          s.customThemes.push(theme);
          s._allThemes = resolveAllThemes(s.customThemes);
        });
      },

      updateCustomTheme: (theme) => {
        set((s) => {
          const idx = s.customThemes.findIndex((t) => t.id === theme.id);
          if (idx !== -1) s.customThemes[idx] = theme;
          s._currentTheme = resolveCurrentTheme(s.currentThemeId, s.customThemes);
          s._allThemes = resolveAllThemes(s.customThemes);
        });
        if (get().currentThemeId === theme.id) {
          applyTheme(theme);
        }
      },

      deleteCustomTheme: (id) => {
        set((s) => {
          s.customThemes = s.customThemes.filter((t) => t.id !== id);
          if (s.currentThemeId === id) {
            s.currentThemeId = defaultThemeId;
          }
          s._currentTheme = resolveCurrentTheme(s.currentThemeId, s.customThemes);
          s._allThemes = resolveAllThemes(s.customThemes);
        });
        if (get().currentThemeId === defaultThemeId) {
          applyTheme(get()._currentTheme);
        }
      },
    })),
    {
      name: "terminal-plus-theme",
      partialize: (state) => ({
        currentThemeId: state.currentThemeId,
        customThemes: state.customThemes,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._currentTheme = resolveCurrentTheme(state.currentThemeId, state.customThemes);
          state._allThemes = resolveAllThemes(state.customThemes);
        }
      },
    }
  )
);
