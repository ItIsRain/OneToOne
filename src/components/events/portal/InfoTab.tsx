"use client";

import React from "react";

interface InfoTabProps {
  requirements: Record<string, unknown>;
  eventColor: string;
  eventDescription?: string;
  eventVenue?: string;
  eventAddress?: string;
  organizerName?: string;
  organizerLogo?: string;
  organizerWebsite?: string;
}

const techLabels: Record<string, string> = {
  any: "Any Technology",
  web: "Web Development",
  mobile: "Mobile Apps",
  ai_ml: "AI/ML",
  blockchain: "Blockchain",
  iot: "IoT",
  ar_vr: "AR/VR",
  data_science: "Data Science",
  cloud: "Cloud Computing",
  cybersecurity: "Cybersecurity",
  game_dev: "Game Development",
};

const teamFormationLabels: Record<string, string> = {
  pre_formed: "Pre-formed Teams Only",
  on_site: "Form Teams On-Site",
  both: "Both Options Available",
};

export const InfoTab: React.FC<InfoTabProps> = ({
  requirements,
  eventColor,
  eventDescription,
  eventVenue,
  eventAddress,
  organizerName,
  organizerLogo,
  organizerWebsite,
}) => {
  const allowedTechnologies = Array.isArray(requirements.allowed_technologies)
    ? requirements.allowed_technologies as string[]
    : [];
  const resources = Array.isArray(requirements.resources_provided)
    ? requirements.resources_provided as string[]
    : [];
  const rules = Array.isArray(requirements.rules)
    ? requirements.rules as string[]
    : [];
  const faqs = Array.isArray(requirements.faqs)
    ? requirements.faqs as Array<{question: string; answer: string}>
    : [];

  const teamFormation = requirements.team_formation as string | undefined;
  const minTeamSize = requirements.team_size_min as number | undefined;
  const maxTeamSize = requirements.team_size_max as number | undefined;
  const participationMode = requirements.participation_mode as string | undefined;
  const experienceLevel = requirements.experience_level as string | undefined;

  const hasAllowedTech = allowedTechnologies.length > 0;
  const hasResources = resources.length > 0;
  const hasRules = rules.length > 0;
  const hasFaqs = faqs.length > 0;

  return (
    <div className="space-y-6">
      {/* About the Event */}
      {eventDescription ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl">&#128196;</span> About the Event
          </h3>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {eventDescription}
            </p>
          </div>
        </div>
      ) : null}

      {/* Venue & Location */}
      {(eventVenue || eventAddress) ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl">&#128205;</span> Venue & Location
          </h3>
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${eventColor}20`, color: eventColor }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              {eventVenue ? (
                <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{eventVenue}</h4>
              ) : null}
              {eventAddress ? (
                <p className="text-gray-600 dark:text-gray-400 mt-1">{eventAddress}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Participation Details */}
      {(teamFormation || minTeamSize || maxTeamSize || participationMode || experienceLevel) ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl">&#128101;</span> Participation Details
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {(minTeamSize || maxTeamSize) ? (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Team Size</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {minTeamSize === maxTeamSize
                    ? minTeamSize === 1
                      ? "Solo participation"
                      : `${minTeamSize} members`
                    : `${minTeamSize || 1} - ${maxTeamSize || 5} members`}
                </p>
              </div>
            ) : null}

            {teamFormation ? (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Team Formation</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {teamFormationLabels[teamFormation] || teamFormation}
                </p>
              </div>
            ) : null}

            {participationMode ? (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Mode</p>
                <p className="font-semibold text-gray-900 dark:text-white capitalize">
                  {participationMode.replace(/_/g, ' ')}
                </p>
              </div>
            ) : null}

            {experienceLevel ? (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Experience Level</p>
                <p className="font-semibold text-gray-900 dark:text-white capitalize">
                  {experienceLevel.replace(/_/g, ' ')}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Allowed Technologies */}
      {hasAllowedTech ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl">&#128187;</span> Allowed Technologies
          </h3>
          <div className="flex flex-wrap gap-3">
            {allowedTechnologies.map((tech, i) => (
              <span
                key={i}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
              >
                {techLabels[tech] || tech}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Resources Provided */}
      {hasResources ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl">&#127873;</span> Resources Provided
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {resources.map((resource, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-300 capitalize">{resource.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Rules */}
      {hasRules ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl">&#128220;</span> Rules & Guidelines
          </h3>
          <ul className="space-y-3">
            {rules.map((rule, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                  style={{ backgroundColor: eventColor }}
                >
                  {i + 1}
                </span>
                <span className="text-gray-700 dark:text-gray-300">{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* FAQs */}
      {hasFaqs ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl">&#10067;</span> Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{faq.question}</h4>
                <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Organizer */}
      {organizerName ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl">&#127970;</span> Organizer
          </h3>
          <div className="flex items-center gap-4">
            {organizerLogo ? (
              <img
                src={organizerLogo}
                alt={organizerName}
                className="w-16 h-16 rounded-xl object-cover"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: eventColor }}
              >
                {organizerName.charAt(0)}
              </div>
            )}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{organizerName}</h4>
              {organizerWebsite ? (
                <a
                  href={organizerWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline"
                  style={{ color: eventColor }}
                >
                  Visit website &#8594;
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Contact/Support */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl"
            style={{ backgroundColor: `${eventColor}20` }}
          >
            &#128172;
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Need Help?</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              If you have any questions about the event, feel free to reach out to the organizers.
              Check the event page for contact information or join the event's community channels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
