export interface FieldConfig {
  maxTokens: number;
  contextFields: string[];
}

export const fieldConfigs: Record<string, Record<string, FieldConfig>> = {
  events: {
    title: { maxTokens: 100, contextFields: ["event_type", "category", "date", "location"] },
    description: { maxTokens: 500, contextFields: ["title", "event_type", "category", "date", "location", "is_virtual"] },
    notes: { maxTokens: 300, contextFields: ["title", "description", "date"] },
  },
  invoices: {
    title: { maxTokens: 100, contextFields: ["client_id", "currency", "payment_terms"] },
    notes: { maxTokens: 300, contextFields: ["title", "currency", "payment_terms"] },
    terms_and_conditions: { maxTokens: 500, contextFields: ["title", "currency", "payment_terms"] },
  },
  proposals: {
    title: { maxTokens: 100, contextFields: ["clientId", "leadId"] },
  },
  leads: {
    notes: { maxTokens: 300, contextFields: ["name", "company", "source", "status", "estimated_value"] },
    requirements: { maxTokens: 300, contextFields: ["name", "company", "industry", "budget_range"] },
    pain_points: { maxTokens: 300, contextFields: ["name", "company", "industry", "requirements"] },
  },
  clients: {
    notes: { maxTokens: 300, contextFields: ["name", "company", "industry", "source"] },
  },
  tasks: {
    title: { maxTokens: 100, contextFields: ["task_type", "priority", "category"] },
    description: { maxTokens: 500, contextFields: ["title", "task_type", "priority", "category", "due_date"] },
    acceptance_criteria: { maxTokens: 300, contextFields: ["title", "description", "task_type"] },
    internal_notes: { maxTokens: 300, contextFields: ["title", "description", "priority"] },
  },
  contracts: {
    title: { maxTokens: 100, contextFields: ["clientId"] },
  },
  email: {
    subject: { maxTokens: 100, contextFields: ["to", "priority", "category"] },
    message: { maxTokens: 500, contextFields: ["subject", "to", "priority", "category"] },
  },
  forms: {
    title: { maxTokens: 100, contextFields: [] },
    description: { maxTokens: 300, contextFields: ["title"] },
  },
  expenses: {
    description: { maxTokens: 200, contextFields: ["category", "vendor", "amount"] },
    notes: { maxTokens: 300, contextFields: ["description", "category", "vendor", "amount"] },
  },
};
