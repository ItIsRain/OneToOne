"use client";
import React, { useState } from "react";
import { ComposeMessageModal } from "@/components/agency/modals";

const emails = [
  { id: 1, from: "john@acmecorp.com", subject: "Re: Contract Renewal", preview: "Thank you for sending over the contract. We've reviewed it and have a few questions...", time: "11:20 AM", unread: true, starred: true },
  { id: 2, from: "marketing@techstart.io", subject: "Product Launch Invitation", preview: "You're invited to the exclusive launch event of our new product line...", time: "10:15 AM", unread: true, starred: false },
  { id: 3, from: "support@software.com", subject: "Your subscription is expiring", preview: "Your annual subscription will expire in 7 days. Renew now to avoid...", time: "9:30 AM", unread: false, starred: false },
  { id: 4, from: "events@venue.com", subject: "Booking Confirmation #2847", preview: "Your venue booking has been confirmed. Here are the details...", time: "Yesterday", unread: false, starred: true },
  { id: 5, from: "newsletter@industry.com", subject: "Weekly Industry Digest", preview: "This week's top stories in the events industry...", time: "Yesterday", unread: false, starred: false },
];

export default function EmailPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Email</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your email inbox</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Compose Email
          </button>
        </div>

        <div className="flex gap-4">
          <div className="w-48 hidden lg:block">
            <div className="space-y-1">
              <button className="w-full text-left px-4 py-2 rounded-lg bg-brand-50 text-brand-600 font-medium dark:bg-brand-500/10 dark:text-brand-400">Inbox (2)</button>
              <button className="w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">Sent</button>
              <button className="w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">Drafts</button>
              <button className="w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">Starred</button>
              <button className="w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">Archive</button>
              <button className="w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">Trash</button>
            </div>
          </div>

          <div className="flex-1 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer dark:hover:bg-gray-800/50 ${email.unread ? "bg-brand-50/50 dark:bg-brand-500/5" : ""}`}
                >
                  <div className="flex items-start gap-4">
                    <button className={`text-xl ${email.starred ? "text-yellow-500" : "text-gray-300 hover:text-yellow-500"}`}>
                      ★
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-sm ${email.unread ? "font-semibold text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>
                          {email.from}
                        </h4>
                        <span className="text-xs text-gray-500">{email.time}</span>
                      </div>
                      <p className={`text-sm mb-1 ${email.unread ? "font-medium text-gray-800 dark:text-white/90" : "text-gray-600 dark:text-gray-400"}`}>
                        {email.subject}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{email.preview}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ComposeMessageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} type="email" />
    </>
  );
}
