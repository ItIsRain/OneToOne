import { getTenantFromHeaders } from "@/hooks/useTenantFromHeaders";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import PortalHeader from "@/components/portal/PortalHeader";
import PortalFooter from "@/components/portal/PortalFooter";
import EventsListing from "./EventsListing";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantFromHeaders();
  if (tenant.isSubdomainAccess && tenant.name) {
    const tenantUrl = `https://${tenant.subdomain}.1i1.ae/events`;
    return {
      title: `Events - ${tenant.name}`,
      description: `Browse all upcoming events, hackathons, workshops, and conferences from ${tenant.name}. Powered by OneToOne (1i1.ae) by Lunar Limited.`,
      keywords: [tenant.name, 'events', 'hackathons', 'workshops', 'OneToOne', '1i1'],
      openGraph: {
        type: 'website',
        url: tenantUrl,
        title: `Events - ${tenant.name}`,
        description: `Browse all events from ${tenant.name}. Powered by OneToOne (1i1.ae).`,
        siteName: `${tenant.name} on OneToOne`,
        images: tenant.logoUrl
          ? [{ url: tenant.logoUrl, alt: tenant.name }]
          : [{ url: 'https://1i1.ae/Logo.svg', alt: 'OneToOne' }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `Events - ${tenant.name}`,
        description: `Browse all events from ${tenant.name}. Powered by OneToOne (1i1.ae).`,
        images: tenant.logoUrl ? [tenant.logoUrl] : ['https://1i1.ae/Logo.svg'],
      },
      alternates: {
        canonical: tenantUrl,
      },
    };
  }
  return { title: "Events" };
}

export default async function PublicEventsPage() {
  const tenant = await getTenantFromHeaders();

  if (!tenant.isSubdomainAccess || !tenant.tenantId) {
    redirect("/");
  }

  let events: Array<{
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
    ticket_price: number | null;
  }> = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseServiceKey) {
    try {
      const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
      const { data } = await serviceClient
        .from("events")
        .select("id, slug, title, description, start_date, end_date, location, is_virtual, cover_image, category, event_type, ticket_price")
        .eq("tenant_id", tenant.tenantId)
        .or("is_public.is.null,is_public.eq.true")
        .or("is_published.is.null,is_published.eq.true")
        .neq("status", "cancelled")
        .order("start_date", { ascending: true });

      if (data) {
        events = data;
      }
    } catch (e) {
      console.error("Error fetching events:", e);
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
        <EventsListing
          events={events as never[]}
          tenantName={tenant.name || "Portal"}
          primaryColor={tenant.primaryColor || "#84cc16"}
        />
      </main>
      <PortalFooter />
    </div>
  );
}
