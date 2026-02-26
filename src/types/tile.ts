export type SplitDirection = "horizontal" | "vertical";

export interface TileSplit {
  type: "split";
  id: string;
  direction: SplitDirection;
  ratio: number; // 0..1, size of first child
  children: [TileNode, TileNode];
}

export interface TileLeaf {
  type: "leaf";
  id: string;
  sessionId: string;
}

export type TileNode = TileSplit | TileLeaf;
