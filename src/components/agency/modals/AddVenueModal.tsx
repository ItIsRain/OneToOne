"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";

interface AddVenueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddVenueModal: React.FC<AddVenueModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    capacity: "",
    pricePerHour: "",
    venueType: "",
    amenities: [] as string[],
    description: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });

  const venueTypeOptions = [
    { value: "ballroom", label: "Ballroom" },
    { value: "conference-center", label: "Conference Center" },
    { value: "outdoor", label: "Outdoor / Garden" },
    { value: "rooftop", label: "Rooftop" },
    { value: "theater", label: "Theater / Auditorium" },
    { value: "restaurant", label: "Restaurant / Private Dining" },
    { value: "gallery", label: "Gallery / Museum" },
    { value: "warehouse", label: "Industrial / Warehouse" },
    { value: "hotel", label: "Hotel" },
    { value: "other", label: "Other" },
  ];

  const amenityOptions = [
    "WiFi",
    "Parking",
    "Catering",
    "A/V Equipment",
    "Stage",
    "Dance Floor",
    "Outdoor Space",
    "Wheelchair Accessible",
    "Bar Service",
    "Kitchen",
  ];

  const toggleAmenity = (amenity: string) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.includes(amenity)
        ? formData.amenities.filter((a) => a !== amenity)
        : [...formData.amenities, amenity],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Venue data:", formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Add New Venue
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Add a venue to your venue directory
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
        <div>
          <Label htmlFor="name">Venue Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Grand Ballroom"
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="venueType">Venue Type</Label>
            <Select
              options={venueTypeOptions}
              placeholder="Select type"
              onChange={(value) => setFormData({ ...formData, venueType: value })}
            />
          </div>
          <div>
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              placeholder="Maximum guests"
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            type="text"
            placeholder="Street address"
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              type="text"
              placeholder="City, State"
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="pricePerHour">Price per Hour</Label>
            <Input
              id="pricePerHour"
              type="text"
              placeholder="$500"
              onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label>Amenities</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {amenityOptions.map((amenity) => (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  formData.amenities.includes(amenity)
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                {amenity}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <TextArea
            placeholder="Describe the venue, its features, and best uses..."
            onChange={(value) => setFormData({ ...formData, description: value })}
            rows={3}
          />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
          <h4 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-4">
            Contact Information
          </h4>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                type="text"
                placeholder="John Doe"
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contactEmail">Email</Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="contact@venue.com"
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contactPhone">Phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                placeholder="+1 555-0100"
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
            </div>
          </div>
        </div>

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
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Add Venue
          </button>
        </div>
      </form>
    </Modal>
  );
};
