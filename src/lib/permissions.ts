/**
 * Permission system constants and utilities
 *
 * This file defines all available permissions in the system.
 * Permissions follow the format: {category}-{action}
 */

// All permission IDs
export const PERMISSIONS = {
  // Projects
  PROJECTS_VIEW: 'projects-view',
  PROJECTS_CREATE: 'projects-create',
  PROJECTS_EDIT: 'projects-edit',
  PROJECTS_DELETE: 'projects-delete',
  PROJECTS_ARCHIVE: 'projects-archive',

  // Tasks
  TASKS_VIEW: 'tasks-view',
  TASKS_CREATE: 'tasks-create',
  TASKS_EDIT: 'tasks-edit',
  TASKS_DELETE: 'tasks-delete',
  TASKS_ASSIGN: 'tasks-assign',

  // Clients
  CLIENTS_VIEW: 'clients-view',
  CLIENTS_CREATE: 'clients-create',
  CLIENTS_EDIT: 'clients-edit',
  CLIENTS_DELETE: 'clients-delete',

  // Finance
  FINANCE_VIEW: 'finance-view',
  INVOICES_CREATE: 'invoices-create',
  INVOICES_EDIT: 'invoices-edit',
  INVOICES_SEND: 'invoices-send',
  PAYMENTS_RECORD: 'payments-record',
  EXPENSES_VIEW: 'expenses-view',
  EXPENSES_APPROVE: 'expenses-approve',
  BUDGETS_MANAGE: 'budgets-manage',

  // Team
  TEAM_VIEW: 'team-view',
  TEAM_INVITE: 'team-invite',
  TEAM_EDIT: 'team-edit',
  TEAM_REMOVE: 'team-remove',
  ROLES_MANAGE: 'roles-manage',

  // Events
  EVENTS_VIEW: 'events-view',
  EVENTS_CREATE: 'events-create',
  EVENTS_EDIT: 'events-edit',
  EVENTS_DELETE: 'events-delete',

  // Reports
  REPORTS_VIEW: 'reports-view',
  REPORTS_EXPORT: 'reports-export',
  REPORTS_CREATE: 'reports-create',

  // Settings
  SETTINGS_VIEW: 'settings-view',
  SETTINGS_EDIT: 'settings-edit',
  INTEGRATIONS_MANAGE: 'integrations-manage',

  // Documents
  DOCUMENTS_VIEW: 'documents-view',
  DOCUMENTS_CREATE: 'documents-create',
  DOCUMENTS_EDIT: 'documents-edit',
  DOCUMENTS_DELETE: 'documents-delete',

  // CRM (Leads, Contacts, Pipeline)
  CRM_VIEW: 'crm-view',
  CRM_CREATE: 'crm-create',
  CRM_EDIT: 'crm-edit',
  CRM_DELETE: 'crm-delete',

  // Booking
  BOOKING_VIEW: 'booking-view',
  BOOKING_MANAGE: 'booking-manage',

  // Automation
  AUTOMATION_VIEW: 'automation-view',
  AUTOMATION_MANAGE: 'automation-manage',

  // Forms & Proposals
  FORMS_VIEW: 'forms-view',
  FORMS_MANAGE: 'forms-manage',
  PROPOSALS_VIEW: 'proposals-view',
  PROPOSALS_MANAGE: 'proposals-manage',

  // Contracts
  CONTRACTS_VIEW: 'contracts-view',
  CONTRACTS_MANAGE: 'contracts-manage',

  // Vendors
  VENDORS_VIEW: 'vendors-view',
  VENDORS_MANAGE: 'vendors-manage',
} as const;

export type PermissionId = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Permission groups for UI display
export const PERMISSION_GROUPS = [
  {
    name: 'Projects',
    key: 'projects',
    permissions: [
      { id: PERMISSIONS.PROJECTS_VIEW, label: 'View projects' },
      { id: PERMISSIONS.PROJECTS_CREATE, label: 'Create projects' },
      { id: PERMISSIONS.PROJECTS_EDIT, label: 'Edit projects' },
      { id: PERMISSIONS.PROJECTS_DELETE, label: 'Delete projects' },
      { id: PERMISSIONS.PROJECTS_ARCHIVE, label: 'Archive projects' },
    ],
  },
  {
    name: 'Tasks',
    key: 'tasks',
    permissions: [
      { id: PERMISSIONS.TASKS_VIEW, label: 'View tasks' },
      { id: PERMISSIONS.TASKS_CREATE, label: 'Create tasks' },
      { id: PERMISSIONS.TASKS_EDIT, label: 'Edit tasks' },
      { id: PERMISSIONS.TASKS_DELETE, label: 'Delete tasks' },
      { id: PERMISSIONS.TASKS_ASSIGN, label: 'Assign tasks' },
    ],
  },
  {
    name: 'Clients',
    key: 'clients',
    permissions: [
      { id: PERMISSIONS.CLIENTS_VIEW, label: 'View clients' },
      { id: PERMISSIONS.CLIENTS_CREATE, label: 'Create clients' },
      { id: PERMISSIONS.CLIENTS_EDIT, label: 'Edit clients' },
      { id: PERMISSIONS.CLIENTS_DELETE, label: 'Delete clients' },
    ],
  },
  {
    name: 'CRM',
    key: 'crm',
    permissions: [
      { id: PERMISSIONS.CRM_VIEW, label: 'View CRM (leads, contacts, pipeline)' },
      { id: PERMISSIONS.CRM_CREATE, label: 'Create leads & contacts' },
      { id: PERMISSIONS.CRM_EDIT, label: 'Edit leads & contacts' },
      { id: PERMISSIONS.CRM_DELETE, label: 'Delete leads & contacts' },
    ],
  },
  {
    name: 'Finance',
    key: 'finance',
    permissions: [
      { id: PERMISSIONS.FINANCE_VIEW, label: 'View financial data' },
      { id: PERMISSIONS.INVOICES_CREATE, label: 'Create invoices' },
      { id: PERMISSIONS.INVOICES_EDIT, label: 'Edit invoices' },
      { id: PERMISSIONS.INVOICES_SEND, label: 'Send invoices' },
      { id: PERMISSIONS.PAYMENTS_RECORD, label: 'Record payments' },
      { id: PERMISSIONS.EXPENSES_VIEW, label: 'View expenses' },
      { id: PERMISSIONS.EXPENSES_APPROVE, label: 'Approve expenses' },
      { id: PERMISSIONS.BUDGETS_MANAGE, label: 'Manage budgets' },
    ],
  },
  {
    name: 'Team',
    key: 'team',
    permissions: [
      { id: PERMISSIONS.TEAM_VIEW, label: 'View team members' },
      { id: PERMISSIONS.TEAM_INVITE, label: 'Invite members' },
      { id: PERMISSIONS.TEAM_EDIT, label: 'Edit members' },
      { id: PERMISSIONS.TEAM_REMOVE, label: 'Remove members' },
      { id: PERMISSIONS.ROLES_MANAGE, label: 'Manage roles' },
    ],
  },
  {
    name: 'Events',
    key: 'events',
    permissions: [
      { id: PERMISSIONS.EVENTS_VIEW, label: 'View events' },
      { id: PERMISSIONS.EVENTS_CREATE, label: 'Create events' },
      { id: PERMISSIONS.EVENTS_EDIT, label: 'Edit events' },
      { id: PERMISSIONS.EVENTS_DELETE, label: 'Delete events' },
    ],
  },
  {
    name: 'Booking',
    key: 'booking',
    permissions: [
      { id: PERMISSIONS.BOOKING_VIEW, label: 'View booking pages & appointments' },
      { id: PERMISSIONS.BOOKING_MANAGE, label: 'Manage booking pages' },
    ],
  },
  {
    name: 'Documents',
    key: 'documents',
    permissions: [
      { id: PERMISSIONS.DOCUMENTS_VIEW, label: 'View documents' },
      { id: PERMISSIONS.DOCUMENTS_CREATE, label: 'Create documents' },
      { id: PERMISSIONS.DOCUMENTS_EDIT, label: 'Edit documents' },
      { id: PERMISSIONS.DOCUMENTS_DELETE, label: 'Delete documents' },
    ],
  },
  {
    name: 'Forms & Proposals',
    key: 'forms',
    permissions: [
      { id: PERMISSIONS.FORMS_VIEW, label: 'View forms' },
      { id: PERMISSIONS.FORMS_MANAGE, label: 'Manage forms' },
      { id: PERMISSIONS.PROPOSALS_VIEW, label: 'View proposals' },
      { id: PERMISSIONS.PROPOSALS_MANAGE, label: 'Manage proposals' },
    ],
  },
  {
    name: 'Contracts',
    key: 'contracts',
    permissions: [
      { id: PERMISSIONS.CONTRACTS_VIEW, label: 'View contracts' },
      { id: PERMISSIONS.CONTRACTS_MANAGE, label: 'Manage contracts' },
    ],
  },
  {
    name: 'Vendors',
    key: 'vendors',
    permissions: [
      { id: PERMISSIONS.VENDORS_VIEW, label: 'View vendors' },
      { id: PERMISSIONS.VENDORS_MANAGE, label: 'Manage vendors' },
    ],
  },
  {
    name: 'Automation',
    key: 'automation',
    permissions: [
      { id: PERMISSIONS.AUTOMATION_VIEW, label: 'View workflows' },
      { id: PERMISSIONS.AUTOMATION_MANAGE, label: 'Manage workflows' },
    ],
  },
  {
    name: 'Reports',
    key: 'reports',
    permissions: [
      { id: PERMISSIONS.REPORTS_VIEW, label: 'View reports' },
      { id: PERMISSIONS.REPORTS_EXPORT, label: 'Export reports' },
      { id: PERMISSIONS.REPORTS_CREATE, label: 'Create custom reports' },
    ],
  },
  {
    name: 'Settings',
    key: 'settings',
    permissions: [
      { id: PERMISSIONS.SETTINGS_VIEW, label: 'View settings' },
      { id: PERMISSIONS.SETTINGS_EDIT, label: 'Edit settings' },
      { id: PERMISSIONS.INTEGRATIONS_MANAGE, label: 'Manage integrations' },
    ],
  },
];

// Get all permission IDs as flat array
export const ALL_PERMISSION_IDS = PERMISSION_GROUPS.flatMap(g =>
  g.permissions.map(p => p.id)
);

// Default permissions for 'member' role without custom role
export const DEFAULT_MEMBER_PERMISSIONS: PermissionId[] = [
  PERMISSIONS.PROJECTS_VIEW,
  PERMISSIONS.TASKS_VIEW,
  PERMISSIONS.TASKS_CREATE,
  PERMISSIONS.TASKS_EDIT,
  PERMISSIONS.CLIENTS_VIEW,
  PERMISSIONS.EVENTS_VIEW,
  PERMISSIONS.DOCUMENTS_VIEW,
  PERMISSIONS.REPORTS_VIEW,
];

// Page to permission mapping
export const PAGE_PERMISSIONS: Record<string, PermissionId | PermissionId[]> = {
  // Projects
  '/dashboard/projects': PERMISSIONS.PROJECTS_VIEW,
  '/dashboard/projects/kanban': PERMISSIONS.PROJECTS_VIEW,
  '/dashboard/projects/pipeline': PERMISSIONS.PROJECTS_VIEW,
  '/dashboard/projects/timeline': PERMISSIONS.PROJECTS_VIEW,
  '/dashboard/projects/tasks': PERMISSIONS.TASKS_VIEW,
  '/dashboard/projects/scope-creep': PERMISSIONS.PROJECTS_VIEW,
  '/dashboard/tasks': PERMISSIONS.TASKS_VIEW,

  // CRM
  '/dashboard/clients': PERMISSIONS.CLIENTS_VIEW,
  '/dashboard/crm/clients': PERMISSIONS.CLIENTS_VIEW,
  '/dashboard/crm/contacts': PERMISSIONS.CRM_VIEW,
  '/dashboard/crm/leads': PERMISSIONS.CRM_VIEW,
  '/dashboard/crm/pipeline': PERMISSIONS.CRM_VIEW,
  '/dashboard/crm/onboarding': PERMISSIONS.CRM_VIEW,

  // Finance
  '/dashboard/finance': PERMISSIONS.FINANCE_VIEW,
  '/dashboard/finance/invoices': PERMISSIONS.FINANCE_VIEW,
  '/dashboard/finance/payments': PERMISSIONS.FINANCE_VIEW,
  '/dashboard/finance/expenses': PERMISSIONS.EXPENSES_VIEW,
  '/dashboard/finance/budgets': PERMISSIONS.BUDGETS_MANAGE,
  '/dashboard/finance/profitability': PERMISSIONS.FINANCE_VIEW,
  '/dashboard/finance/forecast': PERMISSIONS.FINANCE_VIEW,
  '/dashboard/invoices': PERMISSIONS.FINANCE_VIEW,

  // Team
  '/dashboard/team': PERMISSIONS.TEAM_VIEW,
  '/dashboard/team/roles': PERMISSIONS.ROLES_MANAGE,
  '/dashboard/team/payroll': [PERMISSIONS.TEAM_VIEW, PERMISSIONS.FINANCE_VIEW],
  '/dashboard/team/time-tracking': PERMISSIONS.TEAM_VIEW,
  '/dashboard/team/utilization': PERMISSIONS.TEAM_VIEW,

  // Events
  '/dashboard/events': PERMISSIONS.EVENTS_VIEW,
  '/dashboard/events/calendar': PERMISSIONS.EVENTS_VIEW,
  '/dashboard/events/venues': PERMISSIONS.EVENTS_VIEW,
  '/dashboard/events/bookings': PERMISSIONS.EVENTS_VIEW,

  // Booking
  '/dashboard/booking/pages': PERMISSIONS.BOOKING_VIEW,
  '/dashboard/booking/appointments': PERMISSIONS.BOOKING_VIEW,
  '/dashboard/booking/availability': PERMISSIONS.BOOKING_MANAGE,

  // Documents
  '/dashboard/documents': PERMISSIONS.DOCUMENTS_VIEW,
  '/dashboard/documents/shared': PERMISSIONS.DOCUMENTS_VIEW,
  '/dashboard/documents/templates': PERMISSIONS.DOCUMENTS_VIEW,
  '/dashboard/documents/contracts': PERMISSIONS.CONTRACTS_VIEW,

  // Forms & Proposals
  '/dashboard/forms': PERMISSIONS.FORMS_VIEW,
  '/dashboard/proposals': PERMISSIONS.PROPOSALS_VIEW,
  '/dashboard/contracts': PERMISSIONS.CONTRACTS_VIEW,
  '/dashboard/surveys': PERMISSIONS.FORMS_VIEW,

  // Vendors
  '/dashboard/vendors': PERMISSIONS.VENDORS_VIEW,
  '/dashboard/vendors/categories': PERMISSIONS.VENDORS_MANAGE,

  // Automation
  '/dashboard/automation/workflows': PERMISSIONS.AUTOMATION_VIEW,
  '/dashboard/automation/runs': PERMISSIONS.AUTOMATION_VIEW,
  '/dashboard/automation/approvals': PERMISSIONS.AUTOMATION_VIEW,
  '/dashboard/automation/integrations': PERMISSIONS.INTEGRATIONS_MANAGE,

  // Reports
  '/dashboard/reports': PERMISSIONS.REPORTS_VIEW,
  '/dashboard/reports/financial': PERMISSIONS.REPORTS_VIEW,
  '/dashboard/reports/sales': PERMISSIONS.REPORTS_VIEW,
  '/dashboard/reports/team': PERMISSIONS.REPORTS_VIEW,
  '/dashboard/reports/custom': PERMISSIONS.REPORTS_CREATE,

  // Settings
  '/dashboard/settings': PERMISSIONS.SETTINGS_VIEW,
  '/dashboard/settings/billing': PERMISSIONS.SETTINGS_EDIT,
  '/dashboard/settings/api': PERMISSIONS.SETTINGS_EDIT,
  '/dashboard/settings/domains': PERMISSIONS.SETTINGS_EDIT,
  '/dashboard/settings/email': PERMISSIONS.SETTINGS_EDIT,
  '/dashboard/settings/portal': PERMISSIONS.SETTINGS_EDIT,
  '/dashboard/settings/dashboard': PERMISSIONS.SETTINGS_VIEW,
  '/dashboard/settings/docs': PERMISSIONS.SETTINGS_VIEW,

  // Portal
  '/dashboard/portal/clients': PERMISSIONS.CLIENTS_VIEW,
  '/dashboard/portal/approvals': PERMISSIONS.SETTINGS_VIEW,

  // Inbox
  '/dashboard/inbox': PERMISSIONS.SETTINGS_VIEW,
  '/dashboard/inbox/notifications': PERMISSIONS.SETTINGS_VIEW,
  '/dashboard/inbox/email': PERMISSIONS.SETTINGS_VIEW,
};

// Helper functions
export function getPermissionLabel(permissionId: string): string {
  for (const group of PERMISSION_GROUPS) {
    const perm = group.permissions.find(p => p.id === permissionId);
    if (perm) return perm.label;
  }
  return permissionId;
}

export function getPermissionGroup(permissionId: string): string {
  for (const group of PERMISSION_GROUPS) {
    if (group.permissions.some(p => p.id === permissionId)) {
      return group.name;
    }
  }
  return 'Other';
}

export function getPagePermission(pathname: string): PermissionId | PermissionId[] | null {
  // Direct match
  if (PAGE_PERMISSIONS[pathname]) {
    return PAGE_PERMISSIONS[pathname];
  }

  // Check for dynamic routes (e.g., /dashboard/events/[eventId]/...)
  const segments = pathname.split('/');
  for (let i = segments.length; i > 0; i--) {
    const partialPath = segments.slice(0, i).join('/');
    if (PAGE_PERMISSIONS[partialPath]) {
      return PAGE_PERMISSIONS[partialPath];
    }
  }

  return null;
}
