import { create } from "zustand";

interface MarkdownState {
  previewPath: string | null;
  openPreview: (path: string) => void;
  closePreview: () => void;
}

export const useMarkdownStore = create<MarkdownState>()((set) => ({
  previewPath: null,
  openPreview: (path) => set({ previewPath: path }),
  closePreview: () => set({ previewPath: null }),
}));
