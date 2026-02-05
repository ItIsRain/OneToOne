"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { getBaseDomain, isLocalDev } from "@/lib/url";

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
 * Returns ".; Domain=.{baseDomain}" in production, empty for localhost.
 */
function getCookieDomainAttr(): string {
  if (typeof window === "undefined") return "";
  if (isLocalDev()) return "";
  const base = getBaseDomain();
  const host = window.location.hostname;
  if (host === base || host.endsWith(`.${base}`)) {
    return `; Domain=.${base}`;
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

  // Guards to prevent the infinite token-refresh loop.
  // When a refresh token is invalid, Supabase's internal Realtime auth
  // listener can create a cycle: refresh fails → session removed →
  // Realtime re-auths → getSession → refresh → fail → repeat.
  // These refs ensure we only process the first SIGNED_OUT and redirect once.
  const hadSessionRef = useRef(false);
  const isRedirectingRef = useRef(false);
  const profileUserIdRef = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string, signal?: AbortSignal) => {
    if (signal?.aborted) return null;
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (signal?.aborted) return null;
    // Only update if we got valid data — don't clear existing profile on transient errors
    if (profileData) {
      setProfile(profileData);
      profileUserIdRef.current = userId;
    }
    return profileData;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    // Auth pages handle their own auth flow; skip heavy init to prevent
    // race conditions between getUser() token refresh and signInWithPassword().
    const AUTH_PAGES = ["/signin", "/signup", "/reset-password", "/update-password"];
    const isAuthPage = typeof window !== "undefined" &&
      AUTH_PAGES.includes(window.location.pathname);

    const init = async () => {
      // ── Session-only check (cross-subdomain via cookies) ──
      const wasSessionOnly = getCookie("1i1_was_session_only");
      const stillActive = getCookie("1i1_session_active");

      if (wasSessionOnly && !stillActive) {
        clearSessionOnlyCookies();
        localStorage.removeItem("last_login_session_only");
        await supabase.auth.signOut({ scope: "local" });
        if (!signal.aborted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          // Only redirect if not already on an auth page
          if (!isAuthPage) {
            isRedirectingRef.current = true;
            window.location.href = "/signin";
          }
        }
        return;
      }

      // On auth pages, skip getUser() to avoid stale token refresh racing
      // with the sign-in form's signInWithPassword() call.
      if (isAuthPage) {
        if (!signal.aborted) {
          setLoading(false);
        }
        return;
      }

      // ── Normal session initialization ──
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (signal.aborted) return;

      setUser(currentUser ?? null);

      if (currentUser) {
        hadSessionRef.current = true;
        await fetchProfile(currentUser.id, signal);
      }

      if (!signal.aborted) {
        setLoading(false);
      }
    };

    init();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isRedirectingRef.current || signal.aborted) return;

        if (event === "INITIAL_SESSION") return;

        if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile(null);
          profileUserIdRef.current = null;
          setLoading(false);

          // Don't redirect to /signin if already on an auth page — the
          // sign-in form manages its own flow and redirecting here would
          // set isRedirectingRef, blocking the subsequent SIGNED_IN event.
          if (hadSessionRef.current && !isAuthPage) {
            isRedirectingRef.current = true;
            window.location.href = "/signin";
          }
          return;
        }

        // On auth pages, don't fetch profile - the sign-in/signup forms
        // handle their own navigation and we don't want to interfere
        if (isAuthPage && session?.user) {
          hadSessionRef.current = true;
          setUser(session.user);
          setLoading(false);
          return;
        }

        if (session?.user && !signal.aborted) {
          hadSessionRef.current = true;
          setUser(session.user);
          // Skip profile re-fetch on token refreshes if we already have it for this user
          if (profileUserIdRef.current !== session.user.id) {
            await fetchProfile(session.user.id, signal);
          }
        }

        if (!signal.aborted) {
          setLoading(false);
        }
      }
    );

    return () => {
      abortController.abort();
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    isRedirectingRef.current = true;
    clearSessionOnlyCookies();
    try {
      await supabase.auth.signOut();
    } catch {
      // Proceed with redirect even if Supabase signOut fails
    }
    setUser(null);
    setProfile(null);
    profileUserIdRef.current = null;
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
