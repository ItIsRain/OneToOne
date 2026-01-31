"use client";

import { useRef, useState } from "react";
import { renderMarkdown } from "@/lib/markdown";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

function wrapSelection(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  placeholder: string,
  onChange: (v: string) => void
) {
  const { selectionStart, selectionEnd, value } = textarea;
  const selected = value.substring(selectionStart, selectionEnd);
  const text = selected || placeholder;
  const newValue =
    value.substring(0, selectionStart) +
    before +
    text +
    after +
    value.substring(selectionEnd);
  onChange(newValue);

  requestAnimationFrame(() => {
    textarea.focus();
    const cursorPos = selectionStart + before.length;
    textarea.setSelectionRange(cursorPos, cursorPos + text.length);
  });
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 4,
  className = "",
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleAction = (action: "bold" | "italic" | "link" | "list") => {
    const ta = textareaRef.current;
    if (!ta) return;

    switch (action) {
      case "bold":
        wrapSelection(ta, "**", "**", "bold text", onChange);
        break;
      case "italic":
        wrapSelection(ta, "*", "*", "italic text", onChange);
        break;
      case "link":
        wrapSelection(ta, "[", "](https://)", "link text", onChange);
        break;
      case "list":
        wrapSelection(ta, "- ", "", "list item", onChange);
        break;
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent";

  // renderMarkdown escapes all HTML via escapeHtml() before applying markdown
  // transformations, so the output is safe from XSS injection.
  const safeHtml = renderMarkdown(value || "");

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => handleAction("bold")}
          className="px-2 py-1 text-xs font-bold rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => handleAction("italic")}
          className="px-2 py-1 text-xs italic rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => handleAction("link")}
          className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Link"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => handleAction("list")}
          className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="List"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`px-2 py-1 text-xs rounded border transition-colors ${
            showPreview
              ? "border-brand-500 text-brand-600 bg-brand-50 dark:bg-brand-900/20"
              : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          {showPreview ? "Edit" : "Preview"}
        </button>
      </div>

      {showPreview ? (
        <div
          className={`${inputClass} min-h-[6rem] max-w-none [&_strong]:font-bold [&_em]:italic [&_a]:underline [&_a]:text-brand-500 [&_ul]:ml-4 [&_ul]:list-disc [&_ul]:space-y-1 ${className}`}
          // Safe: renderMarkdown escapes all HTML entities before transformation
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`${inputClass} ${className}`}
        />
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500">
        Supports **bold**, *italic*, [links](url), and - list items
      </p>
    </div>
  );
}
