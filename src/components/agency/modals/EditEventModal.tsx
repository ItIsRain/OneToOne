"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";

interface EventRequirements {
  // Hackathon / Game Jam
  problemStatement?: string;
  judgingCriteria?: string[];
  prizes?: { place: string; prize: string }[];
  teamSize?: string;
  themes?: string[];
  rules?: string[];
  submissionDeadline?: string;
  techStack?: string[];

  // Speaker / Panel
  speakerName?: string;
  speakerBio?: string;
  speakerNotes?: string;
  talkDuration?: string;
  talkTopics?: string[];
  slidesUrl?: string;
  panelists?: { name: string; title: string; bio: string }[];
  moderator?: string;
  discussionTopics?: string[];

  // Workshop
  prerequisites?: string[];
  materialsNeeded?: string[];
  curriculum?: { title: string; duration: string; description: string }[];
  maxParticipants?: number;
  skillLevel?: string;
  certification?: boolean;

  // Conference
  tracks?: { name: string; description: string }[];
  schedule?: { time: string; title: string; speaker?: string; room?: string }[];
  keynotes?: { speaker: string; topic: string; time: string }[];

  // Gala / Awards
  dressCode?: string;
  menuOptions?: string[];
  entertainment?: string;
  awardCategories?: { category: string; nominees?: string[] }[];
  votingDeadline?: string;

  // Product Launch
  productName?: string;
  productDescription?: string;
  demoSchedule?: { time: string; presenter: string; product: string }[];
  pressContacts?: string[];

  // General
  sponsors?: { name: string; tier: string }[];
  agenda?: { time: string; activity: string }[];
  faqs?: { question: string; answer: string }[];
  contactPerson?: string;
  contactEmail?: string;
}

interface EventData {
  id: number;
  title: string;
  client: string;
  date: string;
  endDate?: string;
  time: string;
  endTime?: string;
  status: string;
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

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventData | null;
  onSave?: (event: EventData) => void;
}

const skillLevelOptions = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "all", label: "All Levels" },
];

const dressCodeOptions = [
  { value: "casual", label: "Casual" },
  { value: "business-casual", label: "Business Casual" },
  { value: "formal", label: "Formal" },
  { value: "black-tie", label: "Black Tie" },
  { value: "themed", label: "Themed/Costume" },
];

const sponsorTierOptions = [
  { value: "Platinum", label: "Platinum" },
  { value: "Gold", label: "Gold" },
  { value: "Silver", label: "Silver" },
  { value: "Bronze", label: "Bronze" },
];

export function EditEventModal({ isOpen, onClose, event, onSave }: EditEventModalProps) {
  const [activeTab, setActiveTab] = useState<"basic" | "requirements" | "sponsors">("basic");
  const [formData, setFormData] = useState<EventData | null>(null);

  useEffect(() => {
    if (event) {
      setFormData({
        ...event,
        requirements: event.requirements || {},
      });
    }
  }, [event]);

  if (!formData) return null;

  const req = formData.requirements || {};
  const updateReq = (updates: Partial<EventRequirements>) => {
    setFormData({
      ...formData,
      requirements: { ...req, ...updates },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Saving event:", formData);
    onSave?.(formData);
    onClose();
  };

  const eventType = formData.type.toLowerCase();
  const isHackathon = eventType.includes("hackathon") || eventType.includes("game jam");
  const isSpeaker = eventType.includes("keynote") || eventType.includes("panel") || eventType.includes("talk") || eventType.includes("fireside") || eventType.includes("webinar");
  const isWorkshop = eventType.includes("workshop") || eventType.includes("bootcamp") || eventType.includes("seminar");
  const isConference = eventType.includes("conference");
  const isGala = eventType.includes("gala") || eventType.includes("awards");
  const isProductLaunch = eventType.includes("launch") || eventType.includes("demo");

  const renderHackathonFields = () => (
    <div className="space-y-5">
      <div>
        <Label>Problem Statement</Label>
        <TextArea
          value={req.problemStatement || ""}
          onChange={(value) => updateReq({ problemStatement: value })}
          placeholder="Describe the challenge participants will solve..."
          rows={3}
        />
      </div>

      <div>
        <Label>Judging Criteria (one per line)</Label>
        <TextArea
          value={(req.judgingCriteria || []).join("\n")}
          onChange={(value) => updateReq({ judgingCriteria: value.split("\n").filter(Boolean) })}
          placeholder="Innovation&#10;Technical Implementation&#10;Design&#10;Impact"
          rows={4}
        />
      </div>

      <div>
        <Label>Prizes</Label>
        <div className="space-y-2">
          {(req.prizes || [{ place: "", prize: "" }]).map((prize, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="1st Place"
                value={prize.place}
                onChange={(e) => {
                  const newPrizes = [...(req.prizes || [])];
                  newPrizes[i] = { ...newPrizes[i], place: e.target.value };
                  updateReq({ prizes: newPrizes });
                }}
              />
              <Input
                placeholder="$10,000"
                value={prize.prize}
                onChange={(e) => {
                  const newPrizes = [...(req.prizes || [])];
                  newPrizes[i] = { ...newPrizes[i], prize: e.target.value };
                  updateReq({ prizes: newPrizes });
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const newPrizes = (req.prizes || []).filter((_, idx) => idx !== i);
                  updateReq({ prizes: newPrizes });
                }}
                className="px-3 text-error-500 hover:text-error-600"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => updateReq({ prizes: [...(req.prizes || []), { place: "", prize: "" }] })}
            className="text-sm text-brand-500 hover:text-brand-600"
          >
            + Add Prize
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Team Size</Label>
          <Input
            value={req.teamSize || ""}
            onChange={(e) => updateReq({ teamSize: e.target.value })}
            placeholder="e.g., 1-4 members"
          />
        </div>
        <div>
          <Label>Submission Deadline</Label>
          <Input
            type="datetime-local"
            value={req.submissionDeadline || ""}
            onChange={(e) => updateReq({ submissionDeadline: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label>Themes / Tracks (comma separated)</Label>
        <Input
          value={(req.themes || []).join(", ")}
          onChange={(e) => updateReq({ themes: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
          placeholder="AI/ML, Sustainability, FinTech, HealthTech"
        />
      </div>

      <div>
        <Label>Rules (one per line)</Label>
        <TextArea
          value={(req.rules || []).join("\n")}
          onChange={(value) => updateReq({ rules: value.split("\n").filter(Boolean) })}
          placeholder="All code must be written during the event&#10;Teams must present a working demo&#10;Use of pre-existing code libraries is allowed"
          rows={4}
        />
      </div>

      <div>
        <Label>Allowed Tech Stack (comma separated)</Label>
        <Input
          value={(req.techStack || []).join(", ")}
          onChange={(e) => updateReq({ techStack: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
          placeholder="Any, or specific: React, Python, AWS"
        />
      </div>
    </div>
  );

  const renderSpeakerFields = () => (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Speaker Name</Label>
          <Input
            value={req.speakerName || ""}
            onChange={(e) => updateReq({ speakerName: e.target.value })}
            placeholder="Full name"
          />
        </div>
        <div>
          <Label>Talk Duration</Label>
          <Input
            value={req.talkDuration || ""}
            onChange={(e) => updateReq({ talkDuration: e.target.value })}
            placeholder="e.g., 45 minutes"
          />
        </div>
      </div>

      <div>
        <Label>Speaker Bio</Label>
        <TextArea
          value={req.speakerBio || ""}
          onChange={(value) => updateReq({ speakerBio: value })}
          placeholder="Brief biography for the event page..."
          rows={3}
        />
      </div>

      <div>
        <Label>Speaker Notes (internal - not shown to attendees)</Label>
        <TextArea
          value={req.speakerNotes || ""}
          onChange={(value) => updateReq({ speakerNotes: value })}
          placeholder="Technical requirements, special requests, timing notes..."
          rows={3}
        />
      </div>

      <div>
        <Label>Topics to Cover (comma separated)</Label>
        <Input
          value={(req.talkTopics || []).join(", ")}
          onChange={(e) => updateReq({ talkTopics: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
          placeholder="AI Ethics, Future of Work, Leadership"
        />
      </div>

      <div>
        <Label>Slides URL</Label>
        <Input
          value={req.slidesUrl || ""}
          onChange={(e) => updateReq({ slidesUrl: e.target.value })}
          placeholder="https://docs.google.com/presentation/..."
        />
      </div>

      {eventType.includes("panel") && (
        <>
          <div>
            <Label>Moderator</Label>
            <Input
              value={req.moderator || ""}
              onChange={(e) => updateReq({ moderator: e.target.value })}
              placeholder="Panel moderator name"
            />
          </div>

          <div>
            <Label>Panelists</Label>
            <div className="space-y-3">
              {(req.panelists || [{ name: "", title: "", bio: "" }]).map((panelist, i) => (
                <div key={i} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Name"
                      value={panelist.name}
                      onChange={(e) => {
                        const newPanelists = [...(req.panelists || [])];
                        newPanelists[i] = { ...newPanelists[i], name: e.target.value };
                        updateReq({ panelists: newPanelists });
                      }}
                    />
                    <Input
                      placeholder="Title/Company"
                      value={panelist.title}
                      onChange={(e) => {
                        const newPanelists = [...(req.panelists || [])];
                        newPanelists[i] = { ...newPanelists[i], title: e.target.value };
                        updateReq({ panelists: newPanelists });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newPanelists = (req.panelists || []).filter((_, idx) => idx !== i);
                        updateReq({ panelists: newPanelists });
                      }}
                      className="px-3 text-error-500 hover:text-error-600"
                    >
                      ×
                    </button>
                  </div>
                  <Input
                    placeholder="Short bio"
                    value={panelist.bio}
                    onChange={(e) => {
                      const newPanelists = [...(req.panelists || [])];
                      newPanelists[i] = { ...newPanelists[i], bio: e.target.value };
                      updateReq({ panelists: newPanelists });
                    }}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => updateReq({ panelists: [...(req.panelists || []), { name: "", title: "", bio: "" }] })}
                className="text-sm text-brand-500 hover:text-brand-600"
              >
                + Add Panelist
              </button>
            </div>
          </div>

          <div>
            <Label>Discussion Topics (one per line)</Label>
            <TextArea
              value={(req.discussionTopics || []).join("\n")}
              onChange={(value) => updateReq({ discussionTopics: value.split("\n").filter(Boolean) })}
              placeholder="Industry trends&#10;Challenges and solutions&#10;Future predictions"
              rows={3}
            />
          </div>
        </>
      )}
    </div>
  );

  const renderWorkshopFields = () => (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Max Participants</Label>
          <Input
            type="number"
            value={req.maxParticipants || ""}
            onChange={(e) => updateReq({ maxParticipants: parseInt(e.target.value) || undefined })}
            placeholder="30"
          />
        </div>
        <div>
          <Label>Skill Level</Label>
          <Select
            options={skillLevelOptions}
            defaultValue={req.skillLevel || ""}
            onChange={(value) => updateReq({ skillLevel: value })}
            placeholder="Select level"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="certification"
          checked={req.certification || false}
          onChange={(e) => updateReq({ certification: e.target.checked })}
          className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
        />
        <Label htmlFor="certification">Participants receive certification</Label>
      </div>

      <div>
        <Label>Prerequisites (one per line)</Label>
        <TextArea
          value={(req.prerequisites || []).join("\n")}
          onChange={(value) => updateReq({ prerequisites: value.split("\n").filter(Boolean) })}
          placeholder="Basic JavaScript knowledge&#10;Laptop with Node.js installed&#10;GitHub account"
          rows={3}
        />
      </div>

      <div>
        <Label>Materials Needed (one per line)</Label>
        <TextArea
          value={(req.materialsNeeded || []).join("\n")}
          onChange={(value) => updateReq({ materialsNeeded: value.split("\n").filter(Boolean) })}
          placeholder="Laptop&#10;Notebook and pen&#10;Code editor installed"
          rows={3}
        />
      </div>

      <div>
        <Label>Curriculum</Label>
        <div className="space-y-3">
          {(req.curriculum || [{ title: "", duration: "", description: "" }]).map((item, i) => (
            <div key={i} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Module title"
                  value={item.title}
                  onChange={(e) => {
                    const newCurriculum = [...(req.curriculum || [])];
                    newCurriculum[i] = { ...newCurriculum[i], title: e.target.value };
                    updateReq({ curriculum: newCurriculum });
                  }}
                  className="flex-1"
                />
                <Input
                  placeholder="Duration"
                  value={item.duration}
                  onChange={(e) => {
                    const newCurriculum = [...(req.curriculum || [])];
                    newCurriculum[i] = { ...newCurriculum[i], duration: e.target.value };
                    updateReq({ curriculum: newCurriculum });
                  }}
                  className="w-32"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newCurriculum = (req.curriculum || []).filter((_, idx) => idx !== i);
                    updateReq({ curriculum: newCurriculum });
                  }}
                  className="px-3 text-error-500 hover:text-error-600"
                >
                  ×
                </button>
              </div>
              <Input
                placeholder="Description"
                value={item.description}
                onChange={(e) => {
                  const newCurriculum = [...(req.curriculum || [])];
                  newCurriculum[i] = { ...newCurriculum[i], description: e.target.value };
                  updateReq({ curriculum: newCurriculum });
                }}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => updateReq({ curriculum: [...(req.curriculum || []), { title: "", duration: "", description: "" }] })}
            className="text-sm text-brand-500 hover:text-brand-600"
          >
            + Add Module
          </button>
        </div>
      </div>
    </div>
  );

  const renderConferenceFields = () => (
    <div className="space-y-5">
      <div>
        <Label>Conference Tracks</Label>
        <div className="space-y-3">
          {(req.tracks || [{ name: "", description: "" }]).map((track, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="Track name"
                value={track.name}
                onChange={(e) => {
                  const newTracks = [...(req.tracks || [])];
                  newTracks[i] = { ...newTracks[i], name: e.target.value };
                  updateReq({ tracks: newTracks });
                }}
              />
              <Input
                placeholder="Description"
                value={track.description}
                onChange={(e) => {
                  const newTracks = [...(req.tracks || [])];
                  newTracks[i] = { ...newTracks[i], description: e.target.value };
                  updateReq({ tracks: newTracks });
                }}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  const newTracks = (req.tracks || []).filter((_, idx) => idx !== i);
                  updateReq({ tracks: newTracks });
                }}
                className="px-3 text-error-500 hover:text-error-600"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => updateReq({ tracks: [...(req.tracks || []), { name: "", description: "" }] })}
            className="text-sm text-brand-500 hover:text-brand-600"
          >
            + Add Track
          </button>
        </div>
      </div>

      <div>
        <Label>Keynote Sessions</Label>
        <div className="space-y-3">
          {(req.keynotes || [{ speaker: "", topic: "", time: "" }]).map((keynote, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="Speaker"
                value={keynote.speaker}
                onChange={(e) => {
                  const newKeynotes = [...(req.keynotes || [])];
                  newKeynotes[i] = { ...newKeynotes[i], speaker: e.target.value };
                  updateReq({ keynotes: newKeynotes });
                }}
              />
              <Input
                placeholder="Topic"
                value={keynote.topic}
                onChange={(e) => {
                  const newKeynotes = [...(req.keynotes || [])];
                  newKeynotes[i] = { ...newKeynotes[i], topic: e.target.value };
                  updateReq({ keynotes: newKeynotes });
                }}
                className="flex-1"
              />
              <Input
                placeholder="Time"
                value={keynote.time}
                onChange={(e) => {
                  const newKeynotes = [...(req.keynotes || [])];
                  newKeynotes[i] = { ...newKeynotes[i], time: e.target.value };
                  updateReq({ keynotes: newKeynotes });
                }}
                className="w-24"
              />
              <button
                type="button"
                onClick={() => {
                  const newKeynotes = (req.keynotes || []).filter((_, idx) => idx !== i);
                  updateReq({ keynotes: newKeynotes });
                }}
                className="px-3 text-error-500 hover:text-error-600"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => updateReq({ keynotes: [...(req.keynotes || []), { speaker: "", topic: "", time: "" }] })}
            className="text-sm text-brand-500 hover:text-brand-600"
          >
            + Add Keynote
          </button>
        </div>
      </div>

      <div>
        <Label>Full Schedule</Label>
        <div className="space-y-3">
          {(req.schedule || [{ time: "", title: "", speaker: "", room: "" }]).map((item, i) => (
            <div key={i} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Time"
                  value={item.time}
                  onChange={(e) => {
                    const newSchedule = [...(req.schedule || [])];
                    newSchedule[i] = { ...newSchedule[i], time: e.target.value };
                    updateReq({ schedule: newSchedule });
                  }}
                  className="w-28"
                />
                <Input
                  placeholder="Session title"
                  value={item.title}
                  onChange={(e) => {
                    const newSchedule = [...(req.schedule || [])];
                    newSchedule[i] = { ...newSchedule[i], title: e.target.value };
                    updateReq({ schedule: newSchedule });
                  }}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newSchedule = (req.schedule || []).filter((_, idx) => idx !== i);
                    updateReq({ schedule: newSchedule });
                  }}
                  className="px-3 text-error-500 hover:text-error-600"
                >
                  ×
                </button>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Speaker (optional)"
                  value={item.speaker || ""}
                  onChange={(e) => {
                    const newSchedule = [...(req.schedule || [])];
                    newSchedule[i] = { ...newSchedule[i], speaker: e.target.value };
                    updateReq({ schedule: newSchedule });
                  }}
                />
                <Input
                  placeholder="Room (optional)"
                  value={item.room || ""}
                  onChange={(e) => {
                    const newSchedule = [...(req.schedule || [])];
                    newSchedule[i] = { ...newSchedule[i], room: e.target.value };
                    updateReq({ schedule: newSchedule });
                  }}
                  className="w-32"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => updateReq({ schedule: [...(req.schedule || []), { time: "", title: "", speaker: "", room: "" }] })}
            className="text-sm text-brand-500 hover:text-brand-600"
          >
            + Add Session
          </button>
        </div>
      </div>
    </div>
  );

  const renderGalaFields = () => (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Dress Code</Label>
          <Select
            options={dressCodeOptions}
            defaultValue={req.dressCode || ""}
            onChange={(value) => updateReq({ dressCode: value })}
            placeholder="Select dress code"
          />
        </div>
        <div>
          <Label>Entertainment</Label>
          <Input
            value={req.entertainment || ""}
            onChange={(e) => updateReq({ entertainment: e.target.value })}
            placeholder="e.g., Live band, DJ, Orchestra"
          />
        </div>
      </div>

      <div>
        <Label>Menu Options (comma separated)</Label>
        <Input
          value={(req.menuOptions || []).join(", ")}
          onChange={(e) => updateReq({ menuOptions: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
          placeholder="Vegetarian, Vegan, Gluten-free, Standard"
        />
      </div>

      {eventType.includes("awards") && (
        <>
          <div>
            <Label>Voting Deadline</Label>
            <Input
              type="datetime-local"
              value={req.votingDeadline || ""}
              onChange={(e) => updateReq({ votingDeadline: e.target.value })}
            />
          </div>

          <div>
            <Label>Award Categories</Label>
            <div className="space-y-3">
              {(req.awardCategories || [{ category: "", nominees: [] }]).map((award, i) => (
                <div key={i} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Category name"
                      value={award.category}
                      onChange={(e) => {
                        const newCategories = [...(req.awardCategories || [])];
                        newCategories[i] = { ...newCategories[i], category: e.target.value };
                        updateReq({ awardCategories: newCategories });
                      }}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newCategories = (req.awardCategories || []).filter((_, idx) => idx !== i);
                        updateReq({ awardCategories: newCategories });
                      }}
                      className="px-3 text-error-500 hover:text-error-600"
                    >
                      ×
                    </button>
                  </div>
                  <Input
                    placeholder="Nominees (comma separated)"
                    value={(award.nominees || []).join(", ")}
                    onChange={(e) => {
                      const newCategories = [...(req.awardCategories || [])];
                      newCategories[i] = { ...newCategories[i], nominees: e.target.value.split(",").map(s => s.trim()).filter(Boolean) };
                      updateReq({ awardCategories: newCategories });
                    }}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => updateReq({ awardCategories: [...(req.awardCategories || []), { category: "", nominees: [] }] })}
                className="text-sm text-brand-500 hover:text-brand-600"
              >
                + Add Category
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderProductLaunchFields = () => (
    <div className="space-y-5">
      <div>
        <Label>Product Name</Label>
        <Input
          value={req.productName || ""}
          onChange={(e) => updateReq({ productName: e.target.value })}
          placeholder="Product being launched"
        />
      </div>

      <div>
        <Label>Product Description</Label>
        <TextArea
          value={req.productDescription || ""}
          onChange={(value) => updateReq({ productDescription: value })}
          placeholder="Brief description of the product..."
          rows={3}
        />
      </div>

      <div>
        <Label>Demo Schedule</Label>
        <div className="space-y-3">
          {(req.demoSchedule || [{ time: "", presenter: "", product: "" }]).map((demo, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="Time"
                value={demo.time}
                onChange={(e) => {
                  const newSchedule = [...(req.demoSchedule || [])];
                  newSchedule[i] = { ...newSchedule[i], time: e.target.value };
                  updateReq({ demoSchedule: newSchedule });
                }}
                className="w-24"
              />
              <Input
                placeholder="Presenter"
                value={demo.presenter}
                onChange={(e) => {
                  const newSchedule = [...(req.demoSchedule || [])];
                  newSchedule[i] = { ...newSchedule[i], presenter: e.target.value };
                  updateReq({ demoSchedule: newSchedule });
                }}
              />
              <Input
                placeholder="Product/Feature"
                value={demo.product}
                onChange={(e) => {
                  const newSchedule = [...(req.demoSchedule || [])];
                  newSchedule[i] = { ...newSchedule[i], product: e.target.value };
                  updateReq({ demoSchedule: newSchedule });
                }}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  const newSchedule = (req.demoSchedule || []).filter((_, idx) => idx !== i);
                  updateReq({ demoSchedule: newSchedule });
                }}
                className="px-3 text-error-500 hover:text-error-600"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => updateReq({ demoSchedule: [...(req.demoSchedule || []), { time: "", presenter: "", product: "" }] })}
            className="text-sm text-brand-500 hover:text-brand-600"
          >
            + Add Demo
          </button>
        </div>
      </div>

      <div>
        <Label>Press Contacts (one per line)</Label>
        <TextArea
          value={(req.pressContacts || []).join("\n")}
          onChange={(value) => updateReq({ pressContacts: value.split("\n").filter(Boolean) })}
          placeholder="press@company.com&#10;John Smith - PR Manager"
          rows={3}
        />
      </div>
    </div>
  );

  const renderSponsorsTab = () => (
    <div className="space-y-5">
      <div>
        <Label>Sponsors</Label>
        <div className="space-y-3">
          {(req.sponsors || [{ name: "", tier: "" }]).map((sponsor, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="Sponsor name"
                value={sponsor.name}
                onChange={(e) => {
                  const newSponsors = [...(req.sponsors || [])];
                  newSponsors[i] = { ...newSponsors[i], name: e.target.value };
                  updateReq({ sponsors: newSponsors });
                }}
                className="flex-1"
              />
              <div className="w-40">
                <Select
                  options={sponsorTierOptions}
                  defaultValue={sponsor.tier}
                  onChange={(value) => {
                    const newSponsors = [...(req.sponsors || [])];
                    newSponsors[i] = { ...newSponsors[i], tier: value };
                    updateReq({ sponsors: newSponsors });
                  }}
                  placeholder="Tier"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const newSponsors = (req.sponsors || []).filter((_, idx) => idx !== i);
                  updateReq({ sponsors: newSponsors });
                }}
                className="px-3 text-error-500 hover:text-error-600"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => updateReq({ sponsors: [...(req.sponsors || []), { name: "", tier: "" }] })}
            className="text-sm text-brand-500 hover:text-brand-600"
          >
            + Add Sponsor
          </button>
        </div>
      </div>

      <div>
        <Label>Agenda</Label>
        <div className="space-y-2">
          {(req.agenda || [{ time: "", activity: "" }]).map((item, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="Time"
                value={item.time}
                onChange={(e) => {
                  const newAgenda = [...(req.agenda || [])];
                  newAgenda[i] = { ...newAgenda[i], time: e.target.value };
                  updateReq({ agenda: newAgenda });
                }}
                className="w-28"
              />
              <Input
                placeholder="Activity"
                value={item.activity}
                onChange={(e) => {
                  const newAgenda = [...(req.agenda || [])];
                  newAgenda[i] = { ...newAgenda[i], activity: e.target.value };
                  updateReq({ agenda: newAgenda });
                }}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  const newAgenda = (req.agenda || []).filter((_, idx) => idx !== i);
                  updateReq({ agenda: newAgenda });
                }}
                className="px-3 text-error-500 hover:text-error-600"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => updateReq({ agenda: [...(req.agenda || []), { time: "", activity: "" }] })}
            className="text-sm text-brand-500 hover:text-brand-600"
          >
            + Add Item
          </button>
        </div>
      </div>

      <div>
        <Label>FAQs</Label>
        <div className="space-y-3">
          {(req.faqs || [{ question: "", answer: "" }]).map((faq, i) => (
            <div key={i} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Question"
                  value={faq.question}
                  onChange={(e) => {
                    const newFaqs = [...(req.faqs || [])];
                    newFaqs[i] = { ...newFaqs[i], question: e.target.value };
                    updateReq({ faqs: newFaqs });
                  }}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newFaqs = (req.faqs || []).filter((_, idx) => idx !== i);
                    updateReq({ faqs: newFaqs });
                  }}
                  className="px-3 text-error-500 hover:text-error-600"
                >
                  ×
                </button>
              </div>
              <Input
                placeholder="Answer"
                value={faq.answer}
                onChange={(e) => {
                  const newFaqs = [...(req.faqs || [])];
                  newFaqs[i] = { ...newFaqs[i], answer: e.target.value };
                  updateReq({ faqs: newFaqs });
                }}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => updateReq({ faqs: [...(req.faqs || []), { question: "", answer: "" }] })}
            className="text-sm text-brand-500 hover:text-brand-600"
          >
            + Add FAQ
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Contact Person</Label>
          <Input
            value={req.contactPerson || ""}
            onChange={(e) => updateReq({ contactPerson: e.target.value })}
            placeholder="Event coordinator name"
          />
        </div>
        <div>
          <Label>Contact Email</Label>
          <Input
            type="email"
            value={req.contactEmail || ""}
            onChange={(e) => updateReq({ contactEmail: e.target.value })}
            placeholder="events@company.com"
          />
        </div>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-2xl dark:bg-gray-800">
            {formData.icon}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Edit Event
            </h2>
            <p className="text-sm text-gray-500">{formData.title}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          {[
            { key: "basic", label: "Basic Info" },
            { key: "requirements", label: "Requirements" },
            { key: "sponsors", label: "Sponsors & More" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-[2px] transition-colors ${
                activeTab === tab.key
                  ? "border-brand-500 text-brand-500"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            {activeTab === "basic" && (
              <div className="space-y-5">
                <div>
                  <Label>Event Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <TextArea
                    value={formData.description || ""}
                    onChange={(value) => setFormData({ ...formData, description: value })}
                    placeholder="Event description..."
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={formData.endDate || ""}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      placeholder="9:00 AM"
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input
                      value={formData.endTime || ""}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      placeholder="5:00 PM"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isVirtual"
                    checked={formData.isVirtual || false}
                    onChange={(e) => setFormData({ ...formData, isVirtual: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <Label htmlFor="isVirtual">Virtual / Online Event</Label>
                </div>

                {formData.isVirtual ? (
                  <div>
                    <Label>Virtual Platform</Label>
                    <Input
                      value={formData.virtualPlatform || ""}
                      onChange={(e) => setFormData({ ...formData, virtualPlatform: e.target.value })}
                      placeholder="Zoom, Teams, etc."
                    />
                  </div>
                ) : (
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={formData.location || ""}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Venue address"
                    />
                  </div>
                )}

                <div>
                  <Label>Expected Attendees</Label>
                  <Input
                    type="number"
                    value={formData.attendees || ""}
                    onChange={(e) => setFormData({ ...formData, attendees: parseInt(e.target.value) || undefined })}
                    placeholder="500"
                  />
                </div>
              </div>
            )}

            {activeTab === "requirements" && (
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  Configure {formData.type}-specific requirements that will be shown to attendees.
                </p>
                {isHackathon && renderHackathonFields()}
                {isSpeaker && renderSpeakerFields()}
                {isWorkshop && renderWorkshopFields()}
                {isConference && renderConferenceFields()}
                {isGala && renderGalaFields()}
                {isProductLaunch && renderProductLaunchFields()}
                {!isHackathon && !isSpeaker && !isWorkshop && !isConference && !isGala && !isProductLaunch && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No specific requirements template for this event type.</p>
                    <p className="text-sm mt-1">Use the &quot;Sponsors & More&quot; tab for general event details.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "sponsors" && renderSponsorsTab()}
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
