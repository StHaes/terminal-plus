import { useMemo } from "react";
import type { FileDiff } from "../../types/git";
import { highlightLines } from "../../lib/highlight";

interface DiffViewProps {
  diff: FileDiff | null;
  loading: boolean;
}

export function DiffView({ diff, loading }: DiffViewProps) {
  // Build a map of hunkIndex:lineIndex → highlighted HTML for all lines
  const highlightMap = useMemo(() => {
    if (!diff || diff.hunks.length === 0) return null;

    // Highlight new-side lines (context + add) together for correct token state
    const newLines: { hi: number; li: number; content: string }[] = [];
    const removedLines: { hi: number; li: number; content: string }[] = [];

    diff.hunks.forEach((hunk, hi) => {
      hunk.lines.forEach((line, li) => {
        if (line.kind === "remove") {
          removedLines.push({ hi, li, content: line.content });
        } else {
          newLines.push({ hi, li, content: line.content });
        }
      });
    });

    const map = new Map<string, string>();

    const newCode = newLines.map((l) => l.content).join("\n");
    const newHighlighted = highlightLines(newCode, diff.path);
    if (!newHighlighted) return null;

    newLines.forEach((l, i) => {
      map.set(`${l.hi}:${l.li}`, newHighlighted[i]);
    });

    if (removedLines.length > 0) {
      const removedCode = removedLines.map((l) => l.content).join("\n");
      const removedHighlighted = highlightLines(removedCode, diff.path);
      if (removedHighlighted) {
        removedLines.forEach((l, i) => {
          map.set(`${l.hi}:${l.li}`, removedHighlighted[i]);
        });
      }
    }

    return map;
  }, [diff]);

  if (loading) {
    return <div className="diff-view__empty">Loading diff...</div>;
  }
  if (!diff) {
    return <div className="diff-view__empty">Select a file to view changes</div>;
  }
  if (diff.hunks.length === 0) {
    return <div className="diff-view__empty">Binary file or no text changes</div>;
  }

  return (
    <div className="diff-view">
      <div className="diff-view__path">{diff.path}</div>
      <div className="diff-view__hunks">
        {diff.hunks.map((hunk, hi) => (
          <div key={hi} className="diff-hunk">
            <div className="diff-hunk__header">
              @@ -{hunk.old_start},{hunk.old_count} +{hunk.new_start},{hunk.new_count} @@
            </div>
            {hunk.lines.map((line, li) => {
              const html = highlightMap?.get(`${hi}:${li}`);
              return (
                <div key={li} className={`diff-line diff-line--${line.kind}`}>
                  <span className="diff-line__old-no">
                    {line.old_lineno ?? ""}
                  </span>
                  <span className="diff-line__new-no">
                    {line.new_lineno ?? ""}
                  </span>
                  <span className="diff-line__marker">
                    {line.kind === "add" ? "+" : line.kind === "remove" ? "-" : " "}
                  </span>
                  {html ? (
                    <span
                      className="diff-line__content"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  ) : (
                    <span className="diff-line__content">{line.content}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
