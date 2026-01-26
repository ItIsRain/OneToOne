"use client";

import React, { useState, useEffect } from "react";
import { useAttendee } from "@/context/AttendeeContext";
import { getPortalTabsForEventType } from "@/config/portalTabConfig";
import { AuthInline } from "./AuthInline";
import { PortalTabs } from "./PortalTabs";
import { DashboardTab } from "./DashboardTab";
import { TeamsTab } from "./TeamsTab";
import { SubmissionsTab } from "./SubmissionsTab";
import { ProfileTab } from "./ProfileTab";
import { ScheduleTab } from "./ScheduleTab";
import { ChallengesTab } from "./ChallengesTab";
import { PrizesTab } from "./PrizesTab";
import { InfoTab } from "./InfoTab";
import { PortalIcons } from "./PortalIcons";
import type { Team, Attendee, Submission, TabType } from "./types";

interface PortalSectionProps {
  eventSlug: string;
  eventColor: string;
  eventType: string;
  eventDescription?: string;
  eventVenue?: string;
  eventAddress?: string;
  organizerName?: string;
  organizerLogo?: string;
  organizerWebsite?: string;
}

export const PortalSection: React.FC<PortalSectionProps> = ({
  eventSlug,
  eventColor,
  eventType,
  eventDescription,
  eventVenue,
  eventAddress,
  organizerName,
  organizerLogo,
  organizerWebsite,
}) => {
  const {
    attendee,
    team,
    teamRole,
    event,
    token,
    isLoading,
    isAuthenticated,
    logout,
    refreshSession
  } = useAttendee();

  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [teams, setTeams] = useState<Team[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);

  const requirements = (event?.requirements as Record<string, unknown>) || {};
  const tabs = getPortalTabsForEventType(eventType, requirements);
  const hasTeams = tabs.some(t => t.id === "teams");
  const hasSubmissions = tabs.some(t => t.id === "submissions");

  // Fetch teams
  const fetchTeams = async () => {
    if (!eventSlug || !hasTeams) return;
    try {
      const res = await fetch(`/api/events/public/${eventSlug}/teams`);
      const data = await res.json();
      setTeams(data.teams || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  // Fetch attendees looking for teams
  const fetchAttendees = async () => {
    if (!eventSlug || !hasTeams) return;
    try {
      const res = await fetch(`/api/events/public/${eventSlug}/attendees?looking_for_team=true`);
      const data = await res.json();
      setAttendees(data.attendees || []);
    } catch (error) {
      console.error("Error fetching attendees:", error);
    }
  };

  // Fetch submissions
  const fetchSubmissions = async () => {
    if (!eventSlug || !token || !hasSubmissions) return;
    try {
      const res = await fetch(`/api/events/public/${eventSlug}/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSubmissions(data.submissions || []);

      // Find own submission
      const own = data.submissions?.find((s: Submission) =>
        (s.attendee?.id === attendee?.id) || (s.team?.id === team?.id)
      );
      setMySubmission(own || null);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && event) {
      fetchTeams();
      fetchAttendees();
      fetchSubmissions();
    }
  }, [isAuthenticated, event]);

  const minTeamSize = (requirements.team_size_min as number) || 1;
  const needsTeam = minTeamSize > 1 && !team;

  const handleRefreshAll = () => {
    fetchTeams();
    fetchAttendees();
    refreshSession();
  };

  // Loading state
  if (isLoading) {
    return (
      <div id="portal" className="scroll-mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
              <div
                className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
                style={{ borderColor: `${eventColor} transparent transparent transparent` }}
              />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading portal...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated - show inline auth
  if (!isAuthenticated) {
    return (
      <div id="portal" className="scroll-mt-8">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
          >
            {PortalIcons.users}
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Participant Portal
          </h2>
        </div>
        <AuthInline eventColor={eventColor} />
      </div>
    );
  }

  // Authenticated - show portal with tabs
  return (
    <div id="portal" className="scroll-mt-8">
      {/* Portal Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
          >
            {PortalIcons.users}
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Participant Portal
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: eventColor }}
            >
              {attendee?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
              {attendee?.name}
            </span>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Logout"
          >
            {PortalIcons.logout}
          </button>
        </div>
      </div>

      {/* Tabs and Content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <PortalTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          eventColor={eventColor}
        />

        <div className="p-6">
          {activeTab === "dashboard" && (
            <DashboardTab
              attendee={attendee!}
              team={team}
              teamRole={teamRole}
              mySubmission={mySubmission}
              needsTeam={needsTeam}
              eventColor={eventColor}
              eventSlug={eventSlug}
              requirements={requirements}
              onNavigate={setActiveTab}
              eventTitle={event?.title}
              eventStartDate={event?.start_date || undefined}
              eventEndDate={event?.end_date || undefined}
            />
          )}
          {activeTab === "teams" && hasTeams && (
            <TeamsTab
              teams={teams}
              attendees={attendees}
              team={team}
              attendee={attendee!}
              token={token!}
              eventSlug={eventSlug}
              eventColor={eventColor}
              requirements={requirements}
              onRefresh={handleRefreshAll}
            />
          )}
          {activeTab === "submissions" && hasSubmissions && (
            <SubmissionsTab
              submissions={submissions}
              mySubmission={mySubmission}
              team={team}
              attendee={attendee!}
              token={token!}
              eventSlug={eventSlug}
              eventColor={eventColor}
              requirements={requirements}
              onRefresh={fetchSubmissions}
            />
          )}
          {activeTab === "profile" && (
            <ProfileTab
              attendee={attendee!}
              eventColor={eventColor}
              requirements={requirements}
            />
          )}
          {activeTab === "schedule" && (
            <ScheduleTab
              requirements={requirements}
              eventColor={eventColor}
              eventStartDate={event?.start_date}
              eventEndDate={event?.end_date}
            />
          )}
          {activeTab === "challenges" && (
            <ChallengesTab
              requirements={requirements}
              eventColor={eventColor}
            />
          )}
          {activeTab === "prizes" && (
            <PrizesTab
              requirements={requirements}
              eventColor={eventColor}
            />
          )}
          {activeTab === "info" && (
            <InfoTab
              requirements={requirements}
              eventColor={eventColor}
              eventDescription={eventDescription}
              eventVenue={eventVenue}
              eventAddress={eventAddress}
              organizerName={organizerName}
              organizerLogo={organizerLogo}
              organizerWebsite={organizerWebsite}
            />
          )}
        </div>
      </div>
    </div>
  );
};
