import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useGitStore } from "../../stores/gitStore";
import { gitCommitFiles, gitFileDiff, ptyGetCwd } from "../../lib/ipc";
import { useTileStore } from "../../stores/tileStore";
import { findLeafById } from "../../lib/tileTree";
import { FileTree, buildFileTree } from "./FileTree";
import { DiffView } from "./DiffView";
import type { CommitFile, FileDiff, FileTreeNode } from "../../types/git";

export function CommitOverlay() {
  const commit = useGitStore((s) => s.selectedCommit);
  const clearSelectedCommit = useGitStore((s) => s.clearSelectedCommit);

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

  // Load changed files when commit changes
  useEffect(() => {
    if (!commit || !focusedSessionId) return;
    let cancelled = false;

    (async () => {
      setLoadingFiles(true);
      setError(null);
      setFiles([]);
      setTree(null);
      setSelectedPath(null);
      setDiff(null);
      try {
        const cwd = await ptyGetCwd(focusedSessionId);
        const result = await gitCommitFiles(cwd, commit.hash);
        if (cancelled) return;
        setFiles(result);
        setTree(buildFileTree(result));
        // Auto-select first file
        if (result.length > 0) {
          setSelectedPath(result[0].path);
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoadingFiles(false);
      }
    })();

    return () => { cancelled = true; };
  }, [commit, focusedSessionId]);

  // Load diff when selected path changes
  useEffect(() => {
    if (!commit || !focusedSessionId || !selectedPath) {
      setDiff(null);
      return;
    }
    let cancelled = false;

    (async () => {
      setLoadingDiff(true);
      try {
        const cwd = await ptyGetCwd(focusedSessionId);
        const result = await gitFileDiff(cwd, commit.hash, selectedPath);
        if (!cancelled) setDiff(result);
      } catch (e) {
        if (!cancelled) setDiff(null);
      } finally {
        if (!cancelled) setLoadingDiff(false);
      }
    })();

    return () => { cancelled = true; };
  }, [commit, focusedSessionId, selectedPath]);

  const handleSelect = useCallback((path: string) => {
    setSelectedPath(path);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!commit) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearSelectedCommit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [commit, clearSelectedCommit]);

  if (!commit) return null;

  return createPortal(
    <div className="commit-overlay" onClick={clearSelectedCommit}>
      <div className="commit-overlay__panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="commit-overlay__header">
          <div className="commit-overlay__title">
            <span className="commit-overlay__hash">{commit.short_hash}</span>
            <span className="commit-overlay__subject">{commit.subject}</span>
          </div>
          <div className="commit-overlay__meta">
            {commit.author_name} &middot; {commit.date.slice(0, 10)}
            <span className="commit-overlay__file-count">
              {files.length} file{files.length !== 1 ? "s" : ""} changed
            </span>
          </div>
          <button className="commit-overlay__close" onClick={clearSelectedCommit}>
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="commit-overlay__body">
          {error && <div className="commit-overlay__error">{error}</div>}

          {/* Left: file tree */}
          <div className="commit-overlay__files">
            {loadingFiles ? (
              <div className="commit-overlay__loading">Loading files...</div>
            ) : tree ? (
              <FileTree root={tree} selectedPath={selectedPath} onSelect={handleSelect} />
            ) : null}
          </div>

          {/* Right: diff viewer */}
          <div className="commit-overlay__diff">
            <DiffView diff={diff} loading={loadingDiff} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
