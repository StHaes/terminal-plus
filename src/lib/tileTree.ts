import { nanoid } from "nanoid";
import type { TileNode, TileLeaf, TileSplit, SplitDirection } from "../types/tile";

export function createLeaf(sessionId: string): TileLeaf {
  return { type: "leaf", id: nanoid(8), sessionId };
}

export function splitNode(
  root: TileNode,
  targetLeafId: string,
  direction: SplitDirection,
  newSessionId: string
): TileNode {
  return mapNode(root, (node) => {
    if (node.type === "leaf" && node.id === targetLeafId) {
      const newLeaf = createLeaf(newSessionId);
      const split: TileSplit = {
        type: "split",
        id: nanoid(8),
        direction,
        ratio: 0.5,
        children: [node, newLeaf],
      };
      return { replacement: split, newLeafId: newLeaf.id };
    }
    return null;
  });
}

export function removeNode(
  root: TileNode,
  targetLeafId: string
): TileNode | null {
  if (root.type === "leaf") {
    return root.id === targetLeafId ? null : root;
  }

  const [first, second] = root.children;

  if (first.type === "leaf" && first.id === targetLeafId) return second;
  if (second.type === "leaf" && second.id === targetLeafId) return first;

  const newFirst = removeNode(first, targetLeafId);
  const newSecond = removeNode(second, targetLeafId);

  if (newFirst === null) return newSecond;
  if (newSecond === null) return newFirst;

  if (newFirst === first && newSecond === second) return root;

  return { ...root, children: [newFirst, newSecond] };
}

export function resizeSplit(
  root: TileNode,
  splitId: string,
  newRatio: number
): TileNode {
  return mapNode(root, (node) => {
    if (node.type === "split" && node.id === splitId) {
      const clamped = Math.max(0.1, Math.min(0.9, newRatio));
      return { replacement: { ...node, ratio: clamped } };
    }
    return null;
  });
}

export function collectLeaves(node: TileNode): TileLeaf[] {
  if (node.type === "leaf") return [node];
  return [
    ...collectLeaves(node.children[0]),
    ...collectLeaves(node.children[1]),
  ];
}

export function getAdjacentLeaf(
  root: TileNode,
  currentLeafId: string,
  direction: "next" | "prev"
): TileLeaf | null {
  const leaves = collectLeaves(root);
  const idx = leaves.findIndex((l) => l.id === currentLeafId);
  if (idx === -1) return null;

  if (direction === "next") {
    return leaves[(idx + 1) % leaves.length];
  } else {
    return leaves[(idx - 1 + leaves.length) % leaves.length];
  }
}

export function findLeafById(
  root: TileNode,
  leafId: string
): TileLeaf | null {
  if (root.type === "leaf") {
    return root.id === leafId ? root : null;
  }
  return (
    findLeafById(root.children[0], leafId) ??
    findLeafById(root.children[1], leafId)
  );
}

// Internal helper: walks tree, callback can return a replacement node
function mapNode(
  node: TileNode,
  fn: (n: TileNode) => { replacement: TileNode; newLeafId?: string } | null
): TileNode {
  const result = fn(node);
  if (result) return result.replacement;

  if (node.type === "split") {
    const newFirst = mapNode(node.children[0], fn);
    const newSecond = mapNode(node.children[1], fn);
    if (newFirst === node.children[0] && newSecond === node.children[1])
      return node;
    return { ...node, children: [newFirst, newSecond] };
  }

  return node;
}
