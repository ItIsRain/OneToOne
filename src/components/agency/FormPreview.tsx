"use client";
import React, { useState } from "react";
import type { FormField } from "./FormsTable";
import { FormFieldRenderer } from "./FormFieldRenderer";

interface FormPreviewProps {
  fields: FormField[];
  title: string;
  description?: string;
}

export const FormPreview: React.FC<FormPreviewProps> = ({
  fields,
  title,
  description,
}) => {
  const [values] = useState<Record<string, unknown>>({});

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Form Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {title || "Untitled Form"}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>

      {/* Fields */}
      {fields.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No fields added yet. Add fields from the palette on the left.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {fields.map((field) => (
            <FormFieldRenderer
              key={field.id}
              field={field}
              value={values[field.id]}
              onChange={() => {}}
              error={undefined}
            />
          ))}
        </div>
      )}

      {/* Submit button preview */}
      {fields.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white shadow-theme-xs opacity-75 cursor-not-allowed"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
};
