"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  eventColor: string;
  ticketPrice: number | null;
  currency: string | null;
}

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
];

const PHONE_MIN: Record<string, number> = {
  "+971": 9, "+1": 10, "+44": 10, "+91": 10, "+966": 9,
};

const Icons = {
  check: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  mail: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  phone: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  arrow: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  ),
  eye: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  eyeOff: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ),
};

export default function RegistrationModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  eventColor,
  ticketPrice,
  currency,
}: RegistrationModalProps) {
  const [step, setStep] = useState<"details" | "otp" | "phone">("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+971");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Phone validation
  useEffect(() => {
    if (!phoneTouched) return;
    const digits = phone.replace(/\D/g, "");
    const min = PHONE_MIN[countryCode] ?? 7;
    if (digits.length > 0 && digits.length < min) {
      setPhoneError(`Minimum ${min} digits required`);
    } else {
      setPhoneError(null);
    }
  }, [phone, countryCode, phoneTouched]);

  // OTP cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCooldown]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setStep("otp");
      setOtpCooldown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = useCallback(async (code?: string) => {
    const otpCode = code ?? otp.join("");
    if (otpCode.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");
      setStep("phone");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }, [email, otp]);

  const handleResendOTP = async () => {
    setError("");
    setOtp(["", "", "", "", "", ""]);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to resend");
      }
      setOtpCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    const min = PHONE_MIN[countryCode] ?? 7;
    if (digits.length < min) {
      setPhoneError(`Minimum ${min} digits required`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const fullPhone = `${countryCode}${digits}`;
      const res = await fetch(`/api/events/public/${eventId}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          name,
          email,
          password,
          phone: fullPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      if (data.token) {
        localStorage.setItem(`attendee_token_${eventId}`, data.token);
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("details");
    setName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setOtp(["", "", "", "", "", ""]);
    setPhone("");
    setCountryCode("+971");
    setPhoneError(null);
    setPhoneTouched(false);
    setOtpCooldown(0);
    setSuccess(false);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  const stepLabels = [
    { key: "details", label: "Details" },
    { key: "otp", label: "Verify" },
    { key: "phone", label: "Phone" },
  ];
  const steps = ["details", "otp", "phone"];
  const currentIdx = steps.indexOf(step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {success ? (
          <div className="p-8 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${eventColor}15` }}
            >
              <svg className="w-8 h-8" style={{ color: eventColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Registration Successful!</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You have successfully registered for {eventTitle}. Check your email for confirmation details.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2.5 text-white font-medium rounded-xl transition-colors"
              style={{ backgroundColor: eventColor }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Register for Event</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{eventTitle}</p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Step Indicator */}
              <div className="flex items-center justify-between mb-6">
                {stepLabels.map((s, i) => {
                  const isDone = i < currentIdx;
                  const isActive = i === currentIdx;
                  return (
                    <React.Fragment key={s.key}>
                      {i > 0 && (
                        <div className={`flex-1 h-0.5 mx-2 rounded ${isDone ? "bg-green-500" : "bg-gray-200 dark:bg-gray-600"}`} />
                      )}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isDone
                              ? "bg-green-500 text-white"
                              : isActive
                              ? "text-white"
                              : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                          }`}
                          style={isActive ? { backgroundColor: eventColor } : undefined}
                        >
                          {isDone ? Icons.check : i + 1}
                        </div>
                        <span className={`text-[10px] mt-1 ${isActive ? "font-semibold text-gray-900 dark:text-white" : "text-gray-400"}`}>
                          {s.label}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Step 1: Details */}
              {step === "details" && (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder="Min 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2.5 pr-12 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                        style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? Icons.eyeOff : Icons.eye}
                      </button>
                    </div>
                  </div>
                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{error}</div>
                  )}
                  {ticketPrice && ticketPrice > 0 && (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Registration Fee</span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {currency || "$"}{ticketPrice}
                      </span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-6 text-white font-semibold rounded-xl transition-all disabled:opacity-50 hover:opacity-90 flex items-center justify-center gap-2"
                    style={{ backgroundColor: eventColor }}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Continue {Icons.arrow}</>
                    )}
                  </button>
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    By registering, you agree to the event terms and conditions.
                  </p>
                </form>
              )}

              {/* Step 2: OTP Verification */}
              {step === "otp" && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: `${eventColor}15` }}>
                      {Icons.mail}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Enter the 6-digit code sent to</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm mt-1">{email}</p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    {otp.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          const next = [...otp];
                          next[i] = val;
                          setOtp(next);
                          if (val && i < 5) otpRefs.current[i + 1]?.focus();
                          if (val && i === 5 && next.join("").length === 6) handleVerifyOTP(next.join(""));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                          const next = [...otp];
                          for (let j = 0; j < pasted.length; j++) next[j] = pasted[j];
                          setOtp(next);
                          if (pasted.length === 6) handleVerifyOTP(pasted);
                        }}
                        className="w-11 h-12 text-center text-lg font-bold rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all"
                        style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                      />
                    ))}
                  </div>
                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center">{error}</div>
                  )}
                  {loading && (
                    <div className="flex justify-center">
                      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${eventColor}40`, borderTopColor: eventColor }} />
                    </div>
                  )}
                  <div className="text-center">
                    <button
                      type="button"
                      disabled={otpCooldown > 0}
                      onClick={handleResendOTP}
                      className="text-sm font-medium disabled:opacity-50 transition-colors"
                      style={{ color: eventColor }}
                    >
                      {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : "Resend Code"}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setStep("details"); setError(""); }}
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    &#8592; Back to details
                  </button>
                </div>
              )}

              {/* Step 3: Phone Number */}
              {step === "phone" && (
                <form onSubmit={handleComplete} className="space-y-4">
                  <div className="text-center mb-2">
                    <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: `${eventColor}15` }}>
                      {Icons.phone}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Enter your phone number to complete registration
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number *</label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-24 px-2 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 text-sm transition-all"
                        style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value.replace(/[^\d\s-]/g, "")); setPhoneTouched(true); }}
                        required
                        className={`flex-1 px-4 py-2.5 rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                          phoneError ? "border-red-400" : "border-gray-200 dark:border-gray-600"
                        }`}
                        style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                        placeholder="50 123 4567"
                      />
                    </div>
                    {phoneError && (
                      <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                    )}
                  </div>
                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{error}</div>
                  )}
                  <button
                    type="submit"
                    disabled={loading || !!phoneError}
                    className="w-full py-3 px-6 text-white font-semibold rounded-xl transition-all disabled:opacity-50 hover:opacity-90 flex items-center justify-center gap-2"
                    style={{ backgroundColor: eventColor }}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Complete Registration {Icons.arrow}</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep("otp"); setError(""); }}
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    &#8592; Back
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
