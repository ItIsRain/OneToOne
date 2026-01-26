"use client";

import React, { useState } from "react";

interface PrizesTabProps {
  requirements: Record<string, unknown>;
  eventColor: string;
}

export const PrizesTab: React.FC<PrizesTabProps> = ({
  requirements,
  eventColor,
}) => {
  const [expandedJudge, setExpandedJudge] = useState<number | null>(null);

  const prizes = Array.isArray(requirements.prizes)
    ? requirements.prizes as Array<{key: string; value: string}>
    : [];
  const specialAwards = Array.isArray(requirements.special_awards)
    ? requirements.special_awards as Array<{key: string; value: string}>
    : [];
  const judgingCriteria = Array.isArray(requirements.judging_criteria)
    ? requirements.judging_criteria as Array<{key: string; value: string}>
    : [];
  const judges = Array.isArray(requirements.judges)
    ? requirements.judges as Array<{name: string; title?: string; company?: string; bio?: string; avatar_url?: string}>
    : [];

  const hasPrizes = prizes.length > 0;
  const hasSpecialAwards = specialAwards.length > 0;
  const hasJudgingCriteria = judgingCriteria.length > 0;
  const hasJudges = judges.length > 0;

  const prizeEmojis = ["🥇", "🥈", "🥉", "🏅", "🎖️"];

  return (
    <div className="space-y-6">
      {/* Main Prizes */}
      {hasPrizes ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="text-xl">&#127942;</span> Prizes
          </h3>
          <div className="grid gap-4">
            {prizes.map((prize, i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-xl border-2 p-5 ${
                  i === 0
                    ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-300 dark:border-yellow-700'
                    : i === 1
                    ? 'bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-800/50 dark:to-slate-800/50 border-gray-300 dark:border-gray-600'
                    : i === 2
                    ? 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-300 dark:border-orange-700'
                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{prizeEmojis[i] || "🎁"}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {i === 0 ? '1st Place' : i === 1 ? '2nd Place' : i === 2 ? '3rd Place' : `${i + 1}th Place`}
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{prize.key}</h4>
                    <p className="text-gray-600 dark:text-gray-400">{prize.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4 text-3xl">
            &#127942;
          </div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Prizes Coming Soon</h4>
          <p className="text-gray-500 dark:text-gray-400">Prize details will be announced before the event starts.</p>
        </div>
      )}

      {/* Special Awards */}
      {hasSpecialAwards ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl">&#11088;</span> Special Awards
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {specialAwards.map((award, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                    style={{ backgroundColor: eventColor }}
                  >
                    &#127881;
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{award.key}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{award.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Judging Criteria */}
      {hasJudgingCriteria ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl">&#128203;</span> Judging Criteria
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your project will be evaluated based on the following criteria:
          </p>
          <div className="space-y-4">
            {judgingCriteria.map((criterion, i) => (
              <div key={i} className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: eventColor }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{criterion.key}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{criterion.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Judges */}
      {hasJudges ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl">&#128101;</span> Meet the Judges
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {judges.map((judge, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setExpandedJudge(expandedJudge === i ? null : i)}
              >
                <div className="flex items-center gap-4">
                  {judge.avatar_url ? (
                    <img
                      src={judge.avatar_url}
                      alt={judge.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
                      style={{ backgroundColor: eventColor }}
                    >
                      {judge.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">{judge.name}</h4>
                    {judge.title ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{judge.title}</p>
                    ) : null}
                    {judge.company ? (
                      <p className="text-xs text-gray-500 dark:text-gray-500 truncate">{judge.company}</p>
                    ) : null}
                  </div>
                </div>
                {expandedJudge === i && judge.bio ? (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{judge.bio}</p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Tips for Success */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl"
            style={{ backgroundColor: `${eventColor}20` }}
          >
            &#128161;
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Tips for Winning</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span style={{ color: eventColor }}>&#8226;</span>
                Focus on solving a real problem with measurable impact
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: eventColor }}>&#8226;</span>
                Demonstrate technical innovation and creativity
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: eventColor }}>&#8226;</span>
                Prepare a compelling demo that shows your solution in action
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: eventColor }}>&#8226;</span>
                Practice your pitch to clearly communicate your value proposition
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
