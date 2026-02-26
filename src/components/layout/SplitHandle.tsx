import { useCallback, useRef } from "react";
import type { SplitDirection } from "../../types/tile";

interface SplitHandleProps {
  splitId: string;
  direction: SplitDirection;
  onResize: (splitId: string, ratio: number) => void;
}

export function SplitHandle({ splitId, direction, onResize }: SplitHandleProps) {
  const handleRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const handle = handleRef.current;
      if (!handle) return;

      const parent = handle.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();

      const onMouseMove = (e: MouseEvent) => {
        let ratio: number;
        if (direction === "horizontal") {
          ratio = (e.clientY - rect.top) / rect.height;
        } else {
          ratio = (e.clientX - rect.left) / rect.width;
        }
        onResize(splitId, ratio);
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      document.body.style.cursor =
        direction === "horizontal" ? "row-resize" : "col-resize";
      document.body.style.userSelect = "none";
    },
    [splitId, direction, onResize]
  );

  return (
    <div
      ref={handleRef}
      className={`split-handle split-handle--${direction}`}
      onMouseDown={onMouseDown}
    />
  );
}
