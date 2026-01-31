import { getTenantFromHeaders } from "@/hooks/useTenantFromHeaders";
import { createClient } from "@supabase/supabase-js";
import MarketingPage from "./MarketingPage";
import TenantPortalLanding from "@/components/portal/TenantPortalLanding";
import PortalHeader from "@/components/portal/PortalHeader";
import PortalFooter from "@/components/portal/PortalFooter";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantFromHeaders();
  if (tenant.isSubdomainAccess && tenant.name) {
    const tenantUrl = `https://${tenant.subdomain}.1i1.ae`;
    return {
      title: `${tenant.name} - Events & More on OneToOne`,
      description: `Welcome to ${tenant.name} on OneToOne (1i1.ae). Discover upcoming events, hackathons, workshops, and more. Powered by OneToOne by Lunar Limited.`,
      keywords: [tenant.name, 'OneToOne', '1i1', 'events', tenant.subdomain || ''],
      openGraph: {
        type: 'website',
        url: tenantUrl,
        title: `${tenant.name} - OneToOne`,
        description: `Discover upcoming events and get involved with ${tenant.name}. Powered by OneToOne (1i1.ae).`,
        siteName: `${tenant.name} on OneToOne`,
        images: tenant.logoUrl
          ? [{ url: tenant.logoUrl, alt: tenant.name }]
          : [{ url: 'https://1i1.ae/Logo.svg', alt: 'OneToOne' }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${tenant.name} - OneToOne`,
        description: `Discover upcoming events and get involved with ${tenant.name}. Powered by OneToOne (1i1.ae).`,
        images: tenant.logoUrl ? [tenant.logoUrl] : ['https://1i1.ae/Logo.svg'],
      },
      alternates: {
        canonical: tenantUrl,
      },
    };
  }
  return {};
}

export default async function RootPage() {
  const tenant = await getTenantFromHeaders();

  if (!tenant.isSubdomainAccess) {
    return <MarketingPage />;
  }

  // Tenant subdomain — render the portal landing
  let portalSettings = null;
  let upcomingEvents: Array<{
    id: string;
    title: string;
    slug: string | null;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    location: string | null;
    is_virtual: boolean;
    cover_image: string | null;
    category: string | null;
    event_type: string | null;
  }> = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseServiceKey && tenant.tenantId) {
    try {
      const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

      const [settingsResult, eventsResult] = await Promise.all([
        serviceClient
          .from("tenant_portal_settings")
          .select("*")
          .eq("tenant_id", tenant.tenantId)
          .single(),
        serviceClient
          .from("events")
          .select("id, slug, title, description, start_date, end_date, location, is_virtual, cover_image, category, event_type")
          .eq("tenant_id", tenant.tenantId)
          .or("is_public.is.null,is_public.eq.true")
          .or("is_published.is.null,is_published.eq.true")
          .neq("status", "cancelled")
          .or(`start_date.gte.${new Date(new Date().setHours(0, 0, 0, 0)).toISOString()},end_date.gte.${new Date().toISOString()},start_date.is.null`)
          .order("start_date", { ascending: true })
          .limit(4),
      ]);

      if (settingsResult.data) {
        portalSettings = settingsResult.data;
      }
      if (eventsResult.data) {
        upcomingEvents = eventsResult.data;
      }
    } catch (e) {
      console.error("Error fetching portal data:", e);
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <PortalHeader
        tenantName={tenant.name || "Portal"}
        logoUrl={tenant.logoUrl}
        primaryColor={tenant.primaryColor}
      />
      <main className="flex-1">
        <TenantPortalLanding
          tenantName={tenant.name || "Portal"}
          logoUrl={tenant.logoUrl}
          primaryColor={tenant.primaryColor || "#84cc16"}
          portalSettings={portalSettings}
          upcomingEvents={upcomingEvents}
        />
      </main>
      <PortalFooter
        footerText={portalSettings?.footer_text}
        showFooter={portalSettings?.show_footer !== false}
        accentColor={portalSettings?.portal_accent_color || tenant.primaryColor}
      />
    </div>
  );
}
