export interface WidgetDefinition {
  key: string;
  label: string;
  column: "full" | "left" | "right";
}

export const widgetRegistry: WidgetDefinition[] = [
  { key: "greeting", label: "Greeting", column: "full" },
  { key: "briefing", label: "Morning Briefing", column: "full" },
  { key: "metrics", label: "Metrics", column: "full" },
  { key: "quick_actions", label: "Quick Actions", column: "full" },
  { key: "onboarding", label: "Onboarding Checklist", column: "full" },
  { key: "activity", label: "Recent Activity", column: "left" },
  { key: "upcoming", label: "Upcoming This Week", column: "left" },
  { key: "client_health", label: "Client Health", column: "left" },
  { key: "announcements", label: "Announcements", column: "right" },
  { key: "goals", label: "Goals & KPIs", column: "right" },
  { key: "bookmarks", label: "Quick Access", column: "right" },
  { key: "scope_creep", label: "Scope Creep Alerts", column: "right" },
  { key: "resource_heatmap", label: "Team Capacity", column: "full" },
  { key: "client_journey", label: "Client Journey", column: "full" },
  { key: "business_health", label: "Business Health Score", column: "full" },
];

export const defaultWidgetOrder = [
  "greeting",
  "briefing",
  "metrics",
  "quick_actions",
  "onboarding",
  "resource_heatmap",
  "client_journey",
  "activity",
  "upcoming",
  "client_health",
  "announcements",
  "goals",
  "bookmarks",
  "scope_creep",
  "business_health",
];

export const defaultVisibility: Record<string, boolean> = {
  greeting: true,
  briefing: true,
  metrics: true,
  quick_actions: true,
  onboarding: true,
  activity: true,
  upcoming: true,
  client_health: true,
  announcements: true,
  goals: true,
  bookmarks: true,
  scope_creep: true,
  resource_heatmap: true,
  client_journey: true,
  business_health: true,
};
