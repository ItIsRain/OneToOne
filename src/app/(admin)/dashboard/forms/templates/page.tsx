"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FeatureGate } from "@/components/ui/FeatureGate";

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  created_at: string;
}

function TemplatesContent() {
  const router = useRouter();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      setLoading(true);
      const res = await fetch("/api/forms/templates");
      if (!res.ok) throw new Error("Failed to fetch templates");
      const data = await res.json();
      setTemplates(data.templates ?? data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const res = await fetch(`/api/forms/templates/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete template");
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete template");
    }
  }

  function handleUseTemplate(id: string) {
    router.push(`/dashboard/forms/new?template=${id}`);
  }

  function handleEdit(id: string) {
    router.push(`/dashboard/forms/templates/${id}/edit`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
        <thead className="bg-gray-50 dark:bg-white/5">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Category
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-white/10">
          {templates.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
              >
                No templates found. Create your first template to get started.
              </td>
            </tr>
          ) : (
            templates.map((template) => (
              <tr
                key={template.id}
                className="hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  {template.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {template.description || "-"}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/20 dark:text-brand-400">
                    {template.category || "General"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleUseTemplate(template.id)}
                      className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 transition-colors"
                    >
                      Use Template
                    </button>
                    <button
                      onClick={() => handleEdit(template.id)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-white/20 dark:text-gray-300 dark:hover:bg-white/10 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function FormTemplatesPage() {
  const router = useRouter();

  return (
    <FeatureGate feature="forms">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Form Templates
          </h1>
          <button
            onClick={() => router.push("/dashboard/forms/templates/new")}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Create Template
          </button>
        </div>
        <TemplatesContent />
      </div>
    </FeatureGate>
  );
}
