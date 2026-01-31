/**
 * Escape HTML entities to prevent XSS.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Render a safe subset of markdown to HTML.
 * All HTML is escaped first, then markdown transformations applied.
 * Supported: **bold**, *italic*, [text](url), `- list items`, newlines.
 */
export function renderMarkdown(input: string): string {
  // Escape HTML first
  let html = escapeHtml(input);

  // Bold: **text**
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic: *text*
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Links: [text](url) — only allow http(s) and relative URLs
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, text, url) => {
      const safeUrl = /^(https?:\/\/|\/[^/])/.test(url) ? url : "#";
      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="underline hover:opacity-80">${text}</a>`;
    }
  );

  // List items: lines starting with "- "
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');

  // Wrap consecutive <li> elements in <ul>
  html = html.replace(
    /(<li[^>]*>.*?<\/li>\n?)+/g,
    (match) => `<ul class="space-y-1">${match}</ul>`
  );

  // Newlines to <br> (skip if inside tags)
  html = html.replace(/\n/g, "<br />");

  return html;
}
