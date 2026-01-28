"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getTenantUrl, getSubdomainSuffix } from "@/lib/url";

type Step = "details" | "otp" | "onboarding" | "plan";

const useCaseOptions = [
  { value: "events", label: "Event Management" },
  { value: "clients", label: "Client Portal" },
  { value: "invoicing", label: "Invoicing & Payments" },
  { value: "projects", label: "Project Management" },
  { value: "other", label: "Other" },
];

const planOptions = [
  {
    value: "free",
    name: "Free",
    price: "0",
    description: "Try the platform with basic features",
    features: [
      "3 events total",
      "2 team members",
      "500 MB storage",
      "Basic analytics",
    ],
  },
  {
    value: "starter",
    name: "Starter",
    price: "29",
    description: "For small teams getting started",
    features: [
      "10 events/month",
      "5 team members",
      "5 GB storage",
      "Email support",
      "Basic CRM & invoicing",
    ],
  },
  {
    value: "professional",
    name: "Professional",
    price: "79",
    description: "For growing organizations",
    features: [
      "50 events/month",
      "15 team members",
      "25 GB storage",
      "Priority support",
      "Full CRM & judging system",
    ],
    popular: true,
  },
  {
    value: "business",
    name: "Business",
    price: "199",
    description: "For large organizations",
    features: [
      "Unlimited events",
      "Unlimited team members",
      "100 GB storage",
      "Dedicated account manager",
      "White-label & SSO",
    ],
  },
];

export default function SignUpForm() {
  const searchParams = useSearchParams();
  const preselectedPlan = searchParams.get("plan") || "";
  const [step, setStep] = useState<Step>("details");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    otp: "",
    useCase: "",
    subdomain: "",
    plan: "",
  });

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp: formData.otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid OTP");
      }

      setStep("onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // If a plan was preselected from URL, skip the plan selection step
    const validPlans = planOptions.map((p) => p.value);
    if (preselectedPlan && validPlans.includes(preselectedPlan)) {
      handleSelectPlan(preselectedPlan);
      return;
    }
    setStep("plan");
  };

  const handleSelectPlan = async (selectedPlan: string) => {
    setIsLoading(true);
    setError("");

    const updatedFormData = { ...formData, plan: selectedPlan };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFormData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      // Sign in the user after registration
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        // Still redirect - they can sign in manually
      }

      // Redirect to dashboard on the tenant's subdomain
      window.location.href = getTenantUrl(formData.subdomain, "/dashboard?subscribed=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const steps: Step[] = ["details", "otp", "onboarding", "plan"];

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
              step === s
                ? "bg-brand-500 text-white"
                : steps.indexOf(step) > i
                ? "bg-brand-100 text-brand-600"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {i + 1}
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-8 h-0.5 ${
                steps.indexOf(step) > i
                  ? "bg-brand-200"
                  : "bg-gray-100"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderDetailsStep = () => (
    <form onSubmit={handleSendOTP}>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label>
              First Name<span className="text-error-500">*</span>
            </Label>
            <Input
              type="text"
              placeholder="Enter your first name"
              value={formData.firstName}
              onChange={(e) => updateFormData("firstName", e.target.value)}
              required
            />
          </div>
          <div>
            <Label>
              Last Name<span className="text-error-500">*</span>
            </Label>
            <Input
              type="text"
              placeholder="Enter your last name"
              value={formData.lastName}
              onChange={(e) => updateFormData("lastName", e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label>
            Email<span className="text-error-500">*</span>
          </Label>
          <Input
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => updateFormData("email", e.target.value)}
            required
          />
        </div>

        <div>
          <Label>
            Password<span className="text-error-500">*</span>
          </Label>
          <div className="relative">
            <Input
              placeholder="Enter your password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => updateFormData("password", e.target.value)}
              required
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
            >
              {showPassword ? (
                <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
              ) : (
                <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
              )}
            </span>
          </div>
        </div>

        {error && (
          <p className="text-sm text-error-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Sending..." : "Continue"}
        </button>
      </div>
    </form>
  );

  const renderOTPStep = () => (
    <form onSubmit={handleVerifyOTP}>
      <div className="space-y-5">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-50 mb-4">
            <svg className="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-600">
            We sent a verification code to
          </p>
          <p className="font-medium text-gray-900">{formData.email}</p>
        </div>

        <div>
          <Label>
            Verification Code<span className="text-error-500">*</span>
          </Label>
          <Input
            type="text"
            placeholder="Enter 6-digit code"
            value={formData.otp}
            onChange={(e) => updateFormData("otp", e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="text-center text-lg tracking-widest"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-error-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading || formData.otp.length !== 6}
          className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Verifying..." : "Verify"}
        </button>

        <button
          type="button"
          onClick={() => handleSendOTP({ preventDefault: () => {} } as React.FormEvent)}
          className="w-full text-sm text-gray-500 hover:text-gray-700"
        >
          Didn&apos;t receive the code? <span className="text-brand-500">Resend</span>
        </button>

        <button
          type="button"
          onClick={() => setStep("details")}
          className="w-full text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to details
        </button>
      </div>
    </form>
  );

  const renderOnboardingStep = () => (
    <form onSubmit={handleComplete}>
      <div className="space-y-5">
        <div>
          <Label>
            What will you use 1i1 for?<span className="text-error-500">*</span>
          </Label>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {useCaseOptions.map((option) => (
              <label
                key={option.value}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                  formData.useCase === option.value
                    ? "border-brand-500 bg-brand-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="useCase"
                  value={option.value}
                  checked={formData.useCase === option.value}
                  onChange={(e) => updateFormData("useCase", e.target.value)}
                  className="sr-only"
                />
                <span
                  className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    formData.useCase === option.value
                      ? "border-brand-500"
                      : "border-gray-300"
                  }`}
                >
                  {formData.useCase === option.value && (
                    <span className="w-2 h-2 rounded-full bg-brand-500" />
                  )}
                </span>
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label>
            Choose your portal URL<span className="text-error-500">*</span>
          </Label>
          <div className="flex items-center mt-2">
            <Input
              type="text"
              placeholder="yourcompany"
              value={formData.subdomain}
              onChange={(e) => updateFormData("subdomain", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              className="rounded-r-none"
              required
            />
            <span className="inline-flex items-center px-4 py-3 text-sm text-gray-500 bg-gray-100 border border-l-0 border-gray-200 rounded-r-lg">
              {getSubdomainSuffix()}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-gray-500">
            This will be your unique portal URL
          </p>
        </div>

        {error && (
          <p className="text-sm text-error-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading || !formData.useCase || !formData.subdomain}
          className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Creating your portal..." : "Continue"}
        </button>

        <button
          type="button"
          onClick={() => setStep("otp")}
          className="w-full text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back
        </button>
      </div>
    </form>
  );

  const renderPlanStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {planOptions.map((plan) => (
          <div
            key={plan.value}
            onClick={() => !isLoading && handleSelectPlan(plan.value)}
            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
              formData.plan === plan.value
                ? "border-brand-500 bg-brand-50"
                : "border-gray-200 hover:border-gray-300"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {"popular" in plan && plan.popular && (
              <span className="absolute -top-2.5 right-4 px-2 py-0.5 bg-brand-500 text-white text-xs font-semibold rounded-full">
                Popular
              </span>
            )}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{plan.description}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-900">${plan.price}</span>
                <span className="text-sm text-gray-500">/mo</span>
              </div>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <svg className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-error-500">{error}</p>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-sm text-gray-500">Creating your portal...</span>
        </div>
      )}

      <button
        type="button"
        onClick={() => setStep("onboarding")}
        className="w-full text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back
      </button>
    </div>
  );

  const getStepTitle = () => {
    switch (step) {
      case "details":
        return { title: "Create your account", subtitle: "Enter your details to get started" };
      case "otp":
        return { title: "Verify your email", subtitle: "We need to verify your email address" };
      case "onboarding":
        return { title: "Set up your portal", subtitle: "Tell us a bit about how you'll use 1i1" };
      case "plan":
        return { title: "Choose your plan", subtitle: "Select the plan that works best for you" };
    }
  };

  const { title, subtitle } = getStepTitle();

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5 px-4">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to home
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-4">
        <div>
          {renderStepIndicator()}

          <div className="mb-6">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          </div>

          {step === "details" && renderDetailsStep()}
          {step === "otp" && renderOTPStep()}
          {step === "onboarding" && renderOnboardingStep()}
          {step === "plan" && renderPlanStep()}

          {step === "details" && (
            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Already have an account?{" "}
                <Link
                  href="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign In
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
