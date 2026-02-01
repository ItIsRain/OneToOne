"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { isValidPhoneNumber } from "libphonenumber-js";
import { GetCountries } from "react-country-state-city";
import type { Contact } from "../ContactsTable";

type Country = {
  id: number;
  name: string;
  iso2: string;
  iso3: string;
  phone_code: string;
};

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (contact: Contact) => void;
  contact?: Contact | null;
}

const initialFormData = {
  // Personal Info
  first_name: "",
  last_name: "",
  email: "",
  secondary_email: "",
  phone: "",
  mobile_phone: "",
  work_phone: "",
  // Professional Info
  job_title: "",
  department: "",
  company: "",
  linkedin_url: "",
  twitter_handle: "",
  // Relationships
  client_id: "",
  lead_id: "",
  is_primary_contact: false,
  // Location
  address: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
  timezone: "",
  // Communication
  preferred_contact_method: "",
  do_not_contact: false,
  email_opt_in: true,
  communication_notes: "",
  // Engagement
  status: "active",
  next_follow_up: "",
  contact_frequency: "",
  // Personal
  birthday: "",
  anniversary: "",
  personal_notes: "",
  // Categorization
  contact_type: "other",
  tags: "",
  source: "",
  // Notes
  notes: "",
};

export const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
  onSave,
  contact,
}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  useEffect(() => {
    GetCountries().then((result: Country[]) => {
      setCountries(result);
    });
  }, []);

  useEffect(() => {
    if (contact) {
      setFormData({
        first_name: contact.first_name || "",
        last_name: contact.last_name || "",
        email: contact.email || "",
        secondary_email: contact.secondary_email || "",
        phone: contact.phone || "",
        mobile_phone: contact.mobile_phone || "",
        work_phone: contact.work_phone || "",
        job_title: contact.job_title || "",
        department: contact.department || "",
        company: contact.company || "",
        linkedin_url: contact.linkedin_url || "",
        twitter_handle: contact.twitter_handle || "",
        client_id: contact.client_id || "",
        lead_id: contact.lead_id || "",
        is_primary_contact: contact.is_primary_contact || false,
        address: contact.address || "",
        city: contact.city || "",
        state: contact.state || "",
        postal_code: contact.postal_code || "",
        country: contact.country || "",
        timezone: contact.timezone || "",
        preferred_contact_method: contact.preferred_contact_method || "",
        do_not_contact: contact.do_not_contact || false,
        email_opt_in: contact.email_opt_in !== false,
        communication_notes: contact.communication_notes || "",
        status: contact.status || "active",
        next_follow_up: contact.next_follow_up ? contact.next_follow_up.slice(0, 16) : "",
        contact_frequency: contact.contact_frequency || "",
        birthday: contact.birthday || "",
        anniversary: contact.anniversary || "",
        personal_notes: contact.personal_notes || "",
        contact_type: contact.contact_type || "other",
        tags: contact.tags?.join(", ") || "",
        source: contact.source || "",
        notes: contact.notes || "",
      });
      // Show optional fields if any are filled
      if (contact.secondary_email || contact.mobile_phone || contact.work_phone ||
          contact.department || contact.linkedin_url || contact.twitter_handle ||
          contact.address || contact.city || contact.state || contact.postal_code ||
          contact.timezone || contact.preferred_contact_method || contact.communication_notes ||
          contact.contact_frequency || contact.birthday || contact.anniversary ||
          contact.personal_notes || contact.tags?.length) {
        setShowOptionalFields(true);
      }
    } else {
      setFormData(initialFormData);
      setShowOptionalFields(false);
    }
    setError("");
    setPhoneError("");
  }, [contact, isOpen]);

  const validatePhone = (phone: string): boolean => {
    if (!phone) {
      setPhoneError("");
      return true;
    }

    if (!isValidPhoneNumber(phone)) {
      setPhoneError("Please enter a valid phone number with country code (e.g., +971501234567)");
      return false;
    }

    setPhoneError("");
    return true;
  };

  const handlePhoneChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    setFormData({ ...formData, [field]: phone });
    if (phone && field === "phone") {
      validatePhone(phone);
    } else if (!phone) {
      setPhoneError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError("First name and last name are required");
      return;
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const url = contact ? `/api/contacts/${contact.id}` : "/api/contacts";
      const method = contact ? "PATCH" : "POST";

      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(Boolean) : null,
        next_follow_up: formData.next_follow_up || null,
        birthday: formData.birthday || null,
        anniversary: formData.anniversary || null,
        client_id: formData.client_id || null,
        lead_id: formData.lead_id || null,
        preferred_contact_method: formData.preferred_contact_method || null,
        contact_frequency: formData.contact_frequency || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save contact");
        return;
      }

      if (onSave) {
        onSave(data.contact);
      } else {
        onClose();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save contact");
    } finally {
      setIsSaving(false);
    }
  };

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "do_not_contact", label: "Do Not Contact" },
  ];

  const contactTypeOptions = [
    { value: "client_contact", label: "Client Contact" },
    { value: "lead_contact", label: "Lead Contact" },
    { value: "vendor", label: "Vendor" },
    { value: "partner", label: "Partner" },
    { value: "influencer", label: "Influencer" },
    { value: "media", label: "Media" },
    { value: "other", label: "Other" },
  ];

  const contactMethodOptions = [
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "whatsapp", label: "WhatsApp" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "sms", label: "SMS" },
  ];

  const frequencyOptions = [
    { value: "weekly", label: "Weekly" },
    { value: "biweekly", label: "Bi-weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "as_needed", label: "As Needed" },
  ];

  const sourceOptions = [
    { value: "referral", label: "Referral" },
    { value: "website", label: "Website" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "conference", label: "Conference" },
    { value: "cold_outreach", label: "Cold Outreach" },
    { value: "existing_client", label: "Existing Client" },
    { value: "other", label: "Other" },
  ];

  const selectClassName = "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {contact ? "Edit Contact" : "Add New Contact"}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {contact ? "Update the contact details below" : "Add a new contact to your address book"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">
        {/* Required Fields */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              id="first_name"
              type="text"
              placeholder="John"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="last_name">Last Name *</Label>
            <Input
              id="last_name"
              type="text"
              placeholder="Doe"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="text"
              placeholder="+971501234567"
              value={formData.phone}
              onChange={handlePhoneChange("phone")}
              error={!!phoneError}
            />
            {phoneError && (
              <p className="mt-1 text-xs text-error-500">{phoneError}</p>
            )}
          </div>

          <div>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              type="text"
              placeholder="Company name"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="job_title">Job Title</Label>
            <Input
              id="job_title"
              type="text"
              placeholder="CEO, Manager, etc."
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="contact_type">Contact Type</Label>
            <select
              id="contact_type"
              value={formData.contact_type}
              onChange={(e) => setFormData({ ...formData, contact_type: e.target.value })}
              className={selectClassName}
            >
              {contactTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className={selectClassName}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="source">Source</Label>
            <select
              id="source"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className={selectClassName}
            >
              <option value="">Select source</option>
              {sourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              id="is_primary_contact"
              type="checkbox"
              checked={formData.is_primary_contact}
              onChange={(e) => setFormData({ ...formData, is_primary_contact: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <Label htmlFor="is_primary_contact" className="mb-0">Primary Contact</Label>
          </div>
        </div>

        {/* Notes field - visible by default */}
        <div>
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            placeholder="Additional notes about this contact..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
        </div>

        {/* Toggle Optional Fields */}
        <button
          type="button"
          onClick={() => setShowOptionalFields(!showOptionalFields)}
          className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showOptionalFields ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {showOptionalFields ? "Hide" : "Show"} additional fields
        </button>

        {/* Optional Fields */}
        {showOptionalFields && (
          <div className="space-y-5 pt-2 border-t border-gray-200 dark:border-gray-700">
            {/* Additional Contact Info */}
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-4">Additional Contact Info</h4>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="secondary_email">Secondary Email</Label>
                <Input
                  id="secondary_email"
                  type="email"
                  placeholder="alternate@email.com"
                  value={formData.secondary_email}
                  onChange={(e) => setFormData({ ...formData, secondary_email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="mobile_phone">Mobile Phone</Label>
                <Input
                  id="mobile_phone"
                  type="text"
                  placeholder="+971501234567"
                  value={formData.mobile_phone}
                  onChange={handlePhoneChange("mobile_phone")}
                />
              </div>

              <div>
                <Label htmlFor="work_phone">Work Phone</Label>
                <Input
                  id="work_phone"
                  type="text"
                  placeholder="+97142345678"
                  value={formData.work_phone}
                  onChange={handlePhoneChange("work_phone")}
                />
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  type="text"
                  placeholder="Marketing, Sales, etc."
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <Input
                  id="linkedin_url"
                  type="text"
                  placeholder="https://linkedin.com/in/username"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="twitter_handle">Twitter Handle</Label>
                <Input
                  id="twitter_handle"
                  type="text"
                  placeholder="@username"
                  value={formData.twitter_handle}
                  onChange={(e) => setFormData({ ...formData, twitter_handle: e.target.value })}
                />
              </div>
            </div>

            {/* Location */}
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-4">Location</h4>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Street address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="City name"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  type="text"
                  placeholder="State or province"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  type="text"
                  placeholder="12345"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <select
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className={selectClassName}
                >
                  <option value="">Select country</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  type="text"
                  placeholder="UTC+4, EST, etc."
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                />
              </div>
            </div>

            {/* Communication Preferences */}
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-4">Communication Preferences</h4>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="preferred_contact_method">Preferred Contact Method</Label>
                <select
                  id="preferred_contact_method"
                  value={formData.preferred_contact_method}
                  onChange={(e) => setFormData({ ...formData, preferred_contact_method: e.target.value })}
                  className={selectClassName}
                >
                  <option value="">Select method</option>
                  {contactMethodOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="contact_frequency">Contact Frequency</Label>
                <select
                  id="contact_frequency"
                  value={formData.contact_frequency}
                  onChange={(e) => setFormData({ ...formData, contact_frequency: e.target.value })}
                  className={selectClassName}
                >
                  <option value="">Select frequency</option>
                  {frequencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="next_follow_up">Next Follow-up</Label>
                <Input
                  id="next_follow_up"
                  type="datetime-local"
                  value={formData.next_follow_up}
                  onChange={(e) => setFormData({ ...formData, next_follow_up: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-4 pt-6">
                <div className="flex items-center gap-2">
                  <input
                    id="email_opt_in"
                    type="checkbox"
                    checked={formData.email_opt_in}
                    onChange={(e) => setFormData({ ...formData, email_opt_in: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <Label htmlFor="email_opt_in" className="mb-0">Email Opt-in</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="do_not_contact"
                    type="checkbox"
                    checked={formData.do_not_contact}
                    onChange={(e) => setFormData({ ...formData, do_not_contact: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-error-500 focus:ring-error-500"
                  />
                  <Label htmlFor="do_not_contact" className="mb-0 text-error-500">Do Not Contact</Label>
                </div>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="communication_notes">Communication Notes</Label>
                <textarea
                  id="communication_notes"
                  placeholder="Special instructions for contacting this person..."
                  value={formData.communication_notes}
                  onChange={(e) => setFormData({ ...formData, communication_notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
            </div>

            {/* Personal Details */}
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-4">Personal Details</h4>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="birthday">Birthday</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="anniversary">Anniversary</Label>
                <Input
                  id="anniversary"
                  type="date"
                  value={formData.anniversary}
                  onChange={(e) => setFormData({ ...formData, anniversary: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="personal_notes">Personal Notes</Label>
                <textarea
                  id="personal_notes"
                  placeholder="Personal interests, hobbies, family info..."
                  value={formData.personal_notes}
                  onChange={(e) => setFormData({ ...formData, personal_notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
            </div>

            {/* Tags */}
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-4">Categorization</h4>
            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                type="text"
                placeholder="vip, decision-maker, technical (comma-separated)"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>
        )}

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
            {isSaving ? "Saving..." : contact ? "Update Contact" : "Add Contact"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
