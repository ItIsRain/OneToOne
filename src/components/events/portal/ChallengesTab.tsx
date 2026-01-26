"use client";

import React, { useState } from "react";

interface ChallengesTabProps {
  requirements: Record<string, unknown>;
  eventColor: string;
}

export const ChallengesTab: React.FC<ChallengesTabProps> = ({
  requirements,
  eventColor,
}) => {
  const [expandedChallenge, setExpandedChallenge] = useState<number | null>(0);

  const problemStatements = Array.isArray(requirements.problem_statements)
    ? requirements.problem_statements as Array<{key: string; value: string}>
    : [];
  const themes = Array.isArray(requirements.themes) ? requirements.themes as string[] : [];

  const hasProblemStatements = problemStatements.length > 0;
  const hasThemes = themes.length > 0;

  return (
    <div className="space-y-6">
      {/* Themes */}
      {hasThemes ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl">&#127919;</span> Hackathon Themes
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your project should align with one or more of these themes:
          </p>
          <div className="flex flex-wrap gap-3">
            {themes.map((theme, i) => (
              <div
                key={i}
                className="px-5 py-3 rounded-xl text-base font-medium shadow-sm"
                style={{ backgroundColor: `${eventColor}15`, color: eventColor, border: `2px solid ${eventColor}30` }}
              >
                {theme}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Problem Statements */}
      {hasProblemStatements ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <span className="text-xl">&#128161;</span> Problem Statements
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Choose a challenge to work on. Click to expand and see full details.
          </p>
          <div className="space-y-4">
            {problemStatements.map((ps, i) => (
              <div
                key={i}
                className={`rounded-xl border-2 overflow-hidden transition-all ${
                  expandedChallenge === i
                    ? 'border-opacity-100 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                style={expandedChallenge === i ? { borderColor: eventColor } : undefined}
              >
                <button
                  onClick={() => setExpandedChallenge(expandedChallenge === i ? null : i)}
                  className="w-full p-5 flex items-center gap-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0 shadow-md"
                    style={{ backgroundColor: eventColor }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{ps.key}</h4>
                    {expandedChallenge !== i && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                        {ps.value}
                      </p>
                    )}
                  </div>
                  <svg
                    className={`w-6 h-6 text-gray-400 transition-transform shrink-0 ${expandedChallenge === i ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedChallenge === i ? (
                  <div className="px-5 pb-5 pt-0">
                    <div className="pl-16">
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{ps.value}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4 text-3xl">
            &#128161;
          </div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Challenges Coming Soon</h4>
          <p className="text-gray-500 dark:text-gray-400">Problem statements will be announced before the event starts.</p>
        </div>
      )}

      {/* Tips for Success */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl"
            style={{ backgroundColor: `${eventColor}20` }}
          >
            &#128218;
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Tips for Choosing a Challenge</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span style={{ color: eventColor }}>&#8226;</span>
                Pick a challenge that aligns with your team's skills and interests
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: eventColor }}>&#8226;</span>
                Consider the feasibility within the hackathon timeframe
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: eventColor }}>&#8226;</span>
                Think about the impact and innovation potential of your solution
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: eventColor }}>&#8226;</span>
                Read the judging criteria to understand what evaluators look for
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
