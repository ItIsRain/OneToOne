"use client";
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useTenantInfo } from "@/context/TenantInfoContext";
import { usePermissions } from "@/context/PermissionsContext";
import { PERMISSIONS, PermissionId } from "@/lib/permissions";
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

type SubItem = {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
  permission?: PermissionId | PermissionId[];
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  permission?: PermissionId | PermissionId[];
  subItems?: SubItem[];
};

// Main navigation - Core business functions
const navItems: NavItem[] = [
  { icon: <GridIcon />, name: "Dashboard", path: "/dashboard" },
  {
    icon: <GroupIcon />,
    name: "CRM",
    permission: [PERMISSIONS.CLIENTS_VIEW, PERMISSIONS.CRM_VIEW],
    subItems: [
      { name: "Clients", path: "/dashboard/crm/clients", permission: PERMISSIONS.CLIENTS_VIEW },
      { name: "Leads", path: "/dashboard/crm/leads", new: true, permission: PERMISSIONS.CRM_VIEW },
      { name: "Contacts", path: "/dashboard/crm/contacts", permission: PERMISSIONS.CRM_VIEW },
      { name: "Pipeline", path: "/dashboard/crm/pipeline", permission: PERMISSIONS.CRM_VIEW },
      { name: "Onboarding", path: "/dashboard/crm/onboarding", new: true, permission: PERMISSIONS.CRM_VIEW },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Projects",
    permission: PERMISSIONS.PROJECTS_VIEW,
    subItems: [
      { name: "All Projects", path: "/dashboard/projects", permission: PERMISSIONS.PROJECTS_VIEW },
      { name: "Tasks", path: "/dashboard/projects/tasks", permission: PERMISSIONS.TASKS_VIEW },
      { name: "Kanban Board", path: "/dashboard/projects/kanban", new: true, permission: PERMISSIONS.PROJECTS_VIEW },
      { name: "Timeline", path: "/dashboard/projects/timeline", permission: PERMISSIONS.PROJECTS_VIEW },
      { name: "Scope Creep", path: "/dashboard/projects/scope-creep", new: true, permission: PERMISSIONS.PROJECTS_VIEW },
      { name: "Pipeline", path: "/dashboard/projects/pipeline", new: true, pro: true, permission: PERMISSIONS.PROJECTS_VIEW },
    ],
  },
  {
    icon: <CalenderIcon />,
    name: "Events",
    permission: PERMISSIONS.EVENTS_VIEW,
    subItems: [
      { name: "All Events", path: "/dashboard/events", permission: PERMISSIONS.EVENTS_VIEW },
      { name: "Calendar", path: "/dashboard/events/calendar", permission: PERMISSIONS.EVENTS_VIEW },
      { name: "Venues", path: "/dashboard/events/venues", permission: PERMISSIONS.EVENTS_VIEW },
    ],
  },
  {
    icon: <ShootingStarIcon />,
    name: "Vendors",
    permission: PERMISSIONS.VENDORS_VIEW,
    subItems: [
      { name: "All Vendors", path: "/dashboard/vendors", permission: PERMISSIONS.VENDORS_VIEW },
      { name: "Categories", path: "/dashboard/vendors/categories", new: true, permission: PERMISSIONS.VENDORS_MANAGE },
    ],
  },
  {
    icon: <TimeIcon />,
    name: "Booking",
    permission: PERMISSIONS.BOOKING_VIEW,
    subItems: [
      { name: "Booking Pages", path: "/dashboard/booking/pages", new: true, permission: PERMISSIONS.BOOKING_VIEW },
      { name: "Appointments", path: "/dashboard/booking/appointments", permission: PERMISSIONS.BOOKING_VIEW },
      { name: "Availability", path: "/dashboard/booking/availability", permission: PERMISSIONS.BOOKING_MANAGE },
    ],
  },
  {
    icon: <DollarLineIcon />,
    name: "Finance",
    permission: PERMISSIONS.FINANCE_VIEW,
    subItems: [
      { name: "Overview", path: "/dashboard/finance", permission: PERMISSIONS.FINANCE_VIEW },
      { name: "Invoices", path: "/dashboard/finance/invoices", permission: PERMISSIONS.FINANCE_VIEW },
      { name: "Expenses", path: "/dashboard/finance/expenses", permission: PERMISSIONS.EXPENSES_VIEW },
      { name: "Payments", path: "/dashboard/finance/payments", permission: PERMISSIONS.FINANCE_VIEW },
      { name: "Budgets", path: "/dashboard/finance/budgets", permission: PERMISSIONS.BUDGETS_MANAGE },
      { name: "Forecast", path: "/dashboard/finance/forecast", new: true, permission: PERMISSIONS.FINANCE_VIEW },
      { name: "Profitability", path: "/dashboard/finance/profitability", new: true, permission: PERMISSIONS.FINANCE_VIEW },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "Team",
    permission: PERMISSIONS.TEAM_VIEW,
    subItems: [
      { name: "Members", path: "/dashboard/team", permission: PERMISSIONS.TEAM_VIEW },
      { name: "Roles & Permissions", path: "/dashboard/team/roles", permission: PERMISSIONS.ROLES_MANAGE },
      { name: "Time Tracking", path: "/dashboard/team/time-tracking", permission: PERMISSIONS.TEAM_VIEW },
      { name: "Utilization", path: "/dashboard/team/utilization", new: true, permission: PERMISSIONS.TEAM_VIEW },
      { name: "Payroll", path: "/dashboard/team/payroll", pro: true, permission: [PERMISSIONS.TEAM_VIEW, PERMISSIONS.FINANCE_VIEW] },
    ],
  },
  {
    icon: <FolderIcon />,
    name: "Documents",
    permission: PERMISSIONS.DOCUMENTS_VIEW,
    subItems: [
      { name: "All Files", path: "/dashboard/documents", permission: PERMISSIONS.DOCUMENTS_VIEW },
      { name: "Templates", path: "/dashboard/documents/templates", permission: PERMISSIONS.DOCUMENTS_VIEW },
      { name: "Shared", path: "/dashboard/documents/shared", permission: PERMISSIONS.DOCUMENTS_VIEW },
    ],
  },
  {
    icon: <PageIcon />,
    name: "Forms",
    permission: PERMISSIONS.FORMS_VIEW,
    subItems: [
      { name: "All Forms", path: "/dashboard/forms", new: true, permission: PERMISSIONS.FORMS_VIEW },
      { name: "Surveys", path: "/dashboard/surveys", new: true, permission: PERMISSIONS.FORMS_VIEW },
      { name: "Templates", path: "/dashboard/forms/templates", permission: PERMISSIONS.FORMS_VIEW },
    ],
  },
  {
    icon: <DocsIcon />,
    name: "Proposals",
    permission: PERMISSIONS.PROPOSALS_VIEW,
    subItems: [
      { name: "All Proposals", path: "/dashboard/proposals", new: true, permission: PERMISSIONS.PROPOSALS_VIEW },
      { name: "Templates", path: "/dashboard/proposals/templates", permission: PERMISSIONS.PROPOSALS_VIEW },
    ],
  },
  {
    icon: <FileIcon />,
    name: "Contracts",
    permission: PERMISSIONS.CONTRACTS_VIEW,
    subItems: [
      { name: "All Contracts", path: "/dashboard/contracts", new: true, permission: PERMISSIONS.CONTRACTS_VIEW },
      { name: "Templates", path: "/dashboard/contracts/templates", permission: PERMISSIONS.CONTRACTS_VIEW },
    ],
  },
  {
    icon: <BoltIcon />,
    name: "Automation",
    permission: PERMISSIONS.AUTOMATION_VIEW,
    subItems: [
      { name: "Workflows", path: "/dashboard/automation/workflows", permission: PERMISSIONS.AUTOMATION_VIEW },
      { name: "Integrations", path: "/dashboard/automation/integrations", new: true, permission: PERMISSIONS.INTEGRATIONS_MANAGE },
      { name: "Approvals", path: "/dashboard/automation/approvals", permission: PERMISSIONS.AUTOMATION_VIEW },
      { name: "Run History", path: "/dashboard/automation/runs", permission: PERMISSIONS.AUTOMATION_VIEW },
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
    permission: PERMISSIONS.REPORTS_VIEW,
    subItems: [
      { name: "Analytics", path: "/dashboard/reports", permission: PERMISSIONS.REPORTS_VIEW },
      { name: "Sales Reports", path: "/dashboard/reports/sales", permission: PERMISSIONS.REPORTS_VIEW },
      { name: "Financial Reports", path: "/dashboard/reports/financial", permission: PERMISSIONS.REPORTS_VIEW },
      { name: "Team Reports", path: "/dashboard/reports/team", permission: PERMISSIONS.REPORTS_VIEW },
      { name: "Custom Reports", path: "/dashboard/reports/custom", new: true, permission: PERMISSIONS.REPORTS_CREATE },
    ],
  },
];

// Settings navigation
const settingsItems: NavItem[] = [
  {
    icon: <PlugInIcon />,
    name: "Settings",
    permission: PERMISSIONS.SETTINGS_VIEW,
    subItems: [
      { name: "Company", path: "/dashboard/settings", permission: PERMISSIONS.SETTINGS_VIEW },
      { name: "Domains", path: "/dashboard/settings/domains", new: true, permission: PERMISSIONS.SETTINGS_EDIT },
      { name: "Email Provider", path: "/dashboard/settings/email", pro: true, permission: PERMISSIONS.SETTINGS_EDIT },
      { name: "Billing", path: "/dashboard/settings/billing", permission: PERMISSIONS.SETTINGS_EDIT },
      { name: "Portal", path: "/dashboard/settings/portal", new: true, permission: PERMISSIONS.SETTINGS_EDIT },
      { name: "Dashboard", path: "/dashboard/settings/dashboard", permission: PERMISSIONS.SETTINGS_VIEW },
      { name: "API Keys", path: "/dashboard/settings/api", permission: PERMISSIONS.SETTINGS_EDIT },
      { name: "API Docs", path: "/dashboard/settings/docs", permission: PERMISSIONS.SETTINGS_VIEW },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { logoUrl: customLogoUrl, loading: tenantInfoLoading } = useTenantInfo();
  const { hasPermission, hasAnyPermission, loading: permissionsLoading } = usePermissions();
  const pathname = usePathname();

  // Helper to check if user has permission for an item
  const checkPermission = useCallback((permission?: PermissionId | PermissionId[]): boolean => {
    if (!permission) return true;
    if (Array.isArray(permission)) {
      return hasAnyPermission(permission);
    }
    return hasPermission(permission);
  }, [hasPermission, hasAnyPermission]);

  // Filter nav items based on permissions
  const filterNavItems = useCallback((items: NavItem[]): NavItem[] => {
    return items
      .filter(item => checkPermission(item.permission))
      .map(item => {
        if (item.subItems) {
          const filteredSubItems = item.subItems.filter(sub => checkPermission(sub.permission));
          // Only include parent if it has visible sub-items
          if (filteredSubItems.length === 0) return null;
          return { ...item, subItems: filteredSubItems };
        }
        return item;
      })
      .filter((item): item is NavItem => item !== null);
  }, [checkPermission]);

  // Memoize filtered navigation items
  const filteredNavItems = useMemo(() => filterNavItems(navItems), [filterNavItems]);
  const filteredSecondaryItems = useMemo(() => filterNavItems(secondaryItems), [filterNavItems]);
  const filteredSettingsItems = useMemo(() => filterNavItems(settingsItems), [filterNavItems]);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "secondary" | "settings";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
      { items: filteredNavItems, type: "main" as const },
      { items: filteredSecondaryItems, type: "secondary" as const },
      { items: filteredSettingsItems, type: "settings" as const },
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
  }, [pathname, isSubmenuActive, filteredNavItems, filteredSecondaryItems, filteredSettingsItems]);

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
    <ul className="flex flex-col gap-0.5">
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
                      ? "rotate-180 text-white"
                      : ""
                  }`}
                />
              )}
              {!isExpanded && !isHovered && !isMobileOpen && (
                <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-[60]">
                  {nav.name}
                </span>
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
                {!isExpanded && !isHovered && !isMobileOpen && (
                  <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-[60]">
                    {nav.name}
                  </span>
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
              <ul className="mt-2 space-y-1 ml-[22px] pl-4 border-l border-gray-200/60 dark:border-gray-700/40">
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
                      {isActive(subItem.path, true) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 dark:bg-brand-400 shrink-0" />
                      )}
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
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-r dark:border-gray-800/50 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 shadow-[2px_0_8px_-2px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_12px_-2px_rgba(0,0,0,0.3)]
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
        className="flex items-center justify-center py-6"
      >
        <Link href="/dashboard" className="flex items-center justify-center">
          {tenantInfoLoading && !customLogoUrl ? (
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
      <div className="border-b border-gray-100 dark:border-gray-800/50 mx-2 mb-4" />

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar flex-1">
        <nav className="mb-6">
          <div className="flex flex-col gap-6">
            {/* Loading skeleton while permissions load */}
            {permissionsLoading && (
              <div className="space-y-3 animate-pulse">
                {[75, 85, 65, 90, 70].map((width, i) => (
                  <div key={i} className={`flex items-center gap-3 px-3 py-2.5 ${!isExpanded && !isHovered ? "lg:justify-center" : ""}`}>
                    <div className="w-6 h-6 rounded-lg bg-gray-200 dark:bg-gray-700" />
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" style={{ width: `${width}%` }} />
                    )}
                  </div>
                ))}
              </div>
            )}
            {/* Main Navigation */}
            {!permissionsLoading && filteredNavItems.length > 0 && (
              <div>
                <h2
                  className={`mb-2 text-xs font-semibold uppercase tracking-wider flex leading-[20px] text-gray-400/80 ${
                    !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots />}
                </h2>
                {renderMenuItems(filteredNavItems, "main")}
              </div>
            )}

            {/* Secondary Navigation */}
            {!permissionsLoading && filteredSecondaryItems.length > 0 && (
              <div>
                <h2
                  className={`mb-2 text-xs font-semibold uppercase tracking-wider flex leading-[20px] text-gray-400/80 ${
                    !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Insights"
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(filteredSecondaryItems, "secondary")}
              </div>
            )}

            {/* Settings Navigation */}
            {!permissionsLoading && filteredSettingsItems.length > 0 && (
              <div>
                <h2
                  className={`mb-2 text-xs font-semibold uppercase tracking-wider flex leading-[20px] text-gray-400/80 ${
                    !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "System"
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(filteredSettingsItems, "settings")}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Plan widget */}
      <SidebarWidget />
    </aside>
  );
};

export default AppSidebar;
