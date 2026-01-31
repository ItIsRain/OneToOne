"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useRouter } from "next/navigation";

const DISMISS_KEY = "free_upgrade_modal_dismissed";
const DISMISS_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export default function FreeUpgradeModal() {
  const { planInfo, loading } = usePlanLimits();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const shouldShow = useCallback(() => {
    if (typeof window === "undefined") return false;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const ts = parseInt(dismissed, 10);
      if (Date.now() - ts < DISMISS_DURATION_MS) return false;
    }
    return true;
  }, []);

  // Fetch promo code from Stripe
  const fetchPromoCode = useCallback(async () => {
    setPromoLoading(true);
    try {
      const res = await fetch("/api/stripe/promo-code", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPromoCode(data.code);
      }
    } catch {
      // Silently fail — the modal still works without a code
    } finally {
      setPromoLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading || !planInfo) return;
    if (planInfo.planType !== "free") return;
    if (!shouldShow()) return;

    // Small delay so the dashboard loads first
    const timer = setTimeout(() => {
      setOpen(true);
      fetchPromoCode();
    }, 1200);

    return () => clearTimeout(timer);
  }, [loading, planInfo, shouldShow, fetchPromoCode]);

  const handleDismiss = () => {
    setOpen(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  const handleUpgrade = () => {
    handleDismiss();
    router.push("/dashboard/settings/billing");
  };

  const handleCopy = async () => {
    if (!promoCode) return;
    try {
      await navigator.clipboard.writeText(promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = promoCode;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!open) return null;

  return (
    <Modal isOpen={open} onClose={handleDismiss} className="max-w-lg mx-4 sm:mx-auto">
      <div className="p-6 sm:p-8">
        {/* Badge */}
        <div className="flex justify-center mb-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Limited Time Offer
          </span>
        </div>

        {/* Heading */}
        <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Upgrade &amp; Save 50%
        </h2>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
          Get <span className="font-semibold text-brand-500">50% off</span> your first month on any paid plan, plus a <span className="font-semibold text-brand-500">7-day free trial</span> to explore everything.
        </p>

        {/* Benefits */}
        <div className="space-y-2.5 mb-6">
          {[
            "Unlimited events, team members & storage",
            "CRM, invoicing, projects & client portal",
            "Advanced analytics & custom branding",
            "Cancel anytime during your trial",
          ].map((benefit) => (
            <div key={benefit} className="flex items-start gap-2.5">
              <svg className="w-4.5 h-4.5 mt-0.5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-300">{benefit}</span>
            </div>
          ))}
        </div>

        {/* Promo Code Box */}
        <div className="rounded-xl border-2 border-dashed border-brand-300 dark:border-brand-500/40 bg-brand-50/50 dark:bg-brand-500/5 p-4 mb-6">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 text-center uppercase tracking-wider">
            Your Promo Code
          </p>
          {promoLoading ? (
            <div className="flex justify-center py-2">
              <svg className="w-5 h-5 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : promoCode ? (
            <div className="flex items-center justify-center gap-2">
              <code className="text-lg sm:text-xl font-bold tracking-widest text-brand-600 dark:text-brand-400">
                {promoCode}
              </code>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors text-brand-500"
                title="Copy code"
              >
                {copied ? (
                  <svg className="w-4.5 h-4.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                )}
              </button>
            </div>
          ) : (
            <p className="text-center text-sm text-gray-400">Code unavailable</p>
          )}
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-2">
            Use this code at checkout to get 50% off your first month
          </p>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <button
            onClick={handleUpgrade}
            className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors shadow-sm text-sm"
          >
            Choose a Plan &amp; Upgrade
          </button>
          <button
            onClick={handleDismiss}
            className="w-full py-2.5 px-4 text-sm font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </Modal>
  );
}
