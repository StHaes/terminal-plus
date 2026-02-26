import { describe, it, expect } from "vitest";
import {
  tabIndent,
  tabDedent,
  enterAutoIndent,
  autoCloseBracket,
  backspaceDeletePair,
} from "../lib/editorActions";

describe("tabIndent", () => {
  it("inserts 2 spaces at cursor when no selection", () => {
    const result = tabIndent("hello", 2, 2);
    expect(result.text).toBe("he  llo");
    expect(result.selectionStart).toBe(4);
    expect(result.selectionEnd).toBe(4);
  });

  it("inserts 2 spaces replacing selected text when selection is on one line", () => {
    const result = tabIndent("hello", 1, 3);
    expect(result.text).toBe("h  lo");
    expect(result.selectionStart).toBe(3);
    expect(result.selectionEnd).toBe(3);
  });

  it("indents all selected lines when selection spans newlines", () => {
    const text = "line1\nline2\nline3";
    //             Selection from "line2" to "line3"
    const result = tabIndent(text, 6, 17);
    expect(result.text).toBe("line1\n  line2\n  line3");
    expect(result.selectionStart).toBe(8); // start + 2
    expect(result.selectionEnd).toBe(21); // end + 4 (2 lines indented)
  });

  it("indents from beginning of first selected line", () => {
    const text = "  aaa\n  bbb";
    // Select part of first line through second line
    const result = tabIndent(text, 3, 11);
    expect(result.text).toBe("    aaa\n    bbb");
  });

  it("handles cursor at start of file", () => {
    const result = tabIndent("hello", 0, 0);
    expect(result.text).toBe("  hello");
    expect(result.selectionStart).toBe(2);
  });

  it("handles empty string", () => {
    const result = tabIndent("", 0, 0);
    expect(result.text).toBe("  ");
    expect(result.selectionStart).toBe(2);
  });
});

describe("tabDedent", () => {
  it("removes 2 leading spaces from current line", () => {
    const result = tabDedent("  hello", 4, 4);
    expect(result.text).toBe("hello");
    expect(result.selectionStart).toBe(2);
  });

  it("does nothing if line has no leading spaces", () => {
    const result = tabDedent("hello", 3, 3);
    expect(result.text).toBe("hello");
    expect(result.selectionStart).toBe(3);
  });

  it("dedents multiple selected lines", () => {
    const text = "  line1\n  line2\n  line3";
    const result = tabDedent(text, 2, 22);
    expect(result.text).toBe("line1\nline2\nline3");
    expect(result.selectionEnd).toBe(16); // 22 - 6 removed
  });

  it("only removes spaces, not other whitespace", () => {
    const result = tabDedent("\thello", 2, 2);
    expect(result.text).toBe("\thello");
  });

  it("removes exactly 2 spaces even if more indentation exists", () => {
    const result = tabDedent("    hello", 5, 5);
    expect(result.text).toBe("  hello");
  });
});

describe("enterAutoIndent", () => {
  it("inserts newline at cursor", () => {
    const result = enterAutoIndent("hello", 5, 5);
    expect(result.text).toBe("hello\n");
    expect(result.selectionStart).toBe(6);
  });

  it("preserves current line indentation", () => {
    const result = enterAutoIndent("  hello", 7, 7);
    expect(result.text).toBe("  hello\n  ");
    expect(result.selectionStart).toBe(10);
  });

  it("adds extra indent after opening brace", () => {
    const result = enterAutoIndent("  if (true) {", 13, 13);
    expect(result.text).toBe("  if (true) {\n    ");
    expect(result.selectionStart).toBe(18);
  });

  it("adds extra indent after opening paren", () => {
    const result = enterAutoIndent("fn(", 3, 3);
    expect(result.text).toBe("fn(\n  ");
    expect(result.selectionStart).toBe(6);
  });

  it("adds extra indent after opening bracket", () => {
    const result = enterAutoIndent("arr = [", 7, 7);
    expect(result.text).toBe("arr = [\n  ");
    expect(result.selectionStart).toBe(10);
  });

  it("does not add extra indent for non-bracket last char", () => {
    const result = enterAutoIndent("  return x", 10, 10);
    expect(result.text).toBe("  return x\n  ");
    expect(result.selectionStart).toBe(13);
  });

  it("handles cursor in middle of line", () => {
    //                     0123456789...
    const result = enterAutoIndent("  hello world", 7, 7);
    // cursor is after "  hello", indent = "  ", remaining = " world"
    expect(result.text).toBe("  hello\n   world");
    expect(result.selectionStart).toBe(10);
  });

  it("handles second line indentation", () => {
    const text = "line1\n    line2";
    // cursor at end of second line (pos 15)
    const result = enterAutoIndent(text, 15, 15);
    expect(result.text).toBe("line1\n    line2\n    ");
    expect(result.selectionStart).toBe(20);
  });

  it("replaces selection with newline", () => {
    const result = enterAutoIndent("  hello", 4, 7);
    expect(result.text).toBe("  he\n  ");
    expect(result.selectionStart).toBe(7);
  });

  it("ignores trailing whitespace when detecting bracket", () => {
    const result = enterAutoIndent("  if (true) {   ", 17, 17);
    // indent = "  ", trimmed ends with "{", so extra = "  ", insert = "\n    " (5 chars)
    expect(result.text).toBe("  if (true) {   \n    ");
    expect(result.selectionStart).toBe(22);
  });
});

describe("autoCloseBracket", () => {
  it("auto-closes curly braces", () => {
    const result = autoCloseBracket("x = ", 4, 4, "{");
    expect(result).not.toBeNull();
    expect(result!.text).toBe("x = {}");
    expect(result!.selectionStart).toBe(5);
  });

  it("auto-closes parentheses", () => {
    const result = autoCloseBracket("fn", 2, 2, "(");
    expect(result!.text).toBe("fn()");
    expect(result!.selectionStart).toBe(3);
  });

  it("auto-closes square brackets", () => {
    const result = autoCloseBracket("arr", 3, 3, "[");
    expect(result!.text).toBe("arr[]");
    expect(result!.selectionStart).toBe(4);
  });

  it("auto-closes double quotes", () => {
    const result = autoCloseBracket("x = ", 4, 4, '"');
    expect(result!.text).toBe('x = ""');
    expect(result!.selectionStart).toBe(5);
  });

  it("auto-closes single quotes", () => {
    const result = autoCloseBracket("x = ", 4, 4, "'");
    expect(result!.text).toBe("x = ''");
    expect(result!.selectionStart).toBe(5);
  });

  it("auto-closes backticks", () => {
    const result = autoCloseBracket("x = ", 4, 4, "`");
    expect(result!.text).toBe("x = ``");
    expect(result!.selectionStart).toBe(5);
  });

  it("returns null for non-bracket keys", () => {
    expect(autoCloseBracket("x", 1, 1, "a")).toBeNull();
    expect(autoCloseBracket("x", 1, 1, " ")).toBeNull();
  });

  it("returns null when there is a selection", () => {
    expect(autoCloseBracket("hello", 0, 3, "{")).toBeNull();
  });
});

describe("backspaceDeletePair", () => {
  it("deletes matching curly braces", () => {
    const result = backspaceDeletePair("{}", 1, 1);
    expect(result).not.toBeNull();
    expect(result!.text).toBe("");
    expect(result!.selectionStart).toBe(0);
  });

  it("deletes matching parens", () => {
    const result = backspaceDeletePair("fn()", 3, 3);
    expect(result!.text).toBe("fn");
    expect(result!.selectionStart).toBe(2);
  });

  it("deletes matching brackets", () => {
    const result = backspaceDeletePair("a[]b", 2, 2);
    expect(result!.text).toBe("ab");
    expect(result!.selectionStart).toBe(1);
  });

  it("deletes matching double quotes", () => {
    const result = backspaceDeletePair('x = ""', 5, 5);
    expect(result!.text).toBe("x = ");
    expect(result!.selectionStart).toBe(4);
  });

  it("deletes matching single quotes", () => {
    const result = backspaceDeletePair("x = ''", 5, 5);
    expect(result!.text).toBe("x = ");
  });

  it("deletes matching backticks", () => {
    const result = backspaceDeletePair("x = ``", 5, 5);
    expect(result!.text).toBe("x = ");
  });

  it("returns null when not between a pair", () => {
    expect(backspaceDeletePair("abc", 2, 2)).toBeNull();
  });

  it("returns null when there is a selection", () => {
    expect(backspaceDeletePair("{}", 0, 2)).toBeNull();
  });

  it("returns null at start of string", () => {
    expect(backspaceDeletePair("{}", 0, 0)).toBeNull();
  });

  it("returns null for mismatched pair", () => {
    // { followed by ) — not a matching pair
    expect(backspaceDeletePair("{)", 1, 1)).toBeNull();
  });
});
