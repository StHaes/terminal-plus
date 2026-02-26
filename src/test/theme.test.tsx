import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Unit: theme store ───────────────────────────────────────────────

describe("themeStore", () => {
  let useThemeStore: typeof import("../stores/themeStore").useThemeStore;

  beforeEach(async () => {
    localStorage.removeItem("terminal-plus-theme");
    const mod = await import("../stores/themeStore");
    useThemeStore = mod.useThemeStore;
    useThemeStore.setState({
      currentThemeId: "midnight-indigo",
      customThemes: [],
    });
  });

  it("should initialise with Midnight Indigo as default", () => {
    const state = useThemeStore.getState();
    expect(state.currentThemeId).toBe("midnight-indigo");
  });

  it("_currentTheme should return a valid theme object", () => {
    const theme = useThemeStore.getState()._currentTheme;
    expect(theme).toBeDefined();
    expect(theme.id).toBe("midnight-indigo");
    expect(theme.name).toBe("Midnight Indigo");
    expect(theme.colors).toBeDefined();
    expect(theme.colors.bgPrimary).toBeDefined();
  });

  it("_allThemes should contain the 4 built-in themes", () => {
    const themes = useThemeStore.getState()._allThemes;
    expect(themes.length).toBeGreaterThanOrEqual(4);
    const ids = themes.map((t) => t.id);
    expect(ids).toContain("midnight-indigo");
    expect(ids).toContain("dawn-light");
    expect(ids).toContain("obsidian");
    expect(ids).toContain("aurora");
  });

  it("setTheme() should switch to a different built-in theme", () => {
    useThemeStore.getState().setTheme("obsidian");
    expect(useThemeStore.getState().currentThemeId).toBe("obsidian");
    expect(useThemeStore.getState()._currentTheme.name).toBe("Obsidian");
  });

  it("addCustomTheme() should add a theme to customThemes and _allThemes", () => {
    const custom = {
      id: "test-custom",
      name: "Test Custom",
      mode: "dark" as const,
      isBuiltIn: false,
      colors: useThemeStore.getState()._currentTheme.colors,
    };
    useThemeStore.getState().addCustomTheme(custom);
    const all = useThemeStore.getState()._allThemes;
    expect(all.find((t) => t.id === "test-custom")).toBeDefined();
  });

  it("deleteCustomTheme() of active theme should fall back to default", () => {
    const colors = useThemeStore.getState()._currentTheme.colors;
    useThemeStore.getState().addCustomTheme({
      id: "to-delete",
      name: "Delete Me",
      mode: "dark",
      isBuiltIn: false,
      colors,
    });
    useThemeStore.getState().setTheme("to-delete");
    expect(useThemeStore.getState().currentThemeId).toBe("to-delete");

    useThemeStore.getState().deleteCustomTheme("to-delete");
    expect(useThemeStore.getState().currentThemeId).toBe("midnight-indigo");
  });
});

// ── Unit: theme applicator ──────────────────────────────────────────

describe("themeApplicator", () => {
  it("applyTheme() should set CSS variables on document.documentElement", async () => {
    const { applyTheme } = await import("../lib/themeApplicator");
    const { builtInThemes } = await import("../lib/themes");
    const theme = builtInThemes[0];

    applyTheme(theme);

    const style = document.documentElement.style;
    expect(style.getPropertyValue("--bg-primary")).toBe(theme.colors.bgPrimary);
    expect(style.getPropertyValue("--fg-primary")).toBe(theme.colors.fgPrimary);
    expect(style.getPropertyValue("--accent-blue")).toBe(theme.colors.accentBlue);
  });

  it("getXtermTheme() should return a valid xterm theme object", async () => {
    const { getXtermTheme } = await import("../lib/themeApplicator");
    const { builtInThemes } = await import("../lib/themes");
    const xtermTheme = getXtermTheme(builtInThemes[0].colors);

    expect(xtermTheme.foreground).toBe("#D5F5E3");
    expect(xtermTheme.background).toBe("#00000000");
    expect(xtermTheme.red).toBe("#FF6B8A");
  });

  it("getGitLaneColor() should cycle through lane colors", async () => {
    const { getGitLaneColor } = await import("../lib/themeApplicator");
    const { builtInThemes } = await import("../lib/themes");
    const colors = builtInThemes[0].colors;

    expect(getGitLaneColor(colors, 0)).toBe(colors.gitLaneColors[0]);
    expect(getGitLaneColor(colors, 8)).toBe(colors.gitLaneColors[0]);
  });

  it("getGitBadgeColor() should return correct color per ref type", async () => {
    const { getGitBadgeColor } = await import("../lib/themeApplicator");
    const { builtInThemes } = await import("../lib/themes");
    const colors = builtInThemes[0].colors;

    expect(getGitBadgeColor(colors, "head")).toBe(colors.gitBadgeHead);
    expect(getGitBadgeColor(colors, "tag")).toBe(colors.gitBadgeTag);
  });
});

// ── Behavior: SettingsOverlay renders and shows theme grid ──────────

describe("SettingsOverlay", () => {
  beforeEach(() => {
    localStorage.removeItem("terminal-plus-theme");
  });

  it("should render without crashing", async () => {
    const { SettingsOverlay } = await import(
      "../components/settings/SettingsOverlay"
    );
    render(<SettingsOverlay onClose={vi.fn()} />);
    expect(document.body.querySelector(".settings-overlay")).toBeInTheDocument();
  });

  it("should display the 'Themes' title", async () => {
    const { SettingsOverlay } = await import(
      "../components/settings/SettingsOverlay"
    );
    render(<SettingsOverlay onClose={vi.fn()} />);
    expect(screen.getByText("Themes")).toBeInTheDocument();
  });

  it("should close when Escape is pressed", async () => {
    const { SettingsOverlay } = await import(
      "../components/settings/SettingsOverlay"
    );
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<SettingsOverlay onClose={onClose} />);
    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });

  it("should close when clicking the backdrop", async () => {
    const { SettingsOverlay } = await import(
      "../components/settings/SettingsOverlay"
    );
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<SettingsOverlay onClose={onClose} />);
    const backdrop = document.body.querySelector(".settings-overlay")!;
    await user.click(backdrop);

    expect(onClose).toHaveBeenCalled();
  });
});

// ── Behavior: ThemeGrid shows themes and allows switching ───────────

describe("ThemeGrid", () => {
  beforeEach(async () => {
    localStorage.removeItem("terminal-plus-theme");
    const { useThemeStore } = await import("../stores/themeStore");
    useThemeStore.setState({
      currentThemeId: "midnight-indigo",
      customThemes: [],
    });
  });

  it("should render all 4 built-in themes", async () => {
    const { ThemeGrid } = await import("../components/settings/ThemeGrid");

    render(<ThemeGrid onEditTheme={vi.fn()} />);

    expect(screen.getByText("Midnight Indigo")).toBeInTheDocument();
    expect(screen.getByText("Dawn Light")).toBeInTheDocument();
    expect(screen.getByText("Obsidian")).toBeInTheDocument();
    expect(screen.getByText("Aurora")).toBeInTheDocument();
  });

  it("should render a 'Create Custom' button", async () => {
    const { ThemeGrid } = await import("../components/settings/ThemeGrid");

    render(<ThemeGrid onEditTheme={vi.fn()} />);

    expect(screen.getByText("Create Custom")).toBeInTheDocument();
  });

  it("should mark Midnight Indigo as active by default", async () => {
    const { ThemeGrid } = await import("../components/settings/ThemeGrid");

    const { container } = render(<ThemeGrid onEditTheme={vi.fn()} />);

    const activeCard = container.querySelector(".theme-card--active");
    expect(activeCard).toBeInTheDocument();
    expect(within(activeCard!).getByText("Midnight Indigo")).toBeInTheDocument();
  });

  it("should switch theme when clicking a different card", async () => {
    const { ThemeGrid } = await import("../components/settings/ThemeGrid");
    const { useThemeStore } = await import("../stores/themeStore");
    const user = userEvent.setup();

    render(<ThemeGrid onEditTheme={vi.fn()} />);

    await user.click(screen.getByText("Obsidian"));

    expect(useThemeStore.getState().currentThemeId).toBe("obsidian");
  });

  it("should open editor when clicking 'Create Custom'", async () => {
    const { ThemeGrid } = await import("../components/settings/ThemeGrid");
    const user = userEvent.setup();
    const onEditTheme = vi.fn();

    render(<ThemeGrid onEditTheme={onEditTheme} />);

    await user.click(screen.getByText("Create Custom"));

    expect(onEditTheme).toHaveBeenCalled();
  });
});

// ── Behavior: CustomThemeEditor ─────────────────────────────────────

describe("CustomThemeEditor", () => {
  let testTheme: import("../types/theme").Theme;

  beforeEach(async () => {
    localStorage.removeItem("terminal-plus-theme");
    const { useThemeStore } = await import("../stores/themeStore");
    useThemeStore.setState({
      currentThemeId: "midnight-indigo",
      customThemes: [],
    });
    const colors = useThemeStore.getState()._currentTheme.colors;
    testTheme = {
      id: "test-edit",
      name: "My Theme",
      mode: "dark",
      isBuiltIn: false,
      colors,
    };
    // Add theme to store for "existing theme" tests
    useThemeStore.getState().addCustomTheme(testTheme);
  });

  it("should render with theme name in input", async () => {
    const { CustomThemeEditor } = await import(
      "../components/settings/CustomThemeEditor"
    );

    render(<CustomThemeEditor theme={testTheme} onBack={vi.fn()} />);

    expect(screen.getByDisplayValue("My Theme")).toBeInTheDocument();
  });

  it("should show 'Back' button that calls onBack", async () => {
    const { CustomThemeEditor } = await import(
      "../components/settings/CustomThemeEditor"
    );
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(<CustomThemeEditor theme={testTheme} onBack={onBack} />);

    await user.click(screen.getByText("Back"));
    expect(onBack).toHaveBeenCalled();
  });

  it("should not persist a new theme when going back without saving", async () => {
    const { CustomThemeEditor } = await import(
      "../components/settings/CustomThemeEditor"
    );
    const { useThemeStore } = await import("../stores/themeStore");
    const user = userEvent.setup();
    const onBack = vi.fn();

    const newTheme: import("../types/theme").Theme = {
      id: "unsaved-new",
      name: "Unsaved Theme",
      mode: "dark",
      isBuiltIn: false,
      colors: testTheme.colors,
    };

    render(<CustomThemeEditor theme={newTheme} onBack={onBack} />);

    await user.click(screen.getByText("Back"));

    const all = useThemeStore.getState()._allThemes;
    expect(all.find((t) => t.id === "unsaved-new")).toBeUndefined();
  });
});
