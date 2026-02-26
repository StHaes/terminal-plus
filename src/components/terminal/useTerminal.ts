import { useEffect, useRef, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { ptyCreate, ptyWrite, ptyResize, ptyDestroy, ptyGetCwd, listDir, onPtyOutput, onPtyExit } from "../../lib/ipc";
import { getXtermTheme } from "../../lib/themeApplicator";
import { useThemeStore } from "../../stores/themeStore";
import { terminalInstances } from "../../lib/terminalRegistry";
import { useMarkdownStore } from "../../stores/markdownStore";

// Module-level registries — survive React remounts (tree restructuring).
// PTYs are created once and only destroyed via destroyPtySession (explicit close).
const activePtys = new Set<string>();

export function destroyPtySession(sessionId: string) {
  activePtys.delete(sessionId);
  const entry = terminalInstances.get(sessionId);
  if (entry) {
    entry.term.dispose();
    terminalInstances.delete(sessionId);
  }
  return ptyDestroy(sessionId);
}

interface UseTerminalOptions {
  sessionId: string;
  cwd?: string;
  onTitleChange?: (title: string) => void;
}

export function useTerminal({ sessionId, cwd, onTitleChange }: UseTerminalOptions) {
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const onTitleChangeRef = useRef(onTitleChange);
  onTitleChangeRef.current = onTitleChange;

  const attach = useCallback((element: HTMLDivElement | null) => {
    containerRef.current = element;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let term: Terminal;
    let fitAddon: FitAddon;

    const existing = terminalInstances.get(sessionId);
    if (existing) {
      // Reuse existing terminal — reparent its DOM into the new container
      term = existing.term;
      fitAddon = existing.fitAddon;
      if (term.element) {
        el.appendChild(term.element);
      }
    } else {
      // Brand-new session — create terminal
      term = new Terminal({
        cursorBlink: false,
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
        scrollback: 5000,
        theme: getXtermTheme(useThemeStore.getState()._currentTheme.colors),
        allowProposedApi: true,
      });
      fitAddon = new FitAddon();
      const searchAddon = new SearchAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(searchAddon);
      term.loadAddon(new WebLinksAddon());
      term.open(el);

      // Custom link provider for .md files
      term.registerLinkProvider({
        provideLinks(lineNumber, callback) {
          const line = term.buffer.active.getLine(lineNumber - 1);
          if (!line) { callback(undefined); return; }
          const text = line.translateToString();
          const links: import("@xterm/xterm").ILink[] = [];
          // Match paths ending in .md (relative or absolute)
          const mdRegex = /(?:^|\s)((?:\.{0,2}\/)?[\w./_-]*\.md)\b/g;
          let match: RegExpExecArray | null;
          while ((match = mdRegex.exec(text)) !== null) {
            const filePath = match[1];
            const startX = match.index + match[0].length - filePath.length;
            links.push({
              range: { start: { x: startX + 1, y: lineNumber }, end: { x: startX + filePath.length + 1, y: lineNumber } },
              text: filePath,
              activate() {
                ptyGetCwd(sessionId).then((cwd) => {
                  if (!cwd) return;
                  const absPath = filePath.startsWith("/") ? filePath : `${cwd}/${filePath}`;
                  useMarkdownStore.getState().openPreview(absPath);
                }).catch(() => {});
              },
            });
          }
          callback(links.length > 0 ? links : undefined);
        },
      });

      // Custom link provider for directories — looks up real directory names
      // from the filesystem and matches them in the terminal line text.
      term.registerLinkProvider({
        provideLinks(lineNumber, callback) {
          const line = term.buffer.active.getLine(lineNumber - 1);
          if (!line) { callback(undefined); return; }
          const text = line.translateToString();

          ptyGetCwd(sessionId).then((cwd) => {
            if (!cwd) { callback(undefined); return; }
            return listDir(cwd).then((entries) => {
              const dirNames = entries.filter((e) => e.is_dir).map((e) => e.name);
              const links: import("@xterm/xterm").ILink[] = [];

              for (const dirName of dirNames) {
                // Find all occurrences of this directory name as a whole word in the line
                const escaped = dirName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const re = new RegExp(`(?:^|\\s)(${escaped}/?)(?=\\s|$)`, "g");
                let match: RegExpExecArray | null;
                while ((match = re.exec(text)) !== null) {
                  const matched = match[1];
                  const startX = match.index + match[0].length - matched.length;
                  links.push({
                    range: { start: { x: startX + 1, y: lineNumber }, end: { x: startX + matched.length + 1, y: lineNumber } },
                    text: matched,
                    decorations: { pointerCursor: true, underline: true },
                    activate() {
                      const esc = dirName.replace(/'/g, "'\\''");
                      const cmd = `cd '${esc}' && ls\n`;
                      ptyWrite(sessionId, btoa(cmd)).catch(() => {});
                    },
                  });
                }
              }
              callback(links.length > 0 ? links : undefined);
            });
          }).catch(() => { callback(undefined); });
        },
      });

      terminalInstances.set(sessionId, { term, fitAddon, searchAddon });
    }

    termRef.current = term;
    fitRef.current = fitAddon;

    const titleDisposable = term.onTitleChange((title) => {
      onTitleChangeRef.current?.(title);
    });

    let unlistenOutput: (() => void) | null = null;
    let unlistenExit: (() => void) | null = null;
    let dataDisposable: { dispose(): void } | null = null;
    let disposed = false;
    let ptyInitialized = false;

    const wireIO = () => {
      if (disposed) return;

      dataDisposable = term.onData((data) => {
        ptyWrite(sessionId, btoa(data)).catch(() => {});
      });

      onPtyOutput(sessionId, (base64Data) => {
        if (disposed) return;
        const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        term.write(bytes);
      }).then((u) => { unlistenOutput = u; });

      onPtyExit(sessionId, () => {
        if (disposed) return;
        term.write("\r\n\x1b[90m[Process exited]\x1b[0m\r\n");
      }).then((u) => { unlistenExit = u; });
    };

    // Use the ResizeObserver to drive PTY creation.  It only fires once the
    // browser has actually laid out the element, so we always get real
    // dimensions — even when a split needs several frames to settle.
    const resizeObserver = new ResizeObserver((entries) => {
      if (disposed || !fitRef.current || !termRef.current) return;

      // Skip zero-size observations (element not visible yet)
      const rect = entries[0]?.contentRect;
      if (rect && rect.width === 0 && rect.height === 0) return;

      fitRef.current.fit();
      const { cols: c, rows: r } = termRef.current;

      if (!ptyInitialized) {
        ptyInitialized = true;

        if (!activePtys.has(sessionId)) {
          // First time this session is mounted — create the PTY
          activePtys.add(sessionId);
          ptyCreate(sessionId, c, r, cwd).then(() => {
            wireIO();
          });
        } else {
          // PTY already exists (component remounted after tree restructuring)
          // Just reattach listeners; also sync the terminal size
          ptyResize(sessionId, c, r).catch(() => {});
          wireIO();
        }
      } else {
        // Subsequent resizes — just forward the new size
        ptyResize(sessionId, c, r).catch(() => {});
      }
    });
    resizeObserver.observe(el);

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      unlistenOutput?.();
      unlistenExit?.();
      titleDisposable.dispose();
      dataDisposable?.dispose();
      // Detach terminal DOM from the container but keep the Terminal alive.
      // Scrollback and all internal state are preserved in the Terminal instance.
      if (term.element && el.contains(term.element)) {
        el.removeChild(term.element);
      }
      termRef.current = null;
      fitRef.current = null;
      // DO NOT destroy the PTY or dispose the Terminal here — they survive
      // React remounts. Only destroyPtySession does that (explicit close).
    };
  }, [sessionId, cwd]);

  const focus = useCallback(() => {
    termRef.current?.focus();
  }, []);

  const fit = useCallback(() => {
    fitRef.current?.fit();
  }, []);

  return { attach, focus, fit };
}
