import { EntityType, FieldDefinition } from './types';

// Contact field definitions
export const contactFields: FieldDefinition[] = [
  {
    name: 'first_name',
    label: 'First Name',
    type: 'string',
    required: true,
    aliases: ['first name', 'firstname', 'fname', 'given name', 'given_name', 'forename'],
    maxLength: 100,
  },
  {
    name: 'last_name',
    label: 'Last Name',
    type: 'string',
    required: false,
    aliases: ['last name', 'lastname', 'lname', 'surname', 'family name', 'family_name'],
    maxLength: 100,
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    required: false,
    aliases: ['email', 'email address', 'e-mail', 'mail', 'primary email', 'primary_email'],
  },
  {
    name: 'secondary_email',
    label: 'Secondary Email',
    type: 'email',
    required: false,
    aliases: ['secondary email', 'secondary_email', 'other email', 'alternate email', 'alt email'],
  },
  {
    name: 'phone',
    label: 'Phone',
    type: 'phone',
    required: false,
    aliases: ['phone', 'phone number', 'telephone', 'tel', 'primary phone', 'main phone'],
  },
  {
    name: 'mobile_phone',
    label: 'Mobile Phone',
    type: 'phone',
    required: false,
    aliases: ['mobile', 'mobile phone', 'cell', 'cell phone', 'cellphone', 'mobile_phone'],
  },
  {
    name: 'work_phone',
    label: 'Work Phone',
    type: 'phone',
    required: false,
    aliases: ['work phone', 'work_phone', 'office phone', 'business phone'],
  },
  {
    name: 'job_title',
    label: 'Job Title',
    type: 'string',
    required: false,
    aliases: ['job title', 'title', 'position', 'role', 'job_title', 'designation'],
    maxLength: 150,
  },
  {
    name: 'department',
    label: 'Department',
    type: 'string',
    required: false,
    aliases: ['department', 'dept', 'division', 'team'],
    maxLength: 100,
  },
  {
    name: 'company',
    label: 'Company',
    type: 'string',
    required: false,
    aliases: ['company', 'company name', 'organization', 'org', 'business', 'employer'],
    maxLength: 200,
  },
  {
    name: 'linkedin_url',
    label: 'LinkedIn URL',
    type: 'url',
    required: false,
    aliases: ['linkedin', 'linkedin url', 'linkedin_url', 'linkedin profile'],
  },
  {
    name: 'twitter_handle',
    label: 'Twitter Handle',
    type: 'string',
    required: false,
    aliases: ['twitter', 'twitter handle', 'twitter_handle', 'x handle', '@'],
    maxLength: 50,
  },
  {
    name: 'address',
    label: 'Address',
    type: 'string',
    required: false,
    aliases: ['address', 'street', 'street address', 'address line 1', 'address_line_1'],
    maxLength: 500,
  },
  {
    name: 'city',
    label: 'City',
    type: 'string',
    required: false,
    aliases: ['city', 'town', 'municipality'],
    maxLength: 100,
  },
  {
    name: 'state',
    label: 'State/Province',
    type: 'string',
    required: false,
    aliases: ['state', 'province', 'region', 'state/province'],
    maxLength: 100,
  },
  {
    name: 'postal_code',
    label: 'Postal Code',
    type: 'string',
    required: false,
    aliases: ['postal code', 'zip', 'zip code', 'zipcode', 'postcode', 'postal_code'],
    maxLength: 20,
  },
  {
    name: 'country',
    label: 'Country',
    type: 'string',
    required: false,
    aliases: ['country', 'nation'],
    maxLength: 100,
  },
  {
    name: 'timezone',
    label: 'Timezone',
    type: 'string',
    required: false,
    aliases: ['timezone', 'time zone', 'tz'],
    maxLength: 50,
  },
  {
    name: 'preferred_contact_method',
    label: 'Preferred Contact Method',
    type: 'enum',
    required: false,
    aliases: ['preferred contact', 'contact method', 'preferred_contact_method', 'contact preference'],
    enumValues: ['email', 'phone', 'sms', 'mail'],
  },
  {
    name: 'status',
    label: 'Status',
    type: 'enum',
    required: false,
    aliases: ['status', 'contact status'],
    enumValues: ['active', 'inactive', 'archived'],
  },
  {
    name: 'contact_type',
    label: 'Contact Type',
    type: 'enum',
    required: false,
    aliases: ['contact type', 'type', 'category', 'contact_type'],
    enumValues: ['personal', 'business', 'vendor', 'partner', 'other'],
  },
  {
    name: 'tags',
    label: 'Tags',
    type: 'tags',
    required: false,
    aliases: ['tags', 'labels', 'categories'],
  },
  {
    name: 'source',
    label: 'Source',
    type: 'string',
    required: false,
    aliases: ['source', 'lead source', 'origin', 'acquisition source'],
    maxLength: 100,
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'string',
    required: false,
    aliases: ['notes', 'comments', 'description', 'remarks'],
    maxLength: 5000,
  },
];

// Lead field definitions
export const leadFields: FieldDefinition[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'string',
    required: true,
    aliases: ['name', 'lead name', 'full name', 'fullname', 'contact name'],
    maxLength: 200,
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    required: false,
    aliases: ['email', 'email address', 'e-mail', 'mail'],
  },
  {
    name: 'phone',
    label: 'Phone',
    type: 'phone',
    required: false,
    aliases: ['phone', 'phone number', 'telephone', 'tel', 'mobile', 'cell'],
  },
  {
    name: 'company',
    label: 'Company',
    type: 'string',
    required: false,
    aliases: ['company', 'company name', 'organization', 'org', 'business'],
    maxLength: 200,
  },
  {
    name: 'job_title',
    label: 'Job Title',
    type: 'string',
    required: false,
    aliases: ['job title', 'title', 'position', 'role', 'job_title'],
    maxLength: 150,
  },
  {
    name: 'website',
    label: 'Website',
    type: 'url',
    required: false,
    aliases: ['website', 'web', 'url', 'site', 'homepage'],
  },
  {
    name: 'address',
    label: 'Address',
    type: 'string',
    required: false,
    aliases: ['address', 'street', 'street address'],
    maxLength: 500,
  },
  {
    name: 'city',
    label: 'City',
    type: 'string',
    required: false,
    aliases: ['city', 'town'],
    maxLength: 100,
  },
  {
    name: 'country',
    label: 'Country',
    type: 'string',
    required: false,
    aliases: ['country', 'nation'],
    maxLength: 100,
  },
  {
    name: 'status',
    label: 'Status',
    type: 'enum',
    required: false,
    aliases: ['status', 'lead status', 'stage'],
    enumValues: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
  },
  {
    name: 'estimated_value',
    label: 'Estimated Value',
    type: 'currency',
    required: false,
    aliases: ['estimated value', 'value', 'deal value', 'opportunity value', 'amount'],
  },
  {
    name: 'probability',
    label: 'Probability',
    type: 'percentage',
    required: false,
    aliases: ['probability', 'win probability', 'likelihood', 'chance'],
    minValue: 0,
    maxValue: 100,
  },
  {
    name: 'priority',
    label: 'Priority',
    type: 'enum',
    required: false,
    aliases: ['priority', 'importance', 'urgency'],
    enumValues: ['low', 'medium', 'high', 'urgent'],
  },
  {
    name: 'score',
    label: 'Lead Score',
    type: 'number',
    required: false,
    aliases: ['score', 'lead score', 'rating'],
    minValue: 0,
    maxValue: 100,
  },
  {
    name: 'source',
    label: 'Source',
    type: 'string',
    required: false,
    aliases: ['source', 'lead source', 'origin', 'channel'],
    maxLength: 100,
  },
  {
    name: 'campaign',
    label: 'Campaign',
    type: 'string',
    required: false,
    aliases: ['campaign', 'marketing campaign', 'campaign name'],
    maxLength: 200,
  },
  {
    name: 'industry',
    label: 'Industry',
    type: 'string',
    required: false,
    aliases: ['industry', 'sector', 'vertical'],
    maxLength: 100,
  },
  {
    name: 'company_size',
    label: 'Company Size',
    type: 'string',
    required: false,
    aliases: ['company size', 'employees', 'headcount', 'size'],
    maxLength: 50,
  },
  {
    name: 'next_follow_up',
    label: 'Next Follow-up',
    type: 'date',
    required: false,
    aliases: ['next follow up', 'follow up', 'next_follow_up', 'follow up date', 'callback'],
  },
  {
    name: 'expected_close_date',
    label: 'Expected Close Date',
    type: 'date',
    required: false,
    aliases: ['expected close', 'close date', 'expected_close_date', 'closing date'],
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'string',
    required: false,
    aliases: ['notes', 'comments', 'description', 'remarks'],
    maxLength: 5000,
  },
  {
    name: 'requirements',
    label: 'Requirements',
    type: 'string',
    required: false,
    aliases: ['requirements', 'needs', 'specifications'],
    maxLength: 5000,
  },
  {
    name: 'tags',
    label: 'Tags',
    type: 'tags',
    required: false,
    aliases: ['tags', 'labels'],
  },
];

// Client field definitions
export const clientFields: FieldDefinition[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'string',
    required: true,
    aliases: ['name', 'client name', 'full name', 'company name', 'business name'],
    maxLength: 200,
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    required: false,
    aliases: ['email', 'email address', 'e-mail', 'mail', 'contact email'],
  },
  {
    name: 'phone',
    label: 'Phone',
    type: 'phone',
    required: false,
    aliases: ['phone', 'phone number', 'telephone', 'tel'],
  },
  {
    name: 'company',
    label: 'Company',
    type: 'string',
    required: false,
    aliases: ['company', 'organization', 'org', 'business'],
    maxLength: 200,
  },
  {
    name: 'website',
    label: 'Website',
    type: 'url',
    required: false,
    aliases: ['website', 'web', 'url', 'site'],
  },
  {
    name: 'address',
    label: 'Address',
    type: 'string',
    required: false,
    aliases: ['address', 'street', 'street address', 'location'],
    maxLength: 500,
  },
  {
    name: 'city',
    label: 'City',
    type: 'string',
    required: false,
    aliases: ['city', 'town'],
    maxLength: 100,
  },
  {
    name: 'country',
    label: 'Country',
    type: 'string',
    required: false,
    aliases: ['country', 'nation'],
    maxLength: 100,
  },
  {
    name: 'industry',
    label: 'Industry',
    type: 'string',
    required: false,
    aliases: ['industry', 'sector', 'vertical'],
    maxLength: 100,
  },
  {
    name: 'source',
    label: 'Source',
    type: 'string',
    required: false,
    aliases: ['source', 'acquisition source', 'origin'],
    maxLength: 100,
  },
  {
    name: 'status',
    label: 'Status',
    type: 'enum',
    required: false,
    aliases: ['status', 'client status'],
    enumValues: ['active', 'inactive', 'churned', 'prospect'],
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'string',
    required: false,
    aliases: ['notes', 'comments', 'description'],
    maxLength: 5000,
  },
  {
    name: 'tags',
    label: 'Tags',
    type: 'tags',
    required: false,
    aliases: ['tags', 'labels'],
  },
];

// Get field definitions by entity type
export function getFieldDefinitions(entityType: EntityType): FieldDefinition[] {
  switch (entityType) {
    case 'contacts':
      return contactFields;
    case 'leads':
      return leadFields;
    case 'clients':
      return clientFields;
    default:
      return [];
  }
}

// Get required fields for entity type
export function getRequiredFields(entityType: EntityType): FieldDefinition[] {
  return getFieldDefinitions(entityType).filter((f) => f.required);
}

// Get field by name
export function getFieldByName(
  entityType: EntityType,
  fieldName: string
): FieldDefinition | undefined {
  return getFieldDefinitions(entityType).find((f) => f.name === fieldName);
}

// Get default duplicate key for entity type
export function getDefaultDuplicateKey(entityType: EntityType): string {
  return entityType === 'contacts' ? 'email' : 'name';
}
