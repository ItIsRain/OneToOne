"use client";
import React from "react";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";

interface EventRequirements {
  problemStatement?: string;
  judgingCriteria?: string[];
  prizes?: { place: string; prize: string }[];
  teamSize?: string;
  themes?: string[];
  rules?: string[];
  submissionDeadline?: string;
  techStack?: string[];
  gameEngine?: string;
  speakerName?: string;
  speakerBio?: string;
  speakerPhoto?: string;
  speakerNotes?: string;
  talkDuration?: string;
  talkTopics?: string[];
  slidesUrl?: string;
  recordingUrl?: string;
  panelists?: { name: string; title: string; bio: string }[];
  moderator?: string;
  discussionTopics?: string[];
  prerequisites?: string[];
  materialsNeeded?: string[];
  curriculum?: { title: string; duration: string; description: string }[];
  maxParticipants?: number;
  skillLevel?: string;
  certification?: boolean;
  tracks?: { name: string; description: string }[];
  schedule?: { time: string; title: string; speaker?: string; room?: string }[];
  keynotes?: { speaker: string; topic: string; time: string }[];
  dressCode?: string;
  menuOptions?: string[];
  entertainment?: string;
  awardCategories?: { category: string; nominees?: string[]; winner?: string }[];
  votingDeadline?: string;
  productName?: string;
  productDescription?: string;
  demoSchedule?: { time: string; presenter: string; product: string }[];
  mediaKit?: string;
  pressContacts?: string[];
  sponsors?: { name: string; tier: string; logo?: string }[];
  agenda?: { time: string; activity: string }[];
  faqs?: { question: string; answer: string }[];
  contactPerson?: string;
  contactEmail?: string;
}

interface EventData {
  id: number;
  title: string;
  client: string;
  date: string;
  endDate?: string;
  time: string;
  endTime?: string;
  status: "Upcoming" | "In Progress" | "Completed" | "Cancelled";
  type: string;
  icon: string;
  category: string;
  isVirtual?: boolean;
  virtualPlatform?: string;
  location?: string;
  attendees?: number;
  description?: string;
  requirements?: EventRequirements;
}

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventData | null;
  onEdit?: () => void;
}

export function EventDetailsModal({ isOpen, onClose, event, onEdit }: EventDetailsModalProps) {
  if (!event) return null;

  const req = event.requirements || {};

  const statusColors = {
    "Upcoming": "from-blue-500 to-indigo-600",
    "In Progress": "from-amber-500 to-orange-600",
    "Completed": "from-emerald-500 to-green-600",
    "Cancelled": "from-red-500 to-rose-600",
  };

  const renderHackathonDetails = () => (
    <div className="space-y-6">
      {req.problemStatement && (
        <div className="group">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Challenge</h4>
          </div>
          <div className="ml-10 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-500/10 dark:to-indigo-500/10 border border-purple-100 dark:border-purple-500/20">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{req.problemStatement}</p>
          </div>
        </div>
      )}

      {req.judgingCriteria && req.judgingCriteria.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Judging Criteria</h4>
          </div>
          <div className="ml-10 grid gap-2">
            {req.judgingCriteria.map((criteria, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                  {i + 1}
                </div>
                <span className="text-gray-700 dark:text-gray-300">{criteria}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {req.prizes && req.prizes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Prizes</h4>
          </div>
          <div className="ml-10 grid gap-3 sm:grid-cols-2">
            {req.prizes.map((prize, i) => (
              <div
                key={i}
                className={`relative overflow-hidden p-4 rounded-xl border ${
                  i === 0
                    ? "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-500/10 dark:to-amber-500/10 border-yellow-200 dark:border-yellow-500/30"
                    : i === 1
                    ? "bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-500/10 dark:to-slate-500/10 border-gray-200 dark:border-gray-500/30"
                    : "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 border-orange-200 dark:border-orange-500/30"
                }`}
              >
                {i < 3 && (
                  <div className="absolute top-2 right-2 text-2xl">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                  </div>
                )}
                <p className="font-semibold text-gray-900 dark:text-white">{prize.place}</p>
                <p className="text-lg font-bold text-brand-600 dark:text-brand-400 mt-1">{prize.prize}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {req.themes && req.themes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Themes</h4>
          </div>
          <div className="ml-10 flex flex-wrap gap-2">
            {req.themes.map((theme, i) => (
              <span
                key={i}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-medium shadow-lg shadow-teal-500/25"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {req.rules && req.rules.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Rules</h4>
          </div>
          <div className="ml-10 space-y-2">
            {req.rules.map((rule, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800">
                <svg className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(req.teamSize || req.submissionDeadline) && (
        <div className="ml-10 grid gap-4 sm:grid-cols-2">
          {req.teamSize && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-500/10 dark:to-blue-500/10 border border-indigo-100 dark:border-indigo-500/20">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xs font-semibold uppercase tracking-wider">Team Size</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{req.teamSize}</p>
            </div>
          )}
          {req.submissionDeadline && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-500/10 dark:to-pink-500/10 border border-rose-100 dark:border-rose-500/20">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-semibold uppercase tracking-wider">Deadline</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {new Date(req.submissionDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </p>
            </div>
          )}
        </div>
      )}

      {req.techStack && req.techStack.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Tech Stack</h4>
          </div>
          <div className="ml-10 flex flex-wrap gap-2">
            {req.techStack.map((tech, i) => (
              <span key={i} className="px-3 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 text-sm font-medium">
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSpeakerDetails = () => (
    <div className="space-y-6">
      {(req.speakerName || req.speakerBio) && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-purple-500/10 border border-blue-100 dark:border-blue-500/20">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/30">
              🎤
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">{req.speakerName}</h4>
              <p className="text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{req.speakerBio}</p>
            </div>
          </div>
        </div>
      )}

      {req.speakerNotes && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Admin Notes</span>
          </div>
          <p className="text-amber-900 dark:text-amber-200 text-sm whitespace-pre-wrap">{req.speakerNotes}</p>
        </div>
      )}

      {req.talkTopics && req.talkTopics.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Topics Covered
          </h4>
          <div className="flex flex-wrap gap-2">
            {req.talkTopics.map((topic, i) => (
              <span key={i} className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-emerald-500 text-white text-sm font-medium shadow-lg shadow-brand-500/25">
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {(req.talkDuration || req.slidesUrl || req.recordingUrl) && (
        <div className="grid gap-4 sm:grid-cols-3">
          {req.talkDuration && (
            <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Duration</div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{req.talkDuration}</p>
            </div>
          )}
          {req.slidesUrl && (
            <a href={req.slidesUrl} target="_blank" rel="noopener noreferrer" className="p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 shadow-sm hover:border-brand-500 hover:shadow-brand-500/10 transition-all group">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Slides</div>
              <p className="text-brand-600 dark:text-brand-400 font-semibold group-hover:underline flex items-center gap-1">
                View Slides
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </p>
            </a>
          )}
          {req.recordingUrl && (
            <a href={req.recordingUrl} target="_blank" rel="noopener noreferrer" className="p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 shadow-sm hover:border-brand-500 hover:shadow-brand-500/10 transition-all group">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Recording</div>
              <p className="text-brand-600 dark:text-brand-400 font-semibold group-hover:underline flex items-center gap-1">
                Watch Recording
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </p>
            </a>
          )}
        </div>
      )}

      {req.panelists && req.panelists.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Panelists
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            {req.panelists.map((panelist, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold">
                    {panelist.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{panelist.name}</p>
                    <p className="text-xs text-brand-600 dark:text-brand-400">{panelist.title}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{panelist.bio}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {req.discussionTopics && req.discussionTopics.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Discussion Topics</h4>
          <div className="space-y-2">
            {req.discussionTopics.map((topic, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800">
                <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center">
                  <span className="text-brand-600 dark:text-brand-400 text-sm font-bold">{i + 1}</span>
                </div>
                <span className="text-gray-700 dark:text-gray-300">{topic}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderWorkshopDetails = () => (
    <div className="space-y-6">
      {(req.maxParticipants || req.skillLevel || req.certification !== undefined) && (
        <div className="grid gap-4 sm:grid-cols-3">
          {req.maxParticipants && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-100 dark:border-blue-500/20">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xs font-semibold uppercase tracking-wider">Capacity</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{req.maxParticipants}</p>
            </div>
          )}
          {req.skillLevel && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-500/10 dark:to-green-500/10 border border-emerald-100 dark:border-emerald-500/20">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-xs font-semibold uppercase tracking-wider">Level</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">{req.skillLevel}</p>
            </div>
          )}
          {req.certification !== undefined && (
            <div className={`p-4 rounded-xl ${req.certification ? "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-500/10 dark:to-yellow-500/10 border border-amber-100 dark:border-amber-500/20" : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"}`}>
              <div className={`flex items-center gap-2 ${req.certification ? "text-amber-600 dark:text-amber-400" : "text-gray-500"} mb-1`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span className="text-xs font-semibold uppercase tracking-wider">Certificate</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{req.certification ? "✓ Included" : "Not included"}</p>
            </div>
          )}
        </div>
      )}

      {req.prerequisites && req.prerequisites.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Prerequisites
          </h4>
          <div className="space-y-2">
            {req.prerequisites.map((prereq, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20">
                <svg className="w-5 h-5 text-orange-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">{prereq}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {req.materialsNeeded && req.materialsNeeded.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            What to Bring
          </h4>
          <div className="flex flex-wrap gap-2">
            {req.materialsNeeded.map((material, i) => (
              <span key={i} className="px-3 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 text-sm font-medium">
                {material}
              </span>
            ))}
          </div>
        </div>
      )}

      {req.curriculum && req.curriculum.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Curriculum
          </h4>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand-500 to-emerald-500"></div>
            <div className="space-y-4">
              {req.curriculum.map((item, i) => (
                <div key={i} className="relative pl-10">
                  <div className="absolute left-2.5 top-4 w-3 h-3 rounded-full bg-brand-500 ring-4 ring-white dark:ring-gray-900"></div>
                  <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-900 dark:text-white">{item.title}</h5>
                      <Badge size="sm" color="primary">{item.duration}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderConferenceDetails = () => (
    <div className="space-y-6">
      {req.tracks && req.tracks.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Conference Tracks
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            {req.tracks.map((track, i) => {
              const colors = ["from-blue-500 to-indigo-600", "from-emerald-500 to-teal-600", "from-orange-500 to-amber-600", "from-purple-500 to-violet-600"];
              return (
                <div key={i} className="group relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all">
                  <div className={`absolute inset-0 bg-gradient-to-br ${colors[i % colors.length]} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center text-white font-bold mb-3`}>
                    {track.name.charAt(0)}
                  </div>
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-1">{track.name}</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{track.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {req.keynotes && req.keynotes.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Keynote Sessions
          </h4>
          <div className="space-y-3">
            {req.keynotes.map((keynote, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-500/10 dark:to-yellow-500/10 border border-amber-100 dark:border-amber-500/20">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30">
                  ⭐
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 dark:text-white">{keynote.topic}</h5>
                  <p className="text-sm text-amber-700 dark:text-amber-400">{keynote.speaker}</p>
                </div>
                <Badge size="sm" color="warning">{keynote.time}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {req.schedule && req.schedule.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Schedule
          </h4>
          <div className="space-y-2">
            {req.schedule.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800 hover:border-brand-200 dark:hover:border-brand-500/30 transition-colors">
                <div className="w-20 shrink-0 text-sm font-bold text-brand-600 dark:text-brand-400">{item.time}</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                  {(item.speaker || item.room) && (
                    <p className="text-sm text-gray-500">
                      {item.speaker}{item.speaker && item.room && " • "}{item.room}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderGalaDetails = () => (
    <div className="space-y-6">
      {(req.dressCode || req.entertainment) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {req.dressCode && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-gray-800 text-white">
              <div className="flex items-center gap-2 mb-2 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span className="text-sm font-medium">Dress Code</span>
              </div>
              <p className="text-xl font-bold">{req.dressCode}</p>
            </div>
          )}
          {req.entertainment && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white">
              <div className="flex items-center gap-2 mb-2 text-purple-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <span className="text-sm font-medium">Entertainment</span>
              </div>
              <p className="text-xl font-bold">{req.entertainment}</p>
            </div>
          )}
        </div>
      )}

      {req.menuOptions && req.menuOptions.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="text-lg">🍽️</span>
            Menu Options
          </h4>
          <div className="flex flex-wrap gap-2">
            {req.menuOptions.map((option, i) => (
              <span key={i} className="px-4 py-2 rounded-full bg-white dark:bg-white/10 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium shadow-sm">
                {option}
              </span>
            ))}
          </div>
        </div>
      )}

      {req.awardCategories && req.awardCategories.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-lg">🏆</span>
            Award Categories
          </h4>
          <div className="space-y-4">
            {req.awardCategories.map((award, i) => (
              <div key={i} className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-500/10 dark:to-yellow-500/10 border border-amber-100 dark:border-amber-500/20">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-3">{award.category}</h5>
                {award.nominees && award.nominees.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {award.nominees.map((nominee, j) => (
                      <span
                        key={j}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                          award.winner === nominee
                            ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-500/30"
                            : "bg-white dark:bg-white/10 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {award.winner === nominee && "🏆 "}{nominee}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {req.votingDeadline && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider">Voting Deadline</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {new Date(req.votingDeadline).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
      )}
    </div>
  );

  const renderProductLaunchDetails = () => (
    <div className="space-y-6">
      {(req.productName || req.productDescription) && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-50 to-emerald-50 dark:from-brand-500/10 dark:to-emerald-500/10 border border-brand-100 dark:border-brand-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center text-2xl shadow-lg shadow-brand-500/30">
              🚀
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">{req.productName}</h4>
          </div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{req.productDescription}</p>
        </div>
      )}

      {req.demoSchedule && req.demoSchedule.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Demo Schedule
          </h4>
          <div className="space-y-3">
            {req.demoSchedule.map((demo, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="w-16 shrink-0 text-center">
                  <div className="text-sm font-bold text-brand-600 dark:text-brand-400">{demo.time}</div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{demo.product}</p>
                  <p className="text-sm text-gray-500">{demo.presenter}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {req.pressContacts && req.pressContacts.length > 0 && (
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            Press Contacts
          </h4>
          <div className="space-y-1">
            {req.pressContacts.map((contact, i) => (
              <p key={i} className="text-gray-600 dark:text-gray-400">{contact}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderGeneralDetails = () => (
    <div className="space-y-6">
      {req.sponsors && req.sponsors.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-lg">💎</span>
            Sponsors
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {req.sponsors.map((sponsor, i) => {
              const tierColors: Record<string, string> = {
                "Platinum": "from-slate-200 to-gray-300 dark:from-slate-600 dark:to-gray-500",
                "Gold": "from-amber-300 to-yellow-400",
                "Silver": "from-gray-300 to-slate-400",
                "Bronze": "from-orange-300 to-amber-400",
              };
              return (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tierColors[sponsor.tier] || "from-gray-200 to-gray-300"} flex items-center justify-center font-bold text-white shadow-sm`}>
                    {sponsor.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{sponsor.name}</p>
                    <Badge size="sm" color={sponsor.tier === "Gold" ? "warning" : sponsor.tier === "Platinum" ? "light" : "primary"}>{sponsor.tier}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {req.agenda && req.agenda.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Agenda
          </h4>
          <div className="relative">
            <div className="absolute left-[3.25rem] top-0 bottom-0 w-px bg-gradient-to-b from-brand-500 via-brand-300 to-transparent"></div>
            <div className="space-y-3">
              {req.agenda.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-14 shrink-0 text-sm font-bold text-brand-600 dark:text-brand-400">{item.time}</div>
                  <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0"></div>
                  <div className="flex-1 p-3 rounded-lg bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800">
                    <span className="text-gray-700 dark:text-gray-300">{item.activity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {req.faqs && req.faqs.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            FAQs
          </h4>
          <div className="space-y-3">
            {req.faqs.map((faq, i) => (
              <div key={i} className="p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">{faq.question}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(req.contactPerson || req.contactEmail) && (
        <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact
          </h4>
          <div className="flex items-center gap-4">
            {req.contactPerson && (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Contact Person</div>
                <p className="font-medium text-gray-900 dark:text-white">{req.contactPerson}</p>
              </div>
            )}
            {req.contactEmail && (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Email</div>
                <a href={`mailto:${req.contactEmail}`} className="font-medium text-brand-600 dark:text-brand-400 hover:underline">{req.contactEmail}</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderTypeSpecificContent = () => {
    const type = event.type.toLowerCase();

    if (type.includes("hackathon") || type.includes("game jam")) {
      return renderHackathonDetails();
    }
    if (type.includes("keynote") || type.includes("panel") || type.includes("talk") || type.includes("fireside") || type.includes("webinar") || type.includes("speaker")) {
      return renderSpeakerDetails();
    }
    if (type.includes("workshop") || type.includes("bootcamp") || type.includes("seminar") || type.includes("sprint")) {
      return renderWorkshopDetails();
    }
    if (type.includes("conference")) {
      return renderConferenceDetails();
    }
    if (type.includes("gala") || type.includes("awards")) {
      return renderGalaDetails();
    }
    if (type.includes("launch") || type.includes("demo")) {
      return renderProductLaunchDetails();
    }

    return null;
  };

  const hasRequirements = Object.keys(req).length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl p-0 overflow-hidden">
      {/* Header with gradient */}
      <div className={`relative bg-gradient-to-r ${statusColors[event.status]} p-6 pb-16`}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl shadow-lg">
              {event.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
                  {event.type}
                </span>
                {event.isVirtual && (
                  <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
                    🌐 Virtual
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white">{event.title}</h2>
              <p className="text-white/80 text-sm mt-1">{event.client}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Info cards overlapping header */}
      <div className="px-6 -mt-10 relative z-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium uppercase tracking-wider">Date</span>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
            </p>
            <p className="text-sm text-gray-500">{event.time}{event.endTime && ` - ${event.endTime}`}</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs font-medium uppercase tracking-wider">{event.isVirtual ? "Platform" : "Location"}</span>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white truncate">
              {event.isVirtual ? (event.virtualPlatform || "Online") : (event.location || "TBD")}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs font-medium uppercase tracking-wider">Attendees</span>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {event.attendees ? event.attendees.toLocaleString() : "TBD"}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[50vh] overflow-y-auto">
        {/* Description */}
        {event.description && (
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{event.description}</p>
          </div>
        )}

        {/* Type-specific content */}
        {hasRequirements && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            {renderTypeSpecificContent()}
            {renderGeneralDetails()}
          </div>
        )}

        {!hasRequirements && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No additional details configured yet.</p>
            {onEdit && <p className="text-sm mt-1">Click Edit to add event requirements.</p>}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Close
        </button>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-medium shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all"
          >
            Edit Event
          </button>
        )}
      </div>
    </Modal>
  );
}
