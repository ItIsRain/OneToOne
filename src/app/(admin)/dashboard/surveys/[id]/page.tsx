"use client";
import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FeatureGate } from "@/components/ui/FeatureGate";
import {
  SurveyAnalytics,
  FormBuilder,
  FormSubmissionsTable,
} from "@/components/agency";

interface SurveyMeta {
  id: string;
  title: string;
  survey_type: string;
  status: string;
  form_id: string;
  event_id: string | null;
  event_title: string | null;
  form_slug: string | null;
  auto_send_on_event_end: boolean;
}

const TABS = [
  { key: "analytics", label: "Analytics", icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )},
  { key: "customize", label: "Customize", icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )},
  { key: "responses", label: "Responses", icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )},
] as const;

type TabKey = (typeof TABS)[number]["key"];

const TYPE_LABELS: Record<string, string> = {
  post_event: "Post-Event Feedback",
  nps: "NPS Survey",
  satisfaction: "Satisfaction Survey",
  general_feedback: "General Feedback",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  closed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  archived: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

export default function SurveyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tab, setTab] = useState<TabKey>("analytics");
  const [survey, setSurvey] = useState<SurveyMeta | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSurvey = useCallback(async () => {
    try {
      const res = await fetch(`/api/surveys/${id}`);
      if (!res.ok) return;
      const json = await res.json();
      const s = json.survey ?? json;
      setSurvey({
        id: s.id,
        title: s.title,
        survey_type: s.survey_type,
        status: s.status,
        form_id: s.form_id,
        event_id: s.event_id ?? null,
        event_title: s.events?.title ?? s.event_title ?? null,
        form_slug: s.forms?.slug ?? s.form_slug ?? null,
        auto_send_on_event_end: s.auto_send_on_event_end,
      });
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSurvey();
  }, [fetchSurvey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500 dark:border-gray-700 dark:border-t-brand-400" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-white/[0.03]">
        <p className="text-gray-500 dark:text-gray-400">Survey not found.</p>
        <Link href="/dashboard/surveys" className="mt-4 inline-block text-sm font-medium text-brand-500 hover:text-brand-600">
          Back to Surveys
        </Link>
      </div>
    );
  }

  const publicUrl = survey.form_slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/form/${survey.form_slug}` : null;

  return (
    <FeatureGate feature="surveys">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/surveys"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.06]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {survey.title}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${STATUS_STYLES[survey.status] || STATUS_STYLES.draft}`}>
                  {survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}
                </span>
                <span className="text-gray-400 dark:text-gray-500">·</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {TYPE_LABELS[survey.survey_type] || survey.survey_type}
                </span>
                {survey.event_title && (
                  <>
                    <span className="text-gray-400 dark:text-gray-500">·</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      Event: {survey.event_title}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {publicUrl && (
              <button
                onClick={() => navigator.clipboard.writeText(publicUrl)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.06]"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Link
              </button>
            )}
            {publicUrl && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.06]"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open Survey
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex gap-6">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        {tab === "analytics" && <SurveyAnalytics surveyId={id} />}
        {tab === "customize" && <FormBuilder formId={survey.form_id} />}
        {tab === "responses" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Survey Responses
              </h2>
            </div>
            <FormSubmissionsTable formId={survey.form_id} />
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
