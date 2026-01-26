"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

interface Announcement {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  image_url: string | null;
  category: string;
  priority: string;
  is_pinned: boolean;
  is_published: boolean;
  publish_at: string | null;
  expires_at: string | null;
}

interface AddAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (announcement: Announcement) => void;
  announcement?: Announcement | null;
}

const categories = [
  { value: "general", label: "General" },
  { value: "update", label: "Update" },
  { value: "alert", label: "Alert" },
  { value: "celebration", label: "Celebration" },
  { value: "policy", label: "Policy" },
  { value: "reminder", label: "Reminder" },
];

const priorities = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const AddAnnouncementModal: React.FC<AddAnnouncementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  announcement,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    category: "general",
    priority: "normal",
    is_pinned: false,
    is_published: true,
    publish_at: "",
    expires_at: "",
  });
  const [image, setImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title,
        content: announcement.content,
        excerpt: announcement.excerpt || "",
        category: announcement.category,
        priority: announcement.priority,
        is_pinned: announcement.is_pinned,
        is_published: announcement.is_published,
        publish_at: announcement.publish_at?.split("T")[0] || "",
        expires_at: announcement.expires_at?.split("T")[0] || "",
      });
      setImage(announcement.image_url);
      setShowOptionalFields(true);
    } else {
      setFormData({
        title: "",
        content: "",
        excerpt: "",
        category: "general",
        priority: "normal",
        is_pinned: false,
        is_published: true,
        publish_at: "",
        expires_at: "",
      });
      setImage(null);
      setShowOptionalFields(false);
    }
    setError("");
  }, [announcement, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (!formData.content.trim()) {
      setError("Content is required");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const url = announcement
        ? `/api/announcements/${announcement.id}`
        : "/api/announcements";
      const method = announcement ? "PATCH" : "POST";

      const body: Record<string, unknown> = {
        ...formData,
        publish_at: formData.publish_at || null,
        expires_at: formData.expires_at || null,
      };

      // Only include image if it's a new base64 image (not existing URL)
      if (image && image.startsWith("data:")) {
        body.image = image;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save announcement");
      }

      onSave(data.announcement);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {announcement ? "Edit Announcement" : "New Announcement"}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {announcement ? "Update the announcement" : "Create a new announcement for your team"}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">
        {/* Title */}
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            type="text"
            placeholder="Announcement title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        {/* Content */}
        <div>
          <Label htmlFor="content">Content *</Label>
          <textarea
            id="content"
            rows={4}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            placeholder="Write your announcement..."
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          />
        </div>

        {/* Category & Priority */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
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
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              {priorities.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <Label>Cover Image (Optional)</Label>
          <div className="mt-1">
            {image ? (
              <div className="relative inline-block">
                <img
                  src={image}
                  alt="Cover"
                  className="h-32 w-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div className="text-center">
                  <svg className="w-6 h-6 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click to upload</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_pinned}
              onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Pin to top</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_published}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Publish immediately</span>
          </label>
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
          {showOptionalFields ? "Hide" : "Show"} additional options
        </button>

        {/* Optional Fields */}
        {showOptionalFields && (
          <div className="space-y-5 pt-2 border-t border-gray-200 dark:border-gray-700">
            {/* Excerpt */}
            <div>
              <Label htmlFor="excerpt">Excerpt (Preview Text)</Label>
              <Input
                id="excerpt"
                type="text"
                placeholder="Short preview text..."
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              />
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="publish_at">Publish Date</Label>
                <Input
                  id="publish_at"
                  type="date"
                  value={formData.publish_at}
                  onChange={(e) => setFormData({ ...formData, publish_at: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="expires_at">Expiry Date</Label>
                <Input
                  id="expires_at"
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : announcement ? "Update" : "Publish"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
