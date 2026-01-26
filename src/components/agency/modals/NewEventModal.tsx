"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// SVG icon components for event types
const EventIcons = {
  hackathon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  gamejam: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
    </svg>
  ),
  conference: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  workshop: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  keynote: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  ),
  panel: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  fireside: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
  ),
  lightbulb: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  globe: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  handshake: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
    </svg>
  ),
  cocktail: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  gala: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  trophy: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  launch: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  ),
  chart: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  ),
  building: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  mountain: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  palette: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  pencil: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  frame: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  film: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  dumbbell: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  ),
  book: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  heart: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
};

const eventCategories = [
  {
    category: "Tech Events",
    types: [
      { value: "hackathon", label: "Hackathon", icon: EventIcons.hackathon },
      { value: "gamejam", label: "Game Jam", icon: EventIcons.gamejam },
      { value: "tech-conference", label: "Tech Conference", icon: EventIcons.conference },
      { value: "workshop-coding", label: "Coding Workshop", icon: EventIcons.workshop },
    ],
  },
  {
    category: "Speaking & Presentations",
    types: [
      { value: "keynote", label: "Keynote Speech", icon: EventIcons.keynote },
      { value: "panel-discussion", label: "Panel Discussion", icon: EventIcons.panel },
      { value: "fireside-chat", label: "Fireside Chat", icon: EventIcons.fireside },
      { value: "ted-talk", label: "TED-style Talk", icon: EventIcons.lightbulb },
      { value: "webinar", label: "Webinar", icon: EventIcons.globe },
    ],
  },
  {
    category: "Networking & Social",
    types: [
      { value: "networking", label: "Networking Event", icon: EventIcons.handshake },
      { value: "mixer", label: "Industry Mixer", icon: EventIcons.cocktail },
      { value: "gala", label: "Gala Dinner", icon: EventIcons.gala },
      { value: "awards", label: "Awards Ceremony", icon: EventIcons.trophy },
    ],
  },
  {
    category: "Business Events",
    types: [
      { value: "product-launch", label: "Product Launch", icon: EventIcons.launch },
      { value: "investor-pitch", label: "Investor Pitch", icon: EventIcons.chart },
      { value: "trade-show", label: "Trade Show", icon: EventIcons.building },
      { value: "corporate-retreat", label: "Corporate Retreat", icon: EventIcons.mountain },
    ],
  },
  {
    category: "Creative Events",
    types: [
      { value: "design-sprint", label: "Design Sprint", icon: EventIcons.palette },
      { value: "creative-workshop", label: "Creative Workshop", icon: EventIcons.pencil },
      { value: "art-exhibition", label: "Art Exhibition", icon: EventIcons.frame },
      { value: "film-screening", label: "Film Screening", icon: EventIcons.film },
    ],
  },
  {
    category: "Community & Education",
    types: [
      { value: "meetup", label: "Community Meetup", icon: EventIcons.users },
      { value: "bootcamp", label: "Bootcamp", icon: EventIcons.dumbbell },
      { value: "seminar", label: "Seminar", icon: EventIcons.book },
      { value: "charity", label: "Charity Event", icon: EventIcons.heart },
    ],
  },
];

// Flatten event types for the select dropdown
const allEventTypes = eventCategories.flatMap((cat) =>
  cat.types.map((type) => ({
    value: type.value,
    label: type.label,
    icon: type.icon,
    category: cat.category,
  }))
);

// Type-specific field configurations
const typeSpecificFields: Record<string, string[]> = {
  hackathon: ["duration", "teamSize", "prizes", "themes"],
  gamejam: ["duration", "teamSize", "prizes", "gameEngine", "themes"],
  "tech-conference": ["speakers", "tracks", "capacity"],
  keynote: ["speakerName", "speakerBio", "duration"],
  "panel-discussion": ["panelists", "moderator", "duration"],
  "fireside-chat": ["host", "guest", "duration"],
  "investor-pitch": ["pitchDuration", "investors", "fundingGoal"],
  "product-launch": ["productName", "mediaInvites", "liveDemo"],
  bootcamp: ["curriculum", "duration", "certification"],
  meetup: ["capacity", "sponsors"],
  gala: ["dressCode", "entertainment", "catering"],
  awards: ["categories", "nominationDeadline", "votingMethod"],
};

export const NewEventModal: React.FC<NewEventModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    client: "",
    type: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    location: "",
    isVirtual: false,
    virtualPlatform: "",
    description: "",
    // Type-specific fields
    duration: "",
    teamSize: "",
    prizes: "",
    themes: "",
    gameEngine: "",
    speakers: "",
    tracks: "",
    capacity: "",
    speakerName: "",
    speakerBio: "",
    panelists: "",
    moderator: "",
    host: "",
    guest: "",
    pitchDuration: "",
    investors: "",
    fundingGoal: "",
    productName: "",
    mediaInvites: "",
    liveDemo: false,
    curriculum: "",
    certification: false,
    sponsors: "",
    dressCode: "",
    entertainment: "",
    catering: "",
    categories: "",
    nominationDeadline: "",
    votingMethod: "",
  });

  const clientOptions = [
    { value: "acme", label: "Acme Corporation" },
    { value: "techstart", label: "TechStart Inc." },
    { value: "globaltech", label: "GlobalTech Solutions" },
    { value: "metro", label: "Metro Events" },
    { value: "creative", label: "Creative Co." },
    { value: "internal", label: "Internal Event" },
  ];

  const virtualPlatformOptions = [
    { value: "zoom", label: "Zoom" },
    { value: "teams", label: "Microsoft Teams" },
    { value: "meet", label: "Google Meet" },
    { value: "webex", label: "Webex" },
    { value: "discord", label: "Discord" },
    { value: "twitch", label: "Twitch" },
    { value: "youtube", label: "YouTube Live" },
    { value: "custom", label: "Custom Platform" },
  ];

  const durationOptions = [
    { value: "24h", label: "24 Hours" },
    { value: "48h", label: "48 Hours" },
    { value: "72h", label: "72 Hours (3 days)" },
    { value: "1week", label: "1 Week" },
    { value: "2weeks", label: "2 Weeks" },
    { value: "custom", label: "Custom Duration" },
  ];

  const gameEngineOptions = [
    { value: "any", label: "Any Engine" },
    { value: "unity", label: "Unity" },
    { value: "unreal", label: "Unreal Engine" },
    { value: "godot", label: "Godot" },
    { value: "gamemaker", label: "GameMaker" },
    { value: "custom", label: "Custom/Other" },
  ];

  const dressCodeOptions = [
    { value: "casual", label: "Casual" },
    { value: "business-casual", label: "Business Casual" },
    { value: "formal", label: "Formal" },
    { value: "black-tie", label: "Black Tie" },
    { value: "themed", label: "Themed/Costume" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Event data:", formData);
    onClose();
  };

  const currentTypeFields = typeSpecificFields[formData.type] || [];

  const renderTypeSpecificFields = () => {
    if (!formData.type || currentTypeFields.length === 0) return null;

    return (
      <div className="border-t border-gray-200 dark:border-gray-700 pt-5 mt-5">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-4">
          Event-Specific Details
        </h4>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {currentTypeFields.includes("duration") && (
            <div>
              <Label htmlFor="duration">Duration</Label>
              <Select
                options={durationOptions}
                placeholder="Select duration"
                onChange={(value) => setFormData({ ...formData, duration: value })}
              />
            </div>
          )}

          {currentTypeFields.includes("teamSize") && (
            <div>
              <Label htmlFor="teamSize">Team Size</Label>
              <Input
                id="teamSize"
                type="text"
                placeholder="e.g., 1-4 members"
                onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
              />
            </div>
          )}

          {currentTypeFields.includes("prizes") && (
            <div className="sm:col-span-2">
              <Label htmlFor="prizes">Prizes</Label>
              <Input
                id="prizes"
                type="text"
                placeholder="e.g., $10,000 Grand Prize, $5,000 Runner-up"
                onChange={(e) => setFormData({ ...formData, prizes: e.target.value })}
              />
            </div>
          )}

          {currentTypeFields.includes("themes") && (
            <div className="sm:col-span-2">
              <Label htmlFor="themes">Themes/Tracks</Label>
              <Input
                id="themes"
                type="text"
                placeholder="e.g., AI/ML, Sustainability, Healthcare"
                onChange={(e) => setFormData({ ...formData, themes: e.target.value })}
              />
            </div>
          )}

          {currentTypeFields.includes("gameEngine") && (
            <div>
              <Label htmlFor="gameEngine">Game Engine</Label>
              <Select
                options={gameEngineOptions}
                placeholder="Select engine"
                onChange={(value) => setFormData({ ...formData, gameEngine: value })}
              />
            </div>
          )}

          {currentTypeFields.includes("speakers") && (
            <div className="sm:col-span-2">
              <Label htmlFor="speakers">Speakers</Label>
              <TextArea
                placeholder="List speakers (one per line)"
                onChange={(value) => setFormData({ ...formData, speakers: value })}
                rows={2}
              />
            </div>
          )}

          {currentTypeFields.includes("tracks") && (
            <div>
              <Label htmlFor="tracks">Conference Tracks</Label>
              <Input
                id="tracks"
                type="text"
                placeholder="e.g., Engineering, Design, Product"
                onChange={(e) => setFormData({ ...formData, tracks: e.target.value })}
              />
            </div>
          )}

          {currentTypeFields.includes("capacity") && (
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                placeholder="Maximum attendees"
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
            </div>
          )}

          {currentTypeFields.includes("speakerName") && (
            <div>
              <Label htmlFor="speakerName">Speaker Name</Label>
              <Input
                id="speakerName"
                type="text"
                placeholder="Full name"
                onChange={(e) => setFormData({ ...formData, speakerName: e.target.value })}
              />
            </div>
          )}

          {currentTypeFields.includes("speakerBio") && (
            <div className="sm:col-span-2">
              <Label htmlFor="speakerBio">Speaker Bio</Label>
              <TextArea
                placeholder="Brief biography..."
                onChange={(value) => setFormData({ ...formData, speakerBio: value })}
                rows={2}
              />
            </div>
          )}

          {currentTypeFields.includes("panelists") && (
            <div className="sm:col-span-2">
              <Label htmlFor="panelists">Panelists</Label>
              <TextArea
                placeholder="List panelists (one per line)"
                onChange={(value) => setFormData({ ...formData, panelists: value })}
                rows={2}
              />
            </div>
          )}

          {currentTypeFields.includes("moderator") && (
            <div>
              <Label htmlFor="moderator">Moderator</Label>
              <Input
                id="moderator"
                type="text"
                placeholder="Moderator name"
                onChange={(e) => setFormData({ ...formData, moderator: e.target.value })}
              />
            </div>
          )}

          {currentTypeFields.includes("host") && (
            <div>
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                type="text"
                placeholder="Host name"
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
              />
            </div>
          )}

          {currentTypeFields.includes("guest") && (
            <div>
              <Label htmlFor="guest">Guest</Label>
              <Input
                id="guest"
                type="text"
                placeholder="Guest name"
                onChange={(e) => setFormData({ ...formData, guest: e.target.value })}
              />
            </div>
          )}

          {currentTypeFields.includes("pitchDuration") && (
            <div>
              <Label htmlFor="pitchDuration">Pitch Duration</Label>
              <Input
                id="pitchDuration"
                type="text"
                placeholder="e.g., 10 minutes"
                onChange={(e) => setFormData({ ...formData, pitchDuration: e.target.value })}
              />
            </div>
          )}

          {currentTypeFields.includes("investors") && (
            <div className="sm:col-span-2">
              <Label htmlFor="investors">Invited Investors</Label>
              <TextArea
                placeholder="List investors (one per line)"
                onChange={(value) => setFormData({ ...formData, investors: value })}
                rows={2}
              />
            </div>
          )}

          {currentTypeFields.includes("fundingGoal") && (
            <div>
              <Label htmlFor="fundingGoal">Funding Goal</Label>
              <Input
                id="fundingGoal"
                type="text"
                placeholder="e.g., $500,000"
                onChange={(e) => setFormData({ ...formData, fundingGoal: e.target.value })}
              />
            </div>
          )}

          {currentTypeFields.includes("productName") && (
            <div>
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                type="text"
                placeholder="Product being launched"
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              />
            </div>
          )}

          {currentTypeFields.includes("mediaInvites") && (
            <div>
              <Label htmlFor="mediaInvites">Media Invites</Label>
              <Input
                id="mediaInvites"
                type="number"
                placeholder="Number of media invites"
                onChange={(e) => setFormData({ ...formData, mediaInvites: e.target.value })}
              />
            </div>
          )}

          {currentTypeFields.includes("curriculum") && (
            <div className="sm:col-span-2">
              <Label htmlFor="curriculum">Curriculum Overview</Label>
              <TextArea
                placeholder="Describe the bootcamp curriculum..."
                onChange={(value) => setFormData({ ...formData, curriculum: value })}
                rows={2}
              />
            </div>
          )}

          {currentTypeFields.includes("sponsors") && (
            <div className="sm:col-span-2">
              <Label htmlFor="sponsors">Sponsors</Label>
              <Input
                id="sponsors"
                type="text"
                placeholder="List sponsors"
                onChange={(e) => setFormData({ ...formData, sponsors: e.target.value })}
              />
            </div>
          )}

          {currentTypeFields.includes("dressCode") && (
            <div>
              <Label htmlFor="dressCode">Dress Code</Label>
              <Select
                options={dressCodeOptions}
                placeholder="Select dress code"
                onChange={(value) => setFormData({ ...formData, dressCode: value })}
              />
            </div>
          )}

          {currentTypeFields.includes("entertainment") && (
            <div>
              <Label htmlFor="entertainment">Entertainment</Label>
              <Input
                id="entertainment"
                type="text"
                placeholder="e.g., Live band, DJ"
                onChange={(e) => setFormData({ ...formData, entertainment: e.target.value })}
              />
            </div>
          )}

          {currentTypeFields.includes("catering") && (
            <div>
              <Label htmlFor="catering">Catering</Label>
              <Input
                id="catering"
                type="text"
                placeholder="Catering details"
                onChange={(e) => setFormData({ ...formData, catering: e.target.value })}
              />
            </div>
          )}

          {currentTypeFields.includes("categories") && (
            <div className="sm:col-span-2">
              <Label htmlFor="categories">Award Categories</Label>
              <TextArea
                placeholder="List award categories (one per line)"
                onChange={(value) => setFormData({ ...formData, categories: value })}
                rows={2}
              />
            </div>
          )}

          {currentTypeFields.includes("nominationDeadline") && (
            <div>
              <Label htmlFor="nominationDeadline">Nomination Deadline</Label>
              <Input
                id="nominationDeadline"
                type="date"
                onChange={(e) => setFormData({ ...formData, nominationDeadline: e.target.value })}
              />
            </div>
          )}

          {currentTypeFields.includes("votingMethod") && (
            <div>
              <Label htmlFor="votingMethod">Voting Method</Label>
              <Input
                id="votingMethod"
                type="text"
                placeholder="e.g., Panel, Public vote"
                onChange={(e) => setFormData({ ...formData, votingMethod: e.target.value })}
              />
            </div>
          )}

          {currentTypeFields.includes("liveDemo") && (
            <div className="flex items-center gap-3 sm:col-span-2">
              <input
                id="liveDemo"
                type="checkbox"
                className="h-5 w-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700"
                checked={formData.liveDemo}
                onChange={(e) => setFormData({ ...formData, liveDemo: e.target.checked })}
              />
              <Label htmlFor="liveDemo">Include Live Demo</Label>
            </div>
          )}

          {currentTypeFields.includes("certification") && (
            <div className="flex items-center gap-3 sm:col-span-2">
              <input
                id="certification"
                type="checkbox"
                className="h-5 w-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700"
                checked={formData.certification}
                onChange={(e) => setFormData({ ...formData, certification: e.target.checked })}
              />
              <Label htmlFor="certification">Includes Certification</Label>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Create New Event
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Choose an event type and fill in the details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
        {/* Event Type Selection */}
        <div>
          <Label htmlFor="type">Event Type</Label>
          <div className="relative">
            <select
              className={`h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pl-11 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${
                formData.type ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"
              }`}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="" disabled className="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
                Select event type
              </option>
              {eventCategories.map((cat) => (
                <optgroup key={cat.category} label={cat.category}>
                  {cat.types.map((type) => (
                    <option key={type.value} value={type.value} className="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
                      {type.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {/* Icon display */}
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
              {formData.type ? (
                allEventTypes.find(t => t.value === formData.type)?.icon
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            {/* Dropdown arrow */}
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {formData.type && (
            <p className="mt-1 text-xs text-gray-400">
              Category: {allEventTypes.find(t => t.value === formData.type)?.category}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="title">Event Title</Label>
          <Input
            id="title"
            type="text"
            placeholder="Enter event title"
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="client">Client / Organization</Label>
          <Select
            options={clientOptions}
            placeholder="Select client"
            onChange={(value) => setFormData({ ...formData, client: value })}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="time"
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="time"
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>
        </div>

        {/* Virtual Event Toggle */}
        <div className="flex items-center gap-3">
          <input
            id="isVirtual"
            type="checkbox"
            className="h-5 w-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700"
            checked={formData.isVirtual}
            onChange={(e) => setFormData({ ...formData, isVirtual: e.target.checked })}
          />
          <Label htmlFor="isVirtual">Virtual / Online Event</Label>
        </div>

        {formData.isVirtual ? (
          <div>
            <Label htmlFor="virtualPlatform">Virtual Platform</Label>
            <Select
              options={virtualPlatformOptions}
              placeholder="Select platform"
              onChange={(value) => setFormData({ ...formData, virtualPlatform: value })}
            />
          </div>
        ) : (
          <div>
            <Label htmlFor="location">Location / Venue</Label>
            <Input
              id="location"
              type="text"
              placeholder="Event venue or address"
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
        )}

        <div>
          <Label htmlFor="description">Description</Label>
          <TextArea
            placeholder="Enter event details, goals, and requirements..."
            onChange={(value) => setFormData({ ...formData, description: value })}
            rows={3}
          />
        </div>

        {/* Type-specific fields */}
        {renderTypeSpecificFields()}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Create Event
          </button>
        </div>
      </form>
    </Modal>
  );
};
