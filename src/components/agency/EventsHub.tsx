"use client";
import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import { NewEventModal, EventDetailsModal, EditEventModal } from "./modals";

interface EventRequirements {
  problemStatement?: string;
  judgingCriteria?: string[];
  prizes?: { place: string; prize: string }[];
  teamSize?: string;
  themes?: string[];
  rules?: string[];
  submissionDeadline?: string;
  techStack?: string[];
  speakerName?: string;
  speakerBio?: string;
  speakerNotes?: string;
  talkDuration?: string;
  talkTopics?: string[];
  slidesUrl?: string;
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
  awardCategories?: { category: string; nominees?: string[] }[];
  votingDeadline?: string;
  productName?: string;
  productDescription?: string;
  demoSchedule?: { time: string; presenter: string; product: string }[];
  pressContacts?: string[];
  sponsors?: { name: string; tier: string }[];
  agenda?: { time: string; activity: string }[];
  faqs?: { question: string; answer: string }[];
  contactPerson?: string;
  contactEmail?: string;
}

interface Event {
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

const eventsData: Event[] = [
  {
    id: 1,
    title: "TechCrunch Hackathon 2025",
    client: "TechStart Inc.",
    date: "2025-03-15",
    endDate: "2025-03-17",
    time: "9:00 AM",
    endTime: "6:00 PM",
    status: "Upcoming",
    type: "Hackathon",
    icon: "💻",
    category: "Tech Events",
    attendees: 500,
    location: "San Francisco Convention Center",
    description: "Join us for 48 hours of innovation! Build solutions that matter and compete for amazing prizes.",
    requirements: {
      problemStatement: "Build a solution that addresses climate change using AI/ML. Your project should demonstrate innovative use of technology to create measurable environmental impact.",
      judgingCriteria: ["Innovation & Creativity (25%)", "Technical Implementation (25%)", "User Experience & Design (20%)", "Business Viability (15%)", "Presentation Quality (15%)"],
      prizes: [
        { place: "1st Place", prize: "$25,000 + AWS Credits" },
        { place: "2nd Place", prize: "$15,000 + Mentorship" },
        { place: "3rd Place", prize: "$10,000" },
        { place: "Best Design", prize: "$5,000" },
      ],
      teamSize: "2-5 members",
      themes: ["Climate Tech", "AI/ML", "Sustainability", "Clean Energy"],
      rules: [
        "All code must be written during the hackathon",
        "Teams must demo a working prototype",
        "Pre-existing code libraries and frameworks are allowed",
        "All team members must be registered participants",
        "Projects must be original work",
      ],
      submissionDeadline: "2025-03-17T14:00",
      techStack: ["Any language", "Cloud platforms allowed", "Open source encouraged"],
      sponsors: [
        { name: "TechCorp", tier: "Platinum" },
        { name: "CloudBase", tier: "Gold" },
        { name: "DevTools Inc", tier: "Silver" },
      ],
      agenda: [
        { time: "9:00 AM", activity: "Registration & Breakfast" },
        { time: "10:00 AM", activity: "Opening Ceremony" },
        { time: "11:00 AM", activity: "Hacking Begins!" },
        { time: "1:00 PM", activity: "Lunch" },
        { time: "6:00 PM", activity: "Dinner" },
        { time: "2:00 PM (Day 2)", activity: "Submissions Due" },
        { time: "3:00 PM (Day 2)", activity: "Demos Begin" },
        { time: "5:00 PM (Day 2)", activity: "Awards Ceremony" },
      ],
      faqs: [
        { question: "Do I need a team?", answer: "You can participate solo or form a team. We'll have team formation activities for those looking for teammates." },
        { question: "What should I bring?", answer: "Laptop, charger, and any hardware you plan to use. We provide WiFi, power, food, and drinks." },
      ],
      contactPerson: "Sarah Chen",
      contactEmail: "hackathon@techstart.com",
    },
  },
  {
    id: 2,
    title: "Global Game Jam - Spring Edition",
    client: "Creative Co.",
    date: "2025-02-28",
    endDate: "2025-03-02",
    time: "6:00 PM",
    status: "Upcoming",
    type: "Game Jam",
    icon: "🎮",
    category: "Tech Events",
    isVirtual: true,
    virtualPlatform: "Discord",
    attendees: 2000,
    description: "Create a game in 48 hours! This virtual game jam welcomes developers, artists, and designers of all skill levels.",
    requirements: {
      problemStatement: "Create a game based on the theme that will be revealed at the start. Theme hint: 'Connections'",
      teamSize: "1-6 members",
      themes: ["Theme revealed at start"],
      prizes: [
        { place: "Grand Prize", prize: "$5,000 + Publishing Deal" },
        { place: "Best Art", prize: "$2,000" },
        { place: "Best Audio", prize: "$2,000" },
        { place: "Community Choice", prize: "$1,000" },
      ],
      techStack: ["Unity", "Unreal", "Godot", "GameMaker", "Any engine"],
    },
  },
  {
    id: 3,
    title: "Future of AI - Keynote Address",
    client: "GlobalTech Solutions",
    date: "2025-02-20",
    time: "2:00 PM",
    endTime: "4:00 PM",
    status: "Upcoming",
    type: "Keynote Speech",
    icon: "🎤",
    category: "Speaking & Presentations",
    attendees: 300,
    location: "Grand Ballroom, Marriott Downtown",
    description: "Join Dr. Elena Rodriguez as she shares insights on the future of artificial intelligence and its impact on society.",
    requirements: {
      speakerName: "Dr. Elena Rodriguez",
      speakerBio: "Dr. Elena Rodriguez is the Chief AI Officer at GlobalTech Solutions and former Director of AI Research at Stanford. She has published over 100 papers on machine learning and received the Turing Award in 2023.",
      speakerNotes: "- Requires podium with teleprompter\n- Prefers handheld mic\n- Will have live demos - needs reliable WiFi\n- Green room required 1 hour before",
      talkDuration: "90 minutes (60 min talk + 30 min Q&A)",
      talkTopics: ["Large Language Models", "AI Safety", "Future of Work", "Ethical AI"],
      slidesUrl: "https://docs.google.com/presentation/d/abc123",
      agenda: [
        { time: "2:00 PM", activity: "Welcome & Introduction" },
        { time: "2:15 PM", activity: "Keynote Address" },
        { time: "3:15 PM", activity: "Live AI Demo" },
        { time: "3:30 PM", activity: "Q&A Session" },
        { time: "4:00 PM", activity: "Networking Reception" },
      ],
    },
  },
  {
    id: 4,
    title: "Startup Founders Panel",
    client: "Metro Events",
    date: "2025-02-18",
    time: "4:00 PM",
    endTime: "6:00 PM",
    status: "Upcoming",
    type: "Panel Discussion",
    icon: "👥",
    category: "Speaking & Presentations",
    isVirtual: true,
    virtualPlatform: "Zoom Webinar",
    attendees: 150,
    description: "Learn from successful founders who've built billion-dollar companies. Candid discussions about failures, pivots, and breakthroughs.",
    requirements: {
      moderator: "Michael Chang, Editor-in-Chief at TechCrunch",
      panelists: [
        { name: "Lisa Park", title: "CEO, FinanceAI (Series C, $200M)", bio: "Former Goldman Sachs, built FinanceAI from 0 to $2B valuation in 4 years" },
        { name: "James Wu", title: "Founder, CloudScale (Acquired for $1B)", bio: "Serial entrepreneur, 3 successful exits, angel investor in 50+ startups" },
        { name: "Maria Santos", title: "Co-founder, HealthTech Plus", bio: "Doctor turned entrepreneur, Forbes 30 under 30, revolutionizing telehealth" },
      ],
      discussionTopics: [
        "Finding product-market fit",
        "Raising your first round",
        "Building a world-class team",
        "Navigating market downturns",
        "Work-life balance as a founder",
      ],
      talkDuration: "2 hours",
    },
  },
  {
    id: 5,
    title: "Annual Tech Conference",
    client: "Acme Corporation",
    date: "2025-02-10",
    endDate: "2025-02-12",
    time: "8:00 AM",
    status: "In Progress",
    type: "Tech Conference",
    icon: "🚀",
    category: "Tech Events",
    attendees: 1500,
    location: "Moscone Center, San Francisco",
    description: "Three days of cutting-edge tech talks, hands-on workshops, and networking with industry leaders.",
    requirements: {
      tracks: [
        { name: "Engineering", description: "Deep dives into system design, architecture, and best practices" },
        { name: "Product", description: "Product strategy, user research, and roadmap planning" },
        { name: "Design", description: "UI/UX trends, design systems, and accessibility" },
        { name: "Leadership", description: "Engineering management, team building, and culture" },
      ],
      keynotes: [
        { speaker: "CEO, Acme Corporation", topic: "The Next Decade of Innovation", time: "Day 1, 9:00 AM" },
        { speaker: "CTO, Major Tech Co", topic: "Building for Billions", time: "Day 2, 9:00 AM" },
        { speaker: "Industry Legend", topic: "Lessons from 40 Years in Tech", time: "Day 3, 9:00 AM" },
      ],
      schedule: [
        { time: "8:00 AM", title: "Registration & Breakfast", room: "Lobby" },
        { time: "9:00 AM", title: "Opening Keynote", speaker: "CEO", room: "Main Hall" },
        { time: "10:30 AM", title: "Track Sessions Begin", room: "Various" },
        { time: "12:00 PM", title: "Lunch & Networking", room: "Expo Hall" },
        { time: "1:30 PM", title: "Afternoon Sessions", room: "Various" },
        { time: "5:00 PM", title: "Happy Hour", room: "Rooftop" },
      ],
      sponsors: [
        { name: "MegaCorp", tier: "Platinum" },
        { name: "TechGiant", tier: "Platinum" },
        { name: "StartupHub", tier: "Gold" },
        { name: "DevTools", tier: "Silver" },
      ],
    },
  },
  {
    id: 6,
    title: "Product Launch: NextGen Platform",
    client: "TechStart Inc.",
    date: "2025-02-08",
    time: "11:00 AM",
    status: "In Progress",
    type: "Product Launch",
    icon: "🎉",
    category: "Business Events",
    attendees: 200,
    location: "TechStart HQ, Palo Alto",
    description: "Be the first to see our revolutionary new platform that will change how teams collaborate.",
    requirements: {
      productName: "NextGen Collaboration Platform",
      productDescription: "An AI-powered workspace that brings together documents, communication, and project management in one seamless experience.",
      demoSchedule: [
        { time: "11:00 AM", presenter: "CEO", product: "Vision & Overview" },
        { time: "11:30 AM", presenter: "VP Product", product: "Core Features Demo" },
        { time: "12:00 PM", presenter: "CTO", product: "AI Capabilities" },
        { time: "12:30 PM", presenter: "Design Lead", product: "User Experience" },
      ],
      pressContacts: [
        "press@techstart.com",
        "Jane Smith, PR Director: jane@techstart.com",
      ],
    },
  },
  {
    id: 7,
    title: "Investor Demo Day",
    client: "GlobalTech Solutions",
    date: "2025-02-05",
    time: "10:00 AM",
    status: "Completed",
    type: "Demo Day",
    icon: "📺",
    category: "Tech Events",
    attendees: 50,
  },
  {
    id: 8,
    title: "Fireside Chat with Tech Leaders",
    client: "Creative Co.",
    date: "2025-01-30",
    time: "7:00 PM",
    status: "Completed",
    type: "Fireside Chat",
    icon: "🔥",
    category: "Speaking & Presentations",
    isVirtual: true,
    attendees: 800,
  },
  {
    id: 9,
    title: "Design Sprint Workshop",
    client: "Metro Events",
    date: "2025-01-25",
    time: "9:00 AM",
    endTime: "5:00 PM",
    status: "Completed",
    type: "Design Sprint",
    icon: "🎨",
    category: "Creative Events",
    attendees: 30,
    location: "Innovation Lab, Downtown",
    requirements: {
      maxParticipants: 30,
      skillLevel: "intermediate",
      prerequisites: ["Basic design knowledge", "Figma account", "Laptop with Figma installed"],
      materialsNeeded: ["Laptop", "Notebook", "Post-it notes (provided)", "Markers (provided)"],
      curriculum: [
        { title: "Introduction to Design Sprints", duration: "30 min", description: "Overview of the 5-day sprint compressed into 1 day" },
        { title: "Map & Sketch", duration: "2 hours", description: "Problem mapping and individual sketching sessions" },
        { title: "Decide", duration: "1 hour", description: "Dot voting and decision making" },
        { title: "Prototype", duration: "3 hours", description: "Rapid prototyping in Figma" },
        { title: "Test", duration: "1.5 hours", description: "User testing with real feedback" },
      ],
      certification: true,
    },
  },
  {
    id: 10,
    title: "Tech Awards 2025",
    client: "Acme Corporation",
    date: "2025-03-30",
    time: "6:00 PM",
    endTime: "10:00 PM",
    status: "Upcoming",
    type: "Awards Ceremony",
    icon: "🏆",
    category: "Networking & Social",
    attendees: 400,
    location: "The Ritz-Carlton, San Francisco",
    description: "Celebrating the best in tech innovation. Join us for an evening of recognition, networking, and celebration.",
    requirements: {
      dressCode: "Black Tie",
      entertainment: "Live Orchestra & DJ",
      menuOptions: ["Standard", "Vegetarian", "Vegan", "Gluten-free", "Kosher"],
      awardCategories: [
        { category: "Startup of the Year", nominees: ["FinanceAI", "HealthTech Plus", "GreenEnergy Co", "EduLearn"] },
        { category: "Innovation Award", nominees: ["Project Alpha", "Quantum Computing Initiative", "AI for Good"] },
        { category: "Leader of the Year", nominees: ["Lisa Park", "James Wu", "Maria Santos", "David Chen"] },
        { category: "Best Workplace", nominees: ["TechStart", "CloudScale", "DataFlow", "AILabs"] },
      ],
      votingDeadline: "2025-03-15T23:59",
      sponsors: [
        { name: "Acme Corporation", tier: "Platinum" },
        { name: "TechGiant", tier: "Gold" },
        { name: "InvestCorp", tier: "Gold" },
      ],
      agenda: [
        { time: "6:00 PM", activity: "Cocktail Reception" },
        { time: "7:00 PM", activity: "Dinner Service" },
        { time: "8:00 PM", activity: "Awards Ceremony Begins" },
        { time: "9:30 PM", activity: "Closing Remarks" },
        { time: "9:45 PM", activity: "After Party" },
      ],
    },
  },
];

const eventTypeColors: Record<string, "primary" | "success" | "warning" | "error" | "light"> = {
  "Hackathon": "primary",
  "Game Jam": "primary",
  "Tech Conference": "primary",
  "Keynote Speech": "success",
  "Panel Discussion": "success",
  "Fireside Chat": "success",
  "Product Launch": "warning",
  "Demo Day": "warning",
  "Design Sprint": "light",
  "Awards Ceremony": "error",
};

export const EventsHub = () => {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filter, setFilter] = useState<"all" | "tech" | "speaking" | "business" | "creative" | "social">("all");

  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsDetailsModalOpen(true);
  };

  const handleEditEvent = () => {
    setIsDetailsModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleSaveEvent = (updatedEvent: Event) => {
    console.log("Saved event:", updatedEvent);
    // In a real app, this would update the event in the database
  };

  const filteredEvents = eventsData.filter((event) => {
    if (filter === "all") return true;
    if (filter === "tech") return event.category === "Tech Events";
    if (filter === "speaking") return event.category === "Speaking & Presentations";
    if (filter === "business") return event.category === "Business Events";
    if (filter === "creative") return event.category === "Creative Events";
    if (filter === "social") return event.category === "Networking & Social";
    return true;
  });

  const formatDateRange = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const startFormatted = start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    if (endDate) {
      const end = new Date(endDate);
      const endFormatted = end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return `${startFormatted} - ${endFormatted}`;
    }

    return start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Events
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage hackathons, speaking events, and more
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            <button
              onClick={() => setView("list")}
              className={`px-4 py-2 text-theme-sm font-medium rounded-md transition-colors ${
                view === "list"
                  ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`px-4 py-2 text-theme-sm font-medium rounded-md transition-colors ${
                view === "calendar"
                  ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              Calendar
            </button>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            New Event
          </button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: "all", label: "All Events" },
          { key: "tech", label: "💻 Tech" },
          { key: "speaking", label: "🎤 Speaking" },
          { key: "business", label: "📈 Business" },
          { key: "creative", label: "🎨 Creative" },
          { key: "social", label: "🤝 Social" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as typeof filter)}
            className={`px-3 py-1.5 text-theme-xs font-medium rounded-full transition-colors ${
              filter === item.key
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {view === "list" ? (
        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="flex flex-col gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between hover:border-brand-200 dark:hover:border-brand-500/30 transition-colors"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-2xl dark:bg-gray-800 shrink-0">
                  {event.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h4 className="font-medium text-gray-800 text-theme-sm dark:text-white/90 truncate">
                      {event.title}
                    </h4>
                    <Badge
                      size="sm"
                      color={
                        event.status === "Upcoming"
                          ? "primary"
                          : event.status === "In Progress"
                          ? "warning"
                          : event.status === "Completed"
                          ? "success"
                          : "error"
                      }
                    >
                      {event.status}
                    </Badge>
                    {event.isVirtual && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs dark:bg-blue-500/10 dark:text-blue-400">
                        🌐 Virtual
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-500 text-theme-xs dark:text-gray-400">
                    <span>{event.client}</span>
                    <span>•</span>
                    <Badge size="sm" color={eventTypeColors[event.type] || "light"}>
                      {event.type}
                    </Badge>
                    {event.attendees && (
                      <>
                        <span>•</span>
                        <span>{event.attendees.toLocaleString()} attendees</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {formatDateRange(event.date, event.endDate)}
                  </p>
                  <p className="text-gray-500 text-theme-xs dark:text-gray-400">
                    {event.time}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewEvent(event)}
                    className="text-brand-500 hover:text-brand-600 dark:text-brand-400 text-theme-sm font-medium"
                  >
                    View
                  </button>
                  <button
                    onClick={() => {
                      setSelectedEvent(event);
                      setIsEditModalOpen(true);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredEvents.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No events found for this category.
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <p>Calendar view coming soon</p>
        </div>
      )}
    </div>

    <NewEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    <EventDetailsModal
      isOpen={isDetailsModalOpen}
      onClose={() => setIsDetailsModalOpen(false)}
      event={selectedEvent}
      onEdit={handleEditEvent}
    />
    <EditEventModal
      isOpen={isEditModalOpen}
      onClose={() => {
        setIsEditModalOpen(false);
        setSelectedEvent(null);
      }}
      event={selectedEvent}
      onSave={handleSaveEvent}
    />
    </>
  );
};
