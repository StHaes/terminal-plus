import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import { useGitStore } from "../../stores/gitStore";
import { useTileStore } from "../../stores/tileStore";
import { gitLog, gitIsRepo, ptyGetCwd } from "../../lib/ipc";
const openLocalChanges = () => useGitStore.getState().openLocalChanges();
import { layoutGitGraph } from "../../lib/gitGraphLayout";
import { findLeafById } from "../../lib/tileTree";
import { GitGraph, ROW_HEIGHT } from "./GitGraph";
import { GitCommitRow } from "./GitCommitRow";
import type { GitCommit } from "../../types/git";

function matchesSearch(commit: GitCommit, query: string): boolean {
  const q = query.toLowerCase();
  return (
    commit.hash.toLowerCase().includes(q) ||
    commit.short_hash.toLowerCase().includes(q) ||
    commit.subject.toLowerCase().includes(q) ||
    commit.author_name.toLowerCase().includes(q) ||
    commit.author_email.toLowerCase().includes(q) ||
    commit.refs.some((r) => r.name.toLowerCase().includes(q))
  );
}

export function GitPanel() {
  const isOpen = useGitStore((s) => s.isOpen);
  const loading = useGitStore((s) => s.loading);
  const error = useGitStore((s) => s.error);
  const logResult = useGitStore((s) => s.logResult);
  const setLoading = useGitStore((s) => s.setLoading);
  const setError = useGitStore((s) => s.setError);
  const setLogResult = useGitStore((s) => s.setLogResult);
  const [search, setSearch] = useState("");

  // Derive the focused session ID directly from the store —
  // only changes when the actual focused session changes (not on every resize).
  const focusedSessionId = useTileStore((s) => {
    const leaf = findLeafById(s.root, s.focusedLeafId);
    return leaf?.sessionId ?? null;
  });

  const lastCwdRef = useRef("");

  const loadGitLog = useCallback(async () => {
    if (!focusedSessionId) {
      setError("No active terminal");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const cwd = await ptyGetCwd(focusedSessionId);
      lastCwdRef.current = cwd;
      const isRepo = await gitIsRepo(cwd);
      if (!isRepo) {
        setLogResult(null);
        setError(`Not a git repository (${cwd})`);
        setLoading(false);
        return;
      }
      const result = await gitLog(cwd, 200);
      setLogResult(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [focusedSessionId, setLoading, setError, setLogResult]);

  // Refresh when panel opens or focused session changes (covers splits)
  useEffect(() => {
    if (isOpen && focusedSessionId) {
      lastCwdRef.current = ""; // Reset to force a fresh load
      loadGitLog();
    }
  }, [isOpen, focusedSessionId, loadGitLog]);

  // Poll for cwd changes every 2 s (covers `cd`)
  useEffect(() => {
    if (!isOpen || !focusedSessionId) return;

    const poll = async () => {
      try {
        const cwd = await ptyGetCwd(focusedSessionId);
        if (cwd && cwd !== lastCwdRef.current) {
          lastCwdRef.current = cwd;
          loadGitLog();
        }
      } catch {
        // ignore — session may not be ready yet
      }
    };

    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, [isOpen, focusedSessionId, loadGitLog]);

  const filtered = useMemo(() => {
    if (!logResult) return [];
    const q = search.trim();
    const commits = q
      ? logResult.commits.filter((c) => matchesSearch(c, q))
      : logResult.commits;
    return layoutGitGraph(commits);
  }, [logResult, search]);

  if (!isOpen) return null;

  return (
    <div className="git-panel">
      <div className="git-panel__header">
        <span className="git-panel__title">
          Git History
          {logResult?.current_branch && (
            <span className="git-panel__branch">({logResult.current_branch})</span>
          )}
        </span>
        <div className="git-panel__actions">
          <button className="git-panel__refresh" onClick={openLocalChanges} title="Local Changes">
            Local Changes
          </button>
          <button className="git-panel__refresh" onClick={loadGitLog} title="Refresh">
            Refresh
          </button>
        </div>
      </div>

      <div className="git-panel__search">
        <input
          type="text"
          className="git-panel__search-input"
          placeholder="Search commits..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          spellCheck={false}
        />
        {search && (
          <button
            className="git-panel__search-clear"
            onClick={() => setSearch("")}
            title="Clear search"
          >
            &times;
          </button>
        )}
      </div>

      <div className="git-panel__body">
        {loading && <div className="git-panel__loading">Loading...</div>}
        {error && <div className="git-panel__error">{error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="git-panel__empty">No commits found</div>
        )}
        {filtered.length > 0 && (
          <div className="git-panel__graph-container">
            <div className="git-panel__graph-col">
              <GitGraph commits={filtered} />
            </div>
            <div className="git-panel__commits-col">
              {filtered.map((commit) => (
                <div
                  key={commit.hash}
                  className="git-panel__commit-row-wrapper"
                  style={{ height: ROW_HEIGHT }}
                >
                  <GitCommitRow commit={commit} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
