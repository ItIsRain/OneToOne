"use client";
import React from "react";
import type { FormField } from "./FormsTable";

interface FormFieldEditorProps {
  field: FormField;
  onChange: (field: FormField) => void;
  onDelete: () => void;
}

export const FormFieldEditor: React.FC<FormFieldEditorProps> = ({
  field,
  onChange,
  onDelete,
}) => {
  const handleChange = (key: keyof FormField, value: unknown) => {
    onChange({ ...field, [key]: value });
  };

  const handleValidationChange = (key: string, value: unknown) => {
    onChange({
      ...field,
      validation: { ...field.validation, [key]: value },
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...field.options];
    newOptions[index] = value;
    onChange({ ...field, options: newOptions });
  };

  const handleAddOption = () => {
    onChange({ ...field, options: [...field.options, `Option ${field.options.length + 1}`] });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = field.options.filter((_, i) => i !== index);
    onChange({ ...field, options: newOptions });
  };

  const hasOptions = ["select", "multi_select", "radio", "checkbox"].includes(
    field.type
  );
  const isNumber = field.type === "number";
  const isFileUpload = field.type === "file_upload";
  const isRating = field.type === "rating";
  const isLayout = ["section_heading", "paragraph"].includes(field.type);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
          Field Settings
        </h3>
        <button
          onClick={onDelete}
          className="text-xs text-error-500 hover:text-error-600 font-medium"
        >
          Delete Field
        </button>
      </div>

      {/* Label */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Label
        </label>
        <input
          type="text"
          value={field.label}
          onChange={(e) => handleChange("label", e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Placeholder - not for layout types */}
      {!isLayout && (
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Placeholder
          </label>
          <input
            type="text"
            value={field.placeholder}
            onChange={(e) => handleChange("placeholder", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={field.description}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Required toggle - not for layout types */}
      {!isLayout && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Required
          </label>
          <button
            type="button"
            onClick={() => handleChange("required", !field.required)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              field.required
                ? "bg-brand-500"
                : "bg-gray-200 dark:bg-gray-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                field.required ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      )}

      {/* Width */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Width
        </label>
        <select
          value={field.width}
          onChange={(e) =>
            handleChange("width", e.target.value as "full" | "half")
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="full">Full Width</option>
          <option value="half">Half Width</option>
        </select>
      </div>

      {/* Options (for select, multi_select, radio, checkbox) */}
      {hasOptions && (
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Options
          </label>
          <div className="space-y-2">
            {field.options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <button
                  onClick={() => handleRemoveOption(index)}
                  className="text-gray-400 hover:text-error-500 flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              onClick={handleAddOption}
              className="text-xs text-brand-500 hover:text-brand-600 font-medium"
            >
              + Add Option
            </button>
          </div>
        </div>
      )}

      {/* Number: min/max */}
      {isNumber && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Min
            </label>
            <input
              type="number"
              value={(field.validation.min as number) ?? ""}
              onChange={(e) =>
                handleValidationChange(
                  "min",
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max
            </label>
            <input
              type="number"
              value={(field.validation.max as number) ?? ""}
              onChange={(e) =>
                handleValidationChange(
                  "max",
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* File Upload: allowed types, max size */}
      {isFileUpload && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Allowed File Types
            </label>
            <input
              type="text"
              value={(field.validation.allowedTypes as string) ?? ""}
              onChange={(e) =>
                handleValidationChange("allowedTypes", e.target.value)
              }
              placeholder="e.g. .pdf,.jpg,.png"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <p className="text-xs text-gray-400 mt-1">
              Comma-separated file extensions
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max File Size (MB)
            </label>
            <input
              type="number"
              value={(field.validation.maxSizeMB as number) ?? ""}
              onChange={(e) =>
                handleValidationChange(
                  "maxSizeMB",
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </>
      )}

      {/* Rating: max stars */}
      {isRating && (
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Max Stars
          </label>
          <select
            value={(field.validation.maxStars as number) ?? 5}
            onChange={(e) =>
              handleValidationChange("maxStars", Number(e.target.value))
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n} Stars
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
