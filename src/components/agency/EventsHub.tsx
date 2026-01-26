"use client";
import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import { NewEventModal, EditEventModal, JudgingModal } from "./modals";
import { EventDetailsSidebar } from "./sidebars";

// Event type icons mapping
const eventTypeIcons: Record<string, React.ReactNode> = {
  "Hackathon": (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  "Game Jam": (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
    </svg>
  ),
  "Keynote Speech": (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  ),
  "Panel Discussion": (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  "Tech Conference": (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  "Product Launch": (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  ),
  "Fireside Chat": (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
  ),
  "Design Sprint": (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  "Awards Ceremony": (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
};

const getEventIcon = (type: string) => {
  return eventTypeIcons[type] || (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
};

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
  requirements?: Record<string, unknown>;
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
    icon: "hackathon",
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
    icon: "gamejam",
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
    icon: "keynote",
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
    icon: "panel",
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
    icon: "conference",
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
    icon: "launch",
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
    id: 8,
    title: "Fireside Chat with Tech Leaders",
    client: "Creative Co.",
    date: "2025-01-30",
    time: "7:00 PM",
    status: "Completed",
    type: "Fireside Chat",
    icon: "fireside",
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
    icon: "design",
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
    icon: "awards",
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
  "Design Sprint": "light",
  "Awards Ceremony": "error",
};

export const EventsHub = () => {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isJudgingModalOpen, setIsJudgingModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filter, setFilter] = useState<"all" | "tech" | "speaking" | "business" | "creative" | "social">("all");

  // Check if event type supports judging
  const supportsJudging = (type: string) => {
    return type === "Hackathon" || type === "Game Jam";
  };

  const handleOpenJudging = (event: Event) => {
    setSelectedEvent(event);
    setIsJudgingModalOpen(true);
  };

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
          { key: "all", label: "All Events", icon: null },
          { key: "tech", label: "Tech", icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          )},
          { key: "speaking", label: "Speaking", icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )},
          { key: "business", label: "Business", icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          )},
          { key: "creative", label: "Creative", icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          )},
          { key: "social", label: "Social", icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )},
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as typeof filter)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-theme-xs font-medium rounded-full transition-colors ${
              filter === item.key
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {item.icon}
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
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 shrink-0">
                  {getEventIcon(event.type)}
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
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        Virtual
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
                  {supportsJudging(event.type) && (
                    <button
                      onClick={() => handleOpenJudging(event)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:hover:bg-purple-500/20 text-theme-xs font-medium transition-colors"
                      title="Manage judging for this event"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      Judging
                    </button>
                  )}
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
    <EventDetailsSidebar
      isOpen={isDetailsModalOpen}
      onClose={() => setIsDetailsModalOpen(false)}
      event={selectedEvent ? {
        id: String(selectedEvent.id),
        title: selectedEvent.title,
        description: selectedEvent.description,
        location: selectedEvent.location,
        start_date: selectedEvent.date,
        end_date: selectedEvent.endDate,
        start_time: selectedEvent.time,
        end_time: selectedEvent.endTime,
        status: selectedEvent.status.toLowerCase().replace(" ", "_") as "upcoming" | "in_progress" | "completed" | "cancelled",
        event_type: selectedEvent.type?.toLowerCase().replace(/ /g, "_"),
        category: selectedEvent.category,
        icon: selectedEvent.icon,
        is_virtual: selectedEvent.isVirtual,
        virtual_platform: selectedEvent.virtualPlatform,
        attendees_count: selectedEvent.attendees,
        requirements: selectedEvent.requirements,
        client: selectedEvent.client ? { id: "mock", name: selectedEvent.client, company: selectedEvent.client } : null,
      } : null}
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
    {selectedEvent && (
      <JudgingModal
        isOpen={isJudgingModalOpen}
        onClose={() => {
          setIsJudgingModalOpen(false);
          setSelectedEvent(null);
        }}
        eventId={String(selectedEvent.id)}
        eventTitle={selectedEvent.title}
        eventType={selectedEvent.type}
      />
    )}
    </>
  );
};
