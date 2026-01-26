"use client";

import React, { useState } from "react";

interface PrizesTabProps {
  requirements: Record<string, unknown>;
  eventColor: string;
  eventType?: string;
}

// Medal icons for prizes
const MedalIcons = {
  gold: (
    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="14" r="6" strokeWidth={1.5} fill="#FFD700" stroke="#DAA520" />
      <path d="M12 4v4" strokeWidth={2} stroke="#DAA520" />
      <path d="M8 2l4 6 4-6" strokeWidth={1.5} stroke="#DC143C" fill="#DC143C" />
      <text x="12" y="17" textAnchor="middle" fontSize="8" fill="#8B4513" fontWeight="bold">1</text>
    </svg>
  ),
  silver: (
    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="14" r="6" strokeWidth={1.5} fill="#C0C0C0" stroke="#A9A9A9" />
      <path d="M12 4v4" strokeWidth={2} stroke="#A9A9A9" />
      <path d="M8 2l4 6 4-6" strokeWidth={1.5} stroke="#4169E1" fill="#4169E1" />
      <text x="12" y="17" textAnchor="middle" fontSize="8" fill="#696969" fontWeight="bold">2</text>
    </svg>
  ),
  bronze: (
    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="14" r="6" strokeWidth={1.5} fill="#CD7F32" stroke="#8B4513" />
      <path d="M12 4v4" strokeWidth={2} stroke="#8B4513" />
      <path d="M8 2l4 6 4-6" strokeWidth={1.5} stroke="#228B22" fill="#228B22" />
      <text x="12" y="17" textAnchor="middle" fontSize="8" fill="#5C4033" fontWeight="bold">3</text>
    </svg>
  ),
  default: (
    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="14" r="6" strokeWidth={1.5} />
      <path d="M12 4v4" strokeWidth={2} />
      <path d="M8 2l4 6 4-6" strokeWidth={1.5} fill="none" />
    </svg>
  ),
};

const Icons = {
  trophy: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3h14M5 3v4a7 7 0 007 7m-7-11H3v4a4 4 0 004 4m12-8v4a7 7 0 01-7 7m7-11h2v4a4 4 0 01-4 4m-5 3v4m-4 0h8" />
    </svg>
  ),
  star: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  award: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  clipboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  lightbulb: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
};

const getMedalIcon = (index: number) => {
  if (index === 0) return MedalIcons.gold;
  if (index === 1) return MedalIcons.silver;
  if (index === 2) return MedalIcons.bronze;
  return MedalIcons.default;
};

export const PrizesTab: React.FC<PrizesTabProps> = ({
  requirements,
  eventColor,
  eventType = "hackathon",
}) => {
  const [expandedJudge, setExpandedJudge] = useState<number | null>(null);

  const isGameJam = eventType === "game_jam";

  const prizes = Array.isArray(requirements.prizes)
    ? requirements.prizes as Array<{key: string; value: string}>
    : [];
  const specialAwards = Array.isArray(requirements.special_awards)
    ? requirements.special_awards as Array<{key: string; value: string}>
    : [];
  // Support both judging_criteria (hackathon) and judging_categories (game_jam)
  const judgingCriteria = Array.isArray(requirements.judging_criteria)
    ? requirements.judging_criteria as Array<{key: string; value: string}>
    : Array.isArray(requirements.judging_categories)
    ? requirements.judging_categories as Array<{key: string; value: string}>
    : [];
  const judges = Array.isArray(requirements.judges)
    ? requirements.judges as Array<{name: string; title?: string; company?: string; bio?: string; avatar_url?: string}>
    : [];

  // Game Jam specific fields
  const prizePoolRaw = requirements.prize_pool;
  const prizePool = typeof prizePoolRaw === 'object' && prizePoolRaw !== null
    ? (prizePoolRaw as { amount?: number; currency?: string })
    : typeof prizePoolRaw === 'number'
    ? { amount: prizePoolRaw, currency: 'USD' }
    : null;
  const communityVoting = requirements.community_voting as boolean;
  const votingPeriod = requirements.voting_period as number;

  const hasPrizes = prizes.length > 0;
  const hasSpecialAwards = specialAwards.length > 0;
  const hasJudgingCriteria = judgingCriteria.length > 0;
  const hasJudges = judges.length > 0;
  const hasPrizePool = prizePool && prizePool.amount;

  return (
    <div className="space-y-6">
      {/* Prize Pool (Game Jam) */}
      {hasPrizePool && (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Prize Pool</p>
            <p className="text-4xl font-bold" style={{ color: eventColor }}>
              {prizePool!.currency === 'USD' ? '$' : prizePool!.currency + ' '}{prizePool!.amount!.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Main Prizes */}
      {hasPrizes ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="text-xl" style={{ color: eventColor }}>{Icons.trophy}</span> Prizes
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
                  <div>{getMedalIcon(i)}</div>
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
      ) : !hasPrizePool && !hasJudgingCriteria ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4 text-gray-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3h14M5 3v4a7 7 0 007 7m-7-11H3v4a4 4 0 004 4m12-8v4a7 7 0 01-7 7m7-11h2v4a4 4 0 01-4 4m-5 3v4m-4 0h8" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Prizes Coming Soon</h4>
          <p className="text-gray-500 dark:text-gray-400">Prize details will be announced before the event starts.</p>
        </div>
      ) : null}

      {/* Special Awards */}
      {hasSpecialAwards ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl" style={{ color: eventColor }}>{Icons.star}</span> Special Awards
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {specialAwards.map((award, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: eventColor }}
                  >
                    {Icons.award}
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
            <span className="text-xl" style={{ color: eventColor }}>{Icons.clipboard}</span> Judging Criteria
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
            <span className="text-xl" style={{ color: eventColor }}>{Icons.users}</span> Meet the Judges
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

      {/* Community Voting (Game Jam) */}
      {communityVoting && (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl" style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </span> Community Voting
          </h3>
          <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-900/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Public Voting Enabled</p>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  The community will vote on submissions{votingPeriod ? ` for ${votingPeriod} days` : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips for Success */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${eventColor}20`, color: eventColor }}
          >
            {Icons.lightbulb}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{isGameJam ? 'Tips for Game Jams' : 'Tips for Winning'}</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span style={{ color: eventColor }}>-</span>
                Focus on solving a real problem with measurable impact
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: eventColor }}>-</span>
                Demonstrate technical innovation and creativity
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: eventColor }}>-</span>
                Prepare a compelling demo that shows your solution in action
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: eventColor }}>-</span>
                Practice your pitch to clearly communicate your value proposition
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
