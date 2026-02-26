import { useCallback } from "react";
import type { TileNode } from "../../types/tile";
import { useTileStore } from "../../stores/tileStore";
import { SplitHandle } from "./SplitHandle";
import { TerminalPane } from "../terminal/TerminalPane";

interface TileContainerProps {
  node: TileNode;
}

export function TileContainer({ node }: TileContainerProps) {
  const focusedLeafId = useTileStore((s) => s.focusedLeafId);
  const resize = useTileStore((s) => s.resize);

  const handleResize = useCallback(
    (splitId: string, ratio: number) => {
      resize(splitId, ratio);
    },
    [resize]
  );

  if (node.type === "leaf") {
    return (
      <TerminalPane
        key={node.id}
        sessionId={node.sessionId}
        leafId={node.id}
        isFocused={node.id === focusedLeafId}
      />
    );
  }

  const { direction, ratio, children } = node;

  // Use flex-grow to distribute space — avoids overflow from the handle
  const firstFlex = ratio;
  const secondFlex = 1 - ratio;

  return (
    <div className={`tile-split tile-split--${direction}`}>
      <div className="tile-split__child" style={{ flex: firstFlex }}>
        <TileContainer key={children[0].id} node={children[0]} />
      </div>
      <SplitHandle
        splitId={node.id}
        direction={direction}
        onResize={handleResize}
      />
      <div className="tile-split__child" style={{ flex: secondFlex }}>
        <TileContainer key={children[1].id} node={children[1]} />
      </div>
    </div>
  );
}
