import type { GitGraphCommit } from "../../types/git";
import { getGitLaneColor } from "../../lib/themeApplicator";
import { useThemeStore } from "../../stores/themeStore";

interface GitGraphProps {
  commits: GitGraphCommit[];
}

const ROW_HEIGHT = 28;
const LANE_WIDTH = 16;
const CIRCLE_R = 4;
const PADDING_LEFT = 8;

export function GitGraph({ commits }: GitGraphProps) {
  const { colors } = useThemeStore((s) => s._currentTheme);

  if (commits.length === 0) return null;

  const maxLane = Math.max(0, ...commits.map((c) => c.lane));
  const width = PADDING_LEFT + (maxLane + 1) * LANE_WIDTH + LANE_WIDTH;
  const height = commits.length * ROW_HEIGHT;

  return (
    <svg className="git-graph" width={width} height={height}>
      {/* Connection lines */}
      {commits.map((commit, row) =>
        commit.parentLanes.map((pl, i) => {
          const x1 = PADDING_LEFT + commit.lane * LANE_WIDTH + LANE_WIDTH / 2;
          const y1 = row * ROW_HEIGHT + ROW_HEIGHT / 2;
          const x2 = PADDING_LEFT + pl.parentLane * LANE_WIDTH + LANE_WIDTH / 2;
          const y2 = pl.parentRow * ROW_HEIGHT + ROW_HEIGHT / 2;

          const color = getGitLaneColor(colors, commit.lane);

          if (x1 === x2) {
            // Straight line
            return (
              <line
                key={`${commit.hash}-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={2}
                strokeOpacity={0.7}
              />
            );
          }

          // Curved line for merge/branch
          const midY = y1 + ROW_HEIGHT;
          const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
          return (
            <path
              key={`${commit.hash}-${i}`}
              d={d}
              fill="none"
              stroke={getGitLaneColor(colors, pl.parentLane)}
              strokeWidth={2}
              strokeOpacity={0.7}
            />
          );
        })
      )}

      {/* Commit circles */}
      {commits.map((commit, row) => {
        const cx = PADDING_LEFT + commit.lane * LANE_WIDTH + LANE_WIDTH / 2;
        const cy = row * ROW_HEIGHT + ROW_HEIGHT / 2;
        const color = getGitLaneColor(colors, commit.lane);
        const isHead = commit.refs.some((r) => r.ref_type === "head");

        return (
          <circle
            key={commit.hash}
            cx={cx}
            cy={cy}
            r={isHead ? CIRCLE_R + 1 : CIRCLE_R}
            fill={isHead ? color : colors.gitGraphFill}
            stroke={color}
            strokeWidth={2}
          />
        );
      })}
    </svg>
  );
}

export { ROW_HEIGHT };
