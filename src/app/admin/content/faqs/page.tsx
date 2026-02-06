"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  display_order: number;
  is_active: boolean;
}

const faqCategories = ["General", "Billing", "Features", "Account", "Security", "Technical", "Support"];

const defaultFAQ: Partial<FAQ> = {
  question: "",
  answer: "",
  category: "",
  display_order: 0,
  is_active: true,
};

export default function AdminFAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<Partial<FAQ> | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const fetchFAQs = useCallback(async () => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  const openCreateModal = () => {
    const maxOrder = Math.max(0, ...faqs.map((f) => f.display_order));
    setEditingFAQ({ ...defaultFAQ, display_order: maxOrder + 1 });
    setIsModalOpen(true);
  };

  const openEditModal = (faq: FAQ) => {
    setEditingFAQ(faq);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFAQ(null);
  };

  const handleSave = async () => {
    if (!editingFAQ) return;
    setSaving(true);

    const supabase = createClient();
    try {
      if (editingFAQ.id) {
        const { error } = await supabase.from("faqs").update(editingFAQ).eq("id", editingFAQ.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("faqs").insert(editingFAQ);
        if (error) throw error;
      }

      await fetchFAQs();
      closeModal();
    } catch (error) {
      console.error("Error saving FAQ:", error);
      alert("Failed to save FAQ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;

    const supabase = createClient();
    try {
      const { error } = await supabase.from("faqs").delete().eq("id", id);
      if (error) throw error;
      await fetchFAQs();
    } catch (error) {
      console.error("Error deleting FAQ:", error);
    }
  };

  const toggleActive = async (faq: FAQ) => {
    const supabase = createClient();
    try {
      const { error } = await supabase.from("faqs").update({ is_active: !faq.is_active }).eq("id", faq.id);
      if (error) throw error;
      await fetchFAQs();
    } catch (error) {
      console.error("Error toggling FAQ:", error);
    }
  };

  const filteredFAQs = filterCategory === "all" ? faqs : faqs.filter((f) => f.category === filterCategory);
  const categories = [...new Set(faqs.map((f) => f.category).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">FAQs</h2>
          <p className="text-gray-500 dark:text-gray-400">Manage frequently asked questions</p>
        </div>
        <button onClick={openCreateModal} className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add FAQ
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 mb-4">No FAQs yet</p>
          <button onClick={openCreateModal} className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">Add FAQ</button>
        </div>
      ) : (
        <>
          {categories.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFilterCategory("all")}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filterCategory === "all"
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                All ({faqs.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat!)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    filterCategory === cat
                      ? "bg-brand-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {cat} ({faqs.filter((f) => f.category === cat).length})
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {filteredFAQs.map((faq) => (
              <div
                key={faq.id}
                className={`p-4 rounded-xl border ${
                  faq.is_active
                    ? "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-500">#{faq.display_order}</span>
                      {faq.category && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {faq.category}
                        </span>
                      )}
                      {!faq.is_active && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                          Inactive
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">{faq.question}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleActive(faq)}
                      className={`p-2 rounded-lg transition-colors ${
                        faq.is_active ? "text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      title={faq.is_active ? "Deactivate" : "Activate"}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button onClick={() => openEditModal(faq)} className="p-2 text-gray-500 hover:text-brand-500 rounded-lg">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(faq.id)} className="p-2 text-gray-500 hover:text-red-500 rounded-lg">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                {editingFAQ?.id ? "Edit FAQ" : "Create FAQ"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question</label>
                  <input
                    type="text"
                    value={editingFAQ?.question || ""}
                    onChange={(e) => setEditingFAQ((p) => ({ ...p, question: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Answer</label>
                  <textarea
                    value={editingFAQ?.answer || ""}
                    onChange={(e) => setEditingFAQ((p) => ({ ...p, answer: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={5}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <select
                      value={editingFAQ?.category || ""}
                      onChange={(e) => setEditingFAQ((p) => ({ ...p, category: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select category</option>
                      {faqCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Order</label>
                    <input
                      type="number"
                      value={editingFAQ?.display_order || 0}
                      onChange={(e) => setEditingFAQ((p) => ({ ...p, display_order: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingFAQ?.is_active !== false}
                    onChange={(e) => setEditingFAQ((p) => ({ ...p, is_active: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
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
