import { useState, useCallback } from "react";
import type { CommitFile, FileTreeNode } from "../../types/git";

/** Build a tree structure from a flat list of file paths. */
export function buildFileTree(files: CommitFile[]): FileTreeNode {
  const root: FileTreeNode = { name: "", path: "", children: [] };

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const partPath = parts.slice(0, i + 1).join("/");

      let child = current.children.find((c) => c.name === part);
      if (!child) {
        child = {
          name: part,
          path: partPath,
          status: isFile ? file.status : undefined,
          children: [],
        };
        current.children.push(child);
      }
      current = child;
    }
  }

  // Sort: directories first, then files, alphabetically
  sortTree(root);
  // Collapse single-child directory chains (e.g. src/lib/utils.ts → "src/lib" + file)
  collapseTree(root);
  return root;
}

function sortTree(node: FileTreeNode) {
  node.children.sort((a, b) => {
    const aDir = a.children.length > 0 ? 0 : 1;
    const bDir = b.children.length > 0 ? 0 : 1;
    if (aDir !== bDir) return aDir - bDir;
    return a.name.localeCompare(b.name);
  });
  for (const child of node.children) {
    sortTree(child);
  }
}

/** Collapse single-child directory chains into "a/b/c" display names. */
function collapseTree(node: FileTreeNode) {
  for (const child of node.children) {
    collapseTree(child);
  }
  // For each child that is a directory with exactly one child,
  // merge it with its single child (repeat until the chain ends).
  for (let i = 0; i < node.children.length; i++) {
    let child = node.children[i];
    while (child.children.length === 1 && child.children[0].children.length > 0) {
      const grandchild = child.children[0];
      child = {
        name: child.name + "/" + grandchild.name,
        path: grandchild.path,
        status: grandchild.status,
        children: grandchild.children,
      };
    }
    node.children[i] = child;
  }
}

// --- Components ---

interface FileTreeProps {
  root: FileTreeNode;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

export function FileTree({ root, selectedPath, onSelect }: FileTreeProps) {
  return (
    <div className="file-tree">
      {root.children.map((child) => (
        <FileTreeEntry
          key={child.path}
          node={child}
          depth={0}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

interface FileTreeEntryProps {
  node: FileTreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

function FileTreeEntry({ node, depth, selectedPath, onSelect }: FileTreeEntryProps) {
  const isDir = node.children.length > 0;
  const [expanded, setExpanded] = useState(true);

  const handleClick = useCallback(() => {
    if (isDir) {
      setExpanded((e) => !e);
    } else {
      onSelect(node.path);
    }
  }, [isDir, node.path, onSelect]);

  const isSelected = node.path === selectedPath;

  return (
    <>
      <div
        className={`file-tree__entry ${isSelected ? "file-tree__entry--selected" : ""}`}
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={handleClick}
      >
        <span className="file-tree__icon">
          {isDir ? (expanded ? "\u25BE" : "\u25B8") : "\u00A0"}
        </span>
        <span className="file-tree__name">{node.name}</span>
        {node.status && (
          <span className={`file-tree__status file-tree__status--${node.status.toLowerCase()}`}>
            {node.status}
          </span>
        )}
      </div>
      {isDir && expanded &&
        node.children.map((child) => (
          <FileTreeEntry
            key={child.path}
            node={child}
            depth={depth + 1}
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
        ))}
    </>
  );
}
