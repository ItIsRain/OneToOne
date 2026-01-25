"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AvatarUpload from "./AvatarUpload";

function capitalizeName(str: string): string {
  if (!str) return "";
  return str
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function UserMetaCard() {
  const { profile, loading, refreshProfile } = useAuth();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const fullName = profile
    ? `${capitalizeName(profile.first_name)} ${capitalizeName(profile.last_name)}`
    : "Loading...";

  const location = profile?.city && profile?.country
    ? `${profile.city}, ${profile.country}`
    : profile?.country || "";

  const initials = profile
    ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`
    : "U";

  const displayRole = profile?.bio || (profile?.role ? capitalizeName(profile.role) : "");

  const handleAvatarUploadComplete = async () => {
    await refreshProfile();
  };

  if (loading) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 animate-pulse">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
          <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-2">
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <button
              onClick={() => setIsAvatarModalOpen(true)}
              className="relative w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 flex items-center justify-center bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400 text-2xl font-semibold group cursor-pointer"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="user"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initials.toUpperCase()}</span>
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            </button>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {fullName}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                {displayRole && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {displayRole}
                  </p>
                )}
                {location && (
                  <>
                    {displayRole && (
                      <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {location}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AvatarUpload
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onUploadComplete={handleAvatarUploadComplete}
      />
    </>
  );
}
