/**
 * Tauri IPC mock script — injected via page.addInitScript() before the app loads.
 * Defines window.__TAURI_INTERNALS__ to intercept all invoke/listen calls.
 *
 * Types are duplicated here (rather than imported from src/types/git) because
 * this file runs under ts-node in CJS mode, which can't resolve the main
 * project's bundler-style module paths.
 */

interface GitRef {
  name: string;
  ref_type: "head" | "localbranch" | "remotebranch" | "tag";
}

interface GitCommit {
  hash: string;
  short_hash: string;
  parents: string[];
  author_name: string;
  author_email: string;
  date: string;
  subject: string;
  refs: GitRef[];
}

interface GitLogResult {
  commits: GitCommit[];
  current_branch: string | null;
}

interface CommitFile {
  path: string;
  status: string;
}

interface DiffLine {
  kind: "add" | "remove" | "context";
  content: string;
  old_lineno: number | null;
  new_lineno: number | null;
}

interface DiffHunk {
  old_start: number;
  old_count: number;
  new_start: number;
  new_count: number;
  lines: DiffLine[];
}

interface FileDiff {
  path: string;
  hunks: DiffHunk[];
}

// Default fixture data used by the mock
export const DEFAULT_GIT_LOG: GitLogResult = {
  commits: [
    {
      hash: "abc1234567890abcdef1234567890abcdef123456",
      short_hash: "abc1234",
      parents: ["def5678901234abcdef5678901234abcdef567890"],
      author_name: "Alice",
      author_email: "alice@test.com",
      date: "2025-06-01T12:00:00+00:00",
      subject: "feat: add dark mode",
      refs: [{ name: "main", ref_type: "head" as const }],
    },
    {
      hash: "def5678901234abcdef5678901234abcdef567890",
      short_hash: "def5678",
      parents: [],
      author_name: "Bob",
      author_email: "bob@test.com",
      date: "2025-05-31T10:00:00+00:00",
      subject: "Initial commit",
      refs: [],
    },
  ],
  current_branch: "main",
};

export const DEFAULT_COMMIT_FILES: CommitFile[] = [
  { path: "src/theme.ts", status: "A" },
  { path: "src/App.tsx", status: "M" },
];

export const DEFAULT_FILE_DIFF: FileDiff = {
  path: "src/theme.ts",
  hunks: [
    {
      old_start: 0,
      old_count: 0,
      new_start: 1,
      new_count: 3,
      lines: [
        { kind: "add", content: "export const darkMode = true;", old_lineno: null, new_lineno: 1 },
        { kind: "add", content: "", old_lineno: null, new_lineno: 2 },
        { kind: "add", content: "export default darkMode;", old_lineno: null, new_lineno: 3 },
      ],
    },
  ],
};

/**
 * Returns a JS string that, when evaluated in the browser, sets up the full
 * Tauri IPC mock. Pass fixture data as JSON-serializable objects.
 */
export function buildTauriMockScript(opts?: {
  gitIsRepo?: boolean;
  gitLog?: GitLogResult;
  commitFiles?: CommitFile[];
  fileDiff?: FileDiff;
}): string {
  const gitIsRepo = opts?.gitIsRepo ?? true;
  const gitLog = JSON.stringify(opts?.gitLog ?? DEFAULT_GIT_LOG);
  const commitFiles = JSON.stringify(opts?.commitFiles ?? DEFAULT_COMMIT_FILES);
  const fileDiff = JSON.stringify(opts?.fileDiff ?? DEFAULT_FILE_DIFF);

  return `
    (() => {
      // Event listener registry: eventName -> Set<callbackId>
      const listeners = new Map();
      let nextListenerId = 1;
      const listenerCallbacks = new Map(); // id -> { event, callback }

      // Expose emit function for step definitions to simulate PTY output etc.
      window.__TAURI_MOCK_EMIT__ = (eventName, payload) => {
        const ids = listeners.get(eventName);
        if (!ids) return;
        for (const id of ids) {
          const entry = listenerCallbacks.get(id);
          if (entry) {
            entry.callback({ event: eventName, payload, id });
          }
        }
      };

      // Track PTY sessions for assertions
      window.__TAURI_MOCK_PTY_SESSIONS__ = new Map();

      window.__TAURI_INTERNALS__ = {
        invoke(cmd, args) {
          // Plugin-style commands: "plugin:event|listen", "plugin:event|unlisten", etc.
          if (cmd === "plugin:event|listen") {
            const { event, handler } = args || {};
            const id = nextListenerId++;
            if (!listeners.has(event)) listeners.set(event, new Set());
            listeners.get(event).add(id);
            listenerCallbacks.set(id, { event, callback: handler });
            return Promise.resolve(id);
          }
          if (cmd === "plugin:event|unlisten") {
            const { event, eventId } = args || {};
            const ids = listeners.get(event);
            if (ids) ids.delete(eventId);
            listenerCallbacks.delete(eventId);
            return Promise.resolve();
          }

          // Window plugin commands — no-op
          if (cmd.startsWith("plugin:window|")) {
            return Promise.resolve();
          }

          // PTY commands
          if (cmd === "pty_create") {
            const { sessionId, cols, rows, cwd } = args || {};
            window.__TAURI_MOCK_PTY_SESSIONS__.set(sessionId, { cols, rows, cwd });
            // Simulate initial shell output after a small delay
            setTimeout(() => {
              const base64 = btoa("user@mock ~ % ");
              window.__TAURI_MOCK_EMIT__("pty-output-" + sessionId, base64);
            }, 50);
            return Promise.resolve();
          }
          if (cmd === "pty_write") {
            return Promise.resolve();
          }
          if (cmd === "pty_resize") {
            const { sessionId, cols, rows } = args || {};
            const session = window.__TAURI_MOCK_PTY_SESSIONS__.get(sessionId);
            if (session) { session.cols = cols; session.rows = rows; }
            return Promise.resolve();
          }
          if (cmd === "pty_destroy") {
            const { sessionId } = args || {};
            window.__TAURI_MOCK_PTY_SESSIONS__.delete(sessionId);
            return Promise.resolve();
          }
          if (cmd === "pty_get_cwd") {
            return Promise.resolve("/mock/home");
          }

          // File system commands
          if (cmd === "read_file") {
            return Promise.resolve("# Mock File\\nContent here.");
          }
          if (cmd === "write_file") {
            return Promise.resolve();
          }
          if (cmd === "list_dir") {
            return Promise.resolve([
              { name: "src", is_dir: true },
              { name: "README.md", is_dir: false },
            ]);
          }

          // Git commands
          if (cmd === "git_is_repo") {
            return Promise.resolve(${gitIsRepo});
          }
          if (cmd === "git_log") {
            return Promise.resolve(${gitLog});
          }
          if (cmd === "git_commit_files") {
            return Promise.resolve(${commitFiles});
          }
          if (cmd === "git_file_diff") {
            return Promise.resolve(${fileDiff});
          }
          if (cmd === "git_local_changes") {
            return Promise.resolve([]);
          }
          if (cmd === "git_local_file_diff") {
            return Promise.resolve({ path: "", hunks: [] });
          }

          console.warn("[tauri-mock] Unhandled command:", cmd, args);
          return Promise.resolve(null);
        },

        convertFileSrc(filePath, protocol) {
          return "asset://localhost/" + encodeURIComponent(filePath);
        },

        metadata() {
          return {
            currentWindow: { label: "main" },
            currentWebview: { label: "main", windowLabel: "main" },
          };
        },
      };

      // Also mock the Tauri event system that @tauri-apps/api/event uses
      window.__TAURI_INTERNALS__.transformCallback = (callback, once) => {
        const id = nextListenerId++;
        window["_" + id] = callback;
        return id;
      };
    })();
  `;
}

/**
 * Override script for @git-not-repo scenarios.
 * Patches git_is_repo to return false and git_log to reject.
 */
export const GIT_NOT_REPO_OVERRIDE = `
  (() => {
    const origInvoke = window.__TAURI_INTERNALS__.invoke;
    window.__TAURI_INTERNALS__.invoke = function(cmd, args) {
      if (cmd === "git_is_repo") return Promise.resolve(false);
      if (cmd === "git_log") return Promise.reject(new Error("not a git repository"));
      return origInvoke.call(this, cmd, args);
    };
  })();
`;
