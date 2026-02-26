import { create } from "zustand";
import { nanoid } from "nanoid";
import type { TileNode, TileLeaf, SplitDirection } from "../types/tile";
import {
  createLeaf,
  splitNode,
  removeNode,
  resizeSplit,
  collectLeaves,
  getAdjacentLeaf,
} from "../lib/tileTree";

interface TileState {
  root: TileNode;
  focusedLeafId: string;
  initialSessionId: string;

  split: (direction: SplitDirection, newSessionId: string) => string | null;
  closePane: (leafId: string) => string | null;
  resize: (splitId: string, ratio: number) => void;
  focusNext: () => void;
  focusPrev: () => void;
  setFocus: (leafId: string) => void;
}

function makeInitialState() {
  const sessionId = nanoid(8);
  const leaf = createLeaf(sessionId);
  return { root: leaf as TileNode, focusedLeafId: leaf.id, initialSessionId: sessionId };
}

const initial = makeInitialState();

export const useTileStore = create<TileState>()((set, get) => ({
  root: initial.root,
  focusedLeafId: initial.focusedLeafId,
  initialSessionId: initial.initialSessionId,

  split: (direction, newSessionId) => {
    const { root, focusedLeafId } = get();
    const newRoot = splitNode(root, focusedLeafId, direction, newSessionId);
    if (newRoot === root) return null;

    const leaves = collectLeaves(newRoot);
    const newLeaf = leaves.find((l) => l.sessionId === newSessionId);
    const newFocusId = newLeaf?.id ?? focusedLeafId;

    set({ root: newRoot, focusedLeafId: newFocusId });
    return newLeaf?.id ?? null;
  },

  closePane: (leafId) => {
    const { root, focusedLeafId } = get();
    const leaves = collectLeaves(root);
    if (leaves.length <= 1) return null;

    const leaf = leaves.find((l) => l.id === leafId);
    if (!leaf) return null;

    const sessionId = leaf.sessionId;
    const newRoot = removeNode(root, leafId);
    if (!newRoot) return null;

    const remainingLeaves = collectLeaves(newRoot);
    const newFocus = remainingLeaves[0]?.id ?? focusedLeafId;

    set({ root: newRoot, focusedLeafId: newFocus });
    return sessionId;
  },

  resize: (splitId, ratio) => {
    const { root } = get();
    set({ root: resizeSplit(root, splitId, ratio) });
  },

  focusNext: () => {
    const { root, focusedLeafId } = get();
    const next = getAdjacentLeaf(root, focusedLeafId, "next");
    if (next) set({ focusedLeafId: next.id });
  },

  focusPrev: () => {
    const { root, focusedLeafId } = get();
    const prev = getAdjacentLeaf(root, focusedLeafId, "prev");
    if (prev) set({ focusedLeafId: prev.id });
  },

  setFocus: (leafId) => {
    set({ focusedLeafId: leafId });
  },
}));
