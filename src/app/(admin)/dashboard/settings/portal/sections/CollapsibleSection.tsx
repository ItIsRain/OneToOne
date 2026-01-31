"use client";

import React, { useRef, useEffect, useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  description?: string;
  statusBadge?: React.ReactNode;
}

export default function CollapsibleSection({
  title,
  expanded,
  onToggle,
  children,
  icon,
  description,
  statusBadge,
}: CollapsibleSectionProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [expanded, children]);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        expanded
          ? "border-gray-200 dark:border-gray-700 shadow-sm"
          : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm"
      } bg-white dark:bg-gray-900/50`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left group"
      >
        {icon && (
          <span className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-500 dark:group-hover:bg-brand-500/10 dark:group-hover:text-brand-400 transition-colors">
            {icon}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm text-gray-800 dark:text-white">{title}</span>
          {description && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{description}</p>
          )}
        </div>
        {statusBadge && <span className="flex-shrink-0">{statusBadge}</span>}
        <svg
          className={`w-4 h-4 flex-shrink-0 text-gray-300 dark:text-gray-600 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{ maxHeight: expanded ? `${height + 32}px` : "0px" }}
      >
        <div ref={contentRef} className="px-5 pb-5 pt-1 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}
