"use client";
import React, { useState } from "react";
import { AddVenueModal } from "@/components/agency/modals";

const venues = [
  { id: 1, name: "Grand Ballroom", location: "Downtown Convention Center", capacity: 500, pricePerHour: "$500", rating: 4.8, image: "🏛️" },
  { id: 2, name: "Sky Lounge", location: "Hilltop Hotel, 45th Floor", capacity: 150, pricePerHour: "$350", rating: 4.9, image: "🌃" },
  { id: 3, name: "Garden Terrace", location: "Botanical Gardens", capacity: 200, pricePerHour: "$400", rating: 4.7, image: "🌳" },
  { id: 4, name: "Tech Hub Arena", location: "Innovation District", capacity: 1000, pricePerHour: "$800", rating: 4.6, image: "🏢" },
  { id: 5, name: "Waterfront Pavilion", location: "Harbor Marina", capacity: 300, pricePerHour: "$450", rating: 4.8, image: "⛵" },
  { id: 6, name: "Art Gallery Space", location: "Museum District", capacity: 100, pricePerHour: "$300", rating: 4.9, image: "🎨" },
];

export default function VenuesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Venues</h1>
            <p className="text-gray-500 dark:text-gray-400">Browse and book event venues</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Add Venue
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue) => (
            <div key={venue.id} className="rounded-2xl border border-gray-200 bg-white overflow-hidden dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-5xl">
                {venue.image}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 dark:text-white/90">{venue.name}</h3>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-yellow-500">★</span>
                    <span className="text-gray-600 dark:text-gray-400">{venue.rating}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-4">{venue.location}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Capacity: {venue.capacity}</span>
                  <span className="font-semibold text-brand-500">{venue.pricePerHour}/hr</span>
                </div>
                <button className="w-full mt-4 rounded-lg border border-brand-500 px-4 py-2 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10">
                  Book Venue
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddVenueModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
