"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { isValidPhoneNumber } from "libphonenumber-js";
import { GetCountries } from "react-country-state-city";
import { toast } from "sonner";
import type { Vendor } from "../VendorsTable";

type Country = {
  id: number;
  name: string;
  iso2: string;
  iso3: string;
  phone_code: string;
};

interface VendorCategory {
  id: string;
  name: string;
}

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vendor: Vendor) => void;
  vendor?: Vendor | null;
}

const initialFormData = {
  name: "",
  email: "",
  company: "",
  phone: "",
  category: "",
  services: "",
  hourly_rate: "",
  rating: "",
  status: "active",
  website: "",
  address: "",
  city: "",
  country: "",
  notes: "",
  tags: "",
};

export const AddVendorModal: React.FC<AddVendorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  vendor,
}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [countries, setCountries] = useState<Country[]>([]);
  const [categories, setCategories] = useState<VendorCategory[]>([]);
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
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/vendors/categories");
        const data = await res.json();
        if (res.ok) {
          setCategories(data.categories || []);
        }
      } catch {
        // silently fail - categories dropdown will just be empty
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name || "",
        email: vendor.email || "",
        company: vendor.company || "",
        phone: vendor.phone || "",
        category: vendor.category || "",
        services: vendor.services?.join(", ") || "",
        hourly_rate: vendor.hourly_rate?.toString() || "",
        rating: vendor.rating?.toString() || "",
        status: vendor.status || "active",
        website: vendor.website || "",
        address: vendor.address || "",
        city: vendor.city || "",
        country: vendor.country || "",
        notes: vendor.notes || "",
        tags: vendor.tags?.join(", ") || "",
      });
      // Show optional fields if any are filled
      if (vendor.website || vendor.address || vendor.city || vendor.country || vendor.notes || (vendor.tags && vendor.tags.length > 0)) {
        setShowOptionalFields(true);
      }
    } else {
      setFormData(initialFormData);
      setShowOptionalFields(false);
    }
    setError("");
    setPhoneError("");
  }, [vendor, isOpen]);

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
      const url = vendor ? `/api/vendors/${vendor.id}` : "/api/vendors";
      const method = vendor ? "PATCH" : "POST";

      // Parse services and tags from comma-separated strings to arrays
      const services = formData.services
        ? formData.services.split(",").map(s => s.trim()).filter(s => s !== "")
        : null;
      const tags = formData.tags
        ? formData.tags.split(",").map(t => t.trim()).filter(t => t !== "")
        : null;

      const payload = {
        ...formData,
        services,
        tags,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        rating: formData.rating ? parseFloat(formData.rating) : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save vendor");
        return;
      }

      onSave(data.vendor);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save vendor");
    } finally {
      setIsSaving(false);
    }
  };

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "archived", label: "Archived" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {vendor ? "Edit Vendor" : "Add New Vendor"}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {vendor ? "Update the vendor details below" : "Enter the vendor details below"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">
        {/* Required Fields */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter vendor name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="vendor@company.com"
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
              onChange={handlePhoneChange}
              error={!!phoneError}
            />
            {phoneError && (
              <p className="mt-1 text-xs text-error-500">{phoneError}</p>
            )}
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="services">Services</Label>
            <Input
              id="services"
              type="text"
              placeholder="Photography, Videography, DJ"
              value={formData.services}
              onChange={(e) => setFormData({ ...formData, services: e.target.value })}
            />
            <p className="mt-1 text-xs text-gray-400">Comma-separated list</p>
          </div>

          <div>
            <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
            <Input
              id="hourly_rate"
              type="number"
              placeholder="0"
              value={formData.hourly_rate}
              onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="rating">Rating (0-5)</Label>
            <Input
              id="rating"
              type="number"
              placeholder="0"
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
            />
            <p className="mt-1 text-xs text-gray-400">Step: 0.5 (e.g., 4.5)</p>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
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
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 pt-4">
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
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
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

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Street address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  type="text"
                  placeholder="premium, reliable, preferred"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
                <p className="mt-1 text-xs text-gray-400">Comma-separated list</p>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                placeholder="Additional notes about this vendor..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
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
            {isSaving ? "Saving..." : vendor ? "Update Vendor" : "Add Vendor"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
