import Script from 'next/script';

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
  id?: string;
}

/**
 * Component for injecting JSON-LD structured data
 *
 * @example
 * <JsonLd
 *   id="organization"
 *   data={generateOrganizationSchema()}
 * />
 */
export function JsonLd({ data, id }: JsonLdProps) {
  const jsonString = JSON.stringify(data);

  return (
    <Script
      id={id || 'json-ld'}
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: jsonString }}
    />
  );
}

/**
 * Inline JSON-LD for use in head or layouts (non-Script version)
 */
export function JsonLdInline({ data, id }: JsonLdProps) {
  const jsonString = JSON.stringify(data);

  return (
    <script
      id={id || 'json-ld-inline'}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonString }}
    />
  );
}

export default JsonLd;
