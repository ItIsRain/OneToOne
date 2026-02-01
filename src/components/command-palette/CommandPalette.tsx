"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  path: string;
}

interface CommandItem {
  id: string;
  label: string;
  subtitle?: string;
  icon: React.ReactNode;
  section: string;
  action: () => void;
}

// Navigation pages derived from sidebar structure
const navigationPages: { label: string; path: string; section: string; keywords?: string }[] = [
  { label: "Dashboard", path: "/dashboard", section: "Navigation" },
  { label: "Clients", path: "/dashboard/crm/clients", section: "CRM" },
  { label: "Leads", path: "/dashboard/crm/leads", section: "CRM" },
  { label: "Contacts", path: "/dashboard/crm/contacts", section: "CRM" },
  { label: "Pipeline", path: "/dashboard/crm/pipeline", section: "CRM" },
  { label: "Onboarding Templates", path: "/dashboard/crm/onboarding", section: "CRM", keywords: "onboarding template" },
  { label: "All Projects", path: "/dashboard/projects", section: "Projects" },
  { label: "Tasks", path: "/dashboard/projects/tasks", section: "Projects" },
  { label: "Kanban Board", path: "/dashboard/projects/kanban", section: "Projects" },
  { label: "Timeline", path: "/dashboard/projects/timeline", section: "Projects" },
  { label: "Scope Creep Detector", path: "/dashboard/projects/scope-creep", section: "Projects", keywords: "scope creep risk analysis detector ai" },
  { label: "SOW Pipeline", path: "/dashboard/projects/pipeline", section: "Projects", keywords: "pipeline sow proposal contract milestone invoice auto" },
  { label: "All Events", path: "/dashboard/events", section: "Events" },
  { label: "Calendar", path: "/dashboard/events/calendar", section: "Events" },
  { label: "Venues", path: "/dashboard/events/venues", section: "Events" },
  { label: "All Vendors", path: "/dashboard/vendors", section: "Vendors" },
  { label: "Vendor Categories", path: "/dashboard/vendors/categories", section: "Vendors", keywords: "vendor" },
  { label: "Booking Pages", path: "/dashboard/booking/pages", section: "Booking" },
  { label: "Appointments", path: "/dashboard/booking/appointments", section: "Booking" },
  { label: "Availability", path: "/dashboard/booking/availability", section: "Booking" },
  { label: "Finance Overview", path: "/dashboard/finance", section: "Finance" },
  { label: "Invoices", path: "/dashboard/finance/invoices", section: "Finance" },
  { label: "Expenses", path: "/dashboard/finance/expenses", section: "Finance" },
  { label: "Payments", path: "/dashboard/finance/payments", section: "Finance" },
  { label: "Budgets", path: "/dashboard/finance/budgets", section: "Finance" },
  { label: "Revenue Forecast", path: "/dashboard/finance/forecast", section: "Finance", keywords: "forecast cash flow projection revenue" },
  { label: "Project Profitability", path: "/dashboard/finance/profitability", section: "Finance", keywords: "profitability margin profit loss cost" },
  { label: "Team Members", path: "/dashboard/team", section: "Team" },
  { label: "Roles & Permissions", path: "/dashboard/team/roles", section: "Team" },
  { label: "Time Tracking", path: "/dashboard/team/time-tracking", section: "Team" },
  { label: "Resource Utilization", path: "/dashboard/team/utilization", section: "Team", keywords: "utilization heatmap capacity workload" },
  { label: "Payroll", path: "/dashboard/team/payroll", section: "Team" },
  { label: "All Files", path: "/dashboard/documents", section: "Documents" },
  { label: "Document Templates", path: "/dashboard/documents/templates", section: "Documents", keywords: "template" },
  { label: "Shared Documents", path: "/dashboard/documents/shared", section: "Documents" },
  { label: "All Forms", path: "/dashboard/forms", section: "Forms" },
  { label: "Surveys", path: "/dashboard/surveys", section: "Forms" },
  { label: "Form Templates", path: "/dashboard/forms/templates", section: "Forms", keywords: "template" },
  { label: "All Proposals", path: "/dashboard/proposals", section: "Proposals" },
  { label: "Proposal Templates", path: "/dashboard/proposals/templates", section: "Proposals", keywords: "template" },
  { label: "All Contracts", path: "/dashboard/contracts", section: "Contracts" },
  { label: "Contract Templates", path: "/dashboard/contracts/templates", section: "Contracts", keywords: "template" },
  { label: "Workflows", path: "/dashboard/automation/workflows", section: "Automation" },
  { label: "Integrations", path: "/dashboard/automation/integrations", section: "Automation" },
  { label: "Approvals", path: "/dashboard/automation/approvals", section: "Automation" },
  { label: "Run History", path: "/dashboard/automation/runs", section: "Automation" },
  { label: "Messages", path: "/dashboard/inbox", section: "Inbox" },
  { label: "Email", path: "/dashboard/inbox/email", section: "Inbox" },
  { label: "Notifications", path: "/dashboard/inbox/notifications", section: "Inbox" },
  { label: "Analytics", path: "/dashboard/reports", section: "Reports" },
  { label: "Sales Reports", path: "/dashboard/reports/sales", section: "Reports" },
  { label: "Financial Reports", path: "/dashboard/reports/financial", section: "Reports" },
  { label: "Team Reports", path: "/dashboard/reports/team", section: "Reports" },
  { label: "Custom Reports", path: "/dashboard/reports/custom", section: "Reports" },
  { label: "Company Settings", path: "/dashboard/settings", section: "Settings" },
  { label: "Domains", path: "/dashboard/settings/domains", section: "Settings" },
  { label: "Email Provider", path: "/dashboard/settings/email", section: "Settings" },
  { label: "Billing", path: "/dashboard/settings/billing", section: "Settings" },
  { label: "Portal Settings", path: "/dashboard/settings/portal", section: "Settings" },
  { label: "Dashboard Settings", path: "/dashboard/settings/dashboard", section: "Settings" },
  { label: "API Keys", path: "/dashboard/settings/api", section: "Settings" },
  { label: "API Docs", path: "/dashboard/settings/docs", section: "Settings" },
];

// Type icon mapping
const typeIcons: Record<string, React.ReactNode> = {
  client: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  ),
  lead: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
  ),
  project: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  ),
  task: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  event: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  ),
  invoice: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  proposal: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  ),
  contract: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  ),
  navigation: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  ),
  action: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  ),
};

const searchIcon = (
  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      setSearchResults([]);
      setIsSearching(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch {
      // Silent fail
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  // Build command items list
  const navigate = useCallback(
    (path: string) => {
      router.push(path);
      onClose();
    },
    [router, onClose]
  );

  const allItems: CommandItem[] = [];

  // Quick actions (always shown when query is empty or matches)
  const quickActions: { label: string; path: string; keywords: string }[] = [
    { label: "Create Client", path: "/dashboard/crm/clients?action=create", keywords: "new add client" },
    { label: "Create Lead", path: "/dashboard/crm/leads?action=create", keywords: "new add lead" },
    { label: "Create Project", path: "/dashboard/projects?action=create", keywords: "new add project" },
    { label: "Create Task", path: "/dashboard/projects/tasks?action=create", keywords: "new add task" },
    { label: "Create Event", path: "/dashboard/events?action=create", keywords: "new add event" },
    { label: "Create Invoice", path: "/dashboard/finance/invoices?action=create", keywords: "new add invoice" },
    { label: "Create Proposal", path: "/dashboard/proposals?action=create", keywords: "new add proposal" },
    { label: "Create Contract", path: "/dashboard/contracts?action=create", keywords: "new add contract" },
    { label: "Create Form", path: "/dashboard/forms?action=create", keywords: "new add form" },
  ];

  const lowerQuery = query.toLowerCase();

  // Add search results from API
  if (searchResults.length > 0) {
    searchResults.forEach((r) => {
      allItems.push({
        id: `search-${r.type}-${r.id}`,
        label: r.title,
        subtitle: `${r.type.charAt(0).toUpperCase() + r.type.slice(1)}${r.subtitle ? ` · ${r.subtitle}` : ""}`,
        icon: typeIcons[r.type] || typeIcons.navigation,
        section: "Search Results",
        action: () => navigate(r.path),
      });
    });
  }

  // Add quick actions
  const filteredActions = query
    ? quickActions.filter(
        (a) =>
          a.label.toLowerCase().includes(lowerQuery) ||
          a.keywords.includes(lowerQuery)
      )
    : quickActions.slice(0, 5);

  filteredActions.forEach((a) => {
    allItems.push({
      id: `action-${a.label}`,
      label: a.label,
      icon: typeIcons.action,
      section: "Quick Actions",
      action: () => navigate(a.path),
    });
  });

  // Add navigation pages
  const filteredPages = query
    ? navigationPages.filter(
        (p) =>
          p.label.toLowerCase().includes(lowerQuery) ||
          p.section.toLowerCase().includes(lowerQuery) ||
          (p.keywords && p.keywords.includes(lowerQuery))
      )
    : navigationPages.slice(0, 8);

  filteredPages.forEach((p) => {
    allItems.push({
      id: `nav-${p.path}`,
      label: p.label,
      subtitle: p.section,
      icon: typeIcons.navigation,
      section: "Pages",
      action: () => navigate(p.path),
    });
  });

  // Group items by section
  const sections: { name: string; items: CommandItem[] }[] = [];
  const sectionMap = new Map<string, CommandItem[]>();

  allItems.forEach((item) => {
    if (!sectionMap.has(item.section)) {
      sectionMap.set(item.section, []);
    }
    sectionMap.get(item.section)!.push(item);
  });

  sectionMap.forEach((items, name) => {
    sections.push({ name, items });
  });

  // Flatten for keyboard navigation
  const flatItems = sections.flatMap((s) => s.items);

  // Clamp active index
  useEffect(() => {
    setActiveIndex(0);
  }, [query, searchResults.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatItems[activeIndex]) {
          flatItems[activeIndex].action();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeIndex, flatItems.length, onClose]);

  // Scroll active item into view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!isOpen) return null;

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-99999 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-700">
          {searchIcon}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, clients, tasks, or type a command..."
            className="h-14 w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white dark:placeholder:text-gray-500"
          />
          {isSearching && (
            <svg className="h-5 w-5 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto overscroll-contain p-2">
          {sections.length === 0 && query.length >= 2 && !isSearching && (
            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {sections.map((section) => (
            <div key={section.name} className="mb-1">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {section.name}
              </div>
              {section.items.map((item) => {
                const idx = flatIndex++;
                const isActive = idx === activeIndex;

                return (
                  <button
                    key={item.id}
                    data-index={idx}
                    onClick={item.action}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isActive
                          ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{item.label}</div>
                      {item.subtitle && (
                        <div className="truncate text-xs text-gray-400 dark:text-gray-500">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                    {isActive && (
                      <kbd className="hidden sm:inline-flex items-center rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500">
                        ↵
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2 dark:border-gray-700">
          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 text-[10px] dark:border-gray-700 dark:bg-gray-800">↑</kbd>
              <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 text-[10px] dark:border-gray-700 dark:bg-gray-800">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 text-[10px] dark:border-gray-700 dark:bg-gray-800">↵</kbd>
              Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 text-[10px] dark:border-gray-700 dark:bg-gray-800">esc</kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
