import { useEffect, useCallback, useRef, useState, memo } from "react";
import { listen } from "@tauri-apps/api/event";
import { useTerminal, destroyPtySession } from "./useTerminal";
import { TerminalHeader } from "./TerminalHeader";
import { SearchBar } from "./SearchBar";
import { useTerminalStore } from "../../stores/terminalStore";
import { useTileStore } from "../../stores/tileStore";
import { ptyWrite } from "../../lib/ipc";

/** Escape a file path for pasting into a shell (backslash-escape specials). */
function escapeShellPath(path: string): string {
  return path.replace(/([ \\'"()&;|<>!$`#{}[\]?*~])/g, "\\$1");
}

interface TerminalPaneProps {
  sessionId: string;
  leafId: string;
  isFocused: boolean;
}

export const TerminalPane = memo(function TerminalPane({
  sessionId,
  leafId,
  isFocused,
}: TerminalPaneProps) {
  const addSession = useTerminalStore((s) => s.addSession);
  const removeSession = useTerminalStore((s) => s.removeSession);
  const updateTitle = useTerminalStore((s) => s.updateTitle);
  const searchActiveSessionId = useTerminalStore((s) => s.searchActiveSessionId);
  const closeSearch = useTerminalStore((s) => s.closeSearch);
  const closePane = useTileStore((s) => s.closePane);
  const setFocus = useTileStore((s) => s.setFocus);

  const showSearch = searchActiveSessionId === sessionId;

  const paneRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    addSession({ id: sessionId, title: "Terminal", cwd: "" });
    return () => {
      removeSession(sessionId);
    };
  }, [sessionId, addSession, removeSession]);

  const onTitleChange = useCallback(
    (title: string) => updateTitle(sessionId, title),
    [sessionId, updateTitle]
  );

  const { attach, focus, fit } = useTerminal({
    sessionId,
    onTitleChange,
  });

  useEffect(() => {
    if (isFocused) {
      requestAnimationFrame(() => {
        focus();
        fit();
      });
    }
  }, [isFocused, focus, fit]);

  // Tauri drag-drop events — write escaped file paths into the terminal
  useEffect(() => {
    const el = paneRef.current;
    if (!el) return;

    const isInside = (x: number, y: number) => {
      const rect = el.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    };

    const unlisteners: Promise<() => void>[] = [];

    unlisteners.push(
      listen<{ paths: string[]; position: { x: number; y: number } }>(
        "tauri://drag-enter",
        (e) => {
          if (isInside(e.payload.position.x, e.payload.position.y)) {
            setDragOver(true);
          }
        }
      )
    );

    unlisteners.push(
      listen<{ position: { x: number; y: number } }>(
        "tauri://drag-over",
        (e) => {
          const inside = isInside(e.payload.position.x, e.payload.position.y);
          setDragOver(inside);
        }
      )
    );

    unlisteners.push(
      listen("tauri://drag-leave", () => {
        setDragOver(false);
      })
    );

    unlisteners.push(
      listen<{ paths: string[]; position: { x: number; y: number } }>(
        "tauri://drag-drop",
        (e) => {
          setDragOver(false);
          if (!isInside(e.payload.position.x, e.payload.position.y)) return;

          const text = e.payload.paths.map(escapeShellPath).join(" ");
          ptyWrite(sessionId, btoa(text)).catch(() => {});
        }
      )
    );

    return () => {
      unlisteners.forEach((p) => p.then((u) => u()));
      setDragOver(false);
    };
  }, [sessionId]);

  const handleClose = useCallback(() => {
    const destroyedSessionId = closePane(leafId);
    if (destroyedSessionId) {
      destroyPtySession(destroyedSessionId).catch(() => {});
    }
  }, [leafId, closePane]);

  const handleSearchClose = useCallback(() => {
    closeSearch();
    requestAnimationFrame(() => focus());
  }, [closeSearch, focus]);

  return (
    <div
      ref={paneRef}
      className={`terminal-pane ${isFocused ? "terminal-pane--focused" : ""} ${dragOver ? "terminal-pane--drag-over" : ""}`}
      onMouseDown={() => setFocus(leafId)}
    >
      <TerminalHeader
        sessionId={sessionId}
        leafId={leafId}
        isFocused={isFocused}
        onClose={handleClose}
      />
      {showSearch && (
        <SearchBar sessionId={sessionId} onClose={handleSearchClose} />
      )}
      <div className="terminal-pane__body" ref={attach} />
    </div>
  );
});
