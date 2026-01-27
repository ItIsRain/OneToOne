import { FieldDefinition, FieldType, ValidationError, EntityType } from './types';
import { getFieldDefinitions, getFieldByName } from './field-definitions';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation - flexible pattern that accepts international formats
const PHONE_REGEX = /^[\d\s\-\+\(\)\.]{7,20}$/;

// URL validation regex
const URL_REGEX = /^(https?:\/\/)?[\w.-]+\.[\w.-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?$/i;

// Date validation - common formats
const DATE_FORMATS = [
  /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
  /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY or DD/MM/YYYY
  /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY or DD-MM-YYYY
  /^\d{1,2}\/\d{1,2}\/\d{2,4}$/, // M/D/YY or MM/DD/YYYY
];

export function validateFieldValue(
  value: unknown,
  field: FieldDefinition
): string | null {
  // Convert to string for validation
  const strValue = value === null || value === undefined ? '' : String(value).trim();

  // Check required
  if (field.required && !strValue) {
    return `${field.label} is required`;
  }

  // If empty and not required, skip other validations
  if (!strValue) {
    return null;
  }

  // Type-specific validation
  switch (field.type) {
    case 'email':
      if (!EMAIL_REGEX.test(strValue)) {
        return 'Invalid email format';
      }
      break;

    case 'phone':
      if (!PHONE_REGEX.test(strValue)) {
        return 'Invalid phone format';
      }
      break;

    case 'url':
      if (!URL_REGEX.test(strValue)) {
        return 'Invalid URL format';
      }
      break;

    case 'date':
      if (!DATE_FORMATS.some((regex) => regex.test(strValue))) {
        const parsed = Date.parse(strValue);
        if (isNaN(parsed)) {
          return 'Invalid date format (use YYYY-MM-DD)';
        }
      }
      break;

    case 'number':
      const num = parseFloat(strValue);
      if (isNaN(num)) {
        return 'Must be a number';
      }
      if (field.minValue !== undefined && num < field.minValue) {
        return `Minimum value is ${field.minValue}`;
      }
      if (field.maxValue !== undefined && num > field.maxValue) {
        return `Maximum value is ${field.maxValue}`;
      }
      break;

    case 'currency':
      // Remove currency symbols and commas for validation
      const currencyStr = strValue.replace(/[$€£¥,\s]/g, '');
      const currencyNum = parseFloat(currencyStr);
      if (isNaN(currencyNum)) {
        return 'Invalid currency value';
      }
      break;

    case 'percentage':
      const pctStr = strValue.replace(/%/g, '').trim();
      const pct = parseFloat(pctStr);
      if (isNaN(pct)) {
        return 'Invalid percentage';
      }
      if ((field.minValue !== undefined && pct < field.minValue) ||
          (field.maxValue !== undefined && pct > field.maxValue)) {
        return `Percentage must be between ${field.minValue ?? 0} and ${field.maxValue ?? 100}`;
      }
      break;

    case 'enum':
      if (field.enumValues && field.enumValues.length > 0) {
        const normalizedValue = strValue.toLowerCase();
        const found = field.enumValues.some(
          (ev) => ev.toLowerCase() === normalizedValue
        );
        if (!found) {
          return `Invalid value. Allowed: ${field.enumValues.join(', ')}`;
        }
      }
      break;

    case 'tags':
      // Tags can be comma-separated, no strict validation
      break;

    case 'string':
    default:
      // String validation
      break;
  }

  // Max length check
  if (field.maxLength && strValue.length > field.maxLength) {
    return `Maximum length is ${field.maxLength} characters`;
  }

  return null;
}

export function validateRow(
  row: Record<string, unknown>,
  mappings: { csvColumn: string; dbField: string | null }[],
  entityType: EntityType,
  rowIndex: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  const fieldDefs = getFieldDefinitions(entityType);
  const mappedData: Record<string, unknown> = {};

  // Build mapped data object
  for (const mapping of mappings) {
    if (mapping.dbField) {
      mappedData[mapping.dbField] = row[mapping.csvColumn];
    }
  }

  // Check required fields
  const requiredFields = fieldDefs.filter((f) => f.required);
  for (const reqField of requiredFields) {
    const value = mappedData[reqField.name];
    const strValue = value === null || value === undefined ? '' : String(value).trim();
    if (!strValue) {
      errors.push({
        row: rowIndex,
        field: reqField.name,
        value: value,
        message: `${reqField.label} is required`,
      });
    }
  }

  // Validate each mapped field
  for (const mapping of mappings) {
    if (!mapping.dbField) continue;

    const field = getFieldByName(entityType, mapping.dbField);
    if (!field) continue;

    const value = row[mapping.csvColumn];
    const error = validateFieldValue(value, field);

    if (error) {
      errors.push({
        row: rowIndex,
        field: mapping.dbField,
        value: value,
        message: error,
      });
    }
  }

  return errors;
}

export function validateAllRows(
  rows: Record<string, unknown>[],
  mappings: { csvColumn: string; dbField: string | null }[],
  entityType: EntityType
): { valid: number; invalid: number; errors: ValidationError[] } {
  const allErrors: ValidationError[] = [];
  let validCount = 0;
  let invalidCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowErrors = validateRow(rows[i], mappings, entityType, i + 1);
    if (rowErrors.length > 0) {
      invalidCount++;
      allErrors.push(...rowErrors);
    } else {
      validCount++;
    }
  }

  return {
    valid: validCount,
    invalid: invalidCount,
    errors: allErrors,
  };
}

// Transform raw value to database format
export function transformValue(
  value: unknown,
  fieldType: FieldType
): unknown {
  const strValue = value === null || value === undefined ? '' : String(value).trim();

  if (!strValue) {
    return null;
  }

  switch (fieldType) {
    case 'email':
      return strValue.toLowerCase();

    case 'phone':
      // Normalize phone: keep only digits and leading +
      return strValue.replace(/[^\d+]/g, '');

    case 'url':
      // Add https:// if no protocol
      if (strValue && !strValue.match(/^https?:\/\//i)) {
        return `https://${strValue}`;
      }
      return strValue;

    case 'date':
      // Try to parse and return ISO format
      const parsed = new Date(strValue);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
      return strValue;

    case 'number':
    case 'percentage':
      const numStr = strValue.replace(/[%,\s]/g, '');
      const num = parseFloat(numStr);
      return isNaN(num) ? null : num;

    case 'currency':
      const currStr = strValue.replace(/[$€£¥,\s]/g, '');
      const curr = parseFloat(currStr);
      return isNaN(curr) ? null : curr;

    case 'tags':
      // Split comma-separated tags
      return strValue
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t);

    case 'enum':
      return strValue.toLowerCase();

    case 'string':
    default:
      return strValue;
  }
}

// Transform a full row using mappings
export function transformRow(
  row: Record<string, unknown>,
  mappings: { csvColumn: string; dbField: string | null }[],
  entityType: EntityType
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const mapping of mappings) {
    if (!mapping.dbField) continue;

    const field = getFieldByName(entityType, mapping.dbField);
    if (!field) continue;

    const rawValue = row[mapping.csvColumn];
    result[mapping.dbField] = transformValue(rawValue, field.type);
  }

  return result;
}
