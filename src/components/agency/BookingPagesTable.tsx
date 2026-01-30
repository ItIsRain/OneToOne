"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { AddBookingPageModal } from "./modals";
import { BookingPageDetailsSidebar } from "./sidebars";

export interface BookingPage {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  buffer_before: number;
  buffer_after: number;
  form_id: string | null;
  assigned_member_id: string | null;
  location_type: "video" | "phone" | "in_person" | "custom";
  location_details: string | null;
  min_notice_hours: number;
  max_advance_days: number;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const locationLabels: Record<string, string> = {
  video: "Video Call",
  phone: "Phone Call",
  in_person: "In Person",
  custom: "Custom",
};

export const BookingPagesTable = () => {
  const [bookingPages, setBookingPages] = useState<BookingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<BookingPage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingPage, setViewingPage] = useState<BookingPage | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const fetchBookingPages = useCallback(async () => {
    try {
      const res = await fetch("/api/booking-pages");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch booking pages");
      }

      setBookingPages(data.bookingPages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch booking pages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookingPages();
  }, [fetchBookingPages]);

  const handleViewPage = (page: BookingPage) => {
    setViewingPage(page);
  };

  const handleAddPage = () => {
    setEditingPage(null);
    setIsModalOpen(true);
  };

  const handleEditPage = (page: BookingPage) => {
    setEditingPage(page);
    setIsModalOpen(true);
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking page?")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/booking-pages/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete booking page");
      }

      setBookingPages(bookingPages.filter(p => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete booking page");
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingPage(null);
  };

  const handlePageSaved = (page: BookingPage) => {
    if (editingPage) {
      setBookingPages(bookingPages.map(p => p.id === page.id ? page : p));
    } else {
      setBookingPages([page, ...bookingPages]);
    }
    handleModalClose();
  };

  const handleCopySlug = async (slug: string) => {
    const url = `${window.location.origin}/book/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch {
      // fallback
      alert(`Booking URL: ${url}`);
    }
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <p className="text-error-500">{error}</p>
        <button
          onClick={fetchBookingPages}
          className="mt-2 text-brand-500 hover:text-brand-600"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Booking Pages
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {bookingPages.length} {bookingPages.length === 1 ? "page" : "pages"} total
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAddPage}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Booking Page
            </button>
          </div>
        </div>

        {bookingPages.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No booking pages yet
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating your first booking page.
            </p>
            <button
              onClick={handleAddPage}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              Add Booking Page
            </button>
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Slug
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Duration
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Location
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {bookingPages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell className="py-3">
                      <button
                        onClick={() => handleViewPage(page)}
                        className="font-medium text-gray-800 text-theme-sm dark:text-white/90 hover:text-brand-500 dark:hover:text-brand-400 text-left"
                      >
                        {page.name}
                      </button>
                      {page.description && (
                        <span className="block text-gray-500 text-theme-xs dark:text-gray-400 truncate max-w-[200px]">
                          {page.description}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-theme-sm dark:text-gray-400 font-mono">
                          /book/{page.slug}
                        </span>
                        <button
                          onClick={() => handleCopySlug(page.slug)}
                          className="text-gray-400 hover:text-brand-500 transition-colors"
                          title="Copy booking link"
                        >
                          {copiedSlug === page.slug ? (
                            <svg className="w-4 h-4 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {page.duration_minutes} min
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge size="sm" color="primary">
                        {locationLabels[page.location_type] || page.location_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        size="sm"
                        color={page.is_active ? "success" : "error"}
                      >
                        {page.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditPage(page)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePage(page.id)}
                          disabled={deletingId === page.id}
                          className="text-error-500 hover:text-error-600 disabled:opacity-50"
                        >
                          {deletingId === page.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AddBookingPageModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handlePageSaved}
        bookingPage={editingPage}
      />

      <BookingPageDetailsSidebar
        isOpen={!!viewingPage}
        onClose={() => setViewingPage(null)}
        bookingPage={viewingPage}
        onEdit={(page) => {
          setViewingPage(null);
          handleEditPage(page);
        }}
        onDelete={handleDeletePage}
      />
    </>
  );
};
