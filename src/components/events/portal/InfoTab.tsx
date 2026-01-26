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
  eventType?: string;
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

const skillLevelLabels: Record<string, string> = {
  beginner: "🟢 Beginner - No experience needed",
  intermediate: "🟡 Intermediate - Some experience",
  advanced: "🔴 Advanced - Experienced practitioners",
  all: "⚪ All Levels Welcome",
};

const workshopFormatLabels: Record<string, string> = {
  lecture: "Lecture & Presentation",
  hands_on: "Hands-on Lab",
  mixed: "Mixed (Lecture + Exercises)",
  project: "Build a Project",
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
  eventType = "hackathon",
}) => {
  const isWorkshop = eventType === "workshop";

  // Common fields
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

  // Workshop-specific fields
  const learningObjectives = Array.isArray(requirements.learning_objectives)
    ? requirements.learning_objectives as string[]
    : [];
  const topicsCovered = Array.isArray(requirements.topics_covered)
    ? requirements.topics_covered as string[]
    : [];
  const skillLevel = requirements.skill_level as string | undefined;
  const workshopFormat = requirements.workshop_format as string | undefined;
  const prerequisites = Array.isArray(requirements.prerequisites)
    ? requirements.prerequisites as string[]
    : [];
  const materialsNeeded = Array.isArray(requirements.materials_needed)
    ? requirements.materials_needed as string[]
    : [];
  const softwareRequirements = Array.isArray(requirements.software_requirements)
    ? requirements.software_requirements as string[]
    : [];
  const materialsProvided = Array.isArray(requirements.materials_provided)
    ? requirements.materials_provided as string[]
    : [];
  const certification = requirements.certification as boolean | undefined;
  const instructorName = requirements.instructor_name as string | undefined;
  const instructorTitle = requirements.instructor_title as string | undefined;
  const instructorBio = requirements.instructor_bio as string | undefined;
  const instructorLinkedin = requirements.instructor_linkedin as string | undefined;

  const hasAllowedTech = allowedTechnologies.length > 0;
  const hasResources = resources.length > 0;
  const hasRules = rules.length > 0;
  const hasFaqs = faqs.length > 0;
  const hasLearningObjectives = learningObjectives.length > 0;
  const hasTopicsCovered = topicsCovered.length > 0;
  const hasPrerequisites = prerequisites.length > 0;
  const hasMaterialsNeeded = materialsNeeded.length > 0;
  const hasSoftwareRequirements = softwareRequirements.length > 0;
  const hasMaterialsProvided = materialsProvided.length > 0;
  const hasInstructor = instructorName || instructorTitle || instructorBio;

  return (
    <div className="space-y-6">
      {/* About the Event */}
      {eventDescription ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl" style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span> About the Event
          </h3>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {eventDescription}
            </p>
          </div>
        </div>
      ) : null}

      {/* Workshop: Skill Level & Format */}
      {isWorkshop && (skillLevel || workshopFormat) ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl" style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span> Workshop Details
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {skillLevel && (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Skill Level</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {skillLevelLabels[skillLevel] || skillLevel}
                </p>
              </div>
            )}
            {workshopFormat && (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Format</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {workshopFormatLabels[workshopFormat] || workshopFormat}
                </p>
              </div>
            )}
            {certification && (
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 sm:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Certificate Provided</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">You'll receive a certificate upon completion</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Workshop: What You'll Learn */}
      {isWorkshop && hasLearningObjectives ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl" style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </span> What You'll Learn
          </h3>
          <ul className="space-y-3">
            {learningObjectives.map((objective, i) => (
              <li key={i} className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                  style={{ backgroundColor: eventColor }}
                >
                  {i + 1}
                </div>
                <span className="text-gray-700 dark:text-gray-300">{objective}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Workshop: Topics Covered */}
      {isWorkshop && hasTopicsCovered ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl" style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </span> Topics Covered
          </h3>
          <div className="flex flex-wrap gap-3">
            {topicsCovered.map((topic, i) => (
              <span
                key={i}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Workshop: Prerequisites */}
      {isWorkshop && hasPrerequisites ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl" style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </span> Prerequisites
          </h3>
          <ul className="space-y-2">
            {prerequisites.map((prereq, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-300">{prereq}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Workshop: What to Bring */}
      {isWorkshop && hasMaterialsNeeded ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl" style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </span> What to Bring
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {materialsNeeded.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Workshop: Software to Install */}
      {isWorkshop && hasSoftwareRequirements ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl" style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </span> Software to Install
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {softwareRequirements.map((software, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-300">{software}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Workshop: What We Provide */}
      {isWorkshop && hasMaterialsProvided ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl" style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </span> What We Provide
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {materialsProvided.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Workshop: Instructor */}
      {isWorkshop && hasInstructor ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl" style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span> Your Instructor
          </h3>
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0"
              style={{ backgroundColor: eventColor }}
            >
              {instructorName?.charAt(0) || "?"}
            </div>
            <div className="flex-1">
              {instructorName && (
                <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{instructorName}</h4>
              )}
              {instructorTitle && (
                <p className="text-gray-600 dark:text-gray-400 text-sm">{instructorTitle}</p>
              )}
              {instructorBio && (
                <p className="text-gray-700 dark:text-gray-300 mt-3 leading-relaxed">{instructorBio}</p>
              )}
              {instructorLinkedin && (
                <a
                  href={instructorLinkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 text-sm font-medium hover:underline"
                  style={{ color: eventColor }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  View LinkedIn Profile
                </a>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Venue & Location */}
      {(eventVenue || eventAddress) ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl" style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span> Venue & Location
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
            <span className="text-xl" style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </span> Participation Details
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
            <span className="text-xl" style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </span> Allowed Technologies
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
            <span className="text-xl" style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </span> Resources Provided
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
            <span className="text-xl" style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </span> Rules & Guidelines
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
            <span className="text-xl" style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span> Frequently Asked Questions
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
            <span className="text-xl" style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span> Organizer
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
                  Visit website -&gt;
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
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${eventColor}20`, color: eventColor }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
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
