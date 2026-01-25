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

const eventCategories = [
  {
    category: "Tech Events",
    types: [
      { value: "hackathon", label: "Hackathon", icon: "💻" },
      { value: "gamejam", label: "Game Jam", icon: "🎮" },
      { value: "tech-conference", label: "Tech Conference", icon: "🚀" },
      { value: "workshop-coding", label: "Coding Workshop", icon: "👨‍💻" },
      { value: "demo-day", label: "Demo Day", icon: "📺" },
    ],
  },
  {
    category: "Speaking & Presentations",
    types: [
      { value: "keynote", label: "Keynote Speech", icon: "🎤" },
      { value: "panel-discussion", label: "Panel Discussion", icon: "👥" },
      { value: "fireside-chat", label: "Fireside Chat", icon: "🔥" },
      { value: "ted-talk", label: "TED-style Talk", icon: "💡" },
      { value: "webinar", label: "Webinar", icon: "🌐" },
    ],
  },
  {
    category: "Networking & Social",
    types: [
      { value: "networking", label: "Networking Event", icon: "🤝" },
      { value: "mixer", label: "Industry Mixer", icon: "🍸" },
      { value: "gala", label: "Gala Dinner", icon: "🎩" },
      { value: "awards", label: "Awards Ceremony", icon: "🏆" },
    ],
  },
  {
    category: "Business Events",
    types: [
      { value: "product-launch", label: "Product Launch", icon: "🎉" },
      { value: "investor-pitch", label: "Investor Pitch", icon: "📈" },
      { value: "trade-show", label: "Trade Show", icon: "🏢" },
      { value: "corporate-retreat", label: "Corporate Retreat", icon: "🏔️" },
    ],
  },
  {
    category: "Creative Events",
    types: [
      { value: "design-sprint", label: "Design Sprint", icon: "🎨" },
      { value: "creative-workshop", label: "Creative Workshop", icon: "✏️" },
      { value: "art-exhibition", label: "Art Exhibition", icon: "🖼️" },
      { value: "film-screening", label: "Film Screening", icon: "🎬" },
    ],
  },
  {
    category: "Community & Education",
    types: [
      { value: "meetup", label: "Community Meetup", icon: "👋" },
      { value: "bootcamp", label: "Bootcamp", icon: "🏋️" },
      { value: "seminar", label: "Seminar", icon: "📚" },
      { value: "charity", label: "Charity Event", icon: "❤️" },
    ],
  },
];

// Flatten event types for the select dropdown
const allEventTypes = eventCategories.flatMap((cat) =>
  cat.types.map((type) => ({
    value: type.value,
    label: `${type.icon} ${type.label}`,
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
          <Select
            options={allEventTypes}
            placeholder="Select event type"
            onChange={(value) => setFormData({ ...formData, type: value })}
          />
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
