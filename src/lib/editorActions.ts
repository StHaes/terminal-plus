/**
 * Pure text manipulation functions for the editor textarea.
 * Each function takes the current text + cursor position and returns
 * { text, cursor } or { text, selectionStart, selectionEnd }.
 */

interface EditResult {
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

const BRACKET_PAIRS: Record<string, string> = {
  "{": "}",
  "(": ")",
  "[": "]",
  '"': '"',
  "'": "'",
  "`": "`",
};

/** Insert 2 spaces at cursor, or indent all selected lines if selection spans newlines. */
export function tabIndent(
  value: string,
  start: number,
  end: number
): EditResult {
  if (start !== end && value.substring(start, end).includes("\n")) {
    const lineStart = value.substring(0, start).lastIndexOf("\n") + 1;
    const selected = value.substring(lineStart, end);
    const indented = selected.replace(/^/gm, "  ");
    const added = indented.length - selected.length;
    return {
      text: value.substring(0, lineStart) + indented + value.substring(end),
      selectionStart: start + 2,
      selectionEnd: end + added,
    };
  }
  return {
    text: value.substring(0, start) + "  " + value.substring(end),
    selectionStart: start + 2,
    selectionEnd: start + 2,
  };
}

/** Remove up to 2 leading spaces from each selected line. */
export function tabDedent(
  value: string,
  start: number,
  end: number
): EditResult {
  const before = value.substring(0, start);
  const lineStart = before.lastIndexOf("\n") + 1;
  const selected = value.substring(lineStart, end);
  const dedented = selected.replace(/^  /gm, "");
  const removed = selected.length - dedented.length;
  const cursorLineText = before.substring(lineStart);
  const cursorShift = cursorLineText.match(/^  /) ? 2 : 0;

  return {
    text: value.substring(0, lineStart) + dedented + value.substring(end),
    selectionStart: Math.max(lineStart, start - cursorShift),
    selectionEnd: end - removed,
  };
}

/** Insert newline with auto-indent matching current line. Extra indent after { ( [. */
export function enterAutoIndent(
  value: string,
  start: number,
  end: number
): EditResult {
  const before = value.substring(0, start);
  const currentLineStart = before.lastIndexOf("\n") + 1;
  const currentLine = before.substring(currentLineStart);
  const indent = currentLine.match(/^(\s*)/)?.[1] ?? "";
  const trimmed = value.substring(currentLineStart, start).trimEnd();
  const lastChar = trimmed[trimmed.length - 1];
  const extra =
    lastChar === "{" || lastChar === "(" || lastChar === "[" ? "  " : "";
  const insert = "\n" + indent + extra;

  return {
    text: value.substring(0, start) + insert + value.substring(end),
    selectionStart: start + insert.length,
    selectionEnd: start + insert.length,
  };
}

/** Insert matching closing bracket/quote and place cursor between them. */
export function autoCloseBracket(
  value: string,
  start: number,
  end: number,
  key: string
): EditResult | null {
  const closer = BRACKET_PAIRS[key];
  if (!closer || start !== end) return null;

  return {
    text: value.substring(0, start) + key + closer + value.substring(end),
    selectionStart: start + 1,
    selectionEnd: start + 1,
  };
}

/** If cursor is between matching pair, delete both. Returns null if not applicable. */
export function backspaceDeletePair(
  value: string,
  start: number,
  end: number
): EditResult | null {
  if (start !== end || start === 0) return null;

  const charBefore = value[start - 1];
  const charAfter = value[start];
  const closer = BRACKET_PAIRS[charBefore];

  if (closer && closer === charAfter) {
    return {
      text: value.substring(0, start - 1) + value.substring(end + 1),
      selectionStart: start - 1,
      selectionEnd: start - 1,
    };
  }

  return null;
}
