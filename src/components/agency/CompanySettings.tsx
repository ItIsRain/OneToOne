"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { DetailsSidebar, InfoRow, Section } from "@/components/ui/DetailsSidebar";
import { usePlanLimits } from "@/hooks/usePlanLimits";

interface CompanyData {
  id: string;
  name: string;
  subdomain: string | null;
  logo_url: string | null;
  primary_color: string | null;
  description: string | null;
  industry: string | null;
  company_size: string | null;
  founded_year: number | null;
  website: string | null;
  business_email: string | null;
  phone: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_country: string | null;
  address_postal_code: string | null;
  tax_id: string | null;
  registration_number: string | null;
  currency: string | null;
  timezone: string | null;
  date_format: string | null;
  fiscal_year_start: number | null;
  social_linkedin: string | null;
  social_twitter: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  created_at: string;
  updated_at: string;
}

interface EditFormData {
  name: string;
  description: string;
  industry: string;
  company_size: string;
  founded_year: string;
  website: string;
  business_email: string;
  phone: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_country: string;
  address_postal_code: string;
  tax_id: string;
  registration_number: string;
  currency: string;
  timezone: string;
  date_format: string;
  fiscal_year_start: string;
  social_linkedin: string;
  social_twitter: string;
  social_instagram: string;
  social_facebook: string;
  primary_color: string;
}

const INDUSTRIES = [
  { value: "", label: "Select Industry" },
  { value: "technology", label: "Technology" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance & Banking" },
  { value: "education", label: "Education" },
  { value: "retail", label: "Retail & E-commerce" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "real_estate", label: "Real Estate" },
  { value: "hospitality", label: "Hospitality & Tourism" },
  { value: "media", label: "Media & Entertainment" },
  { value: "consulting", label: "Consulting" },
  { value: "marketing", label: "Marketing & Advertising" },
  { value: "nonprofit", label: "Non-Profit" },
  { value: "other", label: "Other" },
];

const COMPANY_SIZES = [
  { value: "", label: "Select Company Size" },
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501-1000", label: "501-1000 employees" },
  { value: "1001+", label: "1001+ employees" },
];

const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "AED", label: "AED - UAE Dirham" },
  { value: "SAR", label: "SAR - Saudi Riyal" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
];

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (US)" },
  { value: "America/Chicago", label: "Central Time (US)" },
  { value: "America/Denver", label: "Mountain Time (US)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const FISCAL_MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatIndustry(industry: string | null): string {
  if (!industry) return "-";
  const found = INDUSTRIES.find(i => i.value === industry);
  return found ? found.label : industry.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function formatCompanySize(size: string | null): string {
  if (!size) return "-";
  const found = COMPANY_SIZES.find(s => s.value === size);
  return found ? found.label : size;
}

// Card component for settings sections
const SettingsCard: React.FC<{
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onEdit?: () => void;
  gradient?: string;
}> = ({ title, subtitle, icon, children, onEdit, gradient = "from-brand-500 to-brand-600" }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] transition-all hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700">
    {/* Header with gradient accent */}
    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />

    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="opacity-0 group-hover:opacity-100 rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>
      {children}
    </div>
  </div>
);

// Info item component
const InfoItem: React.FC<{
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ label, value, icon }) => (
  <div className="flex items-center gap-3 py-2">
    {icon && (
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
        {icon}
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <div className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
        {value || "-"}
      </div>
    </div>
  </div>
);

export const CompanySettings = () => {
  const { theme, toggleTheme } = useTheme();
  const { hasFeature, loading: planLoading } = usePlanLimits();
  const canCustomBrand = hasFeature("custom_branding");
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editSection, setEditSection] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<EditFormData>({
    name: "",
    description: "",
    industry: "",
    company_size: "",
    founded_year: "",
    website: "",
    business_email: "",
    phone: "",
    address_street: "",
    address_city: "",
    address_state: "",
    address_country: "",
    address_postal_code: "",
    tax_id: "",
    registration_number: "",
    currency: "USD",
    timezone: "UTC",
    date_format: "MM/DD/YYYY",
    fiscal_year_start: "1",
    social_linkedin: "",
    social_twitter: "",
    social_instagram: "",
    social_facebook: "",
    primary_color: "#465FFF",
  });

  // Logo upload states
  const [logoUploading, setLogoUploading] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);

  const fetchCompany = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/company");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch company settings");
      }

      setCompany(data.company);

      // Initialize form data
      if (data.company) {
        setFormData({
          name: data.company.name || "",
          description: data.company.description || "",
          industry: data.company.industry || "",
          company_size: data.company.company_size || "",
          founded_year: data.company.founded_year?.toString() || "",
          website: data.company.website || "",
          business_email: data.company.business_email || "",
          phone: data.company.phone || "",
          address_street: data.company.address_street || "",
          address_city: data.company.address_city || "",
          address_state: data.company.address_state || "",
          address_country: data.company.address_country || "",
          address_postal_code: data.company.address_postal_code || "",
          tax_id: data.company.tax_id || "",
          registration_number: data.company.registration_number || "",
          currency: data.company.currency || "USD",
          timezone: data.company.timezone || "UTC",
          date_format: data.company.date_format || "MM/DD/YYYY",
          fiscal_year_start: data.company.fiscal_year_start?.toString() || "1",
          social_linkedin: data.company.social_linkedin || "",
          social_twitter: data.company.social_twitter || "",
          social_instagram: data.company.social_instagram || "",
          social_facebook: data.company.social_facebook || "",
          primary_color: data.company.primary_color || "#465FFF",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch company settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const handleEdit = (section: string) => {
    setEditSection(section);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
          fiscal_year_start: formData.fiscal_year_start ? parseInt(formData.fiscal_year_start) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update company settings");
      }

      setCompany(data.company);
      setIsEditing(false);
      setEditSection("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update company settings");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof EditFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2MB");
      return;
    }

    setLogoUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch("/api/upload/company-logo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const data = await res.json();
        setCompany(prev => prev ? { ...prev, logo_url: data.url } : prev);
        localStorage.setItem("custom_logo_url", data.url);
        window.dispatchEvent(new CustomEvent("logo-changed", { detail: data.url }));
        setLogoUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Logo upload failed");
      setLogoUploading(false);
    }
  };

  const handleLogoRemove = async () => {
    if (!confirm("Remove your custom logo? The default logo will be shown instead.")) return;

    setLogoUploading(true);
    try {
      const res = await fetch("/api/upload/company-logo", { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Failed to remove logo");
      }
      setCompany(prev => prev ? { ...prev, logo_url: null } : prev);
      localStorage.removeItem("custom_logo_url");
      window.dispatchEvent(new CustomEvent("logo-changed", { detail: null }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove logo");
    } finally {
      setLogoUploading(false);
    }
  };

  const renderEditForm = () => {
    const inputClasses = "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

    switch (editSection) {
      case "profile":
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Company Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={inputClasses}
                placeholder="Enter company name"
              />
            </div>
            <div>
              <label className={labelClasses}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className={`${inputClasses} min-h-[100px]`}
                placeholder="Describe your company"
              />
            </div>
            <div>
              <label className={labelClasses}>Industry</label>
              <select
                value={formData.industry}
                onChange={(e) => handleInputChange("industry", e.target.value)}
                className={inputClasses}
              >
                {INDUSTRIES.map(i => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClasses}>Company Size</label>
              <select
                value={formData.company_size}
                onChange={(e) => handleInputChange("company_size", e.target.value)}
                className={inputClasses}
              >
                {COMPANY_SIZES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClasses}>Founded Year</label>
              <input
                type="number"
                value={formData.founded_year}
                onChange={(e) => handleInputChange("founded_year", e.target.value)}
                className={inputClasses}
                placeholder="e.g., 2020"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
            <div>
              <label className={labelClasses}>Website</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                className={inputClasses}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className={labelClasses}>Brand Color</label>
              {canCustomBrand ? (
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => handleInputChange("primary_color", e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => handleInputChange("primary_color", e.target.value)}
                    className={inputClasses}
                    placeholder="#465FFF"
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-700 dark:bg-amber-900/20">
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Custom branding requires the Starter plan or above
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case "contact":
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Business Email</label>
              <input
                type="email"
                value={formData.business_email}
                onChange={(e) => handleInputChange("business_email", e.target.value)}
                className={inputClasses}
                placeholder="contact@company.com"
              />
            </div>
            <div>
              <label className={labelClasses}>Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className={inputClasses}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label className={labelClasses}>Street Address</label>
              <input
                type="text"
                value={formData.address_street}
                onChange={(e) => handleInputChange("address_street", e.target.value)}
                className={inputClasses}
                placeholder="123 Main Street"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>City</label>
                <input
                  type="text"
                  value={formData.address_city}
                  onChange={(e) => handleInputChange("address_city", e.target.value)}
                  className={inputClasses}
                  placeholder="City"
                />
              </div>
              <div>
                <label className={labelClasses}>State/Province</label>
                <input
                  type="text"
                  value={formData.address_state}
                  onChange={(e) => handleInputChange("address_state", e.target.value)}
                  className={inputClasses}
                  placeholder="State"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Country</label>
                <input
                  type="text"
                  value={formData.address_country}
                  onChange={(e) => handleInputChange("address_country", e.target.value)}
                  className={inputClasses}
                  placeholder="Country"
                />
              </div>
              <div>
                <label className={labelClasses}>Postal Code</label>
                <input
                  type="text"
                  value={formData.address_postal_code}
                  onChange={(e) => handleInputChange("address_postal_code", e.target.value)}
                  className={inputClasses}
                  placeholder="12345"
                />
              </div>
            </div>
          </div>
        );

      case "business":
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Tax ID / VAT Number</label>
              <input
                type="text"
                value={formData.tax_id}
                onChange={(e) => handleInputChange("tax_id", e.target.value)}
                className={inputClasses}
                placeholder="Enter tax ID"
              />
            </div>
            <div>
              <label className={labelClasses}>Business Registration Number</label>
              <input
                type="text"
                value={formData.registration_number}
                onChange={(e) => handleInputChange("registration_number", e.target.value)}
                className={inputClasses}
                placeholder="Enter registration number"
              />
            </div>
            <div>
              <label className={labelClasses}>Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange("currency", e.target.value)}
                className={inputClasses}
              >
                {CURRENCIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClasses}>Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) => handleInputChange("timezone", e.target.value)}
                className={inputClasses}
              >
                {TIMEZONES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClasses}>Date Format</label>
              <select
                value={formData.date_format}
                onChange={(e) => handleInputChange("date_format", e.target.value)}
                className={inputClasses}
              >
                {DATE_FORMATS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClasses}>Fiscal Year Start</label>
              <select
                value={formData.fiscal_year_start}
                onChange={(e) => handleInputChange("fiscal_year_start", e.target.value)}
                className={inputClasses}
              >
                {FISCAL_MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case "social":
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>LinkedIn</label>
              <input
                type="url"
                value={formData.social_linkedin}
                onChange={(e) => handleInputChange("social_linkedin", e.target.value)}
                className={inputClasses}
                placeholder="https://linkedin.com/company/..."
              />
            </div>
            <div>
              <label className={labelClasses}>Twitter / X</label>
              <input
                type="url"
                value={formData.social_twitter}
                onChange={(e) => handleInputChange("social_twitter", e.target.value)}
                className={inputClasses}
                placeholder="https://twitter.com/..."
              />
            </div>
            <div>
              <label className={labelClasses}>Instagram</label>
              <input
                type="url"
                value={formData.social_instagram}
                onChange={(e) => handleInputChange("social_instagram", e.target.value)}
                className={inputClasses}
                placeholder="https://instagram.com/..."
              />
            </div>
            <div>
              <label className={labelClasses}>Facebook</label>
              <input
                type="url"
                value={formData.social_facebook}
                onChange={(e) => handleInputChange("social_facebook", e.target.value)}
                className={inputClasses}
                placeholder="https://facebook.com/..."
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getSectionTitle = () => {
    switch (editSection) {
      case "profile": return "Company Profile";
      case "contact": return "Contact Information";
      case "business": return "Business Details";
      case "social": return "Social Media";
      default: return "Edit Settings";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-error-500">{error}</p>
        <button
          onClick={fetchCompany}
          className="mt-2 text-brand-500 hover:text-brand-600"
        >
          Try again
        </button>
      </div>
    );
  }

  const fullAddress = [
    company?.address_street,
    company?.address_city,
    company?.address_state,
    company?.address_postal_code,
    company?.address_country,
  ].filter(Boolean).join(", ");

  return (
    <>
      <div className="space-y-6">
        {/* Company Profile Card */}
        <SettingsCard
          title="Company Profile"
          subtitle="Basic information about your company"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          onEdit={() => handleEdit("profile")}
          gradient="from-brand-500 to-brand-600"
        >
          {/* Logo Upload Section */}
          <div className="mb-5 pb-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-start gap-4">
              <div className="relative flex h-16 w-44 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                {company?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={company.logo_url}
                    alt="Company logo"
                    className="h-full w-full object-contain p-2 dark:brightness-0 dark:invert"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-gray-400">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                    <span className="text-xs">No logo</span>
                  </div>
                )}
                {logoUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {canCustomBrand ? (
                  <>
                    <label className="cursor-pointer rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-600 text-center">
                      Upload Logo
                      <input
                        type="file"
                        accept="image/svg+xml,image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleLogoUpload}
                        disabled={logoUploading}
                      />
                    </label>
                    {company?.logo_url && (
                      <button
                        onClick={handleLogoRemove}
                        disabled={logoUploading}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
                      >
                        Remove
                      </button>
                    )}
                    <div className="space-y-1 text-xs text-gray-400 dark:text-gray-500">
                      <p>Recommended: <span className="font-medium text-gray-500 dark:text-gray-400">400 x 80px</span></p>
                      <p>Best format: <span className="font-medium text-gray-500 dark:text-gray-400">SVG</span> with transparent background</p>
                      <p>SVG adapts to light &amp; dark themes automatically. Max 2MB.</p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-700 dark:bg-amber-900/20">
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                        Custom logo requires the Starter plan or above
                      </p>
                      <Link
                        href="/dashboard/settings/billing"
                        className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-brand-500 hover:text-brand-600"
                      >
                        Upgrade to customize
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem
              label="Company Name"
              value={company?.name}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />
            <InfoItem
              label="Industry"
              value={formatIndustry(company?.industry || null)}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />
            <InfoItem
              label="Company Size"
              value={formatCompanySize(company?.company_size || null)}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />
            <InfoItem
              label="Founded"
              value={company?.founded_year || "-"}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <InfoItem
              label="Website"
              value={
                company?.website ? (
                  <a
                    href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-500 hover:text-brand-600"
                  >
                    {company.website}
                  </a>
                ) : null
              }
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              }
            />
            <InfoItem
              label="Brand Color"
              value={
                <div className="flex items-center gap-2">
                  <div
                    className="h-5 w-5 rounded-md border border-gray-200 dark:border-gray-700"
                    style={{ backgroundColor: company?.primary_color || "#465FFF" }}
                  />
                  <span>{company?.primary_color || "#465FFF"}</span>
                </div>
              }
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              }
            />
          </div>
          {company?.description && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">{company.description}</p>
            </div>
          )}
        </SettingsCard>

        {/* Contact Information Card */}
        <SettingsCard
          title="Contact Information"
          subtitle="Business contact details and address"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          onEdit={() => handleEdit("contact")}
          gradient="from-emerald-500 to-teal-600"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem
              label="Email"
              value={
                company?.business_email ? (
                  <a href={`mailto:${company.business_email}`} className="text-brand-500 hover:text-brand-600">
                    {company.business_email}
                  </a>
                ) : null
              }
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />
            <InfoItem
              label="Phone"
              value={
                company?.phone ? (
                  <a href={`tel:${company.phone}`} className="text-brand-500 hover:text-brand-600">
                    {company.phone}
                  </a>
                ) : null
              }
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              }
            />
            <div className="md:col-span-2">
              <InfoItem
                label="Address"
                value={fullAddress || "-"}
                icon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              />
            </div>
          </div>
        </SettingsCard>

        {/* Business Details Card */}
        <SettingsCard
          title="Business Details"
          subtitle="Legal and financial information"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          onEdit={() => handleEdit("business")}
          gradient="from-violet-500 to-purple-600"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem
              label="Tax ID / VAT"
              value={company?.tax_id}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
            <InfoItem
              label="Registration Number"
              value={company?.registration_number}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              }
            />
            <InfoItem
              label="Currency"
              value={CURRENCIES.find(c => c.value === company?.currency)?.label || company?.currency}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <InfoItem
              label="Timezone"
              value={TIMEZONES.find(t => t.value === company?.timezone)?.label || company?.timezone}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <InfoItem
              label="Date Format"
              value={company?.date_format}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <InfoItem
              label="Fiscal Year Start"
              value={FISCAL_MONTHS.find(m => m.value === company?.fiscal_year_start?.toString())?.label || "-"}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              }
            />
          </div>
        </SettingsCard>

        {/* Social Media Card */}
        <SettingsCard
          title="Social Media"
          subtitle="Your company's social presence"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          }
          onEdit={() => handleEdit("social")}
          gradient="from-pink-500 to-rose-600"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem
              label="LinkedIn"
              value={
                company?.social_linkedin ? (
                  <a
                    href={company.social_linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-500 hover:text-brand-600"
                  >
                    View Profile
                  </a>
                ) : null
              }
              icon={
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              }
            />
            <InfoItem
              label="Twitter / X"
              value={
                company?.social_twitter ? (
                  <a
                    href={company.social_twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-500 hover:text-brand-600"
                  >
                    View Profile
                  </a>
                ) : null
              }
              icon={
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              }
            />
            <InfoItem
              label="Instagram"
              value={
                company?.social_instagram ? (
                  <a
                    href={company.social_instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-500 hover:text-brand-600"
                  >
                    View Profile
                  </a>
                ) : null
              }
              icon={
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              }
            />
            <InfoItem
              label="Facebook"
              value={
                company?.social_facebook ? (
                  <a
                    href={company.social_facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-500 hover:text-brand-600"
                  >
                    View Page
                  </a>
                ) : null
              }
              icon={
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              }
            />
          </div>
        </SettingsCard>

        {/* General Settings Card */}
        <SettingsCard
          title="Preferences"
          subtitle="App appearance and notifications"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          gradient="from-amber-500 to-orange-600"
        >
          <div className="space-y-4">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">Dark Mode</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Toggle between light and dark theme</p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  theme === "dark" ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    theme === "dark" ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">Push Notifications</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Receive notifications for important updates</p>
                </div>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Email Digest */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">Email Digest</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Receive weekly summary of activity</p>
                </div>
              </div>
              <button
                onClick={() => setEmailDigest(!emailDigest)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  emailDigest ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    emailDigest ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </SettingsCard>

        {/* Metadata */}
        {company && (
          <div className="text-xs text-gray-400 text-center space-y-1">
            <p>Created: {formatDate(company.created_at)}</p>
            <p>Last updated: {formatDate(company.updated_at)}</p>
          </div>
        )}
      </div>

      {/* Edit Sidebar */}
      <DetailsSidebar
        isOpen={isEditing}
        onClose={() => {
          setIsEditing(false);
          setEditSection("");
        }}
        title={getSectionTitle()}
        subtitle="Update your company information"
        width="lg"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditSection("");
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        }
      >
        {renderEditForm()}
      </DetailsSidebar>
    </>
  );
};

export default CompanySettings;
