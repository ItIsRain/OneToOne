import { z } from "zod";

// ── Reusable primitives ──────────────────────────────────────────────

// Basic number coercion without refinements (for schemas that need .partial())
const numberCoerce = z.coerce.number();
const intCoerce = z.coerce.number().int();
const nonNegInt = z.coerce.number().int().min(0);
const nonNegNum = z.coerce.number().min(0);

// Safe number coercion that rejects NaN and Infinity (use for create schemas, not partial-able base)
const safeNumber = z.coerce.number().refine(
  (val) => !isNaN(val) && isFinite(val),
  { message: "Must be a valid number" }
);

// Safe integer coercion
const safeInt = safeNumber.refine(
  (val) => Number.isInteger(val),
  { message: "Must be an integer" }
);

const nonNegativeInt = safeInt.refine(
  (val) => val >= 0,
  { message: "Must be a non-negative integer" }
);

const optionalUuid = z.union([z.string().uuid(), z.literal(""), z.null(), z.undefined()]);

const optionalDate = z.union([z.string().date(), z.literal(""), z.null(), z.undefined()]);

// ISO 4217 currency codes (common currencies + major world currencies)
const VALID_CURRENCY_CODES = [
  // Major currencies
  "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD", "CNY", "HKD",
  // Middle East
  "AED", "SAR", "QAR", "KWD", "BHD", "OMR", "JOD", "EGP", "ILS", "TRY",
  // Asia-Pacific
  "INR", "PKR", "BDT", "SGD", "MYR", "THB", "IDR", "PHP", "VND", "KRW", "TWD",
  // Europe
  "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "RON", "BGN", "RUB", "UAH",
  // Americas
  "MXN", "BRL", "ARS", "CLP", "COP", "PEN",
  // Africa
  "ZAR", "NGN", "KES", "GHS", "MAD",
  // Others
  "XOF", "XAF", "XCD",
] as const;

const currencyCode = z.string().refine(
  (val) => VALID_CURRENCY_CODES.includes(val.toUpperCase() as typeof VALID_CURRENCY_CODES[number]),
  { message: "Invalid currency code. Use ISO 4217 format (e.g., USD, EUR, GBP)" }
).transform((val) => val.toUpperCase());

// ── Invoice ──────────────────────────────────────────────────────────

// Base schema without refinements (used for .partial())
const invoiceBaseSchema = z.object({
  client_id: z.string().uuid("Invalid client ID").nullish(),
  project_id: optionalUuid,
  invoice_number: z.string().max(100).optional(),
  subtotal: nonNegNum.optional(),
  amount: nonNegNum.optional(),
  tax_rate: z.coerce.number().min(0).max(100).optional().default(0),
  discount_type: z.enum(["percentage", "fixed"]).optional().default("fixed"),
  discount_value: nonNegNum.optional().default(0),
  currency: currencyCode.optional().default("USD"),
  due_date: optionalDate,
  payment_terms: z.enum(["due_on_receipt", "net_7", "net_15", "net_30", "net_45", "net_60", "custom"]).optional().default("net_30"),
  notes: z.string().max(5000).nullish(),
  status: z.enum(["draft", "sent", "viewed", "paid", "partially_paid", "overdue", "cancelled", "refunded"]).optional().default("draft"),
  items: z
    .array(
      z.object({
        description: z.string().min(1, "Item description is required"),
        quantity: nonNegNum.default(1),
        unit_price: nonNegNum,
        discount_type: z.enum(["percentage", "fixed"]).optional().default("fixed"),
        discount_value: nonNegNum.max(100).optional().default(0),
        tax_rate: z.coerce.number().min(0).max(100).optional().default(0),
      })
    )
    .optional(),
});

// Invoice validation refinement (for create operations)
const invoiceRefinement = (data: z.infer<typeof invoiceBaseSchema>, ctx: z.RefinementCtx) => {
  // Validate that percentage discount doesn't exceed 100%
  if (data.discount_type === "percentage" && (data.discount_value ?? 0) > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Percentage discount cannot exceed 100%",
      path: ["discount_value"],
    });
  }

  // Calculate estimated total to ensure it won't be negative
  const subtotal = data.subtotal ?? data.amount ?? 0;
  if (subtotal > 0) {
    const taxRate = data.tax_rate ?? 0;
    const taxAmount = subtotal * (taxRate / 100);
    const discountValue = data.discount_value ?? 0;
    const discountAmount = data.discount_type === "percentage"
      ? subtotal * (discountValue / 100)
      : discountValue;

    const total = subtotal + taxAmount - discountAmount;
    if (total < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Discount amount cannot exceed subtotal plus tax",
        path: ["discount_value"],
      });
    }
  }
};

export const createInvoiceSchema = invoiceBaseSchema.superRefine(invoiceRefinement);

// ── Payment ──────────────────────────────────────────────────────────

// Base schema for payments (used for .partial())
const paymentBaseSchema = z.object({
  invoice_id: optionalUuid,
  client_id: optionalUuid,
  client_name: z.string().max(255).nullish(),
  amount: nonNegNum,
  currency: currencyCode.optional().default("USD"),
  payment_date: optionalDate,
  payment_method: z.enum(["cash", "bank_transfer", "credit_card", "debit_card", "check", "paypal", "stripe", "other"]).nullish(),
  transaction_id: z.string().max(255).nullish(),
  reference_number: z.string().max(255).nullish(),
  status: z.enum(["pending", "completed", "failed", "refunded", "cancelled"]).optional().default("completed"),
  notes: z.string().max(5000).nullish(),
});

export const createPaymentSchema = paymentBaseSchema;

// ── Expense ──────────────────────────────────────────────────────────

// Base schema for expenses (used for .partial())
const expenseBaseSchema = z.object({
  description: z.string().min(1, "Description is required").max(1000),
  amount: nonNegNum,
  currency: currencyCode.optional().default("USD"),
  expense_date: optionalDate,
  category: z.enum(["travel", "supplies", "equipment", "software", "marketing", "meals", "utilities", "rent", "salaries", "contractors", "insurance", "taxes", "entertainment", "professional_services", "other"]).nullish(),
  project_id: optionalUuid,
  event_id: optionalUuid,
  client_id: optionalUuid,
  vendor_id: optionalUuid,
  vendor_name: z.string().max(255).nullish(),
  payment_method: z.enum(["cash", "bank_transfer", "credit_card", "debit_card", "check", "paypal", "company_card", "petty_cash", "other"]).nullish(),
  receipt_url: z.union([z.string().url(), z.literal(""), z.null(), z.undefined()]),
  receipt_number: z.string().max(100).nullish(),
  is_reimbursable: z.boolean().optional(),
  is_billable: z.boolean().optional(),
  tax_deductible: z.boolean().optional(),
  tax_category: z.string().max(100).nullish(),
  status: z.enum(["pending", "approved", "rejected", "reimbursed"]).optional().default("pending"),
  notes: z.string().max(5000).nullish(),
  tags: z.any().nullish(),
});

export const createExpenseSchema = expenseBaseSchema;

// ── Budget ───────────────────────────────────────────────────────────

// Base schema for budgets (used for .partial())
const budgetBaseSchema = z.object({
  name: z.string().min(1, "Budget name is required").max(255),
  description: z.string().max(2000).nullish(),
  amount: nonNegNum,
  spent: nonNegNum.optional().default(0),
  currency: currencyCode.optional().default("USD"),
  period_type: z.enum(["monthly", "quarterly", "yearly", "project", "custom"]).optional().default("monthly"),
  start_date: z.string().date("Invalid start date"),
  end_date: optionalDate,
  category: z.enum(["marketing", "operations", "payroll", "travel", "equipment", "software", "contractors", "events", "general", "other"]).nullish(),
  project_id: optionalUuid,
  client_id: optionalUuid,
  department: z.string().max(255).nullish(),
  alert_threshold: z.coerce.number().min(0).max(100).optional().default(80),
  status: z.enum(["draft", "active", "paused", "completed", "exceeded"]).optional().default("active"),
  notes: z.string().max(5000).nullish(),
  tags: z.any().nullish(),
  rollover_enabled: z.boolean().optional().default(false),
  rollover_amount: nonNegNum.optional().default(0),
  fiscal_year: z.coerce.number().int().min(2000).max(2100).optional(),
  is_recurring: z.boolean().optional().default(false),
  recurrence_interval: z.enum(["monthly", "quarterly", "yearly"]).nullish(),
});

export const createBudgetSchema = budgetBaseSchema;

// ── Registration ─────────────────────────────────────────────────────

export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().max(20).nullish(),
  useCase: z.string().min(1, "Use case is required").max(100),
  subdomain: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(63, "Subdomain must be at most 63 characters")
    .regex(
      /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/,
      "Subdomain must start and end with a letter or number, and contain only lowercase letters, numbers, and hyphens"
    ),
  plan: z.enum(["free", "starter", "professional", "business"]).optional().default("free"),
});

// ── More reusable primitives ─────────────────────────────────────────

const optionalEmail = z.union([z.string().email("Invalid email address"), z.literal(""), z.null(), z.undefined()]);

const optionalUrl = z.union([z.string().url("Invalid URL"), z.literal(""), z.null(), z.undefined()]);

const optionalPhone = z.union([
  z.string().min(7, "Phone number too short").max(20, "Phone number too long").regex(/^[+\d\s\-().]+$/, "Invalid phone number format"),
  z.literal(""), z.null(), z.undefined(),
]);

const optionalDatetime = z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/, "Invalid datetime"), z.literal(""), z.null(), z.undefined()]);

// ── Event ───────────────────────────────────────────────────────────

export const createEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(5000).nullish(),
  date: z.string().min(1, "Event date is required"),
  end_date_value: optionalDatetime,
  start_time: z.string().max(10).nullish(),
  end_time: z.string().max(10).nullish(),
  status: z.enum(["upcoming", "in_progress", "completed", "cancelled"]).optional().default("upcoming"),
  event_type: z.enum(["general", "meeting", "conference", "workshop", "webinar", "hackathon", "game_jam", "keynote", "panel", "fireside_chat", "product_launch", "demo_day", "design_sprint", "awards", "networking", "training", "team_building", "client_meeting", "deadline", "milestone", "meetup"]).optional().default("general"),
  category: z.string().max(100).optional().default("General"),
  icon: z.string().max(10).optional(),
  color: z.string().max(20).nullish(),
  cover_image: optionalUrl,
  is_virtual: z.boolean().optional().default(false),
  virtual_platform: z.string().max(100).nullish(),
  virtual_link: optionalUrl,
  location: z.string().max(500).nullish(),
  max_attendees: z.coerce.number().int().min(1, "Max attendees must be at least 1").nullish(),
  is_public: z.boolean().optional().default(false),
  is_published: z.boolean().optional().default(false),
  registration_required: z.boolean().optional().default(false),
  registration_deadline: optionalDatetime,
  ticket_price: nonNegNum.nullish(),
  currency: currencyCode.optional().default("USD"),
  is_free: z.boolean().optional(),
  tags: z.array(z.string().max(100)).max(50).optional().default([]),
  notes: z.string().max(5000).nullish(),
  requirements: z.any().nullish(),
  client_id: optionalUuid,
  venue_id: optionalUuid,
  assigned_to: optionalUuid,
  contact_name: z.string().max(255).nullish(),
  contact_email: optionalEmail,
  contact_phone: optionalPhone,
  reminder_minutes: z.array(z.number().int().min(0)).optional(),
});

export const updateEventSchema = createEventSchema.partial().extend({
  slug: z.string().max(255).nullish(),
  address: z.string().max(500).nullish(),
  city: z.string().max(100).nullish(),
  agenda: z.any().nullish(),
  sponsors: z.any().nullish(),
  speakers: z.any().nullish(),
  custom_fields: z.any().nullish(),
  judging_enabled: z.boolean().optional(),
  judging_criteria: z.any().nullish(),
  judging_start: optionalDatetime,
  judging_end: optionalDatetime,
  teams_enabled: z.boolean().optional(),
  max_team_size: z.coerce.number().int().min(1).nullish(),
  min_team_size: z.coerce.number().int().min(1).nullish(),
});

// ── Event Attendee ──────────────────────────────────────────────────

export const createAttendeeSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  name: z.string().min(1, "Name is required").max(255),
  phone: optionalPhone,
  company: z.string().max(255).nullish(),
  job_title: z.string().max(255).nullish(),
  skills: z.array(z.string().max(100)).optional().default([]),
  bio: z.string().max(2000).nullish(),
  status: z.enum(["pending", "confirmed", "declined", "maybe", "attended", "no_show"]).optional().default("confirmed"),
});

export const updateAttendeeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: optionalPhone,
  company: z.string().max(255).nullish(),
  job_title: z.string().max(255).nullish(),
  skills: z.array(z.string().max(100)).optional(),
  bio: z.string().max(2000).nullish(),
  status: z.enum(["pending", "confirmed", "declined", "maybe", "attended", "no_show"]).optional(),
  looking_for_team: z.boolean().optional(),
});

// ── Event Judge ─────────────────────────────────────────────────────

export const createJudgeSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  name: z.string().max(255).nullish(),
});

// ── Event Submission (admin update) ─────────────────────────────────

export const updateSubmissionSchema = z.object({
  status: z.enum(["draft", "submitted", "under_review", "accepted", "rejected", "winner"]).optional(),
  winner_place: z.coerce.number().int().min(1).nullish(),
  winner_prize: z.string().max(500).nullish(),
  judge_notes: z.string().max(5000).nullish(),
  score: z.coerce.number().min(0).max(100).nullish(),
});

// ── Event Public Registration ───────────────────────────────────────

export const publicRegistrationSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email address").max(255),
  phone: optionalPhone,
  company: z.string().max(255).nullish(),
  job_title: z.string().max(255).nullish(),
});

// ── Event Public Auth ───────────────────────────────────────────────

export const eventAuthSchema = z.object({
  action: z.enum(["register", "login"]),
  email: z.string().email("Invalid email address").max(255),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .refine((val) => /[A-Z]/.test(val), "Password must contain at least one uppercase letter")
    .refine((val) => /[a-z]/.test(val), "Password must contain at least one lowercase letter")
    .refine((val) => /[0-9]/.test(val), "Password must contain at least one number")
    .refine((val) => /[^A-Za-z0-9]/.test(val), "Password must contain at least one special character"),
  name: z.string().min(1).max(255).optional(),
  phone: optionalPhone,
  company: z.string().max(255).nullish(),
  skills: z.array(z.string().max(100)).optional(),
  bio: z.string().max(2000).nullish(),
});

// ── Contact ─────────────────────────────────────────────────────────

export const createContactSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  email: optionalEmail,
  secondary_email: optionalEmail,
  phone: optionalPhone,
  mobile_phone: optionalPhone,
  work_phone: optionalPhone,
  job_title: z.string().max(255).nullish(),
  department: z.string().max(255).nullish(),
  company: z.string().max(255).nullish(),
  linkedin_url: optionalUrl,
  twitter_handle: z.string().max(100).nullish(),
  client_id: optionalUuid,
  lead_id: optionalUuid,
  is_primary_contact: z.boolean().optional(),
  reports_to: optionalUuid,
  address: z.string().max(500).nullish(),
  city: z.string().max(100).nullish(),
  state: z.string().max(100).nullish(),
  postal_code: z.string().max(20).nullish(),
  country: z.string().max(100).nullish(),
  timezone: z.string().max(100).nullish(),
  preferred_contact_method: z.enum(["email", "phone", "whatsapp", "linkedin", "sms"]).nullish(),
  do_not_contact: z.boolean().optional(),
  email_opt_in: z.boolean().optional(),
  communication_notes: z.string().max(2000).nullish(),
  status: z.enum(["active", "inactive", "do_not_contact"]).optional().default("active"),
  contact_type: z.enum(["client_contact", "lead_contact", "vendor", "partner", "influencer", "media", "other"]).optional().default("other"),
  tags: z.any().nullish(),
  source: z.string().max(100).nullish(),
  notes: z.string().max(5000).nullish(),
  avatar_url: optionalUrl,
  assigned_to: optionalUuid,
  last_contacted_at: optionalDatetime,
  next_follow_up: optionalDatetime,
  contact_frequency: z.string().max(50).nullish(),
  birthday: optionalDate,
  anniversary: optionalDate,
  personal_notes: z.string().max(2000).nullish(),
});

export const updateContactSchema = createContactSchema.partial();

// ── Client ──────────────────────────────────────────────────────────

export const createClientSchema = z.object({
  name: z.string().min(1, "Client name is required").max(255),
  company: z.string().max(255).nullish(),
  email: optionalEmail,
  phone: optionalPhone,
  website: optionalUrl,
  address: z.string().max(500).nullish(),
  city: z.string().max(100).nullish(),
  state: z.string().max(100).nullish(),
  postal_code: z.string().max(20).nullish(),
  country: z.string().max(100).nullish(),
  status: z.enum(["active", "inactive", "archived"]).optional().default("active"),
  industry: z.string().max(100).nullish(),
  source: z.string().max(100).nullish(),
  notes: z.string().max(5000).nullish(),
  tags: z.any().nullish(),
  tax_id: z.string().max(100).nullish(),
  payment_terms: z.string().max(100).nullish(),
  avatar_url: optionalUrl,
  assigned_to: optionalUuid,
});

export const updateClientSchema = createClientSchema.partial();

// ── Lead ────────────────────────────────────────────────────────────

export const createLeadSchema = z.object({
  name: z.string().min(1, "Lead name is required").max(255),
  company: z.string().max(255).nullish(),
  email: optionalEmail,
  phone: optionalPhone,
  website: optionalUrl,
  status: z.enum(["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]).optional().default("new"),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional().default("medium"),
  source: z.string().max(100).nullish(),
  estimated_value: nonNegNum.nullish(),
  probability: z.coerce.number().min(0).max(100).nullish(),
  score: z.coerce.number().int().min(0).max(100).nullish(),
  industry: z.string().max(100).nullish(),
  company_size: z.string().max(50).nullish(),
  job_title: z.string().max(255).nullish(),
  address: z.string().max(500).nullish(),
  city: z.string().max(100).nullish(),
  state: z.string().max(100).nullish(),
  country: z.string().max(100).nullish(),
  notes: z.string().max(5000).nullish(),
  tags: z.any().nullish(),
  next_follow_up: optionalDatetime,
  last_contacted: optionalDatetime,
  expected_close_date: optionalDate,
  assigned_to: optionalUuid,
  avatar_url: optionalUrl,
  currency: currencyCode.optional().default("USD"),
  budget_range: z.string().max(100).nullish(),
  campaign: z.string().max(255).nullish(),
  referral_source: z.string().max(255).nullish(),
});

export const updateLeadSchema = createLeadSchema.partial().extend({
  actual_close_date: optionalDate,
  conversion_date: optionalDatetime,
  loss_reason: z.string().max(500).nullish(),
});

// ── Project ─────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(255),
  description: z.string().max(5000).nullish(),
  project_code: z.string().max(50).nullish(),
  project_type: z.string().max(100).nullish(),
  status: z.enum(["draft", "planning", "in_progress", "on_hold", "review", "completed", "cancelled", "archived"]).optional().default("draft"),
  priority: z.enum(["low", "medium", "high", "critical"]).optional().default("medium"),
  start_date: optionalDate,
  end_date: optionalDate,
  deadline: optionalDate,
  budget: nonNegNum.nullish(),
  currency: currencyCode.optional().default("USD"),
  billing_type: z.enum(["fixed_price", "hourly", "retainer", "milestone_based", "time_and_materials"]).nullish(),
  hourly_rate: nonNegNum.nullish(),
  estimated_hours: nonNegNum.nullish(),
  estimated_cost: nonNegNum.nullish(),
  client_id: optionalUuid,
  assigned_to: optionalUuid,
  color: z.string().max(20).nullish(),
  tags: z.any().nullish(),
  notes: z.string().max(5000).nullish(),
  repository_url: optionalUrl,
  staging_url: optionalUrl,
  production_url: optionalUrl,
  figma_url: optionalUrl,
  drive_folder_url: optionalUrl,
});

export const updateProjectSchema = createProjectSchema.partial();

// ── Task ────────────────────────────────────────────────────────────

// Base schema without refinements (used for .partial())
const taskBaseSchema = z.object({
  title: z.string().min(1, "Task title is required").max(500),
  description: z.string().max(5000).nullish(),
  status: z.enum(["backlog", "todo", "pending", "in_progress", "in_review", "blocked", "completed", "cancelled"]).optional().default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent", "critical"]).optional().default("medium"),
  project_id: optionalUuid,
  assigned_to: optionalUuid,
  kanban_board_id: optionalUuid,
  swimlane: z.string().max(100).nullish(),
  start_date: optionalDate,
  due_date: optionalDate,
  estimated_hours: nonNegNum.nullish(),
  actual_hours: nonNegNum.nullish(),
  tags: z.any().nullish(),
  notes: z.string().max(5000).nullish(),
  position: z.coerce.number().int().min(0).optional(),
  recurrence_pattern: z.string().max(100).nullish(),
});

export const createTaskSchema = taskBaseSchema.superRefine((data, ctx) => {
  // Validate due_date >= start_date when both are provided
  if (data.start_date && data.due_date) {
    const startDate = new Date(data.start_date);
    const dueDate = new Date(data.due_date);
    if (dueDate < startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Due date cannot be before start date",
        path: ["due_date"],
      });
    }
  }
});

export const updateTaskSchema = taskBaseSchema.partial();

// ── Kanban Board ────────────────────────────────────────────────────

export const createKanbanBoardSchema = z.object({
  name: z.string().min(1, "Board name is required").max(255),
  description: z.string().max(2000).nullish(),
  project_id: optionalUuid,
  columns: z.any().nullish(),
  settings: z.any().nullish(),
});

export const updateKanbanBoardSchema = createKanbanBoardSchema.partial();

// ── Vendor ─────────────────────────────────────────────────────────

export const createVendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required").max(255),
  company: z.string().max(255).nullish(),
  email: optionalEmail,
  phone: optionalPhone,
  category: z.string().max(100).nullish(),
  services: z.any().nullish(),
  hourly_rate: nonNegNum.nullish(),
  rating: z.coerce.number().min(0, "Rating must be at least 0").max(5, "Rating must be at most 5").nullish(),
  status: z.enum(["active", "inactive", "archived"]).optional().default("active"),
  notes: z.string().max(5000).nullish(),
  website: optionalUrl,
  address: z.string().max(500).nullish(),
  city: z.string().max(100).nullish(),
  country: z.string().max(100).nullish(),
  tags: z.any().nullish(),
});

export const updateVendorSchema = createVendorSchema.partial();

// ── Vendor Category ────────────────────────────────────────────────

export const createVendorCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  description: z.string().max(1000).nullish(),
  color: z.string().max(20).nullish(),
});

export const updateVendorCategorySchema = createVendorCategorySchema.partial();

// ── Vendor Event Assignment ────────────────────────────────────────

export const createVendorEventSchema = z.object({
  event_id: z.string().uuid("Invalid event ID"),
  role: z.string().max(100).nullish(),
  agreed_rate: nonNegNum.nullish(),
  status: z.enum(["pending", "confirmed", "declined", "completed"]).optional().default("pending"),
  notes: z.string().max(5000).nullish(),
});

// ── Booking Page ───────────────────────────────────────────────────

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createBookingPageSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(100).regex(slugRegex, "Slug must contain only lowercase letters, numbers, and hyphens"),
  duration_minutes: z.coerce.number().int().min(5, "Duration must be at least 5 minutes").max(480, "Duration must be at most 480 minutes"),
  description: z.string().max(2000).nullish(),
  buffer_before: z.coerce.number().int().min(0).max(120).optional().default(0),
  buffer_after: z.coerce.number().int().min(0).max(120).optional().default(0),
  form_id: optionalUuid,
  assigned_member_id: optionalUuid,
  location_type: z.enum(["video", "phone", "in_person", "custom"]).optional().default("video"),
  location_details: z.string().max(500).nullish(),
  min_notice_hours: nonNegNum.max(720).optional().default(1),
  max_advance_days: z.coerce.number().int().min(1).max(365).optional().default(60),
  color: z.string().max(20).optional().default("#84cc16"),
  is_active: z.boolean().optional().default(true),
});

export const updateBookingPageSchema = createBookingPageSchema.partial();

// ── Appointment ────────────────────────────────────────────────────

const appointmentBaseSchema = z.object({
  booking_page_id: z.string().uuid("Invalid booking page ID"),
  client_name: z.string().min(1, "Client name is required").max(255),
  client_email: z.string().email("Invalid email address").max(255),
  client_phone: optionalPhone,
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  status: z.enum(["confirmed", "cancelled", "completed", "no_show", "rescheduled"]).optional().default("confirmed"),
  form_response_id: optionalUuid,
  lead_id: optionalUuid,
  source: z.string().max(100).nullish(),
  notes: z.string().max(5000).nullish(),
  assigned_member_id: optionalUuid,
  cancellation_reason: z.string().max(1000).nullish(),
});

export const createAppointmentSchema = appointmentBaseSchema.refine((data) => {
  return new Date(data.end_time) > new Date(data.start_time);
}, { message: "End time must be after start time", path: ["end_time"] });

export const updateAppointmentSchema = appointmentBaseSchema.partial().refine((data) => {
  if (data.start_time && data.end_time) {
    return new Date(data.end_time) > new Date(data.start_time);
  }
  return true;
}, { message: "End time must be after start time", path: ["end_time"] });

// ── Availability ───────────────────────────────────────────────────

export const createAvailabilitySchema = z.object({
  member_id: z.string().uuid("Invalid member ID"),
  day_of_week: z.coerce.number().int().min(0, "Day of week must be 0-6").max(6, "Day of week must be 0-6"),
  start_time: z.string().min(1, "Start time is required").regex(/^\d{2}:\d{2}(:\d{2})?$/, "Time must be in HH:MM or HH:MM:SS format"),
  end_time: z.string().min(1, "End time is required").regex(/^\d{2}:\d{2}(:\d{2})?$/, "Time must be in HH:MM or HH:MM:SS format"),
  timezone: z.string().max(100).optional().default("America/New_York"),
  is_available: z.boolean().optional().default(true),
}).refine((data) => data.end_time > data.start_time, {
  message: "End time must be after start time", path: ["end_time"],
});

export const bulkAvailabilitySchema = z.object({
  member_id: z.string().uuid("Invalid member ID").optional(),
  entries: z.array(z.object({
    member_id: z.string().uuid("Invalid member ID").optional(),
    day_of_week: z.coerce.number().int().min(0).max(6),
    start_time: z.string().min(1).regex(/^\d{2}:\d{2}(:\d{2})?$/),
    end_time: z.string().min(1).regex(/^\d{2}:\d{2}(:\d{2})?$/),
    timezone: z.string().max(100).optional(),
    is_available: z.boolean().optional(),
  }).refine((data) => data.end_time > data.start_time, {
    message: "End time must be after start time", path: ["end_time"],
  })).min(1, "At least one entry is required"),
});

// ── Availability Override ──────────────────────────────────────────

export const createAvailabilityOverrideSchema = z.object({
  member_id: z.string().uuid("Invalid member ID"),
  override_date: z.string().date("Invalid date format"),
  is_blocked: z.boolean().optional().default(true),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Time must be in HH:MM or HH:MM:SS format").nullish(),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Time must be in HH:MM or HH:MM:SS format").nullish(),
  reason: z.string().max(500).nullish(),
}).refine((data) => {
  if (data.start_time && data.end_time) {
    return data.end_time > data.start_time;
  }
  return true;
}, { message: "End time must be after start time", path: ["end_time"] });

export const updateAvailabilityOverrideSchema = z.object({
  override_date: z.string().date("Invalid date format").optional(),
  is_blocked: z.boolean().optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullish(),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullish(),
  reason: z.string().max(500).nullish(),
}).refine((data) => {
  if (data.start_time && data.end_time) {
    return data.end_time > data.start_time;
  }
  return true;
}, { message: "End time must be after start time", path: ["end_time"] });

// ── Booking Reminder ───────────────────────────────────────────────

export const createBookingReminderSchema = z.object({
  booking_page_id: z.string().uuid("Invalid booking page ID"),
  type: z.enum(["email", "sms"]),
  minutes_before: z.coerce.number().int().min(0, "Minutes must be non-negative").max(10080, "Cannot exceed 7 days"),
  template_subject: z.string().max(500).nullish(),
  template_body: z.string().max(5000).nullish(),
  is_active: z.boolean().optional().default(true),
});

// ── Public Booking Submit ──────────────────────────────────────────

// ISO 8601 timestamp with explicit timezone (ends with Z or +/-HH:MM)
// This prevents ambiguous timestamp parsing across timezones
const isoTimestampWithTimezone = z.string()
  .min(1)
  .refine((val) => {
    // Must be valid date and have explicit timezone
    const date = new Date(val);
    if (isNaN(date.getTime())) return false;
    // Check for Z suffix or timezone offset like +05:00 or -08:30
    return /Z$|[+-]\d{2}:\d{2}$/.test(val);
  }, "Timestamp must be ISO 8601 format with timezone (e.g., 2026-02-10T14:00:00Z or 2026-02-10T14:00:00+05:00)");

export const publicBookingSubmitSchema = z.object({
  client_name: z.string().min(1, "Client name is required").max(255),
  client_email: z.string().email("Invalid email address").max(255),
  client_phone: optionalPhone,
  start_time: isoTimestampWithTimezone,
  end_time: isoTimestampWithTimezone,
  notes: z.string().max(5000).nullish(),
  form_response_id: optionalUuid,
}).refine((data) => {
  return new Date(data.end_time) > new Date(data.start_time);
}, { message: "End time must be after start time", path: ["end_time"] });

// ── Invoice Update ────────────────────────────────────────────────────

export const updateInvoiceSchema = invoiceBaseSchema.partial().extend({
  title: z.string().max(500).nullish(),
  event_id: optionalUuid,
  tax_amount: nonNegNum.optional(),
  discount_amount: nonNegNum.optional(),
  total: nonNegNum.optional(),
  amount_paid: nonNegNum.optional(),
  issue_date: optionalDate,
  sent_date: optionalDate,
  paid_at: optionalDate,
  payment_terms: z.enum(["due_on_receipt", "net_7", "net_15", "net_30", "net_45", "net_60", "custom"]).nullish(),
  terms_and_conditions: z.string().max(10000).nullish(),
  footer_note: z.string().max(2000).nullish(),
  billing_name: z.string().max(255).nullish(),
  billing_email: z.union([z.string().email(), z.literal(""), z.null(), z.undefined()]),
  billing_address: z.string().max(500).nullish(),
  billing_city: z.string().max(100).nullish(),
  billing_country: z.string().max(100).nullish(),
  po_number: z.string().max(100).nullish(),
  reference_number: z.string().max(255).nullish(),
  tags: z.any().nullish(),
});

// ── Payment Update ────────────────────────────────────────────────────

export const updatePaymentSchema = paymentBaseSchema.partial();

// ── Expense Update ────────────────────────────────────────────────────

export const updateExpenseSchema = expenseBaseSchema.partial().extend({
  vendor_name: z.string().max(255).nullish(),
  payment_method: z.string().max(100).nullish(),
  is_reimbursable: z.boolean().optional(),
  is_billable: z.boolean().optional(),
  reimbursed_at: optionalDate,
  receipt_number: z.string().max(100).nullish(),
  approved_by: optionalUuid,
  approved_at: optionalDate,
  tax_deductible: z.boolean().optional(),
  tax_category: z.string().max(100).nullish(),
  tags: z.any().nullish(),
});

// ── Budget Update ─────────────────────────────────────────────────────

export const updateBudgetSchema = budgetBaseSchema.partial().extend({
  alert_sent: z.boolean().optional(),
});

// ── Team Member (Invite) ──────────────────────────────────────────────

export const createTeamMemberSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().max(100).nullish(),
  email: z.string().email("Invalid email address").max(255),
  phone: optionalPhone,
  job_title: z.string().max(255).nullish(),
  department: z.string().max(255).nullish(),
  employment_type: z.enum(["full-time", "part-time", "contractor", "freelancer", "intern"]).optional().default("full-time"),
  start_date: optionalDate,
  role: z.enum(["owner", "admin", "member"]).optional().default("member"),
  custom_role_id: optionalUuid,
  manager_id: optionalUuid,
  hourly_rate: nonNegNum.optional(),
  skills: z.array(z.string().max(100)).optional().default([]),
  timezone: z.string().max(100).optional().default("UTC"),
  notes: z.string().max(5000).nullish(),
  linkedin_url: optionalUrl,
  tags: z.array(z.string().max(100)).optional().default([]),
});

export const updateTeamMemberSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().max(100).nullish(),
  phone: optionalPhone,
  bio: z.string().max(2000).nullish(),
  avatar_url: optionalUrl,
  country: z.string().max(100).nullish(),
  city: z.string().max(100).nullish(),
  postal_code: z.string().max(20).nullish(),
  job_title: z.string().max(255).nullish(),
  department: z.string().max(255).nullish(),
  skills: z.array(z.string().max(100)).optional(),
  timezone: z.string().max(100).nullish(),
  working_hours: z.any().nullish(),
  emergency_contact_name: z.string().max(255).nullish(),
  emergency_contact_phone: optionalPhone,
  linkedin_url: optionalUrl,
  notes: z.string().max(5000).nullish(),
  tags: z.any().nullish(),
  // Admin-only fields (enforced at route level)
  role: z.enum(["owner", "admin", "member"]).optional(),
  status: z.string().max(50).optional(),
  employment_type: z.enum(["full-time", "part-time", "contractor", "freelancer", "intern"]).optional(),
  hourly_rate: nonNegNum.optional(),
  manager_id: optionalUuid,
  custom_role_id: optionalUuid,
  start_date: optionalDate,
});

// ── Role ──────────────────────────────────────────────────────────────

export const createRoleSchema = z.object({
  name: z.string().min(1, "Role name is required").max(100),
  description: z.string().max(1000).nullish(),
  permissions: z.array(z.string().max(100)).optional().default([]),
  is_default: z.boolean().optional().default(false),
  color: z.string().max(20).optional().default("#6366f1"),
});

export const updateRoleSchema = createRoleSchema.partial();

// ── Payroll Run ───────────────────────────────────────────────────────

export const createPayrollRunSchema = z.object({
  period_start: z.string().date("Invalid start date"),
  period_end: z.string().date("Invalid end date"),
  pay_date: z.string().date("Invalid pay date"),
  name: z.string().max(255).nullish(),
  notes: z.string().max(5000).nullish(),
  employees: z.array(z.object({
    employee_id: z.string().uuid("Invalid employee ID"),
    base_salary: nonNegNum.optional(),
    hourly_rate: nonNegNum.optional(),
    hours_worked: nonNegNum.optional(),
    overtime_hours: nonNegNum.optional(),
    overtime_rate: nonNegNum.optional(),
    bonus: nonNegNum.optional(),
    commission: nonNegNum.optional(),
    allowances: nonNegNum.optional(),
    reimbursements: nonNegNum.optional(),
    tax_federal: nonNegNum.optional(),
    tax_state: nonNegNum.optional(),
    tax_local: nonNegNum.optional(),
    social_security: nonNegNum.optional(),
    medicare: nonNegNum.optional(),
    health_insurance: nonNegNum.optional(),
    dental_insurance: nonNegNum.optional(),
    vision_insurance: nonNegNum.optional(),
    retirement_401k: nonNegNum.optional(),
    other_deductions: nonNegNum.optional(),
    payment_method: z.string().max(50).optional(),
    notes: z.string().max(2000).nullish(),
  })).optional(),
});

export const updatePayrollRunSchema = z.object({
  name: z.string().max(255).optional(),
  period_start: z.string().date().optional(),
  period_end: z.string().date().optional(),
  pay_date: z.string().date().optional(),
  notes: z.string().max(5000).nullish(),
  status: z.enum(["draft", "pending_approval", "approved", "processing", "completed", "cancelled"]).optional(),
  force: z.boolean().optional(),
});

// ── Time Entry ────────────────────────────────────────────────────────

const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;

// Base schema without refinements (used for .partial())
const timeEntryBaseSchema = z.object({
  user_id: optionalUuid,
  project_id: optionalUuid,
  task_id: optionalUuid,
  date: z.string().date("Invalid date"),
  start_time: z.string().regex(timeRegex, "Time must be in HH:MM format").nullish(),
  end_time: z.string().regex(timeRegex, "Time must be in HH:MM format").nullish(),
  duration_minutes: z.coerce.number().int().min(0).optional(),
  description: z.string().max(2000).nullish(),
  is_billable: z.boolean().optional().default(true),
  hourly_rate: nonNegNum.optional(),
  status: z.enum(["draft", "submitted", "approved", "rejected", "invoiced"]).optional().default("draft"),
  break_minutes: z.coerce.number().int().min(0).optional().default(0),
  work_type: z.enum(["regular", "overtime", "holiday", "weekend", "on_call"]).optional().default("regular"),
  location: z.string().max(255).nullish(),
  notes: z.string().max(5000).nullish(),
  tags: z.array(z.string().max(100)).optional().default([]),
});

export const createTimeEntrySchema = timeEntryBaseSchema.superRefine((data, ctx) => {
  // Prevent time entries for future dates
  if (data.date) {
    const entryDate = new Date(data.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    if (entryDate > today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Time entries cannot be logged for future dates",
        path: ["date"],
      });
    }
  }
});

export const updateTimeEntrySchema = timeEntryBaseSchema.partial().extend({
  approved_by: optionalUuid,
  approved_at: optionalDatetime,
  rejection_reason: z.string().max(1000).nullish(),
  invoice_id: optionalUuid,
});

// ── Announcement ─────────────────────────────────────────────────────

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  content: z.string().min(1, "Content is required").max(50000),
  excerpt: z.string().max(500).nullish(),
  category: z.string().max(100).optional().default("general"),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional().default("normal"),
  is_pinned: z.boolean().optional().default(false),
  is_published: z.boolean().optional().default(true),
  publish_at: optionalDatetime,
  expires_at: optionalDatetime,
  target_roles: z.array(z.string().max(100)).optional().default([]),
  target_users: z.array(z.string().uuid()).optional().default([]),
  image: z.string().nullish(),
  attachments: z.array(z.object({
    name: z.string().max(255).optional(),
    file: z.string(),
  })).optional(),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial().extend({
  remove_image: z.boolean().optional(),
  add_reaction: z.string().max(50).optional(),
});

// ── Bookmark ─────────────────────────────────────────────────────────

export const createBookmarkSchema = z.object({
  entity_type: z.string().min(1, "entity_type is required").max(100),
  entity_id: optionalUuid,
  entity_name: z.string().min(1, "entity_name is required").max(500),
  url: z.string().max(2000).nullish(),
  icon: z.string().max(100).nullish(),
  color: z.string().max(20).nullish(),
  folder: z.string().max(255).nullish(),
  sort_order: z.coerce.number().int().min(0).optional().default(0),
  notes: z.string().max(2000).nullish(),
});

export const updateBookmarkSchema = createBookmarkSchema.partial().omit({
  entity_type: true,
  entity_id: true,
});

// ── Goal ─────────────────────────────────────────────────────────────

export const createGoalSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(5000).nullish(),
  target_type: z.string().min(1, "target_type is required").max(100),
  target_value: nonNegNum.nullish(),
  current_value: nonNegNum.optional().default(0),
  unit: z.string().max(50).nullish(),
  auto_track: z.boolean().optional().default(false),
  track_entity: z.string().max(100).nullish(),
  track_filter: z.any().nullish(),
  period_type: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly", "custom"]).optional().default("monthly"),
  start_date: optionalDate,
  end_date: optionalDate,
  status: z.enum(["active", "completed", "paused", "cancelled"]).optional().default("active"),
  category: z.string().max(100).nullish(),
  color: z.string().max(20).optional().default("#3B82F6"),
  icon: z.string().max(100).nullish(),
  owner_id: optionalUuid,
  assigned_to: z.array(z.string().uuid()).optional().default([]),
  milestones: z.any().optional().default([]),
  notes: z.string().max(5000).nullish(),
});

export const updateGoalSchema = createGoalSchema.partial().extend({
  add_update: z.object({
    value: z.coerce.number(),
    note: z.string().max(1000).nullish(),
  }).optional(),
});

// ── Proposal ────────────────────────────────────────────────────────

export const createProposalSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  slug: z.string().max(255).nullish(),
  client_id: optionalUuid,
  project_id: optionalUuid,
  lead_id: optionalUuid,
  template_id: optionalUuid,
  sections: z.any().optional(),
  pricing_items: z.any().optional(),
  currency: currencyCode.optional().default("USD"),
  valid_until: optionalDate,
  notes: z.string().max(10000).nullish(),
});

export const updateProposalSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  slug: z.string().max(255).optional(),
  status: z.enum(["draft", "sent", "viewed", "accepted", "declined", "expired"]).optional(),
  client_id: optionalUuid,
  project_id: optionalUuid,
  lead_id: optionalUuid,
  sections: z.any().optional(),
  pricing_items: z.any().optional(),
  subtotal: nonNegNum.optional(),
  discount_percent: z.coerce.number().min(0).max(100).optional(),
  tax_percent: z.coerce.number().min(0).max(100).optional(),
  total: nonNegNum.optional(),
  currency: currencyCode.optional(),
  valid_until: optionalDate,
  notes: z.string().max(10000).nullish(),
  agency_signature_data: z.string().max(500000).nullish(),
  agency_signature_name: z.string().max(200).nullish(),
});

// ── Contract ─────────────────────────────────────────────────────────

export const createContractSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  client_id: optionalUuid,
  project_id: optionalUuid,
  proposal_id: optionalUuid,
  sections: z.any().optional().default([]),
  type: z.string().max(100).optional().default("service_agreement"),
  start_date: optionalDate,
  end_date: optionalDate,
  value: nonNegNum.optional().default(0),
  currency: currencyCode.optional().default("USD"),
  terms: z.string().max(50000).nullish(),
  payment_terms: z.string().max(5000).nullish(),
  notes: z.string().max(5000).nullish(),
});

export const updateContractSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  slug: z.string().max(255).optional(),
  status: z.enum(["draft", "sent", "viewed", "active", "signed", "declined", "expired", "terminated", "pending_signature"]).optional(),
  client_id: optionalUuid,
  project_id: optionalUuid,
  proposal_id: optionalUuid,
  sections: z.any().optional(),
  contract_type: z.string().max(100).optional(),
  start_date: optionalDate,
  end_date: optionalDate,
  value: nonNegNum.optional(),
  currency: currencyCode.optional(),
  terms_and_conditions: z.string().max(50000).nullish(),
  payment_terms: z.string().max(5000).nullish(),
  internal_notes: z.string().max(5000).nullish(),
  counter_signatory_name: z.string().max(200).nullish(),
});

// ── Activity Log ─────────────────────────────────────────────────────

export const createActivityLogSchema = z.object({
  action: z.string().min(1, "Action is required").max(100),
  entity_type: z.string().min(1, "entity_type is required").max(100),
  entity_id: optionalUuid,
  entity_name: z.string().max(500).nullish(),
  description: z.string().max(2000).nullish(),
  metadata: z.any().optional().default({}),
});

// ── Profile Update ───────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  phone: optionalPhone,
  bio: z.string().max(2000).nullish(),
  avatar_url: optionalUrl,
  country: z.string().max(100).nullish(),
  city: z.string().max(100).nullish(),
  postal_code: z.string().max(20).nullish(),
  tax_id: z.string().max(100).nullish(),
});

// ── Helper to validate and return typed result ───────────────────────

export function validateBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const path = firstIssue.path.length > 0 ? `${firstIssue.path.join(".")}: ` : "";
    return { success: false, error: `${path}${firstIssue.message}` };
  }
  return { success: true, data: result.data };
}
