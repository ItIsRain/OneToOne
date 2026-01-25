"use client";
import React, { useState } from "react";
import { AddContactModal } from "@/components/agency/modals";

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  lastContact: string;
}

const contactsData: Contact[] = [
  { id: 1, name: "John Smith", email: "john@acme.com", phone: "+1 555-0101", company: "Acme Corp", role: "CEO", lastContact: "2 days ago" },
  { id: 2, name: "Emily Davis", email: "emily@techstart.io", phone: "+1 555-0102", company: "TechStart", role: "CTO", lastContact: "1 week ago" },
  { id: 3, name: "Michael Brown", email: "michael@global.com", phone: "+1 555-0103", company: "GlobalTech", role: "Marketing Director", lastContact: "3 days ago" },
  { id: 4, name: "Lisa Johnson", email: "lisa@creative.co", phone: "+1 555-0104", company: "Creative Co", role: "Project Manager", lastContact: "Today" },
  { id: 5, name: "David Wilson", email: "david@metro.events", phone: "+1 555-0105", company: "Metro Events", role: "Event Coordinator", lastContact: "5 days ago" },
];

export default function ContactsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Contacts</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your business contacts</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Add Contact
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contactsData.map((contact) => (
            <div key={contact.id} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-semibold dark:bg-brand-500/20 dark:text-brand-400">
                    {contact.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white/90">{contact.name}</h3>
                    <p className="text-sm text-gray-500">{contact.role}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600 dark:text-gray-400">{contact.company}</p>
                <p className="text-gray-500">{contact.email}</p>
                <p className="text-gray-500">{contact.phone}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-xs text-gray-400">Last contact: {contact.lastContact}</span>
                <button className="text-brand-500 hover:text-brand-600 text-sm font-medium">View</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
