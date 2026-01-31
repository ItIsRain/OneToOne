import type { PortalSettings } from "@/types/portal";

export type PortalAction =
  | { type: "SET_ALL"; payload: PortalSettings }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: "SET_FIELD"; field: keyof PortalSettings; value: any };

export interface SectionProps {
  state: PortalSettings;
  dispatch: React.Dispatch<PortalAction>;
  expanded: boolean;
  onToggle: () => void;
  inputClass: string;
  icon?: React.ReactNode;
  description?: string;
  statusBadge?: React.ReactNode;
}
