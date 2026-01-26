export type TeamJoinType = "open" | "invite_only" | "code";

export interface Team {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  max_members: number;
  is_open: boolean;
  looking_for_members: boolean;
  skills_needed?: string[];
  join_type?: TeamJoinType;
  join_code?: string;
  members?: { id: string; role: string; status?: string; attendee: { id: string; name: string; avatar_url?: string; skills?: string[] } }[];
  memberCount?: number;
}

export interface Attendee {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  skills?: string[];
  bio?: string;
  company?: string;
  job_title?: string;
  looking_for_team?: boolean;
}

export interface ProblemStatement {
  id: string;
  title: string;
  description?: string;
  category?: string;
}

export interface SubmissionFile {
  name: string;
  size: number;
  url: string;
}

export interface Submission {
  id: string;
  title: string;
  description?: string;
  project_url?: string;
  demo_url?: string;
  video_url?: string;
  presentation_url?: string;
  technologies?: string[];
  screenshots?: string[];
  status: string;
  submitted_at?: string;
  problem_statement_id?: string;
  problem_statement?: ProblemStatement;
  solution?: string;
  files?: SubmissionFile[];
  team?: { id: string; name: string; logo_url?: string };
  attendee?: { id: string; name: string; avatar_url?: string };
}

export type TabType = "dashboard" | "teams" | "submissions" | "profile" | "schedule" | "challenges" | "prizes" | "info";
