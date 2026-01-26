import type { TabType } from "@/components/events/portal/types";

interface TabConfig {
  id: TabType;
  label: string;
  description: string;
}

interface EventTypeTabConfig {
  tabs: TabConfig[];
}

// Define which tabs are available for each event type
const eventTypeTabConfigs: Record<string, EventTypeTabConfig> = {
  hackathon: {
    tabs: [
      { id: "dashboard", label: "Dashboard", description: "Overview of your participation" },
      { id: "schedule", label: "Schedule", description: "Event timeline and dates" },
      { id: "challenges", label: "Challenges", description: "Problem statements to solve" },
      { id: "prizes", label: "Prizes", description: "Awards and judging criteria" },
      { id: "info", label: "Info", description: "Event details and resources" },
      { id: "teams", label: "Teams", description: "Find or create a team" },
      { id: "submissions", label: "Submissions", description: "Submit your project" },
      { id: "profile", label: "Profile", description: "Manage your profile" },
    ],
  },
  game_jam: {
    tabs: [
      { id: "dashboard", label: "Dashboard", description: "Overview of your participation" },
      { id: "schedule", label: "Schedule", description: "Event timeline and dates" },
      { id: "challenges", label: "Challenges", description: "Theme and rules" },
      { id: "prizes", label: "Prizes", description: "Awards and judging criteria" },
      { id: "info", label: "Info", description: "Event details and resources" },
      { id: "teams", label: "Teams", description: "Find or create a team" },
      { id: "submissions", label: "Submissions", description: "Submit your game" },
      { id: "profile", label: "Profile", description: "Manage your profile" },
    ],
  },
  workshop: {
    tabs: [
      { id: "dashboard", label: "Dashboard", description: "Your workshop dashboard" },
      { id: "schedule", label: "Schedule", description: "Workshop agenda" },
      { id: "info", label: "Info", description: "Workshop details" },
      { id: "profile", label: "Profile", description: "Manage your profile" },
    ],
  },
  meetup: {
    tabs: [
      { id: "dashboard", label: "Dashboard", description: "Your meetup dashboard" },
      { id: "schedule", label: "Schedule", description: "Event agenda" },
      { id: "info", label: "Info", description: "Meetup details" },
      { id: "profile", label: "Profile", description: "Manage your profile" },
    ],
  },
  demo_day: {
    tabs: [
      { id: "dashboard", label: "Dashboard", description: "Your demo day dashboard" },
      { id: "schedule", label: "Schedule", description: "Presentation schedule" },
      { id: "info", label: "Info", description: "Demo day details" },
      { id: "profile", label: "Profile", description: "Manage your profile" },
    ],
  },
  general: {
    tabs: [
      { id: "dashboard", label: "Dashboard", description: "Your event dashboard" },
      { id: "schedule", label: "Schedule", description: "Event schedule" },
      { id: "info", label: "Info", description: "Event details" },
      { id: "profile", label: "Profile", description: "Manage your profile" },
    ],
  },
};

export function getPortalTabsForEventType(
  eventType: string,
  requirements?: Record<string, unknown>
): TabConfig[] {
  const baseTabs = eventTypeTabConfigs[eventType]?.tabs || eventTypeTabConfigs.general.tabs;

  // Check if this is a solo event (min and max team size both 1)
  const minTeamSize = (requirements?.team_size_min as number) || 1;
  const maxTeamSize = (requirements?.team_size_max as number) || 5;
  const isSoloEvent = minTeamSize === 1 && maxTeamSize === 1;

  // Filter out teams tab for solo events
  if (isSoloEvent) {
    return baseTabs.filter(tab => tab.id !== "teams");
  }

  return baseTabs;
}

export function hasTeamsTab(eventType: string, requirements?: Record<string, unknown>): boolean {
  const tabs = getPortalTabsForEventType(eventType, requirements);
  return tabs.some(tab => tab.id === "teams");
}

export function hasSubmissionsTab(eventType: string, requirements?: Record<string, unknown>): boolean {
  const tabs = getPortalTabsForEventType(eventType, requirements);
  return tabs.some(tab => tab.id === "submissions");
}
