/**
 * Event Type Schema Configuration
 *
 * This file defines the dynamic form fields for each event type.
 * Supported event types: General, Hackathon, Workshop, Meetup, Game Jam, Demo Day
 */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'toggle'
  | 'date'
  | 'time'
  | 'datetime'
  | 'file'
  | 'url'
  | 'email'
  | 'phone'
  | 'currency'
  | 'sortable-list'
  | 'key-value-list'
  | 'person-list'
  | 'rich-text'
  | 'color'
  | 'rating'
  | 'checklist';

export interface FieldOption {
  value: string;
  label: string;
  icon?: string;
}

export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
  fileTypes?: string[];
  maxFileSize?: number;
}

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  description?: string;
  defaultValue?: unknown;
  options?: FieldOption[];
  validation?: FieldValidation;
  conditional?: {
    field: string;
    value: unknown;
    operator?: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  };
  group?: string;
  order?: number;
  fullWidth?: boolean;
  adminOnly?: boolean;
  showInPublicPage?: boolean;
}

export interface EventTypeConfig {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  fields: FormField[];
  tabs?: { id: string; label: string; icon?: string; description?: string }[];
  defaultDuration?: number;
  capacityDefault?: number;
}

// ============================================
// EVENT TYPE CONFIGURATIONS
// ============================================

export const eventTypeConfigs: Record<string, EventTypeConfig> = {
  // ==========================================
  // GENERAL EVENT
  // ==========================================
  general: {
    id: 'general',
    label: 'General Event',
    icon: '📅',
    color: '#6b7280',
    description: 'A standard event with basic settings',
    defaultDuration: 2,
    capacityDefault: 50,
    tabs: [
      { id: 'details', label: 'Event Details', icon: '📝', description: 'Additional event information' },
    ],
    fields: [
      {
        id: 'highlights',
        label: 'Event Highlights',
        type: 'sortable-list',
        placeholder: 'Add a highlight...',
        description: 'Key features or selling points of your event',
        group: 'details',
        showInPublicPage: true,
      },
      {
        id: 'agenda',
        label: 'Event Schedule',
        type: 'key-value-list',
        description: 'Add time slots and activities (e.g., "9:00 AM" → "Registration")',
        group: 'details',
        showInPublicPage: true,
        fullWidth: true,
      },
      {
        id: 'what_to_bring',
        label: 'What to Bring',
        type: 'sortable-list',
        placeholder: 'Add item...',
        description: 'Items attendees should bring to the event',
        group: 'details',
        showInPublicPage: true,
      },
      {
        id: 'dress_code',
        label: 'Dress Code',
        type: 'select',
        options: [
          { value: 'casual', label: 'Casual' },
          { value: 'smart_casual', label: 'Smart Casual' },
          { value: 'business', label: 'Business' },
          { value: 'formal', label: 'Formal' },
        ],
        group: 'details',
        showInPublicPage: true,
      },
    ],
  },

  // ==========================================
  // HACKATHON
  // ==========================================
  hackathon: {
    id: 'hackathon',
    label: 'Hackathon',
    icon: '💻',
    color: '#8b5cf6',
    description: 'Competitive coding event with teams building projects',
    defaultDuration: 48,
    capacityDefault: 200,
    tabs: [
      { id: 'challenges', label: 'Challenges', icon: '🎯', description: 'Define problem statements and themes' },
      { id: 'teams', label: 'Teams', icon: '👥', description: 'Team size and formation rules' },
      { id: 'prizes', label: 'Prizes', icon: '🏆', description: 'Prizes and judging criteria' },
      { id: 'schedule', label: 'Schedule', icon: '📅', description: 'Event timeline and deadlines' },
    ],
    fields: [
      // Challenges Tab
      {
        id: 'problem_statements',
        label: 'Problem Statements / Tracks',
        type: 'key-value-list',
        description: 'Add challenge tracks with descriptions (e.g., "FinTech Challenge" → "Build a solution for...")',
        group: 'challenges',
        fullWidth: true,
        showInPublicPage: true,
      },
      {
        id: 'themes',
        label: 'Themes',
        type: 'sortable-list',
        placeholder: 'Add theme (e.g., AI/ML, Sustainability)...',
        description: 'Overall themes participants can explore',
        group: 'challenges',
        showInPublicPage: true,
      },
      {
        id: 'tech_requirements',
        label: 'Allowed Technologies',
        type: 'multiselect',
        options: [
          { value: 'any', label: 'Any Technology' },
          { value: 'web', label: 'Web Development' },
          { value: 'mobile', label: 'Mobile Apps' },
          { value: 'ai_ml', label: 'AI/ML' },
          { value: 'blockchain', label: 'Blockchain' },
          { value: 'iot', label: 'IoT' },
          { value: 'cloud', label: 'Cloud/DevOps' },
          { value: 'game', label: 'Game Development' },
        ],
        description: 'What technologies are allowed or encouraged',
        group: 'challenges',
        showInPublicPage: true,
      },
      {
        id: 'resources_provided',
        label: 'Resources Provided',
        type: 'sortable-list',
        placeholder: 'Add resource...',
        description: 'APIs, cloud credits, or tools you\'ll provide',
        group: 'challenges',
        showInPublicPage: true,
      },
      // Teams Tab
      {
        id: 'team_size_min',
        label: 'Min Team Size',
        type: 'number',
        placeholder: '1',
        validation: { min: 1, max: 10 },
        group: 'teams',
        showInPublicPage: true,
      },
      {
        id: 'team_size_max',
        label: 'Max Team Size',
        type: 'number',
        placeholder: '5',
        validation: { min: 1, max: 10 },
        group: 'teams',
        showInPublicPage: true,
      },
      {
        id: 'allow_solo',
        label: 'Allow Solo Participants',
        type: 'toggle',
        description: 'Can individuals participate without a team?',
        group: 'teams',
        showInPublicPage: true,
      },
      {
        id: 'team_formation',
        label: 'Team Formation',
        type: 'select',
        options: [
          { value: 'pre_formed', label: 'Pre-formed Teams Only' },
          { value: 'on_site', label: 'Form Teams On-site' },
          { value: 'both', label: 'Both Options' },
        ],
        description: 'How can participants form teams?',
        group: 'teams',
        showInPublicPage: true,
      },
      {
        id: 'participant_tracks',
        label: 'Participant Categories',
        type: 'sortable-list',
        placeholder: 'Add category (e.g., Student, Professional)...',
        description: 'Different participant categories if any',
        group: 'teams',
        showInPublicPage: true,
      },
      // Prizes Tab
      {
        id: 'prizes',
        label: 'Main Prizes',
        type: 'key-value-list',
        description: 'Prize for each position (e.g., "1st Place" → "$10,000")',
        group: 'prizes',
        fullWidth: true,
        showInPublicPage: true,
      },
      {
        id: 'special_awards',
        label: 'Special Awards',
        type: 'key-value-list',
        description: 'Additional awards (e.g., "Best Design" → "$2,000")',
        group: 'prizes',
        showInPublicPage: true,
      },
      {
        id: 'judging_criteria',
        label: 'Judging Criteria',
        type: 'key-value-list',
        description: 'How submissions will be scored (e.g., "Innovation" → "25%")',
        group: 'prizes',
        showInPublicPage: true,
      },
      {
        id: 'judges',
        label: 'Judges',
        type: 'person-list',
        description: 'Who will be judging the submissions',
        group: 'prizes',
        fullWidth: true,
        showInPublicPage: true,
      },
      // Schedule Tab
      {
        id: 'schedule',
        label: 'Event Schedule',
        type: 'key-value-list',
        description: 'Full timeline (e.g., "Day 1, 9:00 AM" → "Opening Ceremony")',
        group: 'schedule',
        fullWidth: true,
        showInPublicPage: true,
      },
      {
        id: 'submission_deadline',
        label: 'Submission Deadline',
        type: 'datetime',
        description: 'When must projects be submitted?',
        group: 'schedule',
        showInPublicPage: true,
      },
      {
        id: 'demo_time_per_team',
        label: 'Demo Time (minutes)',
        type: 'number',
        placeholder: '5',
        validation: { min: 1, max: 30 },
        description: 'How long each team has to present',
        group: 'schedule',
        showInPublicPage: true,
      },
      {
        id: 'mentorship_available',
        label: 'Mentors Available',
        type: 'toggle',
        description: 'Will mentors be available to help teams?',
        group: 'schedule',
        showInPublicPage: true,
      },
    ],
  },

  // ==========================================
  // WORKSHOP
  // ==========================================
  workshop: {
    id: 'workshop',
    label: 'Workshop',
    icon: '🔧',
    color: '#f97316',
    description: 'Hands-on learning session with practical exercises',
    defaultDuration: 3,
    capacityDefault: 30,
    tabs: [
      { id: 'content', label: 'Content', icon: '📚', description: 'What will be taught' },
      { id: 'requirements', label: 'Requirements', icon: '📋', description: 'What participants need' },
      { id: 'instructor', label: 'Instructor', icon: '👨‍🏫', description: 'Who is teaching' },
    ],
    fields: [
      // Content Tab
      {
        id: 'learning_objectives',
        label: 'What You\'ll Learn',
        type: 'sortable-list',
        placeholder: 'Add learning objective...',
        description: 'Key takeaways for participants',
        group: 'content',
        fullWidth: true,
        showInPublicPage: true,
      },
      {
        id: 'topics_covered',
        label: 'Topics Covered',
        type: 'sortable-list',
        placeholder: 'Add topic...',
        description: 'Main subjects in the workshop',
        group: 'content',
        showInPublicPage: true,
      },
      {
        id: 'skill_level',
        label: 'Skill Level',
        type: 'select',
        options: [
          { value: 'beginner', label: '🟢 Beginner - No experience needed' },
          { value: 'intermediate', label: '🟡 Intermediate - Some experience' },
          { value: 'advanced', label: '🔴 Advanced - Experienced practitioners' },
          { value: 'all', label: '⚪ All Levels Welcome' },
        ],
        description: 'Who is this workshop for?',
        group: 'content',
        showInPublicPage: true,
      },
      {
        id: 'workshop_format',
        label: 'Workshop Format',
        type: 'select',
        options: [
          { value: 'lecture', label: 'Lecture & Presentation' },
          { value: 'hands_on', label: 'Hands-on Lab' },
          { value: 'mixed', label: 'Mixed (Lecture + Exercises)' },
          { value: 'project', label: 'Build a Project' },
        ],
        description: 'How will the workshop be conducted?',
        group: 'content',
        showInPublicPage: true,
      },
      {
        id: 'agenda',
        label: 'Workshop Agenda',
        type: 'key-value-list',
        description: 'Session breakdown (e.g., "10:00 AM" → "Introduction to React")',
        group: 'content',
        fullWidth: true,
        showInPublicPage: true,
      },
      // Requirements Tab
      {
        id: 'prerequisites',
        label: 'Prerequisites',
        type: 'sortable-list',
        placeholder: 'Add prerequisite...',
        description: 'What should participants already know?',
        group: 'requirements',
        showInPublicPage: true,
      },
      {
        id: 'materials_needed',
        label: 'What to Bring',
        type: 'sortable-list',
        placeholder: 'Add item...',
        description: 'What participants need to bring',
        group: 'requirements',
        showInPublicPage: true,
      },
      {
        id: 'software_requirements',
        label: 'Software to Install',
        type: 'sortable-list',
        placeholder: 'Add software...',
        description: 'Software to install before the workshop',
        group: 'requirements',
        showInPublicPage: true,
      },
      {
        id: 'materials_provided',
        label: 'What We Provide',
        type: 'sortable-list',
        placeholder: 'Add item...',
        description: 'Materials provided to participants',
        group: 'requirements',
        showInPublicPage: true,
      },
      {
        id: 'certification',
        label: 'Certificate Provided',
        type: 'toggle',
        description: 'Will participants receive a certificate?',
        group: 'requirements',
        showInPublicPage: true,
      },
      // Instructor Tab
      {
        id: 'instructor_name',
        label: 'Instructor Name',
        type: 'text',
        placeholder: 'Enter instructor name',
        group: 'instructor',
        showInPublicPage: true,
      },
      {
        id: 'instructor_title',
        label: 'Title / Role',
        type: 'text',
        placeholder: 'e.g., Senior Developer at Google',
        group: 'instructor',
        showInPublicPage: true,
      },
      {
        id: 'instructor_bio',
        label: 'Instructor Bio',
        type: 'textarea',
        placeholder: 'Brief bio of the instructor...',
        group: 'instructor',
        fullWidth: true,
        showInPublicPage: true,
      },
      {
        id: 'instructor_linkedin',
        label: 'LinkedIn Profile',
        type: 'url',
        placeholder: 'https://linkedin.com/in/...',
        group: 'instructor',
        showInPublicPage: true,
      },
    ],
  },

  // ==========================================
  // MEETUP
  // ==========================================
  meetup: {
    id: 'meetup',
    label: 'Meetup',
    icon: '🤝',
    color: '#22c55e',
    description: 'Community gathering for networking and knowledge sharing',
    defaultDuration: 2,
    capacityDefault: 50,
    tabs: [
      { id: 'agenda', label: 'Agenda', icon: '📋', description: 'Event schedule and topics' },
      { id: 'speakers', label: 'Speakers', icon: '🎤', description: 'Who is presenting' },
      { id: 'networking', label: 'Perks', icon: '🎁', description: 'Food, swag, and networking' },
    ],
    fields: [
      // Agenda Tab
      {
        id: 'meetup_type',
        label: 'Meetup Format',
        type: 'select',
        options: [
          { value: 'tech_talk', label: '🎤 Tech Talk' },
          { value: 'panel', label: '💬 Panel Discussion' },
          { value: 'networking', label: '🤝 Networking Only' },
          { value: 'workshop', label: '🔧 Mini Workshop' },
          { value: 'demo', label: '📱 Show & Tell' },
          { value: 'social', label: '🎉 Social Gathering' },
        ],
        description: 'What type of meetup is this?',
        group: 'agenda',
        showInPublicPage: true,
      },
      {
        id: 'community',
        label: 'Community / Group',
        type: 'text',
        placeholder: 'e.g., Dubai JavaScript Developers',
        description: 'Which community is organizing this?',
        group: 'agenda',
        showInPublicPage: true,
      },
      {
        id: 'topics',
        label: 'Discussion Topics',
        type: 'sortable-list',
        placeholder: 'Add topic...',
        description: 'Main topics for the meetup',
        group: 'agenda',
        showInPublicPage: true,
      },
      {
        id: 'agenda',
        label: 'Event Schedule',
        type: 'key-value-list',
        description: 'Timeline (e.g., "6:00 PM" → "Networking & Food")',
        group: 'agenda',
        fullWidth: true,
        showInPublicPage: true,
      },
      // Speakers Tab
      {
        id: 'speakers',
        label: 'Speakers',
        type: 'person-list',
        description: 'Who will be presenting?',
        group: 'speakers',
        fullWidth: true,
        showInPublicPage: true,
      },
      {
        id: 'talk_duration',
        label: 'Talk Duration (minutes)',
        type: 'number',
        placeholder: '20',
        validation: { min: 5, max: 120 },
        description: 'How long is each talk?',
        group: 'speakers',
      },
      {
        id: 'qa_session',
        label: 'Q&A Session',
        type: 'toggle',
        description: 'Will there be Q&A after talks?',
        group: 'speakers',
        showInPublicPage: true,
      },
      // Perks Tab
      {
        id: 'refreshments',
        label: 'Food & Drinks',
        type: 'select',
        options: [
          { value: 'none', label: 'Not Provided' },
          { value: 'drinks', label: '☕ Drinks Only' },
          { value: 'light', label: '🍕 Light Snacks' },
          { value: 'full', label: '🍽️ Full Catering' },
        ],
        description: 'What food/drinks will be provided?',
        group: 'networking',
        showInPublicPage: true,
      },
      {
        id: 'networking_activities',
        label: 'Networking Activities',
        type: 'sortable-list',
        placeholder: 'Add activity...',
        description: 'Planned networking activities',
        group: 'networking',
        showInPublicPage: true,
      },
      {
        id: 'swag',
        label: 'Swag / Giveaways',
        type: 'sortable-list',
        placeholder: 'Add swag item...',
        description: 'What will attendees receive?',
        group: 'networking',
        showInPublicPage: true,
      },
      {
        id: 'sponsor_booths',
        label: 'Sponsor Booths',
        type: 'toggle',
        description: 'Will sponsors have booths?',
        group: 'networking',
      },
    ],
  },

  // ==========================================
  // GAME JAM
  // ==========================================
  game_jam: {
    id: 'game_jam',
    label: 'Game Jam',
    icon: '🎮',
    color: '#ec4899',
    description: 'Game development competition with time constraints',
    defaultDuration: 48,
    capacityDefault: 100,
    tabs: [
      { id: 'theme', label: 'Theme & Rules', icon: '🎯', description: 'The creative challenge' },
      { id: 'requirements', label: 'Technical', icon: '🔧', description: 'Tools and platforms' },
      { id: 'prizes', label: 'Prizes', icon: '🏆', description: 'Awards and judging' },
    ],
    fields: [
      // Theme Tab
      {
        id: 'jam_theme',
        label: 'Jam Theme',
        type: 'text',
        placeholder: 'e.g., "Out of Control" or "TBA at event start"',
        description: 'The creative theme for the jam',
        group: 'theme',
        showInPublicPage: true,
      },
      {
        id: 'theme_reveal',
        label: 'Theme Reveal Time',
        type: 'datetime',
        description: 'When will the theme be announced?',
        group: 'theme',
        showInPublicPage: true,
      },
      {
        id: 'jam_duration',
        label: 'Duration (hours)',
        type: 'number',
        placeholder: '48',
        validation: { min: 12, max: 168 },
        description: 'How long is the jam?',
        group: 'theme',
        showInPublicPage: true,
      },
      {
        id: 'rules',
        label: 'Jam Rules',
        type: 'sortable-list',
        placeholder: 'Add rule...',
        description: 'Competition rules and constraints',
        group: 'theme',
        fullWidth: true,
        showInPublicPage: true,
      },
      {
        id: 'diversifiers',
        label: 'Optional Challenges',
        type: 'sortable-list',
        placeholder: 'Add optional challenge...',
        description: 'Bonus challenges for extra recognition',
        group: 'theme',
        showInPublicPage: true,
      },
      // Requirements Tab
      {
        id: 'allowed_engines',
        label: 'Allowed Game Engines',
        type: 'multiselect',
        options: [
          { value: 'any', label: 'Any Engine' },
          { value: 'unity', label: 'Unity' },
          { value: 'unreal', label: 'Unreal Engine' },
          { value: 'godot', label: 'Godot' },
          { value: 'gamemaker', label: 'GameMaker' },
          { value: 'construct', label: 'Construct' },
          { value: 'custom', label: 'Custom/From Scratch' },
        ],
        description: 'Which engines can participants use?',
        group: 'requirements',
        showInPublicPage: true,
      },
      {
        id: 'platforms',
        label: 'Target Platforms',
        type: 'multiselect',
        options: [
          { value: 'web', label: '🌐 Web Browser' },
          { value: 'windows', label: '💻 Windows' },
          { value: 'mac', label: '🍎 macOS' },
          { value: 'linux', label: '🐧 Linux' },
          { value: 'mobile', label: '📱 Mobile' },
        ],
        description: 'What platforms should games run on?',
        group: 'requirements',
        showInPublicPage: true,
      },
      {
        id: 'team_size',
        label: 'Max Team Size',
        type: 'number',
        placeholder: '4',
        validation: { min: 1, max: 10 },
        description: 'Maximum people per team',
        group: 'requirements',
        showInPublicPage: true,
      },
      {
        id: 'submission_platform',
        label: 'Submit Games To',
        type: 'select',
        options: [
          { value: 'itch', label: 'itch.io' },
          { value: 'gamejolt', label: 'Game Jolt' },
          { value: 'custom', label: 'Custom Form' },
        ],
        description: 'Where should games be submitted?',
        group: 'requirements',
        showInPublicPage: true,
      },
      {
        id: 'asset_rules',
        label: 'Asset Rules',
        type: 'select',
        options: [
          { value: 'original', label: '🎨 Original Assets Only' },
          { value: 'licensed', label: '📜 Licensed Assets OK' },
          { value: 'any', label: '✅ Any Assets Allowed' },
        ],
        description: 'What assets can be used?',
        group: 'requirements',
        showInPublicPage: true,
      },
      // Prizes Tab
      {
        id: 'prize_pool',
        label: 'Total Prize Pool',
        type: 'currency',
        description: 'Total value of all prizes',
        group: 'prizes',
        showInPublicPage: true,
      },
      {
        id: 'prizes',
        label: 'Prize Breakdown',
        type: 'key-value-list',
        description: 'Prizes by category (e.g., "1st Place" → "$5,000")',
        group: 'prizes',
        fullWidth: true,
        showInPublicPage: true,
      },
      {
        id: 'judging_categories',
        label: 'Judging Categories',
        type: 'key-value-list',
        description: 'What games will be judged on (e.g., "Fun Factor" → "30%")',
        group: 'prizes',
        showInPublicPage: true,
      },
      {
        id: 'community_voting',
        label: 'Community Voting',
        type: 'toggle',
        description: 'Let the public vote on games?',
        group: 'prizes',
        showInPublicPage: true,
      },
      {
        id: 'voting_period',
        label: 'Voting Period (days)',
        type: 'number',
        placeholder: '7',
        validation: { min: 1, max: 30 },
        conditional: { field: 'community_voting', value: true },
        description: 'How long is voting open?',
        group: 'prizes',
      },
    ],
  },

  // ==========================================
  // DEMO DAY
  // ==========================================
  demo_day: {
    id: 'demo_day',
    label: 'Demo Day',
    icon: '🚀',
    color: '#3b82f6',
    description: 'Showcase event for startups and projects',
    defaultDuration: 4,
    capacityDefault: 150,
    tabs: [
      { id: 'format', label: 'Format', icon: '📊', description: 'Presentation details' },
      { id: 'companies', label: 'Presenters', icon: '🏢', description: 'Who is pitching' },
      { id: 'audience', label: 'Audience', icon: '👥', description: 'Who is attending' },
    ],
    fields: [
      // Format Tab
      {
        id: 'demo_format',
        label: 'Presentation Format',
        type: 'select',
        options: [
          { value: 'pitch', label: '🎤 Pitch Deck (5-10 min)' },
          { value: 'live_demo', label: '💻 Live Product Demo' },
          { value: 'video', label: '🎬 Video Demo' },
          { value: 'mixed', label: '📊 Pitch + Live Demo' },
        ],
        description: 'How will companies present?',
        group: 'format',
        showInPublicPage: true,
      },
      {
        id: 'pitch_duration',
        label: 'Pitch Time (minutes)',
        type: 'number',
        placeholder: '5',
        validation: { min: 1, max: 30 },
        description: 'How long is each pitch?',
        group: 'format',
        showInPublicPage: true,
      },
      {
        id: 'qa_duration',
        label: 'Q&A Time (minutes)',
        type: 'number',
        placeholder: '3',
        validation: { min: 0, max: 15 },
        description: 'Q&A time after each pitch',
        group: 'format',
        showInPublicPage: true,
      },
      {
        id: 'schedule',
        label: 'Event Schedule',
        type: 'key-value-list',
        description: 'Full timeline of the demo day',
        group: 'format',
        fullWidth: true,
        showInPublicPage: true,
      },
      {
        id: 'presentation_order',
        label: 'Presentation Order',
        type: 'sortable-list',
        placeholder: 'Add company name...',
        description: 'Order of presentations (drag to reorder)',
        group: 'format',
        fullWidth: true,
      },
      // Companies Tab
      {
        id: 'cohort_name',
        label: 'Cohort / Batch Name',
        type: 'text',
        placeholder: 'e.g., Spring 2024 Cohort',
        description: 'Name of this group of companies',
        group: 'companies',
        showInPublicPage: true,
      },
      {
        id: 'companies',
        label: 'Presenting Companies',
        type: 'person-list',
        description: 'Companies/startups that will present',
        group: 'companies',
        fullWidth: true,
        showInPublicPage: true,
      },
      {
        id: 'industry_focus',
        label: 'Industries',
        type: 'multiselect',
        options: [
          { value: 'fintech', label: '💰 FinTech' },
          { value: 'healthtech', label: '🏥 HealthTech' },
          { value: 'edtech', label: '📚 EdTech' },
          { value: 'ecommerce', label: '🛒 E-commerce' },
          { value: 'saas', label: '☁️ SaaS' },
          { value: 'ai', label: '🤖 AI/ML' },
          { value: 'sustainability', label: '🌱 Sustainability' },
          { value: 'other', label: '📦 Other' },
        ],
        description: 'What industries are represented?',
        group: 'companies',
        showInPublicPage: true,
      },
      {
        id: 'stage',
        label: 'Company Stages',
        type: 'multiselect',
        options: [
          { value: 'idea', label: '💡 Idea Stage' },
          { value: 'mvp', label: '🔨 MVP' },
          { value: 'pre_seed', label: '🌱 Pre-seed' },
          { value: 'seed', label: '🌿 Seed' },
          { value: 'series_a', label: '🚀 Series A+' },
        ],
        description: 'What stages are companies at?',
        group: 'companies',
        showInPublicPage: true,
      },
      // Audience Tab
      {
        id: 'target_audience',
        label: 'Expected Audience',
        type: 'multiselect',
        options: [
          { value: 'investors', label: '💵 Investors' },
          { value: 'corporates', label: '🏢 Corporates' },
          { value: 'media', label: '📰 Media' },
          { value: 'mentors', label: '🎓 Mentors' },
          { value: 'founders', label: '👥 Fellow Founders' },
          { value: 'general', label: '🌍 General Public' },
        ],
        description: 'Who will be in the audience?',
        group: 'audience',
        showInPublicPage: true,
      },
      {
        id: 'investor_attendance',
        label: 'Expected Investors',
        type: 'number',
        placeholder: 'Number of investors',
        description: 'How many investors will attend?',
        group: 'audience',
      },
      {
        id: 'networking_session',
        label: 'Networking After',
        type: 'toggle',
        description: 'Networking session after presentations?',
        group: 'audience',
        showInPublicPage: true,
      },
      {
        id: 'one_on_one_meetings',
        label: '1:1 Meeting Slots',
        type: 'toggle',
        description: 'Can investors book meetings with startups?',
        group: 'audience',
      },
    ],
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getEventTypeConfig(eventType: string): EventTypeConfig | undefined {
  return eventTypeConfigs[eventType];
}

export function getAllEventTypes(): EventTypeConfig[] {
  return Object.values(eventTypeConfigs);
}

export function getFieldsByTab(eventType: string, tabId: string): FormField[] {
  const config = getEventTypeConfig(eventType);
  if (!config) return [];
  return config.fields.filter(field => field.group === tabId);
}

export function getPublicFields(eventType: string): FormField[] {
  const config = getEventTypeConfig(eventType);
  if (!config) return [];
  return config.fields.filter(field => field.showInPublicPage);
}
