import { describe, it, expect } from "vitest";
import { highlightLines } from "../lib/highlight";

describe("highlightLines", () => {
  describe("language detection", () => {
    it("returns null for unsupported extensions", () => {
      expect(highlightLines("hello", "readme.md")).toBeNull();
      expect(highlightLines("hello", "data.json")).toBeNull();
      expect(highlightLines("hello", "Makefile")).toBeNull();
    });

    it("returns null for files without extensions", () => {
      expect(highlightLines("hello", "Dockerfile")).toBeNull();
    });

    it("highlights .java files", () => {
      const result = highlightLines("int x = 5;", "Main.java");
      expect(result).not.toBeNull();
      expect(result).toHaveLength(1);
      expect(result![0]).toContain("hljs-");
    });

    it("highlights .ts files", () => {
      const result = highlightLines("const x: number = 5;", "app.ts");
      expect(result).not.toBeNull();
      expect(result![0]).toContain("hljs-");
    });

    it("highlights .tsx files", () => {
      const result = highlightLines("const x: string = 'hi';", "App.tsx");
      expect(result).not.toBeNull();
    });

    it("highlights .js files", () => {
      const result = highlightLines("function foo() {}", "index.js");
      expect(result).not.toBeNull();
      expect(result![0]).toContain("hljs-");
    });

    it("highlights .mjs and .cjs files", () => {
      expect(highlightLines("export default 1;", "mod.mjs")).not.toBeNull();
      expect(highlightLines("module.exports = 1;", "mod.cjs")).not.toBeNull();
    });

    it("highlights .jsx files", () => {
      expect(highlightLines("const x = 1;", "App.jsx")).not.toBeNull();
    });

    it("highlights .py files", () => {
      const result = highlightLines("def foo():\n    pass", "main.py");
      expect(result).not.toBeNull();
      expect(result![0]).toContain("hljs-");
    });

    it("highlights .html and .htm files", () => {
      expect(highlightLines("<div>hi</div>", "index.html")).not.toBeNull();
      expect(highlightLines("<p>hi</p>", "page.htm")).not.toBeNull();
    });

    it("highlights .xml and .svg files", () => {
      expect(highlightLines("<root/>", "data.xml")).not.toBeNull();
      expect(highlightLines("<svg/>", "icon.svg")).not.toBeNull();
    });

    it("highlights .css files", () => {
      const result = highlightLines(".foo { color: red; }", "style.css");
      expect(result).not.toBeNull();
      expect(result![0]).toContain("hljs-");
    });

    it("is case-insensitive for extensions", () => {
      expect(highlightLines("int x;", "Main.JAVA")).not.toBeNull();
      expect(highlightLines("x = 1", "app.PY")).not.toBeNull();
    });

    it("highlights .mts and .cts files", () => {
      expect(highlightLines("const x = 1;", "mod.mts")).not.toBeNull();
      expect(highlightLines("const x = 1;", "mod.cts")).not.toBeNull();
    });

    it("highlights .xhtml files", () => {
      expect(highlightLines("<html/>", "page.xhtml")).not.toBeNull();
    });
  });

  describe("line splitting", () => {
    it("returns one line for single-line input", () => {
      const result = highlightLines("int x = 5;", "Test.java");
      expect(result).toHaveLength(1);
    });

    it("returns correct number of lines for multi-line input", () => {
      const code = "int x = 5;\nString s = \"hi\";\nreturn x;";
      const result = highlightLines(code, "Test.java");
      expect(result).toHaveLength(3);
    });

    it("handles empty input", () => {
      const result = highlightLines("", "Test.java");
      expect(result).not.toBeNull();
      expect(result).toHaveLength(1);
      expect(result![0]).toBe("");
    });

    it("handles input with only newlines", () => {
      const result = highlightLines("\n\n", "Test.java");
      expect(result).toHaveLength(3);
    });
  });

  describe("tag carrying across lines", () => {
    it("produces valid HTML on each line", () => {
      // A multi-line string literal in Java should carry span tags
      const code = 'String s = "hello\\n"\n    + "world";';
      const result = highlightLines(code, "Test.java");
      expect(result).not.toBeNull();
      for (const line of result!) {
        // Count opening and closing span tags — they should match
        const opens = (line.match(/<span[^>]*>/g) || []).length;
        const closes = (line.match(/<\/span>/g) || []).length;
        expect(opens).toBe(closes);
      }
    });

    it("produces valid HTML for multi-line comments", () => {
      const code = "/* this is\n   a comment */\nint x = 1;";
      const result = highlightLines(code, "Test.java");
      expect(result).not.toBeNull();
      for (const line of result!) {
        const opens = (line.match(/<span[^>]*>/g) || []).length;
        const closes = (line.match(/<\/span>/g) || []).length;
        expect(opens).toBe(closes);
      }
    });

    it("produces valid HTML for Python triple-quoted strings", () => {
      const code = 'x = """\nline1\nline2\n"""';
      const result = highlightLines(code, "test.py");
      expect(result).not.toBeNull();
      for (const line of result!) {
        const opens = (line.match(/<span[^>]*>/g) || []).length;
        const closes = (line.match(/<\/span>/g) || []).length;
        expect(opens).toBe(closes);
      }
    });
  });
});
