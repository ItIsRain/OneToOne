"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getTenantUrl, getSubdomainSuffix } from "@/lib/url";

type Step = "credentials" | "otp" | "mobile" | "onboarding" | "plan";

const COUNTRY_CODES = [
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+1", flag: "🇺🇸", name: "US" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+966", flag: "🇸🇦", name: "Saudi" },
  { code: "+974", flag: "🇶🇦", name: "Qatar" },
  { code: "+973", flag: "🇧🇭", name: "Bahrain" },
  { code: "+968", flag: "🇴🇲", name: "Oman" },
  { code: "+965", flag: "🇰🇼", name: "Kuwait" },
  { code: "+962", flag: "🇯🇴", name: "Jordan" },
  { code: "+961", flag: "🇱🇧", name: "Lebanon" },
  { code: "+20", flag: "🇪🇬", name: "Egypt" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+55", flag: "🇧🇷", name: "Brazil" },
  { code: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "+82", flag: "🇰🇷", name: "South Korea" },
  { code: "+60", flag: "🇲🇾", name: "Malaysia" },
  { code: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "+63", flag: "🇵🇭", name: "Philippines" },
  { code: "+92", flag: "🇵🇰", name: "Pakistan" },
  { code: "+90", flag: "🇹🇷", name: "Turkey" },
  { code: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "+34", flag: "🇪🇸", name: "Spain" },
  { code: "+52", flag: "🇲🇽", name: "Mexico" },
  { code: "+7", flag: "🇷🇺", name: "Russia" },
];

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

/* ------------------------------------------------------------------ */
/*  Phone validation helpers                                           */
/* ------------------------------------------------------------------ */

/** Minimum digit lengths per country code (without the country code itself) */
const PHONE_MIN_LENGTHS: Record<string, number> = {
  "+971": 9, "+1": 10, "+44": 10, "+91": 10, "+966": 9,
  "+974": 8, "+973": 8, "+968": 8, "+965": 8, "+962": 9,
  "+961": 7, "+20": 10, "+49": 10, "+33": 9, "+61": 9,
  "+81": 10, "+86": 11, "+55": 11, "+234": 10, "+27": 9,
  "+82": 10, "+60": 9, "+65": 8, "+63": 10, "+92": 10,
  "+90": 10, "+39": 10, "+34": 9, "+52": 10, "+7": 10,
};

function validatePhone(countryCode: string, number: string): string | null {
  const digits = number.replace(/\D/g, "");
  if (!digits) return "Phone number is required";
  const min = PHONE_MIN_LENGTHS[countryCode] ?? 7;
  if (digits.length < min) return `Enter at least ${min} digits`;
  if (digits.length > 15) return "Phone number is too long";
  return null;
}

function formatPhoneDisplay(digits: string): string {
  // Simple formatting: group in chunks of 3-4
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)} ${digits.slice(10)}`;
}

/* ------------------------------------------------------------------ */
/*  Password strength                                                  */
/* ------------------------------------------------------------------ */

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-orange-500" };
  if (score <= 3) return { score, label: "Good", color: "bg-yellow-500" };
  return { score, label: "Strong", color: "bg-green-500" };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SignUpForm() {
  const searchParams = useSearchParams();
  const preselectedPlan = searchParams.get("plan") || "";
  const [step, setStep] = useState<Step>("credentials");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    otp: ["", "", "", "", "", ""],
    countryCode: "+971",
    phoneNumber: "",
    useCase: "",
    subdomain: "",
    plan: "",
  });

  const updateFormData = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  // Resend OTP cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Validate phone on change
  useEffect(() => {
    if (!phoneTouched) return;
    setPhoneError(validatePhone(formData.countryCode, formData.phoneNumber));
  }, [formData.phoneNumber, formData.countryCode, phoneTouched]);

  /* ---------- Handlers ---------- */

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      setStep("otp");
      setResendCooldown(60);
      // Focus first OTP input after transition
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend OTP");
      setResendCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = useCallback(async (otpValue?: string) => {
    const code = otpValue ?? formData.otp.join("");
    if (code.length !== 6) return;
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp: code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");

      setStep("mobile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      // Clear OTP on error
      setFormData((prev) => ({ ...prev, otp: ["", "", "", "", "", ""] }));
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } finally {
      setIsLoading(false);
    }
  }, [formData.email, formData.otp]);

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...formData.otp];
    newOtp[index] = digit;
    updateFormData("otp", newOtp);

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (digit && index === 5) {
      const fullCode = newOtp.join("");
      if (fullCode.length === 6) {
        handleVerifyOTP(fullCode);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !formData.otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    updateFormData("otp", newOtp);
    // Focus the next empty or last input
    const nextIndex = Math.min(pasted.length, 5);
    otpInputsRef.current[nextIndex]?.focus();
    // Auto-submit if 6 digits pasted
    if (pasted.length === 6) {
      handleVerifyOTP(pasted);
    }
  };

  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneTouched(true);
    const err = validatePhone(formData.countryCode, formData.phoneNumber);
    if (err) {
      setPhoneError(err);
      return;
    }
    setStep("onboarding");
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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

    const phone = `${formData.countryCode}${formData.phoneNumber.replace(/\D/g, "")}`;
    const payload = { ...formData, otp: undefined, plan: selectedPlan, phone };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create account");

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
      }

      window.location.href = getTenantUrl(formData.subdomain, "/dashboard?subscribed=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------- Render helpers ---------- */

  const steps: Step[] = ["credentials", "otp", "mobile", "onboarding", "plan"];
  const stepLabels: Record<Step, string> = {
    credentials: "Account",
    otp: "Verify",
    mobile: "Phone",
    onboarding: "Portal",
    plan: "Plan",
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-1 mb-8">
      {steps.map((s, i) => {
        const isActive = step === s;
        const isPast = steps.indexOf(step) > i;
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                    : isPast
                    ? "bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"
                    : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                }`}
              >
                {isPast ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "text-brand-600 dark:text-brand-400" : isPast ? "text-brand-500 dark:text-brand-500" : "text-gray-400 dark:text-gray-500"}`}>
                {stepLabels[s]}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-6 h-0.5 mb-4 ${
                  isPast
                    ? "bg-brand-300 dark:bg-brand-700"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  /* ---- Step 1: Email & Password ---- */
  const renderCredentialsStep = () => {
    const strength = getPasswordStrength(formData.password);
    return (
      <form onSubmit={handleSendOTP}>
        <div className="space-y-5">
          <div>
            <Label>
              Email<span className="text-error-500">*</span>
            </Label>
            <Input
              type="email"
              placeholder="you@example.com"
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
                placeholder="Min. 8 characters"
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
            {formData.password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= strength.score ? strength.color : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs mt-1 ${strength.score <= 1 ? "text-red-500" : strength.score <= 2 ? "text-orange-500" : strength.score <= 3 ? "text-yellow-600" : "text-green-600"}`}>
                  {strength.label} password
                </p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-error-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || formData.password.length < 8}
            className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Sending code...
              </>
            ) : (
              "Continue"
            )}
          </button>

          <p className="text-xs text-center text-gray-400 dark:text-gray-500">
            We&apos;ll send a verification code to your email
          </p>
        </div>
      </form>
    );
  };

  /* ---- Step 2: OTP ---- */
  const renderOTPStep = () => (
    <form onSubmit={(e) => { e.preventDefault(); handleVerifyOTP(); }}>
      <div className="space-y-5">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-900/20 mb-4">
            <svg className="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            We sent a 6-digit code to
          </p>
          <p className="font-medium text-gray-900 dark:text-white">{formData.email}</p>
        </div>

        {/* 6-digit OTP boxes */}
        <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
          {formData.otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { otpInputsRef.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
              className={`w-12 h-14 text-center text-xl font-semibold rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20
                ${digit ? "border-brand-400 bg-brand-50 dark:bg-brand-900/20 dark:border-brand-600" : "border-gray-200 dark:border-gray-600 dark:bg-gray-800"}
                text-gray-900 dark:text-white
              `}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-center text-error-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading || formData.otp.join("").length !== 6}
          className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Verifying...
            </>
          ) : (
            "Verify Code"
          )}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={resendCooldown > 0 || isLoading}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : <>Didn&apos;t receive it? <span className="text-brand-500 font-medium">Resend</span></>
            }
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setStep("credentials");
            setFormData((prev) => ({ ...prev, otp: ["", "", "", "", "", ""] }));
          }}
          className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          &larr; Change email
        </button>
      </div>
    </form>
  );

  /* ---- Step 3: Mobile number ---- */
  const renderMobileStep = () => {
    const digits = formData.phoneNumber.replace(/\D/g, "");
    const displayNumber = formatPhoneDisplay(digits);
    const selectedCountry = COUNTRY_CODES.find((c) => c.code === formData.countryCode);

    return (
      <form onSubmit={handleMobileSubmit}>
        <div className="space-y-5">
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Add your mobile number for account security
            </p>
          </div>

          <div>
            <Label>
              Mobile Number<span className="text-error-500">*</span>
            </Label>
            <div className="flex gap-2 mt-1">
              <select
                value={formData.countryCode}
                onChange={(e) => updateFormData("countryCode", e.target.value)}
                className="h-11 rounded-lg border border-gray-300 bg-transparent px-2 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                style={{ minWidth: "120px" }}
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} {c.name}
                  </option>
                ))}
              </select>
              <div className="flex-1">
                <Input
                  type="tel"
                  placeholder="Enter phone number"
                  value={displayNumber}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    updateFormData("phoneNumber", raw);
                    if (!phoneTouched) setPhoneTouched(true);
                  }}
                  error={phoneTouched && !!phoneError}
                  required
                />
              </div>
            </div>
            {phoneTouched && phoneError && (
              <p className="mt-1.5 text-xs text-error-500">{phoneError}</p>
            )}
            {phoneTouched && !phoneError && digits.length > 0 && (
              <p className="mt-1.5 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Valid phone number
              </p>
            )}
          </div>

          {/* Preview */}
          {digits.length > 0 && !phoneError && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your full number</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedCountry?.flag} {formData.countryCode} {displayNumber}
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-error-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !digits}
            className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>

          <button
            type="button"
            onClick={() => setStep("otp")}
            className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            &larr; Back
          </button>
        </div>
      </form>
    );
  };

  /* ---- Step 4: Onboarding (name, use case, subdomain) ---- */
  const renderOnboardingStep = () => (
    <form onSubmit={handleComplete}>
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
            What will you use 1i1 for?<span className="text-error-500">*</span>
          </Label>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {useCaseOptions.map((option) => (
              <label
                key={option.value}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                  formData.useCase === option.value
                    ? "border-brand-500 bg-brand-50 dark:border-brand-600 dark:bg-brand-900/20"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
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
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {formData.useCase === option.value && (
                    <span className="w-2 h-2 rounded-full bg-brand-500" />
                  )}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
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
            <span className="inline-flex items-center px-4 py-3 text-sm text-gray-500 bg-gray-100 border border-l-0 border-gray-200 rounded-r-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">
              {getSubdomainSuffix()}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            This will be your unique portal URL
          </p>
        </div>

        {error && (
          <p className="text-sm text-error-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading || !formData.useCase || !formData.subdomain || !formData.firstName || !formData.lastName}
          className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Creating your portal..." : "Continue"}
        </button>

        <button
          type="button"
          onClick={() => setStep("mobile")}
          className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          &larr; Back
        </button>
      </div>
    </form>
  );

  /* ---- Step 5: Plan ---- */
  const renderPlanStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {planOptions.map((plan) => (
          <div
            key={plan.value}
            onClick={() => !isLoading && handleSelectPlan(plan.value)}
            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
              formData.plan === plan.value
                ? "border-brand-500 bg-brand-50 dark:border-brand-600 dark:bg-brand-900/20"
                : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {"popular" in plan && plan.popular && (
              <span className="absolute -top-2.5 right-4 px-2 py-0.5 bg-brand-500 text-white text-xs font-semibold rounded-full">
                Popular
              </span>
            )}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{plan.description}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">${plan.price}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">/mo</span>
              </div>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
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
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Creating your portal...</span>
        </div>
      )}

      <button
        type="button"
        onClick={() => setStep("onboarding")}
        className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      >
        &larr; Back
      </button>
    </div>
  );

  const getStepTitle = () => {
    switch (step) {
      case "credentials":
        return { title: "Create your account", subtitle: "Enter your email and set a password" };
      case "otp":
        return { title: "Verify your email", subtitle: "Enter the code we sent to your inbox" };
      case "mobile":
        return { title: "Add your phone", subtitle: "We'll use this for account recovery & notifications" };
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

          {step === "credentials" && renderCredentialsStep()}
          {step === "otp" && renderOTPStep()}
          {step === "mobile" && renderMobileStep()}
          {step === "onboarding" && renderOnboardingStep()}
          {step === "plan" && renderPlanStep()}

          {step === "credentials" && (
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
