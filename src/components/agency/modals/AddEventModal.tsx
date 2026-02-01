"use client";
import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import { DynamicField } from "@/components/form/DynamicField";
import { eventTypeConfigs, getEventTypeConfig } from "@/config/eventTypeSchema";
import type { FormField } from "@/config/eventTypeSchema";
import CoverImageUpload from "@/components/events/CoverImageUpload";
import { AIFieldButton } from "@/components/ai/AIFieldButton";

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
  cover_image?: string | null;
  is_virtual?: boolean;
  virtual_platform?: string | null;
  virtual_link?: string | null;
  max_attendees?: number | null;
  is_public?: boolean;
  is_published?: boolean;
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
  requirements?: Record<string, unknown> | null;
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

// Event type options from schema
const eventTypeOptions = Object.entries(eventTypeConfigs).map(([key, config]) => ({
  value: key,
  label: `${config.icon} ${config.label}`,
}));

const categoryOptions = [
  { value: "Tech Events", label: "Tech Events" },
  { value: "Business Events", label: "Business Events" },
  { value: "Creative Events", label: "Creative Events" },
  { value: "Networking & Social", label: "Networking & Social" },
  { value: "Education", label: "Education" },
  { value: "General", label: "General" },
];

const platformOptions = [
  { value: "zoom", label: "Zoom" },
  { value: "teams", label: "Microsoft Teams" },
  { value: "google_meet", label: "Google Meet" },
  { value: "discord", label: "Discord" },
  { value: "youtube", label: "YouTube Live" },
  { value: "custom", label: "Custom Platform" },
];

const statusOptions = [
  { value: "upcoming", label: "Upcoming" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
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
  const [activeTab, setActiveTab] = useState<string>("basic");

  // Base form data (shared fields)
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
    color: "#6b7280",
    cover_image: "" as string | null,
    is_virtual: false,
    virtual_platform: "",
    virtual_link: "",
    location: "",
    max_attendees: "",
    is_public: false,
    is_published: false,
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

  // Type-specific fields stored in requirements
  const [typeSpecificData, setTypeSpecificData] = useState<Record<string, unknown>>({});

  // Get current event type config
  const eventTypeConfig = useMemo(() => {
    return getEventTypeConfig(formData.event_type) || eventTypeConfigs.general;
  }, [formData.event_type]);

  // Generate tabs based on event type
  const tabs = useMemo(() => {
    const baseTabs = [
      { id: "basic", label: "Event Info", icon: "📋" },
      { id: "location", label: "Location", icon: "📍" },
    ];

    // Add type-specific tabs
    if (eventTypeConfig.tabs && eventTypeConfig.tabs.length > 0) {
      const specificTabs = eventTypeConfig.tabs.map(tab => ({
        id: tab.id,
        label: tab.label,
        icon: tab.icon || "📄",
      }));
      baseTabs.push(...specificTabs);
    }

    baseTabs.push(
      { id: "settings", label: "Settings", icon: "⚙️" },
      { id: "contact", label: "Contact", icon: "👤" }
    );

    return baseTabs;
  }, [eventTypeConfig]);

  // Group type-specific fields by tab
  const fieldsByTab = useMemo(() => {
    const grouped: Record<string, FormField[]> = {};
    if (eventTypeConfig.fields) {
      eventTypeConfig.fields.forEach(field => {
        const tabId = field.group || "details";
        if (!grouped[tabId]) grouped[tabId] = [];
        grouped[tabId].push(field);
      });
    }
    return grouped;
  }, [eventTypeConfig]);

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
          color: event.color || "#6b7280",
          cover_image: event.cover_image || null,
          is_virtual: event.is_virtual || false,
          virtual_platform: event.virtual_platform || "",
          virtual_link: event.virtual_link || "",
          location: event.location || "",
          max_attendees: event.max_attendees?.toString() || "",
          is_public: event.is_public || false,
          is_published: event.is_published || false,
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
        setTypeSpecificData(event.requirements || {});
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
          color: "#6b7280",
          cover_image: null,
          is_virtual: false,
          virtual_platform: "",
          virtual_link: "",
          location: "",
          max_attendees: "",
          is_public: false,
          is_published: false,
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
        setTypeSpecificData({});
      }
      setActiveTab("basic");
    }
  }, [isOpen, event]);

  // When event type changes, set the color from config
  useEffect(() => {
    if (eventTypeConfig && !event) {
      setFormData(prev => ({
        ...prev,
        color: eventTypeConfig.color,
      }));
    }
  }, [formData.event_type, eventTypeConfig, event]);

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

  const handleTypeSpecificChange = (fieldId: string, value: unknown) => {
    setTypeSpecificData(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  // Check if a conditional field should be shown
  const shouldShowField = (field: FormField): boolean => {
    if (!field.conditional) return true;
    const { field: condField, value: condValue, operator = "equals" } = field.conditional;
    const actualValue = typeSpecificData[condField] ?? (formData as Record<string, unknown>)[condField];

    switch (operator) {
      case "equals":
        return actualValue === condValue;
      case "notEquals":
        return actualValue !== condValue;
      case "contains":
        return Array.isArray(actualValue) && actualValue.includes(condValue);
      default:
        return actualValue === condValue;
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
          cover_image: formData.cover_image || null,
          is_virtual: formData.is_virtual,
          virtual_platform: formData.is_virtual ? formData.virtual_platform : null,
          virtual_link: formData.is_virtual ? formData.virtual_link : null,
          location: !formData.is_virtual ? formData.location : null,
          max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
          is_public: formData.is_public,
          is_published: formData.is_published,
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
          requirements: Object.keys(typeSpecificData).length > 0 ? typeSpecificData : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to save event");
        return;
      }

      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-6xl">
      <div className="flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-sm"
              style={{ backgroundColor: `${formData.color}20`, color: formData.color }}
            >
              {eventTypeConfig?.icon || "📅"}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {event ? "Edit Event" : "Create Event"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {eventTypeConfig?.description || "Configure your event details"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs - Modern pill style */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-700"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50"
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Basic Info Tab */}
            {activeTab === "basic" && (
              <div className="space-y-6">
                {/* Cover Image */}
                <div>
                  <Label>Cover Image</Label>
                  <CoverImageUpload
                    value={formData.cover_image}
                    onChange={(url) => setFormData({ ...formData, cover_image: url })}
                    eventId={event?.id}
                    eventColor={formData.color}
                  />
                </div>

                {/* Title & Event Type Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="title">Event Title *</Label>
                      <AIFieldButton
                        module="events"
                        field="title"
                        currentValue={formData.title}
                        context={{ event_type: formData.event_type, category: formData.category, date: formData.date, location: formData.location }}
                        onGenerate={(value) => setFormData({ ...formData, title: value })}
                      />
                    </div>
                    <Input
                      id="title"
                      type="text"
                      placeholder="Enter event title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="event_type">Event Type</Label>
                    <Select
                      options={eventTypeOptions}
                      value={formData.event_type}
                      onChange={(value) => setFormData({ ...formData, event_type: value })}
                      placeholder="Select type"
                    />
                  </div>
                </div>

                {/* Date & Time Row */}
                <div className="grid grid-cols-4 gap-4">
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

                {/* Status & Category Row */}
                <div className="grid grid-cols-3 gap-4">
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
                    <Label htmlFor="category">Category</Label>
                    <Select
                      options={categoryOptions}
                      value={formData.category}
                      onChange={(value) => setFormData({ ...formData, category: value })}
                      placeholder="Select category"
                    />
                  </div>
                  <div>
                    <Label>Event Color</Label>
                    <div className="flex gap-2 mt-1">
                      {["#6b7280", "#8b5cf6", "#f97316", "#22c55e", "#ec4899", "#3b82f6", "#ef4444", "#eab308"].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className={`h-8 w-8 rounded-lg transition-all ${
                            formData.color === color ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500" : "hover:scale-110"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">Description</Label>
                    <AIFieldButton
                      module="events"
                      field="description"
                      currentValue={formData.description}
                      context={{ title: formData.title, event_type: formData.event_type, category: formData.category, date: formData.date, location: formData.location, is_virtual: formData.is_virtual }}
                      onGenerate={(value) => setFormData({ ...formData, description: value })}
                    />
                  </div>
                  <TextArea
                    placeholder="Describe your event..."
                    value={formData.description}
                    onChange={(value) => setFormData({ ...formData, description: value })}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Location Tab */}
            {activeTab === "location" && (
              <div className="space-y-6">
                {/* Virtual Toggle Card */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${formData.is_virtual ? "bg-brand-100 dark:bg-brand-900/30" : "bg-gray-200 dark:bg-gray-700"}`}>
                      {formData.is_virtual ? (
                        <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formData.is_virtual ? "Virtual Event" : "In-Person Event"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formData.is_virtual ? "This event will be hosted online" : "This event has a physical location"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_virtual: !formData.is_virtual })}
                    className={`relative h-7 w-12 rounded-full transition-colors ${
                      formData.is_virtual ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        formData.is_virtual ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Location or Virtual Platform */}
                {formData.is_virtual ? (
                  <div className="grid grid-cols-2 gap-4">
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
                        placeholder="https://..."
                        value={formData.virtual_link}
                        onChange={(e) => setFormData({ ...formData, virtual_link: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="location">Venue Address</Label>
                    <Input
                      id="location"
                      type="text"
                      placeholder="Enter venue address"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                )}

                {/* Capacity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max_attendees">Maximum Attendees</Label>
                    <Input
                      id="max_attendees"
                      type="number"
                      placeholder="Unlimited"
                      value={formData.max_attendees}
                      onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                {/* Visibility & Registration - Side by Side Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Visibility */}
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Visibility
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Public Event</span>
                          <p className="text-xs text-gray-500">Visible to anyone with the link</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, is_public: !formData.is_public })}
                          className={`relative h-6 w-10 rounded-full transition-colors ${
                            formData.is_public ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        >
                          <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${formData.is_public ? "translate-x-4" : ""}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Published</span>
                          <p className="text-xs text-gray-500">Event is live and accessible</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, is_published: !formData.is_published })}
                          className={`relative h-6 w-10 rounded-full transition-colors ${
                            formData.is_published ? "bg-success-500" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        >
                          <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${formData.is_published ? "translate-x-4" : ""}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Registration */}
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Registration
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Require Registration</span>
                          <p className="text-xs text-gray-500">Attendees must register</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, registration_required: !formData.registration_required })}
                          className={`relative h-6 w-10 rounded-full transition-colors ${
                            formData.registration_required ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        >
                          <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${formData.registration_required ? "translate-x-4" : ""}`} />
                        </button>
                      </div>
                      {formData.registration_required && (
                        <div>
                          <Label htmlFor="registration_deadline" className="text-xs">Deadline</Label>
                          <Input
                            id="registration_deadline"
                            type="date"
                            value={formData.registration_deadline}
                            onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pricing & Tags */}
                <div className="grid grid-cols-3 gap-4">
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
                        { value: "AED", label: "AED" },
                        { value: "EUR", label: "EUR" },
                        { value: "GBP", label: "GBP" },
                      ]}
                      value={formData.currency}
                      onChange={(value) => setFormData({ ...formData, currency: value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      type="text"
                      placeholder="tech, networking..."
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notes">Internal Notes</Label>
                    <AIFieldButton
                      module="events"
                      field="notes"
                      currentValue={formData.notes}
                      context={{ title: formData.title, description: formData.description, date: formData.date }}
                      onGenerate={(value) => setFormData({ ...formData, notes: value })}
                    />
                  </div>
                  <TextArea
                    placeholder="Add internal notes (not visible to attendees)..."
                    value={formData.notes}
                    onChange={(value) => setFormData({ ...formData, notes: value })}
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === "contact" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                    Event Contact Information
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
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
                        placeholder="+971 50 123 4567"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Type-Specific Tabs */}
            {fieldsByTab[activeTab] && fieldsByTab[activeTab].length > 0 && (
              <div className="space-y-6">
                {/* Tab Header with Description */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800/30 border border-gray-200 dark:border-gray-700">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-sm flex-shrink-0"
                    style={{ backgroundColor: `${eventTypeConfig.color}15`, color: eventTypeConfig.color }}
                  >
                    {eventTypeConfig.tabs?.find(t => t.id === activeTab)?.icon || eventTypeConfig.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {tabs.find(t => t.id === activeTab)?.label || "Details"}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {eventTypeConfig.tabs?.find(t => t.id === activeTab)?.description ||
                       `Configure ${eventTypeConfig.label.toLowerCase()} specific settings`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${eventTypeConfig.color}15`, color: eventTypeConfig.color }}>
                    <span>{eventTypeConfig.icon}</span>
                    <span>{eventTypeConfig.label}</span>
                  </div>
                </div>

                {/* Fields Grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                  {fieldsByTab[activeTab]
                    .filter(shouldShowField)
                    .map((field) => (
                      <div key={field.id} className={field.fullWidth ? "col-span-2" : ""}>
                        <DynamicField
                          field={field}
                          value={typeSpecificData[field.id]}
                          onChange={handleTypeSpecificChange}
                        />
                      </div>
                    ))}
                </div>

                {/* Helpful Tip */}
                {fieldsByTab[activeTab].length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No fields configured for this section yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="flex h-2 w-2 rounded-full" style={{ backgroundColor: formData.color }} />
              <span>{eventTypeConfig.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  event ? "Update Event" : "Create Event"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddEventModal;
