"use client";
import React, { useState, useEffect } from "react";

// Types for FindMyVenue API
interface FindMyVenueBasicDetails {
  venueName: string;
  hotelName?: string;
  groupName?: string;
  venueDescription?: string;
}

interface FindMyVenueAdditionalDetails {
  venueView?: string[];
  venueSetting?: string[];
  venueStyle?: Record<string, string[]>;
  venueHire?: string[];
}

interface FindMyVenueLocation {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  area?: string;
  country?: string;
}

interface FindMyVenueCapacity {
  standing?: string | number;
  sitting?: string | number;
  venueSize?: string | number;
  unit?: string;
}

interface FindMyVenuePricing {
  "Minimum Spend Pricing"?: { minSpend: string }[];
  "Min spend per person"?: { minSpend: string }[];
  "Venue Hire Pricing"?: { minSpend: string }[];
}

interface FindMyVenueType {
  venueType?: string[];
  venueRepresent?: string;
}

interface FindMyVenueCatering {
  venueProvideInHouseCatering?: boolean;
  externalCatering?: boolean;
  alcoholLiquorLicense?: boolean;
}

interface FindMyVenueAudio {
  indoorMusicAllowed?: boolean;
  indoorMusicAllowedTime?: string;
  outdoorMusicAllowed?: boolean;
  clientsCanBringOwnDJ?: boolean;
}

interface FindMyVenue {
  _id: string;
  itemStatus?: string;
  basicDetails: FindMyVenueBasicDetails;
  additionalDetails?: FindMyVenueAdditionalDetails;
  location?: FindMyVenueLocation;
  capacity?: FindMyVenueCapacity;
  pricing?: FindMyVenuePricing;
  venueType?: FindMyVenueType;
  cateringAndDrinks?: FindMyVenueCatering;
  audio?: FindMyVenueAudio;
  imagesAndVideos?: {
    images?: string[];
    coverPhoto?: string;
  };
}

interface FindMyVenueApiResponse {
  total: number;
  totalPages: number;
  currentPage: string | number;
  venues: FindMyVenue[];
}

const FINDMYVENUE_API_URL = "https://api.findmyvenue.com/api/venues/get-all";

// UAE Emirates
const UAE_EMIRATES = [
  { value: "Dubai", label: "Dubai" },
  { value: "Abu Dhabi", label: "Abu Dhabi" },
  { value: "Sharjah", label: "Sharjah" },
  { value: "Ajman", label: "Ajman" },
  { value: "Umm Al Quwain", label: "Umm Al Quwain" },
  { value: "Ras Al Khaimah", label: "Ras Al Khaimah" },
  { value: "Fujairah", label: "Fujairah" },
];

// Event Types with Categories and Sub-items
const EVENT_TYPES: Record<string, string[]> = {
  "Conference/Seminars": [
    "Annual General meeting", "Auctions", "Board Meetings", "Breakout", "Conference",
    "Conventions", "Executive Summits", "Exhibitions", "Meetings", "Networking",
    "Presentation", "Press Conference", "Product Launch", "Seminars", "Symposium",
    "Trade Shows", "Workshops"
  ],
  "Corporate Events": [
    "Activity Day", "Award Ceremony", "Away day", "Brainstorm", "Charity event",
    "Corporate Gala dinner", "Corporate Reception", "Corporate Retreat", "FAM Trip",
    "Fundraiser", "Incentive trip", "Office Party", "Outdoor Activity", "Pop Up event",
    "PR events", "Promotional Events", "Staff Party", "Summer Party", "Team Building",
    "Training Program"
  ],
  "Weddings": [
    "Wedding", "Arabic Wedding", "Beach Wedding", "Christian Wedding", "Church Wedding",
    "Civil Partnership", "Civil Wedding", "Garden Wedding", "Hindu Wedding", "Indian Wedding",
    "Marquee Wedding", "Outdoor Wedding", "Unique Wedding", "Wedding Ceremony", "Wedding Reception"
  ],
  "Social Gathering": [
    "BBQ", "Anniversary Party", "Cocktail Masterclass", "Cocktail Reception", "Communion",
    "Condolences", "Drinks Reception", "Engagement", "Farewell Party", "Funeral reception",
    "Graduation Party", "New Years Eve Party", "Party", "Private Party", "Retirement Party",
    "Reunions", "Stag Party", "Wine Tasting"
  ],
  "Milestone Birthdays": [
    "16th Birthday Party", "18th Birthday Party", "21st Birthday Party", "25th Birthday Party",
    "30th Birthday Party", "40th Birthday Party", "50th Birthday Party", "Birthday Party"
  ],
  "Tea Party/Showers": [
    "Afternoon Tea", "Baby Christening", "Baby Shower", "Bachelorette/Bachelor Party",
    "Bridal Shower", "High Tea"
  ],
  "Teen/Children": [
    "Children Birthday Party", "Kids Party", "Teen Party"
  ],
  "Special Big Events": [
    "Gender Reveals", "Proposals"
  ],
  "Cultural Celebrations": [
    "Brunches", "Christmas dinner", "Christmas Party", "Diwali", "Eid", "Halloween Party",
    "Holiday Party", "Iftar", "Ladies night", "Ramadan", "Suhoor", "Xmas Party"
  ],
  "Filming, Photography & Media": [
    "Filming/Video Recording", "Photoshoot", "Podcast Recording"
  ],
  "Cultural": [
    "Book Launch", "Film Festival", "Music Festival"
  ],
  "Art Spaces": [
    "Art Exhibitions"
  ],
  "Performances & Exhibitions": [
    "Concert", "Dance Performance", "Fashion Show", "GIG", "Live Performance", "Performing Arts"
  ]
};

// Venue Types
const VENUE_TYPES = [
  "Adventure venue", "Amphitheatre", "Aquarium", "Art Gallery", "Art studio",
  "Auditorium", "Ballroom", "Banquet Hall", "Bar", "Beach", "Beach club",
  "Blank canvas", "Boats & Yachts", "Cafes", "Church", "Cinema",
  "Co-working space", "Community center", "Concert hall", "Conference center",
  "Courtyard", "Dance Studio", "Desert", "Entertainment venue", "Escape Rooms",
  "EXPO", "Farm", "Fine dining restaurant", "Garden", "Golf courses", "Helipad",
  "Karaoke bar", "Kids play area", "Lawn", "Limousine", "Meeting Center",
  "Meeting room", "Museum", "Nightclub", "Night Life", "Park", "Party bus",
  "Patio", "Photo studio", "Poolside", "Recording studio", "Restaurant",
  "Restaurant/Bar", "Restaurant/Lounge & Bar", "Rooftop", "Rooftop restaurant",
  "Social clubs and lounges", "Spa", "Sports club", "Sports venue", "Stadium",
  "Streaming studio", "Supper club", "Temple", "Terrace", "Theme Park",
  "Therapy room", "Training room", "TV film studio", "Warehouse", "Yoga Studio", "Zoo",
];

// Image Carousel Component
function ImageCarousel({ images, venueName }: { images: string[]; venueName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!images || images.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-6xl bg-gray-200 dark:bg-gray-800">
        🏛️
      </div>
    );
  }

  return (
    <div className="relative h-full group">
      <img
        src={images[currentIndex]}
        alt={`${venueName} - Image ${currentIndex + 1}`}
        className="w-full h-full object-cover"
      />

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800/80 flex items-center justify-center text-gray-800 dark:text-white hover:bg-white dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          >
            ←
          </button>
          <button
            onClick={goToNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800/80 flex items-center justify-center text-gray-800 dark:text-white hover:bg-white dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          >
            →
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? "bg-white w-4"
                  : "bg-white/50 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/50 text-white text-xs">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
}

// Helper to generate FindMyVenue URL
function getFindMyVenueUrl(venue: FindMyVenue): string {
  const slug = venue.basicDetails.venueName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
  return `https://www.findmyvenue.com/preview/hpv/${venue._id}/${slug}`;
}

// Enquiry Modal Component
function EnquiryModal({ venue, onClose }: { venue: FindMyVenue; onClose: () => void }) {
  const venueImages = venue.imagesAndVideos?.images || [];
  const findMyVenueUrl = getFindMyVenueUrl(venue);

  const handleSendEnquiry = () => {
    window.open(findMyVenueUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with image carousel */}
        <div className="relative h-64 bg-gray-200 dark:bg-gray-800">
          <ImageCarousel images={venueImages} venueName={venue.basicDetails.venueName} />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 shadow-lg"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Venue Info */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
              {venue.basicDetails.venueName}
            </h2>
            {venue.basicDetails.hotelName && (
              <p className="text-gray-500 dark:text-gray-400">{venue.basicDetails.hotelName}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {getVenueLocation(venue)}
            </p>
          </div>

          {/* Overview Icons */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Overview</h3>
            <div className="flex flex-wrap gap-3">
              {venue.additionalDetails?.venueHire?.includes("Exclusive") && (
                <div className="flex flex-col items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg min-w-[100px]">
                  <span className="text-2xl mb-1">🔒</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Exclusive</span>
                </div>
              )}
              {venue.capacity?.sitting && (
                <div className="flex flex-col items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg min-w-[100px]">
                  <span className="text-2xl mb-1">🪑</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Upto {venue.capacity.sitting} Sitting</span>
                </div>
              )}
              {venue.capacity?.standing && (
                <div className="flex flex-col items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg min-w-[100px]">
                  <span className="text-2xl mb-1">👥</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Upto {venue.capacity.standing} Standing</span>
                </div>
              )}
              {venue.cateringAndDrinks?.venueProvideInHouseCatering && (
                <div className="flex flex-col items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg min-w-[100px]">
                  <span className="text-2xl mb-1">🍽️</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Offers catering</span>
                </div>
              )}
              {venue.cateringAndDrinks?.externalCatering && (
                <div className="flex flex-col items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg min-w-[100px]">
                  <span className="text-2xl mb-1">📦</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Outside Catering</span>
                </div>
              )}
            </div>
          </div>

          {/* Highlights */}
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Highlights</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Venue Type</p>
                <p className="text-sm text-gray-800 dark:text-white">
                  {venue.venueType?.venueType?.join(", ") || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Setting</p>
                <p className="text-sm text-gray-800 dark:text-white">
                  {venue.additionalDetails?.venueSetting?.map(s => `${s} Space`).join(", ") || "N/A"}
                </p>
              </div>
            </div>

            {/* Additional highlights */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              {venue.cateringAndDrinks?.alcoholLiquorLicense && (
                <span className="text-gray-600 dark:text-gray-400">🍷 Alcohol/Liquor License</span>
              )}
              {venue.audio?.clientsCanBringOwnDJ && (
                <span className="text-gray-600 dark:text-gray-400">🎧 Bring your own DJ</span>
              )}
              {venue.audio?.indoorMusicAllowed && (
                <span className="text-gray-600 dark:text-gray-400">
                  🎵 Indoor music allowed {venue.audio.indoorMusicAllowedTime ? `until ${venue.audio.indoorMusicAllowedTime}` : ""}
                </span>
              )}
              {venue.audio?.outdoorMusicAllowed && (
                <span className="text-gray-600 dark:text-gray-400">🎶 Outdoor music allowed</span>
              )}
            </div>
          </div>

          {/* Description */}
          {venue.basicDetails.venueDescription && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">About This Venue</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {venue.basicDetails.venueDescription}
              </p>
            </div>
          )}

          {/* Send Enquiry Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="bg-lime-50 dark:bg-lime-900/20 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                To send an enquiry for this venue, you'll be redirected to FindMyVenue where you can submit your event details directly to the venue.
              </p>
            </div>
            <button
              onClick={handleSendEnquiry}
              className="w-full py-3 bg-lime-500 text-white rounded-lg font-medium hover:bg-lime-600 transition-colors flex items-center justify-center gap-2"
            >
              Send Enquiry on FindMyVenue
              <span>↗</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getVenueImage(venue: FindMyVenue): string {
  const images = venue.imagesAndVideos?.images;
  if (images && images.length > 0) {
    // Images are stored as direct URLs (strings)
    return images[0];
  }
  if (venue.imagesAndVideos?.coverPhoto) {
    return venue.imagesAndVideos.coverPhoto;
  }
  return "";
}

function getVenueLocation(venue: FindMyVenue): string {
  const location = venue.location;
  if (!location) return "";
  const parts = [location.area, location.city].filter(Boolean);
  return parts.join(", ");
}

function formatPrice(venue: FindMyVenue): { text: string; type: string } {
  const pricing = venue.pricing;
  if (!pricing) return { text: "Contact for pricing", type: "" };

  if (pricing["Minimum Spend Pricing"]?.[0]?.minSpend) {
    return {
      text: `AED ${Number(pricing["Minimum Spend Pricing"][0].minSpend).toLocaleString()}`,
      type: "Min. spend"
    };
  }
  if (pricing["Min spend per person"]?.[0]?.minSpend) {
    return {
      text: `AED ${Number(pricing["Min spend per person"][0].minSpend).toLocaleString()}`,
      type: "Per person"
    };
  }
  if (pricing["Venue Hire Pricing"]?.[0]?.minSpend) {
    return {
      text: `AED ${Number(pricing["Venue Hire Pricing"][0].minSpend).toLocaleString()}`,
      type: "Venue hire"
    };
  }
  return { text: "Contact for pricing", type: "" };
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<FindMyVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVenues, setTotalVenues] = useState(0);
  const [selectedVenue, setSelectedVenue] = useState<FindMyVenue | null>(null);

  // Filters
  const [selectedCity, setSelectedCity] = useState("Dubai");
  const [selectedEventCategory, setSelectedEventCategory] = useState("");
  const [selectedEventType, setSelectedEventType] = useState("");
  const [selectedVenueType, setSelectedVenueType] = useState("");
  const [standingGuests, setStandingGuests] = useState("");
  const [sittingGuests, setSittingGuests] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchVenues = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = new URL(FINDMYVENUE_API_URL);
      apiUrl.searchParams.set("page", page.toString());
      apiUrl.searchParams.set("limit", "24");
      apiUrl.searchParams.set("city", selectedCity);

      if (standingGuests) {
        apiUrl.searchParams.set("standingGuests", standingGuests);
      }
      if (sittingGuests) {
        apiUrl.searchParams.set("seatedGuests", sittingGuests);
      }

      // Event type filter - uses format: eventTypes[Category][0]=SubType
      if (selectedEventCategory && selectedEventType) {
        apiUrl.searchParams.set(`eventTypes[${selectedEventCategory}][0]`, selectedEventType);
      }

      if (selectedVenueType) {
        apiUrl.searchParams.set("venueTypes", selectedVenueType);
      }

      const response = await fetch(apiUrl.toString(), {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch venues: ${response.status}`);
      }

      const data: FindMyVenueApiResponse = await response.json();
      setVenues(data.venues || []);
      setTotalPages(data.totalPages || 1);
      setTotalVenues(data.total || 0);
      setCurrentPage(Number(data.currentPage) || 1);
    } catch (err) {
      console.error("Error fetching venues:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues(currentPage);
  }, [currentPage, selectedCity, selectedEventCategory, selectedEventType, selectedVenueType, standingGuests, sittingGuests]);

  const handleCategoryChange = (category: string) => {
    setSelectedEventCategory(category);
    setSelectedEventType(""); // Reset sub-type when category changes
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedEventCategory("");
    setSelectedEventType("");
    setSelectedVenueType("");
    setStandingGuests("");
    setSittingGuests("");
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedEventCategory || selectedEventType || selectedVenueType || standingGuests || sittingGuests;

  return (
    <div className="space-y-6">
      {/* Enquiry Modal */}
      {selectedVenue && (
        <EnquiryModal venue={selectedVenue} onClose={() => setSelectedVenue(null)} />
      )}

      {/* Disclaimer Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-500/30 dark:bg-orange-500/10">
        <span className="mt-0.5 text-orange-500 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </span>
        <p className="text-sm text-orange-800 dark:text-orange-200">
          All venues listed on this page are sourced from{" "}
          <a href="https://www.findmyvenue.com/" target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:no-underline">
            FindMyVenue
          </a>{" "}
          and are not owned by, operated by, or affiliated with us. For enquiries, you will be redirected to FindMyVenue directly.
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Venues</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {loading ? "Loading..." : `${totalVenues} venues in ${selectedCity}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
                : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            Filters {hasActiveFilters && `(${[selectedEventCategory, selectedVenueType, standingGuests, sittingGuests].filter(Boolean).length})`}
          </button>

          {/* City Filter */}
          <select
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              handleFilterChange();
            }}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {UAE_EMIRATES.map((emirate) => (
              <option key={emirate.value} value={emirate.value}>
                {emirate.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 dark:text-white">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-brand-500 hover:text-brand-600"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Event Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event Category
              </label>
              <select
                value={selectedEventCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All Categories</option>
                {Object.keys(EVENT_TYPES).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Sub-Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event Type
              </label>
              <select
                value={selectedEventType}
                onChange={(e) => {
                  setSelectedEventType(e.target.value);
                  handleFilterChange();
                }}
                disabled={!selectedEventCategory}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {selectedEventCategory ? "All Types" : "Select category first"}
                </option>
                {selectedEventCategory && EVENT_TYPES[selectedEventCategory]?.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Venue Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Venue Type
              </label>
              <select
                value={selectedVenueType}
                onChange={(e) => {
                  setSelectedVenueType(e.target.value);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All Venue Types</option>
                {VENUE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Standing Guests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Standing Guests
              </label>
              <input
                type="number"
                value={standingGuests}
                onChange={(e) => {
                  setStandingGuests(e.target.value);
                  handleFilterChange();
                }}
                placeholder="Enter number"
                min="0"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Sitting Guests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Seated Guests
              </label>
              <input
                type="number"
                value={sittingGuests}
                onChange={(e) => {
                  setSittingGuests(e.target.value);
                  handleFilterChange();
                }}
                placeholder="Enter number"
                min="0"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedEventCategory && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 text-sm">
              {selectedEventCategory}{selectedEventType ? `: ${selectedEventType}` : ""}
              <button onClick={() => { setSelectedEventCategory(""); setSelectedEventType(""); handleFilterChange(); }} className="hover:text-brand-900 ml-1">×</button>
            </span>
          )}
          {selectedVenueType && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 text-sm">
              {selectedVenueType}
              <button onClick={() => { setSelectedVenueType(""); handleFilterChange(); }} className="hover:text-brand-900 ml-1">×</button>
            </span>
          )}
          {standingGuests && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 text-sm">
              {standingGuests} standing
              <button onClick={() => { setStandingGuests(""); handleFilterChange(); }} className="hover:text-brand-900 ml-1">×</button>
            </span>
          )}
          {sittingGuests && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 text-sm">
              {sittingGuests} seated
              <button onClick={() => { setSittingGuests(""); handleFilterChange(); }} className="hover:text-brand-900 ml-1">×</button>
            </span>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => fetchVenues(currentPage)}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && venues.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-5xl mb-4">🏛️</div>
          <p className="text-gray-500 dark:text-gray-400">No venues found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Try adjusting your filters</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-brand-500 hover:text-brand-600 text-sm font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Venues Grid */}
      {!loading && !error && venues.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((venue) => {
              const priceInfo = formatPrice(venue);
              const venueImage = getVenueImage(venue);

              return (
                <div
                  key={venue._id}
                  onClick={() => setSelectedVenue(venue)}
                  className="rounded-2xl border border-gray-200 bg-white overflow-hidden dark:border-gray-800 dark:bg-white/[0.03] cursor-pointer hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 transition-all"
                >
                  {/* Image */}
                  <div className="h-48 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                    {venueImage ? (
                      <img
                        src={venueImage}
                        alt={venue.basicDetails.venueName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-5xl">
                        🏛️
                      </div>
                    )}
                    {/* Verified Badge */}
                    {venue.itemStatus === "Approved" && (
                      <span className="absolute top-3 right-3 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                        Verified
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Name and Hotel */}
                    <h3 className="font-semibold text-gray-800 dark:text-white/90 line-clamp-1 mb-1">
                      {venue.basicDetails.venueName}
                      {venue.basicDetails.hotelName && `, ${venue.basicDetails.hotelName}`}
                    </h3>

                    {/* Location */}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {getVenueLocation(venue)}
                    </p>

                    {/* Capacity Row */}
                    <div className="flex items-center gap-4 mb-3 text-sm">
                      {venue.capacity?.sitting && (
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <span>🪑</span>
                          <span>{venue.capacity.sitting}</span>
                        </div>
                      )}
                      {venue.capacity?.standing && (
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <span>👥</span>
                          <span>{venue.capacity.standing}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags Row */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {venue.venueType?.venueType?.slice(0, 1).map((type, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded dark:bg-gray-800 dark:text-gray-400"
                        >
                          {type}
                        </span>
                      ))}
                      {venue.additionalDetails?.venueSetting?.map((setting, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded dark:bg-gray-800 dark:text-gray-400"
                        >
                          {setting}
                        </span>
                      ))}
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                      <div>
                        <p className="text-lg font-semibold text-lime-600">{priceInfo.text}</p>
                        {priceInfo.type && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{priceInfo.type}</p>
                        )}
                      </div>
                      <button
                        className="px-4 py-2 bg-lime-500 text-white text-sm rounded-lg hover:bg-lime-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVenue(venue);
                        }}
                      >
                        Enquire
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
