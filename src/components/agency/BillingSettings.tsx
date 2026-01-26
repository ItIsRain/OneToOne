"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DetailsSidebar } from "@/components/ui/DetailsSidebar";

interface Subscription {
  id: string;
  plan_type: "free" | "starter" | "professional" | "business";
  status: string;
  billing_interval: "monthly" | "yearly";
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  price: number;
  original_price?: number;
  discount_code?: string;
  discount_percent?: number;
}

interface PaymentMethod {
  id: string;
  type: string;
  card_brand: string;
  card_last_four: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
}

interface UsageItem {
  used: number;
  limit: number;
  percentage: number;
}

interface Usage {
  events: UsageItem;
  team_members: UsageItem;
  storage: UsageItem;
  api_calls: UsageItem;
}

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  type: string;
  name: string;
  description: string;
  price: { monthly: number; yearly: number };
  features: PlanFeature[];
  badge: string | null;
}

interface BillingHistory {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  invoice_url: string | null;
  paid_at: string | null;
  created_at: string;
}

// Card icons by brand
const CardIcons: Record<string, React.ReactNode> = {
  visa: (
    <svg className="h-8 w-12" viewBox="0 0 48 32" fill="none">
      <rect width="48" height="32" rx="4" fill="#1A1F71" />
      <path d="M19.5 21H17L18.75 11H21.25L19.5 21ZM15 11L12.5 18L12.25 16.75L11.5 12.25C11.5 12.25 11.375 11 10 11H6L6 11.25C6 11.25 7.5 11.5 9.25 12.75L11.5 21H14.25L18 11H15ZM35 21H37.5L35.25 11H33.25C32.125 11 31.875 11.875 31.875 11.875L27.75 21H30.5L31 19.5H34.375L35 21ZM31.875 17.25L33.375 13.25L34.25 17.25H31.875ZM28 14L28.375 11.75C28.375 11.75 27 11.25 25.5 11.25C23.875 11.25 20.25 12 20.25 15.25C20.25 18.25 24.5 18.25 24.5 19.75C24.5 21.25 20.75 20.75 19.5 19.75L19.125 22C19.125 22 20.5 22.5 22.5 22.5C24.5 22.5 28.125 21.25 28.125 18.25C28.125 15.125 23.75 14.875 23.75 13.625C23.75 12.375 26.625 12.5 28 14Z" fill="white"/>
    </svg>
  ),
  mastercard: (
    <svg className="h-8 w-12" viewBox="0 0 48 32" fill="none">
      <rect width="48" height="32" rx="4" fill="#000"/>
      <circle cx="19" cy="16" r="8" fill="#EB001B"/>
      <circle cx="29" cy="16" r="8" fill="#F79E1B"/>
      <path d="M24 10.5C25.875 12 27 14.375 27 16.875C27 19.375 25.875 21.75 24 23.25C22.125 21.75 21 19.375 21 16.875C21 14.375 22.125 12 24 10.5Z" fill="#FF5F00"/>
    </svg>
  ),
  amex: (
    <svg className="h-8 w-12" viewBox="0 0 48 32" fill="none">
      <rect width="48" height="32" rx="4" fill="#006FCF"/>
      <path d="M8 16L11 11H14L11 16L14 21H11L8 16ZM15 11H24L22 14H17V15H22L20 18H17V19H24L22 21H15V11ZM25 11H28L31 16L28 21H25L28 16L25 11ZM32 11H41V13H35V15H41V17H35V19H41V21H32V11Z" fill="white"/>
    </svg>
  ),
  default: (
    <svg className="h-8 w-12" viewBox="0 0 48 32" fill="none">
      <rect width="48" height="32" rx="4" fill="#6B7280"/>
      <rect x="6" y="10" width="36" height="4" rx="1" fill="#9CA3AF"/>
      <rect x="6" y="18" width="20" height="2" rx="1" fill="#9CA3AF"/>
      <rect x="6" y="22" width="12" height="2" rx="1" fill="#9CA3AF"/>
    </svg>
  ),
};

// Progress bar component
const UsageBar: React.FC<{ percentage: number; color: string }> = ({ percentage, color }) => (
  <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
    <div
      className={`h-2 rounded-full transition-all ${color}`}
      style={{ width: `${Math.min(percentage, 100)}%` }}
    />
  </div>
);

// Plan card component
const PlanCard: React.FC<{
  plan: Plan;
  isCurrentPlan: boolean;
  billingInterval: "monthly" | "yearly";
  onSelect: () => void;
  loading?: boolean;
}> = ({ plan, isCurrentPlan, billingInterval, onSelect, loading }) => {
  const price = plan.price[billingInterval];
  const monthlyEquivalent = billingInterval === "yearly" ? Math.round(price / 12) : price;
  const isProfessional = plan.type === "professional";
  const isBusiness = plan.type === "business";

  const getBorderClass = () => {
    if (isCurrentPlan) return "border-brand-500 bg-brand-50 dark:bg-brand-500/10";
    if (isProfessional) return "border-purple-300 dark:border-purple-700 hover:border-purple-500";
    if (isBusiness) return "border-amber-300 dark:border-amber-700 hover:border-amber-500";
    return "border-gray-200 dark:border-gray-700 hover:border-gray-300";
  };

  const getButtonClass = () => {
    if (isCurrentPlan) return "bg-brand-500 text-white cursor-default";
    if (isProfessional) return "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600";
    if (isBusiness) return "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600";
    return "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700";
  };

  return (
    <div className={`relative rounded-2xl border-2 p-6 transition-all flex flex-col ${getBorderClass()}`}>
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${
            plan.badge === "Most Popular"
              ? "bg-gradient-to-r from-purple-500 to-pink-500"
              : "bg-gradient-to-r from-amber-500 to-orange-500"
          }`}>
            {plan.badge}
          </span>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{plan.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plan.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-4xl font-bold text-gray-800 dark:text-white">
            ${monthlyEquivalent}
          </span>
          <span className="ml-1 text-gray-500 dark:text-gray-400">/month</span>
        </div>
        {billingInterval === "yearly" && price > 0 && (
          <p className="text-sm text-success-600 dark:text-success-400 mt-1">
            ${price}/year (save 20%)
          </p>
        )}
      </div>

      <ul className="mb-6 space-y-3 flex-1">
        {plan.features.slice(0, 8).map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            {feature.included ? (
              <svg className="h-5 w-5 flex-shrink-0 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5 flex-shrink-0 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className={feature.included ? "text-gray-600 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"}>
              {feature.text}
            </span>
          </li>
        ))}
        {plan.features.length > 8 && (
          <li className="text-sm text-brand-500 dark:text-brand-400">
            +{plan.features.length - 8} more features
          </li>
        )}
      </ul>

      <button
        onClick={onSelect}
        disabled={isCurrentPlan || loading}
        className={`w-full rounded-xl py-3 text-sm font-semibold transition-all ${getButtonClass()} disabled:opacity-50`}
      >
        {isCurrentPlan ? "Current Plan" : loading ? "Processing..." : plan.price.monthly === 0 ? "Get Started" : "Upgrade"}
      </button>
    </div>
  );
};

export const BillingSettings = () => {
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [changingPlan, setChangingPlan] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [showAddCard, setShowAddCard] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cardForm, setCardForm] = useState({
    card_brand: "visa",
    card_last_four: "",
    card_exp_month: "",
    card_exp_year: "",
  });

  const fetchBilling = useCallback(async () => {
    try {
      const [billingRes, historyRes] = await Promise.all([
        fetch("/api/settings/billing"),
        fetch("/api/settings/billing/history"),
      ]);

      const billingData = await billingRes.json();
      const historyData = await historyRes.json();

      if (!billingRes.ok) throw new Error(billingData.error);

      setSubscription(billingData.subscription);
      setPaymentMethods(billingData.paymentMethods || []);
      setUsage(billingData.usage);
      setPlans(billingData.plans || []);
      setBillingHistory(historyData.history || []);
      setBillingInterval(billingData.subscription?.billing_interval || "monthly");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch billing");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  // Handle Stripe redirect success/cancel
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    const plan = searchParams.get("plan");

    if (success === "true" && plan) {
      const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
      setSuccessMessage(`Successfully upgraded to ${planName} plan! Your subscription is now active.`);
      // Clear query params from URL
      window.history.replaceState({}, "", "/dashboard/settings/billing");
      // Refresh billing data
      fetchBilling();
    }
    if (canceled === "true") {
      setError("Checkout was canceled. Your plan has not been changed.");
      window.history.replaceState({}, "", "/dashboard/settings/billing");
    }
  }, [searchParams, fetchBilling]);

  const handleChangePlan = async (planType: string) => {
    if (subscription?.plan_type === planType) return;

    const plan = plans.find(p => p.type === planType);
    const price = plan?.price[billingInterval] || 0;

    // Free plan - just downgrade directly
    if (planType === "free") {
      if (!confirm("Are you sure you want to downgrade to the Free plan? You will lose access to premium features.")) return;

      setChangingPlan(true);
      try {
        const res = await fetch("/api/settings/billing", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan_type: planType, billing_interval: billingInterval }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        alert(data.message);
        fetchBilling();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to change plan");
      } finally {
        setChangingPlan(false);
      }
      return;
    }

    // Paid plan - use Stripe Checkout
    if (!confirm(`You will be redirected to Stripe to complete your upgrade to the ${plan?.name} plan (${price > 0 ? `$${price}/${billingInterval === "yearly" ? "year" : "month"}` : "Free"}).`)) return;

    setChangingPlan(true);
    try {
      // Prompt for discount code
      const discountCode = prompt("Have a discount code? Enter it here (or leave empty):");

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType,
          billingInterval,
          discountCode: discountCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // If it's a free upgrade (100% discount), no need to redirect
      if (data.freeUpgrade) {
        alert(data.message);
        fetchBilling();
        return;
      }

      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to initiate checkout");
    } finally {
      setChangingPlan(false);
    }
  };

  const handleAddCard = async () => {
    if (!cardForm.card_last_four || !cardForm.card_exp_month || !cardForm.card_exp_year) {
      alert("Please fill in all card details");
      return;
    }

    setAddingCard(true);
    try {
      const res = await fetch("/api/settings/billing/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...cardForm,
          card_exp_month: parseInt(cardForm.card_exp_month),
          card_exp_year: parseInt(cardForm.card_exp_year),
          is_default: paymentMethods.length === 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPaymentMethods(prev => [data.paymentMethod, ...prev]);
      setShowAddCard(false);
      setCardForm({ card_brand: "visa", card_last_four: "", card_exp_month: "", card_exp_year: "" });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add card");
    } finally {
      setAddingCard(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/settings/billing/payment-methods/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_default: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setPaymentMethods(prev =>
        prev.map(pm => ({ ...pm, is_default: pm.id === id }))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to set default");
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm("Are you sure you want to remove this payment method?")) return;

    try {
      const res = await fetch(`/api/settings/billing/payment-methods/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove card");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCurrentPlanInfo = () => {
    const plan = plans.find(p => p.type === subscription?.plan_type);
    return plan || { name: "Free", description: "" };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-error-500">{error}</p>
        <button onClick={fetchBilling} className="mt-2 text-brand-500 hover:text-brand-600">
          Try again
        </button>
      </div>
    );
  }

  const currentPlanInfo = getCurrentPlanInfo();

  return (
    <>
      <div className="space-y-6">
        {/* Success Message Banner */}
        {successMessage && (
          <div className="rounded-2xl border border-success-200 bg-success-50 p-4 dark:border-success-800 dark:bg-success-900/20">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/40">
                <svg className="h-5 w-5 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-success-800 dark:text-success-300">Upgrade Successful!</h3>
                <p className="text-sm text-success-700 dark:text-success-400">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-success-500 hover:text-success-700 dark:hover:text-success-300"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Current Plan Card */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-purple-600" />
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 text-white shadow-lg">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Current Plan</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage your subscription</p>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                subscription?.status === "active"
                  ? "bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400"
                  : "bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400"
              }`}>
                {subscription?.status?.charAt(0).toUpperCase()}{subscription?.status?.slice(1)}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <p className="text-3xl font-bold text-gray-800 dark:text-white">
                  {currentPlanInfo.name} Plan
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {subscription?.discount_percent && subscription.discount_percent > 0 ? (
                    <>
                      <span className="text-gray-400 line-through">
                        ${subscription?.original_price || 0}/{subscription?.billing_interval === "yearly" ? "year" : "month"}
                      </span>
                      <span className="text-success-600 dark:text-success-400 font-semibold">
                        ${subscription?.price || 0}/{subscription?.billing_interval === "yearly" ? "year" : "month"}
                      </span>
                      <span className="rounded-full bg-success-100 px-2 py-0.5 text-xs font-semibold text-success-700 dark:bg-success-500/20 dark:text-success-400">
                        {subscription.discount_percent}% OFF - {subscription.discount_code}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">
                      ${subscription?.price || 0}/{subscription?.billing_interval === "yearly" ? "year" : "month"}
                    </span>
                  )}
                  {subscription?.cancel_at_period_end && (
                    <span className="text-warning-500">- Cancels at period end</span>
                  )}
                </div>
              </div>
              {subscription?.current_period_end && (
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Next billing date</p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {formatDate(subscription.current_period_end)}
                  </p>
                </div>
              )}
            </div>

            {/* Usage Stats */}
            {usage && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Events</span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                      {usage.events.used}{usage.events.limit === -1 ? " / ∞" : `/${usage.events.limit}`}
                    </span>
                  </div>
                  <UsageBar
                    percentage={usage.events.limit === -1 ? 10 : usage.events.percentage}
                    color={usage.events.percentage > 80 ? "bg-error-500" : "bg-brand-500"}
                  />
                </div>
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Team</span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                      {usage.team_members.used}{usage.team_members.limit === -1 ? " / ∞" : `/${usage.team_members.limit}`}
                    </span>
                  </div>
                  <UsageBar
                    percentage={usage.team_members.limit === -1 ? 10 : usage.team_members.percentage}
                    color={usage.team_members.percentage > 80 ? "bg-error-500" : "bg-emerald-500"}
                  />
                </div>
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Storage</span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                      {usage.storage.used} GB / {usage.storage.limit} GB
                    </span>
                  </div>
                  <UsageBar
                    percentage={usage.storage.percentage}
                    color={usage.storage.percentage > 80 ? "bg-error-500" : "bg-violet-500"}
                  />
                </div>
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">API Calls</span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                      {usage.api_calls.used.toLocaleString()}{usage.api_calls.limit === -1 ? " / ∞" : `/${usage.api_calls.limit.toLocaleString()}`}
                    </span>
                  </div>
                  <UsageBar
                    percentage={usage.api_calls.limit === -1 ? 10 : usage.api_calls.percentage}
                    color={usage.api_calls.percentage > 80 ? "bg-error-500" : "bg-amber-500"}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Available Plans */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-600" />
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Choose Your Plan</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Select the plan that fits your needs</p>
                </div>
              </div>

              {/* Billing Toggle */}
              <div className="flex items-center gap-3 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                <button
                  onClick={() => setBillingInterval("monthly")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    billingInterval === "monthly"
                      ? "bg-white text-gray-800 shadow dark:bg-gray-700 dark:text-white"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval("yearly")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 ${
                    billingInterval === "yearly"
                      ? "bg-white text-gray-800 shadow dark:bg-gray-700 dark:text-white"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  }`}
                >
                  Yearly
                  <span className="rounded-full bg-success-100 px-2 py-0.5 text-xs font-semibold text-success-700 dark:bg-success-500/20 dark:text-success-400">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.type}
                  plan={plan}
                  isCurrentPlan={subscription?.plan_type === plan.type}
                  billingInterval={billingInterval}
                  onSelect={() => handleChangePlan(plan.type)}
                  loading={changingPlan}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Payment Methods Card */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Payment Methods</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage your payment methods</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCard(true)}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
              >
                Add Card
              </button>
            </div>

            {paymentMethods.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No payment methods added</p>
                <button
                  onClick={() => setShowAddCard(true)}
                  className="mt-4 text-brand-500 hover:text-brand-600 text-sm font-medium"
                >
                  Add your first card
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentMethods.map((pm) => (
                  <div
                    key={pm.id}
                    className={`flex items-center justify-between rounded-xl border p-4 ${
                      pm.is_default
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {CardIcons[pm.card_brand.toLowerCase()] || CardIcons.default}
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {pm.card_brand.charAt(0).toUpperCase() + pm.card_brand.slice(1)} ending in {pm.card_last_four}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Expires {pm.card_exp_month}/{pm.card_exp_year}
                          {pm.is_default && (
                            <span className="ml-2 rounded-full bg-brand-500 px-2 py-0.5 text-xs text-white">Default</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!pm.is_default && (
                        <button
                          onClick={() => handleSetDefault(pm.id)}
                          className="text-sm text-brand-500 hover:text-brand-600"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCard(pm.id)}
                        className="text-sm text-error-500 hover:text-error-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Billing History */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600" />
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Billing History</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">View your past invoices</p>
              </div>
            </div>

            {billingHistory.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No billing history yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Invoice</th>
                      <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                      <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
                      <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                      <th className="pb-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingHistory.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <td className="py-4 text-sm font-medium text-gray-800 dark:text-white">
                          {invoice.invoice_number}
                        </td>
                        <td className="py-4 text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(invoice.created_at)}
                        </td>
                        <td className="py-4 text-sm font-medium text-gray-800 dark:text-white">
                          ${invoice.amount.toFixed(2)} {invoice.currency}
                        </td>
                        <td className="py-4">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                            invoice.status === "paid"
                              ? "bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400"
                              : invoice.status === "pending"
                              ? "bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400"
                              : "bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-400"
                          }`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              href={`/invoice/${invoice.id}`}
                              className="text-sm text-brand-500 hover:text-brand-600"
                            >
                              View
                            </Link>
                            <Link
                              href={`/invoice/${invoice.id}`}
                              target="_blank"
                              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              Print
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Card Sidebar */}
      <DetailsSidebar
        isOpen={showAddCard}
        onClose={() => setShowAddCard(false)}
        title="Add Payment Method"
        subtitle="Add a new credit or debit card"
        width="md"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setShowAddCard(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCard}
              disabled={addingCard}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {addingCard ? "Adding..." : "Add Card"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Card Type</label>
            <select
              value={cardForm.card_brand}
              onChange={(e) => setCardForm(prev => ({ ...prev, card_brand: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="visa">Visa</option>
              <option value="mastercard">Mastercard</option>
              <option value="amex">American Express</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Last 4 Digits</label>
            <input
              type="text"
              maxLength={4}
              value={cardForm.card_last_four}
              onChange={(e) => setCardForm(prev => ({ ...prev, card_last_four: e.target.value.replace(/\D/g, "") }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              placeholder="4242"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Exp. Month</label>
              <input
                type="text"
                maxLength={2}
                value={cardForm.card_exp_month}
                onChange={(e) => setCardForm(prev => ({ ...prev, card_exp_month: e.target.value.replace(/\D/g, "") }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                placeholder="MM"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Exp. Year</label>
              <input
                type="text"
                maxLength={4}
                value={cardForm.card_exp_year}
                onChange={(e) => setCardForm(prev => ({ ...prev, card_exp_year: e.target.value.replace(/\D/g, "") }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                placeholder="YYYY"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            Note: This is a demo. For production, use Stripe Elements for secure card entry.
          </p>
        </div>
      </DetailsSidebar>
    </>
  );
};

export default BillingSettings;
