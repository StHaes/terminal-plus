export type GitRefType = "head" | "localbranch" | "remotebranch" | "tag";

export interface GitRef {
  name: string;
  ref_type: GitRefType;
}

export interface GitCommit {
  hash: string;
  short_hash: string;
  parents: string[];
  author_name: string;
  author_email: string;
  date: string;
  subject: string;
  refs: GitRef[];
}

export interface GitLogResult {
  commits: GitCommit[];
  current_branch: string | null;
}

export interface GitGraphCommit extends GitCommit {
  lane: number;
  parentLanes: { parentHash: string; parentLane: number; parentRow: number }[];
}

// --- Commit detail / diff types ---

export interface CommitFile {
  path: string;
  status: string; // "A" added, "M" modified, "D" deleted, "R" renamed
}

export interface DiffHunk {
  old_start: number;
  old_count: number;
  new_start: number;
  new_count: number;
  lines: DiffLine[];
}

interface DiffLine {
  kind: "add" | "remove" | "context";
  content: string;
  old_lineno: number | null;
  new_lineno: number | null;
}

export interface FileDiff {
  path: string;
  hunks: DiffHunk[];
}

// File tree node for the overlay navigator
export interface FileTreeNode {
  name: string;
  path: string;
  status?: string;
  children: FileTreeNode[];
}
