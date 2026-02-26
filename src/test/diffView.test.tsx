import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DiffView } from "../components/git/DiffView";
import type { FileDiff } from "../types/git";

const makeDiff = (path: string, lines: { kind: string; content: string }[]): FileDiff => ({
  path,
  hunks: [
    {
      old_start: 1,
      old_count: lines.filter((l) => l.kind !== "add").length,
      new_start: 1,
      new_count: lines.filter((l) => l.kind !== "remove").length,
      lines: lines.map((l, i) => ({
        kind: l.kind as "add" | "remove" | "context",
        content: l.content,
        old_lineno: l.kind !== "add" ? i + 1 : null,
        new_lineno: l.kind !== "remove" ? i + 1 : null,
      })),
    },
  ],
});

describe("DiffView", () => {
  it("shows loading state", () => {
    render(<DiffView diff={null} loading={true} />);
    expect(screen.getByText("Loading diff...")).toBeInTheDocument();
  });

  it("shows empty state when no diff", () => {
    render(<DiffView diff={null} loading={false} />);
    expect(screen.getByText("Select a file to view changes")).toBeInTheDocument();
  });

  it("shows empty hunks message", () => {
    render(<DiffView diff={{ path: "test.txt", hunks: [] }} loading={false} />);
    expect(screen.getByText("Binary file or no text changes")).toBeInTheDocument();
  });

  it("renders diff lines with correct markers", () => {
    const diff = makeDiff("readme.txt", [
      { kind: "context", content: "unchanged" },
      { kind: "remove", content: "old line" },
      { kind: "add", content: "new line" },
    ]);
    const { container } = render(<DiffView diff={diff} loading={false} />);

    const markers = container.querySelectorAll(".diff-line__marker");
    expect(markers).toHaveLength(3);
    expect(markers[0].textContent).toBe(" ");
    expect(markers[1].textContent).toBe("-");
    expect(markers[2].textContent).toBe("+");
  });

  it("renders plain text for unsupported file types", () => {
    const diff = makeDiff("data.txt", [
      { kind: "add", content: "hello world" },
    ]);
    const { container } = render(<DiffView diff={diff} loading={false} />);

    const content = container.querySelector(".diff-line__content");
    expect(content).toBeInTheDocument();
    // No dangerouslySetInnerHTML — should be plain text child
    expect(content!.textContent).toBe("hello world");
    expect(content!.innerHTML).toBe("hello world");
  });

  it("renders highlighted HTML for supported file types", () => {
    const diff = makeDiff("Main.java", [
      { kind: "add", content: 'String s = "hello";' },
    ]);
    const { container } = render(<DiffView diff={diff} loading={false} />);

    const content = container.querySelector(".diff-line__content");
    expect(content).toBeInTheDocument();
    // Should contain hljs spans from syntax highlighting
    expect(content!.innerHTML).toContain("hljs-");
  });

  it("renders highlighted HTML for TypeScript files", () => {
    const diff = makeDiff("app.ts", [
      { kind: "context", content: "const x: number = 42;" },
      { kind: "remove", content: "const y: string = 'old';" },
      { kind: "add", content: "const y: string = 'new';" },
    ]);
    const { container } = render(<DiffView diff={diff} loading={false} />);

    const contents = container.querySelectorAll(".diff-line__content");
    expect(contents).toHaveLength(3);
    // All lines should be highlighted
    for (const el of contents) {
      expect(el.innerHTML).toContain("hljs-");
    }
  });

  it("shows the file path", () => {
    const diff = makeDiff("src/lib/utils.ts", [
      { kind: "add", content: "export const x = 1;" },
    ]);
    render(<DiffView diff={diff} loading={false} />);
    expect(screen.getByText("src/lib/utils.ts")).toBeInTheDocument();
  });

  it("renders hunk header", () => {
    const diff = makeDiff("test.java", [
      { kind: "add", content: "int x = 1;" },
    ]);
    const { container } = render(<DiffView diff={diff} loading={false} />);
    const header = container.querySelector(".diff-hunk__header");
    expect(header).toBeInTheDocument();
    expect(header!.textContent).toContain("@@");
  });
});
