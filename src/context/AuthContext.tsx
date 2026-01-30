"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  phone: string | null;
  bio: string | null;
  country: string | null;
  city: string | null;
  postal_code: string | null;
  tax_id: string | null;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  updateProfile: async () => ({ success: false }),
});

/**
 * Read a cookie by name from document.cookie.
 */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Cookie domain for cross-subdomain sharing.
 * Returns ".1i1.ae" in production, undefined for localhost.
 */
function getCookieDomainAttr(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname;
  if (host === "1i1.ae" || host.endsWith(".1i1.ae")) {
    return "; Domain=.1i1.ae";
  }
  return "";
}

/**
 * Set the session-only cookies. Uses two cookies shared across subdomains:
 *   - `1i1_session_active` — session cookie (no Max-Age) that disappears on browser close
 *   - `1i1_was_session_only` — persistent cookie (24h) marking that session-only was chosen
 */
export function setSessionOnlyCookies() {
  const domain = getCookieDomainAttr();
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  // Session cookie — disappears when browser closes
  document.cookie = `1i1_session_active=1; Path=/${domain}; SameSite=Lax${secure}`;
  // Persistent marker — survives browser close (24h)
  document.cookie = `1i1_was_session_only=1; Path=/${domain}; SameSite=Lax${secure}; Max-Age=86400`;
}

/**
 * Clear the session-only cookies (used when "Keep me logged in" is checked).
 */
export function clearSessionOnlyCookies() {
  const domain = getCookieDomainAttr();
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `1i1_session_active=; Path=/${domain}; SameSite=Lax${secure}; Max-Age=0`;
  document.cookie = `1i1_was_session_only=; Path=/${domain}; SameSite=Lax${secure}; Max-Age=0`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchProfile = useCallback(async (userId: string) => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    setProfile(profileData);
    return profileData;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // ── Session-only check (cross-subdomain via cookies) ──
      // `1i1_was_session_only` persists across browser restarts.
      // `1i1_session_active` is a session cookie — gone after browser close.
      // If was_session_only exists but session_active doesn't, the browser
      // was closed → sign out and redirect.
      const wasSessionOnly = getCookie("1i1_was_session_only");
      const stillActive = getCookie("1i1_session_active");

      if (wasSessionOnly && !stillActive) {
        // Clear the persistent marker
        clearSessionOnlyCookies();
        // Also clear legacy localStorage flags
        localStorage.removeItem("last_login_session_only");
        // Sign out — AWAIT so it completes before anything else happens
        await supabase.auth.signOut();
        if (!cancelled) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          window.location.href = "/signin";
        }
        return; // Don't proceed to fetch session
      }

      // ── Normal session initialization ──
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (cancelled) return;

      setUser(currentUser ?? null);

      if (currentUser) {
        await fetchProfile(currentUser.id);
      }

      if (!cancelled) {
        setLoading(false);
      }
    };

    init();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    clearSessionOnlyCookies();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = "/signin";
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error };
      }

      // Update local state
      setProfile(data.profile);
      return { success: true };
    } catch (error) {
      return { success: false, error: "Something went wrong" };
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
