"use client";
import Link from "next/link";
import { useState } from "react";

const pricingPlans = [
  {
    name: "Free",
    type: "free",
    price: { monthly: 0, yearly: 0 },
    description: "Perfect for trying out the platform",
    features: [
      "3 events total",
      "2 team members",
      "500 MB storage",
      "Basic analytics",
      "Community support",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Starter",
    type: "starter",
    price: { monthly: 29, yearly: 279 },
    description: "For small agencies and freelancers",
    features: [
      "10 events/month",
      "5 team members",
      "5 GB storage",
      "Basic CRM features",
      "Email support",
      "Logo branding",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    type: "professional",
    price: { monthly: 79, yearly: 758 },
    description: "For growing agencies and organizers",
    features: [
      "50 events/month",
      "15 team members",
      "25 GB storage",
      "Full CRM & Invoicing",
      "Judging system",
      "Priority support",
      "Custom branding",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Business",
    type: "business",
    price: { monthly: 199, yearly: 1910 },
    description: "For large agencies and enterprises",
    features: [
      "Unlimited events",
      "Unlimited team members",
      "100 GB storage",
      "White-label branding",
      "SSO/SAML integration",
      "24/7 priority support",
      "Dedicated account manager",
      "99.9% SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const faqs = [
  {
    question: "Is there a free plan?",
    answer: "Yes! We offer a free plan that includes 3 events, 2 team members, and 500MB storage. It's perfect for trying out the platform with no credit card required.",
  },
  {
    question: "Can I switch plans later?",
    answer: "Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any differences.",
  },
  {
    question: "Do you have any discount codes?",
    answer: "Yes! Use the code LUNARLIMITED at checkout for 100% off any paid plan. This is a limited-time offer for early adopters.",
  },
  {
    question: "Is my data secure?",
    answer: "Security is our top priority. We use bank-level encryption, regular backups, and comply with GDPR and SOC 2 standards.",
  },
  {
    question: "What kind of support do you offer?",
    answer: "Free plans get community support. Starter plans include email support. Professional plans get priority email support. Business customers get a dedicated account manager and 24/7 support.",
  },
];

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
              Simple, transparent
              <span className="block text-lime-500">pricing</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400">
              Choose the plan that fits your organization. Start free and upgrade anytime.
            </p>

            {/* Billing Toggle */}
            <div className="mt-8 flex justify-center">
              <div className="inline-flex items-center gap-4 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <button
                  onClick={() => setBillingInterval("monthly")}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    billingInterval === "monthly"
                      ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval("yearly")}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    billingInterval === "yearly"
                      ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  Yearly
                  <span className="px-2 py-0.5 bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 text-xs font-semibold rounded-full">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-6 items-start">
            {pricingPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`relative bg-white dark:bg-gray-900 rounded-2xl transition-all duration-300 ${
                  plan.popular
                    ? "border-2 border-lime-500 lg:-mt-4 lg:mb-4 shadow-xl shadow-lime-500/10"
                    : "border border-gray-200 dark:border-gray-800"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-lime-500 text-white">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-6 lg:p-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {plan.description}
                  </p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                      ${plan.price[billingInterval]}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      /{billingInterval === "yearly" ? "year" : "month"}
                    </span>
                  </div>

                  {billingInterval === "yearly" && plan.price.monthly > 0 && (
                    <p className="mt-1 text-sm text-lime-600 dark:text-lime-400">
                      Save ${(plan.price.monthly * 12) - plan.price.yearly}/year
                    </p>
                  )}

                  <Link
                    href={`/signup?plan=${plan.type}`}
                    className={`mt-6 w-full py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center ${
                      plan.popular
                        ? "bg-lime-500 text-white hover:bg-lime-600"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {plan.cta}
                  </Link>

                  <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-medium uppercase tracking-wider mb-4 text-gray-400">
                      What's included
                    </p>
                    <ul className="space-y-3">
                      {plan.features.map((feature, fidx) => (
                        <li key={fidx} className="flex items-start gap-3">
                          <svg className={`w-5 h-5 flex-shrink-0 ${plan.popular ? "text-lime-500" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
            All plans include SSL security, daily backups, and 99.9% uptime SLA. Use code{" "}
            <span className="font-semibold text-lime-600 dark:text-lime-400">LUNARLIMITED</span> for 100% off!
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`bg-white dark:bg-gray-800 rounded-xl border overflow-hidden transition-all duration-300 ${
                  openFaq === idx
                    ? "border-lime-500 shadow-lg"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${openFaq === idx ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5">
                    <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
