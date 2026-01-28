import { createBrowserClient } from "@supabase/ssr";

function getCookieDomain(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const host = window.location.hostname;
  // For *.1i1.ae subdomains, share cookies across all subdomains
  if (host === "1i1.ae" || host.endsWith(".1i1.ae")) {
    return ".1i1.ae";
  }
  // Localhost / dev — don't set a domain so the browser uses the current host
  return undefined;
}

export function createClient() {
  const cookieDomain = getCookieDomain();

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        domain: cookieDomain,
        path: "/",
        sameSite: "lax",
        secure: typeof window !== "undefined" && window.location.protocol === "https:",
      },
    }
  );
}
