"use client";

import { useEffect, useRef } from "react";

type QuillEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

/**
 * Strip table-related HTML tags from a string while preserving inner text.
 * Quill has no native Blot for <table>, so any table HTML in the editor
 * becomes an unselectable/undeletable node. We sanitize on load and on paste.
 */
function stripTableHtml(html: string): string {
  return html
    // Replace <tr> with a newline so rows don't merge into one line
    .replace(/<\/tr\s*>/gi, "\n")
    // Replace closing td/th with a tab separator so columns stay readable
    .replace(/<\/t[dh]\s*>/gi, "\t")
    // Remove all table-related opening/closing tags
    .replace(/<\/?(table|thead|tbody|tfoot|tr|th|td|colgroup|col|caption)[^>]*>/gi, "")
    // Collapse consecutive whitespace left behind
    .replace(/\t+/g, " | ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function QuillEditor({ value, onChange, placeholder }: QuillEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<unknown>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || !editorRef.current) return;

    let cancelled = false;

    async function init() {
      const Quill = (await import("quill")).default;
      await import("quill/dist/quill.snow.css");

      if (cancelled || !editorRef.current) return;

      const quill = new Quill(editorRef.current, {
        theme: "snow",
        placeholder: placeholder || "Write your content here...",
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["blockquote", "code-block"],
            [{ color: [] }, { background: [] }],
            [{ align: [] }],
            ["link"],
            ["clean"],
          ],
        },
      });

      if (cancelled) return;

      // ── Table paste handler ──────────────────────────────────────────────────
      // Clipboard Matchers prevent NEW table pastes from becoming stuck nodes.
      // We also strip table HTML from the initial value below (line 67).
      const tableNodeNames = ["TABLE", "THEAD", "TBODY", "TFOOT", "TR", "TH", "TD"];
      for (const nodeName of tableNodeNames) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        quill.clipboard.addMatcher(nodeName, (_node: Node, delta: any) => delta);
      }
      // ── End table paste handler ──────────────────────────────────────────────

      quill.on("text-change", () => {
        const html = quill.root.innerHTML;
        if (html !== "<p><br></p>") {
          onChange(html);
        } else {
          onChange("");
        }
      });

      if (value) {
        // Strip table HTML before loading into Quill so existing saved tables
        // don't become stuck/undeletable nodes in the editor DOM.
        quill.root.innerHTML = stripTableHtml(value);
      }

      quillRef.current = quill;
      initializedRef.current = true;
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const quill = quillRef.current as { root: HTMLDivElement } | null;
    if (!quill || !initializedRef.current) return;
    // Sync from outside only when value is cleared to support the Clear button.
    if (value === "") {
      quill.root.innerHTML = "";
    }
  }, [value]);

  return (
    <div className="quill-wrapper">
      <style>{`
        .quill-wrapper .ql-container {
          min-height: 320px;
          font-size: 15px;
          font-family: inherit;
        }
        .quill-wrapper .ql-editor {
          min-height: 320px;
          line-height: 1.8;
        }
        .quill-wrapper .ql-toolbar {
          border-radius: 8px 8px 0 0;
          border-color: var(--ms-accent);
          background: #0F172A;
        }
        .quill-wrapper .ql-container {
          border-radius: 0 0 8px 8px;
          border-color: var(--ms-accent);
          background: #050816;
          color: #E2E8F0;
        }
        .quill-wrapper .ql-editor.ql-blank::before {
          color: #64748B;
          font-style: normal;
        }
        .quill-wrapper .ql-toolbar button {
          color: #94A3B8;
        }
        .quill-wrapper .ql-toolbar button:hover,
        .quill-wrapper .ql-toolbar button.ql-active {
          color: #22D3EE;
        }
        .quill-wrapper .ql-toolbar .ql-picker-label {
          color: #94A3B8;
        }
        .quill-wrapper .ql-toolbar .ql-picker-options {
          background: #0F172A;
          border-color: var(--ms-accent);
        }
      `}</style>
      <div ref={editorRef} />
    </div>
  );
}
