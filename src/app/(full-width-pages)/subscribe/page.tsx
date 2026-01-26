"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Plan {
  type: string;
  name: string;
  description: string;
  price: { monthly: number; yearly: number };
  features: { text: string; included: boolean }[];
  badge: string | null;
}

const PLANS: Plan[] = [
  {
    type: "free",
    name: "Free",
    description: "Perfect for trying out the platform",
    price: { monthly: 0, yearly: 0 },
    features: [
      { text: "3 events total", included: true },
      { text: "2 team members", included: true },
      { text: "500 MB storage", included: true },
      { text: "1,000 API calls/month", included: true },
      { text: "Up to 50 attendees per event", included: true },
      { text: "Basic analytics", included: true },
      { text: "Community support", included: true },
      { text: "CRM features", included: false },
      { text: "Custom branding", included: false },
      { text: "Judging system", included: false },
    ],
    badge: null,
  },
  {
    type: "starter",
    name: "Starter",
    description: "For small agencies and freelancers",
    price: { monthly: 29, yearly: 279 },
    features: [
      { text: "10 events/month", included: true },
      { text: "5 team members", included: true },
      { text: "5 GB storage", included: true },
      { text: "10,000 API calls/month", included: true },
      { text: "Up to 200 attendees per event", included: true },
      { text: "Basic analytics", included: true },
      { text: "Email support", included: true },
      { text: "Basic CRM features", included: true },
      { text: "Basic invoicing", included: true },
      { text: "Logo branding", included: true },
    ],
    badge: null,
  },
  {
    type: "professional",
    name: "Professional",
    description: "For growing agencies and regular organizers",
    price: { monthly: 79, yearly: 758 },
    features: [
      { text: "50 events/month", included: true },
      { text: "15 team members", included: true },
      { text: "25 GB storage", included: true },
      { text: "50,000 API calls/month", included: true },
      { text: "Up to 1,000 attendees per event", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Priority email support", included: true },
      { text: "Full CRM features", included: true },
      { text: "Judging system", included: true },
      { text: "Full custom branding", included: true },
    ],
    badge: "Most Popular",
  },
  {
    type: "business",
    name: "Business",
    description: "For large agencies and enterprise events",
    price: { monthly: 199, yearly: 1910 },
    features: [
      { text: "Unlimited events", included: true },
      { text: "Unlimited team members", included: true },
      { text: "100 GB storage", included: true },
      { text: "Unlimited API calls", included: true },
      { text: "Unlimited attendees per event", included: true },
      { text: "24/7 priority support", included: true },
      { text: "White-label branding", included: true },
      { text: "SSO/SAML integration", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "99.9% SLA guarantee", included: true },
    ],
    badge: "Enterprise",
  },
];

export default function SubscribePage() {
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState<{
    valid: boolean;
    discount_percent: number;
    final_price: number;
    original_price: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/settings/billing");
        if (res.status === 401) {
          router.push("/signin?redirect=/subscribe");
          return;
        }
        const data = await res.json();
        // If user already has an active paid subscription, redirect to dashboard
        // Free plan users can stay on this page to upgrade
        if (data.subscription?.status === "active" && data.subscription?.plan_type !== "free") {
          router.push("/dashboard");
          return;
        }
        // Pre-select current plan if user has free plan
        if (data.subscription?.plan_type === "free") {
          setSelectedPlan("starter"); // Suggest upgrading to starter
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  const validateDiscountCode = async () => {
    if (!discountCode.trim() || !selectedPlan) return;

    setValidating(true);
    setError("");

    try {
      const res = await fetch("/api/discount-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: discountCode,
          plan_type: selectedPlan,
          billing_interval: billingInterval,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid discount code");
        setDiscountApplied(null);
        return;
      }

      setDiscountApplied(data);
    } catch (err) {
      setError("Failed to validate discount code");
      setDiscountApplied(null);
    } finally {
      setValidating(false);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      setError("Please select a plan");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/subscription/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_type: selectedPlan,
          billing_interval: billingInterval,
          discount_code: discountCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to subscribe");
        return;
      }

      if (data.requires_payment) {
        setError(data.message);
        return;
      }

      // Success - redirect to dashboard
      router.push("/dashboard?subscribed=true");
    } catch (err) {
      setError("Failed to process subscription");
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (plan: Plan) => {
    const basePrice = plan.price[billingInterval];
    if (discountApplied && selectedPlan === plan.type) {
      return discountApplied.final_price;
    }
    return basePrice;
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <nav className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-lime-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">1:1</span>
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white">One To One</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Select the plan that best fits your needs. You can upgrade or downgrade anytime.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 inline-flex items-center gap-4 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <button
              onClick={() => setBillingInterval("monthly")}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                billingInterval === "monthly"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("yearly")}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                billingInterval === "yearly"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Yearly
              <span className="px-2 py-0.5 bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 text-xs font-semibold rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid lg:grid-cols-4 gap-6 mb-12">
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.type;
            const price = getPrice(plan);
            const originalPrice = plan.price[billingInterval];
            const hasDiscount = discountApplied && isSelected && price < originalPrice;

            return (
              <div
                key={plan.type}
                onClick={() => {
                  setSelectedPlan(plan.type);
                  setDiscountApplied(null);
                }}
                className={`relative bg-white dark:bg-gray-900 rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? "ring-2 ring-lime-500 shadow-xl shadow-lime-500/10"
                    : "border border-gray-200 dark:border-gray-800 hover:border-lime-500/50"
                } ${plan.badge === "Most Popular" ? "lg:-mt-4 lg:mb-4" : ""}`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                        plan.badge === "Most Popular"
                          ? "bg-lime-500 text-white"
                          : "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                      }`}
                    >
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Selection Indicator */}
                <div className="absolute top-4 right-4">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? "border-lime-500 bg-lime-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>

                {/* Price */}
                <div className="mt-4 flex items-baseline gap-1">
                  {hasDiscount && (
                    <span className="text-lg text-gray-400 line-through">${originalPrice}</span>
                  )}
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${price}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    /{billingInterval === "yearly" ? "year" : "month"}
                  </span>
                </div>

                {hasDiscount && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                      {discountApplied.discount_percent}% OFF Applied!
                    </span>
                  </div>
                )}

                {/* Features */}
                <ul className="mt-6 space-y-3">
                  {plan.features.slice(0, 6).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <svg
                        className={`w-5 h-5 flex-shrink-0 ${
                          feature.included
                            ? "text-lime-500"
                            : "text-gray-300 dark:text-gray-600"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        {feature.included ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        )}
                      </svg>
                      <span
                        className={`text-sm ${
                          feature.included
                            ? "text-gray-600 dark:text-gray-400"
                            : "text-gray-400 dark:text-gray-600"
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Discount Code & Subscribe */}
        <div className="max-w-lg mx-auto">
          {/* Discount Code Input */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Have a discount code?
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => {
                  setDiscountCode(e.target.value.toUpperCase());
                  setDiscountApplied(null);
                  setError("");
                }}
                placeholder="Enter code (e.g., LUNARLIMITED)"
                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              />
              <button
                onClick={validateDiscountCode}
                disabled={!discountCode.trim() || !selectedPlan || validating}
                className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {validating ? "..." : "Apply"}
              </button>
            </div>

            {discountApplied && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">
                    {discountApplied.discount_percent}% discount applied!
                  </span>
                </div>
                <p className="mt-1 text-sm text-green-600 dark:text-green-500">
                  You save ${discountApplied.original_price - discountApplied.final_price} on your subscription.
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Subscribe Button */}
          <button
            onClick={handleSubscribe}
            disabled={!selectedPlan || loading}
            className="w-full py-4 bg-lime-500 hover:bg-lime-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-lime-500/25 hover:shadow-lime-500/40"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : selectedPlan ? (
              `Subscribe to ${PLANS.find((p) => p.type === selectedPlan)?.name} Plan`
            ) : (
              "Select a Plan"
            )}
          </button>

          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            By subscribing, you agree to our Terms of Service and Privacy Policy.
          </p>

          {/* Continue with Free option */}
          <div className="mt-6 text-center">
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
            >
              Continue with Free Plan →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
