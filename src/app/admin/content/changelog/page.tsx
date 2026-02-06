"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface ChangelogEntry {
  id: string;
  version: string | null;
  title: string;
  description: string | null;
  release_type: "major" | "minor" | "patch" | "hotfix" | null;
  highlights: string[] | null;
  release_date: string;
  is_published: boolean;
}

const releaseTypes = [
  { value: "major", label: "Major", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
  { value: "minor", label: "Minor", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
  { value: "patch", label: "Patch", color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" },
  { value: "hotfix", label: "Hotfix", color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" },
];

const defaultEntry: Partial<ChangelogEntry> = {
  version: "",
  title: "",
  description: "",
  release_type: "minor",
  highlights: [],
  release_date: new Date().toISOString().split("T")[0],
  is_published: false,
};

export default function AdminChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Partial<ChangelogEntry> | null>(null);
  const [highlightsText, setHighlightsText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchEntries = useCallback(async () => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("changelog_entries")
        .select("*")
        .order("release_date", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching entries:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const openCreateModal = () => {
    setEditingEntry({ ...defaultEntry });
    setHighlightsText("");
    setIsModalOpen(true);
  };

  const openEditModal = (entry: ChangelogEntry) => {
    setEditingEntry({ ...entry, release_date: entry.release_date?.split("T")[0] || "" });
    setHighlightsText(entry.highlights?.join("\n") || "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
    setHighlightsText("");
  };

  const handleSave = async () => {
    if (!editingEntry) return;
    setSaving(true);

    const supabase = createClient();
    try {
      const entryData = {
        ...editingEntry,
        highlights: highlightsText.split("\n").filter((h) => h.trim()),
      };

      if (editingEntry.id) {
        const { error } = await supabase.from("changelog_entries").update(entryData).eq("id", editingEntry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("changelog_entries").insert(entryData);
        if (error) throw error;
      }

      await fetchEntries();
      closeModal();
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    const supabase = createClient();
    try {
      const { error } = await supabase.from("changelog_entries").delete().eq("id", id);
      if (error) throw error;
      await fetchEntries();
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getReleaseTypeStyle = (type: string | null) => {
    return releaseTypes.find((t) => t.value === type)?.color || "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Changelog</h2>
          <p className="text-gray-500 dark:text-gray-400">Document product updates and releases</p>
        </div>
        <button onClick={openCreateModal} className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Entry
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 mb-4">No changelog entries yet</p>
          <button onClick={openCreateModal} className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">Add Entry</button>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {entry.version && (
                      <span className="px-2 py-1 text-sm font-mono font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        v{entry.version}
                      </span>
                    )}
                    {entry.release_type && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getReleaseTypeStyle(entry.release_type)}`}>
                        {entry.release_type}
                      </span>
                    )}
                    {!entry.is_published && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                        Draft
                      </span>
                    )}
                    <span className="text-sm text-gray-500">{formatDate(entry.release_date)}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{entry.title}</h3>
                  {entry.description && <p className="text-gray-600 dark:text-gray-400 mb-3">{entry.description}</p>}
                  {entry.highlights && entry.highlights.length > 0 && (
                    <ul className="space-y-1">
                      {entry.highlights.map((h, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <svg className="w-4 h-4 text-brand-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditModal(entry)} className="p-2 text-gray-500 hover:text-brand-500 rounded-lg">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(entry.id)} className="p-2 text-gray-500 hover:text-red-500 rounded-lg">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                {editingEntry?.id ? "Edit Entry" : "Create Entry"}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Version</label>
                    <input
                      type="text"
                      value={editingEntry?.version || ""}
                      onChange={(e) => setEditingEntry((p) => ({ ...p, version: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., 2.1.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                    <select
                      value={editingEntry?.release_type || "minor"}
                      onChange={(e) => setEditingEntry((p) => ({ ...p, release_type: e.target.value as ChangelogEntry["release_type"] }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {releaseTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={editingEntry?.title || ""}
                    onChange={(e) => setEditingEntry((p) => ({ ...p, title: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Release Date</label>
                  <input
                    type="date"
                    value={editingEntry?.release_date || ""}
                    onChange={(e) => setEditingEntry((p) => ({ ...p, release_date: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    value={editingEntry?.description || ""}
                    onChange={(e) => setEditingEntry((p) => ({ ...p, description: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Highlights (one per line)</label>
                  <textarea
                    value={highlightsText}
                    onChange={(e) => setHighlightsText(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={5}
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingEntry?.is_published || false}
                    onChange={(e) => setEditingEntry((p) => ({ ...p, is_published: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Publish immediately</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button onClick={closeModal} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50">
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
