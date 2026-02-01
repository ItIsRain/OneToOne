/**
 * SOW Pipeline Utilities
 * Extracts structured data from proposal/contract sections
 * for automated pipeline conversion.
 */

interface ProposalSection {
  id: string;
  type: string;
  title: string;
  content: string;
  order: number;
}

interface ContractSection {
  type: string;
  title: string;
  content: string;
  order: number;
}

interface ScopeItem {
  title: string;
  category: string;
}

interface Milestone {
  name: string;
  date?: string;
  amount?: number;
  description?: string;
}

/**
 * Strip HTML tags and decode basic entities
 */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|li|ul|ol|h[1-6])[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/**
 * Extract task titles from "scope" and "deliverables" type sections.
 * Splits on newlines, bullets, and list items; filters empty lines.
 */
export function extractScopeItems(sections: ProposalSection[]): ScopeItem[] {
  const scopeSections = sections.filter((s) =>
    ["scope", "deliverables", "services"].includes(s.type?.toLowerCase())
  );

  const items: ScopeItem[] = [];

  for (const section of scopeSections) {
    const text = stripHtml(section.content);
    const lines = text
      .split(/[\n\r]+/)
      .map((line) =>
        line
          .replace(/^[\s\-\*\u2022\u25E6\u25AA\d.)\]]+\s*/, "")
          .trim()
      )
      .filter((line) => line.length > 3 && line.length < 200);

    for (const line of lines) {
      items.push({
        title: line,
        category: section.title,
      });
    }
  }

  return items;
}

/**
 * Extract milestones from "timeline" and "payment" type sections.
 * Tries JSON parse for structured data, falls back to text parsing.
 */
export function extractMilestones(sections: ProposalSection[]): Milestone[] {
  const milestoneSections = sections.filter((s) =>
    ["timeline", "payment", "milestones", "schedule"].includes(
      s.type?.toLowerCase()
    )
  );

  const milestones: Milestone[] = [];

  for (const section of milestoneSections) {
    // Try JSON parse first (structured data)
    try {
      const parsed = JSON.parse(section.content);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          milestones.push({
            name: item.name || item.title || item.milestone || "Milestone",
            date: item.date || item.due_date || undefined,
            amount: parseFloat(item.amount) || undefined,
            description: item.description || undefined,
          });
        }
        continue;
      }
    } catch {
      // Not JSON, fall through to text parsing
    }

    // Text parsing fallback
    const text = stripHtml(section.content);
    const lines = text
      .split(/[\n\r]+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 3);

    for (const line of lines) {
      // Try to extract amount from line (e.g., "$5,000" or "5000")
      const amountMatch = line.match(
        /\$?([\d,]+(?:\.\d{2})?)/
      );
      const amount = amountMatch
        ? parseFloat(amountMatch[1].replace(/,/g, ""))
        : undefined;

      // Try to extract date
      const dateMatch = line.match(
        /(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/
      );

      const name = line
        .replace(/\$?[\d,]+(?:\.\d{2})?/, "")
        .replace(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}/, "")
        .replace(/^[\s\-\*\u2022\d.)\]]+\s*/, "")
        .replace(/[\s\-:]+$/, "")
        .trim();

      if (name.length > 2) {
        milestones.push({
          name,
          date: dateMatch ? dateMatch[1] : undefined,
          amount: amount && amount > 0 ? amount : undefined,
        });
      }
    }
  }

  return milestones;
}

/**
 * Map proposal sections to contract sections.
 * scope→scope, timeline→timeline, pricing→payment, terms→terms
 * Skips: cover, introduction, signature (contract has its own)
 */
export function mapProposalToContractSections(
  proposalSections: ProposalSection[]
): ContractSection[] {
  const typeMapping: Record<string, string> = {
    scope: "scope",
    deliverables: "scope",
    services: "scope",
    timeline: "timeline",
    schedule: "timeline",
    pricing: "payment",
    payment: "payment",
    milestones: "payment",
    terms: "terms",
    conditions: "terms",
    legal: "terms",
  };

  const skipTypes = new Set([
    "cover",
    "introduction",
    "signature",
    "about",
    "team",
  ]);

  const mapped: ContractSection[] = [];
  let order = 0;

  for (const section of proposalSections) {
    const sectionType = section.type?.toLowerCase() || "";

    if (skipTypes.has(sectionType)) continue;

    mapped.push({
      type: typeMapping[sectionType] || "general",
      title: section.title,
      content: section.content,
      order: order++,
    });
  }

  return mapped;
}
