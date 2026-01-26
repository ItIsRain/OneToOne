"use client";

import React, { useState, useRef } from "react";
import type { Submission, ProblemStatement } from "./types";

interface SubmissionEditorProps {
  submission: Submission | null;
  problemStatements?: ProblemStatement[];
  token: string;
  eventSlug: string;
  eventColor: string;
  onClose: () => void;
  onSave: () => void;
}

// Helper function to render inline markdown
const renderInlineMarkdown = (text: string): React.ReactNode => {
  const elements: React.ReactNode[] = [];
  let currentIndex = 0;
  let key = 0;

  // Combined regex for all inline markdown
  const patterns = [
    { regex: /\*\*(.+?)\*\*/g, render: (match: string) => <strong key={key++} className="font-bold">{match}</strong> },
    { regex: /\*(.+?)\*/g, render: (match: string) => <em key={key++} className="italic">{match}</em> },
    { regex: /~~(.+?)~~/g, render: (match: string) => <del key={key++} className="line-through">{match}</del> },
    { regex: /`(.+?)`/g, render: (match: string) => <code key={key++} className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-sm">{match}</code> },
    { regex: /\[(.+?)\]\((.+?)\)/g, render: (text: string, url: string) => <a key={key++} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline hover:no-underline">{text}</a> },
  ];

  // Process text character by character to handle overlapping patterns
  let processedText = text;
  const replacements: { start: number; end: number; element: React.ReactNode }[] = [];

  // Find links first (most complex pattern)
  const linkRegex = /\[(.+?)\]\((.+?)\)/g;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(text)) !== null) {
    replacements.push({
      start: linkMatch.index,
      end: linkMatch.index + linkMatch[0].length,
      element: <a key={key++} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline hover:no-underline">{linkMatch[1]}</a>
    });
  }

  // Find bold (must come before italic to avoid conflicts)
  const boldRegex = /\*\*(.+?)\*\*/g;
  let boldMatch;
  while ((boldMatch = boldRegex.exec(text)) !== null) {
    const overlaps = replacements.some(r =>
      (boldMatch!.index >= r.start && boldMatch!.index < r.end) ||
      (boldMatch!.index + boldMatch![0].length > r.start && boldMatch!.index + boldMatch![0].length <= r.end)
    );
    if (!overlaps) {
      replacements.push({
        start: boldMatch.index,
        end: boldMatch.index + boldMatch[0].length,
        element: <strong key={key++} className="font-bold">{boldMatch[1]}</strong>
      });
    }
  }

  // Find italic (single asterisk, but not inside bold)
  const italicRegex = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;
  let italicMatch;
  while ((italicMatch = italicRegex.exec(text)) !== null) {
    const overlaps = replacements.some(r =>
      (italicMatch!.index >= r.start && italicMatch!.index < r.end) ||
      (italicMatch!.index + italicMatch![0].length > r.start && italicMatch!.index + italicMatch![0].length <= r.end)
    );
    if (!overlaps) {
      replacements.push({
        start: italicMatch.index,
        end: italicMatch.index + italicMatch[0].length,
        element: <em key={key++} className="italic">{italicMatch[1]}</em>
      });
    }
  }

  // Find strikethrough
  const strikeRegex = /~~(.+?)~~/g;
  let strikeMatch;
  while ((strikeMatch = strikeRegex.exec(text)) !== null) {
    const overlaps = replacements.some(r =>
      (strikeMatch!.index >= r.start && strikeMatch!.index < r.end) ||
      (strikeMatch!.index + strikeMatch![0].length > r.start && strikeMatch!.index + strikeMatch![0].length <= r.end)
    );
    if (!overlaps) {
      replacements.push({
        start: strikeMatch.index,
        end: strikeMatch.index + strikeMatch[0].length,
        element: <del key={key++} className="line-through">{strikeMatch[1]}</del>
      });
    }
  }

  // Find inline code
  const codeRegex = /`(.+?)`/g;
  let codeMatch;
  while ((codeMatch = codeRegex.exec(text)) !== null) {
    const overlaps = replacements.some(r =>
      (codeMatch!.index >= r.start && codeMatch!.index < r.end) ||
      (codeMatch!.index + codeMatch![0].length > r.start && codeMatch!.index + codeMatch![0].length <= r.end)
    );
    if (!overlaps) {
      replacements.push({
        start: codeMatch.index,
        end: codeMatch.index + codeMatch[0].length,
        element: <code key={key++} className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-sm">{codeMatch[1]}</code>
      });
    }
  }

  // Sort replacements by start position
  replacements.sort((a, b) => a.start - b.start);

  // Build final output
  let lastEnd = 0;
  replacements.forEach((r) => {
    if (r.start > lastEnd) {
      elements.push(text.substring(lastEnd, r.start));
    }
    elements.push(r.element);
    lastEnd = r.end;
  });

  // Add remaining text
  if (lastEnd < text.length) {
    elements.push(text.substring(lastEnd));
  }

  return elements.length > 0 ? elements : text;
};

export const SubmissionEditor: React.FC<SubmissionEditorProps> = ({
  submission,
  problemStatements = [],
  token,
  eventSlug,
  eventColor,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    title: submission?.title || "",
    description: submission?.description || "",
    solution: submission?.solution || "",
    problem_statement_id: submission?.problem_statement_id || "",
    project_url: submission?.project_url || "",
    demo_url: submission?.demo_url || "",
    video_url: submission?.video_url || "",
    presentation_url: (submission as { presentation_url?: string })?.presentation_url || "",
    technologies: submission?.technologies?.join(", ") || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "solution" | "links">("details");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: number; url?: string }[]>(
    (submission as { files?: { name: string; size: number; url: string }[] })?.files || []
  );
  const [uploadingFile, setUploadingFile] = useState(false);
  const solutionRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      setError("File size must be less than 10MB");
      return;
    }

    setUploadingFile(true);
    setError("");

    try {
      // Upload file to server
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/events/public/${eventSlug}/submissions/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setUploadedFiles(prev => [...prev, {
          name: file.name,
          size: file.size,
          url: data.url
        }]);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to upload file");
      }
    } catch {
      setError("Failed to upload file");
    }

    setUploadingFile(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleSave = async (submit: boolean) => {
    setLoading(true);
    setError("");

    const payload = {
      ...formData,
      technologies: formData.technologies ? formData.technologies.split(",").map(t => t.trim()) : [],
      files: uploadedFiles.filter(f => f.url).map(f => ({ name: f.name, size: f.size, url: f.url })),
      action: submit ? "submit" : undefined,
    };

    try {
      const url = submission
        ? `/api/events/public/${eventSlug}/submissions/${submission.id}`
        : `/api/events/public/${eventSlug}/submissions`;
      const method = submission ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSave();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save");
      }
    } catch {
      setError("Failed to save submission");
    }
    setLoading(false);
  };

  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = solutionRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.solution.substring(start, end);
    const newText = formData.solution.substring(0, start) + before + selectedText + after + formData.solution.substring(end);

    setFormData({ ...formData, solution: newText });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const formatButtons = [
    { icon: "B", label: "Bold", action: () => insertMarkdown("**", "**") },
    { icon: "I", label: "Italic", action: () => insertMarkdown("*", "*") },
    { icon: "S", label: "Strikethrough", action: () => insertMarkdown("~~", "~~") },
    { icon: "H", label: "Heading", action: () => insertMarkdown("## ") },
    { icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ), label: "Bullet List", action: () => insertMarkdown("- ") },
    { icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ), label: "Code", action: () => insertMarkdown("`", "`") },
    { icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.1-1.1" />
      </svg>
    ), label: "Link", action: () => insertMarkdown("[", "](url)") },
    { icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ), label: "Quote", action: () => insertMarkdown("> ") },
  ];

  const tabs = [
    { id: "details" as const, label: "Project Details", icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )},
    { id: "solution" as const, label: "Your Solution", icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )},
    { id: "links" as const, label: "Links & Media", icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    )},
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div
          className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0"
          style={{ background: `linear-gradient(135deg, ${eventColor}10, ${eventColor}05)` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${eventColor}20`, color: eventColor }}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {submission ? "Edit Submission" : "Create Submission"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showcase your amazing project
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all text-lg"
                  style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                  placeholder="Give your project a catchy name"
                />
              </div>

              {/* Problem Statement Selection */}
              {problemStatements.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Problem Statement
                  </label>
                  <div className="space-y-2">
                    {problemStatements.map((ps) => (
                      <button
                        key={ps.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, problem_statement_id: ps.id })}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          formData.problem_statement_id === ps.id
                            ? ""
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                        style={{
                          borderColor: formData.problem_statement_id === ps.id ? eventColor : undefined,
                          backgroundColor: formData.problem_statement_id === ps.id ? `${eventColor}08` : undefined,
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            {ps.category && (
                              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 mb-1">
                                {ps.category}
                              </span>
                            )}
                            <h4 className="font-semibold text-gray-900 dark:text-white">{ps.title}</h4>
                            {ps.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{ps.description}</p>
                            )}
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-4 ${
                              formData.problem_statement_id === ps.id ? "" : "border-gray-300 dark:border-gray-600"
                            }`}
                            style={{ borderColor: formData.problem_statement_id === ps.id ? eventColor : undefined }}
                          >
                            {formData.problem_statement_id === ps.id && (
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: eventColor }} />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Short Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 resize-none transition-all"
                  style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                  placeholder="Summarize your project in a few sentences..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Technologies Used
                </label>
                <input
                  type="text"
                  value={formData.technologies}
                  onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all"
                  style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                  placeholder="React, Node.js, PostgreSQL, AI/ML..."
                />
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Separate technologies with commas</p>
              </div>
            </div>
          )}

          {/* Solution Tab */}
          {activeTab === "solution" && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Your Solution
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Supports Markdown formatting</span>
                </div>

                {/* Formatting Toolbar */}
                <div className="flex items-center gap-1 p-2 bg-gray-50 dark:bg-gray-800 rounded-t-xl border border-b-0 border-gray-200 dark:border-gray-700">
                  {formatButtons.map((btn, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={btn.action}
                      title={btn.label}
                      className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {typeof btn.icon === "string" ? (
                        <span className="font-bold text-sm w-4 h-4 flex items-center justify-center">{btn.icon}</span>
                      ) : (
                        btn.icon
                      )}
                    </button>
                  ))}
                </div>

                <textarea
                  ref={solutionRef}
                  rows={12}
                  value={formData.solution}
                  onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                  className="w-full px-4 py-3 rounded-b-xl border border-t-0 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 resize-none font-mono text-sm transition-all"
                  style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                  placeholder="Describe your solution in detail...

## How it works
Explain the main features and functionality of your project.

## Technical Implementation
- Detail the technologies used
- Explain key technical decisions
- Describe the architecture

## Challenges & Solutions
What obstacles did you face and how did you overcome them?

## Future Improvements
What would you add or improve given more time?"
                />
              </div>

              {/* Markdown Preview */}
              {formData.solution && (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Preview</p>
                  <div className="text-sm text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none">
                    {formData.solution.split("\n").map((line, i) => {
                      // Heading
                      if (line.startsWith("## ")) {
                        return <h2 key={i} className="text-lg font-semibold mt-4 mb-2">{renderInlineMarkdown(line.replace("## ", ""))}</h2>;
                      }
                      // Bullet list
                      if (line.startsWith("- ")) {
                        return <li key={i} className="ml-4">{renderInlineMarkdown(line.replace("- ", ""))}</li>;
                      }
                      // Blockquote
                      if (line.startsWith("> ")) {
                        return <blockquote key={i} className="border-l-4 border-gray-300 pl-4 italic text-gray-600 dark:text-gray-400">{renderInlineMarkdown(line.replace("> ", ""))}</blockquote>;
                      }
                      // Empty line
                      if (line.trim() === "") {
                        return <br key={i} />;
                      }
                      // Regular paragraph
                      return <p key={i} className="my-1">{renderInlineMarkdown(line)}</p>;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Links Tab */}
          {activeTab === "links" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      Source Code URL
                    </span>
                  </label>
                  <input
                    type="url"
                    value={formData.project_url}
                    onChange={(e) => setFormData({ ...formData, project_url: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all"
                    style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                    placeholder="https://github.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Live Demo URL
                    </span>
                  </label>
                  <input
                    type="url"
                    value={formData.demo_url}
                    onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all"
                    style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                    placeholder="https://your-demo.vercel.app"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Video Demo URL
                    </span>
                  </label>
                  <input
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all"
                    style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                    placeholder="https://youtube.com/watch?v=... or https://loom.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3v5a2 2 0 002 2h5" />
                      </svg>
                      Presentation / Slides URL
                    </span>
                  </label>
                  <input
                    type="url"
                    value={formData.presentation_url}
                    onChange={(e) => setFormData({ ...formData, presentation_url: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all"
                    style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                    placeholder="https://canva.com/... or https://docs.google.com/presentation/..."
                  />
                </div>
              </div>

              {/* File Upload Section */}
              <div className="p-5 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="text-center">
                  <div
                    className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Upload Project Files</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Add screenshots, documentation, or other supporting files (max 10MB each)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.pptx,.zip"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: eventColor }}
                  >
                    {uploadingFile ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Choose File
                      </>
                    )}
                  </button>
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Uploaded Files</p>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{file.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tips Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${eventColor}20`, color: eventColor }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Pro Tips</h4>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <li>Include a README in your repository with setup instructions</li>
                      <li>Make sure your demo is accessible and works on multiple devices</li>
                      <li>Keep your video demo under 5 minutes for the best engagement</li>
                      <li>Add a Canva/Google Slides presentation to showcase your project</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0 bg-gray-50/50 dark:bg-gray-800/50">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={loading}
              className="flex-1 py-3 text-sm font-semibold rounded-xl border-2 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              style={{ borderColor: eventColor, color: eventColor }}
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={loading || !formData.title.trim()}
              className="flex-1 py-3 text-sm font-semibold text-white rounded-xl disabled:opacity-50 hover:opacity-90 transition-all shadow-lg"
              style={{ backgroundColor: eventColor, boxShadow: `0 4px 14px ${eventColor}40` }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                "Submit Project"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
