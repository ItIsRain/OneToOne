"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { toast } from "sonner";

interface Vendor {
  id: string;
  name: string;
}

interface Event {
  id: string;
  name: string;
}

interface AssignVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  vendorId?: string;
  eventId?: string;
}

const initialFormData = {
  vendor_id: "",
  event_id: "",
  role: "",
  agreed_rate: "",
  notes: "",
};

export const AssignVendorModal: React.FC<AssignVendorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  vendorId,
  eventId,
}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setFormData({
      vendor_id: vendorId || "",
      event_id: eventId || "",
      role: "",
      agreed_rate: "",
      notes: "",
    });
    setError("");

    // Fetch vendors if not pre-selected
    if (!vendorId) {
      fetch("/api/vendors")
        .then(res => res.json())
        .then(data => {
          if (data.vendors) {
            setVendors(data.vendors);
          }
        })
        .catch(() => {});
    }

    // Fetch events if not pre-selected
    if (!eventId) {
      fetch("/api/events")
        .then(res => res.json())
        .then(data => {
          if (data.events) {
            setEvents(data.events);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, vendorId, eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedVendorId = vendorId || formData.vendor_id;
    const selectedEventId = eventId || formData.event_id;

    if (!selectedVendorId) {
      setError("Please select a vendor");
      return;
    }

    if (!selectedEventId) {
      setError("Please select an event");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/vendors/${selectedVendorId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: selectedEventId,
          role: formData.role || null,
          agreed_rate: formData.agreed_rate ? parseFloat(formData.agreed_rate) : null,
          notes: formData.notes || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to assign vendor");
        return;
      }

      onSave();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign vendor");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Assign Vendor to Event
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Link a vendor to an event with role and rate details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {!vendorId && (
          <div>
            <Label htmlFor="assign-vendor">Vendor *</Label>
            <select
              id="assign-vendor"
              value={formData.vendor_id}
              onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="">Select vendor</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {!eventId && (
          <div>
            <Label htmlFor="assign-event">Event *</Label>
            <select
              id="assign-event"
              value={formData.event_id}
              onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="">Select event</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <Label htmlFor="assign-role">Role</Label>
          <Input
            id="assign-role"
            type="text"
            placeholder="e.g., Photographer, Caterer"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="assign-rate">Agreed Rate ($)</Label>
          <Input
            id="assign-rate"
            type="number"
            placeholder="0"
            value={formData.agreed_rate}
            onChange={(e) => setFormData({ ...formData, agreed_rate: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="assign-notes">Notes</Label>
          <textarea
            id="assign-notes"
            placeholder="Additional notes about this assignment..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
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
            {isSaving ? "Assigning..." : "Assign Vendor"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
