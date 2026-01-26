"use client";

import React, { useState } from "react";

interface ChallengesTabProps {
  requirements: Record<string, unknown>;
  eventColor: string;
  eventType?: string;
}

export const ChallengesTab: React.FC<ChallengesTabProps> = ({
  requirements,
  eventColor,
  eventType = "hackathon",
}) => {
  const [expandedChallenge, setExpandedChallenge] = useState<number | null>(0);

  const isGameJam = eventType === "game_jam";

  // Hackathon fields
  const problemStatements = Array.isArray(requirements.problem_statements)
    ? requirements.problem_statements as Array<{key: string; value: string}>
    : [];
  const themes = Array.isArray(requirements.themes) ? requirements.themes as string[] : [];

  // Game Jam fields
  const jamTheme = requirements.jam_theme as string;
  const rules = Array.isArray(requirements.rules) ? requirements.rules as string[] : [];
  const diversifiers = Array.isArray(requirements.diversifiers) ? requirements.diversifiers as string[] : [];
  const jamDuration = requirements.jam_duration as number;
  const allowedEngines = Array.isArray(requirements.allowed_engines) ? requirements.allowed_engines as string[] : [];
  const platforms = Array.isArray(requirements.platforms) ? requirements.platforms as string[] : [];
  const assetRules = requirements.asset_rules as string;

  // Engine labels
  const engineConfig: Record<string, { label: string; icon: string }> = {
    any: { label: "Any Engine", icon: "🎮" },
    unity: { label: "Unity", icon: "🔷" },
    unreal: { label: "Unreal Engine", icon: "⬛" },
    godot: { label: "Godot", icon: "🤖" },
    gamemaker: { label: "GameMaker", icon: "🎯" },
    construct: { label: "Construct", icon: "🔧" },
    custom: { label: "Custom/From Scratch", icon: "💻" },
  };

  // Platform labels
  const platformConfig: Record<string, { label: string; icon: string }> = {
    web: { label: "Web Browser", icon: "🌐" },
    windows: { label: "Windows", icon: "💻" },
    mac: { label: "macOS", icon: "🍎" },
    linux: { label: "Linux", icon: "🐧" },
    mobile: { label: "Mobile", icon: "📱" },
  };

  // Asset rules
  const assetRulesConfig: Record<string, { label: string; icon: string; description: string }> = {
    original: { label: "Original Assets Only", icon: "🎨", description: "All art, audio, and assets must be created during the jam" },
    licensed: { label: "Licensed Assets OK", icon: "📜", description: "You may use properly licensed assets" },
    any: { label: "Any Assets Allowed", icon: "✅", description: "No restrictions on asset usage" },
  };

  const hasProblemStatements = problemStatements.length > 0;
  const hasThemes = themes.length > 0;
  const hasRules = rules.length > 0;
  const hasDiversifiers = diversifiers.length > 0;
  const hasEngines = allowedEngines.length > 0;
  const hasPlatforms = platforms.length > 0;

  // Game Jam Content
  if (isGameJam) {
    const hasContent = jamTheme || hasRules || hasDiversifiers || hasEngines || hasPlatforms || assetRules;

    return (
      <div className="space-y-6">
        {/* Jam Theme */}
        {jamTheme && (
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-xl" style={{ color: eventColor }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </span> Jam Theme
            </h3>
            <div className="p-6 rounded-xl text-center" style={{ backgroundColor: `${eventColor}10` }}>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">"{jamTheme}"</p>
              {jamDuration && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Build a game around this theme in {jamDuration} hours!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Jam Rules */}
        {hasRules && (
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-xl" style={{ color: eventColor }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </span> Jam Rules
            </h3>
            <div className="space-y-3">
              {rules.map((rule, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: eventColor }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">{rule}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bonus Challenges / Diversifiers */}
        {hasDiversifiers && (
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-xl" style={{ color: eventColor }}>⭐</span> Bonus Challenges
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Complete these optional challenges for extra recognition!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {diversifiers.map((challenge, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30">
                  <span className="text-yellow-500 text-lg">⭐</span>
                  <span className="text-gray-700 dark:text-gray-300 text-sm">{challenge}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Requirements */}
        {(hasEngines || hasPlatforms || assetRules) && (
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-xl" style={{ color: eventColor }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span> Technical Requirements
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Allowed Engines */}
              {hasEngines && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Allowed Game Engines</h4>
                  <div className="flex flex-wrap gap-2">
                    {allowedEngines.map((engine, i) => (
                      <span
                        key={i}
                        className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                        style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                      >
                        <span>{engineConfig[engine]?.icon || "🎮"}</span>
                        {engineConfig[engine]?.label || engine}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Platforms */}
              {hasPlatforms && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Target Platforms</h4>
                  <div className="flex flex-wrap gap-2">
                    {platforms.map((platform, i) => (
                      <span
                        key={i}
                        className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      >
                        <span>{platformConfig[platform]?.icon || "💻"}</span>
                        {platformConfig[platform]?.label || platform}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Asset Rules */}
              {assetRules && (
                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Asset Rules</h4>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{assetRulesConfig[assetRules]?.icon || "📦"}</span>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{assetRulesConfig[assetRules]?.label || assetRules}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{assetRulesConfig[assetRules]?.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasContent && (
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4 text-gray-400">
              <span className="text-3xl">🎮</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Theme Coming Soon</h4>
            <p className="text-gray-500 dark:text-gray-400">The jam theme and rules will be announced before the event starts.</p>
          </div>
        )}

        {/* Tips for Success */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${eventColor}20`, color: eventColor }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Tips for Game Jams</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span style={{ color: eventColor }}>-</span>
                  Start with a small, polished idea rather than an ambitious incomplete one
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: eventColor }}>-</span>
                  Interpret the theme creatively - unique takes often stand out
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: eventColor }}>-</span>
                  Focus on core gameplay loop first, polish later
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: eventColor }}>-</span>
                  Leave time for bug fixing and building your final submission
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Hackathon Content (default)
  return (
    <div className="space-y-6">
      {/* Themes */}
      {hasThemes ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl" style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
                <circle cx="12" cy="12" r="6" strokeWidth={1.5} />
                <circle cx="12" cy="12" r="2" strokeWidth={1.5} />
              </svg>
            </span> Hackathon Themes
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
            <span className="text-xl" style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </span> Problem Statements
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
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4 text-gray-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Challenges Coming Soon</h4>
          <p className="text-gray-500 dark:text-gray-400">Problem statements will be announced before the event starts.</p>
        </div>
      )}

      {/* Tips for Success */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${eventColor}20`, color: eventColor }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Tips for Choosing a Challenge</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span style={{ color: eventColor }}>-</span>
                Pick a challenge that aligns with your team's skills and interests
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: eventColor }}>-</span>
                Consider the feasibility within the hackathon timeframe
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: eventColor }}>-</span>
                Think about the impact and innovation potential of your solution
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: eventColor }}>-</span>
                Read the judging criteria to understand what evaluators look for
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
