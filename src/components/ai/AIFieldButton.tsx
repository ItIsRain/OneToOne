"use client";
import React, { useState } from "react";

interface AIFieldButtonProps {
  module: string;
  field: string;
  currentValue: string;
  context: Record<string, unknown>;
  onGenerate: (value: string) => void;
  disabled?: boolean;
}

export function AIFieldButton({
  module,
  field,
  currentValue,
  context,
  onGenerate,
  disabled,
}: AIFieldButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRewrite = currentValue && currentValue.trim().length > 0;
  const tooltip = isRewrite ? "Rewrite with AI" : "Write with AI";

  const handleClick = async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/write-field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module, field, currentValue: currentValue || "", context }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to generate");
        return;
      }

      if (result.value) {
        onGenerate(result.value);
      }
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading || disabled}
        title={error || tooltip}
        className={`inline-flex items-center justify-center h-6 w-6 rounded-md transition-all ${
          error
            ? "text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10"
            : "text-purple-500 hover:bg-purple-50 hover:text-purple-600 dark:text-purple-400 dark:hover:bg-purple-500/10 dark:hover:text-purple-300"
        } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {isLoading ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 3l1.09 3.26L16.36 7.5l-3.27 1.09L12 11.85l-1.09-3.26L7.64 7.5l3.27-1.09L12 3z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18 12l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 16l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5L5 18l1.5-.5L7 16z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </div>
  );
}
