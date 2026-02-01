"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { isValidPhoneNumber } from "libphonenumber-js";
import { GetCountries } from "react-country-state-city";
import type { Lead } from "../LeadsTable";
import { AIFieldButton } from "@/components/ai/AIFieldButton";

type Country = {
  id: number;
  name: string;
  iso2: string;
  iso3: string;
  phone_code: string;
};

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Lead) => void;
  lead?: Lead | null;
}

const initialFormData = {
  // Contact Information
  name: "",
  email: "",
  phone: "",
  company: "",
  job_title: "",
  website: "",
  address: "",
  city: "",
  country: "",
  // Sales Pipeline
  status: "new",
  estimated_value: "",
  probability: "0",
  priority: "medium",
  score: "0",
  // Source & Attribution
  source: "",
  campaign: "",
  referral_source: "",
  // Industry & Company Info
  industry: "",
  company_size: "",
  budget_range: "",
  // Timeline
  next_follow_up: "",
  expected_close_date: "",
  // Notes & Requirements
  notes: "",
  requirements: "",
  pain_points: "",
  competitor_info: "",
  // Categorization
  tags: "",
  services_interested: "",
};

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  lead,
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
    if (lead) {
      setFormData({
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        company: lead.company || "",
        job_title: lead.job_title || "",
        website: lead.website || "",
        address: lead.address || "",
        city: lead.city || "",
        country: lead.country || "",
        status: lead.status || "new",
        estimated_value: lead.estimated_value?.toString() || "",
        probability: lead.probability?.toString() || "0",
        priority: lead.priority || "medium",
        score: lead.score?.toString() || "0",
        source: lead.source || "",
        campaign: lead.campaign || "",
        referral_source: lead.referral_source || "",
        industry: lead.industry || "",
        company_size: lead.company_size || "",
        budget_range: lead.budget_range || "",
        next_follow_up: lead.next_follow_up ? lead.next_follow_up.slice(0, 16) : "",
        expected_close_date: lead.expected_close_date || "",
        notes: lead.notes || "",
        requirements: lead.requirements || "",
        pain_points: lead.pain_points || "",
        competitor_info: lead.competitor_info || "",
        tags: lead.tags?.join(", ") || "",
        services_interested: lead.services_interested?.join(", ") || "",
      });
      // Show optional fields if any are filled
      if (lead.website || lead.address || lead.city || lead.country || lead.industry ||
          lead.job_title || lead.campaign || lead.referral_source || lead.company_size ||
          lead.budget_range || lead.requirements || lead.pain_points || lead.competitor_info ||
          lead.tags?.length || lead.services_interested?.length) {
        setShowOptionalFields(true);
      }
    } else {
      setFormData(initialFormData);
      setShowOptionalFields(false);
    }
    setError("");
    setPhoneError("");
  }, [lead, isOpen]);

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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    setFormData({ ...formData, phone });
    if (phone) {
      validatePhone(phone);
    } else {
      setPhoneError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const url = lead ? `/api/leads/${lead.id}` : "/api/leads";
      const method = lead ? "PATCH" : "POST";

      const payload = {
        ...formData,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : 0,
        probability: formData.probability ? parseInt(formData.probability) : 0,
        score: formData.score ? parseInt(formData.score) : 0,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(Boolean) : null,
        services_interested: formData.services_interested ? formData.services_interested.split(",").map(s => s.trim()).filter(Boolean) : null,
        next_follow_up: formData.next_follow_up || null,
        expected_close_date: formData.expected_close_date || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save lead");
        return;
      }

      onSave(data.lead);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save lead");
    } finally {
      setIsSaving(false);
    }
  };

  const statusOptions = [
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "proposal", label: "Proposal" },
    { value: "negotiation", label: "Negotiation" },
    { value: "won", label: "Won" },
    { value: "lost", label: "Lost" },
  ];

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  const sourceOptions = [
    { value: "website", label: "Website" },
    { value: "referral", label: "Referral" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "conference", label: "Conference" },
    { value: "cold_email", label: "Cold Email" },
    { value: "cold_call", label: "Cold Call" },
    { value: "social_media", label: "Social Media" },
    { value: "advertisement", label: "Advertisement" },
    { value: "partner", label: "Partner" },
    { value: "other", label: "Other" },
  ];

  const industryOptions = [
    { value: "technology", label: "Technology" },
    { value: "healthcare", label: "Healthcare" },
    { value: "finance", label: "Finance" },
    { value: "retail", label: "Retail" },
    { value: "manufacturing", label: "Manufacturing" },
    { value: "real_estate", label: "Real Estate" },
    { value: "hospitality", label: "Hospitality" },
    { value: "education", label: "Education" },
    { value: "entertainment", label: "Entertainment" },
    { value: "gaming", label: "Gaming" },
    { value: "media", label: "Media" },
    { value: "non_profit", label: "Non-Profit" },
    { value: "government", label: "Government" },
    { value: "other", label: "Other" },
  ];

  const companySizeOptions = [
    { value: "1-10", label: "1-10 employees" },
    { value: "11-50", label: "11-50 employees" },
    { value: "51-200", label: "51-200 employees" },
    { value: "201-500", label: "201-500 employees" },
    { value: "501-1000", label: "501-1000 employees" },
    { value: "1000+", label: "1000+ employees" },
  ];

  const selectClassName = "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl p-6 lg:p-8">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {lead ? "Edit Lead" : "Add New Lead"}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {lead ? "Update the lead details below" : "Enter the lead details below"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">
        {/* Required Fields */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter lead name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="lead@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
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
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="text"
              placeholder="+971501234567"
              value={formData.phone}
              onChange={handlePhoneChange}
              error={!!phoneError}
            />
            {phoneError && (
              <p className="mt-1 text-xs text-error-500">{phoneError}</p>
            )}
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
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className={selectClassName}
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="source">Lead Source</Label>
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

          <div>
            <Label htmlFor="estimated_value">Estimated Value ($)</Label>
            <Input
              id="estimated_value"
              type="number"
              placeholder="10000"
              value={formData.estimated_value}
              onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="probability">Probability (%)</Label>
            <Input
              id="probability"
              type="number"
              min="0"
              max="100"
              placeholder="50"
              value={formData.probability}
              onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
            />
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
        </div>

        {/* Notes field - visible by default */}
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notes">Notes</Label>
            <AIFieldButton
              module="leads"
              field="notes"
              currentValue={formData.notes}
              context={{ name: formData.name, company: formData.company, source: formData.source, status: formData.status, estimated_value: formData.estimated_value }}
              onGenerate={(value) => setFormData({ ...formData, notes: value })}
            />
          </div>
          <textarea
            id="notes"
            placeholder="Additional notes about this lead..."
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
            {/* Contact Details */}
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-4">Contact Details</h4>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="job_title">Job Title</Label>
                <Input
                  id="job_title"
                  type="text"
                  placeholder="CEO, Marketing Manager, etc."
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="text"
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
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
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="City name"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

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
            </div>

            {/* Company Information */}
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-4">Company Information</h4>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="industry">Industry</Label>
                <select
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className={selectClassName}
                >
                  <option value="">Select industry</option>
                  {industryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="company_size">Company Size</Label>
                <select
                  id="company_size"
                  value={formData.company_size}
                  onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                  className={selectClassName}
                >
                  <option value="">Select size</option>
                  {companySizeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="budget_range">Budget Range</Label>
                <Input
                  id="budget_range"
                  type="text"
                  placeholder="$10,000 - $50,000"
                  value={formData.budget_range}
                  onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="expected_close_date">Expected Close Date</Label>
                <Input
                  id="expected_close_date"
                  type="date"
                  value={formData.expected_close_date}
                  onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                />
              </div>
            </div>

            {/* Source & Attribution */}
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-4">Source & Attribution</h4>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="campaign">Campaign</Label>
                <Input
                  id="campaign"
                  type="text"
                  placeholder="Marketing campaign name"
                  value={formData.campaign}
                  onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="referral_source">Referral Source</Label>
                <Input
                  id="referral_source"
                  type="text"
                  placeholder="Who referred them"
                  value={formData.referral_source}
                  onChange={(e) => setFormData({ ...formData, referral_source: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="score">Lead Score</Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  placeholder="0-100"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                />
              </div>
            </div>

            {/* Requirements & Pain Points */}
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-4">Requirements & Insights</h4>
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="requirements">Requirements</Label>
                  <AIFieldButton
                    module="leads"
                    field="requirements"
                    currentValue={formData.requirements}
                    context={{ name: formData.name, company: formData.company, industry: formData.industry, budget_range: formData.budget_range }}
                    onGenerate={(value) => setFormData({ ...formData, requirements: value })}
                  />
                </div>
                <textarea
                  id="requirements"
                  placeholder="What are they looking for?"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pain_points">Pain Points</Label>
                  <AIFieldButton
                    module="leads"
                    field="pain_points"
                    currentValue={formData.pain_points}
                    context={{ name: formData.name, company: formData.company, industry: formData.industry, requirements: formData.requirements }}
                    onGenerate={(value) => setFormData({ ...formData, pain_points: value })}
                  />
                </div>
                <textarea
                  id="pain_points"
                  placeholder="What challenges are they facing?"
                  value={formData.pain_points}
                  onChange={(e) => setFormData({ ...formData, pain_points: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              <div>
                <Label htmlFor="competitor_info">Competitor Information</Label>
                <textarea
                  id="competitor_info"
                  placeholder="Any competitors they are considering?"
                  value={formData.competitor_info}
                  onChange={(e) => setFormData({ ...formData, competitor_info: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
            </div>

            {/* Tags & Services */}
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-4">Categorization</h4>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  type="text"
                  placeholder="hot, enterprise, q1-target (comma-separated)"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="services_interested">Services Interested</Label>
                <Input
                  id="services_interested"
                  type="text"
                  placeholder="Web Dev, Marketing (comma-separated)"
                  value={formData.services_interested}
                  onChange={(e) => setFormData({ ...formData, services_interested: e.target.value })}
                />
              </div>
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
            {isSaving ? "Saving..." : lead ? "Update Lead" : "Add Lead"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
