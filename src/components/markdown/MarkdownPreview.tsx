import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useMarkdownStore } from "../../stores/markdownStore";
import { readFile, writeFile } from "../../lib/ipc";

class MarkdownErrorBoundary extends Component<
  { children: ReactNode; onError: (msg: string) => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error.message || "Failed to render markdown");
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export function MarkdownPreview() {
  const previewPath = useMarkdownStore((s) => s.previewPath);
  const closePreview = useMarkdownStore((s) => s.closePreview);

  const [content, setContent] = useState<string>("");
  const [editContent, setEditContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!previewPath) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      setEditing(false);
      setDirty(false);
      try {
        const text = await readFile(previewPath);
        if (!cancelled) {
          setContent(text);
          setEditContent(text);
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [previewPath]);

  useEffect(() => {
    if (!previewPath) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editing) {
          setEditing(false);
          setEditContent(content);
          setDirty(false);
        } else {
          closePreview();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [previewPath, closePreview, editing, content]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editing]);

  if (!previewPath) return null;

  const filename = previewPath.split("/").pop() ?? previewPath;

  const handleEdit = () => {
    setEditContent(content);
    setEditing(true);
    setDirty(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setEditContent(content);
    setDirty(false);
  };

  const handleSave = async () => {
    if (!previewPath) return;
    setSaving(true);
    try {
      await writeFile(previewPath, editContent);
      setContent(editContent);
      setEditing(false);
      setDirty(false);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleEditorChange = (value: string) => {
    setEditContent(value);
    setDirty(value !== content);
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (dirty && !saving) handleSave();
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget as HTMLTextAreaElement;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newValue = editContent.substring(0, start) + "  " + editContent.substring(end);
      setEditContent(newValue);
      setDirty(newValue !== content);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  return createPortal(
    <div className="md-overlay" onClick={closePreview}>
      <div className="md-overlay__panel" onClick={(e) => e.stopPropagation()}>
        <div className="md-overlay__header">
          <span className="md-overlay__filename">{filename}</span>
          <span className="md-overlay__path">{previewPath}</span>
          <div className="md-overlay__actions">
            {editing ? (
              <>
                <button
                  className="md-overlay__btn md-overlay__btn--save"
                  onClick={handleSave}
                  disabled={!dirty || saving}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  className="md-overlay__btn md-overlay__btn--cancel"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button className="md-overlay__btn" onClick={handleEdit} disabled={loading || !!error}>
                Edit
              </button>
            )}
          </div>
          <button className="md-overlay__close" onClick={closePreview}>
            &times;
          </button>
        </div>
        <div className="md-overlay__body">
          {loading && <div className="md-overlay__loading">Loading...</div>}
          {error && <div className="md-overlay__error">{error}</div>}
          {!loading && !error && editing && (
            <textarea
              ref={textareaRef}
              className="md-overlay__editor"
              value={editContent}
              onChange={(e) => handleEditorChange(e.target.value)}
              onKeyDown={handleEditorKeyDown}
              spellCheck={false}
            />
          )}
          {!loading && !error && !editing && (
            <MarkdownErrorBoundary onError={(msg) => setError(msg)}>
              <div className="md-overlay__content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </div>
            </MarkdownErrorBoundary>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
