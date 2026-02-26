import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useGitStore } from "../../stores/gitStore";
import { useTileStore } from "../../stores/tileStore";
import { findLeafById } from "../../lib/tileTree";
import {
  gitLocalChanges,
  gitLocalFileDiff,
  ptyGetCwd,
  readFile,
  writeFile,
} from "../../lib/ipc";
import { FileTree, buildFileTree } from "./FileTree";
import { DiffView } from "./DiffView";
import { highlightLines } from "../../lib/highlight";
import {
  tabIndent,
  tabDedent,
  enterAutoIndent,
  autoCloseBracket,
  backspaceDeletePair,
} from "../../lib/editorActions";
import type { CommitFile, FileDiff, FileTreeNode } from "../../types/git";

type ViewMode = "diff" | "edit";

export function LocalChangesOverlay() {
  const isOpen = useGitStore((s) => s.localChangesOpen);
  const close = useGitStore((s) => s.closeLocalChanges);

  const focusedSessionId = useTileStore((s) => {
    const leaf = findLeafById(s.root, s.focusedLeafId);
    return leaf?.sessionId ?? null;
  });

  const [files, setFiles] = useState<CommitFile[]>([]);
  const [tree, setTree] = useState<FileTreeNode | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [diff, setDiff] = useState<FileDiff | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<ViewMode>("diff");
  const [editContent, setEditContent] = useState("");
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const cwdRef = useRef("");

  const selectedFile = files.find((f) => f.path === selectedPath);
  const isDeleted = selectedFile?.status === "D";

  // Load changed files
  const loadFiles = useCallback(async () => {
    if (!focusedSessionId) return;
    setLoadingFiles(true);
    setError(null);
    try {
      const cwd = await ptyGetCwd(focusedSessionId);
      cwdRef.current = cwd;
      const result = await gitLocalChanges(cwd);
      setFiles(result);
      setTree(buildFileTree(result));
      // Auto-select first file if current selection is gone
      setSelectedPath((prev) => {
        if (prev && result.some((f) => f.path === prev)) return prev;
        return result.length > 0 ? result[0].path : null;
      });
    } catch (e) {
      setError(String(e));
    } finally {
      setLoadingFiles(false);
    }
  }, [focusedSessionId]);

  // Load files when overlay opens
  useEffect(() => {
    if (!isOpen) return;
    setMode("diff");
    setDiff(null);
    setFiles([]);
    setTree(null);
    setSelectedPath(null);
    loadFiles();
  }, [isOpen, loadFiles]);

  // Load diff when selected path changes
  useEffect(() => {
    if (!isOpen || !selectedPath) {
      setDiff(null);
      return;
    }
    let cancelled = false;

    (async () => {
      setLoadingDiff(true);
      try {
        const result = await gitLocalFileDiff(cwdRef.current, selectedPath);
        if (!cancelled) setDiff(result);
      } catch {
        if (!cancelled) setDiff(null);
      } finally {
        if (!cancelled) setLoadingDiff(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedPath]);

  // Load file content for edit mode
  useEffect(() => {
    if (mode !== "edit" || !selectedPath || isDeleted) return;
    let cancelled = false;

    (async () => {
      setLoadingEdit(true);
      try {
        const content = await readFile(cwdRef.current + "/" + selectedPath);
        if (!cancelled) setEditContent(content);
      } catch {
        if (!cancelled) setEditContent("");
      } finally {
        if (!cancelled) setLoadingEdit(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, selectedPath, isDeleted]);

  // Save file
  const handleSave = useCallback(async () => {
    if (!selectedPath || isDeleted) return;
    setSaving(true);
    try {
      await writeFile(cwdRef.current + "/" + selectedPath, editContent);
      // Refresh file list and diff
      await loadFiles();
      // Re-fetch diff for current file
      try {
        const result = await gitLocalFileDiff(cwdRef.current, selectedPath);
        setDiff(result);
      } catch {
        setDiff(null);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }, [selectedPath, isDeleted, editContent, loadFiles]);

  const handleSelect = useCallback(
    (path: string) => {
      setSelectedPath(path);
      setMode("diff");
    },
    []
  );

  // Escape key handling
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mode === "edit") {
          setMode("diff");
        } else {
          close();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, mode, close]);

  // Cmd+S to save in edit mode
  useEffect(() => {
    if (!isOpen || mode !== "edit") return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, mode, handleSave]);

  if (!isOpen) return null;

  return createPortal(
    <div className="local-changes" onClick={close}>
      <div className="local-changes__panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="local-changes__header">
          <div className="local-changes__title">Local Changes</div>
          <div className="local-changes__meta">
            {files.length} file{files.length !== 1 ? "s" : ""} changed
          </div>
          <button className="local-changes__close" onClick={close}>
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="local-changes__body">
          {error && <div className="local-changes__error">{error}</div>}

          {/* Left: file tree */}
          <div className="local-changes__files">
            {loadingFiles ? (
              <div className="local-changes__loading">Loading files...</div>
            ) : tree ? (
              <FileTree root={tree} selectedPath={selectedPath} onSelect={handleSelect} />
            ) : (
              <div className="local-changes__loading">No local changes</div>
            )}
          </div>

          {/* Right: diff or editor */}
          <div className="local-changes__content">
            {/* Mode toggle bar */}
            {selectedPath && (
              <div className="local-changes__mode-bar">
                <button
                  className={`local-changes__mode-btn ${mode === "diff" ? "local-changes__mode-btn--active" : ""}`}
                  onClick={() => setMode("diff")}
                >
                  Diff
                </button>
                <button
                  className={`local-changes__mode-btn ${mode === "edit" ? "local-changes__mode-btn--active" : ""}`}
                  onClick={() => setMode("edit")}
                  disabled={isDeleted}
                  title={isDeleted ? "File has been deleted" : "Edit file"}
                >
                  Edit
                </button>
                {mode === "edit" && (
                  <button
                    className="local-changes__save-btn"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                )}
              </div>
            )}

            {/* Content area */}
            <div className="local-changes__viewer">
              {mode === "diff" ? (
                <DiffView diff={diff} loading={loadingDiff} />
              ) : loadingEdit ? (
                <div className="local-changes__loading">Loading file...</div>
              ) : (
                <HighlightedEditor
                  value={editContent}
                  onChange={setEditContent}
                  filePath={selectedPath ?? ""}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// --- Highlighted editor: transparent textarea layered over a <pre> with syntax colors ---

interface HighlightedEditorProps {
  value: string;
  onChange: (value: string) => void;
  filePath: string;
}

function HighlightedEditor({ value, onChange, filePath }: HighlightedEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  // Debounce highlighting so typing stays responsive on large files.
  // The textarea always shows the latest text (transparent or plain),
  // while the highlighted <pre> updates after a short delay.
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), 50);
    return () => clearTimeout(id);
  }, [value]);

  // Reset immediately when switching files
  useEffect(() => {
    setDebouncedValue(value);
  }, [filePath]); // eslint-disable-line react-hooks/exhaustive-deps

  const highlightedHtml = useMemo(() => {
    const lines = highlightLines(debouncedValue, filePath);
    if (!lines) return null;
    return lines.join("\n") + "\n";
  }, [debouncedValue, filePath]);

  const handleScroll = useCallback(() => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const ta = textareaRef.current;
      if (!ta) return;

      // Stop propagation so the global keybinding capture listener
      // doesn't intercept normal typing keys (e.g. Cmd+D = split pane)
      // Only let through Escape (handled by overlay) and Cmd+S (handled by save)
      if (e.key !== "Escape" && !(e.key === "s" && (e.metaKey || e.ctrlKey))) {
        e.stopPropagation();
      }

      const start = ta.selectionStart;
      const end = ta.selectionEnd;

      const applyEdit = (result: { text: string; selectionStart: number; selectionEnd: number }) => {
        e.preventDefault();
        onChange(result.text);
        requestAnimationFrame(() => {
          ta.selectionStart = result.selectionStart;
          ta.selectionEnd = result.selectionEnd;
        });
      };

      if (e.key === "Tab") {
        applyEdit(e.shiftKey ? tabDedent(value, start, end) : tabIndent(value, start, end));
        return;
      }

      if (e.key === "Enter") {
        applyEdit(enterAutoIndent(value, start, end));
        return;
      }

      const bracket = autoCloseBracket(value, start, end, e.key);
      if (bracket) {
        applyEdit(bracket);
        return;
      }

      if (e.key === "Backspace") {
        const pair = backspaceDeletePair(value, start, end);
        if (pair) {
          applyEdit(pair);
          return;
        }
      }
    },
    [value, onChange]
  );

  return (
    <div className="local-changes__editor-wrapper">
      {highlightedHtml && (
        <pre
          ref={preRef}
          className="local-changes__editor-highlight"
          aria-hidden
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      )}
      <textarea
        ref={textareaRef}
        className={`local-changes__editor ${highlightedHtml ? "local-changes__editor--transparent" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        spellCheck={false}
      />
    </div>
  );
}
