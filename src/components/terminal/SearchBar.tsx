import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { terminalInstances } from "../../lib/terminalRegistry";
import { useThemeStore } from "../../stores/themeStore";

/** Take a 6-digit hex color and append an alpha byte. */
function hexWithAlpha(hex: string, alpha: number): string {
  const base = hex.replace(/^#/, "").slice(0, 6);
  const a = Math.round(alpha * 255).toString(16).padStart(2, "0");
  return `#${base}${a}`;
}

interface SearchBarProps {
  sessionId: string;
  onClose: () => void;
}

export function SearchBar({ sessionId, onClose }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [regex, setRegex] = useState(false);
  const [matchIndex, setMatchIndex] = useState(0);
  const [matchCount, setMatchCount] = useState(0);

  const theme = useThemeStore((s) => s._currentTheme);
  const isLight = theme.mode === "light";
  const accent = theme.colors.accentOrange;

  const searchDecorations = useMemo(() => ({
    matchBackground: hexWithAlpha(accent, isLight ? 0.15 : 0.20),
    activeMatchBackground: hexWithAlpha(accent, isLight ? 0.35 : 0.55),
    activeMatchColorOverviewRuler: accent,
    matchOverviewRuler: hexWithAlpha(accent, isLight ? 0.25 : 0.30),
  }), [accent, isLight]);

  const getInstance = useCallback(() => {
    return terminalInstances.get(sessionId) ?? null;
  }, [sessionId]);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Listen for match result changes
  useEffect(() => {
    const inst = getInstance();
    if (!inst) return;

    const disposable = inst.searchAddon.onDidChangeResults?.((e) => {
      if (e) {
        setMatchIndex(e.resultIndex + 1);
        setMatchCount(e.resultCount);
      } else {
        setMatchIndex(0);
        setMatchCount(0);
      }
    });

    return () => disposable?.dispose();
  }, [getInstance]);

  const clearHighlights = useCallback(() => {
    const inst = getInstance();
    if (!inst) return;
    inst.searchAddon.clearDecorations();
    inst.term.clearSelection();
  }, [getInstance]);

  // Run search when query or options change
  useEffect(() => {
    const inst = getInstance();
    if (!inst) return;

    if (query) {
      inst.searchAddon.findNext(query, { caseSensitive, regex, decorations: searchDecorations });
    } else {
      clearHighlights();
      setMatchIndex(0);
      setMatchCount(0);
    }
  }, [query, caseSensitive, regex, searchDecorations, getInstance, clearHighlights]);

  const close = useCallback(() => {
    clearHighlights();
    onClose();
  }, [clearHighlights, onClose]);

  const findNext = useCallback(() => {
    if (query) getInstance()?.searchAddon.findNext(query, { caseSensitive, regex, decorations: searchDecorations });
  }, [query, caseSensitive, regex, searchDecorations, getInstance]);

  const findPrev = useCallback(() => {
    if (query) getInstance()?.searchAddon.findPrevious(query, { caseSensitive, regex, decorations: searchDecorations });
  }, [query, caseSensitive, regex, searchDecorations, getInstance]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        findPrev();
      } else {
        findNext();
      }
    }
  };

  return (
    <div className="search-bar">
      <input
        ref={inputRef}
        className="search-bar__input"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search..."
        spellCheck={false}
      />
      <span className="search-bar__count">
        {query ? `${matchCount > 0 ? matchIndex : 0} of ${matchCount}` : ""}
      </span>
      <button
        className={`search-bar__toggle ${caseSensitive ? "search-bar__toggle--active" : ""}`}
        onClick={() => setCaseSensitive((v) => !v)}
        title="Case Sensitive"
      >
        Aa
      </button>
      <button
        className={`search-bar__toggle ${regex ? "search-bar__toggle--active" : ""}`}
        onClick={() => setRegex((v) => !v)}
        title="Regex"
      >
        .*
      </button>
      <button className="search-bar__btn" onClick={findPrev} title="Previous (Shift+Enter)">
        &#x25B2;
      </button>
      <button className="search-bar__btn" onClick={findNext} title="Next (Enter)">
        &#x25BC;
      </button>
      <button className="search-bar__btn search-bar__close" onClick={close} title="Close (Escape)">
        &#x2715;
      </button>
    </div>
  );
}
