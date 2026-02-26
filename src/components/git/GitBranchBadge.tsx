import type { GitRef } from "../../types/git";
import { getGitBadgeColor } from "../../lib/themeApplicator";
import { useThemeStore } from "../../stores/themeStore";

interface GitBranchBadgeProps {
  gitRef: GitRef;
}

export function GitBranchBadge({ gitRef }: GitBranchBadgeProps) {
  const colors = useThemeStore((s) => s._currentTheme.colors);
  const color = getGitBadgeColor(colors, gitRef.ref_type);

  return (
    <span
      className="git-badge"
      style={{
        borderColor: color,
        color,
      }}
    >
      {gitRef.name}
    </span>
  );
}
