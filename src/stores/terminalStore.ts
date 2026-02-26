import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { TerminalSession } from "../types/terminal";

interface TerminalState {
  sessions: Record<string, TerminalSession>;
  searchActiveSessionId: string | null;
  addSession: (session: TerminalSession) => void;
  removeSession: (id: string) => void;
  updateTitle: (id: string, title: string) => void;
  toggleSearch: (sessionId: string) => void;
  closeSearch: () => void;
}

export const useTerminalStore = create<TerminalState>()(
  immer((set) => ({
    sessions: {},
    searchActiveSessionId: null,

    addSession: (session) =>
      set((state) => {
        state.sessions[session.id] = session;
      }),

    removeSession: (id) =>
      set((state) => {
        delete state.sessions[id];
      }),

    updateTitle: (id, title) =>
      set((state) => {
        if (state.sessions[id]) {
          state.sessions[id].title = title;
        }
      }),

    toggleSearch: (sessionId) =>
      set((state) => {
        state.searchActiveSessionId =
          state.searchActiveSessionId === sessionId ? null : sessionId;
      }),

    closeSearch: () =>
      set((state) => {
        state.searchActiveSessionId = null;
      }),
  }))
);
