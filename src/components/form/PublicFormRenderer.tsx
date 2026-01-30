"use client";
import React, { useState, useCallback } from "react";
import { FormFieldRenderer } from "@/components/agency/FormFieldRenderer";
import { ShimmerButton, GradientText } from "@/components/ui/magic";
import type { PublicForm, FormField, ConditionalRule } from "@/components/agency/FormsTable";

interface PublicFormRendererProps {
  form: PublicForm;
  accentColor?: string;
}

interface FormErrors {
  [fieldId: string]: string;
}

export const PublicFormRenderer: React.FC<PublicFormRendererProps> = ({
  form,
  accentColor = "#84cc16",
}) => {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleFieldChange = useCallback(
    (fieldId: string, value: unknown) => {
      setValues((prev) => ({ ...prev, [fieldId]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    },
    []
  );

  const isFieldVisible = useCallback(
    (fieldId: string): boolean => {
      if (!form.conditional_rules || form.conditional_rules.length === 0)
        return true;

      const rules = form.conditional_rules.filter(
        (r: ConditionalRule) => r.target_field_id === fieldId
      );
      if (rules.length === 0) return true;

      for (const rule of rules) {
        const sourceValue = values[rule.field_id];
        let conditionMet = false;

        switch (rule.operator) {
          case "equals":
            conditionMet = String(sourceValue) === rule.value;
            break;
          case "not_equals":
            conditionMet = String(sourceValue) !== rule.value;
            break;
          case "contains":
            conditionMet = String(sourceValue || "")
              .toLowerCase()
              .includes(rule.value.toLowerCase());
            break;
          case "not_empty":
            conditionMet =
              sourceValue !== undefined &&
              sourceValue !== null &&
              sourceValue !== "";
            break;
          case "empty":
            conditionMet =
              sourceValue === undefined ||
              sourceValue === null ||
              sourceValue === "";
            break;
        }

        if (rule.action === "show" && !conditionMet) return false;
        if (rule.action === "hide" && conditionMet) return false;
      }

      return true;
    },
    [form.conditional_rules, values]
  );

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    for (const field of form.fields) {
      if (!isFieldVisible(field.id)) continue;
      if (["section_heading", "paragraph"].includes(field.type)) continue;

      const val = values[field.id];

      if (field.required) {
        if (
          val === undefined ||
          val === null ||
          val === "" ||
          (Array.isArray(val) && val.length === 0)
        ) {
          newErrors[field.id] = `${field.label} is required`;
          continue;
        }
      }

      if (field.type === "email" && val) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(val))) {
          newErrors[field.id] = "Please enter a valid email address";
        }
      }

      if (field.type === "number" && val !== undefined && val !== "") {
        const numVal = Number(val);
        if (field.validation?.min !== undefined && numVal < (field.validation.min as number)) {
          newErrors[field.id] = `Minimum value is ${field.validation.min}`;
        }
        if (field.validation?.max !== undefined && numVal > (field.validation.max as number)) {
          newErrors[field.id] = `Maximum value is ${field.validation.max}`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form.fields, values, isFieldVisible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch(`/api/forms/public/${form.slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: values }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit form");
      }

      setSubmitted(true);

      if (form.thank_you_redirect_url) {
        setTimeout(() => {
          window.location.href = form.thank_you_redirect_url!;
        }, 1500);
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit form"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Thank you screen
  if (submitted) {
    return (
      <div className="py-12 text-center">
        {/* Animated checkmark */}
        <div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: `${accentColor}15`, border: `2px solid ${accentColor}30` }}
        >
          <svg
            className="h-10 w-10"
            style={{ color: accentColor }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <GradientText
          colors={[accentColor, "#a78bfa", accentColor]}
          animationSpeed={5}
          className="text-3xl font-bold"
        >
          {form.thank_you_title || "Thank you!"}
        </GradientText>

        <p className="mt-3 text-gray-400 text-base leading-relaxed max-w-md mx-auto">
          {form.thank_you_message ||
            "Your submission has been received successfully."}
        </p>

        {form.thank_you_redirect_url && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Redirecting you shortly...</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Error banner */}
      {submitError && (
        <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4">
          <svg className="h-5 w-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-red-300">{submitError}</p>
        </div>
      )}

      {/* Form fields */}
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap gap-5">
          {form.fields.map((field: FormField) => {
            if (!isFieldVisible(field.id)) return null;

            return (
              <FormFieldRenderer
                key={field.id}
                field={field}
                value={values[field.id]}
                onChange={(val) => handleFieldChange(field.id, val)}
                error={errors[field.id]}
              />
            );
          })}
        </div>

        {/* Submit section */}
        <div className="mt-8 pt-6 border-t border-white/[0.06]">
          <ShimmerButton
            type="submit"
            disabled={submitting}
            background={accentColor}
            shimmerColor="rgba(255,255,255,0.2)"
            shimmerDuration="2.5s"
            borderRadius="12px"
            className={`w-full sm:w-auto text-sm font-semibold ${submitting ? "opacity-60 pointer-events-none" : ""}`}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </span>
            ) : (
              form.settings?.submit_button_text || "Submit"
            )}
          </ShimmerButton>
        </div>
      </form>
    </div>
  );
};
