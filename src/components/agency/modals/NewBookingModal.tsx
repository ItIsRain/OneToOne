"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewBookingModal: React.FC<NewBookingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    event: "",
    venue: "",
    client: "",
    date: "",
    startTime: "",
    endTime: "",
    attendees: "",
    setupTime: "",
    notes: "",
  });

  const venueOptions = [
    { value: "grand-ballroom", label: "Grand Ballroom - $500/hr" },
    { value: "sky-lounge", label: "Sky Lounge - $350/hr" },
    { value: "garden-terrace", label: "Garden Terrace - $400/hr" },
    { value: "tech-hub", label: "Tech Hub Arena - $800/hr" },
    { value: "waterfront", label: "Waterfront Pavilion - $450/hr" },
    { value: "art-gallery", label: "Art Gallery Space - $300/hr" },
  ];

  const clientOptions = [
    { value: "acme", label: "Acme Corporation" },
    { value: "techstart", label: "TechStart Inc." },
    { value: "globaltech", label: "GlobalTech Solutions" },
    { value: "metro", label: "Metro Events" },
    { value: "creative", label: "Creative Co." },
  ];

  const setupTimeOptions = [
    { value: "none", label: "No setup time needed" },
    { value: "30min", label: "30 minutes before" },
    { value: "1hr", label: "1 hour before" },
    { value: "2hr", label: "2 hours before" },
    { value: "half-day", label: "Half day before" },
    { value: "full-day", label: "Full day before" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Booking data:", formData);
    onClose();
  };

  // Calculate estimated cost based on venue and time
  const calculateEstimate = () => {
    if (!formData.venue || !formData.startTime || !formData.endTime) return null;

    const priceMap: Record<string, number> = {
      "grand-ballroom": 500,
      "sky-lounge": 350,
      "garden-terrace": 400,
      "tech-hub": 800,
      "waterfront": 450,
      "art-gallery": 300,
    };

    const rate = priceMap[formData.venue];
    if (!rate) return null;

    const start = new Date(`2000-01-01T${formData.startTime}`);
    const end = new Date(`2000-01-01T${formData.endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (hours <= 0) return null;
    return (hours * rate).toLocaleString("en-US", { style: "currency", currency: "USD" });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          New Booking
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Reserve a venue for your event
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="event">Event Name</Label>
          <Input
            id="event"
            type="text"
            placeholder="Product Launch, Annual Gala, etc."
            onChange={(e) => setFormData({ ...formData, event: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="venue">Venue</Label>
            <Select
              options={venueOptions}
              placeholder="Select venue"
              onChange={(value) => setFormData({ ...formData, venue: value })}
            />
          </div>
          <div>
            <Label htmlFor="client">Client</Label>
            <Select
              options={clientOptions}
              placeholder="Select client"
              onChange={(value) => setFormData({ ...formData, client: value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="date">Event Date</Label>
          <Input
            id="date"
            type="date"
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
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

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="attendees">Expected Attendees</Label>
            <Input
              id="attendees"
              type="number"
              placeholder="100"
              onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="setupTime">Setup Time Needed</Label>
            <Select
              options={setupTimeOptions}
              placeholder="Select setup time"
              onChange={(value) => setFormData({ ...formData, setupTime: value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Special Requests / Notes</Label>
          <TextArea
            placeholder="Any special requirements or requests..."
            onChange={(value) => setFormData({ ...formData, notes: value })}
            rows={2}
          />
        </div>

        {calculateEstimate() && (
          <div className="rounded-lg bg-brand-50 dark:bg-brand-500/10 p-4 border border-brand-200 dark:border-brand-500/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Estimated Cost:</span>
              <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
                {calculateEstimate()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Based on hourly rate. Final cost may vary based on setup time and additional services.
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4">
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
            Create Booking
          </button>
        </div>
      </form>
    </Modal>
  );
};
