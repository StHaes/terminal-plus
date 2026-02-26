import "@testing-library/jest-dom/vitest";

// Mock Tauri APIs that aren't available in jsdom
vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    close: vi.fn(),
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
  }),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

// Mock xterm.js (not available in jsdom)
vi.mock("@xterm/xterm", () => {
  const Terminal = vi.fn().mockImplementation(() => ({
    loadAddon: vi.fn(),
    open: vi.fn(),
    write: vi.fn(),
    onData: vi.fn(() => ({ dispose: vi.fn() })),
    onTitleChange: vi.fn(() => ({ dispose: vi.fn() })),
    dispose: vi.fn(),
    options: {},
    element: document.createElement("div"),
    cols: 80,
    rows: 24,
    focus: vi.fn(),
  }));
  return { Terminal };
});

vi.mock("@xterm/addon-fit", () => {
  const FitAddon = vi.fn().mockImplementation(() => ({
    fit: vi.fn(),
    activate: vi.fn(),
    dispose: vi.fn(),
  }));
  return { FitAddon };
});
