"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

interface SurveyAnalyticsProps {
  surveyId: string;
}

interface SurveyData {
  id: string;
  title: string;
  description: string | null;
  survey_type: string;
  status: string;
  event_title: string | null;
  event_id: string | null;
  form_id: string;
  form_slug: string | null;
  sent_count: number;
  response_count: number;
  is_testimonial_enabled: boolean;
}

interface FieldAnalytic {
  field_id: string;
  field_label: string;
  field_type: string;
  total_answers: number;
  nps_score?: number;
  promoters?: number;
  passives?: number;
  detractors?: number;
  average?: number;
  distribution?: Record<string, number>;
  testimonials?: { text: string; permission: boolean }[];
}

interface AnalyticsData {
  total_responses: number;
  response_rate: number;
  nps_score: number | null;
  average_rating: number | null;
  field_analytics: FieldAnalytic[];
}

interface AnalyticsResponse {
  survey: SurveyData;
  analytics: AnalyticsData;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-white/[0.03]">
    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
    <div className="mt-4 h-8 w-20 rounded bg-gray-200 dark:bg-gray-700" />
    <div className="mt-2 h-3 w-32 rounded bg-gray-200 dark:bg-gray-700" />
  </div>
);

const SkeletonFieldCard = () => (
  <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-white/[0.03]">
    <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-700" />
    <div className="mt-6 h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
    <div className="mt-3 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
    <div className="mt-3 h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
  </div>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    className={`h-5 w-5 ${filled ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
  </svg>
);

const StarsDisplay = ({ value, max = 5 }: { value: number; max?: number }) => (
  <div className="flex items-center gap-1">
    {Array.from({ length: max }, (_, i) => (
      <StarIcon key={i} filled={i < Math.round(value)} />
    ))}
  </div>
);

const CircularProgress = ({ percentage }: { percentage: number }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
      <circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        className="text-gray-200 dark:text-gray-700"
      />
      <circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-blue-500"
      />
    </svg>
  );
};

const getNpsColor = (score: number) => {
  if (score < 0) return "text-red-500";
  if (score <= 50) return "text-yellow-500";
  return "text-green-500";
};

const getNpsBgColor = (score: number) => {
  if (score < 0) return "bg-red-500";
  if (score <= 50) return "bg-yellow-500";
  return "bg-green-500";
};

// ---------------------------------------------------------------------------
// Field card renderers
// ---------------------------------------------------------------------------

const NpsFieldCard = ({ field }: { field: FieldAnalytic }) => {
  const total = (field.promoters ?? 0) + (field.passives ?? 0) + (field.detractors ?? 0);
  const pPct = total > 0 ? ((field.promoters ?? 0) / total) * 100 : 0;
  const paPct = total > 0 ? ((field.passives ?? 0) / total) * 100 : 0;
  const dPct = total > 0 ? ((field.detractors ?? 0) / total) * 100 : 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-white/[0.03]">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        {field.field_label}
      </h3>
      <div className="mt-4 flex items-baseline gap-2">
        <span className={`text-4xl font-bold ${getNpsColor(field.nps_score ?? 0)}`}>
          {field.nps_score ?? "N/A"}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">NPS</span>
      </div>

      {/* Stacked bar */}
      <div className="mt-5 flex h-4 w-full overflow-hidden rounded-full">
        <div className="bg-red-500" style={{ width: `${dPct}%` }} />
        <div className="bg-yellow-400" style={{ width: `${paPct}%` }} />
        <div className="bg-green-500" style={{ width: `${pPct}%` }} />
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
          {field.detractors ?? 0} Detractors
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400" />
          {field.passives ?? 0} Passives
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
          {field.promoters ?? 0} Promoters
        </span>
      </div>
    </div>
  );
};

const RatingFieldCard = ({ field }: { field: FieldAnalytic }) => {
  const dist = field.distribution ?? {};
  const maxCount = Math.max(...Object.values(dist), 1);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-white/[0.03]">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        {field.field_label}
      </h3>
      <div className="mt-4 flex items-center gap-3">
        <span className="text-3xl font-bold text-gray-800 dark:text-white/90">
          {field.average?.toFixed(1) ?? "N/A"}
        </span>
        {field.average != null && <StarsDisplay value={field.average} />}
      </div>
      <div className="mt-5 space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = dist[String(star)] ?? 0;
          const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-3">
              <span className="w-8 text-right text-sm text-gray-600 dark:text-gray-300">
                {star}
                <span className="ml-0.5 text-yellow-400">&#9733;</span>
              </span>
              <div className="flex-1 h-3 rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-3 rounded-full bg-yellow-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-sm text-gray-500 dark:text-gray-400">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ScaleFieldCard = ({ field }: { field: FieldAnalytic }) => {
  const dist = field.distribution ?? {};
  const keys = Object.keys(dist).sort((a, b) => Number(a) - Number(b));
  const maxCount = Math.max(...Object.values(dist), 1);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-white/[0.03]">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        {field.field_label}
      </h3>
      <div className="mt-4">
        <span className="text-3xl font-bold text-gray-800 dark:text-white/90">
          {field.average?.toFixed(1) ?? "N/A"}
        </span>
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">average</span>
      </div>
      <div className="mt-5 space-y-2">
        {keys.map((key) => {
          const count = dist[key] ?? 0;
          const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="w-8 text-right text-sm text-gray-600 dark:text-gray-300">
                {key}
              </span>
              <div className="flex-1 h-3 rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-3 rounded-full bg-blue-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-sm text-gray-500 dark:text-gray-400">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SelectFieldCard = ({ field }: { field: FieldAnalytic }) => {
  const dist = field.distribution ?? {};
  const total = Object.values(dist).reduce((s, v) => s + v, 0) || 1;
  const sorted = Object.entries(dist).sort((a, b) => b[1] - a[1]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-white/[0.03]">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        {field.field_label}
      </h3>
      <div className="mt-5 space-y-3">
        {sorted.map(([label, count]) => {
          const pct = (count / total) * 100;
          return (
            <div key={label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-200">{label}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {count} ({pct.toFixed(0)}%)
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-3 rounded-full bg-indigo-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TestimonialFieldCard = ({ field }: { field: FieldAnalytic }) => {
  const testimonials = field.testimonials ?? [];
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-white/[0.03]">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        {field.field_label}
      </h3>
      {testimonials.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          No testimonials collected yet.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
            >
              <p className="text-sm italic text-gray-700 dark:text-gray-200">
                &ldquo;{t.text}&rdquo;
              </p>
              {t.permission && (
                <span className="mt-2 inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Public OK
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TextFieldCard = ({ field }: { field: FieldAnalytic }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-white/[0.03]">
    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
      {field.field_label}
    </h3>
    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
      {field.total_answers} responses collected
    </p>
  </div>
);

const FieldCard = ({ field }: { field: FieldAnalytic }) => {
  switch (field.field_type) {
    case "nps":
      return <NpsFieldCard field={field} />;
    case "rating":
      return <RatingFieldCard field={field} />;
    case "scale":
      return <ScaleFieldCard field={field} />;
    case "select":
    case "radio":
      return <SelectFieldCard field={field} />;
    case "testimonial":
      return <TestimonialFieldCard field={field} />;
    default:
      return <TextFieldCard field={field} />;
  }
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const SurveyAnalytics: React.FC<SurveyAnalyticsProps> = ({ surveyId }) => {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/surveys/${surveyId}/analytics`);
        if (!res.ok) {
          throw new Error(`Failed to load analytics (${res.status})`);
        }
        const json: AnalyticsResponse = await res.json();
        if (!cancelled) {
          setData(json);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "An unexpected error occurred");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();
    return () => {
      cancelled = true;
    };
  }, [surveyId]);

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {Array.from({ length: 3 }, (_, i) => (
            <SkeletonFieldCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // ---- Error state ----
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
          Error Loading Analytics
        </h3>
        <p className="mt-2 text-sm text-red-600 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { survey, analytics } = data;

  return (
    <div className="space-y-8">
      {/* ---------- Top Section: Overview Cards ---------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        {/* Total Responses */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-white/[0.03]">
          <span className="text-sm text-gray-500 dark:text-gray-400">Total Responses</span>
          <h4 className="mt-2 text-3xl font-bold text-gray-800 dark:text-white/90">
            {analytics.total_responses}
          </h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            out of {survey.sent_count} sent
          </p>
        </div>

        {/* Response Rate */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-white/[0.03]">
          <span className="text-sm text-gray-500 dark:text-gray-400">Response Rate</span>
          <div className="mt-3 flex items-center gap-4">
            <CircularProgress percentage={analytics.response_rate} />
            <span className="text-3xl font-bold text-gray-800 dark:text-white/90">
              {analytics.response_rate.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* NPS Score */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-white/[0.03]">
          <span className="text-sm text-gray-500 dark:text-gray-400">NPS Score</span>
          {analytics.nps_score != null ? (
            <h4
              className={`mt-2 text-3xl font-bold ${getNpsColor(analytics.nps_score)}`}
            >
              {analytics.nps_score}
            </h4>
          ) : (
            <h4 className="mt-2 text-3xl font-bold text-gray-400 dark:text-gray-500">
              N/A
            </h4>
          )}
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">-100 to 100 scale</p>
        </div>

        {/* Average Rating */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-white/[0.03]">
          <span className="text-sm text-gray-500 dark:text-gray-400">Average Rating</span>
          {analytics.average_rating != null ? (
            <>
              <h4 className="mt-2 text-3xl font-bold text-gray-800 dark:text-white/90">
                {analytics.average_rating.toFixed(1)}
              </h4>
              <div className="mt-1">
                <StarsDisplay value={analytics.average_rating} />
              </div>
            </>
          ) : (
            <h4 className="mt-2 text-3xl font-bold text-gray-400 dark:text-gray-500">
              N/A
            </h4>
          )}
        </div>
      </div>

      {/* ---------- Middle Section: Field Analytics ---------- */}
      {analytics.field_analytics.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Field Breakdown
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            {analytics.field_analytics.map((field) => (
              <FieldCard key={field.field_id} field={field} />
            ))}
          </div>
        </div>
      )}

      {/* ---------- Bottom Section: Benchmark Link ---------- */}
      {survey.event_id && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-white/[0.03]">
          <Link
            href="/dashboard/surveys?tab=benchmarks"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View benchmark across events &rarr;
          </Link>
        </div>
      )}
    </div>
  );
};
