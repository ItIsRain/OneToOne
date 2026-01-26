"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";

interface Event {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  start_date: string;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  status: string;
  event_type?: string | null;
  category?: string | null;
  icon?: string | null;
  color?: string | null;
  is_virtual?: boolean;
  virtual_platform?: string | null;
  virtual_link?: string | null;
  max_attendees?: number | null;
  is_public?: boolean;
  registration_required?: boolean;
  registration_deadline?: string | null;
  ticket_price?: number | null;
  currency?: string | null;
  tags?: string[] | null;
  notes?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  client_id?: string | null;
  assigned_to?: string | null;
}

interface Client {
  id: string;
  name: string;
  company: string | null;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
}

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  event?: Event | null;
}

const eventTypeOptions = [
  { value: "general", label: "📅 General" },
  { value: "meeting", label: "👥 Meeting" },
  { value: "conference", label: "🎤 Conference" },
  { value: "workshop", label: "🔧 Workshop" },
  { value: "webinar", label: "💻 Webinar" },
  { value: "hackathon", label: "💻 Hackathon" },
  { value: "game_jam", label: "🎮 Game Jam" },
  { value: "keynote", label: "🎙️ Keynote" },
  { value: "panel", label: "🗣️ Panel Discussion" },
  { value: "fireside_chat", label: "🔥 Fireside Chat" },
  { value: "product_launch", label: "🚀 Product Launch" },
  { value: "demo_day", label: "📊 Demo Day" },
  { value: "design_sprint", label: "🎨 Design Sprint" },
  { value: "awards", label: "🏆 Awards Ceremony" },
  { value: "networking", label: "🤝 Networking" },
  { value: "training", label: "📚 Training" },
  { value: "team_building", label: "🎯 Team Building" },
  { value: "client_meeting", label: "💼 Client Meeting" },
  { value: "deadline", label: "⏰ Deadline" },
  { value: "milestone", label: "🏁 Milestone" },
];

const categoryOptions = [
  { value: "Tech Events", label: "Tech Events" },
  { value: "Speaking & Presentations", label: "Speaking & Presentations" },
  { value: "Business Events", label: "Business Events" },
  { value: "Creative Events", label: "Creative Events" },
  { value: "Networking & Social", label: "Networking & Social" },
  { value: "Internal", label: "Internal" },
  { value: "Client", label: "Client" },
  { value: "General", label: "General" },
];

const platformOptions = [
  { value: "zoom", label: "Zoom" },
  { value: "teams", label: "Microsoft Teams" },
  { value: "google_meet", label: "Google Meet" },
  { value: "webex", label: "Webex" },
  { value: "discord", label: "Discord" },
  { value: "twitch", label: "Twitch" },
  { value: "youtube", label: "YouTube Live" },
  { value: "custom", label: "Custom Platform" },
];

const statusOptions = [
  { value: "upcoming", label: "Upcoming" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const colorOptions = [
  { value: "#6366f1", label: "Indigo" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#6b7280", label: "Gray" },
];

export const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  event,
}) => {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeTab, setActiveTab] = useState<"basic" | "details" | "contact">("basic");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    status: "upcoming",
    event_type: "general",
    category: "General",
    color: "#6366f1",
    is_virtual: false,
    virtual_platform: "",
    virtual_link: "",
    location: "",
    max_attendees: "",
    is_public: false,
    registration_required: false,
    registration_deadline: "",
    ticket_price: "",
    currency: "USD",
    tags: "",
    notes: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    client_id: "",
    assigned_to: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      fetchProfiles();
      if (event) {
        setFormData({
          title: event.title || "",
          description: event.description || "",
          date: event.start_date ? event.start_date.split("T")[0] : "",
          end_date: event.end_date ? event.end_date.split("T")[0] : "",
          start_time: event.start_time || "",
          end_time: event.end_time || "",
          status: event.status || "upcoming",
          event_type: event.event_type || "general",
          category: event.category || "General",
          color: event.color || "#6366f1",
          is_virtual: event.is_virtual || false,
          virtual_platform: event.virtual_platform || "",
          virtual_link: event.virtual_link || "",
          location: event.location || "",
          max_attendees: event.max_attendees?.toString() || "",
          is_public: event.is_public || false,
          registration_required: event.registration_required || false,
          registration_deadline: event.registration_deadline ? event.registration_deadline.split("T")[0] : "",
          ticket_price: event.ticket_price?.toString() || "",
          currency: event.currency || "USD",
          tags: event.tags?.join(", ") || "",
          notes: event.notes || "",
          contact_name: event.contact_name || "",
          contact_email: event.contact_email || "",
          contact_phone: event.contact_phone || "",
          client_id: event.client_id || "",
          assigned_to: event.assigned_to || "",
        });
      } else {
        setFormData({
          title: "",
          description: "",
          date: "",
          end_date: "",
          start_time: "",
          end_time: "",
          status: "upcoming",
          event_type: "general",
          category: "General",
          color: "#6366f1",
          is_virtual: false,
          virtual_platform: "",
          virtual_link: "",
          location: "",
          max_attendees: "",
          is_public: false,
          registration_required: false,
          registration_deadline: "",
          ticket_price: "",
          currency: "USD",
          tags: "",
          notes: "",
          contact_name: "",
          contact_email: "",
          contact_phone: "",
          client_id: "",
          assigned_to: "",
        });
      }
      setActiveTab("basic");
    }
  }, [isOpen, event]);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchProfiles = async () => {
    try {
      const response = await fetch("/api/profiles");
      if (response.ok) {
        const data = await response.json();
        setProfiles(data.profiles || []);
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date) return;

    setLoading(true);
    try {
      const url = event ? `/api/events/${event.id}` : "/api/events";
      const method = event ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          start_date: formData.date,
          end_date: formData.end_date || null,
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
          status: formData.status,
          event_type: formData.event_type,
          category: formData.category,
          color: formData.color,
          is_virtual: formData.is_virtual,
          virtual_platform: formData.is_virtual ? formData.virtual_platform : null,
          virtual_link: formData.is_virtual ? formData.virtual_link : null,
          location: !formData.is_virtual ? formData.location : null,
          max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
          is_public: formData.is_public,
          registration_required: formData.registration_required,
          registration_deadline: formData.registration_deadline || null,
          ticket_price: formData.ticket_price ? parseFloat(formData.ticket_price) : null,
          currency: formData.currency,
          tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          notes: formData.notes || null,
          contact_name: formData.contact_name || null,
          contact_email: formData.contact_email || null,
          contact_phone: formData.contact_phone || null,
          client_id: formData.client_id || null,
          assigned_to: formData.assigned_to || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save event");
      }

      onSuccess();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "details", label: "Details" },
    { id: "contact", label: "Contact" },
  ] as const;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
            {event ? "Edit Event" : "Create New Event"}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {event ? "Update event details" : "Add a new event to your calendar"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-gray-800 shadow dark:bg-gray-700 dark:text-white"
                  : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info Tab */}
          {activeTab === "basic" && (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter event title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Type & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="event_type">Event Type</Label>
                  <Select
                    options={eventTypeOptions}
                    value={formData.event_type}
                    onChange={(value) => setFormData({ ...formData, event_type: value })}
                    placeholder="Select type"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    options={categoryOptions}
                    value={formData.category}
                    onChange={(value) => setFormData({ ...formData, category: value })}
                    placeholder="Select category"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Start Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>

              {/* Status & Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    options={statusOptions}
                    value={formData.status}
                    onChange={(value) => setFormData({ ...formData, status: value })}
                    placeholder="Select status"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`h-8 w-8 rounded-lg transition-all ${
                          formData.color === color.value ? "ring-2 ring-offset-2 ring-brand-500" : ""
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <TextArea
                  placeholder="Enter event description..."
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-4">
              {/* Virtual Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">Virtual Event</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This event will be hosted online
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_virtual: !formData.is_virtual })}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    formData.is_virtual ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      formData.is_virtual ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Location or Virtual Platform */}
              {formData.is_virtual ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="virtual_platform">Platform</Label>
                    <Select
                      options={platformOptions}
                      value={formData.virtual_platform}
                      onChange={(value) => setFormData({ ...formData, virtual_platform: value })}
                      placeholder="Select platform"
                    />
                  </div>
                  <div>
                    <Label htmlFor="virtual_link">Meeting Link</Label>
                    <Input
                      id="virtual_link"
                      type="url"
                      placeholder="https://zoom.us/j/..."
                      value={formData.virtual_link}
                      onChange={(e) => setFormData({ ...formData, virtual_link: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    type="text"
                    placeholder="Event venue address"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              )}

              {/* Capacity & Registration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_attendees">Max Attendees</Label>
                  <Input
                    id="max_attendees"
                    type="number"
                    placeholder="Unlimited"
                    value={formData.max_attendees}
                    onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="registration_deadline">Registration Deadline</Label>
                  <Input
                    id="registration_deadline"
                    type="date"
                    value={formData.registration_deadline}
                    onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                  />
                </div>
              </div>

              {/* Ticket Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ticket_price">Ticket Price</Label>
                  <Input
                    id="ticket_price"
                    type="number"
                    step={0.01}
                    placeholder="Free"
                    value={formData.ticket_price}
                    onChange={(e) => setFormData({ ...formData, ticket_price: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    options={[
                      { value: "USD", label: "USD" },
                      { value: "EUR", label: "EUR" },
                      { value: "GBP", label: "GBP" },
                      { value: "AED", label: "AED" },
                    ]}
                    value={formData.currency}
                    onChange={(value) => setFormData({ ...formData, currency: value })}
                    placeholder="Select currency"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Public Event</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_public: !formData.is_public })}
                    className={`relative h-5 w-9 rounded-full transition-colors ${
                      formData.is_public ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        formData.is_public ? "translate-x-4" : ""
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Registration Required</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, registration_required: !formData.registration_required })}
                    className={`relative h-5 w-9 rounded-full transition-colors ${
                      formData.registration_required ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        formData.registration_required ? "translate-x-4" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  type="text"
                  placeholder="conference, tech, networking"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Internal Notes</Label>
                <TextArea
                  placeholder="Add internal notes..."
                  value={formData.notes}
                  onChange={(value) => setFormData({ ...formData, notes: value })}
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === "contact" && (
            <div className="space-y-4">
              {/* Client */}
              <div>
                <Label htmlFor="client_id">Client</Label>
                <Select
                  options={[
                    { value: "", label: "No client" },
                    ...clients.map((c) => ({
                      value: c.id,
                      label: c.company || c.name,
                    })),
                  ]}
                  value={formData.client_id}
                  onChange={(value) => setFormData({ ...formData, client_id: value })}
                  placeholder="Select client"
                />
              </div>

              {/* Assigned To */}
              <div>
                <Label htmlFor="assigned_to">Event Organizer</Label>
                <Select
                  options={[
                    { value: "", label: "Unassigned" },
                    ...profiles.map((p) => ({
                      value: p.id,
                      label: `${p.first_name} ${p.last_name}`,
                    })),
                  ]}
                  value={formData.assigned_to}
                  onChange={(value) => setFormData({ ...formData, assigned_to: value })}
                  placeholder="Select organizer"
                />
              </div>

              {/* Contact Info */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-800 dark:text-white mb-4">
                  Event Contact Information
                </h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="contact_name">Contact Name</Label>
                    <Input
                      id="contact_name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact_email">Contact Email</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_phone">Contact Phone</Label>
                      <Input
                        id="contact_phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? "Saving..." : event ? "Update Event" : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddEventModal;
