"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

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
  social_links?: Record<string, string>;
  looking_for_team?: boolean;
  status: string;
  registered_at?: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  max_members: number;
  is_open: boolean;
  looking_for_members: boolean;
}

interface EventInfo {
  id: string;
  title: string;
  slug: string;
  event_type: string;
  color?: string;
  requirements?: Record<string, unknown>;
}

interface AttendeeContextType {
  attendee: Attendee | null;
  team: Team | null;
  teamRole: string | null;
  event: EventInfo | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  updateProfile: (data: Partial<Attendee>) => Promise<{ success: boolean; error?: string }>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  company?: string;
  skills?: string[];
  bio?: string;
}

const AttendeeContext = createContext<AttendeeContextType | undefined>(undefined);

export function AttendeeProvider({
  children,
  eventSlug,
}: {
  children: React.ReactNode;
  eventSlug: string;
}) {
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [teamRole, setTeamRole] = useState<string | null>(null);
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const storageKey = `attendee_token_${eventSlug}`;

  const refreshSession = useCallback(async () => {
    const storedToken = localStorage.getItem(storageKey);
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/events/public/${eventSlug}/auth`, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAttendee(data.attendee);
        setTeam(data.team);
        setTeamRole(data.teamRole);
        setEvent(data.event);
        setToken(storedToken);
      } else {
        localStorage.removeItem(storageKey);
        setToken(null);
        setAttendee(null);
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
      localStorage.removeItem(storageKey);
    } finally {
      setIsLoading(false);
    }
  }, [eventSlug, storageKey]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`/api/events/public/${eventSlug}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      localStorage.setItem(storageKey, data.token);
      setToken(data.token);
      await refreshSession();

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Login failed" };
    }
  };

  const register = async (registerData: RegisterData) => {
    try {
      const response = await fetch(`/api/events/public/${eventSlug}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", ...registerData }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      localStorage.setItem(storageKey, data.token);
      setToken(data.token);
      await refreshSession();

      return { success: true };
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, error: "Registration failed" };
    }
  };

  const logout = () => {
    localStorage.removeItem(storageKey);
    setToken(null);
    setAttendee(null);
    setTeam(null);
    setTeamRole(null);
  };

  const updateProfile = async (data: Partial<Attendee>) => {
    if (!token) return { success: false, error: "Not authenticated" };

    try {
      const response = await fetch(`/api/events/public/${eventSlug}/attendees`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error };
      }

      setAttendee(result.attendee);
      return { success: true };
    } catch (error) {
      console.error("Update profile error:", error);
      return { success: false, error: "Failed to update profile" };
    }
  };

  return (
    <AttendeeContext.Provider
      value={{
        attendee,
        team,
        teamRole,
        event,
        token,
        isLoading,
        isAuthenticated: !!attendee,
        login,
        register,
        logout,
        refreshSession,
        updateProfile,
      }}
    >
      {children}
    </AttendeeContext.Provider>
  );
}

export function useAttendee() {
  const context = useContext(AttendeeContext);
  if (context === undefined) {
    throw new Error("useAttendee must be used within an AttendeeProvider");
  }
  return context;
}
