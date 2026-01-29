export interface WidgetDefinition {
  key: string;
  label: string;
  column: "full" | "left" | "right";
}

export const widgetRegistry: WidgetDefinition[] = [
  { key: "greeting", label: "Greeting", column: "full" },
  { key: "metrics", label: "Metrics", column: "full" },
  { key: "quick_actions", label: "Quick Actions", column: "full" },
  { key: "onboarding", label: "Onboarding Checklist", column: "full" },
  { key: "activity", label: "Recent Activity", column: "left" },
  { key: "upcoming", label: "Upcoming This Week", column: "left" },
  { key: "announcements", label: "Announcements", column: "right" },
  { key: "goals", label: "Goals & KPIs", column: "right" },
  { key: "bookmarks", label: "Quick Access", column: "right" },
];

export const defaultWidgetOrder = [
  "greeting",
  "metrics",
  "quick_actions",
  "onboarding",
  "activity",
  "upcoming",
  "announcements",
  "goals",
  "bookmarks",
];

export const defaultVisibility: Record<string, boolean> = {
  greeting: true,
  metrics: true,
  quick_actions: true,
  onboarding: true,
  activity: true,
  upcoming: true,
  announcements: true,
  goals: true,
  bookmarks: true,
};
