import type { GitCommit, GitGraphCommit } from "../types/git";

/**
 * Assigns a lane (column) to each commit for SVG rendering.
 * Uses a simple lane-reservation algorithm:
 * - Each active branch occupies a lane
 * - When a commit is the first parent of a merge, it stays in the same lane
 * - New branches get the next available lane
 */
export function layoutGitGraph(commits: GitCommit[]): GitGraphCommit[] {
  if (commits.length === 0) return [];

  const hashToRow = new Map<string, number>();
  commits.forEach((c, i) => hashToRow.set(c.hash, i));

  // Track which lane each "head" (next expected commit hash) occupies
  const activeLanes: (string | null)[] = [];
  const result: GitGraphCommit[] = [];

  function findLane(hash: string): number {
    return activeLanes.indexOf(hash);
  }

  function allocateLane(hash: string): number {
    // Find first empty slot
    const empty = activeLanes.indexOf(null);
    if (empty !== -1) {
      activeLanes[empty] = hash;
      return empty;
    }
    activeLanes.push(hash);
    return activeLanes.length - 1;
  }

  function freeLane(index: number) {
    activeLanes[index] = null;
  }

  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];
    let lane = findLane(commit.hash);

    if (lane === -1) {
      lane = allocateLane(commit.hash);
    }

    // This commit now occupies this lane; free it
    freeLane(lane);

    // Assign first parent to same lane, additional parents to new lanes
    const parentLanes: GitGraphCommit["parentLanes"] = [];

    for (let p = 0; p < commit.parents.length; p++) {
      const parentHash = commit.parents[p];
      const parentRow = hashToRow.get(parentHash);

      if (parentRow === undefined) {
        // Parent not in our visible commit list
        continue;
      }

      let pLane = findLane(parentHash);
      if (pLane === -1) {
        if (p === 0) {
          // First parent: reuse current lane
          activeLanes[lane] = parentHash;
          pLane = lane;
        } else {
          pLane = allocateLane(parentHash);
        }
      }

      parentLanes.push({
        parentHash,
        parentLane: pLane,
        parentRow,
      });
    }

    result.push({
      ...commit,
      lane,
      parentLanes,
    });
  }

  return result;
}

