import { z } from "zod";

// ── Reusable primitives ──────────────────────────────────────────────

const nonNegativeNumber = z.coerce.number().min(0, "Must be zero or positive");

const optionalUuid = z.union([z.string().uuid(), z.literal(""), z.null(), z.undefined()]);

const optionalDate = z.union([z.string().date(), z.literal(""), z.null(), z.undefined()]);

// ── Invoice ──────────────────────────────────────────────────────────

export const createInvoiceSchema = z.object({
  client_id: z.string().uuid("Invalid client ID").nullish(),
  project_id: optionalUuid,
  invoice_number: z.string().max(100).optional(),
  subtotal: nonNegativeNumber.optional(),
  amount: nonNegativeNumber.optional(),
  tax_rate: z.coerce.number().min(0).max(100).optional().default(0),
  discount_type: z.enum(["percentage", "fixed"]).optional().default("fixed"),
  discount_value: z.coerce.number().min(0).optional().default(0),
  currency: z.string().min(3).max(3).optional().default("USD"),
  due_date: optionalDate,
  notes: z.string().max(5000).nullish(),
  status: z.enum(["draft", "sent", "viewed", "paid", "partially_paid", "overdue", "cancelled", "refunded"]).optional().default("draft"),
  items: z
    .array(
      z.object({
        description: z.string().min(1, "Item description is required"),
        quantity: z.coerce.number().min(0).default(1),
        unit_price: nonNegativeNumber,
        discount_type: z.enum(["percentage", "fixed"]).optional().default("fixed"),
        discount_value: z.coerce.number().min(0).optional().default(0),
        tax_rate: z.coerce.number().min(0).max(100).optional().default(0),
      })
    )
    .optional(),
});

// ── Payment ──────────────────────────────────────────────────────────

export const createPaymentSchema = z.object({
  invoice_id: optionalUuid,
  client_id: optionalUuid,
  client_name: z.string().max(255).nullish(),
  amount: nonNegativeNumber,
  currency: z.string().min(3).max(3).optional().default("USD"),
  payment_date: optionalDate,
  payment_method: z.string().max(100).nullish(),
  transaction_id: z.string().max(255).nullish(),
  reference_number: z.string().max(255).nullish(),
  status: z.enum(["pending", "completed", "failed", "refunded"]).optional().default("completed"),
  notes: z.string().max(5000).nullish(),
});

// ── Expense ──────────────────────────────────────────────────────────

export const createExpenseSchema = z.object({
  description: z.string().min(1, "Description is required").max(1000),
  amount: nonNegativeNumber,
  currency: z.string().min(3).max(3).optional().default("USD"),
  expense_date: optionalDate,
  category: z.string().max(255).nullish(),
  project_id: optionalUuid,
  event_id: optionalUuid,
  client_id: optionalUuid,
  vendor_id: optionalUuid,
  receipt_url: z.string().url().nullish().or(z.literal("")),
  status: z.enum(["pending", "approved", "rejected", "reimbursed"]).optional().default("pending"),
  notes: z.string().max(5000).nullish(),
});

// ── Budget ───────────────────────────────────────────────────────────

export const createBudgetSchema = z.object({
  name: z.string().min(1, "Budget name is required").max(255),
  description: z.string().max(2000).nullish(),
  amount: nonNegativeNumber,
  spent: nonNegativeNumber.optional().default(0),
  currency: z.string().min(3).max(3).optional().default("USD"),
  period_type: z.enum(["monthly", "quarterly", "yearly", "custom"]).optional().default("monthly"),
  start_date: z.string().date("Invalid start date"),
  end_date: optionalDate,
  category: z.string().max(255).nullish(),
  project_id: optionalUuid,
  client_id: optionalUuid,
  department: z.string().max(255).nullish(),
  alert_threshold: z.coerce.number().min(0).max(100).optional().default(80),
  status: z.enum(["active", "paused", "completed", "cancelled"]).optional().default("active"),
  notes: z.string().max(5000).nullish(),
  tags: z.any().nullish(),
  rollover_enabled: z.boolean().optional().default(false),
  rollover_amount: nonNegativeNumber.optional().default(0),
  fiscal_year: z.coerce.number().int().min(2000).max(2100).optional(),
  is_recurring: z.boolean().optional().default(false),
  recurrence_interval: z.string().max(50).nullish(),
});

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
