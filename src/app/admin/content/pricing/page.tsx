"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface PricingPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
  display_order: number;
  cta_text: string | null;
  cta_link: string | null;
}

const defaultPlan: Partial<PricingPlan> = {
  name: "",
  slug: "",
  description: "",
  price_monthly: 0,
  price_yearly: 0,
  features: [],
  is_popular: false,
  is_active: true,
  display_order: 0,
  cta_text: "Get Started",
  cta_link: "/subscribe",
};

export default function AdminPricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<PricingPlan> | null>(null);
  const [featuresText, setFeaturesText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPlans = useCallback(async () => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("pricing_plans")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const openCreateModal = () => {
    setEditingPlan({ ...defaultPlan });
    setFeaturesText("");
    setIsModalOpen(true);
  };

  const openEditModal = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setFeaturesText(plan.features?.join("\n") || "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
    setFeaturesText("");
  };

  const handleSave = async () => {
    if (!editingPlan) return;
    setSaving(true);

    const supabase = createClient();
    try {
      const planData = {
        ...editingPlan,
        features: featuresText.split("\n").filter((f) => f.trim()),
        slug: editingPlan.slug || editingPlan.name?.toLowerCase().replace(/\s+/g, "-"),
      };

      if (editingPlan.id) {
        const { error } = await supabase
          .from("pricing_plans")
          .update(planData)
          .eq("id", editingPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("pricing_plans")
          .insert(planData);
        if (error) throw error;
      }

      await fetchPlans();
      closeModal();
    } catch (error) {
      console.error("Error saving plan:", error);
      alert("Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pricing plan?")) return;

    const supabase = createClient();
    try {
      const { error } = await supabase.from("pricing_plans").delete().eq("id", id);
      if (error) throw error;
      await fetchPlans();
    } catch (error) {
      console.error("Error deleting plan:", error);
      alert("Failed to delete plan");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pricing Plans</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Manage pricing tiers displayed on your marketing site
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Plan
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No pricing plans yet</p>
          <button onClick={openCreateModal} className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">
            Create Plan
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-6 rounded-xl border ${
                plan.is_popular
                  ? "border-brand-500 dark:border-brand-400 ring-1 ring-brand-500"
                  : "border-gray-200 dark:border-gray-700"
              } bg-white dark:bg-gray-800`}
            >
              {plan.is_popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-500 text-white text-xs font-medium rounded-full">
                  Popular
                </span>
              )}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                  {!plan.is_active && <span className="text-xs text-red-500">Inactive</span>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditModal(plan)} className="p-2 text-gray-500 hover:text-brand-500 rounded-lg">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(plan.id)} className="p-2 text-gray-500 hover:text-red-500 rounded-lg">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">${plan.price_monthly}</span>
                <span className="text-gray-500 dark:text-gray-400">/mo</span>
              </div>
              {plan.features && plan.features.length > 0 && (
                <ul className="space-y-2">
                  {plan.features.slice(0, 5).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 text-brand-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                {editingPlan?.id ? "Edit Plan" : "Create Plan"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={editingPlan?.name || ""}
                    onChange={(e) => setEditingPlan((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Starter, Professional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    value={editingPlan?.description || ""}
                    onChange={(e) => setEditingPlan((p) => ({ ...p, description: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Price ($)</label>
                    <input
                      type="number"
                      value={editingPlan?.price_monthly || 0}
                      onChange={(e) => setEditingPlan((p) => ({ ...p, price_monthly: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yearly Price ($)</label>
                    <input
                      type="number"
                      value={editingPlan?.price_yearly || 0}
                      onChange={(e) => setEditingPlan((p) => ({ ...p, price_yearly: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Features (one per line)</label>
                  <textarea
                    value={featuresText}
                    onChange={(e) => setFeaturesText(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={5}
                    placeholder="Unlimited projects&#10;Priority support"
                  />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPlan?.is_popular || false}
                      onChange={(e) => setEditingPlan((p) => ({ ...p, is_popular: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Popular</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPlan?.is_active !== false}
                      onChange={(e) => setEditingPlan((p) => ({ ...p, is_active: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button onClick={closeModal} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  Cancel
                </button>
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
