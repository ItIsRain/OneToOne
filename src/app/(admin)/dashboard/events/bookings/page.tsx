"use client";
import React, { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NewBookingModal } from "@/components/agency/modals";

const bookings = [
  { id: 1, event: "Product Launch", venue: "Grand Ballroom", client: "TechStart", date: "Feb 15, 2025", time: "10:00 AM - 4:00 PM", status: "Confirmed", amount: "$3,000" },
  { id: 2, event: "Annual Gala", venue: "Sky Lounge", client: "Metro Events", date: "Feb 20, 2025", time: "6:00 PM - 11:00 PM", status: "Confirmed", amount: "$1,750" },
  { id: 3, event: "Workshop", venue: "Tech Hub Arena", client: "GrowthIO", date: "Feb 25, 2025", time: "9:00 AM - 5:00 PM", status: "Pending", amount: "$6,400" },
  { id: 4, event: "Networking Event", venue: "Waterfront Pavilion", client: "Creative Co", date: "Mar 5, 2025", time: "5:00 PM - 9:00 PM", status: "Pending", amount: "$1,800" },
  { id: 5, event: "Conference", venue: "Grand Ballroom", client: "Acme Corp", date: "Mar 12, 2025", time: "8:00 AM - 6:00 PM", status: "Confirmed", amount: "$5,000" },
];

export default function BookingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Bookings</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage venue bookings and reservations</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            New Booking
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Event</TableCell>
                <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Venue</TableCell>
                <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Date & Time</TableCell>
                <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Client</TableCell>
                <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Amount</TableCell>
                <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Status</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="py-4 px-6 font-medium text-gray-800 dark:text-white/90">{booking.event}</TableCell>
                  <TableCell className="py-4 px-6 text-gray-500">{booking.venue}</TableCell>
                  <TableCell className="py-4 px-6">
                    <div>
                      <p className="text-gray-800 dark:text-white/90">{booking.date}</p>
                      <p className="text-xs text-gray-500">{booking.time}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-gray-500">{booking.client}</TableCell>
                  <TableCell className="py-4 px-6 font-medium text-gray-800 dark:text-white/90">{booking.amount}</TableCell>
                  <TableCell className="py-4 px-6">
                    <Badge size="sm" color={booking.status === "Confirmed" ? "success" : "warning"}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <NewBookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
