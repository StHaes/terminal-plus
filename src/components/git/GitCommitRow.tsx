import type { GitGraphCommit } from "../../types/git";
import { useGitStore } from "../../stores/gitStore";
import { GitBranchBadge } from "./GitBranchBadge";

interface GitCommitRowProps {
  commit: GitGraphCommit;
}

export function GitCommitRow({ commit }: GitCommitRowProps) {
  const selectCommit = useGitStore((s) => s.selectCommit);
  const date = formatRelativeDate(commit.date);

  return (
    <div className="git-commit-row" onClick={() => selectCommit(commit)}>
      <div className="git-commit-row__badges">
        {commit.refs.map((ref, i) => (
          <GitBranchBadge key={i} gitRef={ref} />
        ))}
      </div>
      <span className="git-commit-row__hash">{commit.short_hash}</span>
      <span className="git-commit-row__subject">{commit.subject}</span>
      <span className="git-commit-row__author">{commit.author_name}</span>
      <span className="git-commit-row__date">{date}</span>
    </div>
  );
}

function formatRelativeDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    const now = Date.now();
    const diffMs = now - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return `${Math.floor(diffMonths / 12)}y ago`;
  } catch {
    return isoDate;
  }
}
