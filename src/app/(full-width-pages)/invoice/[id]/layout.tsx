import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

interface InvoiceData {
  id: string;
  invoice_number: string;
  title: string | null;
  tenant_id: string;
  client?: { name: string }[] | { name: string } | null;
}

interface TenantData {
  name: string | null;
}

async function getInvoiceById(
  id: string
): Promise<{ invoice: InvoiceData | null; tenant: TenantData | null }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return { invoice: null, tenant: null };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, invoice_number, title, tenant_id, client:clients(name)')
    .eq('id', id)
    .single();

  if (!invoice) return { invoice: null, tenant: null };

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name')
    .eq('id', invoice.tenant_id)
    .single();

  // Handle Supabase returning client as array for joined relations
  const processedInvoice: InvoiceData = {
    ...invoice,
    client: Array.isArray(invoice.client) ? invoice.client[0] : invoice.client,
  };

  return { invoice: processedInvoice, tenant };
}

/**
 * Invoice pages are noindex by default because:
 * - They contain private financial information
 * - They are accessed via direct links (shared with clients)
 * - They should not appear in search results
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { invoice, tenant } = await getInvoiceById(id);

  if (!invoice) {
    return {
      title: 'Invoice Not Found',
      robots: { index: false, follow: false },
    };
  }

  const title = `Invoice ${invoice.invoice_number}${tenant?.name ? ` - ${tenant.name}` : ''}`;

  // Extract client name, handling both array and object formats
  let clientName: string | undefined;
  if (invoice.client) {
    if (Array.isArray(invoice.client) && invoice.client[0]?.name) {
      clientName = invoice.client[0].name;
    } else if (typeof invoice.client === 'object' && 'name' in invoice.client) {
      clientName = invoice.client.name;
    }
  }
  const description = clientName
    ? `Invoice ${invoice.invoice_number} for ${clientName}`
    : `View invoice ${invoice.invoice_number}`;

  return {
    title,
    description,
    // IMPORTANT: Invoices should never be indexed
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
    // Minimal OpenGraph for when invoice links are shared
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

export default function InvoiceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
