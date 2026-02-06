"use client";
import { useState, useEffect, useCallback } from "react";

interface PlatformAdmin {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export default function AdminSettingsPage() {
  const [admins, setAdmins] = useState<PlatformAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [adding, setAdding] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/settings");
      const data = await response.json();

      if (data.error) {
        console.error("Error fetching admins:", data.error);
        return;
      }

      setAdmins(data.admins || []);
      setCurrentUserEmail(data.currentUserEmail || null);
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const addAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    setAdding(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newAdminEmail.trim(),
          name: newAdminName.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
      } else {
        setNewAdminEmail("");
        setNewAdminName("");
        await fetchAdmins();
      }
    } catch (error) {
      console.error("Error adding admin:", error);
      alert("Failed to add admin");
    } finally {
      setAdding(false);
    }
  };

  const removeAdmin = async (admin: PlatformAdmin) => {
    if (admin.email === currentUserEmail) {
      alert("You cannot remove yourself as an admin");
      return;
    }

    if (admins.length <= 1) {
      alert("Cannot remove the last admin");
      return;
    }

    if (!confirm(`Are you sure you want to remove ${admin.email} as an admin?`)) return;

    try {
      const response = await fetch("/api/admin/settings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: admin.id, email: admin.email }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      await fetchAdmins();
    } catch (error) {
      console.error("Error removing admin:", error);
      alert("Failed to remove admin");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Settings</h2>
        <p className="text-gray-500 dark:text-gray-400">Manage super admins and platform configuration</p>
      </div>

      {/* Admin Management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Super Admins</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Users with full access to the admin panel
          </p>
        </div>

        {/* Add Admin Form */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="email"
                placeholder="Email address"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Name (optional)"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={addAdmin}
              disabled={adding || !newAdminEmail.trim()}
              className="px-6 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              {adding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Admin
                </>
              )}
            </button>
          </div>
        </div>

        {/* Admin List */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {admins.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
              No admins configured
            </div>
          ) : (
            admins.map((admin) => (
              <div key={admin.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                    <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
                      {(admin.name || admin.email)[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {admin.name || "Unnamed Admin"}
                      {admin.email === currentUserEmail && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(you)</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{admin.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Added {formatDate(admin.created_at)}
                  </span>
                  {admin.email !== currentUserEmail && (
                    <button
                      onClick={() => removeAdmin(admin)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Remove admin"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Security Note */}
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-amber-800 dark:text-amber-300">Security Notice</h4>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
              Super admins have full access to all platform data and settings. Only add trusted users as admins.
              Admin access is based on email address - the user must sign in with the exact email listed here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
