import hljs from "highlight.js/lib/core";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import xml from "highlight.js/lib/languages/xml"; // covers HTML
import css from "highlight.js/lib/languages/css";

hljs.registerLanguage("java", java);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("css", css);

const EXT_TO_LANG: Record<string, string> = {
  ".java": "java",
  ".js": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".jsx": "javascript",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".mts": "typescript",
  ".cts": "typescript",
  ".py": "python",
  ".html": "xml",
  ".htm": "xml",
  ".xhtml": "xml",
  ".xml": "xml",
  ".svg": "xml",
  ".css": "css",
};

function getLanguage(path: string): string | null {
  const dot = path.lastIndexOf(".");
  if (dot === -1) return null;
  return EXT_TO_LANG[path.substring(dot).toLowerCase()] ?? null;
}

/**
 * Highlight a full block of code, then split the result into per-line HTML strings.
 * Returns null if the file extension isn't supported.
 */
export function highlightLines(
  code: string,
  filePath: string
): string[] | null {
  const lang = getLanguage(filePath);
  if (!lang) return null;

  const result = hljs.highlight(code, { language: lang });

  // hljs returns a single HTML string. Split on newlines, but we need to
  // handle spans that cross line boundaries by tracking open tags.
  return splitHtmlLines(result.value);
}

/**
 * Split highlighted HTML into lines, carrying open <span> tags across line breaks.
 */
function splitHtmlLines(html: string): string[] {
  const rawLines = html.split("\n");
  const lines: string[] = [];
  const openTags: string[] = []; // stack of full opening tags e.g. '<span class="hljs-keyword">'

  for (const raw of rawLines) {
    // Prepend any tags that are still open from previous lines
    let line = openTags.join("") + raw;

    // Track open/close spans in this raw line to update the stack
    const tagRegex = /<\/?span[^>]*>/g;
    let match: RegExpExecArray | null;
    while ((match = tagRegex.exec(raw)) !== null) {
      const tag = match[0];
      if (tag.startsWith("</")) {
        openTags.pop();
      } else {
        openTags.push(tag);
      }
    }

    // Close any still-open tags at end of this line
    for (let i = openTags.length - 1; i >= 0; i--) {
      line += "</span>";
    }

    lines.push(line);
  }

  return lines;
}
