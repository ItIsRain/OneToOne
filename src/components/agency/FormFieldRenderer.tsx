"use client";
import React, { useState } from "react";
import type { FormField } from "./FormsTable";
import { SignaturePad } from "./SignaturePad";

interface FormFieldRendererProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}

export const FormFieldRenderer: React.FC<FormFieldRendererProps> = ({
  field,
  value,
  onChange,
  error,
}) => {
  const [ratingHover, setRatingHover] = useState<number>(0);

  const baseInputClass =
    "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-800 dark:text-white";
  const normalBorderClass = "border-gray-300 dark:border-gray-600";
  const errorBorderClass = "border-error-500 dark:border-error-500";
  const inputClass = `${baseInputClass} ${error ? errorBorderClass : normalBorderClass}`;

  const renderField = () => {
    switch (field.type) {
      case "text":
        return (
          <input
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={inputClass}
          />
        );

      case "email":
        return (
          <input
            type="email"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || "email@example.com"}
            className={inputClass}
          />
        );

      case "phone":
        return (
          <input
            type="tel"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || "+1 (555) 000-0000"}
            className={inputClass}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            min={field.validation?.min as number | undefined}
            max={field.validation?.max as number | undefined}
            className={inputClass}
          />
        );

      case "textarea":
        return (
          <textarea
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={inputClass}
          />
        );

      case "select":
        return (
          <select
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          >
            <option value="">{field.placeholder || "Select an option"}</option>
            {field.options.map((option, idx) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "multi_select": {
        const selectedValues = (value as string[]) ?? [];
        return (
          <div className="space-y-2">
            {field.options.map((option, idx) => (
              <label
                key={idx}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selectedValues, option]);
                    } else {
                      onChange(selectedValues.filter((v) => v !== option));
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {option}
                </span>
              </label>
            ))}
          </div>
        );
      }

      case "checkbox":
        return (
          <div className="space-y-2">
            {field.options.length > 0 ? (
              field.options.map((option, idx) => (
                <label
                  key={idx}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={
                      Array.isArray(value)
                        ? (value as string[]).includes(option)
                        : false
                    }
                    onChange={(e) => {
                      const current = (value as string[]) ?? [];
                      if (e.target.checked) {
                        onChange([...current, option]);
                      } else {
                        onChange(current.filter((v) => v !== option));
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {option}
                  </span>
                </label>
              ))
            ) : (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!value}
                  onChange={(e) => onChange(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {field.label}
                </span>
              </label>
            )}
          </div>
        );

      case "radio":
        return (
          <div className="space-y-2">
            {field.options.map((option, idx) => (
              <label
                key={idx}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => onChange(e.target.value)}
                  className="h-4 w-4 border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {option}
                </span>
              </label>
            ))}
          </div>
        );

      case "date":
        return (
          <input
            type="date"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
        );

      case "file_upload":
        return (
          <div>
            <label
              className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                error
                  ? "border-error-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-8 h-8 mb-2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {value
                    ? (value as File).name || "File selected"
                    : "Click to upload"}
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept={
                  (field.validation?.allowedTypes as string) || undefined
                }
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const maxSizeMB = (field.validation?.maxSizeMB as number) || 10;
                    const maxSize = maxSizeMB * 1024 * 1024;
                    if (file.size > maxSize) {
                      alert(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
                      e.target.value = "";
                      return;
                    }
                    onChange(file);
                  }
                }}
              />
            </label>
          </div>
        );

      case "rating": {
        const maxStars = (field.validation?.maxStars as number) ?? 5;
        const currentValue = (value as number) ?? 0;
        return (
          <div className="flex items-center gap-1">
            {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onChange(star)}
                onMouseEnter={() => setRatingHover(star)}
                onMouseLeave={() => setRatingHover(0)}
                className="focus:outline-none"
              >
                <svg
                  className={`w-8 h-8 transition ${
                    star <= (ratingHover || currentValue)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            ))}
          </div>
        );
      }

      case "signature":
        return (
          <SignaturePad
            value={(value as string) || undefined}
            onChange={(dataUrl) => onChange(dataUrl)}
          />
        );

      case "nps": {
        const npsValue = (value as number) ?? -1;
        return (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Not at all likely</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Extremely likely</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChange(n)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all border ${
                    npsValue === n
                      ? n <= 6
                        ? "bg-red-500 border-red-500 text-white"
                        : n <= 8
                        ? "bg-yellow-500 border-yellow-500 text-white"
                        : "bg-green-500 border-green-500 text-white"
                      : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-red-400">Detractor (0-6)</span>
              <span className="text-[10px] text-yellow-500">Passive (7-8)</span>
              <span className="text-[10px] text-green-500">Promoter (9-10)</span>
            </div>
          </div>
        );
      }

      case "scale": {
        const scaleMax = (field.validation?.scale_max as number) ?? 5;
        const scaleMin = (field.validation?.scale_min as number) ?? 1;
        const lowLabel = (field.validation?.low_label as string) || "Poor";
        const highLabel = (field.validation?.high_label as string) || "Excellent";
        const scaleValue = (value as number) ?? -1;
        const range = Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => scaleMin + i);
        return (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">{lowLabel}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{highLabel}</span>
            </div>
            <div className="flex gap-1.5">
              {range.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChange(n)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all border ${
                    scaleValue === n
                      ? "bg-brand-500 border-brand-500 text-white shadow-md"
                      : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-brand-300 dark:hover:border-brand-600 bg-white dark:bg-gray-800"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        );
      }

      case "testimonial": {
        const testimonialData = (value as { text?: string; permission?: boolean }) ?? {};
        return (
          <div className="space-y-3">
            <textarea
              value={testimonialData.text ?? ""}
              onChange={(e) => onChange({ ...testimonialData, text: e.target.value })}
              placeholder={field.placeholder || "Share your experience..."}
              rows={4}
              className={inputClass}
            />
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={testimonialData.permission ?? false}
                onChange={(e) => onChange({ ...testimonialData, permission: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                I give permission to use my response as a public testimonial
              </span>
            </label>
          </div>
        );
      }

      case "section_heading":
        return (
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 border-b border-gray-200 dark:border-gray-700 pb-2">
            {field.label}
          </h3>
        );

      case "paragraph":
        return (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {field.description || field.label}
          </p>
        );

      default:
        return (
          <input
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={inputClass}
          />
        );
    }
  };

  const isLayout = ["section_heading", "paragraph"].includes(field.type);

  return (
    <div className={`${field.width === "half" ? "w-1/2" : "w-full"}`}>
      {!isLayout && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {field.label}
          {field.required && (
            <span className="text-error-500 ml-1">*</span>
          )}
        </label>
      )}
      {!isLayout && field.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
          {field.description}
        </p>
      )}
      {renderField()}
      {error && (
        <p className="mt-1 text-xs text-error-500">{error}</p>
      )}
    </div>
  );
};
