// Import feature TypeScript definitions

export type EntityType = 'contacts' | 'leads' | 'clients';

export type FieldType =
  | 'string'
  | 'email'
  | 'phone'
  | 'url'
  | 'date'
  | 'number'
  | 'currency'
  | 'percentage'
  | 'enum'
  | 'tags';

export interface FieldDefinition {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  aliases: string[]; // For auto-mapping
  enumValues?: string[]; // For enum type fields
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
}

export interface ColumnMapping {
  csvColumn: string;
  dbField: string | null; // null means skip this column
  sampleValues: string[];
}

export interface ParsedFile {
  headers: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
  filename: string;
  fileType: 'csv' | 'xlsx' | 'xls';
}

export interface ValidationError {
  row: number;
  field: string;
  value: unknown;
  message: string;
}

export interface ValidationResult {
  valid: number;
  invalid: number;
  duplicates: number;
  errors: ValidationError[];
}

export interface ImportConfig {
  duplicateHandling: 'skip' | 'update' | 'create_new';
  duplicateKey: string;
  skipInvalidRows: boolean;
  tagImported?: string;
}

export interface ImportRequest {
  entityType: EntityType;
  data: Record<string, unknown>[];
  config: ImportConfig;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: ValidationError[];
}

export interface ValidateRequest {
  entityType: EntityType;
  sample: Record<string, unknown>[];
  duplicateKey: string;
}

export interface ValidateResponse {
  valid: number;
  invalid: number;
  duplicates: number;
  errors: ValidationError[];
}

export type WizardStep =
  | 'upload'
  | 'mapping'
  | 'preview'
  | 'options'
  | 'progress';

export interface ImportWizardState {
  step: WizardStep;
  entityType: EntityType;
  file: File | null;
  parsedData: ParsedFile | null;
  mappings: ColumnMapping[];
  validationResult: ValidationResult | null;
  config: ImportConfig;
  importResult: ImportResult | null;
  isProcessing: boolean;
  error: string | null;
}
