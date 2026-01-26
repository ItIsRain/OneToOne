"use client";
import React, { useState } from "react";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  eventColor: string;
  ticketPrice: number | null;
  currency: string | null;
}

export default function RegistrationModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  eventColor,
  ticketPrice,
  currency,
}: RegistrationModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/events/public/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Registration failed");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", email: "", phone: "", company: "", notes: "" });
    setSuccess(false);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {success ? (
          <div className="p-8 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${eventColor}15` }}
            >
              <svg
                className="w-8 h-8"
                style={{ color: eventColor }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Registration Successful!
            </h3>
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
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Register for Event
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {eventTitle}
                  </p>
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 234 567 890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    placeholder="Acme Inc."
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Any special requirements or questions..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none"
                  style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Price Info */}
              {ticketPrice && ticketPrice > 0 && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Registration Fee</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currency || "$"}{ticketPrice}
                  </span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 text-white font-semibold rounded-xl transition-all disabled:opacity-50 hover:opacity-90 flex items-center justify-center gap-2"
                style={{ backgroundColor: eventColor }}
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : ticketPrice && ticketPrice > 0 ? (
                  `Register & Pay ${currency || "$"}${ticketPrice}`
                ) : (
                  "Complete Registration"
                )}
              </button>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                By registering, you agree to the event terms and conditions.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
