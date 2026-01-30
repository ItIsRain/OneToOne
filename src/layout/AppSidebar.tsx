"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";
import {
  BoltIcon,
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  DollarLineIcon,
  DocsIcon,
  FileIcon,
  FolderIcon,
  GridIcon,
  GroupIcon,
  HorizontaLDots,
  MailIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  ShootingStarIcon,
  TaskIcon,
  TimeIcon,
  UserCircleIcon,
} from "../icons/index";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

// Main navigation - Core business functions
const navItems: NavItem[] = [
  { icon: <GridIcon />, name: "Dashboard", path: "/dashboard" },
  {
    icon: <GroupIcon />,
    name: "CRM",
    subItems: [
      { name: "Clients", path: "/dashboard/crm/clients" },
      { name: "Leads", path: "/dashboard/crm/leads", new: true },
      { name: "Contacts", path: "/dashboard/crm/contacts" },
      { name: "Pipeline", path: "/dashboard/crm/pipeline" },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Projects",
    subItems: [
      { name: "All Projects", path: "/dashboard/projects" },
      { name: "Tasks", path: "/dashboard/projects/tasks" },
      { name: "Kanban Board", path: "/dashboard/projects/kanban", new: true },
      { name: "Timeline", path: "/dashboard/projects/timeline" },
    ],
  },
  {
    icon: <CalenderIcon />,
    name: "Events",
    subItems: [
      { name: "All Events", path: "/dashboard/events" },
      { name: "Calendar", path: "/dashboard/events/calendar" },
      { name: "Venues", path: "/dashboard/events/venues" },
    ],
  },
  {
    icon: <ShootingStarIcon />,
    name: "Vendors",
    subItems: [
      { name: "All Vendors", path: "/dashboard/vendors" },
      { name: "Categories", path: "/dashboard/vendors/categories", new: true },
    ],
  },
  {
    icon: <TimeIcon />,
    name: "Booking",
    subItems: [
      { name: "Booking Pages", path: "/dashboard/booking/pages", new: true },
      { name: "Appointments", path: "/dashboard/booking/appointments" },
      { name: "Availability", path: "/dashboard/booking/availability" },
    ],
  },
  {
    icon: <DollarLineIcon />,
    name: "Finance",
    subItems: [
      { name: "Overview", path: "/dashboard/finance" },
      { name: "Invoices", path: "/dashboard/finance/invoices" },
      { name: "Expenses", path: "/dashboard/finance/expenses" },
      { name: "Payments", path: "/dashboard/finance/payments" },
      { name: "Budgets", path: "/dashboard/finance/budgets" },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "Team",
    subItems: [
      { name: "Members", path: "/dashboard/team" },
      { name: "Roles & Permissions", path: "/dashboard/team/roles" },
      { name: "Time Tracking", path: "/dashboard/team/time-tracking" },
      { name: "Payroll", path: "/dashboard/team/payroll", pro: true },
    ],
  },
  {
    icon: <FolderIcon />,
    name: "Documents",
    subItems: [
      { name: "All Files", path: "/dashboard/documents" },
      { name: "Templates", path: "/dashboard/documents/templates" },
      { name: "Shared", path: "/dashboard/documents/shared" },
    ],
  },
  {
    icon: <PageIcon />,
    name: "Forms",
    subItems: [
      { name: "All Forms", path: "/dashboard/forms", new: true },
      { name: "Surveys", path: "/dashboard/surveys", new: true },
      { name: "Templates", path: "/dashboard/forms/templates" },
    ],
  },
  {
    icon: <DocsIcon />,
    name: "Proposals",
    subItems: [
      { name: "All Proposals", path: "/dashboard/proposals", new: true },
      { name: "Templates", path: "/dashboard/proposals/templates" },
    ],
  },
  {
    icon: <FileIcon />,
    name: "Contracts",
    subItems: [
      { name: "All Contracts", path: "/dashboard/contracts", new: true },
      { name: "Templates", path: "/dashboard/contracts/templates" },
    ],
  },
  {
    icon: <BoltIcon />,
    name: "Automation",
    subItems: [
      { name: "Workflows", path: "/dashboard/automation/workflows" },
      { name: "Integrations", path: "/dashboard/automation/integrations", new: true },
      { name: "Approvals", path: "/dashboard/automation/approvals" },
      { name: "Run History", path: "/dashboard/automation/runs" },
    ],
  },
];

// Secondary navigation - Communication & Insights
const secondaryItems: NavItem[] = [
  {
    icon: <MailIcon />,
    name: "Inbox",
    subItems: [
      { name: "Messages", path: "/dashboard/inbox" },
      { name: "Email", path: "/dashboard/inbox/email" },
      { name: "Notifications", path: "/dashboard/inbox/notifications" },
    ],
  },
  {
    icon: <PieChartIcon />,
    name: "Reports",
    subItems: [
      { name: "Analytics", path: "/dashboard/reports" },
      { name: "Sales Reports", path: "/dashboard/reports/sales" },
      { name: "Financial Reports", path: "/dashboard/reports/financial" },
      { name: "Team Reports", path: "/dashboard/reports/team" },
      { name: "Custom Reports", path: "/dashboard/reports/custom", new: true },
    ],
  },
];

// Settings navigation
const settingsItems: NavItem[] = [
  {
    icon: <PlugInIcon />,
    name: "Settings",
    subItems: [
      { name: "Company", path: "/dashboard/settings" },
      { name: "Domains", path: "/dashboard/settings/domains", new: true },
      { name: "Email Provider", path: "/dashboard/settings/email", pro: true },
      { name: "Billing", path: "/dashboard/settings/billing" },
      { name: "Portal", path: "/dashboard/settings/portal", new: true },
      { name: "Portal Clients", path: "/dashboard/portal/clients", new: true },
      { name: "Portal Approvals", path: "/dashboard/portal/approvals", new: true },
      { name: "Dashboard", path: "/dashboard/settings/dashboard" },
      { name: "API Keys", path: "/dashboard/settings/api" },
      { name: "API Docs", path: "/dashboard/settings/docs" },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "secondary" | "settings";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // "pending" = not yet resolved (show nothing to avoid flash), null = no custom logo, string = custom logo URL
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null | "pending">("pending");

  useEffect(() => {
    // Read cached value immediately to avoid flash
    const cached = localStorage.getItem("custom_logo_url");
    setCustomLogoUrl(cached);

    // Then validate against server
    fetch("/api/tenant/info")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const url = data?.logo_url || null;
        setCustomLogoUrl(url);
        if (url) {
          localStorage.setItem("custom_logo_url", url);
        } else {
          localStorage.removeItem("custom_logo_url");
        }
      })
      .catch(() => {
        // Keep cached value on error
        if (!cached) setCustomLogoUrl(null);
      });
  }, []);

  useEffect(() => {
    const handleLogoChanged = (e: Event) => {
      const url = (e as CustomEvent).detail as string | null;
      setCustomLogoUrl(url);
    };
    window.addEventListener("logo-changed", handleLogoChanged);
    return () => window.removeEventListener("logo-changed", handleLogoChanged);
  }, []);

  const isActive = useCallback(
    (path: string, exactMatch: boolean = false) => {
      if (exactMatch) {
        return pathname === path;
      }
      return pathname === path || pathname.startsWith(path + "/");
    },
    [pathname]
  );

  const isSubmenuActive = useCallback(
    (subItems: { path: string }[]) => subItems.some((item) => isActive(item.path)),
    [isActive]
  );

  useEffect(() => {
    let submenuMatched = false;
    const menuGroups = [
      { items: navItems, type: "main" as const },
      { items: secondaryItems, type: "secondary" as const },
      { items: settingsItems, type: "settings" as const },
    ];

    menuGroups.forEach(({ items, type }) => {
      items.forEach((nav, index) => {
        if (nav.subItems && isSubmenuActive(nav.subItems)) {
          setOpenSubmenu({ type, index });
          submenuMatched = true;
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isSubmenuActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (
    index: number,
    menuType: "main" | "secondary" | "settings"
  ) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (
    items: NavItem[],
    menuType: "main" | "secondary" | "settings"
  ) => (
    <ul className="flex flex-col gap-1">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : isSubmenuActive(nav.subItems)
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
              }`}
            >
              <span
                className={`${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : isSubmenuActive(nav.subItems)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path, true) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path, true)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path, true)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path, true)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path, true)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="flex items-center justify-center py-8"
      >
        <Link href="/dashboard" className="flex items-center justify-center">
          {customLogoUrl === "pending" ? (
            // Invisible placeholder to reserve space and prevent flash
            isExpanded || isHovered || isMobileOpen ? (
              <div className="h-10 w-[200px]" />
            ) : (
              <div className="h-8 w-8" />
            )
          ) : isExpanded || isHovered || isMobileOpen ? (
            customLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={customLogoUrl}
                alt="Logo"
                className="h-10 max-w-[200px] object-contain dark:brightness-0 dark:invert"
              />
            ) : (
              <Image
                src="/Logo.svg"
                alt="Logo"
                width={200}
                height={40}
                className="dark:brightness-0 dark:invert"
              />
            )
          ) : (
            customLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={customLogoUrl}
                alt="Logo"
                className="h-8 w-8 object-contain dark:brightness-0 dark:invert"
              />
            ) : (
              <Image
                src="/LogoSmall.svg"
                alt="Logo"
                width={32}
                height={32}
                className="dark:brightness-0 dark:invert"
              />
            )
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar flex-1">
        <nav className="mb-6">
          <div className="flex flex-col gap-6">
            {/* Main Navigation */}
            <div>
              <h2
                className={`mb-3 text-xs font-semibold uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots />}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            {/* Secondary Navigation */}
            <div>
              <h2
                className={`mb-3 text-xs font-semibold uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Insights"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(secondaryItems, "secondary")}
            </div>

            {/* Settings Navigation */}
            <div>
              <h2
                className={`mb-3 text-xs font-semibold uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "System"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(settingsItems, "settings")}
            </div>
          </div>
        </nav>
      </div>

      {/* Plan widget */}
      <SidebarWidget />
    </aside>
  );
};

export default AppSidebar;
