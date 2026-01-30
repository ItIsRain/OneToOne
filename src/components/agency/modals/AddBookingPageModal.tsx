"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import type { BookingPage } from "../BookingPagesTable";

interface AddBookingPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookingPage: BookingPage) => void;
  bookingPage?: BookingPage | null;
}

const initialFormData = {
  name: "",
  slug: "",
  description: "",
  duration_minutes: "30",
  buffer_before: "0",
  buffer_after: "0",
  location_type: "video",
  location_details: "",
  min_notice_hours: "1",
  max_advance_days: "60",
  color: "#3B82F6",
  is_active: true,
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const durationOptions = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "60 minutes" },
  { value: "90", label: "90 minutes" },
  { value: "120", label: "120 minutes" },
];

const locationOptions = [
  { value: "video", label: "Video Call" },
  { value: "phone", label: "Phone Call" },
  { value: "in_person", label: "In Person" },
  { value: "custom", label: "Custom" },
];

export const AddBookingPageModal: React.FC<AddBookingPageModalProps> = ({
  isOpen,
  onClose,
  onSave,
  bookingPage,
}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    if (bookingPage) {
      setFormData({
        name: bookingPage.name || "",
        slug: bookingPage.slug || "",
        description: bookingPage.description || "",
        duration_minutes: bookingPage.duration_minutes?.toString() || "30",
        buffer_before: bookingPage.buffer_before?.toString() || "0",
        buffer_after: bookingPage.buffer_after?.toString() || "0",
        location_type: bookingPage.location_type || "video",
        location_details: bookingPage.location_details || "",
        min_notice_hours: bookingPage.min_notice_hours?.toString() || "1",
        max_advance_days: bookingPage.max_advance_days?.toString() || "60",
        color: bookingPage.color || "#3B82F6",
        is_active: bookingPage.is_active ?? true,
      });
      setSlugManuallyEdited(true);
    } else {
      setFormData(initialFormData);
      setSlugManuallyEdited(false);
    }
    setError("");
  }, [bookingPage, isOpen]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: slugManuallyEdited ? prev.slug : generateSlug(name),
    }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true);
    setFormData((prev) => ({
      ...prev,
      slug: generateSlug(e.target.value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.slug.trim()) {
      setError("Slug is required");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const url = bookingPage
        ? `/api/booking-pages/${bookingPage.id}`
        : "/api/booking-pages";
      const method = bookingPage ? "PATCH" : "POST";

      const payload = {
        ...formData,
        duration_minutes: parseInt(formData.duration_minutes),
        buffer_before: parseInt(formData.buffer_before) || 0,
        buffer_after: parseInt(formData.buffer_after) || 0,
        min_notice_hours: parseInt(formData.min_notice_hours) || 1,
        max_advance_days: parseInt(formData.max_advance_days) || 60,
        description: formData.description || null,
        location_details: formData.location_details || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save booking page");
      }

      onSave(data.bookingPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save booking page");
    } finally {
      setIsSaving(false);
    }
  };

  const selectClassName =
    "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {bookingPage ? "Edit Booking Page" : "Add New Booking Page"}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {bookingPage
            ? "Update the booking page details below"
            : "Configure a new booking page for scheduling"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="bp-name">Name *</Label>
            <Input
              id="bp-name"
              type="text"
              placeholder="e.g., 30-Minute Consultation"
              value={formData.name}
              onChange={handleNameChange}
            />
          </div>

          <div>
            <Label htmlFor="bp-slug">Slug *</Label>
            <Input
              id="bp-slug"
              type="text"
              placeholder="30-minute-consultation"
              value={formData.slug}
              onChange={handleSlugChange}
            />
            <p className="mt-1 text-xs text-gray-400">
              URL: /book/{formData.slug || "..."}
            </p>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="bp-description">Description</Label>
            <textarea
              id="bp-description"
              placeholder="Describe what this booking is for..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
          </div>

          <div>
            <Label htmlFor="bp-duration">Duration *</Label>
            <select
              id="bp-duration"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
              className={selectClassName}
            >
              {durationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="bp-location">Location Type</Label>
            <select
              id="bp-location"
              value={formData.location_type}
              onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
              className={selectClassName}
            >
              {locationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="bp-location-details">Location Details</Label>
            <Input
              id="bp-location-details"
              type="text"
              placeholder="e.g., Zoom link, office address, phone number"
              value={formData.location_details}
              onChange={(e) => setFormData({ ...formData, location_details: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="bp-buffer-before">Buffer Before (minutes)</Label>
            <Input
              id="bp-buffer-before"
              type="number"
              placeholder="0"
              value={formData.buffer_before}
              onChange={(e) => setFormData({ ...formData, buffer_before: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="bp-buffer-after">Buffer After (minutes)</Label>
            <Input
              id="bp-buffer-after"
              type="number"
              placeholder="0"
              value={formData.buffer_after}
              onChange={(e) => setFormData({ ...formData, buffer_after: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="bp-notice">Min Notice (hours)</Label>
            <Input
              id="bp-notice"
              type="number"
              placeholder="1"
              value={formData.min_notice_hours}
              onChange={(e) => setFormData({ ...formData, min_notice_hours: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="bp-advance">Max Advance (days)</Label>
            <Input
              id="bp-advance"
              type="number"
              placeholder="60"
              value={formData.max_advance_days}
              onChange={(e) => setFormData({ ...formData, max_advance_days: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="bp-color">Color</Label>
            <div className="flex items-center gap-3">
              <input
                id="bp-color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-11 w-14 cursor-pointer rounded-lg border border-gray-300 p-1 dark:border-gray-700"
              />
              <Input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#3B82F6"
              />
            </div>
          </div>

          <div className="flex items-end pb-1">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-5 w-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900"
              />
              <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                Active
              </span>
            </label>
          </div>
        </div>

        {error && (
          <p className="text-sm text-error-500">{error}</p>
        )}

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
            disabled={isSaving}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
          >
            {isSaving
              ? "Saving..."
              : bookingPage
              ? "Update Booking Page"
              : "Create Booking Page"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
