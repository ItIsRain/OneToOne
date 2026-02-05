"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import EventAttendeesTable from "@/components/agency/EventAttendeesTable";
import AddAttendeeModal from "@/components/agency/modals/AddAttendeeModal";
import AttendeeDetailsSidebar from "@/components/agency/sidebars/AttendeeDetailsSidebar";

interface Attendee {
  id: string;
  email: string;
  name: string;
  phone?: string;
  company?: string;
  job_title?: string;
  avatar_url?: string;
  skills?: string[];
  bio?: string;
  status: string;
  looking_for_team?: boolean;
  registered_at: string;
  last_login_at?: string;
  team?: { id: string; name: string } | null;
  team_role?: string | null;
  submission?: { id: string; title: string; status: string } | null;
}

interface EventInfo {
  id: string;
  title: string;
  event_type: string;
}

interface Stats {
  total: number;
  confirmed: number;
  attended: number;
  no_show: number;
  declined: number;
  looking_for_team: number;
}

export default function EventAttendeesPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [showDetailsSidebar, setShowDetailsSidebar] = useState(false);

  const fetchAttendees = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(`/api/events/${eventId}/attendees?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch attendees");
      }

      const data = await response.json();
      setAttendees(data.attendees || []);
      setEvent(data.event);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load attendees");
    } finally {
      setLoading(false);
    }
  }, [eventId, searchQuery, statusFilter]);

  useEffect(() => {
    fetchAttendees();
  }, [fetchAttendees]);

  const handleViewAttendee = (attendee: Attendee) => {
    setSelectedAttendee(attendee);
    setShowDetailsSidebar(true);
  };

  const handleUpdateAttendee = async (id: string, data: Partial<Attendee>) => {
    try {
      const response = await fetch(`/api/events/${eventId}/attendees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update attendee");
      }

      await fetchAttendees();
      if (selectedAttendee?.id === id) {
        const updated = await response.json();
        setSelectedAttendee(updated.attendee);
      }
    } catch (err) {
      console.error("Error updating attendee:", err);
    }
  };

  const handleDeleteAttendee = async (id: string) => {
    if (!confirm("Are you sure you want to remove this attendee?")) return;

    try {
      const response = await fetch(`/api/events/${eventId}/attendees/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete attendee");
      }

      await fetchAttendees();
      if (selectedAttendee?.id === id) {
        setShowDetailsSidebar(false);
        setSelectedAttendee(null);
      }
    } catch (err) {
      console.error("Error deleting attendee:", err);
    }
  };

  const handleConvertToLead = async (attendeeId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/attendees/convert-to-lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendeeId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.leadId) {
          alert(`Lead already exists with this email. Lead ID: ${data.leadId}`);
        } else {
          throw new Error(data.error || "Failed to convert to lead");
        }
        return;
      }

      alert("Successfully converted to lead!");
      router.push(`/dashboard/crm/leads`);
    } catch (err) {
      console.error("Error converting to lead:", err);
      alert(err instanceof Error ? err.message : "Failed to convert to lead");
    }
  };

  const handleAddAttendee = async (data: Partial<Attendee>) => {
    try {
      const response = await fetch(`/api/events/${eventId}/attendees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add attendee");
      }

      setShowAddModal(false);
      await fetchAttendees();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add attendee");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400">Loading attendees...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard/events")}
            className="text-blue-500 hover:underline"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle={`${event?.title || "Event"} - Attendees`} />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Confirmed</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-green-600">{stats.attended}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Attended</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-red-600">{stats.no_show}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">No Show</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-gray-600">{stats.declined}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Declined</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-purple-600">{stats.looking_for_team}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Looking for Team</p>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="declined">Declined</option>
          <option value="maybe">Maybe</option>
          <option value="attended">Attended</option>
          <option value="no_show">No Show</option>
        </select>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Attendee
        </button>
      </div>

      {/* Attendees Table */}
      <EventAttendeesTable
        attendees={attendees}
        eventType={event?.event_type || "general"}
        onView={handleViewAttendee}
        onUpdateStatus={(id, status) => handleUpdateAttendee(id, { status })}
        onDelete={handleDeleteAttendee}
        onConvertToLead={handleConvertToLead}
      />

      {/* Add Attendee Modal */}
      {showAddModal && (
        <AddAttendeeModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddAttendee}
        />
      )}

      {/* Attendee Details Sidebar */}
      {showDetailsSidebar && selectedAttendee && (
        <AttendeeDetailsSidebar
          attendee={selectedAttendee}
          eventId={eventId}
          eventType={event?.event_type || "general"}
          onClose={() => {
            setShowDetailsSidebar(false);
            setSelectedAttendee(null);
          }}
          onUpdate={(data) => handleUpdateAttendee(selectedAttendee.id, data)}
          onDelete={() => handleDeleteAttendee(selectedAttendee.id)}
          onConvertToLead={() => handleConvertToLead(selectedAttendee.id)}
        />
      )}
    </div>
  );
}
