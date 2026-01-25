"use client";
import React, { useState } from "react";
import { ComposeMessageModal } from "@/components/agency/modals";

const messages = [
  { id: 1, from: "Sarah Johnson", subject: "Project Update - Website Redesign", preview: "Hi team, I wanted to share the latest progress on the website redesign project...", time: "10:30 AM", unread: true },
  { id: 2, from: "Michael Chen", subject: "Re: API Documentation", preview: "Thanks for the feedback. I've made the updates you suggested and...", time: "9:45 AM", unread: true },
  { id: 3, from: "Emily Davis", subject: "Meeting Tomorrow", preview: "Just a reminder about our meeting tomorrow at 2 PM. Please come prepared with...", time: "Yesterday", unread: false },
  { id: 4, from: "James Wilson", subject: "Marketing Campaign Assets", preview: "I've uploaded all the marketing assets to the shared folder. Let me know if you need...", time: "Yesterday", unread: false },
  { id: 5, from: "Lisa Thompson", subject: "Venue Confirmation", preview: "Great news! The venue has confirmed our booking for the annual gala...", time: "Jan 23", unread: false },
];

export default function InboxPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Messages</h1>
            <p className="text-gray-500 dark:text-gray-400">Your team conversations</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Compose
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer dark:hover:bg-gray-800/50 ${message.unread ? "bg-brand-50/50 dark:bg-brand-500/5" : ""}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 font-semibold dark:bg-gray-800 dark:text-gray-400">
                    {message.from.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-medium ${message.unread ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                        {message.from}
                      </h4>
                      <span className="text-xs text-gray-500">{message.time}</span>
                    </div>
                    <p className={`text-sm mb-1 ${message.unread ? "font-medium text-gray-800 dark:text-white/90" : "text-gray-600 dark:text-gray-400"}`}>
                      {message.subject}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{message.preview}</p>
                  </div>
                  {message.unread && (
                    <div className="w-2 h-2 rounded-full bg-brand-500 mt-2" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ComposeMessageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} type="message" />
    </>
  );
}
