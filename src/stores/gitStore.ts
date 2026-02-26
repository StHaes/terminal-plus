import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { GitLogResult, GitCommit } from "../types/git";

interface GitState {
  isOpen: boolean;
  loading: boolean;
  error: string | null;
  logResult: GitLogResult | null;
  cwd: string | null;

  // Commit detail overlay
  selectedCommit: GitCommit | null;

  // Local changes overlay
  localChangesOpen: boolean;

  toggle: () => void;
  setOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLogResult: (result: GitLogResult | null) => void;
  setCwd: (cwd: string) => void;
  selectCommit: (commit: GitCommit) => void;
  clearSelectedCommit: () => void;
  openLocalChanges: () => void;
  closeLocalChanges: () => void;
}

export const useGitStore = create<GitState>()(
  immer((set) => ({
    isOpen: false,
    loading: false,
    error: null,
    logResult: null,
    cwd: null,
    selectedCommit: null,
    localChangesOpen: false,

    toggle: () =>
      set((s) => {
        s.isOpen = !s.isOpen;
      }),

    setOpen: (open) =>
      set((s) => {
        s.isOpen = open;
      }),

    setLoading: (loading) =>
      set((s) => {
        s.loading = loading;
      }),

    setError: (error) =>
      set((s) => {
        s.error = error;
      }),

    setLogResult: (result) =>
      set((s) => {
        s.logResult = result;
        if (result) s.error = null;
      }),

    setCwd: (cwd) =>
      set((s) => {
        s.cwd = cwd;
      }),

    selectCommit: (commit) =>
      set((s) => {
        s.selectedCommit = commit;
      }),

    clearSelectedCommit: () =>
      set((s) => {
        s.selectedCommit = null;
      }),

    openLocalChanges: () =>
      set((s) => {
        s.localChangesOpen = true;
      }),

    closeLocalChanges: () =>
      set((s) => {
        s.localChangesOpen = false;
      }),
  }))
);
