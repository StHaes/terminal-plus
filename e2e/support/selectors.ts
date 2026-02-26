/** Centralized CSS selectors for E2E tests */
export const S = {
  // App shell
  app: ".app",
  appContent: ".app__content",
  appTerminals: ".app__terminals",
  appTerminalsWithGit: ".app__terminals--with-git",

  // TabBar
  tabBar: ".tab-bar",
  tab: ".tab-bar__tab",
  tabActive: ".tab-bar__tab--active",
  tabActions: ".tab-bar__actions",
  btnSplitH: '.tab-bar__btn[title*="Split Down"]',
  btnSplitV: '.tab-bar__btn[title*="Split Right"]',
  btnGit: '.tab-bar__btn[title*="Toggle Git Panel"]',
  btnSettings: '.tab-bar__btn[title="Settings"]',
  btnShortcuts: '.tab-bar__btn[title="Keyboard Shortcuts"]',

  // Terminal panes
  terminalPane: ".terminal-pane",
  terminalPaneFocused: ".terminal-pane--focused",
  terminalBody: ".terminal-pane__body",
  terminalHeader: ".terminal-header",
  terminalHeaderClose: ".terminal-header__close",

  // Search bar
  searchBar: ".search-bar",
  searchInput: ".search-bar__input",
  searchClose: ".search-bar__close",

  // Tile layout
  tileSplit: ".tile-split",
  tileSplitH: ".tile-split--horizontal",
  tileSplitV: ".tile-split--vertical",
  splitHandle: ".split-handle",

  // Git panel
  gitPanel: ".git-panel",
  gitPanelTitle: ".git-panel__title",
  gitPanelBranch: ".git-panel__branch",
  gitSearchInput: ".git-panel__search-input",
  gitSearchClear: ".git-panel__search-clear",
  gitCommitRow: ".git-commit-row",
  gitCommitSubject: ".git-commit-row__subject",
  gitPanelError: ".git-panel__error",
  gitPanelEmpty: ".git-panel__empty",
  gitPanelLoading: ".git-panel__loading",
  gitRefresh: ".git-panel__refresh",

  // Commit overlay
  commitOverlay: ".commit-overlay",
  commitOverlayPanel: ".commit-overlay__panel",
  commitOverlayClose: ".commit-overlay__close",
  commitOverlayHash: ".commit-overlay__hash",
  commitOverlaySubject: ".commit-overlay__subject",
  commitOverlayFiles: ".commit-overlay__files",
  commitOverlayDiff: ".commit-overlay__diff",

  // Settings overlay
  settingsOverlay: ".settings-overlay",
  settingsClose: ".settings-overlay__close",
  settingsTitle: ".settings-overlay__title",
  themeCard: ".theme-card",
  themeCardActive: ".theme-card--active",
  themeCardCreate: ".theme-card--create",
  themeCardName: ".theme-card__name",
  themeCardDelete: ".theme-card__action-btn--delete",
  themeCardEdit: ".theme-card__action-btn",
  themeEditorNameInput: ".theme-editor__name-input",
  themeEditorSave: ".theme-editor__save",
  themeEditorBack: ".theme-editor__back",

  // Shortcuts overlay
  shortcutsOverlay: ".shortcuts-overlay",
  shortcutsClose: ".shortcuts-overlay__close",
  shortcutsTitle: ".shortcuts-overlay__title",
  shortcutsRow: ".shortcuts-overlay__row",
  shortcutsLabel: ".shortcuts-overlay__label",
  shortcutsKbd: ".shortcuts-overlay__kbd",

  // File tree / diff (shared)
  fileTree: ".file-tree",
  fileTreeEntry: ".file-tree__entry",
  diffView: ".diff-view",
  diffLine: ".diff-line",
  diffLineAdd: ".diff-line--add",
  diffLineRemove: ".diff-line--remove",
} as const;
